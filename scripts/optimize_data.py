#!/usr/bin/env python3
"""
Optimize PLUTO JSON files for web delivery.

Creates minimal JSON files with only essential heat map data:
- Coordinates (lat/lon)
- Assessed value
- Value per sqft
- Basic building info for tooltips

This reduces file sizes from ~70MB to ~15MB per borough.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

def optimize_borough(borough_name: str):
    """Optimize a single borough's data file."""
    input_file = DATA_DIR / f"{borough_name}.json"
    output_file = DATA_DIR / f"{borough_name}_min.json"

    if not input_file.exists():
        print(f"  Skipping {borough_name}: file not found")
        return 0

    with open(input_file) as f:
        records = json.load(f)

    # Create minimal records with shortened keys
    minimal = []
    for r in records:
        # Skip if missing essential data
        if "lat" not in r or "lon" not in r or "val" not in r:
            continue

        # Minimal record for heat map + basic tooltip
        m = {
            "p": [round(r["lon"], 5), round(r["lat"], 5)],  # [lon, lat] for GeoJSON compat
            "v": r["val"],  # assessed value
        }

        # Add optional fields only if present and valid
        if "vpsf" in r and r["vpsf"] is not None and r["vpsf"] == r["vpsf"]:  # NaN check
            m["s"] = int(r["vpsf"])  # value per sqft (integer is fine)
        if "sqft" in r:
            m["a"] = r["sqft"]  # area
        if "addr" in r:
            m["n"] = r["addr"]  # name/address
        if "year" in r:
            m["y"] = r["year"]
        if "units" in r:
            m["u"] = r["units"]
        if "class" in r:
            m["c"] = r["class"]

        minimal.append(m)

    # Save with minimal whitespace
    with open(output_file, "w") as f:
        json.dump(minimal, f, separators=(",", ":"))

    original_size = input_file.stat().st_size / (1024 * 1024)
    new_size = output_file.stat().st_size / (1024 * 1024)
    reduction = (1 - new_size / original_size) * 100

    print(f"  {borough_name}: {len(minimal):,} records, {original_size:.1f}MB → {new_size:.1f}MB ({reduction:.0f}% reduction)")
    return len(minimal)


def main():
    print("Optimizing PLUTO data for web delivery...")
    print()

    total = 0
    for borough in ["manhattan", "brooklyn", "queens"]:
        total += optimize_borough(borough)

    print()
    print(f"Total: {total:,} records optimized")


if __name__ == "__main__":
    main()
