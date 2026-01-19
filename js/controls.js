/**
 * UI controls for the heat map visualization.
 */

const Controls = {
    elements: {},
    currentBorough: 'all',

    /**
     * Initialize all control elements and event listeners.
     */
    init() {
        // Cache DOM elements
        this.elements = {
            metricSelect: document.getElementById('metric-select'),
            boroughSelect: document.getElementById('borough-select'),
            radiusSlider: document.getElementById('radius-slider'),
            radiusValue: document.getElementById('radius-value'),
            intensitySlider: document.getElementById('intensity-slider'),
            intensityValue: document.getElementById('intensity-value'),
            loading: document.getElementById('loading'),
            stats: document.getElementById('stats'),
        };

        this.bindEvents();
    },

    /**
     * Bind event listeners to control elements.
     */
    bindEvents() {
        // Metric toggle
        this.elements.metricSelect.addEventListener('change', (e) => {
            MapManager.setMetric(e.target.value);
        });

        // Borough selection
        this.elements.boroughSelect.addEventListener('change', async (e) => {
            const borough = e.target.value;
            this.currentBorough = borough;
            await this.loadBoroughData(borough);
        });

        // Radius slider
        this.elements.radiusSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            this.elements.radiusValue.textContent = `${value}px`;
            MapManager.setRadius(value);
        });

        // Intensity slider
        this.elements.intensitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            this.elements.intensityValue.textContent = value;
            MapManager.setIntensity(value);
        });
    },

    /**
     * Load data for a specific borough or all boroughs.
     * @param {string} borough - Borough name or 'all'
     */
    async loadBoroughData(borough) {
        this.showLoading();

        const boroughs = borough === 'all'
            ? ['manhattan', 'brooklyn', 'queens']
            : [borough];

        await MapManager.loadData(boroughs);
        MapManager.updateHeatmapLayer();

        // Fly to borough if specific one selected
        if (borough !== 'all') {
            const centers = {
                manhattan: [-73.97, 40.78],
                brooklyn: [-73.95, 40.65],
                queens: [-73.82, 40.73]
            };
            if (centers[borough]) {
                MapManager.flyTo(centers[borough], 12);
            }
        } else {
            MapManager.flyTo([-73.95, 40.73], 11);
        }

        this.hideLoading();
        this.updateStats();
    },

    /**
     * Show loading indicator.
     */
    showLoading() {
        this.elements.loading.classList.remove('hidden');
        this.elements.stats.classList.add('hidden');
    },

    /**
     * Hide loading indicator.
     */
    hideLoading() {
        this.elements.loading.classList.add('hidden');
    },

    /**
     * Update statistics display.
     */
    updateStats() {
        const count = MapManager.data.length;
        const totalValue = MapManager.data.reduce((sum, d) => sum + (d.v || 0), 0);

        this.elements.stats.innerHTML = `
            <strong>${this.formatNumber(count)}</strong> properties<br>
            <strong>${this.formatCurrency(totalValue)}</strong> total value
        `;
        this.elements.stats.classList.remove('hidden');
    },

    /**
     * Format number with commas.
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    },

    /**
     * Format currency value.
     * @param {number} amount - Amount in dollars
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        if (amount >= 1e12) {
            return `$${(amount / 1e12).toFixed(1)}T`;
        }
        if (amount >= 1e9) {
            return `$${(amount / 1e9).toFixed(1)}B`;
        }
        if (amount >= 1e6) {
            return `$${(amount / 1e6).toFixed(1)}M`;
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    }
};
