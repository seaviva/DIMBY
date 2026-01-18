# Data Sources

Track datasets, licensing, and attribution requirements.

---

## Primary: Property Valuation Data

- **Dataset name**: PLUTO / MapPLUTO (Primary Land Use Tax Lot Output)
- **Source URL**: https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/64uk-42ks
- **Alternative download**: https://www.nyc.gov/site/planning/data-maps/open-data/dwn-pluto-mappluto.page
- **Owner/Provider**: NYC Department of City Planning
- **License**: NYC Open Data Terms of Use (free for commercial and non-commercial use)
- **Update cadence**: Monthly
- **Records**: 870,000+ tax lots with 70+ attributes
- **Key fields**:
  - `AssessTot` - Total assessed value
  - `AssessLand` - Land assessed value
  - `BldgArea` - Building area (sqft)
  - `UnitsTotal` - Total units
  - `YearBuilt` - Year built
  - `BldgClass` - Building class code
  - `BBL` - Borough-Block-Lot (unique identifier)
- **Geometry**: Pre-geocoded with lat/lon coordinates (MapPLUTO includes polygons)
- **Notes**: This is the primary dataset. No geocoding needed.

---

## Secondary: Rolling Sales Data

- **Dataset name**: NYC Rolling Sales Data
- **Source URL**: https://www.nyc.gov/site/finance/taxes/property-rolling-sales-data.page
- **Owner/Provider**: NYC Department of Finance
- **License**: Public domain
- **Update cadence**: Monthly (rolling 12 months)
- **Key fields**: Sale price, sale date, address, BBL
- **Notes**: Use BBL to join with PLUTO for recent sale prices. Enables "sale price" heat map view.

---

## Secondary: Rental Rate Data (Neighborhood Level)

- **Dataset name**: StreetEasy Data Dashboard
- **Source URL**: https://streeteasy.com/blog/data-dashboard/
- **Owner/Provider**: StreetEasy (Zillow Group)
- **License**: Free for non-commercial use with attribution
- **Update cadence**: Monthly
- **Granularity**: Neighborhood and borough level (NOT building-level)
- **Key metrics**: Median asking rent, inventory, days on market
- **Notes**: Building-level rental data is not freely available. This provides neighborhood context only. Will overlay as a secondary layer or tooltip info.

---

## Not Used (Evaluated)

- **Zillow API**: Requires business verification, complex approval process (weeks/months), restrictive access policies. Not suitable for this project.
- **NYCHVS (Housing Vacancy Survey)**: Survey-based, triennial, not granular enough for heat map.

---

## Attribution Requirements

When displaying the map, include:
- "Property data from NYC Department of City Planning (PLUTO)"
- "Sales data from NYC Department of Finance"
- "Rental data from StreetEasy" (if used)

