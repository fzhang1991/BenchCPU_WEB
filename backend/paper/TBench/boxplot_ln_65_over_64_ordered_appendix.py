import csv
import json
import math
import re
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.lines import Line2D

try:
    from scipy import stats as scipy_stats
except Exception:  # pragma: no cover
    scipy_stats = None


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
ZF_64 = ROOT / "leaderboard_data" / "data" / "cpu_groups" / "zf_64" / "zf_64.csv"
ZF_65 = ROOT / "leaderboard_data" / "data" / "cpu_groups" / "zf_65" / "zf_65.csv"
SEED2_64 = HERE / "data" / "64" / "results_rounds_1_16_summary_wide_seed2.csv"
SEED2_65 = HERE / "data" / "65" / "seed2.csv"
GRID_CONFIGS = HERE / "grid_configurations_924.json"
GRID_64 = HERE / "data" / "64" / "combined_results_grid_configurations_924_2026-09-30.csv"
GRID_65 = HERE / "data" / "65" / "summary_grid_configurations_924.csv"
OUTPUT_COMPARISON_PDF = HERE / "boxplot_ln_65_over_64_grid_seed2_seed42.pdf"
OUTPUT_COMBINED_PNG = HERE / "boxplot_ln_65_over_64_grid_seed2_seed42.png"
OUTPUT_SEED_ONLY_PDF = HERE / "boxplot_ln_65_over_64_seed2_seed42.pdf"
OUTPUT_PRESENTATION_PDF = HERE / "boxplot_ln_65_over_64_presentation.pdf"
OUTPUT_PRESENTATION_PNG = HERE / "boxplot_ln_65_over_64_presentation.png"

APPENDIX_WORKLOAD_ORDER = [
    "numpy/matmul",
    "numpy/svd",
    "numpy/fft",
    "tuf/metadata",
    "requests/json",
    "raytrace",
    "chaos_fractal",
    "deltablue",
    "pyflate",
    "go_board_game",
    "resnet50/inference",
    "resnet50/training",
    "bert/eval",
    "transformer_inference",
    "transformer_train",
    "ffmpeg",
    "redis",
    "openssl",
    "zstd",
    "gcc_compile",
    "clang_compile",
    "lapack/solve",
    "lapack/eigen",
    "lapack/svd",
    "rocksdb",
    "opencv/fft_batch",
    "opencv/conv_heavy",
    "opencv/mandelbrot",
    "opencv/jacobi",
    "opencv/canny",
    "opencv/optical_flow",
    "opencv/motion_blur",
    "opencv/background_sub",
    "opencv/color_tracking",
    "opencv/feature_match",
    "guava/event",
    "guava/cache",
    "guava/graph",
    "guava/bloom",
    "guava/immutable",
    "cassandra",
    "kafka",
    "biogo/igor",
    "bleve/index",
    "cockroachdb/kv",
    "cockroachdb/tpcc",
    "esbuild/ThreeJS",
    "esbuild/RomeTS",
    "gc_garbage",
    "go_compiler",
    "gopher_lua",
    "go_json",
    "go_markdown",
    "tile38/kdtree",
]

WORKLOAD_NAME_MAP = {
    "numpy_benchmark.matmul": "numpy/matmul",
    "numpy_benchmark.svd": "numpy/svd",
    "numpy_benchmark.fft": "numpy/fft",
    "tuf_benchmark.tuf-metadata": "tuf/metadata",
    "requests_benchmark.requests-json": "requests/json",
    "raytrace.raytrace": "raytrace",
    "chaos_fractal.chaos-fractal": "chaos_fractal",
    "deltablue.deltablue": "deltablue",
    "pyflate.pyflate": "pyflate",
    "go_board_game.go-board-game": "go_board_game",
    "resnet50_cpu.resnet50_inference": "resnet50/inference",
    "resnet50_cpu.resnet50_training": "resnet50/training",
    "bert_cpu.bert_eval": "bert/eval",
    "transformer_inference.transformer_inference": "transformer_inference",
    "transformer_train.transformer_train": "transformer_train",
    "ffmpeg_benchmark.ffmpeg": "ffmpeg",
    "redis_benchmark.redis-benchmark": "redis",
    "openssl_benchmark.openssl": "openssl",
    "zstd_benchmark.zstd": "zstd",
    "c_compiler_benchmark.gcc_compile": "gcc_compile",
    "c_compiler_benchmark.clang_compile": "clang_compile",
    "lapack_benchmark.lapack_solve": "lapack/solve",
    "lapack_benchmark.lapack_eigen": "lapack/eigen",
    "lapack_benchmark.lapack_svd": "lapack/svd",
    "rocksdb_benchmark.rocksdb_cpu": "rocksdb",
    "opencv_benchmark.fft_batch": "opencv/fft_batch",
    "opencv_benchmark.conv_heavy": "opencv/conv_heavy",
    "opencv_benchmark.mandelbrot": "opencv/mandelbrot",
    "opencv_benchmark.jacobi": "opencv/jacobi",
    "opencv_benchmark.canny": "opencv/canny",
    "opencv_benchmark.optical_flow": "opencv/optical_flow",
    "opencv_benchmark.motion_blur": "opencv/motion_blur",
    "opencv_benchmark.background_sub": "opencv/background_sub",
    "opencv_benchmark.color_tracking": "opencv/color_tracking",
    "opencv_benchmark.feature_match": "opencv/feature_match",
    "guava_benchmark.guava_event": "guava/event",
    "guava_benchmark.guava_cache": "guava/cache",
    "guava_benchmark.guava_graph": "guava/graph",
    "guava_benchmark.guava_bloom": "guava/bloom",
    "guava_benchmark.guava_immutable": "guava/immutable",
    "cassandra_benchmark.cassandra_stress_read": "cassandra",
    "kafka_benchmark.kafka_producer_perf": "kafka",
    "biogo-benchmark.biogo-igor": "biogo/igor",
    "bleve_benchmark.bleve-index": "bleve/index",
    "cockroachdb_benchmark.kv": "cockroachdb/kv",
    "cockroachdb_benchmark.tpcc": "cockroachdb/tpcc",
    "esbuild_benchmark.ThreeJS": "esbuild/ThreeJS",
    "esbuild_benchmark.RomeTS": "esbuild/RomeTS",
    "gc_garbage.gc_garbage": "gc_garbage",
    "go_compiler.go_compiler": "go_compiler",
    "gopher_lua.gopher_lua": "gopher_lua",
    "go_json.json": "go_json",
    "go_markdown.markdown_render": "go_markdown",
    "tile38_sim.kdtree": "tile38/kdtree",
}

def read_csv_rows(path: Path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def parse_override_args(param_overrides: str) -> dict[str, str]:
    return {
        key: value.rstrip(";")
        for key, value in re.findall(r"--([\w-]+)\s+([^\s;]+)", param_overrides)
    }


def expected_config_args(items: list[str]) -> dict[str, str]:
    expected = {}
    for item in items:
        key, value = item.rsplit(".", 1)[-1].split("=", 1)
        if key != "compiler":
            expected[key] = value
    return expected


def validate_config_overrides(row: dict[str, str], config: list[str], source: str) -> None:
    actual = parse_override_args(row["param_overrides"])
    expected = expected_config_args(config)
    mismatches = {
        key: (value, expected.get(key))
        for key, value in actual.items()
        if expected.get(key) != value
    }
    if mismatches:
        raise ValueError(f"Grid parameter mismatch in {source}: {mismatches}")


def normalize_key(row: dict[str, str]) -> str:
    key = f"{row['benchmark_name']}.{row['workload_name']}"
    return canonicalize_workload_key(key)


def comparable_runtime_params(param: str) -> str:
    return re.sub(r"\s*setup:.*$", "", param.strip())


def canonicalize_workload_key(key: str) -> str:
    return WORKLOAD_NAME_MAP.get(key, key.replace("-", "_").replace("/", "_"))


def mean_ci_99(values: np.ndarray) -> tuple[float, float, float]:
    mean = float(np.mean(values))
    n = len(values)
    if n < 2:
        return mean, mean, mean
    sigma = float(np.std(values, ddof=1))
    sem = sigma / math.sqrt(n)
    if scipy_stats is not None:
        crit = float(scipy_stats.t.ppf(0.995, n - 1))
    else:
        crit = 2.947  # 99% two-sided t critical for df=15
    low = mean - crit * sem
    high = mean + crit * sem
    return mean, low, high


def ci_conclusion(values: np.ndarray) -> int:
    """Return 1 for 64 better, -1 for 65 better, and 0 for no significance."""
    _, low, high = mean_ci_99(values)
    if low > 0:
        return 1
    if high < 0:
        return -1
    return 0


def build_seed_42_series() -> dict[str, np.ndarray]:
    rows_64 = read_csv_rows(ZF_64)
    rows_65 = read_csv_rows(ZF_65)
    by_key_64 = {normalize_key(row): row for row in rows_64}
    by_key_65 = {normalize_key(row): row for row in rows_65}

    values_by_workload: dict[str, list[float]] = {name: [] for name in APPENDIX_WORKLOAD_ORDER}
    for name in APPENDIX_WORKLOAD_ORDER:
        row_64 = by_key_64.get(name)
        row_65 = by_key_65.get(name)
        if row_64 is None or row_65 is None:
            raise ValueError(f"Missing workload data for {name}")
        for round_index in range(1, 17):
            param_64 = comparable_runtime_params(row_64[f"round_{round_index}_param"])
            param_65 = comparable_runtime_params(row_65[f"round_{round_index}_param"])
            if param_64 != param_65:
                raise ValueError(f"Param mismatch for {name} round {round_index}: {param_64} != {param_65}")
            time_64 = float(row_64[f"round_{round_index}_time"])
            time_65 = float(row_65[f"round_{round_index}_time"])
            if time_64 <= 0 or time_65 <= 0:
                raise ValueError(f"Non-positive runtime for {name} round {round_index}")
            values_by_workload[name].append(math.log(time_65 / time_64))
    return {name: np.array(values, dtype=float) for name, values in values_by_workload.items()}


def build_seed2_series() -> dict[str, np.ndarray]:
    rows_64 = {
        normalize_key(row): row for row in read_csv_rows(SEED2_64)
    }
    rows_65 = {
        normalize_key(row): row for row in read_csv_rows(SEED2_65)
    }
    if set(rows_64) != set(rows_65):
        raise ValueError("Seed 2 workload sets do not match between 64 and 65")

    values_by_workload: dict[str, list[float]] = {
        name: [] for name in APPENDIX_WORKLOAD_ORDER
    }
    for name in APPENDIX_WORKLOAD_ORDER:
        row_64 = rows_64.get(name)
        row_65 = rows_65.get(name)
        if row_64 is None or row_65 is None:
            raise ValueError(f"Missing seed 2 workload data for {name}")
        for round_index in range(1, 17):
            param_64 = row_64[f"round_{round_index}_param"].strip()
            param_65 = row_65[f"round_{round_index}_param"].strip()
            if param_64 != param_65:
                raise ValueError(
                    f"Seed 2 parameter mismatch for {name} round {round_index}"
                )
            time_64 = float(row_64[f"round_{round_index}_time"])
            time_65 = float(row_65[f"round_{round_index}_time"])
            if time_64 <= 0 or time_65 <= 0:
                raise ValueError(f"Non-positive seed 2 runtime for {name}")
            values_by_workload[name].append(math.log(time_65 / time_64))
    return {name: np.array(values, dtype=float) for name, values in values_by_workload.items()}


def build_grid_series() -> dict[str, np.ndarray]:
    with GRID_CONFIGS.open(encoding="utf-8") as stream:
        configurations = json.load(stream)["workload_configurations"]

    rows_64_by_workload: dict[str, list[dict[str, str]]] = {}
    for row in read_csv_rows(GRID_64):
        key = f"{row['benchmark_name']}.{row['workload_name']}"
        rows_64_by_workload.setdefault(key, []).append(row)

    times_64: dict[tuple[str, int], float] = {}
    times_65: dict[tuple[str, int], float] = {}
    for workload in configurations:
        raw_name = workload["workload"]
        configs = workload["configurations"]
        rows = rows_64_by_workload.get(raw_name, [])
        if len(rows) != len(configs):
            raise ValueError(
                f"Grid 64 config count mismatch for {raw_name}: "
                f"{len(rows)} rows, {len(configs)} configs"
            )
        for index, (row, config) in enumerate(zip(rows, configs), start=1):
            validate_config_overrides(row, config, f"64 {raw_name} config {index}")
            times_64[(raw_name, index)] = float(row["elapsed_time(s)"])

    seen_65 = set()
    for row in read_csv_rows(GRID_65):
        raw_name = f"{row['benchmark_name']}.{row['workload_name']}"
        workload = next(
            (item for item in configurations if item["workload"] == raw_name), None
        )
        if workload is None:
            raise ValueError(f"Unknown grid workload in 65 data: {raw_name}")
        source_match = re.search(r"_924_(\d+)_", row["source_file"])
        if source_match is None:
            raise ValueError(f"Missing grid config index for {raw_name}")
        index = int(source_match.group(1))
        if not 1 <= index <= len(workload["configurations"]):
            raise ValueError(f"Invalid grid config index for {raw_name}: {index}")
        validate_config_overrides(
            row, workload["configurations"][index - 1], f"65 {raw_name} config {index}"
        )
        key = (raw_name, index)
        if key in seen_65:
            raise ValueError(f"Duplicate grid 65 config: {raw_name} config {index}")
        seen_65.add(key)
        times_65[key] = float(row["elapsed_time(s)"])

    if set(times_64) != set(times_65):
        raise ValueError("Grid 64/65 configuration indexes do not match")

    values_by_workload: dict[str, list[float]] = {
        name: [] for name in APPENDIX_WORKLOAD_ORDER
    }
    for workload in configurations:
        raw_name = workload["workload"]
        name = canonicalize_workload_key(raw_name)
        if name not in values_by_workload:
            continue
        for index in range(1, len(workload["configurations"]) + 1):
            time_64 = times_64[(raw_name, index)]
            time_65 = times_65[(raw_name, index)]
            if time_64 <= 0 or time_65 <= 0:
                raise ValueError(f"Non-positive grid runtime for {name} config {index}")
            values_by_workload[name].append(math.log(time_65 / time_64))

    missing = [name for name, values in values_by_workload.items() if not values]
    if missing:
        raise ValueError(f"No paired grid results for: {', '.join(missing)}")
    return {name: np.array(values, dtype=float) for name, values in values_by_workload.items()}


def draw_distribution_panel(
    ax,
    labels: list[str],
    series: dict[str, np.ndarray],
    title: str,
    color: str,
) -> None:
    ordered = [series[name] for name in labels]
    box = ax.boxplot(
        ordered,
        patch_artist=True,
        widths=0.6,
        showfliers=False,
        medianprops={"color": "#0f172a", "linewidth": 1.2},
        boxprops={"facecolor": color, "edgecolor": "#0f172a", "linewidth": 0.9},
        whiskerprops={"color": "#475569", "linewidth": 0.9},
        capprops={"color": "#475569", "linewidth": 0.9},
    )
    for patch in box["boxes"]:
        patch.set_alpha(0.90)
    for index, values in enumerate(ordered, start=1):
        mean_value, ci_low, ci_high = mean_ci_99(values)
        ax.errorbar(index, mean_value, yerr=[[mean_value - ci_low], [ci_high - mean_value]], fmt="D", color="#dc2626", ecolor="#dc2626", markeredgecolor="#dc2626", markersize=4, capsize=3, elinewidth=1.3, zorder=5)
    ax.axhline(0, color="#111827", linestyle="--", linewidth=0.9, alpha=0.9)
    ax.set_title(title, loc="left", fontsize=11)
    ax.set_xticks(range(1, len(labels) + 1))
    ax.set_xticklabels(labels, rotation=90, ha="center", fontsize=7)
    ax.grid(axis="y", linestyle="--", alpha=0.25)
    return box


def plot_comparison(
    labels: list[str],
    grid_series: dict[str, np.ndarray],
    seed2_series: dict[str, np.ndarray],
    seed42_series: dict[str, np.ndarray],
) -> None:
    plot_seed_only_comparison(
        labels,
        seed2_series,
        seed42_series,
        output_path=OUTPUT_COMPARISON_PDF,
    )


def plot_presentation_summary(
    grid_series: dict[str, np.ndarray],
    seed2_series: dict[str, np.ndarray],
    seed42_series: dict[str, np.ndarray],
) -> None:
    source_series = [
        ("Seed 42", seed42_series, "#bbf7d0"),
        ("Seed 2", seed2_series, "#fed7aa"),
        ("Grid", grid_series, "#bfdbfe"),
    ]
    workload_means = [
        np.array([float(np.mean(series[name])) for name in APPENDIX_WORKLOAD_ORDER])
        for _, series, _ in source_series
    ]

    fig = plt.figure(figsize=(16, 9), constrained_layout=True)
    layout = fig.add_gridspec(2, 1, height_ratios=[0.72, 0.28])
    ax = fig.add_subplot(layout[0])
    table_ax = fig.add_subplot(layout[1])

    box = ax.boxplot(
        workload_means,
        positions=[1, 2, 3],
        widths=0.48,
        patch_artist=True,
        showfliers=False,
        medianprops={"color": "#0f172a", "linewidth": 1.8},
        boxprops={"edgecolor": "#0f172a", "linewidth": 1.1},
        whiskerprops={"color": "#475569", "linewidth": 1.0},
        capprops={"color": "#475569", "linewidth": 1.0},
    )
    for patch, (_, _, color) in zip(box["boxes"], source_series):
        patch.set_facecolor(color)
        patch.set_alpha(0.9)

    random = np.random.default_rng(42)
    for index, values in enumerate(workload_means, start=1):
        ax.scatter(
            index + random.uniform(-0.15, 0.15, len(values)),
            values,
            s=19,
            color="#334155",
            alpha=0.45,
            linewidths=0,
            zorder=3,
        )
        mean_value, ci_low, ci_high = mean_ci_99(values)
        ax.errorbar(
            index,
            mean_value,
            yerr=[[mean_value - ci_low], [ci_high - mean_value]],
            fmt="D",
            color="#c2410c",
            ecolor="#c2410c",
            markersize=7,
            capsize=5,
            elinewidth=1.8,
            zorder=5,
        )

    ax.axhline(0, color="#111827", linestyle="--", linewidth=1.2)
    ax.set_xlim(0.45, 3.55)
    ax.set_xticks([1, 2, 3], [item[0] for item in source_series], fontsize=13)
    ax.set_ylabel("Per-workload mean ln(65/64 runtime ratio)", fontsize=12)
    ax.set_title("64 vs 65 across 54 workloads", loc="left", fontsize=17, fontweight="bold")
    ax.grid(axis="y", linestyle="--", alpha=0.28)
    ax.set_axisbelow(True)
    ax.legend(
        handles=[
            box["boxes"][0],
            Line2D([], [], color="#334155", marker="o", linestyle="None", markersize=5, alpha=0.65),
            Line2D([], [], color="#c2410c", marker="D", linestyle="None", markersize=6),
            Line2D([], [], color="#111827", linestyle="--", linewidth=1.2),
        ],
        labels=["IQR across workloads", "One dot per workload", "Mean and 99% CI", "No difference (0)"],
        loc="upper left",
        ncols=2,
        frameon=False,
        fontsize=10,
    )

    summary_rows = []
    for (source_name, series, _), means in zip(source_series, workload_means):
        mean_value, ci_low, ci_high = mean_ci_99(means)
        conclusions = [ci_conclusion(series[name]) for name in APPENDIX_WORKLOAD_ORDER]
        summary_rows.append([
            source_name,
            str(sum(value == 1 for value in conclusions)),
            str(sum(value == -1 for value in conclusions)),
            str(sum(value == 0 for value in conclusions)),
            f"{math.exp(mean_value):.2f} [{math.exp(ci_low):.2f}, {math.exp(ci_high):.2f}]",
        ])
    table_ax.axis("off")
    table_ax.text(
        0.02,
        0.98,
        "Equal workload weight · 99% CI across 54 workload means · ratio > 1 means 64 faster",
        transform=table_ax.transAxes,
        ha="left",
        va="top",
        fontsize=10,
    )
    table = table_ax.table(
        cellText=summary_rows,
        colLabels=["Data source", "64 faster", "65 faster", "No significant difference", "Geometric mean 65/64 (99% CI)"],
        cellLoc="center",
        colLoc="center",
        colWidths=[0.14, 0.14, 0.14, 0.25, 0.33],
        bbox=[0.02, 0.03, 0.96, 0.78],
    )
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    for (row, _), cell in table.get_celld().items():
        cell.set_edgecolor("#cbd5e1")
        cell.set_linewidth(0.7)
        if row == 0:
            cell.set_facecolor("#e2e8f0")
            cell.set_text_props(weight="bold")

    fig.savefig(OUTPUT_PRESENTATION_PDF, bbox_inches="tight")
    fig.savefig(OUTPUT_PRESENTATION_PNG, dpi=180, bbox_inches="tight")
    plt.close(fig)


def plot_seed_only_comparison(
    labels: list[str],
    seed2_series: dict[str, np.ndarray],
    seed42_series: dict[str, np.ndarray],
    output_path: Path = OUTPUT_SEED_ONLY_PDF,
) -> None:
    fig, axes = plt.subplots(2, 1, figsize=(18, 11), sharex=True, constrained_layout=True)
    draw_distribution_panel(
        axes[0], labels, seed42_series, "(a) Random sampling (seed = 42)", "#bbf7d0"
    )
    draw_distribution_panel(
        axes[1], labels, seed2_series, "(b) Random sampling (seed = 2)", "#fed7aa"
    )
    for axis in axes:
        axis.set_ylabel("ln(65/64 runtime ratio)", fontsize=10)
    axes[0].tick_params(axis="x", labelbottom=False)
    axes[1].set_xlabel("workload", fontsize=10)

    inconsistent = {
        name for name in labels
        if ci_conclusion(seed42_series[name]) != ci_conclusion(seed2_series[name])
    }
    for label, name in zip(axes[1].get_xticklabels(), labels):
        if name in inconsistent:
            label.set_color("#b91c1c")
    axes[0].legend(
        handles=[
            Line2D([], [], color="#dbeafe", marker="s", linestyle="None", markersize=9, markeredgecolor="#0f172a"),
            Line2D([], [], color="#dc2626", marker="D", linestyle="None", markersize=5),
            Line2D([], [], color="#111827", linestyle="--", linewidth=1.0),
            axes[0].errorbar([], [], yerr=[], fmt="none", ecolor="#dc2626", capsize=4, elinewidth=2),
            Line2D([], [], color="#b91c1c", marker="s", linestyle="None", markersize=6),
        ],
        labels=["Interquartile range", "Mean", "No difference (0)", "99% CI of mean", "Red label: seed conclusions disagree"],
        loc="upper left",
        ncols=3,
        frameon=False,
    )
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)


def plot_combined_sources_png(
    labels: list[str],
    grid_series: dict[str, np.ndarray],
    seed2_series: dict[str, np.ndarray],
    seed42_series: dict[str, np.ndarray],
) -> None:
    inconsistent = {
        name for name in labels
        if len({
            ci_conclusion(grid_series[name]),
            ci_conclusion(seed2_series[name]),
            ci_conclusion(seed42_series[name]),
        }) > 1
    }

    fig, axes = plt.subplots(3, 1, figsize=(18, 15), sharex=True, constrained_layout=True)
    panels = [
        (seed42_series, "(a) Random sampling (seed = 42)", "#bbf7d0"),
        (seed2_series, "(b) Random sampling (seed = 2)", "#fed7aa"),
        (grid_series, "(c) Grid sampling", "#bfdbfe"),
    ]
    for ax, (series, title, color) in zip(axes, panels):
        draw_distribution_panel(ax, labels, series, title, color)
        ax.set_ylabel("ln(65/64 runtime ratio)", fontsize=10)
    axes[0].tick_params(axis="x", labelbottom=False)
    axes[1].tick_params(axis="x", labelbottom=False)
    axes[2].set_xlabel("workload", fontsize=10)
    for tick, name in zip(axes[2].get_xticklabels(), labels):
        if name in inconsistent:
            tick.set_color("#b91c1c")
    axes[0].legend(
        handles=[
            Line2D([], [], color="#c2410c", marker="D", linestyle="None", markersize=4),
            Line2D([], [], color="#111827", linestyle="--", linewidth=1.0),
            Line2D([], [], color="#b91c1c", marker="s", linestyle="None", markersize=6),
        ],
        labels=["Mean and 99% CI", "No difference (0)", "Red label: conclusions disagree"],
        loc="upper left",
        ncols=3,
        frameon=False,
        fontsize=9,
    )
    fig.savefig(OUTPUT_COMBINED_PNG, dpi=180, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    grid_series = build_grid_series()
    labels = sorted(APPENDIX_WORKLOAD_ORDER, key=lambda name: float(np.median(grid_series[name])))

    plt.rcParams["font.family"] = "sans-serif"
    plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Microsoft YaHei", "SimHei"]
    plt.rcParams["axes.unicode_minus"] = False
    seed2_series = build_seed2_series()
    seed42_series = build_seed_42_series()
    plot_comparison(labels, grid_series, seed2_series, seed42_series)
    plot_presentation_summary(grid_series, seed2_series, seed42_series)
    plot_seed_only_comparison(labels, seed2_series, seed42_series)
    plot_combined_sources_png(labels, grid_series, seed2_series, seed42_series)
    print(f"Saved {OUTPUT_COMPARISON_PDF}")
    print(f"Saved {OUTPUT_PRESENTATION_PDF}")
    print(f"Saved {OUTPUT_PRESENTATION_PNG}")
    print(f"Saved {OUTPUT_SEED_ONLY_PDF}")
    print(f"Saved {OUTPUT_COMBINED_PNG}")


if __name__ == "__main__":
    main()