#!/usr/bin/env python3
"""
PLUTO Data Pipeline for Dimby NYC Heat Map

Downloads and processes NYC PLUTO data for Manhattan, Brooklyn, and Queens.
Outputs optimized JSON files for the frontend heat map visualization.

Usage:
    python scripts/process_data.py

Output:
    data/manhattan.json
    data/brooklyn.json
    data/queens.json
"""

import json
import os
import sys
from pathlib import Path

import pandas as pd
import requests

# Borough codes in PLUTO: 1=Manhattan, 2=Bronx, 3=Brooklyn, 4=Queens, 5=Staten Island
BOROUGHS = {
    1: "manhattan",
    3: "brooklyn",
    4: "queens"
}

# NYC Open Data Socrata API endpoint for PLUTO
PLUTO_API = "https://data.cityofnewyork.us/resource/64uk-42ks.json"

# Fields to keep from PLUTO (minimizes JSON size)
KEEP_FIELDS = [
    "bbl",
    "borocode",
    "address",
    "latitude",
    "longitude",
    "assesstot",      # Total assessed value
    "assessland",     # Land assessed value
    "bldgarea",       # Building area (sqft)
    "lotarea",        # Lot area (sqft)
    "numfloors",      # Number of floors
    "unitstotal",     # Total units
    "unitsres",       # Residential units
    "yearbuilt",      # Year built
    "bldgclass",      # Building class code
    "landuse",        # Land use category
    "zonedist1",      # Primary zoning district
]

# Output directory
DATA_DIR = Path(__file__).parent.parent / "data"


def fetch_pluto_data(borough_code: int, offset: int = 0, limit: int = 50000) -> list:
    """Fetch PLUTO data from NYC Open Data API for a specific borough."""
    params = {
        "$where": f"borocode = '{borough_code}'",
        "$limit": limit,
        "$offset": offset,
        "$select": ",".join(KEEP_FIELDS),
    }

    response = requests.get(PLUTO_API, params=params, timeout=120)
    response.raise_for_status()
    return response.json()


def fetch_all_borough_data(borough_code: int) -> pd.DataFrame:
    """Fetch all PLUTO records for a borough, handling pagination."""
    all_records = []
    offset = 0
    limit = 50000
    borough_name = BOROUGHS[borough_code]

    print(f"  Fetching {borough_name} data...")

    while True:
        records = fetch_pluto_data(borough_code, offset, limit)
        if not records:
            break
        all_records.extend(records)
        print(f"    Downloaded {len(all_records):,} records...")
        offset += limit

        if len(records) < limit:
            break

    print(f"  Total: {len(all_records):,} records for {borough_name}")
    return pd.DataFrame(all_records)


def process_borough_data(df: pd.DataFrame) -> list:
    """Process and clean borough data for frontend consumption."""
    if df.empty:
        return []

    # Convert numeric columns
    numeric_cols = ["latitude", "longitude", "assesstot", "assessland",
                    "bldgarea", "lotarea", "numfloors", "unitstotal",
                    "unitsres", "yearbuilt"]

    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Filter out records without coordinates
    df = df.dropna(subset=["latitude", "longitude"])

    # Filter out records with zero or null assessed value
    df = df[df["assesstot"] > 0]

    # Calculate value per sqft (avoid division by zero)
    df["value_per_sqft"] = df.apply(
        lambda row: round(row["assesstot"] / row["bldgarea"], 2)
        if row["bldgarea"] and row["bldgarea"] > 0
        else None,
        axis=1
    )

    # Round coordinates to 6 decimal places (sub-meter precision)
    df["latitude"] = df["latitude"].round(6)
    df["longitude"] = df["longitude"].round(6)

    # Convert to list of dicts, dropping null values per record
    records = []
    for _, row in df.iterrows():
        record = {
            "bbl": row.get("bbl"),
            "addr": row.get("address"),
            "lat": row["latitude"],
            "lon": row["longitude"],
            "val": int(row["assesstot"]) if pd.notna(row["assesstot"]) else None,
            "land": int(row["assessland"]) if pd.notna(row.get("assessland")) else None,
            "sqft": int(row["bldgarea"]) if pd.notna(row.get("bldgarea")) else None,
            "lot": int(row["lotarea"]) if pd.notna(row.get("lotarea")) else None,
            "floors": int(row["numfloors"]) if pd.notna(row.get("numfloors")) else None,
            "units": int(row["unitstotal"]) if pd.notna(row.get("unitstotal")) else None,
            "res": int(row["unitsres"]) if pd.notna(row.get("unitsres")) else None,
            "year": int(row["yearbuilt"]) if pd.notna(row.get("yearbuilt")) and row["yearbuilt"] > 0 else None,
            "class": row.get("bldgclass"),
            "use": row.get("landuse"),
            "zone": row.get("zonedist1"),
            "vpsf": row.get("value_per_sqft"),
        }
        # Remove None and NaN values to keep JSON valid
        record = {k: v for k, v in record.items() if v is not None and pd.notna(v)}
        records.append(record)

    return records


def main():
    """Main pipeline: download, process, and save PLUTO data."""
    print("=" * 60)
    print("DIMBY Data Pipeline - PLUTO Processing")
    print("=" * 60)

    # Ensure output directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    total_records = 0

    for borough_code, borough_name in BOROUGHS.items():
        print(f"\nProcessing {borough_name.upper()}...")

        # Fetch data from API
        df = fetch_all_borough_data(borough_code)

        if df.empty:
            print(f"  Warning: No data for {borough_name}")
            continue

        # Process data
        print(f"  Processing records...")
        records = process_borough_data(df)

        # Save to JSON
        output_file = DATA_DIR / f"{borough_name}.json"
        with open(output_file, "w") as f:
            json.dump(records, f, separators=(",", ":"), allow_nan=False)

        file_size_mb = output_file.stat().st_size / (1024 * 1024)
        print(f"  Saved {len(records):,} records to {output_file.name} ({file_size_mb:.1f} MB)")
        total_records += len(records)

    print("\n" + "=" * 60)
    print(f"COMPLETE: {total_records:,} total records processed")
    print("=" * 60)


if __name__ == "__main__":
    main()
