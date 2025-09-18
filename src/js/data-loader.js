/**
 * Data Loader Module - Loads and manages JSON data files
 * Handles asynchronous loading of configuration and application data
 */

class DataLoader {
    constructor() {
        this.loadedData = {};
        this.loadingPromises = {};
    }

    /**
     * Load JSON data from a file
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise} Promise that resolves to the loaded data
     */
    async loadJSON(filePath) {
        if (this.loadedData[filePath]) {
            return this.loadedData[filePath];
        }

        if (this.loadingPromises[filePath]) {
            return this.loadingPromises[filePath];
        }

        this.loadingPromises[filePath] = fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${filePath}: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.loadedData[filePath] = data;
                return data;
            })
            .catch(error => {
                console.error(`Error loading ${filePath}:`, error);
                // Return fallback data structure
                return this.getFallbackData(filePath);
            });

        return this.loadingPromises[filePath];
    }

    /**
     * Load all application data based on configuration
     * @returns {Promise} Promise that resolves to complete application data
     */
    async loadAllData() {
        try {
            // Load data configuration first
            const config = await this.loadJSON('data/dataConfig.json');
            
            // Extract data files from config (support both array and object format)
            let dataFiles = {};
            if (Array.isArray(config.dataFiles)) {
                // Convert array format to object format
                config.dataFiles.forEach(fileConfig => {
                    dataFiles[fileConfig.name] = `data/${fileConfig.file}`;
                });
            } else {
                // Use object format directly
                dataFiles = config.dataFiles;
            }
            
            // Load all data files in parallel
            const dataPromises = Object.entries(dataFiles).map(async ([key, filePath]) => {
                // Ensure filePath is a string
                const validFilePath = typeof filePath === 'string' ? filePath : `data/${filePath}`;
                const data = await this.loadJSON(validFilePath);
                return [key, data];
            });

            const dataResults = await Promise.all(dataPromises);
            
            // Combine all data into a single object
            const combinedData = {};
            dataResults.forEach(([key, data]) => {
                combinedData[key] = data;
            });

            return combinedData;
        } catch (error) {
            console.error('Error loading application data:', error);
            return this.getFallbackAppData();
        }
    }

    /**
     * Get fallback data for specific files
     * @param {string} filePath - The file path that failed to load
     * @returns {Object} Fallback data structure
     */
    getFallbackData(filePath) {
        const fallbacks = {
            'data/dataConfig.json': {
                dataFiles: [
                    { name: "userProfile", file: "userProfile.json" },
                    { name: "header", file: "header.json" },
                    { name: "dashboard", file: "dashboard.json" },
                    { name: "payouts", file: "payouts.json" },
                    { name: "orders", file: "orders.json" },
                    { name: "content", file: "content.json" },
                    { name: "contactSupport", file: "contactSupport.json" },
                    { name: "announcements", file: "announcements.json" },
                    { name: "belProfiles", file: "belProfiles.json" },
                    { name: "productCatalog", file: "productCatalog.json" }
                ]
            },
            'data/userProfile.json': {
                name: "Abby Dong",
                email: "Abby.dong@advantech.com",
                level: "Admin",
                avatar: "https://irp.cdn-website.com/56869327/dms3rep/multi/AVATAR-G.png"
            },
            'data/header.json': {
                portalTitle: "BEL Portal",
                logo: "https://irp.cdn-website.com/56869327/dms3rep/multi/iotmart-logo.svg",
                notifications: []
            },
            'data/dashboard.json': {
                summaryStats: {},
                performanceByLevel: { distribution: { labels: [], data: [], colors: [] }, details: [] },
                productAnalysis: { categoryData: {}, topProducts: [] }
            },
            'data/payouts.json': {
                belPayoutHistory: []
            },
            'data/orders.json': {
                orders: { history: [] }
            },
            'data/content.json': {
                assets: []
            },
            'data/contactSupport.json': {
                tickets: []
            },
            'data/announcements.json': {
                announcements: []
            },
            'data/belProfiles.json': {
                leaderboard: []
            },
            'data/productCatalog.json': {
                productCatalog: [
                    { name: 'ADAM-6017-D', description: '8-ch Analog Input Modbus/RTU Module', category: 'Remote I/O Modules', avgPrice: 429, levelFactor: { Exploder: 1.3, Leader: 1.3, Enabler: 1.4, Builder: 1.6 } },
                    { name: 'WISE-4050E', description: '4-ch DI, 4-ch DO, Modbus/TCP, WISE-PaaS', category: 'Remote I/O Modules', avgPrice: 359, levelFactor: { Exploder: 1.4, Leader: 1.1, Enabler: 1.5, Builder: 1.6 } },
                    { name: 'EKI-2711PSI-A', description: 'Industrial 25W PoE splitter', category: 'Network Communications', avgPrice: 199, levelFactor: { Exploder: 1.3, Leader: 1.2, Enabler: 1.4, Builder: 1.1 } }
                ]
            }
        };

        return fallbacks[filePath] || {};
    }

    /**
     * Get complete fallback application data
     * @returns {Object} Complete fallback data structure
     */
    getFallbackAppData() {
        return {
            userProfile: this.getFallbackData('data/userProfile.json'),
            header: this.getFallbackData('data/header.json'),
            dashboard: this.getFallbackData('data/dashboard.json'),
            payouts: this.getFallbackData('data/payouts.json'),
            orders: this.getFallbackData('data/orders.json'),
            content: this.getFallbackData('data/content.json'),
            contactSupport: this.getFallbackData('data/contactSupport.json'),
            announcements: this.getFallbackData('data/announcements.json'),
            belProfiles: this.getFallbackData('data/belProfiles.json'),
            productCatalog: this.getFallbackData('data/productCatalog.json')
        };
    }

    /**
     * Merge loaded data with fallback data to ensure all required fields exist
     * @param {Object} loadedData - Data loaded from JSON files
     * @param {Object} fallbackData - Fallback data structure
     * @returns {Object} Merged data with all required fields
     */
    mergeWithFallback(loadedData, fallbackData) {
        const merged = { ...fallbackData };
        
        Object.keys(loadedData).forEach(key => {
            if (typeof loadedData[key] === 'object' && !Array.isArray(loadedData[key])) {
                merged[key] = this.mergeWithFallback(loadedData[key], merged[key] || {});
            } else {
                merged[key] = loadedData[key];
            }
        });

        return merged;
    }

    /**
     * Clear cached data (useful for development/testing)
     */
    clearCache() {
        this.loadedData = {};
        this.loadingPromises = {};
    }

    /**
     * Get cached data for a specific file
     * @param {string} filePath - Path to the JSON file
     * @returns {Object|null} Cached data or null if not loaded
     */
    getCachedData(filePath) {
        return this.loadedData[filePath] || null;
    }

    /**
     * Check if data is currently being loaded
     * @param {string} filePath - Path to the JSON file
     * @returns {boolean} True if data is being loaded
     */
    isLoading(filePath) {
        return !!this.loadingPromises[filePath] && !this.loadedData[filePath];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
} else {
    window.DataLoader = DataLoader;
}
