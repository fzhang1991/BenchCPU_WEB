from __future__ import annotations

import argparse
import csv
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
CPU_GROUPS_DIR = DATA_DIR / "cpu_groups"
CPU_INDEX_FILE = DATA_DIR / "zf_all.csv"


def _normalize_key(raw: str) -> str:
    s = str(raw).strip().lower().replace(" ", "_")
    s = re.sub(r"[^a-z0-9_]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    if not s:
        return ""
    return s if s.startswith("zf_") else f"zf_{s}"


def _read_prefixes(index_file: Path) -> list[str]:
    if not index_file.exists():
        return []

    prefixes: list[str] = []
    with index_file.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw = (row.get("cpu_file_key") or "").strip()
            if not raw:
                continue
            prefix = _normalize_key(raw)
            if prefix and prefix not in prefixes:
                prefixes.append(prefix)
    return prefixes


def _find_flat_assets(prefix: str) -> list[Path]:
    assets: list[Path] = []
    if not DATA_DIR.exists():
        return assets

    for p in DATA_DIR.iterdir():
        if not p.is_file():
            continue
        if p.name.startswith(f"{prefix}.") or p.name.startswith(f"{prefix}_"):
            assets.append(p)
    return sorted(assets, key=lambda x: x.name)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Group CPU assets by machine key. Move files like zf_64*.csv/html/png/json "
            "from data/ into data/cpu_groups/zf_64/."
        )
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply file moves. Without this flag only preview is shown.",
    )
    args = parser.parse_args()

    prefixes = _read_prefixes(CPU_INDEX_FILE)
    if not prefixes:
        print("No cpu_file_key found in data/zf_all.csv, nothing to reorganize.")
        return 0

    planned_moves: list[tuple[Path, Path]] = []
    print("=== CPU Asset Reorganization Preview ===")
    for prefix in prefixes:
        assets = _find_flat_assets(prefix)
        if not assets:
            continue
        target_dir = CPU_GROUPS_DIR / prefix
        print(f"\n[{prefix}] -> {target_dir}")
        for src in assets:
            dst = target_dir / src.name
            if src.resolve() == dst.resolve():
                continue
            planned_moves.append((src, dst))
            print(f"  - {src.name}")

    if not planned_moves:
        print("\nNo flat CPU assets found that need moving.")
        return 0

    print(f"\nPlanned moves: {len(planned_moves)}")
    if not args.apply:
        print("Dry-run only. Re-run with --apply to move files.")
        return 0

    moved = 0
    for src, dst in planned_moves:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        moved += 1

    print(f"Moved {moved} files into grouped CPU directories under: {CPU_GROUPS_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
