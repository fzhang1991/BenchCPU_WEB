import argparse
import re
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def find_workload_col(df: pd.DataFrame) -> str:
    for c in ["workload_name", "workload", "model", "cpu_name"]:
        if c in df.columns:
            return c
    return df.columns[0]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Plot per-workload runtime distributions from round_*_time columns in one figure."
    )
    parser.add_argument("--input", required=True, help="Path to input CSV")
    parser.add_argument("--output", default=None, help="Path to output PNG")
    parser.add_argument("--title", default="Workload Runtime Distribution", help="Plot title")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    output_path = Path(args.output) if args.output else input_path.with_name(input_path.stem + "_workload_distribution.png")

    df = pd.read_csv(input_path)
    workload_col = find_workload_col(df)

    round_cols = [c for c in df.columns if re.fullmatch(r"round_\d+_time", str(c))]
    if not round_cols:
        raise ValueError("No round_*_time columns found.")

    plot_df = df[[workload_col] + round_cols].copy()
    plot_df = plot_df[plot_df[workload_col].notna()].copy()
    plot_df[workload_col] = plot_df[workload_col].astype(str)
    plot_df = plot_df[~plot_df[workload_col].isin(["AVG", "AVG_round"])].copy()

    long_df = plot_df.melt(id_vars=[workload_col], value_vars=round_cols, var_name="round", value_name="time")
    long_df["time"] = pd.to_numeric(long_df["time"], errors="coerce")
    long_df = long_df[long_df["time"].notna()].copy()

    if long_df.empty:
        raise ValueError("No valid numeric runtime values found after cleaning.")

    med = long_df.groupby(workload_col)["time"].median().sort_values()
    workloads = med.index.tolist()

    grouped = [long_df.loc[long_df[workload_col] == w, "time"].to_numpy() for w in workloads]

    fig_h = max(8, 0.32 * len(workloads))
    fig, ax = plt.subplots(figsize=(14, fig_h))

    bp = ax.boxplot(
        grouped,
        vert=False,
        tick_labels=workloads,
        patch_artist=True,
        showfliers=False,
        medianprops={"color": "#0f172a", "linewidth": 1.6},
        whiskerprops={"color": "#475569"},
        capprops={"color": "#475569"},
        boxprops={"facecolor": "#93c5fd", "edgecolor": "#1d4ed8", "alpha": 0.75},
    )

    for i, vals in enumerate(grouped, start=1):
        y = pd.Series([i] * len(vals), dtype=float)
        jitter = (pd.Series(range(len(vals))) % 5 - 2) * 0.02
        ax.scatter(vals, y + jitter, s=10, alpha=0.32, color="#1e293b")

    ax.set_title(args.title, fontsize=14, fontweight="bold")
    ax.set_xlabel("Runtime")
    ax.set_ylabel("Workload")
    ax.grid(axis="x", linestyle="--", alpha=0.35)

    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=180)
    plt.close(fig)

    print(f"Saved: {output_path}")
    print(f"Workloads: {len(workloads)}, round columns: {len(round_cols)}, points: {len(long_df)}")


if __name__ == "__main__":
    main()
