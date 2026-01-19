/**
 * Tooltip management for property hover details.
 */

const Tooltip = {
    element: null,

    /**
     * Initialize the tooltip element reference.
     */
    init() {
        this.element = document.getElementById('tooltip');
    },

    /**
     * Show tooltip at specified position with property data.
     * @param {number} x - Screen X coordinate
     * @param {number} y - Screen Y coordinate
     * @param {object} data - Property data object
     */
    show(x, y, data) {
        if (!this.element) return;

        const content = this.formatContent(data);
        this.element.innerHTML = content;

        // Position tooltip, avoiding edge overflow
        const padding = 16;
        const rect = this.element.getBoundingClientRect();
        let left = x + padding;
        let top = y + padding;

        // Adjust if going off right edge
        if (left + 280 > window.innerWidth) {
            left = x - 280 - padding;
        }

        // Adjust if going off bottom edge
        if (top + rect.height > window.innerHeight) {
            top = y - rect.height - padding;
        }

        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
        this.element.classList.add('visible');
    },

    /**
     * Hide the tooltip.
     */
    hide() {
        if (this.element) {
            this.element.classList.remove('visible');
        }
    },

    /**
     * Format property data into HTML content.
     * @param {object} data - Property data object
     * @returns {string} HTML content
     */
    formatContent(data) {
        const rows = [];

        // Handle aggregated grid cell data
        if (data.isAggregate) {
            rows.push(`<div class="tooltip-title">Neighborhood Cell</div>`);

            if (data.metric === 'vpsf') {
                rows.push(this.formatRow('Median Value/Sq Ft', this.formatCurrency(data.value || 0)));
            } else {
                rows.push(this.formatRow('Median Value', this.formatLargeNumber(data.value || 0)));
            }

            if (data.count !== undefined) {
                rows.push(this.formatRow('Properties', this.formatNumber(data.count)));
            }

            if (data.position) {
                const lat = data.position[1].toFixed(4);
                const lon = data.position[0].toFixed(4);
                rows.push(`<div class="tooltip-coords">${lat}, ${lon}</div>`);
            }

            return rows.join('');
        }

        // Individual property data (fallback)
        const address = data.n || 'Property';
        rows.push(`<div class="tooltip-title">${this.escapeHtml(address)}</div>`);

        // Assessed value
        if (data.v) {
            rows.push(this.formatRow('Assessed Value', this.formatCurrency(data.v)));
        }

        // Value per sqft
        if (data.s) {
            rows.push(this.formatRow('Value/Sq Ft', this.formatCurrency(data.s)));
        }

        // Estimated 2BR price (proxy)
        if (data.s) {
            const estimatedTwoBr = data.s * 900;
            rows.push(this.formatRow('Estimated 2BR', this.formatLargeNumber(estimatedTwoBr)));
        }

        // Building area
        if (data.a) {
            rows.push(this.formatRow('Building Area', this.formatNumber(data.a) + ' sq ft'));
        }

        // Year built
        if (data.y && data.y > 1800) {
            rows.push(this.formatRow('Year Built', data.y));
        }

        // Units
        if (data.u && data.u > 0) {
            rows.push(this.formatRow('Units', data.u));
        }

        // Building class
        if (data.c) {
            rows.push(this.formatRow('Class', data.c));
        }

        return rows.join('');
    },

    /**
     * Format a row with label and value.
     * @param {string} label - Row label
     * @param {string|number} value - Row value
     * @returns {string} HTML row
     */
    formatRow(label, value) {
        return `<div class="tooltip-row">
            <span class="tooltip-label">${label}</span>
            <span class="tooltip-value">${value}</span>
        </div>`;
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Format large numbers with K/M/B suffixes.
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatLargeNumber(num) {
        if (num >= 1e12) {
            return `$${(num / 1e12).toFixed(1)}T`;
        }
        if (num >= 1e9) {
            return `$${(num / 1e9).toFixed(1)}B`;
        }
        if (num >= 1e6) {
            return `$${(num / 1e6).toFixed(1)}M`;
        }
        if (num >= 1e3) {
            return `$${(num / 1e3).toFixed(0)}K`;
        }
        return `$${Math.round(num)}`;
    },

    /**
     * Escape HTML to prevent XSS.
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
