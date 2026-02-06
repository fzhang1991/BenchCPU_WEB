from __future__ import annotations

import os
from typing import Optional, List, Dict, Any, Tuple

import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# -------------------------
# Dataset -> CSV mapping
# -------------------------
CURATED_DATASET_TO_CSV = {
    "Avg": "data/model_avg_benchmark_scores.csv",
    "MATH-500": "data/MATH-500_benchmark_scores.csv",
    "MMLU-Redux": "data/MMLU-Redux_benchmark_scores.csv",
    "SimpleQA": "data/SimpleQA_benchmark_scores.csv",
}

HF_DATASET_TO_CSV = {
    "Avg": "data_HF/model_avg_benchmark_scores.csv",
    "BBH": "data_HF/BBH_benchmark_scores.csv",
    "GPQA-Diamond": "data_HF/GPQA-Diamond_benchmark_scores.csv",
    "IFEval": "data_HF/IFEval_benchmark_scores.csv",
    "MATH": "data_HF/MATH_benchmark_scores.csv",
    "MMLU-Pro": "data_HF/MMLU-Pro_benchmark_scores.csv",
    "MUSR": "data_HF/MUSR_benchmark_scores.csv",
}

POP_TO_MAP = {"Curated": CURATED_DATASET_TO_CSV, "HF": HF_DATASET_TO_CSV}

# -------------------------
# Vendor lineage
# -------------------------
GEMINI_LINEAGE = ["gemini-2.5-flash", "gemini-2.5-pro"]
QWEN_LINEAGE = ["qwen3-30b-a3b", "qwen3-32b", "qwen3-235b-a22b"]
DEEPSEEK_LINEAGE = ["deepseek-V3", "deepseek-R1"]
OPENAI_LINEAGE = [
    "gpt-4o-2024-11-20",
    "gpt-4.1-nano-2025-04-14",
    "gpt-4.1-mini-2025-04-14",
    "gpt-4.1-2025-04-14",
    "o3-2025-04-16",
    "o3-mini-2025-01-31",
    "gpt-5-nano-2025-08-07",
    "gpt-5-mini-2025-08-07",
    "gpt-5-2025-08-07",
]
CLAUDE_LINEAGE = ["claude-3-5-sonnet-20241022", "claude-sonnet-4-20250514"]
GROK_LINEAGE = ["grok-3", "grok-4-0709"]
GLM_LINEAGE = ["glm-4.5-air", "glm-4.5"]
MINIMAX_LINEAGE = ["MiniMax-Text-01", "MiniMax-M1"]
KIMI_LINEAGE = ["kimi-k2-0711-preview"]
SPARK_LINEAGE = ["spark-X1"]
DOUBAO_LINEAGE = ["doubao-seed-1-6-flash-250715", "doubao-seed-1-6-250615"]

VENDOR_LINEAGE: Dict[str, List[str]] = {
    "OpenAI": OPENAI_LINEAGE,
    "Alibaba": QWEN_LINEAGE,
    "Anthropic": CLAUDE_LINEAGE,
    "Google": GEMINI_LINEAGE,
    "DeepSeek": DEEPSEEK_LINEAGE,
    "xAI": GROK_LINEAGE,
    "Zhipu": GLM_LINEAGE,
    "MiniMax": MINIMAX_LINEAGE,
    "Moonshot": KIMI_LINEAGE,
    "Spark": SPARK_LINEAGE,
    "Ark": DOUBAO_LINEAGE,
}

# -------------------------
# App
# -------------------------
app = FastAPI(title="Leaderboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_df_cache: Dict[Tuple[str, str], pd.DataFrame] = {}
_metrics_cache: Dict[Tuple[str, str], List[str]] = {}


def _parse_mode_and_base_model(model: str) -> Tuple[str, str]:
    s = str(model).strip()
    if s.endswith("(IR)"):
        return "IR", s[:-4].rstrip()
    if s.endswith("(CoT)"):
        return "CoT", s[:-5].rstrip()
    return "Base", s


def _infer_vendor(base_model: str) -> str:
    s = str(base_model)
    for vendor, lineage in VENDOR_LINEAGE.items():
        for token in lineage:
            if token in s:
                return vendor
    return "Other"


def _normalize_population(population: str) -> str:
    p = (population or "").strip()
    if p in ("Curated", "HF"):
        return p
    pl = p.lower()
    if pl == "curated":
        return "Curated"
    if pl == "hf":
        return "HF"
    return "Curated"


def _guess_model_col(df: pd.DataFrame) -> str:
    for c in ["model", "model_name", "odel"]:
        if c in df.columns:
            return c
    for c in df.columns:
        if isinstance(c, str) and c.startswith("Unnamed"):
            return c
    if len(df.columns) > 0:
        return df.columns[0]
    raise RuntimeError("Empty CSV: no columns")


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


def _load_dataset(population: str, dataset: str):
    pop = _normalize_population(population)
    ds_map = POP_TO_MAP.get(pop)
    if ds_map is None:
        raise HTTPException(status_code=400, detail=f"Unknown population: {population}")

    if dataset not in ds_map:
        raise HTTPException(status_code=400, detail=f"Unknown dataset '{dataset}' for population '{pop}'")

    key = (pop, dataset)
    if key in _df_cache:
        return

    csv_path = ds_map[dataset]
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=500, detail=f"CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)

    model_col = _guess_model_col(df)
    if model_col != "model":
        df = df.rename(columns={model_col: "model"})
    df["model"] = df["model"].astype(str)

    metrics: List[str] = []
    for c in df.columns:
        if c == "model":
            continue
        if isinstance(c, str) and c.endswith("_rank"):
            continue
        if pd.api.types.is_numeric_dtype(df[c]):
            metrics.append(c)

    _df_cache[key] = df
    _metrics_cache[key] = metrics


@app.get("/api/metrics")
def api_metrics(
    dataset: str = Query(default="Avg"),
    population: str = Query(default="Curated"),
) -> Dict[str, Any]:
    pop = _normalize_population(population)
    _load_dataset(pop, dataset)
    df = _df_cache[(pop, dataset)]
    metrics = _metrics_cache[(pop, dataset)]
    return {
        "metrics": metrics,
        "n_models": int(df.shape[0]),
        "population": pop,
        "dataset": dataset,
    }


@app.get("/api/leaderboard")
def api_leaderboard(
    metrics: Optional[str] = Query(default=None, description="comma-separated metric names"),
    sort_by: Optional[str] = Query(default=None, description="metric used for ranking"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    # ✅ allow missing limit (Curated ignores paging)
    limit: Optional[int] = Query(default=50, ge=1, le=2_000_000),
    offset: int = Query(default=0, ge=0),
    dataset: str = Query(default="Avg"),
    population: str = Query(default="Curated"),
    modes: Optional[str] = Query(default=None, description="comma-separated: Base,CoT,IR"),
    vendors: Optional[str] = Query(default=None, description="comma-separated vendor keys"),
) -> Dict[str, Any]:
    pop = _normalize_population(population)
    _load_dataset(pop, dataset)
    df = _df_cache[(pop, dataset)]
    valid_metrics = _metrics_cache[(pop, dataset)]

    # Curated only: apply modes/vendors
    if pop != "HF":
        selected_modes = [m.strip() for m in (modes.split(",") if modes else []) if m.strip()]
        selected_vendors = [v.strip() for v in (vendors.split(",") if vendors else []) if v.strip()]
        mode_filter_on = len(selected_modes) > 0
        vendor_filter_on = len(selected_vendors) > 0

        if mode_filter_on or vendor_filter_on:

            def _keep(model_name: str) -> bool:
                mode, base = _parse_mode_and_base_model(model_name)
                vendor = _infer_vendor(base)
                if mode_filter_on and mode not in selected_modes:
                    return False
                if vendor_filter_on and vendor not in selected_vendors:
                    return False
                return True

            mask = df["model"].apply(_keep)
            df = df.loc[mask].copy()

    if metrics is None or metrics.strip() == "":
        selected = ["ACC"] if "ACC" in valid_metrics else (valid_metrics[:1] if valid_metrics else [])
    else:
        selected = [m.strip() for m in metrics.split(",") if m.strip()]

    if not selected:
        raise HTTPException(status_code=400, detail="No metrics selected")

    invalid = [m for m in selected if m not in valid_metrics]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown metrics: {invalid}")

    if sort_by is None or sort_by.strip() == "":
        sort_by = selected[0]
    if sort_by not in valid_metrics:
        raise HTTPException(status_code=400, detail=f"Unknown sort_by: {sort_by}")

    ascending = (sort_dir == "asc")

    acc_rank_col = "ACC_rank"
    sort_rank_col = f"{sort_by}_rank"
    if acc_rank_col not in df.columns:
        raise HTTPException(status_code=500, detail=f"CSV missing required rank column: {acc_rank_col}")
    if sort_rank_col not in df.columns:
        raise HTTPException(status_code=500, detail=f"CSV missing required rank column: {sort_rank_col}")

    extra_rank_cols: List[str] = [acc_rank_col] if sort_rank_col == acc_rank_col else [acc_rank_col, sort_rank_col]

    out = df[["model"] + selected + extra_rank_cols].copy()
    out = out.sort_values(by=sort_by, ascending=ascending, na_position="last").reset_index(drop=True)
    out.insert(0, "rank", range(1, len(out) + 1))

    if sort_by == "ACC":
        out["delta_vs_acc"] = ["+0"] * len(out)
    else:
        out["delta_vs_acc"] = [
            _format_delta(a, s)
            for a, s in zip(out[acc_rank_col].to_list(), out[sort_rank_col].to_list())
        ]

    out = out.drop(columns=list(set([acc_rank_col, sort_rank_col])), errors="ignore")

    total = int(out.shape[0])

    # ✅ Curated: no paging (return all)
    if pop != "HF":
        out_page = out
        used_offset = 0
        used_limit = total
    else:
        used_limit = int(limit or 50)
        used_offset = int(offset or 0)
        out_page = out.iloc[used_offset : used_offset + used_limit].copy()

    out_page = out_page.where(pd.notnull(out_page), None)

    return {
        "population": pop,
        "dataset": dataset,
        "selected_metrics": selected,
        "sort_by": sort_by,
        "sort_dir": sort_dir,
        "total": total,
        "offset": used_offset,
        "limit": used_limit,
        "rows": out_page.to_dict(orient="records"),
    }
