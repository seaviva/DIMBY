# Dimby - NYC Real Estate Heat Map

## Project Overview
Interactive web visualization of NYC property valuations as a heat map. Building-level granularity for Manhattan, Brooklyn, and Queens (~650K lots).

## Tech Stack
- **Frontend**: Vanilla JavaScript (no framework)
- **Mapping**: MapLibre GL JS (base map) + Deck.gl (heat map layer)
- **Base Tiles**: OpenFreeMap (free, no API key)
- **Data**: NYC PLUTO dataset + Rolling Sales
- **Hosting**: Netlify

## Project Structure
```
dimby/
├── index.html          # Main entry point
├── css/style.css       # Styles
├── js/
│   ├── app.js          # Main application
│   ├── map.js          # MapLibre + Deck.gl setup
│   ├── controls.js     # UI controls
│   └── tooltip.js      # Hover tooltips
├── data/               # Processed JSON files
├── scripts/            # Python data pipeline
└── docs/               # Project documentation
```

## Commands
- `python scripts/process_data.py` - Process PLUTO data to JSON
- `npx serve .` - Local dev server (or any static server)
- `netlify deploy` - Deploy to Netlify

## Code Conventions
- ES modules (import/export), not CommonJS
- Use const by default, let when needed, never var
- Descriptive variable names, no abbreviations
- Comments only where logic isn't self-evident

## Key Documentation
- `docs/architecture.md` - System design and file structure
- `docs/data-sources.md` - Datasets, licensing, attribution
- `docs/decisions.md` - Architecture Decision Records (ADRs)
- `docs/roadmap.md` - Phases and milestones
- `docs/product-brief.md` - Requirements and goals

## IMPORTANT Rules
- ALWAYS check docs/architecture.md before creating new files
- ALWAYS run local server to test map rendering changes
- Data files go in /data, never commit raw PLUTO CSVs (too large)
- Include attribution footer: "Property data from NYC Dept of City Planning"

## Current Phase
Phase 1 - Data Pipeline (see docs/roadmap.md)
