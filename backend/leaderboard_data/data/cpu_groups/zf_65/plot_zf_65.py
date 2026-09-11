import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


def normal_pdf(x, mu, sigma):
    return 1.0 / (sigma * np.sqrt(2 * np.pi)) * np.exp(-0.5 * ((x - mu) / sigma) ** 2)


def main():
    csv_path = os.path.join(os.path.dirname(__file__), 'zf_65.csv')
    out_path = os.path.join(os.path.dirname(__file__), 'zf_65.png')

    df = pd.read_csv(csv_path)

    # collect the 16 round time columns
    round_cols = [f'round_{i}_time' for i in range(1, 17)]
    rounds = df[round_cols]

    # compute per-round average across all workloads (rows)
    means = rounds.mean(axis=0).values  # length 16

    # statistics
    n = len(means)
    mu = means.mean()
    var_pop = means.var(ddof=0)
    std_pop = np.sqrt(var_pop)
    var_samp = means.var(ddof=1)
    std_samp = np.sqrt(var_samp)
    mn = means.min()
    mx = means.max()

    # plotting: match style used by zf_amd plot
    try:
        plt.style.use('seaborn')
    except Exception:
        pass

    fig, ax = plt.subplots(figsize=(11, 6.5))

    # histogram (density) and colors matching zf_amd
    bins = min(10, max(5, n // 2))
    ax.hist(
        means,
        bins=bins,
        density=True,
        alpha=0.4,
        color="#60a5fa",
        edgecolor="#1d4ed8",
        label="Runtime histogram",
    )

    # normal PDF fit using population std
    span = max(mx - mn, 1.0)
    x = np.linspace(mn - 0.2 * span, mx + 0.2 * span, 500)
    y = (1.0 / (std_pop * np.sqrt(2.0 * np.pi))) * np.exp(-0.5 * ((x - mu) / std_pop) ** 2)
    ax.plot(x, y, color="#dc2626", linewidth=2.0, label="Normal PDF fit")

    # mean line
    ax.axvline(mu, color="#0f172a", linestyle="--", linewidth=1.5, label=f"Mean = {mu:.4f} s")

    # labels and title (user-specified)
    ax.set_xlabel("Round runtime (s)")
    ax.set_ylabel("Density")
    ax.set_title("Kunpeng 920 16 round normal distribution", fontsize=14, fontweight="bold")

    # stats textbox on the right (match style)
    stats = (
        f"n = {n}\n"
        f"mean = {mu:.6f} s\n"
        f"var(pop) = {var_pop:.6f}\n"
        f"std(pop) = {std_pop:.6f} s\n"
        f"var(sample) = {var_samp:.6f}\n"
        f"std(sample) = {std_samp:.6f} s\n"
        f"min = {mn:.6f} s\n"
        f"max = {mx:.6f} s"
    )

    ax.text(
        0.98,
        0.97,
        stats,
        transform=ax.transAxes,
        va="top",
        ha="right",
        fontsize=10,
        bbox={"boxstyle": "round,pad=0.45", "facecolor": "white", "alpha": 0.85, "edgecolor": "#94a3b8"},
    )

    ax.grid(axis="y", linestyle="--", alpha=0.3)
    ax.legend(loc="upper left")

    fig.tight_layout()
    fig.savefig(out_path, dpi=180)
    plt.close(fig)
    print("Saved:", out_path)


if __name__ == '__main__':
    main()
