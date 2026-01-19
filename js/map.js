/**
 * Map initialization and Deck.gl heat map layer management.
 */

const MapManager = {
    map: null,
    deckOverlay: null,
    data: [],
    currentMetric: 'value',
    radiusPixels: 20,
    intensity: 5,
    weightStats: null,
    estimatedTwoBrSqft: 900,

    // Extended 16-color gradient for better fidelity (cool to hot)
    colorRange: [
        [26, 26, 51],      // Deep navy
        [36, 59, 102],     // Dark blue
        [46, 92, 128],     // Steel blue
        [65, 125, 146],    // Teal blue
        [65, 182, 196],    // Light teal
        [127, 205, 187],   // Seafoam
        [170, 220, 166],   // Light green
        [199, 233, 145],   // Yellow-green
        [237, 248, 142],   // Light lime
        [255, 237, 111],   // Yellow
        [254, 217, 90],    // Golden yellow
        [254, 178, 76],    // Light orange
        [253, 141, 60],    // Orange
        [252, 100, 45],    // Dark orange
        [240, 59, 32],     // Red-orange
        [189, 0, 38],      // Deep red
    ],

    /**
     * Initialize MapLibre GL map with OpenFreeMap tiles.
     */
    init() {
        this.map = new maplibregl.Map({
            container: 'map',
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: [-73.95, 40.73], // NYC center
            zoom: 11,
            minZoom: 9,
            maxZoom: 18,
        });

        // Add navigation controls
        this.map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

        // Initialize Deck.gl overlay when map loads
        this.map.on('load', () => {
            this.initDeckOverlay();
        });

        return this;
    },

    /**
     * Initialize the Deck.gl MapboxOverlay with empty heatmap layer.
     */
    initDeckOverlay() {
        this.deckOverlay = new deck.MapboxOverlay({
            interleaved: true,
            layers: [],
        });

        this.map.addControl(this.deckOverlay);
    },

    /**
     * Load property data from JSON files.
     * @param {string[]} boroughs - Array of borough names to load
     * @returns {Promise<object[]>} Combined property data
     */
    async loadData(boroughs = ['manhattan', 'brooklyn', 'queens']) {
        const allData = [];

        for (const borough of boroughs) {
            try {
                const data = await this.fetchBoroughData(borough);
                if (!data || data.length === 0) {
                    console.warn(`No data found for ${borough}`);
                    continue;
                }

                const normalized = [];
                for (const record of data) {
                    const mapped = this.normalizeRecord(record);
                    if (mapped) {
                        normalized.push(mapped);
                    }
                }

                if (normalized.length === 0) {
                    console.warn(`No usable records for ${borough}`);
                    continue;
                }

                for (const record of normalized) {
                    allData.push(record);
                }
            } catch (error) {
                console.error(`Error loading ${borough}:`, error);
            }
        }

        this.data = allData;
        return allData;
    },

    /**
     * Fetch borough data, preferring optimized files.
     * @param {string} borough - Borough name
     * @returns {Promise<object[]>} Data records
     */
    async fetchBoroughData(borough) {
        const sources = [
            `data/${borough}_min.json`,
            `data/${borough}.json`
        ];

        for (const source of sources) {
            const response = await fetch(source);
            if (response.ok) {
                return await response.json();
            }
        }

        return [];
    },

    /**
     * Normalize records to the minimized schema used by the heatmap.
     * @param {object} record - Raw or optimized record
     * @returns {object|null} Normalized record or null if invalid
     */
    normalizeRecord(record) {
        if (record && Array.isArray(record.p) && record.p.length === 2 && record.v) {
            return record;
        }

        const lat = Number(record.lat ?? record.latitude);
        const lon = Number(record.lon ?? record.longitude);
        const val = Number(record.v ?? record.val ?? record.assesstot);

        if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(val)) {
            return null;
        }

        const normalized = {
            p: [lon, lat],
            v: val,
        };

        const vpsf = record.s ?? record.vpsf;
        if (Number.isFinite(Number(vpsf))) {
            normalized.s = Number(vpsf);
        }

        const area = record.a ?? record.sqft;
        if (Number.isFinite(Number(area))) {
            normalized.a = Number(area);
        }

        const address = record.n ?? record.addr;
        if (address) {
            normalized.n = address;
        }

        const year = record.y ?? record.year;
        if (Number.isFinite(Number(year))) {
            normalized.y = Number(year);
        }

        const units = record.u ?? record.units;
        if (Number.isFinite(Number(units))) {
            normalized.u = Number(units);
        }

        const klass = record.c ?? record.class;
        if (klass) {
            normalized.c = klass;
        }

        return normalized;
    },

    /**
     * Update the heat map layer with current settings.
     */
    updateHeatmapLayer() {
        if (!this.deckOverlay || this.data.length === 0) return;

        this.computeWeightStats();

        const heatmapLayer = new deck.HeatmapLayer({
            id: 'heatmap',
            data: this.data,
            getPosition: d => d.p, // [lon, lat]
            getWeight: d => this.getHeatWeight(d),
            radiusPixels: this.radiusPixels,
            intensity: this.intensity,
            threshold: 0.02,
            colorRange: this.colorRange,
            aggregation: 'SUM',
            debounceTimeout: 100,
        });

        const pickingLayer = new deck.ScatterplotLayer({
            id: 'picking',
            data: this.data,
            getPosition: d => d.p,
            getRadius: 40,
            radiusUnits: 'meters',
            getFillColor: [0, 0, 0, 0],
            pickable: true,
            onHover: (info) => {
                if (info.object) {
                    Tooltip.show(info.x, info.y, info.object);
                } else {
                    Tooltip.hide();
                }
            }
        });

        this.deckOverlay.setProps({
            layers: [heatmapLayer, pickingLayer]
        });

        this.updateLegend();
    },

    /**
     * Compute weight stats for the current metric.
     */
    computeWeightStats() {
        if (this.data.length === 0) {
            this.weightStats = null;
            return;
        }

        const values = [];
        const transformed = [];

        for (const d of this.data) {
            const value = this.getMetricValue(d);
            if (!Number.isFinite(value) || value <= 0) continue;
            values.push(value);
            transformed.push(this.transformWeight(value));
        }

        values.sort((a, b) => a - b);
        transformed.sort((a, b) => a - b);

        const p05 = this.getQuantile(values, 0.05);
        const p50 = this.getQuantile(values, 0.5);
        const p95 = this.getQuantile(values, 0.95);

        const t05 = this.getQuantile(transformed, 0.05);
        const t95 = this.getQuantile(transformed, 0.95);

        this.weightStats = {
            p05,
            p50,
            p95,
            t05,
            t95,
        };
    },

    /**
     * Update the legend display.
     */
    updateLegend() {
        const legend = document.getElementById('legend');
        if (!legend) return;

        const gradient = legend.querySelector('.legend-gradient');
        const labels = legend.querySelector('.legend-labels');
        const title = legend.querySelector('.legend-title');

        if (!gradient || !labels || !title) return;

        // Build CSS gradient from color range
        const colors = this.colorRange.map(c => `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
        gradient.style.background = `linear-gradient(to right, ${colors.join(', ')})`;

        // Set labels based on metric
        if (this.currentMetric === 'vpsf') {
            title.textContent = 'Value per Sq Ft (P5–P95)';
        } else if (this.currentMetric === 'twobr') {
            title.textContent = `Estimated 2BR Price (${this.estimatedTwoBrSqft} sqft)`;
        } else {
            title.textContent = 'Assessed Value (P5–P95)';
        }

        const stats = this.weightStats;
        if (stats) {
            const ticks = [stats.p05, stats.p50, stats.p95]
                .map((v) => this.formatLegendValue(v));
            labels.innerHTML = ticks.map((tick) => `<span>${tick}</span>`).join('');
        } else {
            labels.innerHTML = '<span>Low</span><span>High</span>';
        }

        legend.classList.remove('hidden');
    },

    /**
     * Get the raw metric value for aggregation.
     * @param {object} d - Data point
     * @returns {number} Value
     */
    getMetricValue(d) {
        if (this.currentMetric === 'vpsf') {
            return d.s || 0;
        }
        if (this.currentMetric === 'twobr') {
            const vpsf = d.s || 0;
            return vpsf * this.estimatedTwoBrSqft;
        }
        return d.v || 0;
    },

    /**
     * Get a quantile value from a sorted array.
     * @param {number[]} values - Sorted array
     * @param {number} q - Quantile between 0 and 1
     * @returns {number}
     */
    getQuantile(values, q) {
        if (!values.length) return 0;
        const pos = (values.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (values[base + 1] !== undefined) {
            return values[base] + rest * (values[base + 1] - values[base]);
        }
        return values[base];
    },

    /**
     * Transform a metric value for weight normalization.
     * @param {number} value - Metric value
     * @returns {number}
     */
    transformWeight(value) {
        return Math.log10(value + 1);
    },

    /**
     * Get a normalized heatmap weight for a data point.
     * @param {object} d - Data point
     * @returns {number}
     */
    getHeatWeight(d) {
        const stats = this.weightStats;
        if (!stats) return 0;

        const value = this.getMetricValue(d);
        if (!Number.isFinite(value) || value <= 0) return 0;

        const transformed = this.transformWeight(value);
        const range = stats.t95 - stats.t05;
        if (range <= 0) return 0;

        let normalized = (transformed - stats.t05) / range;
        normalized = Math.max(0, Math.min(1, normalized));
        return Math.pow(normalized, 0.7);
    },

    /**
     * Format legend values for display.
     * @param {number} value - Metric value
     * @returns {string}
     */
    formatLegendValue(value) {
        if (this.currentMetric === 'vpsf') {
            return `$${Math.round(value).toLocaleString()}`;
        }
        if (value >= 1e9) {
            return `$${(value / 1e9).toFixed(1)}B`;
        }
        if (value >= 1e6) {
            return `$${(value / 1e6).toFixed(1)}M`;
        }
        if (value >= 1e3) {
            return `$${(value / 1e3).toFixed(0)}K`;
        }
        return `$${Math.round(value).toLocaleString()}`;
    },

    /**
     * Set the current metric and update the layer.
     * @param {string} metric - 'value' or 'vpsf'
     */
    setMetric(metric) {
        this.currentMetric = metric;
        this.updateHeatmapLayer();
    },

    /**
     * Set radius pixels and update the layer.
     * @param {number} radius - Radius in pixels
     */
    setRadius(radius) {
        this.radiusPixels = radius;
        this.updateHeatmapLayer();
    },

    /**
     * Set intensity and update the layer.
     * @param {number} intensity - Intensity value
     */
    setIntensity(intensity) {
        this.intensity = intensity;
        this.updateHeatmapLayer();
    },

    /**
     * Fly to a specific location.
     * @param {number[]} center - [lon, lat]
     * @param {number} zoom - Zoom level
     */
    flyTo(center, zoom = 12) {
        this.map.flyTo({
            center,
            zoom,
            duration: 1500
        });
    }
};
