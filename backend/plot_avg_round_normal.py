import argparse
import re
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Plot normal distribution using AVG_round values from round_*_time columns."
    )
    parser.add_argument("--input", required=True, help="Input CSV path")
    parser.add_argument("--output", default=None, help="Output PNG path")
    parser.add_argument("--title", default="AVG_round Normal Distribution", help="Figure title")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    output_path = (
        Path(args.output)
        if args.output
        else input_path.with_name(input_path.stem + "_avg_round_normal.png")
    )

    df = pd.read_csv(input_path)
    round_cols = [
        c
        for c in df.columns
        if re.fullmatch(r"round_\d+_time", str(c))
        or re.fullmatch(r"Round\d+\s+Time\s*\(s\)", str(c))
    ]
    if not round_cols:
        raise ValueError("No round time columns found.")

    def row_label_value(row: pd.Series) -> str:
        for col in ("workload_name", "workload", "Workload"):
            if col in row.index:
                return str(row[col]).strip()
        return ""

    avg_row = None
    for _, r in df.iterrows():
        if row_label_value(r) == "AVG_round":
            avg_row = r
            break

    if avg_row is not None:
        values = pd.to_numeric(avg_row[round_cols], errors="coerce").dropna().to_numpy(dtype=float)
    else:
        # Legacy files may not include an explicit AVG_round row; use per-round mean across workloads.
        values = pd.to_numeric(df[round_cols].mean(axis=0), errors="coerce").dropna().to_numpy(dtype=float)
    if values.size == 0:
        raise ValueError("No numeric AVG_round values found in round_*_time columns.")

    n = int(values.size)
    mean = float(np.mean(values))
    var_pop = float(np.var(values, ddof=0))
    std_pop = float(np.std(values, ddof=0))
    var_sample = float(np.var(values, ddof=1)) if n > 1 else 0.0
    std_sample = float(np.std(values, ddof=1)) if n > 1 else 0.0
    val_min = float(np.min(values))
    val_max = float(np.max(values))

    x = np.linspace(val_min - 0.2 * (val_max - val_min), val_max + 0.2 * (val_max - val_min), 400)
    if std_pop <= 0:
        y = np.zeros_like(x)
    else:
        y = (1.0 / (std_pop * np.sqrt(2.0 * np.pi))) * np.exp(-0.5 * ((x - mean) / std_pop) ** 2)

    fig, ax = plt.subplots(figsize=(11, 6.5))
    ax.hist(values, bins=min(10, max(5, n // 2)), density=True, alpha=0.4, color="#60a5fa", edgecolor="#1d4ed8", label="AVG_round histogram")
    ax.plot(x, y, color="#dc2626", linewidth=2.0, label="Normal PDF fit")
    ax.axvline(mean, color="#0f172a", linestyle="--", linewidth=1.5, label=f"Mean = {mean:.4f}")

    stats_text = (
        f"n = {n}\n"
        f"mean = {mean:.6f}\n"
        f"var(pop) = {var_pop:.6f}\n"
        f"std(pop) = {std_pop:.6f}\n"
        f"var(sample) = {var_sample:.6f}\n"
        f"std(sample) = {std_sample:.6f}\n"
        f"min = {val_min:.6f}\n"
        f"max = {val_max:.6f}"
    )
    ax.text(
        0.98,
        0.97,
        stats_text,
        transform=ax.transAxes,
        va="top",
        ha="right",
        fontsize=10,
        bbox={"boxstyle": "round,pad=0.45", "facecolor": "white", "alpha": 0.85, "edgecolor": "#94a3b8"},
    )

    ax.set_title(args.title, fontsize=14, fontweight="bold")
    ax.set_xlabel("AVG_round runtime")
    ax.set_ylabel("Density")
    ax.grid(axis="y", linestyle="--", alpha=0.3)
    ax.legend(loc="upper left")

    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=180)
    plt.close(fig)

    print(f"Saved: {output_path}")
    print(f"n={n}, mean={mean:.6f}, var(pop)={var_pop:.6f}, std(pop)={std_pop:.6f}, var(sample)={var_sample:.6f}, std(sample)={std_sample:.6f}, min={val_min:.6f}, max={val_max:.6f}")


if __name__ == "__main__":
    main()
