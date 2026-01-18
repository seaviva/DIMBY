# Architecture Decisions

Record key decisions as we make them.

---

## ADR-001: Mapping Libraries

- **Decision**: Use MapLibre GL JS for base map + Deck.gl for heat map layer
- **Context**: Need to render 500K-700K property points as a heat map with smooth interactivity
- **Options considered**:
  1. Mapbox GL JS - Polished, but 50K free map loads/month limit, costs after
  2. MapLibre GL JS - Free fork of Mapbox, no usage limits
  3. Leaflet - Simpler but slower for large datasets
  4. Deck.gl alone - Great for data but needs a base map
- **Decision rationale**: MapLibre is free with no API key required. Deck.gl is GPU-accelerated and handles 1M+ points at 60fps. The combination is industry standard for large-scale geo visualization.
- **Consequences**: Need to learn two libraries, but both have good documentation.

---

## ADR-002: Frontend Framework

- **Decision**: Vanilla JavaScript (no framework)
- **Context**: Beginner-friendly project, relatively simple UI (map + controls)
- **Options considered**:
  1. React - Popular, good ecosystem, but adds complexity
  2. Svelte - Lighter than React, less mainstream
  3. Vanilla JS - No build step needed, simplest to understand
- **Decision rationale**: The UI is primarily a map with filters. No complex state management needed. Vanilla JS reduces dependencies and learning curve.
- **Consequences**: May refactor to React later if UI grows complex. For MVP, vanilla JS is sufficient.

---

## ADR-003: Hosting Platform

- **Decision**: Netlify
- **Context**: Need free hosting for static site with easy deployment
- **Options considered**:
  1. Vercel - Great for Next.js, 100GB bandwidth free
  2. Netlify - 100GB bandwidth, 300 build min/month, drag-and-drop deploys
  3. GitHub Pages - Simplest, but less features
- **Decision rationale**: Netlify has generous free tier, easy CI/CD from GitHub, and supports serverless functions if needed later.
- **Consequences**: Will set up Netlify CLI or GitHub integration for deploys.

---

## ADR-004: Geographic Scope

- **Decision**: Manhattan, Brooklyn, and Queens for MVP
- **Context**: Full NYC PLUTO has 870K+ lots, need to balance coverage vs performance
- **Options considered**:
  1. Manhattan only - ~45K lots, fastest iteration
  2. Manhattan + Brooklyn + Queens - ~650K lots, covers most interest
  3. All 5 boroughs - ~870K lots, comprehensive but slower
- **Decision rationale**: These three boroughs cover the highest-interest areas for real estate. Bronx and Staten Island can be added later.
- **Consequences**: Data pipeline will filter by borough code (1=Manhattan, 3=Brooklyn, 4=Queens).

---

## ADR-005: Heat Map Metrics

- **Decision**: Support multiple heat map views via toggle
- **Context**: User wants flexibility to view different valuation perspectives
- **Views to implement**:
  1. Assessed value per sqft (`AssessTot / BldgArea`)
  2. Total assessed value (`AssessTot`)
  3. Recent sale price (from Rolling Sales data, joined by BBL)
- **Decision rationale**: Different metrics tell different stories. Value/sqft normalizes for building size; total value shows absolute wealth concentration; sale prices reflect market activity.
- **Consequences**: Need to join PLUTO with Rolling Sales data. UI needs a toggle/dropdown for view selection.

---

## ADR-006: Rental Data Approach

- **Decision**: Use StreetEasy neighborhood-level averages as supplementary data
- **Context**: Building-level rental data is not freely available
- **Options considered**:
  1. Skip rentals entirely - Simplest, focus on sales/valuations
  2. Zillow API - Requires business verification, months-long approval
  3. StreetEasy neighborhood data - Free, monthly updates, covers NYC well
- **Decision rationale**: StreetEasy is the dominant platform for NYC rentals. Their neighborhood medians provide useful context even without building-level granularity.
- **Consequences**: Rental data will be shown in tooltips or as a neighborhood overlay, not building-level heat.

