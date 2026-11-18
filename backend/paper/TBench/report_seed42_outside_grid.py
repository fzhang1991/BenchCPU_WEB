import csv
import json
from collections import defaultdict
from pathlib import Path

from analyze_ratio_effects import build_pairs, load_grid
from boxplot_ln_65_over_64_ordered_appendix import (
    APPENDIX_WORKLOAD_ORDER,
    ZF_64,
    ZF_65,
    canonicalize_workload_key,
    read_csv_rows,
)


HERE = Path(__file__).resolve().parent
OUTPUT = HERE / "seed42_outside_grid_runtime_ranges.csv"


def format_grid_params(row: dict) -> str:
    values = [
        f"data_size={row['data_size']}",
        f"threads={row['threads']}",
    ]
    if row["compiler"] is not None:
        values.append(f"compiler={row['compiler']}")
    if row["optimization"] is not None:
        values.append(f"optimization={row['optimization']}")
    return "; ".join(values)


def build_grid_boundaries() -> dict[str, dict[str, list[dict]]]:
    grouped: dict[str, dict[str, list[dict]]] = {
        "64": defaultdict(list),
        "65": defaultdict(list),
    }
    for row in build_pairs(load_grid()):
        workload = canonicalize_workload_key(row["workload"])
        for machine, time_key in (("64", "time_64"), ("65", "time_65")):
            grouped[machine][workload].append(
                {
                    "runtime": row[time_key],
                    "params": format_grid_params(row),
                    "config_index": row["config_index"],
                }
            )
    return grouped


def seed_param(row: dict[str, str], round_index: int) -> str:
    return row[f"round_{round_index}_param"].strip()


def main() -> None:
    seed_paths = {"64": ZF_64, "65": ZF_65}
    grid_boundaries = build_grid_boundaries()
    output_rows: list[list[object]] = []

    for machine, seed_path in seed_paths.items():
        seed_rows = {
            canonicalize_workload_key(
                f"{row['benchmark_name']}.{row['workload_name']}"
            ): row
            for row in read_csv_rows(seed_path)
        }
        for workload in APPENDIX_WORKLOAD_ORDER:
            grid_values = grid_boundaries[machine][workload]
            grid_min = min(grid_values, key=lambda item: item["runtime"])
            grid_max = max(grid_values, key=lambda item: item["runtime"])
            row = seed_rows[workload]
            for round_index in range(1, 17):
                seed_runtime = float(row[f"round_{round_index}_time"])
                if seed_runtime < grid_min["runtime"]:
                    direction = "below_grid_min"
                elif seed_runtime > grid_max["runtime"]:
                    direction = "above_grid_max"
                else:
                    continue
                output_rows.append(
                    [
                        machine,
                        workload,
                        round_index,
                        direction,
                        seed_runtime,
                        seed_param(row, round_index),
                        grid_min["runtime"],
                        grid_min["config_index"],
                        grid_min["params"],
                        grid_max["runtime"],
                        grid_max["config_index"],
                        grid_max["params"],
                    ]
                )

    with OUTPUT.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(
            [
                "machine",
                "workload",
                "seed_round",
                "direction",
                "seed_runtime_s",
                "seed_params",
                "grid_min_runtime_s",
                "grid_min_config_index",
                "grid_min_params",
                "grid_max_runtime_s",
                "grid_max_config_index",
                "grid_max_params",
            ]
        )
        writer.writerows(output_rows)

    print(f"Saved {OUTPUT}")
    for machine in ("64", "65"):
        rows = [row for row in output_rows if row[0] == machine]
        print(f"machine {machine}: {len(rows)} seed rounds outside grid range")


if __name__ == "__main__":
    main()