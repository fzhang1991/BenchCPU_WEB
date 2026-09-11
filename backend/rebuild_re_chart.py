from __future__ import annotations

import csv
import re
from pathlib import Path
from statistics import mean, stdev

ROOT = Path(__file__).resolve().parent.parent
CPU_GROUPS = ROOT / "backend" / "leaderboard_data" / "data" / "cpu_groups"
OUT = ROOT / "frontend" / "public" / "rse_chart.svg"

T95 = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    11: 2.201,
    12: 2.179,
    13: 2.160,
    14: 2.145,
    15: 2.131,
    16: 2.120,
    17: 2.110,
    18: 2.101,
    19: 2.093,
    20: 2.086,
    21: 2.080,
    22: 2.074,
    23: 2.069,
    24: 2.064,
    25: 2.060,
    26: 2.056,
    27: 2.052,
    28: 2.048,
    29: 2.045,
    30: 2.042,
}

SERIES = {
    "Xeon Gold 5120T": CPU_GROUPS / "zf_64" / "zf_64.csv",
    "Kunpeng 920": CPU_GROUPS / "zf_65" / "zf_65.csv",
    "EPYC 7543": CPU_GROUPS / "zf_amd" / "zf_amd.csv",
}

COLORS = {
    "Xeon Gold 5120T": "#2196F3",
    "Kunpeng 920": "#4CAF50",
    "EPYC 7543": "#FF9800",
}


def t_critical_95(df: int) -> float:
    if df <= 1:
        return T95[1]
    if df <= 30:
        return T95[df]
    if df <= 40:
        return 2.021
    if df <= 60:
        return 2.000
    if df <= 120:
        return 1.980
    return 1.960


def round_columns(headers: list[str]) -> list[str]:
    cols = [
        h
        for h in headers
        if re.fullmatch(r"round_\d+_time", str(h))
        or re.fullmatch(r"Round\d+ Time \(s\)", str(h))
    ]

    def key(col: str) -> int:
        match = re.search(r"(?:round_|Round)(\d+)", col)
        return int(match.group(1)) if match else 999

    return sorted(cols, key=key)


def row_label(row: dict[str, str]) -> str:
    return str(row.get("workload_name") or row.get("Workload") or row.get("workload") or "").strip()


def average_round_values(csv_path: Path) -> list[float]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    cols = round_columns(list(rows[0].keys()))

    avg_row = next((row for row in rows if row_label(row) == "AVG_round"), None)
    if avg_row is not None:
        return [float(avg_row[col]) for col in cols]

    values: list[float] = []
    for col in cols:
        nums = [float(row[col]) for row in rows if row.get(col)]
        values.append(sum(nums) / len(nums))
    return values


def cumulative_re(values: list[float]) -> list[float]:
    out: list[float] = []
    for n in range(2, len(values) + 1):
        arr = values[:n]
        mu = mean(arr)
        sigma = stdev(arr)
        half_width = t_critical_95(n - 1) * sigma / (n ** 0.5)
        out.append(100.0 * half_width / mu)
    return out


def render_svg(series: dict[str, list[float]]) -> str:
    width, height = 760, 420
    margin_left, margin_top, margin_right, margin_bottom = 70, 28, 70, 55
    x0, y0 = margin_left, height - margin_bottom
    x1, y1 = width - margin_right, margin_top
    ymax = 35.0
    plot_w = x1 - x0
    plot_h = y0 - y1

    def px(n: int) -> float:
        return x0 + (n - 2) * plot_w / 14.0

    def py(v: float) -> float:
        return y0 - (v / ymax) * plot_h

    parts: list[str] = []
    parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" style="font-family:Arial">')
    parts.append(f'<rect width="{width}" height="{height}" fill="white"/>')
    parts.append(f'<text x="{width/2:.1f}" y="18" text-anchor="middle" font-size="14" font-weight="bold">BenchCPU: RE vs Accumulated Rounds</text>')

    for tick in range(0, 36, 5):
        y = py(float(tick))
        parts.append(f'<line x1="{x0}" y1="{y:.1f}" x2="{x1}" y2="{y:.1f}" stroke="#e5e7eb" stroke-width="1"/>')
        parts.append(f'<line x1="{x0-5}" y1="{y:.1f}" x2="{x0}" y2="{y:.1f}" stroke="#333"/>')
        parts.append(f'<text x="{x0-8}" y="{y+4:.1f}" text-anchor="end" font-size="10">{tick}%</text>')

    y_thresh = py(10.0)
    parts.append(f'<line x1="{x0}" y1="{y_thresh:.1f}" x2="{x1}" y2="{y_thresh:.1f}" stroke="red" stroke-width="1.2" stroke-dasharray="6,4" opacity="0.8"/>')
    parts.append(f'<text x="{x1+6}" y="{y_thresh+4:.1f}" font-size="10" fill="red">RE=10%</text>')

    for mark in (4,):
        x = px(mark)
        parts.append(f'<line x1="{x:.1f}" y1="{y1}" x2="{x:.1f}" y2="{y0}" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4,4" opacity="0.7"/>')
        parts.append(f'<text x="{x+4:.1f}" y="{y1+12}" font-size="10" fill="#6b7280">n={mark}</text>')

    parts.append(f'<line x1="{x0}" y1="{y1}" x2="{x0}" y2="{y0}" stroke="#333" stroke-width="1.5"/>')
    parts.append(f'<line x1="{x0}" y1="{y0}" x2="{x1}" y2="{y0}" stroke="#333" stroke-width="1.5"/>')

    for n in range(2, 17):
        parts.append(f'<text x="{px(n):.1f}" y="{y0+18}" text-anchor="middle" font-size="10">{n}</text>')

    parts.append(f'<text x="{(x0+x1)/2:.1f}" y="{height-18}" text-anchor="middle" font-size="11">Accumulated rounds n</text>')
    parts.append(f'<text transform="translate(20 {(y0+y1)/2:.1f}) rotate(-90)" text-anchor="middle" font-size="11">Relative Error (RE)</text>')

    for name, values in series.items():
        points = " ".join(f"{px(i+2):.1f},{py(v):.1f}" for i, v in enumerate(values))
        color = COLORS[name]
        parts.append(f'<polyline fill="none" stroke="{color}" stroke-width="2" points="{points}"/>')
        for i, v in enumerate(values):
            parts.append(f'<circle cx="{px(i+2):.1f}" cy="{py(v):.1f}" r="3" fill="{color}"/>')

    legend_y = 52
    for idx, (name, color) in enumerate(COLORS.items()):
        y = legend_y + idx * 18
        parts.append(f'<circle cx="{x1-115}" cy="{y}" r="4" fill="{color}"/>')
        parts.append(f'<text x="{x1-103}" y="{y+4}" font-size="10">{name}</text>')

    parts.append('</svg>')
    return "".join(parts)


def main() -> None:
    computed = {name: cumulative_re(average_round_values(path)) for name, path in SERIES.items()}
    OUT.write_text(render_svg(computed), encoding="utf-8")
    for name, values in computed.items():
        print(name, "n=5", round(values[3], 4))
        print(name, ", ".join(f"{i+2}:{v:.4f}" for i, v in enumerate(values)))
    print(f"Saved: {OUT}")


if __name__ == "__main__":
    main()
