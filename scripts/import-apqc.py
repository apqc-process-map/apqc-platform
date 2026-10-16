"""Parse and validate the licensed APQC PCF v8.0 workbook outside Git.

Usage:
  python scripts/import-apqc.py C:/private/APQC-PCF-v8.xlsx --output C:/tmp/apqc-v8.json

The output is a temporary import payload. Do not commit the workbook or generated payload.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


EXPECTED_ELEMENTS = 2017
EXPECTED_METRICS = 3284
EXPECTED_CATEGORIES = 13
EXPECTED_LEVELS = {1, 2, 3, 4, 5}


def norm(value: object) -> str:
    return "" if value is None else str(value).strip()


def header_map(sheet) -> dict[str, int]:
    return {norm(cell.value).lower().replace("\n", " "): index for index, cell in enumerate(next(sheet.iter_rows()))}


def hierarchy_level(hierarchy_id: str) -> int:
    parts = hierarchy_id.split(".")
    if len(parts) == 2 and parts[1] == "0":
        return 1
    return len(parts)


def parent_hierarchy_id(hierarchy_id: str) -> str | None:
    parts = hierarchy_id.split(".")
    if len(parts) == 2:
        return None if parts[1] == "0" else f"{parts[0]}.0"
    return ".".join(parts[:-1])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise SystemExit("Missing openpyxl in the importer environment.") from exc

    if not args.workbook.is_file():
        raise SystemExit(f"Workbook not found: {args.workbook}")

    book = load_workbook(args.workbook, read_only=True, data_only=True)
    required_sheets = {"Introduction", "Combined", "Metrics", "Copyright and Attribution"}
    missing_sheets = required_sheets.difference(book.sheetnames)
    if missing_sheets:
        raise SystemExit(f"Missing required sheets: {sorted(missing_sheets)}")

    combined = book["Combined"]
    combined_headers = header_map(combined)
    required_element_headers = {"pcf id", "hierarchy id", "name", "element description"}
    if missing := required_element_headers.difference(combined_headers):
        raise SystemExit(f"Missing Combined headers: {sorted(missing)}")

    elements: list[dict[str, object]] = []
    for display_order, values in enumerate(combined.iter_rows(min_row=2, values_only=True), start=1):
        pcf_id = norm(values[combined_headers["pcf id"]])
        hierarchy_id = norm(values[combined_headers["hierarchy id"]])
        name = norm(values[combined_headers["name"]])
        if not pcf_id and not hierarchy_id and not name:
            continue
        if not pcf_id or not hierarchy_id or not name:
            raise SystemExit(f"Incomplete element row {display_order + 1}")
        level = hierarchy_level(hierarchy_id)
        if level not in EXPECTED_LEVELS:
            raise SystemExit(f"Invalid hierarchy level for {hierarchy_id}")
        elements.append({
            "pcf_id": pcf_id,
            "hierarchy_id": hierarchy_id,
            "level_number": level,
            "name": name,
            "description": norm(values[combined_headers["element description"]]) or None,
            "parent_hierarchy_id": parent_hierarchy_id(hierarchy_id),
            "display_order": display_order,
        })

    metrics_sheet = book["Metrics"]
    metric_headers = header_map(metrics_sheet)
    required_metric_headers = {"process element id", "metric id", "metric name", "formula"}
    if missing := required_metric_headers.difference(metric_headers):
        raise SystemExit(f"Missing Metrics headers: {sorted(missing)}")

    metrics: list[dict[str, object]] = []
    for row_number, values in enumerate(metrics_sheet.iter_rows(min_row=2, values_only=True), start=2):
        pcf_id = norm(values[metric_headers["process element id"]])
        metric_code = norm(values[metric_headers["metric id"]])
        name = norm(values[metric_headers["metric name"]])
        if not pcf_id and not metric_code and not name:
            continue
        if not pcf_id or not metric_code or not name:
            raise SystemExit(f"Incomplete metric row {row_number}")
        metrics.append({
            "pcf_id": pcf_id,
            "metric_code": metric_code,
            "name": name,
            "definition": norm(values[metric_headers["formula"]]) or None,
        })

    pcf_ids = [item["pcf_id"] for item in elements]
    hierarchy_ids = [item["hierarchy_id"] for item in elements]
    metric_keys = [(item["pcf_id"], item["metric_code"], item["name"]) for item in metrics]
    hierarchy_set = set(hierarchy_ids)

    errors: list[str] = []
    if len(elements) != EXPECTED_ELEMENTS:
        errors.append(f"expected {EXPECTED_ELEMENTS} elements, found {len(elements)}")
    if len(metrics) != EXPECTED_METRICS:
        errors.append(f"expected {EXPECTED_METRICS} metrics, found {len(metrics)}")
    if len(set(pcf_ids)) != len(pcf_ids):
        errors.append("duplicate PCF IDs")
    if len(hierarchy_set) != len(hierarchy_ids):
        errors.append("duplicate hierarchy IDs")
    if len(set(metric_keys)) != len(metric_keys):
        errors.append("duplicate metric tuples")
    if set(item["level_number"] for item in elements) != EXPECTED_LEVELS:
        errors.append("levels are not exactly 1 through 5")
    if sum(1 for item in elements if item["level_number"] == 1) != EXPECTED_CATEGORIES:
        errors.append(f"expected {EXPECTED_CATEGORIES} categories")
    missing_parents = sorted({item["parent_hierarchy_id"] for item in elements if item["parent_hierarchy_id"] and item["parent_hierarchy_id"] not in hierarchy_set})
    if missing_parents:
        errors.append(f"missing parents: {missing_parents[:10]}")
    orphan_metrics = sorted({item["pcf_id"] for item in metrics if item["pcf_id"] not in set(pcf_ids)})
    if orphan_metrics:
        errors.append(f"metrics reference unknown PCF IDs: {orphan_metrics[:10]}")
    if errors:
        raise SystemExit("; ".join(errors))

    intro_text = " ".join(norm(cell.value) for row in book["Introduction"].iter_rows() for cell in row if cell.value)
    generated_match = re.search(r"GENERATED ON\s+([^\s]+)", intro_text, re.IGNORECASE)
    attribution = "\n".join(norm(row[0].value) for row in book["Copyright and Attribution"].iter_rows() if row[0].value)
    notice = next((line for line in attribution.splitlines() if "ALL RIGHTS RESERVED" in line), "")

    payload = {
        "framework": {
            "code": "APQC-PCF-CROSS-INDUSTRY",
            "name": "APQC Process Classification Framework (PCF) - Cross-Industry",
            "version": "8.0",
            "source_name": args.workbook.name,
            "source_license_note": notice,
            "generated_on": generated_match.group(1) if generated_match else None,
        },
        "elements": elements,
        "metrics": metrics,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({
        "elements": len(elements),
        "metrics": len(metrics),
        "categories": EXPECTED_CATEGORIES,
        "levels": sorted(EXPECTED_LEVELS),
        "descriptions": sum(bool(item["description"]) for item in elements),
        "source_generated_on": payload["framework"]["generated_on"],
    }))


if __name__ == "__main__":
    main()
