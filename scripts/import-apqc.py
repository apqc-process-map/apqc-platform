"""Import an APQC PCF workbook without storing the licensed workbook in Git.

Usage: python scripts/import-apqc.py C:/private/APQC-PCF-v8.xlsx --output supabase/seed/apqc-v8.json
The JSON output is intentionally a reviewable, non-sensitive intermediate for a server-side import.
"""
from __future__ import annotations
import argparse, json, re
from pathlib import Path

def norm(value):
    return "" if value is None else str(value).strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise SystemExit("Missing openpyxl. Install it in the importer environment; do not add the licensed workbook to the repository.") from exc
    if not args.workbook.is_file():
        raise SystemExit(f"Workbook not found: {args.workbook}")
    book = load_workbook(args.workbook, read_only=True, data_only=True)
    rows = []
    metrics = []
    for sheet in book.worksheets:
        headers = [norm(c.value).lower() for c in next(sheet.iter_rows())]
        def column(*names):
            for name in names:
                if name in headers:
                    return headers.index(name)
            return None
        pcf_col = column("pcf id", "pcf_id", "id", "element id")
        hierarchy_col = column("hierarchy id", "hierarchy_id", "hierarchy")
        name_col = column("name", "element name", "process element")
        desc_col = column("description", "definition")
        metric_col = column("metric", "metric name", "measure")
        if pcf_col is None or hierarchy_col is None or name_col is None:
            continue
        for values in sheet.iter_rows(min_row=2, values_only=True):
            pcf_id, hierarchy_id, name = norm(values[pcf_col]), norm(values[hierarchy_col]), norm(values[name_col])
            if not pcf_id or not hierarchy_id or not name:
                continue
            level = len(re.findall(r"\.", hierarchy_id)) + 1
            if level > 5:
                raise SystemExit(f"Hierarchy exceeds five levels: {hierarchy_id}")
            rows.append({"pcf_id": pcf_id, "hierarchy_id": hierarchy_id, "level_number": level, "name": name, "description": norm(values[desc_col]) if desc_col is not None else None})
            if metric_col is not None and norm(values[metric_col]):
                metrics.append({"pcf_id": pcf_id, "name": norm(values[metric_col])})
    if len({r["pcf_id"] for r in rows}) != len(rows):
        raise SystemExit("Duplicate PCF IDs detected")
    if not rows:
        raise SystemExit("No APQC element rows found; inspect workbook headers before importing")
    by_hierarchy = {r["hierarchy_id"]: r["pcf_id"] for r in rows}
    for row in rows:
        parent = row["hierarchy_id"].rsplit(".", 1)[0] if "." in row["hierarchy_id"] else None
        row["parent_pcf_id"] = by_hierarchy.get(parent)
        row["display_order"] = sorted(by_hierarchy).index(row["hierarchy_id"]) + 1
    payload = {"framework": {"code": "APQC-PCF", "version": "8.0", "source_name": "APQC Cross-Industry PCF", "source_license_note": "Licensed APQC source; workbook retained outside Git."}, "elements": rows, "metrics": metrics}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"elements": len(rows), "metrics": len(metrics), "levels": sorted({r["level_number"] for r in rows})}))

if __name__ == "__main__":
    main()
