import csv
import random
import os

# Set seed for reproducibility
random.seed(42)

# Paths
data_dir = "data/cpu_groups"
machines = ["zf_64", "zf_65", "zf_amd"]

# 12 emerging workloads (by workload_name only, benchmark is implicit from the data)
EMERGING_WORKLOADS = {
    "zstd",
    "rocksdb_cpu",
    "kv",
    "matmul",
    "jacobi",
    "RomeTS",
    "resnet50_training",
    "redis-benchmark",
    "tpcc",
    "bert_eval",
    "transformer_inference",
    "go_compiler",
}

NUM_ROUNDS = 16
NUM_BASIC_SAMPLE = 40
NUM_EMERGING_SAMPLE = 10

# ============================================================
# Step 1: Read one machine (zf_65) to determine workload keys
#         and classify basic vs emerging
# ============================================================
ref_path = os.path.join(data_dir, "zf_65", "zf_65.csv")
with open(ref_path, "r") as f:
    reader = csv.reader(f)
    ref_header = next(reader)
    ref_rows = list(reader)

basic_keys = []   # "benchmark.workload"
emerging_keys = []
for row in ref_rows:
    key = f"{row[0]}.{row[1]}"
    if row[1] in EMERGING_WORKLOADS:
        emerging_keys.append(key)
    else:
        basic_keys.append(key)

assert len(basic_keys) == 42, f"Expected 42 basic, got {len(basic_keys)}"
assert len(emerging_keys) == 12, f"Expected 12 emerging, got {len(emerging_keys)}"

# ============================================================
# Step 2: Generate 16 rounds of samples ONCE (by workload key)
#         All 3 machines will use the same selections
# ============================================================
round_samples = {}  # round_idx -> {"basic": set of keys, "emerging": set of keys}
all_sampled_keys = {"basic": set(), "emerging": set()}

for r in range(1, NUM_ROUNDS + 1):
    b_sample = set(random.sample(basic_keys, NUM_BASIC_SAMPLE))
    e_sample = set(random.sample(emerging_keys, NUM_EMERGING_SAMPLE))
    round_samples[r] = {"basic": b_sample, "emerging": e_sample}
    all_sampled_keys["basic"].update(b_sample)
    all_sampled_keys["emerging"].update(e_sample)

print("Sampled workload keys for each round (shared across all 3 machines):")
for r in range(1, NUM_ROUNDS + 1):
    print(f"  Round {r:2d}: {len(round_samples[r]['basic'])} basic + {len(round_samples[r]['emerging'])} emerging = 50")

# ============================================================
# Step 3: Apply the SAME samples to all 3 machines
# ============================================================
for machine in machines:
    input_path = os.path.join(data_dir, machine, f"{machine}.csv")
    machine_output_dir = os.path.join(data_dir, machine, "sampled")
    os.makedirs(machine_output_dir, exist_ok=True)

    with open(input_path, "r") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    # Build lookup: workload_key -> full row
    row_by_key = {}
    for row in rows:
        key = f"{row[0]}.{row[1]}"
        row_by_key[key] = row

    # Write per-round CSV files in original format (all 16 rounds of time+param)
    for r in range(1, NUM_ROUNDS + 1):
        output_path = os.path.join(machine_output_dir, f"round_{r:02d}.csv")
        with open(output_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(header)
            for key in sorted(round_samples[r]["basic"]):
                writer.writerow(row_by_key[key])
            for key in sorted(round_samples[r]["emerging"]):
                writer.writerow(row_by_key[key])

    # Write all_rounds_combined.csv (stacked format: round, benchmark, workload, time, param)
    combined_path = os.path.join(machine_output_dir, "all_rounds_combined.csv")
    with open(combined_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["round", "benchmark_name", "workload_name", "time", "param"])
        for r in range(1, NUM_ROUNDS + 1):
            time_col = 2 + (r - 1) * 2
            param_col = 2 + (r - 1) * 2 + 1
            for key in sorted(round_samples[r]["basic"]):
                row = row_by_key[key]
                writer.writerow([r, row[0], row[1], row[time_col], row[param_col]])
            for key in sorted(round_samples[r]["emerging"]):
                row = row_by_key[key]
                writer.writerow([r, row[0], row[1], row[time_col], row[param_col]])

    # sampling_summary.csv in original format (union of all sampled workloads)
    summary_path = os.path.join(machine_output_dir, "sampling_summary.csv")
    with open(summary_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for key in sorted(all_sampled_keys["basic"]):
            writer.writerow(row_by_key[key])
        for key in sorted(all_sampled_keys["emerging"]):
            writer.writerow(row_by_key[key])

    print(f"\n{machine}: {NUM_ROUNDS} round files + all_rounds_combined.csv + sampling_summary.csv -> {machine_output_dir}/")

# ============================================================
# Step 4: Verify cross-machine consistency
# ============================================================
print("\n=== Cross-machine consistency check ===")
for r in [1, 8, 16]:
    keys_per_machine = {}
    for machine in machines:
        path = os.path.join(data_dir, machine, "sampled", f"round_{r:02d}.csv")
        with open(path, "r") as f:
            reader = csv.DictReader(f)
            keys = set()
            for row in reader:
                keys.add(f"{row['benchmark_name']}.{row['workload_name']}")
            keys_per_machine[machine] = keys
    all_same = keys_per_machine["zf_64"] == keys_per_machine["zf_65"] == keys_per_machine["zf_amd"]
    print(f"  Round {r:2d}: {len(keys_per_machine['zf_64'])} workloads, all 3 machines identical = {all_same}")

print("\nDone!")
