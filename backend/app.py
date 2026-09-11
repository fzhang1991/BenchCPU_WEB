from __future__ import annotations

import os
import json
import re
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

env_leaderboard_dir = os.environ.get("LEADERBOARD_DIR", "").strip()
if env_leaderboard_dir:
    candidate = Path(env_leaderboard_dir).expanduser()
    if candidate.exists():
        LEADERBOARD_ROOT = candidate.resolve()
    else:
        LEADERBOARD_ROOT = (Path(__file__).resolve().parent / "leaderboard_data").resolve()
        print(f"Warning: LEADERBOARD_DIR '{candidate}' not found, fallback to {LEADERBOARD_ROOT}")
else:
    LEADERBOARD_ROOT = (Path(__file__).resolve().parent / "leaderboard_data").resolve()

BENCHCPU_CSV = "data/zf_all.csv"

CPU_FILE_KEY_COL = "cpu_file_key"

LEGACY_CPU_FILE_KEYS: Dict[str, List[str]] = {
    "Intel Xeon Gold 5120T": ["64"],
    "Kunpeng 920": ["65"],
    "AMD EPYC 7543 32-Core Processor": ["amd"],
}

app = FastAPI(title="BenchCPU Leaderboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_df_cache: Optional[pd.DataFrame] = None
_metrics_cache: List[str] = []
_catalog_cache: Optional[List[Dict[str, Any]]] = None


def _resolve_csv_path(rel_path: str) -> Path:
    return (LEADERBOARD_ROOT / rel_path).resolve()


def _to_rel_data_path(path: Path) -> str:
    try:
        rel = path.resolve().relative_to(LEADERBOARD_ROOT)
        return str(rel).replace("\\", "/")
    except Exception:
        return f"data/{path.name}"


def _normalize_cpu_key(raw: str) -> str:
    s = str(raw).strip().lower()
    s = s.replace(" ", "_")
    s = re.sub(r"[^a-z0-9_]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s


def _build_cpu_file_prefix(cpu_key: str) -> str:
    key = _normalize_cpu_key(cpu_key)
    if not key:
        return ""
    return key if key.startswith("zf_") else f"zf_{key}"


def _cpu_asset_candidates(prefix: str, file_name: str) -> List[Path]:
    data_dir = _resolve_csv_path("data")
    return [
        data_dir / file_name,
        data_dir / "cpu_groups" / prefix / file_name,
    ]


def _find_cpu_asset(prefix: str, suffix: str) -> Optional[Path]:
    file_name = f"{prefix}{suffix}"
    for candidate in _cpu_asset_candidates(prefix, file_name):
        if candidate.exists():
            return candidate
    return None


def _discover_cpu_catalog() -> List[Dict[str, Any]]:
    zf_all_path = _resolve_csv_path(BENCHCPU_CSV)
    if not zf_all_path.exists():
        return []

    df = pd.read_csv(zf_all_path)
    df.columns = [str(c).lstrip("﻿") for c in df.columns]
    if "cpu_name" not in df.columns:
        return []

    rows: List[Dict[str, Any]] = []

    for _, row in df.iterrows():
        cpu_name = str(row.get("cpu_name", "")).strip()
        if not cpu_name:
            continue

        raw_time = row.get("time")
        cpu_time = None
        if raw_time is not None and pd.notna(raw_time):
            try:
                cpu_time = float(raw_time)
            except Exception:
                cpu_time = None

        candidate_keys: List[str] = []
        explicit_key = row.get(CPU_FILE_KEY_COL)
        if explicit_key is not None and pd.notna(explicit_key):
            candidate_keys.append(str(explicit_key))

        candidate_keys.extend(LEGACY_CPU_FILE_KEYS.get(cpu_name, []))
        candidate_keys.append(cpu_name)

        seen = set()
        deduped_keys: List[str] = []
        for key in candidate_keys:
            nk = _normalize_cpu_key(key)
            if nk and nk not in seen:
                seen.add(nk)
                deduped_keys.append(nk)

        detail_rel: Optional[str] = None
        system_rel: Optional[str] = None
        plot_rel: Optional[str] = None

        for key in deduped_keys:
            prefix = _build_cpu_file_prefix(key)
            if not prefix:
                continue

            detail_path = _find_cpu_asset(prefix, ".csv")
            system_path = _find_cpu_asset(prefix, "_system_info.json")

            if detail_rel is None and detail_path is not None:
                detail_rel = _to_rel_data_path(detail_path)
            if system_rel is None and system_path is not None:
                system_rel = _to_rel_data_path(system_path)
            if plot_rel is None:
                for plot_suffix in [
                    ".png",
                    "_workload_distribution.png",
                    "_avg_round_normal.png",
                    "_normal_plot.png",
                ]:
                    candidate = _find_cpu_asset(prefix, plot_suffix)
                    if candidate is not None:
                        plot_rel = _to_rel_data_path(candidate)
                        break

            if detail_rel and system_rel and plot_rel:
                break

        rows.append(
            {
                "cpu": cpu_name,
                "time": cpu_time,
                "file_key": deduped_keys[0] if deduped_keys else None,
                "detail_csv": detail_rel,
                "system_info_json": system_rel,
                "normal_plot_png": plot_rel,
                "has_detail": detail_rel is not None,
                "has_system_info": system_rel is not None,
                "has_normal_plot": plot_rel is not None,
            }
        )

    return rows


def _cpu_catalog_map() -> Dict[str, Dict[str, Any]]:
    return {item["cpu"]: item for item in _discover_cpu_catalog()}


def _load_benchcpu():
    global _df_cache, _metrics_cache

    csv_path = _resolve_csv_path(BENCHCPU_CSV)
    if not csv_path.exists():
        raise HTTPException(status_code=500, detail=f"CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)
    df.columns = [c.lstrip("﻿") for c in df.columns]

    if "cpu_name" not in df.columns:
        raise HTTPException(status_code=500, detail="BenchCPU CSV missing 'cpu_name' column")

    df["model"] = df["cpu_name"].astype(str)

    time_col = "CPUbench time" if "CPUbench time" in df.columns else ("Time" if "Time" in df.columns else None)
    if time_col is None:
        raise HTTPException(status_code=500, detail="BenchCPU CSV missing 'CPUbench time'/'Time' column")
    df["BenchCPU Time"] = pd.to_numeric(df[time_col], errors="coerce")
    df["BenchCPU Time_rank"] = df["BenchCPU Time"].rank(ascending=True, method="dense")

    metrics = ["BenchCPU Time"]
    spec_cols = ["SPECspeed Int", "SPECspeed FP", "SPECrate Int", "SPECrate FP"]
    for col in spec_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            metrics.append(col)

    _df_cache = df
    _metrics_cache = metrics


def _fallback_rank_series(df: pd.DataFrame, metric: str) -> pd.Series:
    if metric not in df.columns:
        return pd.Series([None] * len(df), index=df.index, dtype="object")

    vals = pd.to_numeric(df[metric], errors="coerce")
    ascending = metric == "BenchCPU Time"
    ranks = vals.rank(ascending=ascending, method="dense")
    return ranks


def _format_delta(acc_rank: Any, sort_rank: Any) -> Optional[str]:
    if acc_rank is None or sort_rank is None:
        return None
    try:
        a = int(acc_rank)
        s = int(sort_rank)
    except Exception:
        return None
    d = a - s
    return f"+{d}" if d >= 0 else str(d)


# ── API Endpoints ──────────────────────────────────────────────


@app.get("/api/metrics")
def api_metrics() -> Dict[str, Any]:
    if _df_cache is None:
        _load_benchcpu()
    return {
        "metrics": _metrics_cache,
        "n_models": int(_df_cache.shape[0]),
        "dataset": "BenchCPU",
    }


@app.get("/api/leaderboard")
def api_leaderboard(
    metrics: Optional[str] = Query(default=None, description="comma-separated metric names"),
    sort_by: Optional[str] = Query(default=None, description="metric used for ranking"),
    sort_dir: str = Query(default="asc", pattern="^(asc|desc)$"),
    cpus: Optional[str] = Query(default=None, description="comma-separated CPU names to filter"),
) -> Dict[str, Any]:
    if _df_cache is None:
        _load_benchcpu()

    df = _df_cache

    # Filter by CPU names if provided
    if cpus:
        selected = set(c.strip() for c in cpus.split(",") if c.strip())
        if selected:
            df = df.loc[df["model"].isin(selected)].copy()

    if metrics is None or metrics.strip() == "":
        selected = _metrics_cache[:1] if _metrics_cache else ["BenchCPU Time"]
    else:
        selected = [m.strip() for m in metrics.split(",") if m.strip()]

    if not selected:
        raise HTTPException(status_code=400, detail="No metrics selected")

    invalid = [m for m in selected if m not in _metrics_cache]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown metrics: {invalid}")

    if sort_by is None or sort_by.strip() == "":
        sort_by = selected[0]
    if sort_by not in _metrics_cache:
        raise HTTPException(status_code=400, detail=f"Unknown sort_by: {sort_by}")

    ascending = sort_dir == "asc"

    sort_rank_col = f"{sort_by}_rank"
    first_rank_col = f"{selected[0]}_rank"

    out = df[["model"] + selected].copy()

    info_col = "cpu info" if "cpu info" in df.columns else "cpu_info" if "cpu_info" in df.columns else None
    if info_col is not None:
        out["cpu_info"] = df[info_col]
    else:
        out["cpu_info"] = None

    first_rank_tmp = "__first_rank_tmp"
    sort_rank_tmp = "__sort_rank_tmp"

    out[first_rank_tmp] = (
        df[first_rank_col]
        if first_rank_col in df.columns
        else _fallback_rank_series(df, selected[0])
    )
    out[sort_rank_tmp] = (
        df[sort_rank_col]
        if sort_rank_col in df.columns
        else _fallback_rank_series(df, sort_by)
    )

    out = out.sort_values(by=sort_by, ascending=ascending, na_position="last").reset_index(drop=True)
    out.insert(0, "rank", range(1, len(out) + 1))

    if first_rank_col == sort_rank_col and first_rank_col in df.columns:
        out["delta_vs_first"] = ["+0"] * len(out)
    else:
        out["delta_vs_first"] = [
            _format_delta(a, s)
            for a, s in zip(out[first_rank_tmp].to_list(), out[sort_rank_tmp].to_list())
        ]

    out = out.drop(columns=[first_rank_tmp, sort_rank_tmp], errors="ignore")
    out = out.where(pd.notnull(out), None)

    total = int(out.shape[0])

    return {
        "dataset": "BenchCPU",
        "selected_metrics": selected,
        "sort_by": sort_by,
        "sort_dir": sort_dir,
        "total": total,
        "rows": out.to_dict(orient="records"),
    }


@app.get("/api/cpu-catalog")
def api_cpu_catalog() -> Dict[str, Any]:
    rows = _discover_cpu_catalog()
    return {
        "rows": rows,
        "total": len(rows),
        "file_key_column": CPU_FILE_KEY_COL,
    }


@app.get("/api/cpu-detail")
def api_cpu_detail(cpu: str = Query(..., description="CPU name")) -> Dict[str, Any]:
    catalog = _cpu_catalog_map()
    if cpu not in catalog:
        raise HTTPException(status_code=404, detail=f"No detail data for CPU: {cpu}")
    rel_path = catalog[cpu].get("detail_csv")
    if not rel_path:
        raise HTTPException(status_code=404, detail=f"No detail data for CPU: {cpu}")
    path = _resolve_csv_path(rel_path)
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"CSV not found: {path}")
    df = pd.read_csv(path)

    workload_col = "workload_name" if "workload_name" in df.columns else "Workload" if "Workload" in df.columns else None

    if workload_col is not None:
        workload_series = df[workload_col].astype(str).str.strip()
        df = df[df[workload_col].notna() & ~workload_series.isin(["AVG", "AVG_round"])].copy()

    round_time_cols: List[str] = []
    for c in df.columns:
        name = str(c)
        if name.endswith("_time") or re.fullmatch(r"Round\d+\s+Time\s*\(s\)", name, flags=re.IGNORECASE):
            round_time_cols.append(name)

    base_cols: List[str] = []
    if "benchmark_name" in df.columns:
        base_cols.append("benchmark_name")
    if workload_col is not None:
        base_cols.append(workload_col)

    selected_cols = base_cols + round_time_cols
    if not selected_cols:
        selected_cols = list(df.columns)

    df_clean = df[selected_cols].copy()
    if workload_col and workload_col != "workload_name":
        df_clean = df_clean.rename(columns={workload_col: "workload_name"})

    df_clean = df_clean.where(pd.notnull(df_clean), None)
    return {
        "cpu": cpu,
        "headers": list(df_clean.columns),
        "rows": df_clean.values.tolist(),
    }


@app.get("/api/cpu-system-info")
def api_cpu_system_info(cpu: str = Query(..., description="CPU name")) -> Dict[str, Any]:
    catalog = _cpu_catalog_map()
    if cpu not in catalog:
        raise HTTPException(status_code=404, detail=f"No system info for CPU: {cpu}")
    rel_path = catalog[cpu].get("system_info_json")
    if not rel_path:
        raise HTTPException(status_code=404, detail=f"No system info for CPU: {cpu}")
    path = _resolve_csv_path(rel_path)
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"JSON not found: {path}")

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    return {
        "cpu": cpu,
        "data": data,
    }


@app.get("/api/cpu-normal-plot")
def api_cpu_normal_plot(cpu: str = Query(..., description="CPU name")):
    catalog = _cpu_catalog_map()
    if cpu not in catalog:
        raise HTTPException(status_code=404, detail=f"No normal plot for CPU: {cpu}")
    rel_path = catalog[cpu].get("normal_plot_png")
    if not rel_path:
        raise HTTPException(status_code=404, detail=f"No normal plot for CPU: {cpu}")
    path = _resolve_csv_path(rel_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Plot not found: {path}")
    return FileResponse(
        path=str(path),
        media_type="image/png",
        filename=path.name,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


@app.get("/api/cpu-spec-report")
def api_cpu_spec_report(
    cpu: str = Query(..., description="CPU name"),
    metric: str = Query(..., description="SPEC metric name"),
):
    metric_to_suffix = {
        "SPECspeed Int": "specspeedint",
        "SPECspeed FP": "specspeedfp",
        "SPECrate Int": "specrateint",
        "SPECrate FP": "specratefp",
    }

    if metric not in metric_to_suffix:
        raise HTTPException(status_code=400, detail=f"Unsupported metric: {metric}")

    catalog = _cpu_catalog_map()
    if cpu not in catalog:
        raise HTTPException(status_code=404, detail=f"CPU not found: {cpu}")

    file_key = catalog[cpu].get("file_key")
    prefix = _build_cpu_file_prefix(file_key) if file_key else ""
    if not prefix:
        raise HTTPException(status_code=404, detail=f"No file key for CPU: {cpu}")

    html_path = _find_cpu_asset(prefix, f"_{metric_to_suffix[metric]}.html")
    if html_path is None:
        raise HTTPException(status_code=404, detail=f"SPEC report not found for CPU: {cpu}, metric: {metric}")

    return FileResponse(
        path=str(html_path),
        media_type="text/html; charset=utf-8",
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )
