import csv
import math
from collections import defaultdict

# Paths
data_dir = "data/cpu_groups"
machines = ["zf_64", "zf_65", "zf_amd"]

def mean(values):
    return sum(values) / len(values)

def std(values, mean_val):
    return math.sqrt(sum((x - mean_val) ** 2 for x in values) / (len(values) - 1))

def median(values):
    s = sorted(values)
    n = len(s)
    if n % 2 == 1:
        return s[n // 2]
    else:
        return (s[n // 2 - 1] + s[n // 2]) / 2

# t-critical value for 99% CI with df=15 (two-tailed)
T_CRITICAL_99 = 2.9467  # t_{0.005, 15}

print("=" * 90)
print(f"Per-round mean of 50 workloads -> 99% CI & Median of 16 round-means")
print(f"t-critical (99% CI, df=15) = {T_CRITICAL_99}")
print("=" * 90)

all_machine_means = {}  # machine -> list of 16 round means

for machine in machines:
    combined_path = f"{data_dir}/{machine}/sampled/all_rounds_combined.csv"

    round_times = defaultdict(list)
    with open(combined_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            r = int(row["round"])
            t = float(row["time"])
            round_times[r].append(t)

    round_means = []
    for r in range(1, 17):
        times = round_times[r]
        assert len(times) == 50, f"Round {r} has {len(times)} workloads (expected 50)"
        round_means.append(mean(times))

    all_machine_means[machine] = round_means

    overall_mean = mean(round_means)
    overall_std = std(round_means, overall_mean)
    sem = overall_std / math.sqrt(16)
    margin = T_CRITICAL_99 * sem
    ci_lower = overall_mean - margin
    ci_upper = overall_mean + margin
    med = median(round_means)

    print(f"\n--- {machine} ---")
    print(f"{'Round':<10} {'Mean':>12}")
    print(f"{'-'*24}")
    for i, m in enumerate(round_means, 1):
        print(f"  {i:<8} {m:>12.4f}")
    print(f"{'-'*24}")
    print(f"  {'Median':<8} {med:>12.4f}")
    print(f"  {'Avg':<8} {overall_mean:>12.4f}")
    print(f"  {'Std':<8} {overall_std:>12.4f}")
    print(f"  {'SEM':<8} {sem:>12.4f}")
    print(f"  {'99% CI':<8} [{ci_lower:.4f}, {ci_upper:.4f}]")

print("\nDone!")
