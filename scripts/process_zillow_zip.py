#!/usr/bin/env python3
"""
Process Zillow ZIP-level monthly data into a compact NYC-only JSON.

Usage:
    python scripts/process_zillow_zip.py

Output:
    data/zillow_nyc_2br_latest.json
"""

import csv
import json
import re
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
INPUT_FILE = DATA_DIR / "Zillow Monthly Data.csv"
OUTPUT_FILE = DATA_DIR / "zillow_nyc_2br_latest.json"

NYC_COUNTIES = {
    "New York County",
    "Kings County",
    "Queens County",
    "Bronx County",
    "Richmond County",
}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_latest_date(headers):
    date_cols = [h for h in headers if DATE_RE.match(h)]
    if not date_cols:
        raise ValueError("No date columns found in CSV header.")
    latest = max(date_cols, key=lambda d: datetime.strptime(d, "%Y-%m-%d"))
    return latest


def normalize_zip(value):
    value = str(value).strip()
    if value.isdigit():
        return value.zfill(5)
    return value


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Missing input file: {INPUT_FILE}")

    rows = []

    with open(INPUT_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise ValueError("CSV has no header.")

        latest_date = parse_latest_date(reader.fieldnames)

        for row in reader:
            if row.get("State") != "NY":
                continue
            if row.get("CountyName") not in NYC_COUNTIES:
                continue
            if row.get("RegionType") != "zip":
                continue

            value_raw = row.get(latest_date, "").strip()
            if not value_raw:
                continue

            try:
                value = float(value_raw)
            except ValueError:
                continue

            zip_code = normalize_zip(row.get("RegionName", ""))
            if not zip_code:
                continue

            rows.append({
                "zip": zip_code,
                "value": value,
            })

    output = {
        "asOf": latest_date,
        "rows": rows,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"), ensure_ascii=False)

    print(f"NYC ZIPs: {len(rows)}")
    print(f"As of: {latest_date}")
    print(f"Wrote: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
