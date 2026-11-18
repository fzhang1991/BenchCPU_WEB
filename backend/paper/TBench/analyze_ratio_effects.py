"""Analyze how grid parameters affect the paired 64/65 runtime ratio.

The result file index is the 1-based position in each workload's ordered
configuration list. Only configurations present on both machines are used.
The main figure uses workload-centered log2 ratios so workloads with very
different baseline ratios do not dominate the parameter comparison.
"""
from __future__ import annotations

import csv
import json
import math
import re
from collections import defaultdict
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


HERE = Path(__file__).resolve().parent
GRID_PATH = HERE / "grid_configurations_924.json"
DATA_ROOT = HERE / "data"
PAIRED_PATH = HERE / "ratio_parameter_pairs.csv"
LEVEL_PATH = HERE / "ratio_parameter_levels.csv"
DETAIL_PATH = HERE / "ratio_grid_pairs.csv"
GRID_SUMMARY_PATHS = {
    "64": DATA_ROOT / "64" / "combined_results_grid_configurations_924_2026-09-30.csv",
    "65": DATA_ROOT / "65" / "summary_grid_configurations_924.csv",
}
EFFECT_ALL_FIGURE = HERE / "ratio_parameter_effects_all_configs.png"
WORKLOAD_BASELINE = "numpy_benchmark.matmul"

DIMENSIONS = ("data_size", "threads", "compiler", "optimization")


def parse_config(items: list[str]) -> dict[str, str | None]:
    values: dict[str, str | None] = {
        "data_size": None,
        "threads": None,
        "compiler": None,
        "optimization": None,
    }
    for item in items:
        key, value = item.rsplit(".", 1)[-1].split("=", 1)
        if key == "opt":
            key = "optimization"
        elif key not in {"threads", "compiler"}:
            key = "data_size"
        values[key] = value
    return values


def load_grid() -> dict[str, dict]:
    with GRID_PATH.open(encoding="utf-8") as stream:
        payload = json.load(stream)
    grid = {}
    for workload in payload["workload_configurations"]:
        configs = [parse_config(items) for items in workload["configurations"]]
        grid[workload["workload"]] = {
            "is_cpp": workload["is_cpp"],
            "configs": configs,
        }
    return grid


def checkpoint_index(path: Path) -> int | None:
    match = re.search(r"_924_(\d+)_", path.name)
    if not match:
        return None
    return int(match.group(1))


def load_times(machine: str) -> dict[tuple[str, int], float]:
    times: dict[tuple[str, int], float] = {}
    for path in (DATA_ROOT / machine).glob("*.csv"):
        index = checkpoint_index(path)
        if index is None:
            continue
        with path.open(encoding="utf-8", newline="") as stream:
            for row in csv.DictReader(stream):
                elapsed = float(row["elapsed_time(s)"])
                if elapsed > 0:
                    workload = f"{row['benchmark_name']}.{row['workload_name']}"
                    times[(workload, index)] = elapsed

    summary_path = GRID_SUMMARY_PATHS[machine]
    if summary_path.exists():
        with summary_path.open(encoding="utf-8-sig", newline="") as stream:
            rows = list(csv.DictReader(stream))
        if machine == "64":
            rows_by_workload: dict[str, list[dict[str, str]]] = defaultdict(list)
            for row in rows:
                workload = f"{row['benchmark_name']}.{row['workload_name']}"
                rows_by_workload[workload].append(row)
            for workload, metadata in load_grid().items():
                workload_rows = rows_by_workload.get(workload, [])
                if len(workload_rows) != len(metadata["configs"]):
                    raise ValueError(
                        f"Grid summary config count mismatch for {workload}: "
                        f"{len(workload_rows)} rows, {len(metadata['configs'])} configs"
                    )
                for index, row in enumerate(workload_rows, start=1):
                    elapsed = float(row["elapsed_time(s)"])
                    if elapsed > 0:
                        times.setdefault((workload, index), elapsed)
        else:
            for row in rows:
                index = checkpoint_index(Path(row["source_file"]))
                if index is None:
                    raise ValueError(f"Missing grid config index in {row['source_file']}")
                workload = f"{row['benchmark_name']}.{row['workload_name']}"
                elapsed = float(row["elapsed_time(s)"])
                if elapsed > 0:
                    key = (workload, index)
                    if key in times:
                        raise ValueError(f"Duplicate grid summary result for {machine}: {key}")
                    times[key] = elapsed
    return times


def write_csv(path: Path, header: list[str], rows: list[list[object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(header)
        writer.writerows(rows)


def build_pairs(grid: dict[str, dict]) -> list[dict]:
    time_64 = load_times("64")
    time_65 = load_times("65")
    pairs = []
    for workload, metadata in grid.items():
        for index, config in enumerate(metadata["configs"], start=1):
            key = (workload, index)
            if key not in time_64 or key not in time_65:
                continue
            ratio = time_64[key] / time_65[key]
            pairs.append({
                "workload": workload,
                "is_cpp": metadata["is_cpp"],
                "config_index": index,
                **config,
                "time_64": time_64[key],
                "time_65": time_65[key],
                "ratio": ratio,
                "log2_ratio": math.log2(ratio),
            })
    by_workload = defaultdict(list)
    for row in pairs:
        by_workload[row["workload"]].append(row)
    for rows in by_workload.values():
        center = float(np.median([row["log2_ratio"] for row in rows]))
        for row in rows:
            row["centered_log2_ratio"] = row["log2_ratio"] - center
    return pairs


def parameter_pairs(
    pairs: list[dict],
    baselines: dict[str, str] | None = None,
) -> list[list[object]]:
    baselines = baselines or {}
    by_workload: dict[str, list[dict]] = defaultdict(list)
    for row in pairs:
        by_workload[row["workload"]].append(row)

    rows = []
    for dimension in DIMENSIONS:
        for workload, values in by_workload.items():
            levels = {row[dimension] for row in values}
            levels = sorted(levels, key=int) if dimension in {"data_size", "threads"} else sorted(levels)
            if len(levels) < 2:
                continue
            requested_baseline = baselines.get(dimension)
            if requested_baseline == "small":
                baseline = levels[0]
            elif requested_baseline == "large":
                baseline = levels[-1]
            else:
                baseline = requested_baseline or levels[0]
            if baseline not in levels:
                continue
            other_dimensions = [item for item in DIMENSIONS if item != dimension]
            groups: dict[tuple[str, ...], dict[str, dict]] = defaultdict(dict)
            for value in values:
                signature = tuple(value[item] for item in other_dimensions)
                groups[signature][value[dimension]] = value
            for signature, grouped in groups.items():
                for high in levels:
                    if high == baseline:
                        continue
                    if baseline not in grouped or high not in grouped:
                        continue
                    low_row, high_row = grouped[baseline], grouped[high]
                    rows.append([
                        dimension,
                        workload,
                        baseline,
                        high,
                        high_row["log2_ratio"] - low_row["log2_ratio"],
                        high_row["ratio"] / low_row["ratio"],
                        low_row["ratio"],
                        high_row["ratio"],
                        low_row["config_index"],
                        high_row["config_index"],
                    ])
    return rows


def level_summary(pairs: list[dict]) -> list[list[object]]:
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in pairs:
        for dimension in DIMENSIONS:
            if row[dimension] is None:
                continue
            grouped[(dimension, str(row[dimension]))].append(row)
    rows = []
    for (dimension, level), values in sorted(grouped.items()):
        centered = np.array([row["centered_log2_ratio"] for row in values])
        raw = np.array([row["ratio"] for row in values])
        rows.append([
            dimension,
            level,
            len(values),
            len({row["workload"] for row in values}),
            float(np.median(raw)),
            float(np.median(centered)),
            float(np.mean(centered)),
            float(np.quantile(centered, 0.25)),
            float(np.quantile(centered, 0.75)),
        ])
    return rows


def workload_pairs(
    pairs: list[dict],
    grid: dict[str, dict],
    baseline_workload: str = WORKLOAD_BASELINE,
) -> list[list[object]]:
    selected: dict[str, list[dict]] = defaultdict(list)
    for row in pairs:
        selected[row["workload"]].append(row)

    def config_key(workload: str, row: dict) -> tuple[int, str]:
        sizes = sorted({int(config["data_size"]) for config in grid[workload]["configs"]})
        size_level = sizes.index(int(row["data_size"]))
        return size_level, str(row["threads"])

    baseline = {
        config_key(baseline_workload, row): row
        for row in selected[baseline_workload]
    }
    contrasts = []
    for workload, rows in selected.items():
        if workload == baseline_workload:
            continue
        for row in rows:
            matched = baseline.get(config_key(workload, row))
            if matched is None:
                continue
            contrasts.append([
                "workload",
                workload,
                baseline_workload,
                workload,
                row["log2_ratio"] - matched["log2_ratio"],
                row["ratio"] / matched["ratio"],
                matched["ratio"],
                row["ratio"],
                matched["config_index"],
                row["config_index"],
            ])
    return contrasts


def plot_effects(
    contrasts: list[list[object]],
    output_path: Path,
    dimensions: tuple[str, ...],
    title: str,
    baselines: dict[str, str],
) -> None:
    fig, ax = plt.subplots(figsize=(11, 7), constrained_layout=True)
    groups = ("workload", *dimensions)
    colors = {"data_size": "#2f6690", "threads": "#3a7d44", "compiler": "#b5651d", "optimization": "#8c3f69", "workload": "#667085"}
    labels_by_dimension = {
        "workload": f"workload\n(baseline: {baselines['workload']})",
        "data_size": f"data size\n(baseline: {baselines['data_size']})",
        "threads": f"threads\n(baseline: {baselines['threads']})",
        "compiler": f"compiler\n(baseline: {baselines['compiler']})",
        "optimization": f"optimization\n(baseline: {baselines['optimization']})",
    }
    labels = [labels_by_dimension[group] for group in groups]
    values_by_dimension = [
        [1.0 / row[5] for row in contrasts if row[0] == group]
        for group in groups
    ]
    tick_labels = []
    for label, values in zip(labels, values_by_dimension):
        q25, median, q75 = np.quantile(values, [0.25, 0.5, 0.75])
        tick_labels.append(f"{label}\nmedian={median:.3f}\nIQR={q25:.3f}-{q75:.3f}")
    box = ax.boxplot(values_by_dimension, patch_artist=True, showfliers=False)
    for patch, group in zip(box["boxes"], groups):
        patch.set_facecolor(colors[group])
        patch.set_alpha(0.72)
    all_values = [value for values in values_by_dimension for value in values]
    y_min = min(all_values) * 0.8
    y_max = max(all_values) * 1.25
    ax.axhline(1, color="#333333", linewidth=0.8, linestyle="--", label="ratio = 1")
    ax.set_ylim(y_min, y_max)
    ax.set_yscale("log")
    ax.set_xticks(range(1, len(labels) + 1), tick_labels)
    ax.set_ylabel("Relative effect = (T65/T64)_level / (T65/T64)_baseline (1 = no change)")
    ax.grid(axis="y", alpha=0.25)
    ax.legend(loc="upper right", frameon=False)
    fig.suptitle(f"{title}\nratio = 1 means no relative-performance change")
    fig.savefig(output_path, dpi=180)
    plt.close(fig)


def main() -> None:
    grid = load_grid()
    pairs = build_pairs(grid)
    all_contrasts = parameter_pairs(pairs)
    all_contrasts.extend(workload_pairs(pairs, grid))
    level_rows = level_summary(pairs)
    write_csv(
        DETAIL_PATH,
        ["workload", "is_cpp", "config_index", "data_size", "threads", "compiler", "optimization", "time_64", "time_65", "ratio_64_over_65", "log2_ratio", "centered_log2_ratio"],
        [[row[key] for key in ["workload", "is_cpp", "config_index", "data_size", "threads", "compiler", "optimization", "time_64", "time_65", "ratio", "log2_ratio", "centered_log2_ratio"]] for row in pairs],
    )
    write_csv(PAIRED_PATH, ["dimension", "workload", "low_level", "high_level", "high_minus_low_log2", "high_div_low_ratio", "low_ratio", "high_ratio", "low_config_index", "high_config_index"], all_contrasts)
    write_csv(LEVEL_PATH, ["dimension", "level", "n_pairs", "n_workloads", "median_raw_ratio", "median_centered_log2", "mean_centered_log2", "q25_centered_log2", "q75_centered_log2"], level_rows)
    plot_effects(
        all_contrasts,
        EFFECT_ALL_FIGURE,
        DIMENSIONS,
        "Parameter effects (all available configurations)",
        {
            "workload": WORKLOAD_BASELINE,
            "data_size": "small",
            "threads": "1",
            "compiler": "clang",
            "optimization": "O1",
        },
    )
    print(f"paired ratios: {len(pairs)}")
    print(f"all-configuration contrasts: {len(all_contrasts)}")
    print(f"saved {DETAIL_PATH.name}, {PAIRED_PATH.name}, {LEVEL_PATH.name}")
    print(f"saved {EFFECT_ALL_FIGURE.name}")


if __name__ == "__main__":
    main()