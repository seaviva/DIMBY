# Architecture

## Goals
- Fast, interactive map visualization of ~650K property lots
- Building-level granularity with hover tooltips and filters
- Multiple heat map views (value/sqft, total value, sale price)
- Clean, aesthetically sharp UI
- Weekly data updates with manual refresh option

## Tech Stack (Finalized)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Base Map** | MapLibre GL JS | Free, no API key, Mapbox-compatible |
| **Heat Map** | Deck.gl HeatmapLayer | GPU-accelerated, handles 1M+ points |
| **Base Tiles** | OpenFreeMap | Free vector tiles, no limits |
| **Frontend** | Vanilla JavaScript | Simple, no build step, beginner-friendly |
| **Hosting** | Netlify | Free tier, easy deploys, GitHub integration |
| **Data Pipeline** | Python (pandas, geopandas) | Process PLUTO → optimized JSON |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA PIPELINE (Python)                       │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────────┐  │
│  │  PLUTO   │ → │   Filter &   │ → │  Optimized JSON files   │  │
│  │  CSV     │   │   Transform  │   │  (by borough, by metric)│  │
│  └──────────┘   └──────────────┘   └─────────────────────────┘  │
│        +                                                         │
│  ┌──────────┐                                                    │
│  │ Rolling  │ ────────────────────────────────────────────────── │
│  │ Sales    │  (join by BBL for sale price metric)               │
│  └──────────┘                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STATIC SITE (Netlify)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  index.html                                               │   │
│  │  ├── MapLibre GL JS (base map)                           │   │
│  │  ├── Deck.gl (heat map overlay)                          │   │
│  │  ├── Controls (metric toggle, filters, refresh)          │   │
│  │  └── Tooltips (property details on hover)                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /data/                                                   │   │
│  │  ├── manhattan.json                                       │   │
│  │  ├── brooklyn.json                                        │   │
│  │  ├── queens.json                                          │   │
│  │  └── neighborhoods.json (StreetEasy rental data)         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Ingest**: Download PLUTO CSV and Rolling Sales from NYC Open Data
2. **Filter**: Keep only Manhattan (1), Brooklyn (3), Queens (4) by borough code
3. **Transform**:
   - Extract needed columns: BBL, lat, lon, AssessTot, BldgArea, UnitsTotal, etc.
   - Calculate derived fields: value_per_sqft = AssessTot / BldgArea
   - Join with Rolling Sales by BBL for recent sale prices
4. **Export**: Write optimized JSON (minimal fields, no nulls)
5. **Serve**: Static files served by Netlify CDN

## File Structure

```
dimby/
├── index.html              # Main app entry point
├── css/
│   └── style.css           # Styles
├── js/
│   ├── app.js              # Main application logic
│   ├── map.js              # MapLibre + Deck.gl setup
│   ├── controls.js         # UI controls (toggles, filters)
│   └── tooltip.js          # Hover tooltip logic
├── data/
│   ├── manhattan.json      # Processed property data
│   ├── brooklyn.json
│   ├── queens.json
│   └── neighborhoods.json  # StreetEasy rental averages
├── scripts/
│   └── process_data.py     # Data pipeline script
├── docs/
│   ├── product-brief.md
│   ├── architecture.md
│   ├── data-sources.md
│   ├── decisions.md
│   └── roadmap.md
└── CLAUDE.md
```

## UI Components

1. **Map View**: Full-screen interactive map centered on NYC
2. **Metric Toggle**: Dropdown to switch between:
   - Assessed Value / sqft
   - Total Assessed Value
   - Recent Sale Price
3. **Filters**:
   - Number of units (studio, 1BR, 2BR, etc.)
   - Building type (residential, commercial, mixed)
4. **Hover Tooltip**: Shows property details on hover
   - Address
   - Assessed value
   - Building area
   - Year built
   - Neighborhood rental average (from StreetEasy)
5. **Refresh Button**: Manual data refresh trigger

## Performance Considerations

- **Data size**: ~650K lots × ~10 fields × 50 bytes ≈ 30-50 MB JSON
- **Strategy**: Load by borough, lazy-load non-visible boroughs
- **Deck.gl settings**:
  - Use `debounceTimeout` to prevent interaction freezes
  - Adjust `radiusPixels` based on zoom level
- **Caching**: Netlify CDN caches static JSON files
