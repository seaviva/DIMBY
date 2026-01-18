# Architecture (Draft)

## Goals
- Fast, interactive map visualization.
- Clear data pipeline from raw source to map-ready tiles/aggregates.
- Maintainable, documented decisions.
- Building-level granularity when feasible, with hover tooltips and filters.

## Open Decisions
- Frontend framework (e.g., React/Next.js/Svelte).
- Mapping library (Mapbox GL, MapLibre, Deck.gl, Leaflet).
- Data processing pipeline (Python + GeoPandas, SQL + PostGIS, etc.).
- Hosting (Vercel/Netlify for frontend, object storage for tiles).
- Data sources for sale valuation and rental rates (free, with licensing clarity).

## Proposed Components (placeholder)
1. **Data ingestion**: pull valuation dataset(s).
2. **Data processing**: normalize, geocode (if needed), aggregate; support weekly updates and manual refresh trigger.
3. **Tile/heatmap generation**: create vector tiles or heatmap-ready grids.
4. **Web app**: render map, heat map layer, hover tooltips, and filters.
