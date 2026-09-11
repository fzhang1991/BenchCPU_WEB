from __future__ import annotations

import json
from pathlib import Path

TRANSCRIPT_ARGS = Path(r"C:/Users/lenovo/AppData/Local/Temp/page_patch_args.txt")
ADD_ZH = Path(r"C:/Users/lenovo/AppData/Local/Temp/add_zh_line.txt")
ADD_EN = Path(r"C:/Users/lenovo/AppData/Local/Temp/add_en_line.txt")
PAGE = Path(r"D:/Website_for_ProbingMemes/Website_for_ProbingMemes/frontend/app/page.tsx")

args = json.loads(TRANSCRIPT_ARGS.read_text(encoding="utf-8"))
patch_lines = args["input"].splitlines()
add_en = next(line[1:] for line in patch_lines if line.startswith("+const EN = "))
add_en = add_en.replace('A result is "statistically sufficient" when RE ≤ 10%.', 'A result is &quot;statistically sufficient&quot; when RE ≤ 10%.')
ADD_EN.write_text(add_en, encoding="utf-8")

page_bytes = PAGE.read_bytes()
start = page_bytes.index(b"const EN = ")
end = page_bytes.index(b"const WLS = [")
replacement = ADD_EN.read_bytes() + b"\r\n" + ADD_ZH.read_bytes() + b"\r\n"
PAGE.write_bytes(page_bytes[:start] + replacement + page_bytes[end:])
print("restored")
