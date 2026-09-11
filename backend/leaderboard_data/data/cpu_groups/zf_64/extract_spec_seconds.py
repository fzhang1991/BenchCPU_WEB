#!/usr/bin/env python3
"""Extract per-benchmark Seconds (runtime) values from SPEC CPU2017 HTML reports.

For each benchmark row in the base results table, every run's Seconds value is
captured. The cell marked with the CSS class "selected" (rendered bold +
underlined) is the median / final reported measurement.

Reads all zf_65_spec*.html files in this directory and writes a CSV summary to
zf_65_spec_seconds.csv. Original HTML files are left untouched.
"""
import csv
import glob
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))

# Auto-discover the SPEC HTML reports (e.g. zf_64_specratefp.html) in this
# directory, so the same script works for any zf_XX group.
SPEC_FILES = sorted(
    os.path.basename(p) for p in glob.glob(os.path.join(HERE, "*_spec*.html"))
)


def strip_tags(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s).strip()


def parse_file(path: str):
    with open(path, "r", encoding="utf-8") as fh:
        html = fh.read()

    base = os.path.splitext(os.path.basename(path))[0]
    m = re.search(r"(spec[a-z]+)$", base)
    suite = m.group(1) if m else base

    # Several <tbody> blocks exist; the results table is the one whose rows
    # carry benchmark cells (<td class="bm">).
    tbodies = re.findall(r"<tbody\b[^>]*>(.*?)</tbody>", html, re.DOTALL | re.IGNORECASE)
    tbody = next(
        (
            t
            for t in tbodies
            if re.search(r'class="[^"]*\bbm\b[^"]*"', t, re.IGNORECASE)
        ),
        None,
    )
    rows = []
    if not tbody:
        return suite, rows

    for tr in re.findall(r"<tr\b[^>]*>(.*?)</tr>", tbody, re.DOTALL | re.IGNORECASE):
        bm_m = re.search(
            r'<td\b[^>]*class="[^"]*\bbm\b[^"]*"[^>]*>.*?<a[^>]*>([^<]+)</a>',
            tr,
            re.DOTALL | re.IGNORECASE,
        )
        if not bm_m:
            continue
        benchmark = bm_m.group(1).strip()

        # Base result Seconds cells: class "basecol time l_edge" plus optional
        # " selected" (the median / final value).
        time_cells = re.findall(
            r'<td\b[^>]*class="([^"]*\bbasecol\b[^"]*\btime\b[^"]*\bl_edge\b[^"]*)"[^>]*>(.*?)</td>',
            tr,
            re.DOTALL | re.IGNORECASE,
        )
        seconds = []
        for classes, content in time_cells:
            value = strip_tags(content)
            if value == "":
                continue  # skip empty run slots
            seconds.append(
                (value, bool(re.search(r"\bselected\b", classes, re.IGNORECASE)))
            )

        # Final = the cell flagged "selected" (bold + underlined median).
        final = next((v for v, sel in seconds if sel), None)

        rows.append(
            {
                "benchmark": benchmark,
                "runs": [v for v, _ in seconds],
                "flags": [sel for _, sel in seconds],
                "final": final,
            }
        )
    return suite, rows


def main():
    all_rows = []
    for fname in SPEC_FILES:
        path = os.path.join(HERE, fname)
        suite, rows = parse_file(path)
        for r in rows:
            all_rows.append((suite, r))

    prefix = SPEC_FILES[0].split("_spec", 1)[0] if SPEC_FILES else "spec"
    out_path = os.path.join(HERE, f"{prefix}_spec_seconds.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            ["suite", "benchmark", "seconds_run_1", "seconds_run_2",
             "seconds_run_3", "final_seconds"]
        )
        for suite, r in all_rows:
            runs = r["runs"] + [""] * (3 - len(r["runs"]))
            writer.writerow([suite, r["benchmark"], *runs[:3], r["final"]])

    # Print a readable summary.
    for suite, r in all_rows:
        runs_str = ", ".join(
            f"{v}{'*' if sel else ''}" for v, sel in zip(r["runs"], r["flags"])
        )
        print(f"[{suite}] {r['benchmark']:>18}  runs: {runs_str:28} final: {r['final']}")

    print(f"\nWrote {len(all_rows)} rows -> {out_path}")


if __name__ == "__main__":
    main()
