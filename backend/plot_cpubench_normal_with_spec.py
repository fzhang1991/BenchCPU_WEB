import argparse
import re
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


DEFAULT_SPEC_VALUES = {
    "SPECint2017S": 970.7,
    "SPECfp2017S": 1644.0,
    "SPECint2017R": 962.2,
    "SPECfp2017R": 1188.231,
}


def parse_spec_values(spec_args: list[str] | None) -> dict[str, float]:
    if not spec_args:
        return dict(DEFAULT_SPEC_VALUES)

    parsed: dict[str, float] = {}
    for item in spec_args:
        if "=" not in item:
            raise ValueError(
                f"Invalid --spec format: {item}. Expected name=value, e.g. SPECint2017S=970.7"
            )
        name, value = item.split("=", 1)
        name = name.strip()
        if not name:
            raise ValueError(f"Invalid --spec name in: {item}")
        try:
            parsed[name] = float(value)
        except ValueError as exc:
            raise ValueError(f"Invalid --spec numeric value in: {item}") from exc
    return parsed


def find_round_columns(df: pd.DataFrame) -> list[str]:
    round_time_cols = [c for c in df.columns if re.fullmatch(r"round_\d+_time", str(c))]
    if round_time_cols:
        return round_time_cols

    round_cols = [c for c in df.columns if re.fullmatch(r"round_\d+", str(c))]
    if round_cols:
        return round_cols

    raise ValueError("No round columns found. Expected round_*_time or round_* format.")


def pick_cpubench_row(df: pd.DataFrame) -> pd.Series:
    if "workload_name" in df.columns and (df["workload_name"] == "AVG_round").any():
        return df.loc[df["workload_name"] == "AVG_round"].iloc[0]

    if "benchmark_name" in df.columns and (df["benchmark_name"] == "CPUBench").any():
        return df.loc[df["benchmark_name"] == "CPUBench"].iloc[0]

    # Fallback to second last row because many CPUBench CSV files place AVG_round there.
    if len(df) >= 2:
        return df.iloc[-2]

    return df.iloc[-1]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Plot CPUBench normal distribution and mark SPEC values as vertical dashed lines."
    )
    parser.add_argument("--input", required=True, help="Path to CPUBench CSV")
    parser.add_argument("--output", default=None, help="Output PNG path")
    parser.add_argument(
        "--title",
        default="CPUBench Distribution with SPEC Reference Lines",
        help="Figure title",
    )
    parser.add_argument(
        "--spec",
        action="append",
        default=None,
        help="SPEC marker in name=value format, repeat 4 times if needed",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    output_path = (
        Path(args.output)
        if args.output
        else input_path.with_name(input_path.stem + "_cpubench_normal_with_spec.png")
    )

    spec_values = parse_spec_values(args.spec)

    df = pd.read_csv(input_path)
    round_cols = find_round_columns(df)
    row = pick_cpubench_row(df)

    values = pd.to_numeric(row[round_cols], errors="coerce").dropna().to_numpy(dtype=float)
    if values.size == 0:
        raise ValueError("No valid numeric CPUBench round values found.")

    n = int(values.size)
    mean = float(np.mean(values))
    std = float(np.std(values, ddof=0))
    val_min = float(np.min(values))
    val_max = float(np.max(values))
    span = max(val_max - val_min, 1.0)

    x = np.linspace(val_min - 0.25 * span, val_max + 0.25 * span, 500)
    if std > 0:
        y = (1.0 / (std * np.sqrt(2.0 * np.pi))) * np.exp(-0.5 * ((x - mean) / std) ** 2)
    else:
        y = np.zeros_like(x)

    fig, ax = plt.subplots(figsize=(12, 6.8))
    ax.hist(
        values,
        bins=min(10, max(5, n // 2)),
        density=True,
        alpha=0.35,
        color="#93c5fd",
        edgecolor="#1d4ed8",
        label="CPUBench rounds",
    )
    ax.plot(x, y, color="#dc2626", linewidth=2.0, label="Normal PDF fit")

    ax.axvline(mean, color="#111827", linestyle="-", linewidth=1.4, alpha=0.85, label=f"CPUBench mean={mean:.2f}")

    palette = ["#2563eb", "#16a34a", "#ea580c", "#a21caf", "#0891b2", "#4b5563"]
    for i, (name, val) in enumerate(spec_values.items()):
        color = palette[i % len(palette)]
        ax.axvline(
            float(val),
            color=color,
            linestyle="--",
            linewidth=1.8,
            alpha=0.9,
            label=f"{name}={val:g}",
        )

    ax.set_title(args.title, fontsize=14, fontweight="bold")
    ax.set_xlabel("Score")
    ax.set_ylabel("Density")
    ax.grid(axis="y", linestyle="--", alpha=0.3)
    ax.legend(loc="upper right", frameon=True)

    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=180)
    plt.close(fig)

    print(f"Saved: {output_path}")
    print(f"CPUBench rounds n={n}, mean={mean:.6f}, std(pop)={std:.6f}, min={val_min:.6f}, max={val_max:.6f}")
    print("SPEC markers:")
    for name, val in spec_values.items():
        print(f"  {name}={val}")


if __name__ == "__main__":
    main()