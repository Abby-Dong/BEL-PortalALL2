/**
 * Data Loader Module for BEL Portal
 * Handles loading and caching of JSON data files
 */

class DataLoader {
    constructor() {
        this.cache = new Map();
        this.currentUserId = 'USER_001'; // Default user ID
        this.baseUrl = './data/';
    }

    /**
     * Set the current user ID
     * @param {string} userId - The user ID to set as current
     */
    setCurrentUser(userId) {
        this.currentUserId = userId;
    }

    /**
     * Load JSON data from a file with caching
     * @param {string} filename - Name of the JSON file to load
     * @returns {Promise<Object>} The loaded JSON data
     */
    async loadJSON(filename) {
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }

        try {
            const url = `${this.baseUrl}${filename}`;
            console.log(`Loading JSON from: ${url}`);
            
            // For file:// protocol, try to load via script tag method
            if (window.location.protocol === 'file:') {
                console.warn('File protocol detected. Using fallback loading method.');
                return await this.loadJSONFallback(filename);
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.cache.set(filename, data);
            console.log(`Successfully loaded ${filename}`);
            return data;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            
            // For file:// protocol, provide helpful error message
            if (window.location.protocol === 'file:') {
                console.warn('Note: Running from file:// protocol. Some browsers may block local file access.');
                console.warn('Consider using a local HTTP server for development.');
                console.warn('Trying fallback method...');
                try {
                    return await this.loadJSONFallback(filename);
                } catch (fallbackError) {
                    console.error('Fallback method also failed:', fallbackError);
                    throw fallbackError;
                }
            }
            
            throw error;
        }
    }

    /**
     * Fallback method for loading JSON in file:// protocol
     * @param {string} filename - Name of the JSON file to load
     * @returns {Promise<Object>} The loaded JSON data
     */
    async loadJSONFallback(filename) {
        // First try to load the actual JSON file even under file:// protocol
        try {
            const url = `${this.baseUrl}${filename}`;
            console.log(`Attempting to load actual JSON file: ${url}`);
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                this.cache.set(filename, data);
                console.log(`Successfully loaded actual JSON file: ${filename}`);
                return data;
            }
        } catch (error) {
            console.warn(`Failed to load actual JSON file ${filename}, falling back to mock data:`, error);
        }
        
        // Fall back to mock data if loading actual file fails
        console.warn(`Loading mock data for ${filename} due to file:// protocol limitations`);
        
        const mockData = this.getMockData(filename);
        this.cache.set(filename, mockData);
        return mockData;
    }

    /**
     * Get mock data for development purposes
     * @param {string} filename - Name of the JSON file
     * @returns {Object} Mock data structure
     */
    getMockData(filename) {
        switch (filename) {
            case 'content/terms.json':
                return {
                    "lastUpdated": "August 29, 2025",
                    "version": "2.1",
                    "sections": [
                        {
                            "id": 1,
                            "title": "Program Overview",
                            "content": "The BEL (Business Exclusive Leader) Platform is an invitation-only partner program operated by IoTMart, designed to reward qualified business partners, system integrators, and industry professionals who promote IoTMart products and services."
                        },
                        {
                            "id": 2,
                            "title": "Eligibility and Invitation",
                            "content": "Participation in the BEL Portal is by invitation only. IoTMart reserves the right to invite qualified candidates based on their industry expertise, business credentials, market influence, and alignment with IoTMart's business objectives."
                        },
                        {
                            "id": 3,
                            "title": "Partner Levels and Benefits",
                            "content": "Partners are classified into different levels based on their performance, engagement, and sales contribution. Each level offers different benefits and privileges.",
                            "levels": [
                                {
                                    "name": "Builder Level",
                                    "requirement": "Entry level - No minimum requirements",
                                    "benefits": ["Basic marketing materials", "Standard support"]
                                },
                                {
                                    "name": "Explorer Level",
                                    "requirement": "Minimum 35 performance points",
                                    "benefits": ["Premium marketing materials", "Dedicated account manager", "Early product access"]
                                }
                            ]
                        }
                    ]
                };
            
            case 'users/notifications.json':
                return {
                    "globalNotifications": [
                        {
                            "title": "September Earnings Payout Postponed",
                            "date": "2025-08-26",
                            "tag": { "type": "important", "text": "Important" }
                        }
                    ],
                    "userNotifications": []
                };
                
            case 'users/users.json':
                return {
                    "users": [
                        {
                            "userId": "USER_001",
                            "name": "Maxwell Walker",
                            "email": "Maxwell.Walker@example.com",
                            "level": {
                                "name": "Explorer",
                                "progress": { "current": 45, "target": 50 }
                            }
                        }
                    ]
                };

            case 'earnings/earnings-summary.json':
                return {
                    "userEarnings": [
                        {
                            "userId": "USER_001",
                            "totalEarnings": "$8,500.00",
                            "pendingPayout": "$1,520.00",
                            "alreadyPaid": "$6,980.00",
                            "tooltipText": "Payouts over $100 USD are processed on the 5th of each month. Balances under $100 will roll over to the next month."
                        }
                    ]
                };
                
            case 'earnings/payout-history.json':
                return {
                    "userPayouts": [
                        {
                            "userId": "USER_001",
                            "payouts": [
                                {
                                    "id": "PAYOUT-2025-003",
                                    "date": "2025-08-05",
                                    "grossEarnings": "$1,250.00",
                                    "fees": "$25.00",
                                    "tax": "$50.00",
                                    "netPayout": "$1,175.00"
                                },
                                {
                                    "id": "PAYOUT-2025-002",
                                    "date": "2025-07-05",
                                    "grossEarnings": "$980.00",
                                    "fees": "$19.60",
                                    "tax": "$39.20",
                                    "netPayout": "$921.20"
                                }
                            ]
                        }
                    ]
                };

            case 'earnings/order-tracking.json':
                return {
                    "userOrders": [
                        {
                            "userId": "USER_001",
                            "orders": [
                                {
                                    "orderPlaced": "2025-08-25",
                                    "orderNumber": "IMUS00068932", 
                                    "orderAmount": "USD 1,200.00",
                                    "productActualAmount": "1,150.00",
                                    "orderStatus": "Processing",
                                    "statusClass": "status-processing"
                                },
                                {
                                    "orderPlaced": "2025-08-22",
                                    "orderNumber": "IMDE00068901",
                                    "orderAmount": "EUR 125.50", 
                                    "productActualAmount": "118.75",
                                    "orderStatus": "Completed",
                                    "statusClass": "status-completed"
                                },
                                {
                                    "orderPlaced": "2025-08-18",
                                    "orderNumber": "IMJP00068875",
                                    "orderAmount": "JPY 350,000", 
                                    "productActualAmount": "330,000",
                                    "orderStatus": "Canceled",
                                    "statusClass": "status-canceled"
                                }
                            ]
                        }
                    ]
                };
                
            default:
                console.warn(`No mock data available for ${filename}`);
                return {};
        }
    }

    /**
     * Clear the cache for a specific file or all files
     * @param {string} filename - Optional filename to clear, if not provided clears all
     */
    clearCache(filename = null) {
        if (filename) {
            this.cache.delete(filename);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get user-specific data from a multi-user JSON structure
     * @param {Object} jsonData - The loaded JSON data
     * @param {string} userId - Optional user ID, defaults to current user
     * @returns {Object|Array|null} User-specific data or null if not found
     */
    getUserData(jsonData, userId = this.currentUserId) {
        // Handle different JSON structures
        if (jsonData.users) {
            return jsonData.users.find(user => user.userId === userId);
        }
        if (jsonData.userStats) {
            const userStats = jsonData.userStats.find(user => user.userId === userId);
            return userStats ? userStats.stats : null;
        }
        if (jsonData.userEarnings) {
            return jsonData.userEarnings.find(user => user.userId === userId);
        }
        if (jsonData.userOrders) {
            const userOrders = jsonData.userOrders.find(user => user.userId === userId);
            return userOrders ? userOrders.orders : null;
        }
        if (jsonData.userPayouts) {
            const userPayouts = jsonData.userPayouts.find(user => user.userId === userId);
            return userPayouts ? userPayouts.payouts : null;
        }
        if (jsonData.userPerformance) {
            return jsonData.userPerformance.find(user => user.userId === userId);
        }
        if (jsonData.userNotifications) {
            const userNotifications = jsonData.userNotifications.find(user => user.userId === userId);
            return userNotifications ? userNotifications.notifications : null;
        }
        
        // For non-user-specific data, return as-is
        return jsonData;
    }

    /**
     * Get merged notifications (global + user-specific)
     * @param {string} userId - Optional user ID, defaults to current user
     * @returns {Promise<Array>} Merged and sorted notifications
     */
    async getMergedNotifications(userId = this.currentUserId) {
        try {
            const notificationsData = await this.loadJSON('users/notifications.json');
            const globalNotifications = notificationsData.globalNotifications || [];
            const userNotifications = this.getUserData(notificationsData, userId) || [];
            
            return [...globalNotifications, ...userNotifications]
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error loading notifications:', error);
            return [];
        }
    }

    /**
     * Load configuration data
     * @returns {Promise<Object>} Configuration data
     */
    async loadConfig() {
        return await this.loadJSON('config.json');
    }

    /**
     * Load form options data
     * @returns {Promise<Object>} Form options data
     */
    async loadFormOptions() {
        return await this.loadJSON('form-options.json');
    }

    /**
     * Load user profile data
     * @param {string} userId - Optional user ID, defaults to current user
     * @returns {Promise<Object|null>} User profile data
     */
    async loadUserProfile(userId = this.currentUserId) {
        try {
            const usersData = await this.loadJSON('users/users.json');
            return this.getUserData(usersData, userId);
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }

    /**
     * Load dashboard statistics
     * @param {string} userId - Optional user ID, defaults to current user
     * @returns {Promise<Array|null>} Dashboard stats for the user
     */
    async loadDashboardStats(userId = this.currentUserId) {
        try {
            const statsData = await this.loadJSON('dashboard/dashboard-stats.json');
            return this.getUserData(statsData, userId);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            return null;
        }
    }

    /**
     * Load annual performance data
     * @param {string} userId - Optional user ID, defaults to current user
     * @returns {Promise<Object|null>} Annual performance data for the user
     */
    async loadAnnualPerformance(userId = this.currentUserId) {
        try {
            const performanceData = await this.loadJSON('dashboard/annual-performance.json');
            return this.getUserData(performanceData, userId);
        } catch (error) {
            console.error('Error loading annual performance:', error);
            return null;
        }
    }

    /**
     * Load product analysis data
     * @returns {Promise<Object|null>} Product analysis data
     */
    async loadProductAnalysis() {
        try {
            return await this.loadJSON('dashboard/product-analysis.json');
        } catch (error) {
            console.error('Error loading product analysis:', error);
            return null;
        }
    }

    /**
     * Load market analysis data
     * @returns {Promise<Array|null>} Market analysis data
     */
    async loadMarketAnalysis() {
        try {
            return await this.loadJSON('dashboard/market-analysis.json');
        } catch (error) {
            console.error('Error loading market analysis:', error);
            return null;
        }
    }

    /**
     * Load earnings summary
     * @param {string} userId - Optional user ID, defaults to current user
     * @returns {Promise<Object|null>} Earnings summary for the user
     */
    async loadEarningsSummary(userId = this.currentUserId) {
        try {
            const earningsData = await this.loadJSON('earnings/earnings-summary.json');
            return this.getUserData(earningsData, userId);
        } catch (error) {
            console.error('Error loading earnings summary:', error);
            return null;
        }
    }

    /**
     * Load payout history
     * @param {string} userId - Optional user ID, defaults to current user
     * @returns {Promise<Array|null>} Payout history for the user
     */
    async loadPayoutHistory(userId = this.currentUserId) {
        try {
            const payoutData = await this.loadJSON('earnings/payout-history.json');
            return this.getUserData(payoutData, userId);
        } catch (error) {
            console.error('Error loading payout history:', error);
            return null;
        }
    }

    /**
     * Load order tracking data
     * @param {string} userId - Optional user ID, defaults to current user
     * @returns {Promise<Array|null>} Order tracking data for the user
     */
    async loadOrderTracking(userId = this.currentUserId) {
        try {
            const orderData = await this.loadJSON('earnings/order-tracking.json');
            return this.getUserData(orderData, userId);
        } catch (error) {
            console.error('Error loading order tracking:', error);
            return null;
        }
    }

    /**
     * Load resource center data
     * @returns {Promise<Object|null>} Resource center data
     */
    async loadResourceCenter() {
        try {
            return await this.loadJSON('content/resource-center.json');
        } catch (error) {
            console.error('Error loading resource center:', error);
            return null;
        }
    }

    /**
     * Load FAQ data
     * @returns {Promise<Array|null>} FAQ data
     */
    async loadFAQ() {
        try {
            return await this.loadJSON('content/faq.json');
        } catch (error) {
            console.error('Error loading FAQ:', error);
            return null;
        }
    }

    /**
     * Load terms and conditions
     * @returns {Promise<Object|null>} Terms and conditions data
     */
    async loadTerms() {
        try {
            return await this.loadJSON('content/terms.json');
        } catch (error) {
            console.error('Error loading terms:', error);
            return null;
        }
    }

    /**
     * Load support tickets data
     * @returns {Promise<Array|null>} Support tickets data
     */
    async loadSupportTickets() {
        try {
            console.log('Loading support tickets...');
            const ticketData = await this.loadJSON('support-tickets.json');
            console.log('Support tickets loaded:', ticketData);
            if (ticketData && ticketData.tickets) {
                console.log('Number of tickets:', ticketData.tickets.length);
                return ticketData.tickets;
            } else {
                console.warn('No tickets property found in data');
                return [];
            }
        } catch (error) {
            console.error('Error loading support tickets:', error);
            return null;
        }
    }
}

// Create global instance
window.dataLoader = new DataLoader();
