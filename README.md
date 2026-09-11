## Environment Setup

- node: version 20 (`nvm use 20`)
- Python: FastAPI

## Start Commands

- Frontend: in `/frontend` run `npm i react-plotly.js plotly.js` and `npm install`, then run `npm run dev`
- Backend: in `/backend` run `launch.ps1` <!--powershell-->

## BenchCPU Data Naming Convention

BenchCPU now uses automatic file discovery based on `backend/leaderboard_data/data/zf_all.csv`.

- Required index file columns:
	- `cpu_name`: display name shown in leaderboard
	- `time`: value used by BenchCPU leaderboard
	- `cpu_file_key`: file key used to resolve CPU-specific artifacts
- Expected file names for each CPU:
	- `zf_<cpu_file_key>.csv`
	- `zf_<cpu_file_key>_system_info.json`
	- `zf_<cpu_file_key>.png` (preferred)
	- Compatible fallback plot names: `zf_<cpu_file_key>_workload_distribution.png`, `zf_<cpu_file_key>_avg_round_normal.png`, `zf_<cpu_file_key>_normal_plot.png`

### Add a New CPU

1. Append one row into `zf_all.csv` with `cpu_name,time,cpu_file_key`.
2. Add `zf_<cpu_file_key>.csv` into `backend/leaderboard_data/data/`.
3. Add `zf_<cpu_file_key>_system_info.json` into `backend/leaderboard_data/data/`.
4. Add one plot PNG named `zf_<cpu_file_key>.png`.

After restarting backend, CPU filters and CPU detail APIs will pick up the new CPU automatically.

## Data File Cleanup (Safe Archive)

If `backend/leaderboard_data/data` starts to accumulate historical exports, you can archive files that are not used by the current app data-loading conventions.

- Preview only (no file changes):

```bash
cd backend
python leaderboard_data/cleanup_data_files.py
```

- Apply archive move:

```bash
cd backend
python leaderboard_data/cleanup_data_files.py --apply
```

Unused files are moved into `backend/leaderboard_data/archive/<timestamp>/...`, so rollback is straightforward.

## CPU Data Organization (Group by Machine)

When one machine has many files (for example `zf_64*.csv/json/png/html`), use grouped folders:

```text
backend/leaderboard_data/data/
	zf_all.csv
	cpu_groups/
		zf_64/
			zf_64.csv
			zf_64_system_info.json
			zf_64.png
			zf_64_specspeedint.html
			zf_64_specspeedfp.html
			zf_64_specrateint.html
			zf_64_specratefp.html
		zf_65/
			...
```

Backend now supports both layouts simultaneously:

- legacy flat layout under `data/`
- grouped layout under `data/cpu_groups/<cpu_file_key>/`

You can migrate existing flat files with:

```bash
cd backend
python leaderboard_data/reorganize_cpu_assets.py
python leaderboard_data/reorganize_cpu_assets.py --apply
```

The first command is dry-run preview; the second actually moves files.
