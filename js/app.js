/**
 * Dimby - NYC Real Estate Heat Map
 * Main application initialization.
 */

(async function() {
    'use strict';

    console.log('Dimby - NYC Real Estate Heat Map');
    console.log('Initializing...');

    // Initialize tooltip
    Tooltip.init();

    // Initialize controls
    Controls.init();

    // Initialize map
    MapManager.init();

    // Wait for map to load, then load data
    MapManager.map.on('load', async () => {
        console.log('Map loaded, fetching property data...');

        // Load all boroughs by default
        await Controls.loadBoroughData('all');

        console.log(`Loaded ${MapManager.data.length.toLocaleString()} properties`);
    });

    // Handle map errors
    MapManager.map.on('error', (e) => {
        console.error('Map error:', e);
    });

})();
