import os
import json
import pathlib
import threading
from typing import Any, Dict, List, Tuple, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api", tags=["probe-analysis"])

_OVERVIEW_CACHE: Dict[Tuple[str, float], Dict[str, Any]] = {}
_ROWS_CACHE: Dict[str, List[Dict[str, Any]]] = {}
_CACHE_INFO: Dict[str, Any] = {}
_LOCK = threading.Lock()

_DATASET_STATS_CACHE: Dict[Tuple[str, str], Dict[str, Any]] = {}
_STATS_LOCK = threading.Lock()

_QTABLE_CACHE: Dict[Tuple[str, str], Dict[str, Any]] = {}
_QTABLE_SORT_CACHE: Dict[Tuple[str, str, str], List[int]] = {}
_QTABLE_HASH_INDEX: Dict[Tuple[str, str], Dict[str, int]] = {}
_QTABLE_LOCK = threading.Lock()


def _robust_bounds(v: np.ndarray, clip: float) -> Tuple[float, float]:
    v = np.asarray(v, float)
    if v.size == 0:
        return 0.0, 1.0
    if clip and clip > 0:
        lo = float(np.nanpercentile(v, clip))
        hi = float(np.nanpercentile(v, 100 - clip))
    else:
        lo = float(np.nanmin(v))
        hi = float(np.nanmax(v))

    if (not np.isfinite(lo)) or (not np.isfinite(hi)) or abs(hi - lo) < 1e-12:
        lo, hi = float(np.nanmin(v)), float(np.nanmax(v))
    if (not np.isfinite(lo)) or (not np.isfinite(hi)) or abs(hi - lo) < 1e-12:
        lo, hi = 0.0, 1.0
    return lo, hi


def _discover_datasets_metrics_full(meme_dir: pathlib.Path) -> List[str]:
    out: List[str] = []
    for p in sorted(meme_dir.glob("*_metrics_full.csv")):
        name = p.name
        if name.endswith("_metrics_full.csv"):
            out.append(name[: -len("_metrics_full.csv")])
    return out


def _collect_dataset_means(meme_dir: pathlib.Path, ds_names: List[str], needed_cols: List[str]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for ds in ds_names:
        csv_path = meme_dir / f"{ds}_metrics_full.csv"
        if not csv_path.exists():
            continue
        df = pd.read_csv(csv_path, index_col=0)
        if any(c not in df.columns for c in needed_cols):
            continue
        m = df[needed_cols].mean(axis=0, skipna=True)
        row: Dict[str, Any] = {"name": ds}
        for c in needed_cols:
            row[c] = float(m[c])
        rows.append(row)
    return rows


def _resolve_meme_dir(pop: str) -> pathlib.Path:
    curated_dir = os.environ.get("PROBE_CURATED_MEME_DIR", "").strip()
    hf_dir = os.environ.get("PROBE_HF_MEME_DIR", "").strip()
    meme_dir_str = curated_dir if pop == "Curated" else hf_dir
    if not meme_dir_str:
        raise RuntimeError(
            f"Missing env var: {'PROBE_CURATED_MEME_DIR' if pop=='Curated' else 'PROBE_HF_MEME_DIR'}"
        )
    meme_dir = pathlib.Path(meme_dir_str)
    if not meme_dir.exists():
        raise RuntimeError(f"meme_dir not found: {meme_dir}")
    return meme_dir


def _build_payload_from_rows(pop: str, rows: List[Dict[str, Any]], pclip: float) -> Dict[str, Any]:
    props_xyz = ("difficulty", "uniqueness", "risk")
    prop_color = "typicality"
    prop_radius = "surprise"
    prop_shape = "bridge"

    if not rows:
        return {
            "population": pop,
            "props_xyz": list(props_xyz),
            "prop_color": prop_color,
            "prop_radius": prop_radius,
            "datasets": [],
            "meta": {"color_vmin": 0.0, "color_vmax": 1.0, "size_min": 8, "size_max": 22},
        }

    cvals = np.array([r[prop_color] for r in rows], float)
    c_lo, c_hi = _robust_bounds(cvals, pclip)

    size_min = 8
    size_max = 22

    datasets = []
    for r in rows:
        datasets.append(
            {
                "name": r["name"],
                "x": r[props_xyz[0]],
                "y": r[props_xyz[1]],
                "z": r[props_xyz[2]],
                "typicality": r[prop_color],
                "bridge": r[prop_shape],
                "surprise": r[prop_radius],
            }
        )

    return {
        "population": pop,
        "props_xyz": list(props_xyz),
        "prop_color": prop_color,
        "prop_radius": prop_radius,
        "datasets": datasets,
        "meta": {"color_vmin": c_lo, "color_vmax": c_hi, "size_min": size_min, "size_max": size_max},
    }


def preload_probe_overview(populations: Optional[List[str]] = None, pclip: float = 5.0) -> Dict[str, Any]:
    pops = populations or ["Curated", "HF"]
    info: Dict[str, Any] = {"loaded": [], "errors": {}}

    with _LOCK:
        for pop in pops:
            try:
                if pop not in ("Curated", "HF"):
                    continue

                meme_dir = _resolve_meme_dir(pop)

                props_xyz = ("difficulty", "uniqueness", "risk")
                prop_color = "typicality"
                prop_radius = "surprise"
                prop_shape = "bridge"
                needed = list(props_xyz) + [prop_color, prop_shape, prop_radius]

                ds_names = _discover_datasets_metrics_full(meme_dir)
                rows = _collect_dataset_means(meme_dir, ds_names, needed)

                _ROWS_CACHE[pop] = rows
                _CACHE_INFO[pop] = {"meme_dir": str(meme_dir), "n_files": len(ds_names), "n_rows": len(rows)}

                payload = _build_payload_from_rows(pop, rows, float(pclip))
                _OVERVIEW_CACHE[(pop, float(pclip))] = payload

                info["loaded"].append(pop)
            except Exception as e:
                info["errors"][pop] = str(e)

    return info


@router.get("/probe-analysis/overview")
def probe_overview(
    population: str = Query(..., description='Population: "Curated" or "HF"'),
    pclip: float = Query(5.0, ge=0.0, le=49.0),
):
    pop = population.strip()
    if pop not in ("Curated", "HF"):
        raise HTTPException(status_code=400, detail='population must be "Curated" or "HF"')

    key = (pop, float(pclip))

    with _LOCK:
        if key in _OVERVIEW_CACHE:
            return _OVERVIEW_CACHE[key]

    with _LOCK:
        rows = _ROWS_CACHE.get(pop)
        if rows is not None:
            payload = _build_payload_from_rows(pop, rows, float(pclip))
            _OVERVIEW_CACHE[key] = payload
            return payload

    try:
        meme_dir = _resolve_meme_dir(pop)

        props_xyz = ("difficulty", "uniqueness", "risk")
        prop_color = "typicality"
        prop_radius = "surprise"
        prop_shape = "bridge"
        needed = list(props_xyz) + [prop_color, prop_shape, prop_radius]

        ds_names = _discover_datasets_metrics_full(meme_dir)
        rows = _collect_dataset_means(meme_dir, ds_names, needed)

        payload = _build_payload_from_rows(pop, rows, float(pclip))

        with _LOCK:
            _ROWS_CACHE[pop] = rows
            _OVERVIEW_CACHE[key] = payload
            _CACHE_INFO[pop] = {"meme_dir": str(meme_dir), "n_files": len(ds_names), "n_rows": len(rows)}

        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _compute_dataset_stats(meme_dir: pathlib.Path, dataset: str, cols: List[str]) -> Dict[str, Any]:
    csv_path = meme_dir / f"{dataset}_metrics_full.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"dataset metrics file not found: {csv_path}")

    df = pd.read_csv(csv_path, index_col=0)
    missing = [c for c in cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=500, detail=f"CSV missing columns: {missing}")

    stats: Dict[str, Any] = {}
    for c in cols:
        s = pd.to_numeric(df[c], errors="coerce")
        stats[c] = {
            "mean": float(s.mean(skipna=True)),
            "std": float(s.std(skipna=True, ddof=1)),
            "min": float(s.min(skipna=True)),
            "max": float(s.max(skipna=True)),
        }

    return {"dataset": dataset, "n_items": int(df.shape[0]), "stats": stats}


@router.get("/probe-analysis/dataset-stats")
def probe_dataset_stats(
    population: str = Query(..., description='Population: "Curated" or "HF"'),
    dataset: str = Query(..., description="Dataset name, e.g., MATH-500"),
):
    pop = population.strip()
    if pop not in ("Curated", "HF"):
        raise HTTPException(status_code=400, detail='population must be "Curated" or "HF"')
    ds = dataset.strip()
    if not ds:
        raise HTTPException(status_code=400, detail="dataset is required")

    try:
        meme_dir = _resolve_meme_dir(pop)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    key = (pop, ds)
    with _STATS_LOCK:
        if key in _DATASET_STATS_CACHE:
            return _DATASET_STATS_CACHE[key]

    cols = ["difficulty", "uniqueness", "risk", "typicality", "bridge", "surprise"]
    payload = _compute_dataset_stats(meme_dir, ds, cols)
    out = {"population": pop, **payload}

    with _STATS_LOCK:
        _DATASET_STATS_CACHE[key] = out
    return out


def preload_dataset_stats(populations: Optional[List[str]] = None) -> Dict[str, Any]:
    pops = populations or ["Curated", "HF"]
    cols = ["difficulty", "uniqueness", "risk", "typicality", "bridge", "surprise"]
    info: Dict[str, Any] = {"loaded": {}, "errors": {}}

    with _STATS_LOCK:
        for pop in pops:
            try:
                if pop not in ("Curated", "HF"):
                    continue
                meme_dir = _resolve_meme_dir(pop)
                ds_names = _discover_datasets_metrics_full(meme_dir)

                n_ok = 0
                for ds in ds_names:
                    key = (pop, ds)
                    if key in _DATASET_STATS_CACHE:
                        continue
                    payload = _compute_dataset_stats(meme_dir, ds, cols)
                    _DATASET_STATS_CACHE[key] = {"population": pop, **payload}
                    n_ok += 1

                info["loaded"][pop] = {"n_datasets": len(ds_names), "n_cached_new": n_ok}
            except Exception as e:
                info["errors"][pop] = str(e)

    return info


def _resolve_qtable_dir(pop: str) -> pathlib.Path:
    if pop != "Curated":
        raise RuntimeError("Question tables only implemented for Curated (HF: coming soon)")

    qdir = os.environ.get("PROBE_CURATED_QTABLE_DIR", "").strip()
    if not qdir:
        raise RuntimeError("Missing env var: PROBE_CURATED_QTABLE_DIR")
    p = pathlib.Path(qdir)
    if not p.exists():
        raise RuntimeError(f"qtable dir not found: {p}")
    return p


def _discover_qtable_files(qdir: pathlib.Path) -> List[pathlib.Path]:
    return sorted(qdir.glob("*_question_probe_table.json"))


def _safe_preview(text: Any, max_chars: int = 220) -> str:
    s = str(text or "")
    s = " ".join(s.split())
    if len(s) <= max_chars:
        return s
    return s[: max_chars - 1] + "\u2026"


def _precompute_sort_indices(items: List[Dict[str, Any]], prop: str) -> List[int]:
    vals: List[Tuple[float, int]] = []
    nan_idx: List[int] = []
    for i, it in enumerate(items):
        try:
            v = float(it.get("probe_properties", {}).get(prop, float("nan")))
        except Exception:
            v = float("nan")
        if np.isfinite(v):
            vals.append((v, i))
        else:
            nan_idx.append(i)
    vals.sort(key=lambda x: x[0])
    return [i for _, i in vals] + nan_idx


def preload_question_tables(populations: Optional[List[str]] = None) -> Dict[str, Any]:
    pops = populations or ["Curated"]
    info: Dict[str, Any] = {"loaded": {}, "errors": {}}

    with _QTABLE_LOCK:
        for pop in pops:
            try:
                if pop != "Curated":
                    continue

                qdir = _resolve_qtable_dir(pop)
                files = _discover_qtable_files(qdir)

                n_ds = 0
                for fp in files:
                    with fp.open("r", encoding="utf-8") as f:
                        obj = json.load(f)

                    dataset = str(
                        obj.get("dataset") or obj.get("dataset_key") or fp.name.split("_question_probe_table.json")[0]
                    ).strip()
                    if not dataset:
                        continue

                    items = obj.get("items", [])
                    if not isinstance(items, list):
                        items = []

                    prop_cols = obj.get("probe_property_columns", [])
                    if not isinstance(prop_cols, list) or not prop_cols:
                        prop_cols = ["difficulty", "uniqueness", "risk", "surprise", "typicality", "bridge"]

                    h2i: Dict[str, int] = {}
                    for i, it in enumerate(items):
                        h = str(it.get("question_hash", "")).strip()
                        if h:
                            h2i[h] = i

                    _QTABLE_CACHE[(pop, dataset)] = {
                        "population": pop,
                        "dataset": dataset,
                        "probe_property_columns": prop_cols,
                        "num_questions": int(obj.get("num_questions", len(items))),
                        "num_models_in_metrics": int(obj.get("num_models_in_metrics", 0)),
                        "model_columns_used": obj.get("model_columns_used", []),
                        "items": items,
                    }
                    _QTABLE_HASH_INDEX[(pop, dataset)] = h2i

                    for prop in prop_cols:
                        _QTABLE_SORT_CACHE[(pop, dataset, prop)] = _precompute_sort_indices(items, prop)

                    n_ds += 1

                info["loaded"][pop] = {"n_datasets": n_ds, "n_files": len(files), "qdir": str(qdir)}
            except Exception as e:
                info["errors"][pop] = str(e)

    return info


@router.get("/probe-analysis/questions")
def probe_questions(
    population: str = Query(..., description='Population: "Curated" or "HF"'),
    dataset: str = Query(..., description="Dataset name, e.g., MATH-500"),
    sort_by: str = Query("risk", description="One of probe_property_columns"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    offset: int = Query(0, ge=0),
    limit: int = Query(60, ge=1, le=5000),
):
    pop = population.strip()
    if pop not in ("Curated", "HF"):
        raise HTTPException(status_code=400, detail='population must be "Curated" or "HF"')
    if pop == "HF":
        raise HTTPException(status_code=501, detail="HF question browser is coming soon")

    ds = dataset.strip()
    if not ds:
        raise HTTPException(status_code=400, detail="dataset is required")

    key = (pop, ds)
    with _QTABLE_LOCK:
        table = _QTABLE_CACHE.get(key)

    if table is None:
        try:
            preload_question_tables(populations=[pop])
        except Exception:
            pass
        with _QTABLE_LOCK:
            table = _QTABLE_CACHE.get(key)

    if table is None:
        raise HTTPException(status_code=404, detail=f"Question table not found for {pop}/{ds}. Check PROBE_CURATED_QTABLE_DIR.")

    prop_cols: List[str] = list(table.get("probe_property_columns") or [])
    if sort_by not in prop_cols:
        raise HTTPException(status_code=400, detail=f"sort_by must be one of {prop_cols}")

    items: List[Dict[str, Any]] = table.get("items", [])
    total = len(items)

    with _QTABLE_LOCK:
        idx_sorted = _QTABLE_SORT_CACHE.get((pop, ds, sort_by))
        if idx_sorted is None:
            idx_sorted = _precompute_sort_indices(items, sort_by)
            _QTABLE_SORT_CACHE[(pop, ds, sort_by)] = idx_sorted

    if sort_dir == "desc":
        idx_sorted = list(reversed(idx_sorted))

    start = min(offset, total)
    end = min(offset + limit, total)
    page_idx = idx_sorted[start:end]

    out_items: List[Dict[str, Any]] = []
    for i in page_idx:
        it = items[i]
        qhash = str(it.get("question_hash", ""))
        qtext = it.get("question", "")
        props = it.get("probe_properties", {}) or {}
        out_items.append(
            {
                "question_hash": qhash,
                "question_preview": _safe_preview(qtext, max_chars=240),
                "probe_properties": {
                    k: float(props.get(k, float("nan"))) if props.get(k) is not None else float("nan")
                    for k in prop_cols
                },
            }
        )

    return {
        "population": pop,
        "dataset": ds,
        "probe_property_columns": prop_cols,
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": out_items,
    }


@router.get("/probe-analysis/question-detail")
def probe_question_detail(
    population: str = Query(..., description='Population: "Curated" or "HF"'),
    dataset: str = Query(..., description="Dataset name, e.g., MATH-500"),
    question_hash: str = Query(..., description="question_hash"),
):
    pop = population.strip()
    if pop not in ("Curated", "HF"):
        raise HTTPException(status_code=400, detail='population must be "Curated" or "HF"')
    if pop == "HF":
        raise HTTPException(status_code=501, detail="HF question browser is coming soon")

    ds = dataset.strip()
    qh = question_hash.strip()
    if not ds or not qh:
        raise HTTPException(status_code=400, detail="dataset and question_hash are required")

    key = (pop, ds)
    with _QTABLE_LOCK:
        table = _QTABLE_CACHE.get(key)
        h2i = _QTABLE_HASH_INDEX.get(key)

    if table is None or h2i is None:
        try:
            preload_question_tables(populations=[pop])
        except Exception:
            pass
        with _QTABLE_LOCK:
            table = _QTABLE_CACHE.get(key)
            h2i = _QTABLE_HASH_INDEX.get(key)

    if table is None or h2i is None:
        raise HTTPException(status_code=404, detail=f"Question table not found for {pop}/{ds}. Check PROBE_CURATED_QTABLE_DIR.")

    idx = h2i.get(qh)
    if idx is None:
        raise HTTPException(status_code=404, detail=f"question_hash not found: {qh}")

    items: List[Dict[str, Any]] = table.get("items", [])
    if idx < 0 or idx >= len(items):
        raise HTTPException(status_code=404, detail=f"question_hash index out of range: {qh}")

    it = items[idx]
    prop_cols: List[str] = list(table.get("probe_property_columns") or [])
    props = it.get("probe_properties", {}) or {}

    return {
        "population": pop,
        "dataset": ds,
        "question_hash": qh,
        "question": it.get("question", ""),
        "ground_truth": it.get("Ground Truth", it.get("ground_truth", "")),
        "probe_properties": {
            k: float(props.get(k, float("nan"))) if props.get(k) is not None else float("nan")
            for k in prop_cols
        },
        "correct_models": it.get("correct_models", []) or [],
        "wrong_models": it.get("wrong_models", []) or [],
    }