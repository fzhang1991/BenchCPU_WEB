from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def main() -> None:
    values = np.array(
        [
            616.283521,
            560.753647,
            519.936251,
            546.003440,
            593.893258,
            549.503819,
            534.241755,
            565.029452,
            547.168775,
            456.459395,
            457.539390,
            438.036167,
            512.170731,
            489.701887,
            528.898260,
            540.550845,
        ],
        dtype=float,
    )

    n = int(values.size)
    mean = float(np.mean(values))
    var_pop = float(np.var(values, ddof=0))
    std_pop = float(np.std(values, ddof=0))
    var_sample = float(np.var(values, ddof=1)) if n > 1 else 0.0
    std_sample = float(np.std(values, ddof=1)) if n > 1 else 0.0
    val_min = float(np.min(values))
    val_max = float(np.max(values))

    span = max(val_max - val_min, 1.0)
    x = np.linspace(val_min - 0.2 * span, val_max + 0.2 * span, 500)
    y = (1.0 / (std_pop * np.sqrt(2.0 * np.pi))) * np.exp(-0.5 * ((x - mean) / std_pop) ** 2)

    fig, ax = plt.subplots(figsize=(11, 6.5))
    ax.hist(
        values,
        bins=min(10, max(5, n // 2)),
        density=True,
        alpha=0.4,
        color="#60a5fa",
        edgecolor="#1d4ed8",
        label="Runtime histogram",
    )
    ax.plot(x, y, color="#dc2626", linewidth=2.0, label="Normal PDF fit")
    ax.axvline(mean, color="#0f172a", linestyle="--", linewidth=1.5, label=f"Mean = {mean:.4f} s")

    stats_text = (
        f"n = {n}\n"
        f"mean = {mean:.6f} s\n"
        f"var(pop) = {var_pop:.6f}\n"
        f"std(pop) = {std_pop:.6f} s\n"
        f"var(sample) = {var_sample:.6f}\n"
        f"std(sample) = {std_sample:.6f} s\n"
        f"min = {val_min:.6f} s\n"
        f"max = {val_max:.6f} s"
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

    ax.set_title("AMD EPYC 7543 32-Core Processor 16 round normal distribution", fontsize=14, fontweight="bold")
    ax.set_xlabel("Round runtime (s)")
    ax.set_ylabel("Density")
    ax.grid(axis="y", linestyle="--", alpha=0.3)
    ax.legend(loc="upper left")

    output_path = Path(__file__).resolve().parent / "zf_amd.png"
    fig.tight_layout()
    fig.savefig(output_path, dpi=180)
    plt.close(fig)

    print(f"Saved: {output_path}")
    print(
        f"n={n}, mean={mean:.6f}, var(pop)={var_pop:.6f}, std(pop)={std_pop:.6f}, "
        f"var(sample)={var_sample:.6f}, std(sample)={std_sample:.6f}, min={val_min:.6f}, max={val_max:.6f}"
    )


if __name__ == "__main__":
    main()
