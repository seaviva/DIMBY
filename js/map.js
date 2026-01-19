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
            layers: []
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
                const response = await fetch(`data/${borough}.json`);
                if (!response.ok) {
                    console.warn(`Failed to load ${borough} data`);
                    continue;
                }
                const data = await response.json();
                allData.push(...data);
            } catch (error) {
                console.error(`Error loading ${borough}:`, error);
            }
        }

        this.data = allData;
        return allData;
    },

    /**
     * Update the heat map layer with current settings.
     */
    updateHeatmapLayer() {
        if (!this.deckOverlay || this.data.length === 0) return;

        const heatmapLayer = new deck.HeatmapLayer({
            id: 'heatmap',
            data: this.data,
            getPosition: d => d.p, // [lon, lat]
            getWeight: d => this.getWeight(d),
            radiusPixels: this.radiusPixels,
            intensity: this.intensity,
            threshold: 0.05,
            colorRange: [
                [65, 182, 196],    // Light teal
                [127, 205, 187],   // Teal
                [199, 233, 180],   // Light green
                [237, 248, 177],   // Yellow-green
                [255, 237, 160],   // Light yellow
                [254, 217, 118],   // Yellow
                [254, 178, 76],    // Orange
                [253, 141, 60],    // Dark orange
                [252, 78, 42],     // Red-orange
                [227, 26, 28],     // Red
            ],
            aggregation: 'SUM',
            debounceTimeout: 100,
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
            layers: [heatmapLayer]
        });
    },

    /**
     * Get weight value for a data point based on current metric.
     * @param {object} d - Data point
     * @returns {number} Weight value
     */
    getWeight(d) {
        if (this.currentMetric === 'vpsf') {
            // Value per square foot - normalize to reasonable range
            return d.s || 0;
        }
        // Total assessed value - use log scale to handle huge range
        return Math.log10(d.v + 1) * 1000;
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
