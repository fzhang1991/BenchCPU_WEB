from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


HERE = Path(__file__).resolve().parent
CSV_PATH = HERE / "63.csv"
OUTPUT_PATH = HERE / "zf_63.png"


def main() -> None:
    data = pd.read_csv(CSV_PATH)
    round_columns = [f"round_{index}" for index in range(1, 17)]
    round_means = data[round_columns].mean(axis=0).to_numpy()

    count = round_means.size
    mean = float(np.mean(round_means))
    variance = float(np.var(round_means, ddof=0))
    standard_deviation = float(np.std(round_means, ddof=0))
    sample_variance = float(np.var(round_means, ddof=1))
    sample_standard_deviation = float(np.std(round_means, ddof=1))
    minimum = float(np.min(round_means))
    maximum = float(np.max(round_means))

    try:
        plt.style.use("seaborn")
    except Exception:
        pass

    figure, axis = plt.subplots(figsize=(11, 6.5))
    axis.hist(
        round_means,
        bins=min(10, max(5, count // 2)),
        density=True,
        alpha=0.4,
        color="#60a5fa",
        edgecolor="#1d4ed8",
        label="Runtime histogram",
    )

    span = max(maximum - minimum, 1.0)
    x_values = np.linspace(minimum - 0.2 * span, maximum + 0.2 * span, 500)
    density = (1.0 / (standard_deviation * np.sqrt(2.0 * np.pi))) * np.exp(
        -0.5 * ((x_values - mean) / standard_deviation) ** 2
    )
    axis.plot(x_values, density, color="#dc2626", linewidth=2.0, label="Normal PDF fit")
    axis.axvline(
        mean,
        color="#0f172a",
        linestyle="--",
        linewidth=1.5,
        label=f"Mean = {mean:.4f} s",
    )
    axis.set_title("Intel Xeon E5-2699 v4 16 round normal distribution", fontsize=14, fontweight="bold")
    axis.set_xlabel("Round runtime (s)")
    axis.set_ylabel("Density")

    stats = (
        f"n = {count}\n"
        f"mean = {mean:.6f} s\n"
        f"var(pop) = {variance:.6f}\n"
        f"std(pop) = {standard_deviation:.6f} s\n"
        f"var(sample) = {sample_variance:.6f}\n"
        f"std(sample) = {sample_standard_deviation:.6f} s\n"
        f"min = {minimum:.6f} s\n"
        f"max = {maximum:.6f} s"
    )
    axis.text(
        0.98,
        0.97,
        stats,
        transform=axis.transAxes,
        va="top",
        ha="right",
        fontsize=10,
        bbox={"boxstyle": "round,pad=0.45", "facecolor": "white", "alpha": 0.85, "edgecolor": "#94a3b8"},
    )
    axis.grid(axis="y", linestyle="--", alpha=0.3)
    axis.legend(loc="upper left")

    figure.tight_layout()
    figure.savefig(OUTPUT_PATH, dpi=180)
    plt.close(figure)
    print(f"Saved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()