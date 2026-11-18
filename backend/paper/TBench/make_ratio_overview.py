# -*- coding: utf-8 -*-
"""
One-figure overview of the 64-vs-65 elapsed-time ratio for all 54 workloads.

Each workload is one row, sorted by its median ratio. Every completed config is
plotted as its own point (small), with the median overlaid as a larger marker.
Points are colored on the same diverging blue<->red scale: blue = machine 64
faster, red = machine 65 faster. Marker shape carries C++ vs non-C++ (square vs
circle). (C/C++ configs 1..6 are all threads=1, so their spread reflects
compiler/opt sensitivity, not thread scaling.)

Outputs:
  - heatmap_ratio_overview.png  sorted point plot of all 54 workloads
  - overview_ratio_summary.csv  per-workload min/median/max ratio + config count
"""
import glob, csv, re, json, math
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm
from matplotlib.lines import Line2D

ROOT = "."
GRID = "grid_configurations_924.json"


def load_grid():
    g = json.load(open(GRID))
    return [{"workload": w["workload"], "is_cpp": w["is_cpp"]}
            for w in g["workload_configurations"]]


def file_index(path):
    return int(re.search(r"_924_(\d+)_", path).group(1))


def load_ratios():
    times = {m: {} for m in ("64", "65")}
    for m in times:
        for f in glob.glob(f"{ROOT}/data/{m}/results_grid_configurations_924_*.csv"):
            idx = file_index(f)
            with open(f) as fh:
                for row in csv.DictReader(fh):
                    wl = row["benchmark_name"] + "." + row["workload_name"]
                    t = float(row["elapsed_time(s)"])
                    if t > 0:
                        times[m][(wl, idx)] = t
    ratios = {}
    for k, t64 in times["64"].items():
        if k in times["65"] and times["65"][k] > 0:
            ratios[k] = t64 / times["65"][k]
    return ratios


CMAP = LinearSegmentedColormap.from_list("ratio_div", [
    "#1c5cab", "#2a78d6", "#6da7ec", "#b7d3f6", "#f0efec",
    "#f3b7b4", "#e97d7b", "#e34948", "#c2312e"])
VMAX = 6.5  # log2 scale; ratio 1/64 .. 64
NORM = TwoSlopeNorm(vmin=-VMAX, vcenter=0.0, vmax=VMAX)


def short_names(rows):
    by_short = {}
    for r in rows:
        by_short.setdefault(r["wl"].rsplit(".", 1)[-1], []).append(r["wl"])
    return [r["wl"] if len(by_short[r["wl"].rsplit(".", 1)[-1]]) > 1
            else r["wl"].rsplit(".", 1)[-1] for r in rows]


def main():
    grid = load_grid()
    ratios = load_ratios()

    per = {w["workload"]: {"is_cpp": w["is_cpp"], "vals": []} for w in grid}
    for (wl, idx), r in ratios.items():
        if wl in per:
            per[wl]["vals"].append(r)

    rows = []
    for wl, d in per.items():
        vals = sorted(d["vals"])
        if not vals:
            continue
        rows.append({"wl": wl, "is_cpp": d["is_cpp"], "vals": vals,
                     "med": float(np.median(vals)),
                     "lo": min(vals), "hi": max(vals), "n": len(vals)})
    rows.sort(key=lambda r: r["med"])

    with open("overview_ratio_summary.csv", "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["workload", "is_cpp", "n_configs",
                    "min_ratio", "median_ratio", "max_ratio"])
        for r in rows:
            w.writerow([r["wl"], r["is_cpp"], r["n"],
                        round(r["lo"], 6), round(r["med"], 6), round(r["hi"], 6)])

    n = len(rows)
    names = short_names(rows)
    fig, ax = plt.subplots(figsize=(9.6, max(8.0, n * 0.30)))
    for i, r in enumerate(rows):
        xs = [math.log2(v) for v in r["vals"]]
        marker = "s" if r["is_cpp"] else "o"
        # one point per completed config
        ax.scatter(xs, [i] * len(xs), c=[CMAP(NORM(x)) for x in xs], s=24,
                   marker=marker, edgecolors="none", zorder=3, alpha=0.9)
        # median overlaid, larger + ring (the sort anchor)
        mx = math.log2(r["med"])
        ax.scatter([mx], [i], c=[CMAP(NORM(mx))], s=72, marker=marker,
                   edgecolors="#0b0b0b", linewidths=0.8, zorder=4)
        # median value as a right-aligned column, just outside the axes
        ax.text(1.012, i, f"{r['med']:.2g}", va="center", ha="left",
                transform=ax.get_yaxis_transform(), fontsize=6.5, color="#52514e")

    ax.axvline(0, color="#0b0b0b", lw=0.8, ls="--", zorder=2)
    ax.set_yticks(range(n))
    ax.set_yticklabels(names, fontsize=6.5)
    ax.tick_params(axis="y", length=0)
    ax.set_xticks([-6, -4, -2, 0, 2, 4, 6])
    ax.set_xticklabels(["1/64", "1/16", "1/4", "1", "4", "16", "64"], fontsize=8)
    ax.set_xlim(-7.4, 7.4)
    ax.set_ylim(-0.6, n - 0.4)
    ax.set_xlabel("ratio = time(64) ÷ time(65)   (log₂ axis)", fontsize=9)

    handles = [
        Line2D([], [], marker="o", ls="", color="#52514e", markersize=7,
               label="non-C/C++"),
        Line2D([], [], marker="s", ls="", color="#52514e", markersize=7,
               label="C/C++"),
    ]
    ax.legend(handles=handles, loc="lower left", fontsize=8, frameon=False)

    for s in ax.spines.values():
        s.set_color("#c3c2b7"); s.set_linewidth(0.5)
    ax.set_title("64 vs 65 elapsed-time ratio — 54 workloads, sorted by median\n"
                 "one point per config · large marker = median · blue = 64 faster · red = 65 faster · square = C/C++",
                 fontsize=10, loc="left", pad=8)

    fig.tight_layout()
    fig.savefig("heatmap_ratio_overview.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"saved heatmap_ratio_overview.png ({n} workloads)")
    print("saved overview_ratio_summary.csv")


if __name__ == "__main__":
    main()
