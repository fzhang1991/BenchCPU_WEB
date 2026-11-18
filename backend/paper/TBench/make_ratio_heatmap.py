# -*- coding: utf-8 -*-
"""
Build faceted heatmaps of the 64-vs-65 elapsed-time ratio over the full 924-config grid.

Key insight used here: the benchmark writes one checkpoint CSV per "step" of the
sweep, and every checkpoint file advances ALL workloads by exactly one config in
grid order.  So the file index N (in `results_grid_configurations_924_N_*.csv`)
IS the 1-based config index within each workload's ordered list in
grid_configurations_924.json.  This lets us recover the compiler (clang/gcc) and
optimization (O1/O2/O3) dimensions that the CSV's param_overrides does not record.
(Verified: 863 rows, 0 mismatches against size/threads/opt.)

Outputs:
  - heatmap_ratio_data.csv    full-granularity ratio table (compiler/opt recovered)
  - heatmap_ratio_noncpp.png  one 2x3 tile per non-C/C++ workload (size x threads)
  - heatmap_ratio_cpp.png     one 4x9 tile per C/C++ workload (size*compiler x threads*opt)
"""
import glob, csv, re, json, math
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm

ROOT = "."
GRID = "grid_configurations_924.json"

# ---------------------------------------------------------------- grid parsing
def parse_cfg(cfg_list):
    """Return (size_value, threads, compiler, opt, size_key) for one grid config."""
    size = threads = None
    compiler = opt = size_key = None
    for p in cfg_list:
        key = p.rsplit(".", 1)[-1].split("=", 1)[0]
        val = p.split("=", 1)[1]
        if key == "threads":
            threads = int(val)
        elif key == "compiler":
            compiler = val
        elif key == "opt":
            opt = val
        else:
            size = int(val)
            size_key = key
    return size, threads, compiler, opt, size_key


def load_grid():
    g = json.load(open(GRID))
    workloads = []
    for w in g["workload_configurations"]:
        cfgs = [parse_cfg(c) for c in w["configurations"]]
        workloads.append({
            "workload": w["workload"],
            "is_cpp": w["is_cpp"],
            "cfgs": cfgs,
            # distinct size values in order of appearance
            "sizes": [c[0] for c in cfgs[:: max(1, len(cfgs) // 2)][:2]],
        })
        # dedupe sizes preserving order
        seen, sizes = set(), []
        for c in cfgs:
            if c[0] not in seen:
                seen.add(c[0]); sizes.append(c[0])
        workloads[-1]["sizes"] = sizes
    return workloads


# ---------------------------------------------------------------- results parse
def file_index(path):
    return int(re.search(r"_924_(\d+)_", path).group(1))


def load_times(machine):
    """Return dict {(workload, config_index_1based): elapsed_time}."""
    out = {}
    for f in glob.glob(f"{ROOT}/data/{machine}/results_grid_configurations_924_*.csv"):
        idx = file_index(f)
        with open(f) as fh:
            for row in csv.DictReader(fh):
                wl = row["benchmark_name"] + "." + row["workload_name"]
                t = float(row["elapsed_time(s)"])
                if t > 0:
                    out[(wl, idx)] = t
    return out


# ---------------------------------------------------------------- helpers
def abbrev(n):
    if n >= 1e6:
        return f"{n/1e6:.1f}M" if n % 1e6 else f"{int(n/1e6)}M"
    if n >= 1e3:
        return f"{n/1e3:.0f}K" if n % 1e3 == 0 else f"{n/1e3:.1f}K"
    return str(int(n))


def short_name(wl):
    """Compact facet title: strip the benchmark prefix where redundant."""
    return wl  # keep full dotted name; matplotlib will wrap as needed


# ---------------------------------------------------------------- build ratio matrices
def build():
    workloads = load_grid()
    t64 = load_times("64")
    t65 = load_times("65")

    rows = []  # for CSV
    facets = []  # for plotting
    for w in workloads:
        wl = w["workload"]
        n = len(w["cfgs"])
        if w["is_cpp"]:
            # 36 configs -> matrix 4 (size x compiler) x 9 (threads x opt)
            mat = np.full((4, 9), np.nan)
            for ci, (size, thr, comp, opt, _) in enumerate(w["cfgs"], 1):
                s_idx = w["sizes"].index(size)          # 0 or 1
                c_idx = 0 if comp == "clang" else 1
                t_idx = {1: 0, 32: 1, 64: 2}[thr]
                o_idx = {"O1": 0, "O2": 1, "O3": 2}[opt]
                r, c = s_idx * 2 + c_idx, t_idx * 3 + o_idx
                if (wl, ci) in t64 and (wl, ci) in t65:
                    mat[r, c] = t64[(wl, ci)] / t65[(wl, ci)]
                    rows.append([wl, ci, size, thr, comp, opt,
                                 t64[(wl, ci)], t65[(wl, ci)], mat[r, c]])
            facets.append((wl, w["is_cpp"], mat, w["sizes"]))
        else:
            # 6 configs -> matrix 2 (size) x 3 (threads)
            mat = np.full((2, 3), np.nan)
            for ci, (size, thr, comp, opt, _) in enumerate(w["cfgs"], 1):
                s_idx = w["sizes"].index(size)
                t_idx = {1: 0, 32: 1, 64: 2}[thr]
                if (wl, ci) in t64 and (wl, ci) in t65:
                    mat[s_idx, t_idx] = t64[(wl, ci)] / t65[(wl, ci)]
                    rows.append([wl, ci, size, thr, comp, opt,
                                 t64[(wl, ci)], t65[(wl, ci)], mat[s_idx, t_idx]])
            facets.append((wl, w["is_cpp"], mat, w["sizes"]))

    with open("heatmap_ratio_data.csv", "w", newline="") as fh:
        wcsv = csv.writer(fh)
        wcsv.writerow(["workload", "config_index", "size", "threads", "compiler",
                       "opt", "time_64", "time_65", "ratio_64_over_65"])
        for r in sorted(rows, key=lambda x: (x[0], x[1])):
            wcsv.writerow([r[0], r[1], r[2], r[3], r[4], r[5],
                           round(r[6], 4), round(r[7], 4), round(r[8], 6)])
    return facets


# ---------------------------------------------------------------- plotting
CMAP = LinearSegmentedColormap.from_list("ratio_div", [
    "#1c5cab", "#2a78d6", "#6da7ec", "#b7d3f6", "#f0efec",
    "#f3b7b4", "#e97d7b", "#e34948", "#c2312e",
])
CMAP.set_bad("#e2e2e0")  # blank cells (no data on one machine)

VMAX = 6.5  # log2 scale, symmetric; ratio 1/64 .. 64
NORM = TwoSlopeNorm(vmin=-VMAX, vcenter=0.0, vmax=VMAX)


def annotate_cell(ax, i, j, ratio):
    v = math.log2(ratio)
    txt = f"{ratio:.2g}"
    color = "#ffffff" if abs(v) > 1.3 else "#1a1a1a"
    ax.text(j, i, txt, ha="center", va="center", fontsize=6, color=color)


def draw_facet(ax, wl, is_cpp, mat, sizes):
    # color axis is log2; the matrix holds raw ratios, so transform before display
    disp = np.full_like(mat, np.nan, dtype=float)
    mask = ~np.isnan(mat)
    disp[mask] = np.log2(mat[mask])
    ax.imshow(disp, cmap=CMAP, norm=NORM, aspect="equal", interpolation="nearest")
    # annotate data cells
    for i in range(mat.shape[0]):
        for j in range(mat.shape[1]):
            if not np.isnan(mat[i, j]):
                annotate_cell(ax, i, j, mat[i, j])
    # grid lines (thin, recessive)
    for x in np.arange(-0.5, mat.shape[1], 1):
        ax.axvline(x, color="white", lw=0.5)
    for y in np.arange(-0.5, mat.shape[0], 1):
        ax.axhline(y, color="white", lw=0.5)

    if is_cpp:
        # y: size x compiler (4 rows)
        ax.set_yticks([0, 1, 2, 3])
        ax.set_yticklabels([f"{abbrev(sizes[0])}·clang", f"{abbrev(sizes[0])}·gcc",
                            f"{abbrev(sizes[1])}·clang", f"{abbrev(sizes[1])}·gcc"],
                           fontsize=6)
        # x: threads x opt (9 cols)
        ax.set_xticks(range(9))
        ax.set_xticklabels(["1·O1", "1·O2", "1·O3",
                            "32·O1", "32·O2", "32·O3",
                            "64·O1", "64·O2", "64·O3"],
                           fontsize=6, rotation=45, ha="right")
    else:
        ax.set_yticks([0, 1])
        ax.set_yticklabels([abbrev(sizes[0]), abbrev(sizes[1])], fontsize=7)
        ax.set_xticks([0, 1, 2])
        ax.set_xticklabels(["1", "32", "64"], fontsize=7)

    ax.set_title(wl.replace("_", " "), fontsize=8, pad=3)
    ax.tick_params(length=0)
    for s in ax.spines.values():
        s.set_color("#c3c2b7"); s.set_linewidth(0.5)


def make_figure(facets, ncols, title, outpath):
    facets = sorted(facets, key=lambda f: f[0])
    nrows = math.ceil(len(facets) / ncols)
    if facets and facets[0][1]:  # cpp tiles are 4x9 -> wider fig
        fig, axes = plt.subplots(nrows, ncols, figsize=(ncols * 3.4, nrows * 2.2))
    else:
        fig, axes = plt.subplots(nrows, ncols, figsize=(ncols * 2.2, nrows * 2.2))
    axes = np.atleast_2d(axes)
    for ax in axes.ravel():
        ax.set_visible(False)
    for k, (wl, is_cpp, mat, sizes) in enumerate(facets):
        ax = axes[k // ncols, k % ncols]
        ax.set_visible(True)
        draw_facet(ax, wl, is_cpp, mat, sizes)
    # colorbar in reserved bottom strip; blue/red meaning folded into the title
    cbar = fig.colorbar(plt.cm.ScalarMappable(norm=NORM, cmap=CMAP),
                        ax=axes.ravel().tolist(), orientation="horizontal",
                        fraction=0.03, pad=0.03, aspect=40, shrink=0.7)
    cbar.set_ticks([-6, -4, -2, 0, 2, 4, 6])
    cbar.set_ticklabels(["1/64", "1/16", "1/4", "1", "4", "16", "64"], fontsize=8)
    cbar.set_label("ratio = time(64) ÷ time(65)   (log₂ scale)", fontsize=9)
    fig.suptitle(title + "\nblue = 64 faster · red = 65 faster · gray = not yet run",
                 fontsize=12, y=0.998)
    fig.tight_layout(rect=[0, 0.10, 1, 0.965])
    fig.savefig(outpath, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"saved {outpath} ({len(facets)} facets)")


def main():
    facets = build()
    noncpp = [f for f in facets if not f[1]]
    cpp = [f for f in facets if f[1]]
    make_figure(noncpp, 6, "Non-C/C++ workloads — 64/65 elapsed-time ratio (size × threads)",
                "heatmap_ratio_noncpp.png")
    make_figure(cpp, 5, "C/C++ workloads — 64/65 elapsed-time ratio (size·compiler × threads·opt)",
                "heatmap_ratio_cpp.png")
    print("saved heatmap_ratio_data.csv")


if __name__ == "__main__":
    main()
