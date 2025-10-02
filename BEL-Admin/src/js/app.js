/**
 * BEL Management Portal - Main Application Script
 * Manages dashboard, Account Management, payouts, content, and support functionality
 */

'use strict';

// Authentication and session management
function checkAuthentication() {
    const userSession = sessionStorage.getItem('bel_user_session');
    
    if (!userSession) {
        // No session found, redirect to login
        window.location.href = 'BEL-Login/login.html';
        return false;
    }
    
    try {
        const session = JSON.parse(userSession);
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        // Check if session is older than 8 hours
        if (hoursDiff > 8) {
            sessionStorage.removeItem('bel_user_session');
            alert('Your session has expired. Please log in again.');
            window.location.href = 'BEL-Login/login.html';
            return false;
        }
        
        // Update user profile in the app
        updateUserProfile(session);
        return true;
    } catch (error) {
        console.error('Session validation error:', error);
        sessionStorage.removeItem('bel_user_session');
        window.location.href = 'BEL-Login/login.html';
        return false;
    }
}

function updateUserProfile(session) {
    // Update user profile display in the header
    window.currentUser = session;
    
    // Update user profile data for the app
    if (window.APP_DATA && window.APP_DATA.userProfile) {
        window.APP_DATA.userProfile.name = session.name;
        window.APP_DATA.userProfile.email = session.email;
        window.APP_DATA.userProfile.role = session.role;
    }
}

function setupLogout() {
    // Find existing Log Out button in user profile panel
    const existingLogoutButton = document.querySelector('.panel-link[role="menuitem"]');
    if (existingLogoutButton && existingLogoutButton.textContent.trim() === 'Log Out') {
        // Bind logout functionality to existing button
        existingLogoutButton.addEventListener('click', logout);
        console.log('Logout functionality bound to existing Log Out button');
    }
}

function logout() {
    // Show confirmation dialog
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        sessionStorage.removeItem('bel_user_session');
        localStorage.removeItem('bel_remember_me');
        window.location.href = '../BEL-Login/login.html';
    }
}

// Check authentication before running the app
if (!checkAuthentication()) {
    // If authentication fails, the function will redirect to login
    // and we shouldn't initialize the app
} else {
    // Initialize application when DOM is ready (only if authenticated)
    document.addEventListener('DOMContentLoaded', () => {
    /* ========================================================================
       GLOBAL APP STATE & DATA LOADER
       ======================================================================== */
    
    // Centralized data structure (will be loaded from JSON files)
    let APP_DATA = {};

    // Initialize DataLoader
    const dataLoader = new DataLoader();

    // Load all data and initialize application
    async function initializeApp() {
        try {
            // Show loading indicator
            console.log('Loading application data...');
            
            // Load all data from JSON files
            APP_DATA = await dataLoader.loadAllData();
            
            // Make data available globally
            window.appData = APP_DATA;
            window.APP_DATA = APP_DATA; // Ensure global accessibility
            
            console.log('Data loaded successfully:', APP_DATA);
            console.log('belProfiles data:', APP_DATA.belProfiles);
            
            // Test belProfiles data availability
            if (APP_DATA.belProfiles && APP_DATA.belProfiles.leaderboard) {
                console.log('✅ belProfiles.leaderboard loaded:', APP_DATA.belProfiles.leaderboard.length, 'entries');
            } else {
                console.log('❌ belProfiles.leaderboard not found');
            }
            
            // Initialize all components once data is loaded
            Navigation.init();
            Dashboard.init();
            AccountManagement.init();
            BELModal.init();
            ContentManager.init();
            
            // Initialize additional components that depend on data
            setTimeout(() => {
                TableUtils.initializeAllTables();
                initializeAllAvatars();
            }, 500);
            
            console.log('BEL Management Portal initialized successfully with external data');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            // Use fallback data
            APP_DATA = dataLoader.getFallbackAppData();
            
            // Make fallback data available globally
            window.appData = APP_DATA;
            
            // Still initialize components with fallback data
            Navigation.init();
            Dashboard.init();
            AccountManagement.init();
            BELModal.init();
            ContentManager.init();
            
            setTimeout(() => {
                TableUtils.initializeAllTables();
                initializeAllAvatars();
            }, 500);
        }
    }

    // Start the application
    initializeApp();

    /* ========================================================================
       UI ELEMENTS CACHE
       ======================================================================== */
    const ui = {
        // Navigation
        sidebar: document.getElementById('bel-sidebar'),
        hamburgerBtn: document.getElementById('bel-hamburger-btn'),
        contentLinks: document.querySelectorAll('.bel-sidebar-nav-link'),
        contentSections: document.querySelectorAll('.content-section'),
        
        // Header
        notificationBell: document.getElementById('notification-bell'),
        notificationPanel: document.getElementById('notification-panel'),
        userProfile: document.querySelector('.bel-user-profile'),
        userProfilePanel: document.getElementById('user-profile-panel'),
        
        // Account Management
        regionSel: document.getElementById('f-region'),
        countrySel: document.getElementById('f-country'),
        rowsPerPage: document.getElementById('rows-per-page'),
        prevBtn: document.getElementById('prev-page'),
        nextBtn: document.getElementById('next-page'),
        rangeLabel: document.getElementById('range-label'),
        table: document.getElementById('bel-table'),
        thead: document.querySelector('#bel-table thead'),
        tbody: document.querySelector('#bel-table tbody'),
        thSelect: document.getElementById('th-select'),
        selectAllPage: document.getElementById('select-all-page'),
        selectedCount: document.getElementById('selected-count'),
        exportBtn: document.getElementById('export-csv'),
        
        // Modal
        modal: document.getElementById('bel-details-modal'),
        modalClose: document.querySelector('#bel-details-modal .close-button'),
        modalBelName: document.getElementById('modal-title'),
        modalBelInfo: document.getElementById('modal-bel-info'),
        modalLevel: document.getElementById('level-adjustment'),
        notesHistory: document.querySelector('#bel-details-modal .notes-history'),
        modalNote: document.querySelector('#bel-details-modal .add-note-form textarea'),
        saveBtn: document.querySelector('#bel-details-modal .modal-actions .bel-btn.primary'),
        addNoteBtn: document.querySelector('#bel-details-modal .add-note-form .bel-btn.secondary'),
        // Additional note form elements
        addNoteTextarea: document.getElementById('add-note-textarea'),
        addNoteBtnNew: document.getElementById('add-note-btn')
    };

    /* ========================================================================
       APPLICATION STATE
       ======================================================================== */
    // Global application state object that manages all UI state and user interactions
    const appState = {
        // Main table pagination state (BEL Performance Leaderboard)
        page: 1,                    
        rowsPerPage: 10,            
        selected: new Set(),        
        
        // Search and filter state for BEL Performance Leaderboard
        filters: { 
            keyword: '',            
            referralId: '',        
            level: '',              
            region: '',             
            country: '',           
            startDate: '',    
            endDate: '',      
            activity: ''   
        },
        
        // Table sorting configuration
        sortDir: 'desc',           
        
        // Modal and detail view state
        currentReferralId: null,    
        
        // Cached data objects to avoid repeated API calls
        notes: {},                  
        bankingHistory: {},        
        customerInsights: {},    
        belSalesData: {},         
        
        // page pagination states
        payoutPage: 1,             
        payoutRowsPerPage: 12,    
        assetPage: 1,              
        assetRowsPerPage: 10,      
        orderPagePayout: 1,       
        orderRowsPerPagePayout: 10, 
        supportPage: 1,           
        supportRowsPerPage: 10,   
        historyTicketsPage: 1,  
        historyTicketsRowsPerPage: 10, 
        annPage: 1,              
        annRowsPerPage: 10,   
        accountGridPage: 1,       
        accountGridRowsPerPage: 12,
        accountListPage: 1,        
        accountListRowsPerPage: 10,
        
        // Order tracking filters for Payouts & Orders page
        orderFilters: {
            dateFrom: '',         
            dateTo: '',           
            search: '',            
            amountMin: '',       
            amountMax: '',       
            status: ''       
        }
    };

    /* ========================================================================
       UTILITY FUNCTIONS
       ======================================================================== */
    const utils = {
        formatMoney: (amount, decimals = 0) => {
            return `$${amount.toLocaleString(undefined, { 
                minimumFractionDigits: decimals, 
                maximumFractionDigits: decimals 
            })}`;
        },
        
        formatCurrency: (amount, currency = 'USD') => {
            const currencyConfig = {
                'USD': { symbol: 'USD', decimals: 2, position: 'before' },
                'EUR': { symbol: 'EUR', decimals: 2, position: 'before' },
                'GBP': { symbol: 'GBP', decimals: 2, position: 'before' },
                'JPY': { symbol: 'JPY', decimals: 0, position: 'before' },
                'KRW': { symbol: 'KRW', decimals: 0, position: 'before' },
                'AUD': { symbol: 'AUD', decimals: 2, position: 'before' },
                'TWD': { symbol: 'TWD', decimals: 0, position: 'before' }
            };
            
            const config = currencyConfig[currency];
            const formattedAmount = amount.toLocaleString(undefined, {
                minimumFractionDigits: config.decimals,
                maximumFractionDigits: config.decimals
            });
            
            return config.position === 'before' 
                ? `${config.symbol} ${formattedAmount}`
                : `${formattedAmount} ${config.symbol}`;
        },

        // Region mapping function based on country
        getRegionFromCountry: (country) => {
            const regionMapping = {
                // AAU / NZ - 澳洲和紐西蘭
                'Australia': 'AAU / NZ',
                'New Zealand': 'AAU / NZ',
                
                // ASEAN - 東南亞國家協會
                'Brunei': 'ASEAN',
                'Cambodia': 'ASEAN',
                'Indonesia': 'ASEAN',
                'Malaysia': 'ASEAN',
                'Philippines': 'ASEAN',
                'Singapore': 'ASEAN',
                'Thailand': 'ASEAN',
                'Vietnam': 'ASEAN',
                'Myanmar': 'ASEAN',
                'Laos': 'ASEAN',
                
                // China - 中國
                'China': 'China',
                
                // Europe - 歐洲
                'Austria': 'Europe',
                'Belgium': 'Europe',
                'Bulgaria': 'Europe',
                'Croatia': 'Europe',
                'Cyprus': 'Europe',
                'Czech Republic': 'Europe',
                'Denmark': 'Europe',
                'Estonia': 'Europe',
                'Finland': 'Europe',
                'France': 'Europe',
                'Germany': 'Europe',
                'Greece': 'Europe',
                'Hungary': 'Europe',
                'Ireland': 'Europe',
                'Italy': 'Europe',
                'Latvia': 'Europe',
                'Lithuania': 'Europe',
                'Luxembourg': 'Europe',
                'Malta': 'Europe',
                'Netherlands': 'Europe',
                'Poland': 'Europe',
                'Portugal': 'Europe',
                'Romania': 'Europe',
                'Slovakia': 'Europe',
                'Slovenia': 'Europe',
                'Spain': 'Europe',
                'Sweden': 'Europe',
                'Norway': 'Europe',
                'Switzerland': 'Europe',
                'United Kingdom': 'Europe',
                'Iceland': 'Europe',
                
                // India - 印度
                'India': 'India',
                
                // Japan - 日本
                'Japan': 'Japan',
                
                // Korea - 韓國
                'South Korea': 'Korea',
                'Korea': 'Korea',
                
                // LATAM - 拉丁美洲
                'Argentina': 'LATAM',
                'Bolivia': 'LATAM',
                'Brazil': 'LATAM',
                'Chile': 'LATAM',
                'Colombia': 'LATAM',
                'Costa Rica': 'LATAM',
                'Cuba': 'LATAM',
                'Dominican Republic': 'LATAM',
                'Ecuador': 'LATAM',
                'El Salvador': 'LATAM',
                'Guatemala': 'LATAM',
                'Honduras': 'LATAM',
                'Mexico': 'LATAM',
                'Nicaragua': 'LATAM',
                'Panama': 'LATAM',
                'Paraguay': 'LATAM',
                'Peru': 'LATAM',
                'Uruguay': 'LATAM',
                'Venezuela': 'LATAM',
                
                // ME&A - 中東和非洲
                'Algeria': 'ME&A',
                'Angola': 'ME&A',
                'Egypt': 'ME&A',
                'Ethiopia': 'ME&A',
                'Ghana': 'ME&A',
                'Kenya': 'ME&A',
                'Morocco': 'ME&A',
                'Nigeria': 'ME&A',
                'South Africa': 'ME&A',
                'Tunisia': 'ME&A',
                'Uganda': 'ME&A',
                'Zimbabwe': 'ME&A',
                'Israel': 'ME&A',
                'Jordan': 'ME&A',
                'Lebanon': 'ME&A',
                'Qatar': 'ME&A',
                'Saudi Arabia': 'ME&A',
                'UAE': 'ME&A',
                'Turkey': 'ME&A',
                'Iran': 'ME&A',
                'Iraq': 'ME&A',
                'Kuwait': 'ME&A',
                'Oman': 'ME&A',
                'Bahrain': 'ME&A',
                
                // North America - 北美洲
                'United States': 'North America',
                'Canada': 'North America',
                
                // Taiwan - 台灣
                'Taiwan': 'Taiwan',
                
                // Russia & CIS - 俄羅斯與獨立國協
                'Russia': 'Russia & CIS',
                'Belarus': 'Russia & CIS',
                'Kazakhstan': 'Russia & CIS',
                'Kyrgyzstan': 'Russia & CIS',
                'Tajikistan': 'Russia & CIS',
                'Turkmenistan': 'Russia & CIS',
                'Uzbekistan': 'Russia & CIS',
                'Armenia': 'Russia & CIS',
                'Azerbaijan': 'Russia & CIS',
                'Georgia': 'Russia & CIS',
                'Moldova': 'Russia & CIS',
                'Ukraine': 'Russia & CIS'
            };
            
            return regionMapping[country] || 'Others';
        },
        
        formatPercent: (decimal) => `${(decimal * 100).toFixed(2)}%`,
        
        parseDate: (dateString) => dateString ? new Date(dateString + 'T00:00:00') : null,
        
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Avatar generation utility
        generateAvatar: (name, userId = '') => {
            // Limited design system colors for avatars
            const avatarColors = [
                '#F39800', // Primary orange
                '#e57b03', // Primary dark
                '#004280', // Brand blue
                '#003160', // Brand dark
                '#336899', // Brand light 75
                '#e8ecef', // Gray 40
                '#cfd2d5', // Gray 50
                '#b6bfc1', // Gray 60
                '#737b7d'  // Gray 70
            ];

            // Get initials from name
            const getInitials = (fullName) => {
                if (!fullName) return 'U';
                const names = fullName.trim().split(' ');
                if (names.length === 1) {
                    return names[0].substring(0, 2).toUpperCase();
                }
                return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
            };

            // Generate consistent color based on name or ID
            const getColorIndex = (str) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32-bit integer
                }
                return Math.abs(hash) % avatarColors.length;
            };

            const initials = getInitials(name);
            const colorIndex = getColorIndex(userId || name);
            const backgroundColor = avatarColors[colorIndex];
            
            // Determine text color based on background (lighter colors get dark text)
            const isLightColor = ['#e8ecef', '#cfd2d5', '#b6bfc1'].includes(backgroundColor);
            const textColor = isLightColor ? '#434447' : 'white'; // Gray 80 for light backgrounds

            // Create avatar element
            const avatar = document.createElement('div');
            avatar.className = 'generated-avatar';
            avatar.textContent = initials;
            avatar.style.cssText = `
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: ${backgroundColor};
                color: ${textColor};
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 14px;
                border: 3px solid var(--ds-color-link);
                box-sizing: border-box;
            `;

            return avatar;
        },

        // Create avatar HTML string
        generateAvatarHTML: (name, userId = '', size = 40) => {
            const avatarColors = [
                '#F39800', '#e57b03', '#004280', '#003160', '#336899',
                '#e8ecef', '#cfd2d5', '#b6bfc1', '#737b7d'
            ];

            const getInitials = (fullName) => {
                if (!fullName) return 'U';
                const names = fullName.trim().split(' ');
                if (names.length === 1) {
                    return names[0].substring(0, 2).toUpperCase();
                }
                return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
            };

            const getColorIndex = (str) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return Math.abs(hash) % avatarColors.length;
            };

            const initials = getInitials(name);
            const colorIndex = getColorIndex(userId || name);
            const backgroundColor = avatarColors[colorIndex];
            
            // Determine text color based on background
            const isLightColor = ['#e8ecef', '#cfd2d5', '#b6bfc1'].includes(backgroundColor);
            const textColor = isLightColor ? '#434447' : 'white';

            return `<div class="generated-avatar" style="
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background-color: ${backgroundColor};
                color: ${textColor};
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: ${Math.round(size * 0.35)}px;
                border: 1px solid var(--ds-color-link);
                box-sizing: border-box;
            ">${initials}</div>`;
        },

        // Create avatar HTML string without border (for Account Management)
        generateAvatarHTMLNoBorder: (name, userId = '', size = 40) => {
            const avatarColors = [
                '#F39800', '#e57b03', '#004280', '#003160', '#336899',
                '#e8ecef', '#cfd2d5', '#b6bfc1', '#737b7d'
            ];

            const getInitials = (fullName) => {
                if (!fullName) return 'U';
                const names = fullName.trim().split(' ');
                if (names.length === 1) {
                    return names[0].substring(0, 2).toUpperCase();
                }
                return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
            };

            const getColorIndex = (str) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return Math.abs(hash) % avatarColors.length;
            };

            const initials = getInitials(name);
            const colorIndex = getColorIndex(userId || name);
            const backgroundColor = avatarColors[colorIndex];
            
            // Determine text color based on background
            const isLightColor = ['#e8ecef', '#cfd2d5', '#b6bfc1'].includes(backgroundColor);
            const textColor = isLightColor ? '#434447' : 'white';

            return `<div class="generated-avatar" style="
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background-color: ${backgroundColor};
                color: ${textColor};
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: ${Math.round(size * 0.35)}px;
                box-sizing: border-box;
            ">${initials}</div>`;
        },

        // Create placeholder avatar for Account Management
        generateAvatarHTMLPlaceholder: (userId = '', size = 40) => {
            // Generate consistent random seed based on userId
            const getRandomSeed = (str) => {
                if (!str) str = Math.random().toString();
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return Math.abs(hash);
            };

            const seed = getRandomSeed(userId);
            
            // Use external image service for consistent placeholder images
            const photoId = (seed % 1000) + 1; // Use IDs 1-1000
            const photoUrl = `https://picsum.photos/seed/${photoId}/${size}/${size}`;
            
            return `<div class="real-photo-avatar" style="
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background-image: url('${photoUrl}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                flex-shrink: 0;
                border: 2px solid #f3f4f6;
            "></div>`;
        },

        // Country/Region utility functions
        getCountryCodeFromId: (id) => {
            if (!id || id.length < 3) return 'US';
            const prefix = id.substring(1, 3); // 取 K 後面的兩位
            const countryMap = {
                'TW': 'TW', 'US': 'US', 'DE': 'DE', 'FR': 'FR', 'JP': 'JP',
                'AU': 'AU', 'KR': 'KR', 'IT': 'IT', 'MX': 'MX', 'CN': 'CN',
                'CA': 'CA', 'IN': 'IN', 'NO': 'NO', 'NL': 'NL', 'BR': 'BR',
                'SE': 'SE', 'CH': 'CH', 'DA': 'DK', 'PL': 'PL', 'BE': 'BE',
                'SG': 'SG', 'TH': 'TH', 'MY': 'MY', 'ZA': 'ZA'
            };
            return countryMap[prefix] || 'US';
        },

        getCountryNameFromCode: (countryCode) => {
            const countryNames = {
                'TW': 'Taiwan', 'US': 'United States', 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan',
                'AU': 'Australia', 'KR': 'South Korea', 'IT': 'Italy', 'MX': 'Mexico', 'CN': 'China',
                'CA': 'Canada', 'IN': 'India', 'NO': 'Norway', 'NL': 'Netherlands', 'BR': 'Brazil',
                'SE': 'Sweden', 'CH': 'Switzerland', 'DK': 'Denmark', 'PL': 'Poland', 'BE': 'Belgium',
                'SG': 'Singapore', 'TH': 'Thailand', 'MY': 'Malaysia', 'ZA': 'South Africa'
            };
            return countryNames[countryCode] || 'United States';
        }
    };

    /* ========================================================================
       NAVIGATION & HEADER MANAGEMENT
       ======================================================================== */
    const Navigation = {
        init() {
            this.initializeHeader();
            this.setupEventListeners();
            this.initializeRouting();
        },

        initializeHeader() {
            const headerLogo = document.querySelector('.bel-sidebar-logo img');
            const headerTitle = document.querySelector('.bel-sidebar-logo span');
            const userAvatarContainer = document.querySelector('.bel-user-profile');
            const notificationList = document.querySelector('.bel-notification-list');
            
            if (headerLogo) headerLogo.src = APP_DATA.header.logo;
            if (headerTitle) headerTitle.textContent = APP_DATA.header.portalTitle;
            
            // Replace user avatar with generated avatar
            if (userAvatarContainer) {
                const existingImg = userAvatarContainer.querySelector('img');
                if (existingImg) {
                    const generatedAvatar = utils.generateAvatar(APP_DATA.userProfile.name, APP_DATA.userProfile.email);
                    existingImg.parentNode.replaceChild(generatedAvatar, existingImg);
                }
            }
            
            if (notificationList) {
                notificationList.innerHTML = APP_DATA.header.notifications.map(n => `
                    <li class="bel-notification-item">
                        <div class="title"><span class="bel-badge ${n.type}">${n.tagText}</span>${n.title}</div>
                        ${n.details ? `<div class="details" style="font-size: 0.85em; color: #666; margin-top: 4px;">${n.details}</div>` : ''}
                        <div class="date">${n.date}</div>
                    </li>
                `).join('');
            }
        },

        setupEventListeners() {
            // Hamburger menu toggle
            ui.hamburgerBtn?.addEventListener('click', () => {
                ui.sidebar?.classList.toggle('open');
            });

            // Navigation links
            ui.contentLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    this.showContent(targetId);
                    ui.contentLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    if (window.innerWidth <= 768) ui.sidebar?.classList.remove('open');
                });
            });

            // Notification panel
            ui.notificationBell?.addEventListener('click', (e) => {
                e.stopPropagation();
                ui.notificationPanel?.classList.toggle('show');
            });

            // User profile panel
            ui.userProfile?.addEventListener('click', (e) => {
                e.stopPropagation();
                ui.notificationPanel?.classList.remove('show');
                ui.userProfilePanel?.classList.toggle('show');
            });

            // Close panels when clicking outside
            window.addEventListener('click', (e) => {
                if (ui.notificationPanel && !ui.notificationPanel.contains(e.target) && !ui.notificationBell?.contains(e.target)) {
                    ui.notificationPanel.classList.remove('show');
                }
                if (ui.userProfilePanel && !ui.userProfilePanel.contains(e.target) && !ui.userProfile?.contains(e.target)) {
                    ui.userProfilePanel.classList.remove('show');
                }
            });
        },

        showContent(targetId) {
            ui.contentSections.forEach(s => s.classList.remove('active'));
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Set current content type for filter handling
                ContentManager.currentContentType = targetId;
                
                // Manage header filters visibility based on page
                this.manageHeaderFiltersVisibility(targetId);
                
                // 如果切換到Account Management頁面，渲染帳戶卡片和設置過濾器
                if (targetId === 'Account-Management') {
                    ContentManager.renderAccountCards();
                    ContentManager.setupAccountFilters();
                }
            }
        },

        manageHeaderFiltersVisibility(targetId) {
            const headerFilters = document.querySelector('.bel-header-filters');
            if (headerFilters) {
                // Hide filters on "Respond to Leader" and "Publish Resources" pages
                if (targetId === 'contact-support' || targetId === 'content') {
                    headerFilters.style.display = 'none';
                } else {
                    headerFilters.style.display = 'flex';
                }
            }
        },

        initializeRouting() {
            const initialSectionFromHash = window.location.hash.substring(1);
            const initialActiveInDom = document.querySelector('.content-section.active')?.id;
            const initialSection = initialSectionFromHash || initialActiveInDom || 'dashboard';
            
            ui.contentLinks.forEach(l => l.classList.remove('active'));
            const initialLink = document.querySelector(`.bel-sidebar-nav-link[href="#${initialSection}"]`) ||
                               document.querySelector('.bel-sidebar-nav-link[href="#dashboard"]');
            initialLink?.classList.add('active');
            
            // Set initial content type
            ContentManager.currentContentType = initialSection;
            
            this.showContent(initialSection);
        }
    };

    /* ========================================================================
       DASHBOARD RENDERING - OPTIMIZED VERSION
       ======================================================================== */
    const Dashboard = {
        init() {
            this.setupFilters();
            this.renderSummaryStats();
            // Use default filters for initial render
            const defaultYear = window.selectedDashboardYear || this.getSelectedYear();
            const defaultRegion = window.selectedDashboardRegion || 'all';
            this.renderPerformanceTable(defaultYear, defaultRegion);
            this.renderTopProducts(defaultYear, defaultRegion);
            this.renderTop10Leaderboard();
            this.initializeAllCharts();
            this.setupViewSwitcher();
        },

        /**
         * Unified filter setup - combines year selector and region setup
         */
        setupFilters() {
            // Find all available years from BEL profiles data
            const availableYears = new Set();
            
            if (APP_DATA.belProfiles?.leaderboard) {
                APP_DATA.belProfiles.leaderboard.forEach(leader => {
                    if (leader.monthlyData) {
                        Object.keys(leader.monthlyData).forEach(year => {
                            availableYears.add(year);
                        });
                    }
                });
            }
            
            // Convert to sorted array (newest first)
            const sortedYears = Array.from(availableYears).sort((a, b) => b - a);
            
            // Setup header filters with both year and region (inline functionality)
            if (sortedYears.length > 0) {
                console.log('Setting up header filter with years:', sortedYears);
                
                // Wait for DOM to be ready
                const waitForElements = () => {
                    // Get header filter elements
                    const yearSelect = document.getElementById('header-year-filter');
                    const regionSelect = document.getElementById('header-region-filter');
                    
                    console.log('Filter elements found:', {
                        yearSelect: !!yearSelect,
                        regionSelect: !!regionSelect
                    });
                    
                    if (!yearSelect || !regionSelect) {
                        console.warn('Header filter elements not found, retrying in 100ms...');
                        setTimeout(waitForElements, 100);
                        return;
                    }
                    
                    // Populate year selector with available years
                    const currentYear = new Date().getFullYear().toString();
                    const defaultYear = sortedYears.includes(currentYear) ? currentYear : sortedYears[0];
                    
                    console.log('Setting up years:', { currentYear, defaultYear, years: sortedYears });
                    
                    // Clear existing options and add "All Years" + available years
                    yearSelect.innerHTML = `
                        <option value="all">All Years</option>
                        ${sortedYears.map(year => 
                            `<option value="${year}" ${year === defaultYear ? 'selected' : ''}>${year}</option>`
                        ).join('')}
                    `;
                    
                    // Setup region selector with data detection
                    this.setupRegionSelectorWithDataDetection(regionSelect);
                    
                    // Setup change handlers
                    const handleFilterChange = () => {
                        const selectedYear = yearSelect.value;
                        const selectedRegion = regionSelect.value;
                        console.log(`Filter changed - Year: ${selectedYear}, Region: ${selectedRegion}`);
                        this.applyFilters(selectedYear, selectedRegion);
                    };
                    
                    yearSelect.addEventListener('change', handleFilterChange);
                    regionSelect.addEventListener('change', handleFilterChange);
                    
                    // Set initial selected year
                    window.selectedDashboardYear = defaultYear;
                    window.selectedDashboardRegion = 'all';
                    
                    console.log('Header filter setup completed');
                };
                
                // Start the setup process
                waitForElements();
            }
        },

        /**
         * Combined region selector setup with data detection
         * Merges: setupRegionSelector + updateRegionSelectWithDisabledOptions
         */
        setupRegionSelectorWithDataDetection(regionSelect) {
            // Standard regions defined in getRegionFromCountry function
            const standardRegions = [
                'AAU / NZ', 'ASEAN', 'China', 'Europe', 'India', 'Japan',
                'Korea', 'LATAM', 'ME&A', 'North America', 'Taiwan', 
                'Russia & CIS', 'Others'
            ];
            
            // Get regions that have actual data
            const regionsWithData = new Set();
            if (APP_DATA.belProfiles?.leaderboard) {
                APP_DATA.belProfiles.leaderboard.forEach(leader => {
                    if (leader.region) {
                        regionsWithData.add(leader.region);
                    }
                });
            }
            
            console.log('Using standard regions from getRegionFromCountry:', standardRegions);
            console.log('Regions with data:', Array.from(regionsWithData));
            
            // Create region options with disabled state for regions without data
            const regionOptions = standardRegions.map(region => {
                const hasData = regionsWithData.has(region);
                const disabled = hasData ? '' : ' disabled';
                const style = hasData ? '' : ' style="color: #999; font-style: italic;"';
                const suffix = hasData ? '' : ' (No data)';
                
                return `<option value="${region}"${disabled}${style}>${region}${suffix}</option>`;
            }).join('');
            
            regionSelect.innerHTML = `
                <option value="all">All Regions</option>
                ${regionOptions}
            `;
        },

        /**
         * Apply both year and region filters
         */
        applyFilters(selectedYear, selectedRegion) {
            // Store selected filters
            window.selectedDashboardYear = selectedYear;
            window.selectedDashboardRegion = selectedRegion;
            
            // Update all dashboard components with filters
            this.renderSummaryStats(selectedYear, selectedRegion);
            this.renderPerformanceTable(selectedYear, selectedRegion);
            this.renderTopProducts(selectedYear, selectedRegion);
            this.renderTop10Leaderboard(selectedYear, selectedRegion);
            
            // Always initialize charts first
            this.initializeAllCharts(selectedYear, selectedRegion);
            
            // Check which view is currently visible and force update (use computed style for reliability)
            const chartView = document.getElementById('performance-chart-view');
            const tableView = document.getElementById('performance-table-view');
            const isChartVisible = chartView ? getComputedStyle(chartView).display !== 'none' : false;
            const isTableVisible = tableView ? getComputedStyle(tableView).display !== 'none' : false;

            // Always force chart refresh if chart view is visible
            if (isChartVisible) {
                console.log('Force updating Performance Chart with filters:', selectedYear, selectedRegion);
                // Force refresh both Pie Chart and Performance Chart
                setTimeout(() => {
                    this.initializePieChart(selectedYear, selectedRegion);
                    this.initializePerformanceChart(selectedYear, selectedRegion);
                    // Ensure chart layout recalculates after DOM/style changes
                    try { window.performanceChart && window.performanceChart.resize(); } catch (e) {}
                }, 60);
            }

            // If table view is visible, ensure it's updated too
            if (isTableVisible) {
                console.log('Force updating Performance Table with filters:', selectedYear, selectedRegion);
                this.renderPerformanceTable(selectedYear, selectedRegion);
            }
            
            // Update BEL table to reflect header filters
            AccountManagement.updateBelDataForHeaderFilters(selectedYear, selectedRegion);
            AccountManagement.renderTable();
            
            // Update Payout & Orders page if it's currently active
            if (ContentManager.currentContentType === 'payouts-order') {
                console.log('Updating Payout & Orders with filters:', selectedYear, selectedRegion);
                ContentManager.renderPayoutStatsCards(selectedYear, selectedRegion);
                ContentManager.renderPayoutHistory(selectedYear, selectedRegion);
                ContentManager.renderOrdersInPayout(selectedYear, selectedRegion);
            }
        },

        /**
         * Filter BEL profiles data based on year and region
         */
        getFilteredData(year = null, region = null) {
            if (!APP_DATA.belProfiles?.leaderboard) {
                return [];
            }
            
            let filteredData = APP_DATA.belProfiles.leaderboard;
            
            // Apply region filter
            if (region && region !== 'all') {
                filteredData = filteredData.filter(leader => 
                    leader.region === region
                );
                console.log(`Filtered by region "${region}": ${filteredData.length} BELs`);
            }
            
            return filteredData;
        },

        /**
         * Get currently selected year from header filter
         */
        getSelectedYear() {
            const yearSelect = document.getElementById('header-year-filter');
            if (yearSelect && yearSelect.value !== 'all') {
                return yearSelect.value;
            }
            
            // Default to current year or latest available year
            const currentYear = new Date().getFullYear().toString();
            return window.selectedDashboardYear || currentYear;
        },

        /**
         * Calculate BEL count based on account creation date
         * @param {string} year - Year to calculate for
         * @param {number} month - Month to calculate for (1-12)
         * @param {string} region - Region to filter by
         * @returns {number} Number of BELs active at the end of specified month
         */
        calculateBelCountByDate(year, month, region = 'all') {
            if (!APP_DATA.belProfiles?.leaderboard) return 0;
            
            // Get filtered data based on region
            let filteredData = APP_DATA.belProfiles.leaderboard;
            if (region && region !== 'all') {
                filteredData = filteredData.filter(leader => leader.region === region);
            }
            
            // Calculate the target date (end of the specified month)
            const targetDate = new Date(parseInt(year), month - 1, 31);
            
            // Count BELs who joined before or during the target month
            return filteredData.filter(leader => {
                if (!leader.accountCreatedDate) {
                    // Fallback: if no creation date, assume early joiner
                    return true;
                }
                const creationDate = new Date(leader.accountCreatedDate);
                return creationDate <= targetDate;
            }).length;
        },

        /**
         * Unified dashboard statistics calculation
         * Combines: calculateSummaryStats + calculateDashboardStatsForSpecificMonth
         * @param {string} year - Year to calculate (defaults to current selected year)
         * @param {string} region - Region to filter by (defaults to current selected region)
         * @param {number} month - Optional specific month (1-12), if null calculates yearly/all-time stats
         * @returns {Object} Calculated statistics
         */
        calculateDashboardStats(year = null, region = null, month = null) {
            // Use selected year/region or default
            const selectedYear = year || this.getSelectedYear();
            const selectedRegion = region || window.selectedDashboardRegion || 'all';
            
            if (!APP_DATA.belProfiles?.leaderboard) {
                return {
                    belCount: 0,
                    totalClicks: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                    avgConvRate: 0,
                    avgAov: 0
                };
            }

            // Get filtered data based on region
            const filteredLeaderboard = this.getFilteredData(selectedYear, selectedRegion);
            
            // Calculate totals
            let totalClicks = 0;
            let totalOrders = 0;
            let totalRevenue = 0;
            let totalConvRateSum = 0;
            let totalAovSum = 0;
            let validCvrCount = 0;
            let validAovCount = 0;
            let activeBelCount = 0;

            // Calculate BEL count based on month/year selection and account creation dates
            if (month !== null) {
                // For specific month, count BELs who had joined by end of that month
                activeBelCount = this.calculateBelCountByDate(selectedYear.toString(), month, selectedRegion);
            } else {
                // For yearly calculation, count BELs active at end of selected year
                const endOfYear = selectedYear === 'all' ? 
                    new Date().getFullYear() : parseInt(selectedYear);
                activeBelCount = this.calculateBelCountByDate(endOfYear.toString(), 12, selectedRegion);
            }

            filteredLeaderboard.forEach(leader => {
                let userClicks = 0;
                let userOrders = 0;
                let userRevenue = 0;
                
                // Process data based on whether we want specific month or yearly/all-time
                if (leader.monthlyData) {
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    
                    if (month !== null) {
                        // Calculate for specific month
                        const monthName = monthNames[month - 1];
                        if (leader.monthlyData[selectedYear.toString()]) {
                            const monthData = leader.monthlyData[selectedYear.toString()][monthName];
                            if (monthData) {
                                userClicks = monthData.clicks || 0;
                                userOrders = monthData.orders || 0;
                                userRevenue = monthData.revenue || 0;
                            }
                        }
                    } else {
                        // Calculate yearly or all-time data
                        if (selectedYear === 'all') {
                            // For "All Years", sum all available years
                            Object.keys(leader.monthlyData).forEach(year => {
                                const currentDate = new Date();
                                const currentYear = currentDate.getFullYear().toString();
                                
                                let monthsToSum = monthNames;
                                if (year === currentYear) {
                                    // For current year, only sum up to current month
                                    const currentMonth = currentDate.getMonth(); // 0-based
                                    monthsToSum = monthNames.slice(0, currentMonth + 1);
                                }
                                
                                monthsToSum.forEach(monthName => {
                                    const monthData = leader.monthlyData[year][monthName];
                                    if (monthData) {
                                        userClicks += monthData.clicks || 0;
                                        userOrders += monthData.orders || 0;
                                        userRevenue += monthData.revenue || 0;
                                    }
                                });
                            });
                        } else if (leader.monthlyData[selectedYear]) {
                            // For specific year
                            const currentDate = new Date();
                            const currentYear = currentDate.getFullYear().toString();
                            
                            let monthsToSum = monthNames;
                            if (selectedYear === currentYear) {
                                // For current year, only sum up to current month
                                const currentMonth = currentDate.getMonth(); // 0-based
                                monthsToSum = monthNames.slice(0, currentMonth + 1);
                            }
                            
                            monthsToSum.forEach(monthName => {
                                const monthData = leader.monthlyData[selectedYear][monthName];
                                if (monthData) {
                                    userClicks += monthData.clicks || 0;
                                    userOrders += monthData.orders || 0;
                                    userRevenue += monthData.revenue || 0;
                                }
                            });
                        }
                    }
                }
                
                totalClicks += userClicks;
                totalOrders += userOrders;
                totalRevenue += userRevenue;
                
                // Calculate user's CVR dynamically (orders / clicks * 100)
                if (userClicks > 0) {
                    const userCvr = (userOrders / userClicks) * 100;
                    totalConvRateSum += userCvr;
                    validCvrCount += 1;
                }
                
                // Calculate user's AOV
                if (userOrders > 0) {
                    const userAov = userRevenue / userOrders;
                    totalAovSum += userAov;
                    validAovCount += 1;
                }
            });

            // Calculate final metrics
            const avgConvRate = validCvrCount > 0 ? totalConvRateSum / validCvrCount : 0;
            const avgAov = validAovCount > 0 ? totalAovSum / validAovCount : 0;

            return {
                belCount: activeBelCount,
                totalClicks,
                totalOrders,
                totalRevenue,
                avgConvRate,
                avgAov
            };
        },

        /**
         * Calculate dashboard statistics trends for previous month comparison
         * @param {string} selectedYear - Year to filter by
         * @param {string} selectedRegion - Region to filter by
         * @returns {Object} Previous month statistics and trend information
         */
        calculateDashboardTrends(selectedYear = null, selectedRegion = 'all') {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // 1-12
            const currentYear = currentDate.getFullYear();
            
            // Calculate previous month (the month we want to show trends for)
            let targetMonth = currentMonth - 1;
            let targetYear = currentYear;
            if (targetMonth === 0) {
                targetMonth = 12;
                targetYear = currentYear - 1;
            }
            
            // Calculate the month before the target month (for comparison)
            let comparisonMonth = targetMonth - 1;
            let comparisonYear = targetYear;
            if (comparisonMonth === 0) {
                comparisonMonth = 12;
                comparisonYear = targetYear - 1;
            }
            
            // Get month names
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const targetMonthName = monthNames[targetMonth - 1];
            
            // Use unified stats function for specific months
            const targetMonthStats = this.calculateDashboardStats(targetYear, selectedRegion, targetMonth);
            const comparisonMonthStats = this.calculateDashboardStats(comparisonYear, selectedRegion, comparisonMonth);
            
            // Calculate growth/decline from comparison month to target month
            const belCountGrowth = targetMonthStats.belCount - comparisonMonthStats.belCount;
            const totalClicksGrowth = targetMonthStats.totalClicks - comparisonMonthStats.totalClicks;
            const totalOrdersGrowth = targetMonthStats.totalOrders - comparisonMonthStats.totalOrders;
            const revenueGrowth = targetMonthStats.totalRevenue - comparisonMonthStats.totalRevenue;
            const convRateGrowth = targetMonthStats.avgConvRate - comparisonMonthStats.avgConvRate;
            const aovGrowth = targetMonthStats.avgAov - comparisonMonthStats.avgAov;
            
            // Format trend values
            const formatTrendValue = (growth, isMonetary = false, isPercentage = false) => {
                if (growth === 0) return '0';
                const sign = growth > 0 ? '+' : '';
                
                if (isPercentage) {
                    return `${sign}${growth.toFixed(2)}%`;
                } else if (isMonetary) {
                    if (Math.abs(growth) >= 100000) {
                        return `${sign}$${(growth / 1000).toFixed(0)}k`;
                    } else {
                        return `${sign}$${Math.abs(growth).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}`;
                    }
                } else {
                    if (Math.abs(growth) >= 1000) {
                        return `${sign}${(growth / 1000).toFixed(0)}k`;
                    }
                    return `${sign}${growth.toLocaleString()}`;
                }
            };
            
            return {
                targetMonthName,
                belCountTrend: {
                    value: formatTrendValue(belCountGrowth),
                    status: belCountGrowth >= 0 ? 'positive' : 'negative',
                    text: `${belCountGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                },
                totalClicksTrend: {
                    value: formatTrendValue(totalClicksGrowth),
                    status: totalClicksGrowth >= 0 ? 'positive' : 'negative',
                    text: `${totalClicksGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                },
                totalOrdersTrend: {
                    value: formatTrendValue(totalOrdersGrowth),
                    status: totalOrdersGrowth >= 0 ? 'positive' : 'negative',
                    text: `${totalOrdersGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                },
                revenueTrend: {
                    value: formatTrendValue(revenueGrowth, true),
                    status: revenueGrowth >= 0 ? 'positive' : 'negative',
                    text: `${revenueGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                },
                convRateTrend: {
                    value: formatTrendValue(convRateGrowth, false, true),
                    status: convRateGrowth >= 0 ? 'positive' : 'negative',
                    text: `${convRateGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                },
                aovTrend: {
                    value: formatTrendValue(aovGrowth, true),
                    status: aovGrowth >= 0 ? 'positive' : 'negative',
                    text: `${aovGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                }
            };
        },

        renderSummaryStats(year = null, region = null) {
            const statsContainer = document.querySelector('.bel-stats-cards');
            if (!statsContainer) return;
            
            // Use unified stats calculation
            const realTimeStats = this.calculateDashboardStats(year, region);
            
            // Calculate dynamic trends based on month-over-month comparison
            const trends = this.calculateDashboardTrends(year, region);
            
            // Format values for display - use utils functions instead of duplicate formatDisplayValue
            const belCountValue = realTimeStats.belCount.toString();
            const totalClicksValue = realTimeStats.totalClicks >= 100000 ? 
                Math.round(realTimeStats.totalClicks / 1000) + 'k' : 
                realTimeStats.totalClicks >= 10000 ? 
                (realTimeStats.totalClicks / 1000).toFixed(1) + 'k' : 
                realTimeStats.totalClicks.toLocaleString();
            const totalOrdersValue = realTimeStats.totalOrders < 100000 ? realTimeStats.totalOrders.toString() : 
                realTimeStats.totalOrders >= 100000 ? 
                Math.round(realTimeStats.totalOrders / 1000) + 'k' : 
                realTimeStats.totalOrders >= 10000 ? 
                (realTimeStats.totalOrders / 1000).toFixed(1) + 'k' : 
                realTimeStats.totalOrders.toLocaleString();
            const revenueValue = realTimeStats.totalRevenue >= 100000 ? 
                '$' + Math.round(realTimeStats.totalRevenue / 1000) + 'k' : 
                realTimeStats.totalRevenue >= 10000 ? 
                '$' + (realTimeStats.totalRevenue / 1000).toFixed(1) + 'k' : 
                utils.formatMoney(realTimeStats.totalRevenue);
            const convRateValue = realTimeStats.avgConvRate.toFixed(2) + '%';
            const aovValue = realTimeStats.avgAov >= 100000 ? 
                '$' + Math.round(realTimeStats.avgAov / 1000) + 'k' : 
                '$' + realTimeStats.avgAov.toFixed(1);
            
            // Use configuration data for static properties (icons) but dynamic trends
            const config = APP_DATA.dashboard.summaryStatsConfig;
            
            const stats = {
                belCount: {
                    title: config.belCount.title,
                    value: belCountValue,
                    icon: config.belCount.icon,
                    trend: trends.belCountTrend.value,
                    trendText: trends.belCountTrend.text,
                    status: trends.belCountTrend.status
                },
                totalClicks: {
                    title: config.totalClicks.title,
                    value: totalClicksValue,
                    icon: config.totalClicks.icon,
                    trend: trends.totalClicksTrend.value,
                    trendText: trends.totalClicksTrend.text,
                    status: trends.totalClicksTrend.status
                },
                totalOrders: {
                    title: config.totalOrders.title,
                    value: totalOrdersValue,
                    icon: config.totalOrders.icon,
                    trend: trends.totalOrdersTrend.value,
                    trendText: trends.totalOrdersTrend.text,
                    status: trends.totalOrdersTrend.status
                },
                revenue: {
                    title: config.revenue.title,
                    value: revenueValue,
                    icon: config.revenue.icon,
                    trend: trends.revenueTrend.value,
                    trendText: trends.revenueTrend.text,
                    status: trends.revenueTrend.status
                },
                convRate: {
                    title: config.convRate.title,
                    value: convRateValue,
                    icon: config.convRate.icon,
                    trend: trends.convRateTrend.value,
                    trendText: trends.convRateTrend.text,
                    status: trends.convRateTrend.status
                },
                aov: {
                    title: config.aov.title,
                    value: aovValue,
                    icon: config.aov.icon,
                    trend: trends.aovTrend.value,
                    trendText: trends.aovTrend.text,
                    status: trends.aovTrend.status
                }
            };
            
            statsContainer.innerHTML = Object.values(stats).map(stat => `
                <div class="bel-card">
                    <div style="width: 100%;display: flex; flex-direction: row; justify-content: space-between;">
                        <div>
                            <div class="bel-card-title">${stat.title}</div>
                            <div class="bel-card-value">${stat.value}</div>
                        </div>
                        <div class="bel-card-icon"><i class="${stat.icon}"></i></div>
                    </div>
                    <div class="trend-indicator ${stat.status}">
                        <i class="fas fa-caret-${stat.status === 'positive' ? 'up' : 'down'}"></i> 
                        ${stat.trend} 
                        <span class="trend-indicator-text">${stat.trendText}</span>
                    </div>
                </div>
            `).join('');
        },

        /**
         * Calculate performance data by level using yearly cumulative data from monthly data
         * @param {string} year - Year to calculate (defaults to current selected year)
         * @returns {Array} Performance details by level
         */
        calculatePerformanceByLevel(year = null, region = null) {
            // Use selected year/region or default
            const selectedYear = year || this.getSelectedYear();
            const selectedRegion = region || window.selectedDashboardRegion || 'all';
            
            if (!APP_DATA.belProfiles?.leaderboard) return [];
            
            // Combine A and K levels - don't separate by referral prefix
            const levelStats = {
                'Builder': { clicks: 0, orders: 0, revenue: 0, count: 0 },
                'Enabler': { clicks: 0, orders: 0, revenue: 0, count: 0 },
                'Exploder': { clicks: 0, orders: 0, revenue: 0, count: 0 },
                'Leader': { clicks: 0, orders: 0, revenue: 0, count: 0 }
            };
            
            // Get filtered data based on region
            const filteredLeaderboard = this.getFilteredData(selectedYear, selectedRegion);
            
            // Aggregate data for each level (without A/K separation)
            filteredLeaderboard.forEach(leader => {
                const level = leader.level;
                
                if (!levelStats[level]) return;
                
                // Calculate yearly cumulative data
                const yearlyData = (selectedYear === 'all')
                    ? AccountManagement.calculateTotalPerformance(leader)
                    : AccountManagement.calculateYearlyData(leader, selectedYear);
                
                levelStats[level].clicks += yearlyData.clicks;
                levelStats[level].orders += yearlyData.orders;
                levelStats[level].revenue += yearlyData.revenue;
                levelStats[level].count += 1;
            });
            
            // Convert to performance details format
            return Object.entries(levelStats).map(([level, stats]) => {
                const convRate = stats.clicks > 0 ? (stats.orders / stats.clicks) * 100 : 0;
                const aov = stats.orders > 0 ? stats.revenue / stats.orders : 0;
                
                return {
                    level: level,
                    clicks: stats.clicks,
                    revenue: stats.revenue,
                    orders: stats.orders,
                    convRate: convRate,
                    aov: aov,
                    // Formatted values for display
                    clicksFormatted: stats.clicks.toLocaleString(),
                    revenueFormatted: utils.formatMoney(stats.revenue),
                    ordersFormatted: stats.orders.toLocaleString(),
                    convRateFormatted: `${convRate.toFixed(2)}%`,
                    aovFormatted: utils.formatMoney(aov, 2)
                };
            });
        },

        renderPerformanceTable(year = null, region = null) {
            const tableBody = document.querySelector('#performance-table-view tbody');
            if (!tableBody) return;
            
            // Use dynamic calculation instead of static data
            const performanceDetails = this.calculatePerformanceByLevel(year, region);
            
            tableBody.innerHTML = performanceDetails.map(detail => `
                <tr>
                    <td><span class="bel-badge ${detail.level.toLowerCase()}">${detail.level}</span></td>
                    <td data-sort-value="${detail.clicks}">${detail.clicksFormatted}</td>
                    <td data-sort-value="${detail.revenue}">${detail.revenueFormatted}</td>
                    <td data-sort-value="${detail.orders}">${detail.ordersFormatted}</td>
                    <td data-sort-value="${detail.convRate}">${detail.convRateFormatted}</td>
                    <td data-sort-value="${detail.aov}">${detail.aovFormatted}</td>
                </tr>
            `).join('');

            // Apply sorting to the performance table
            const performanceTable = document.querySelector('#performance-table-view table');
            if (performanceTable) {
                TableUtils.makeTableSortable(performanceTable);
            }
        },

        // Build Top Products list from category data with Year/Region awareness
        getTopProductsFor(year = null, region = null) {
            const categoryData = this.getCategoryDataFor(year, region);
            const productTotals = new Map(); // product -> {units, price, totalRevenue}

            Object.values(categoryData).forEach(products => {
                (products || []).forEach(p => {
                    const productName = p.product;
                    const units = p.units || 0;
                    const price = p.price || 0; // 直接從產品數據中讀取價格
                    
                    if (productTotals.has(productName)) {
                        const existing = productTotals.get(productName);
                        existing.units += units;
                        existing.totalRevenue += (price * units);
                        // 使用最新的價格（假設同一產品在不同地區價格相同）
                        if (price > 0) existing.price = price;
                    } else {
                        productTotals.set(productName, {
                            units: units,
                            price: price,
                            totalRevenue: price * units
                        });
                    }
                });
            });

            // 備用：如果產品數據中沒有價格，則從靜態數據中讀取
            const topProductsStatic = APP_DATA?.dashboard?.productAnalysis?.topProducts || [];
            const staticPriceMap = new Map();
            topProductsStatic.forEach(item => {
                const priceNum = typeof item.price === 'string'
                    ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
                    : (item.price || 0);
                staticPriceMap.set(item.product, priceNum);
            });

            // Convert to array and sort by units desc
            const list = Array.from(productTotals.entries())
                .map(([product, data]) => {
                    let price = data.price;
                    let totalRevenue = data.totalRevenue;
                    
                    // 如果沒有價格，嘗試從靜態數據獲取
                    if (!price && staticPriceMap.has(product)) {
                        price = staticPriceMap.get(product);
                        totalRevenue = price * data.units;
                    }
                    
                    return {
                        product,
                        units: data.units,
                        price: price,
                        totalRevenue: totalRevenue
                    };
                })
                .sort((a, b) => b.units - a.units) // 按銷量排序
                .slice(0, 20)
                .map((item, idx) => ({
                    rank: idx + 1,
                    product: item.product,
                    price: item.price > 0 ? `$${item.price.toLocaleString()}` : '-',
                    units: item.units.toLocaleString(),
                    total: item.totalRevenue > 0 ? `$${item.totalRevenue.toLocaleString()}` : '-'
                }));

            return list;
        },

        renderTopProducts(year = null, region = null) {
            const tableBody = document.querySelector('.product-sales-grid .scrollable-table-container tbody');
            if (!tableBody) return;
            
            // Use filtered top products computed from category data
            const items = this.getTopProductsFor(year, region);
            
            tableBody.innerHTML = items.map(product => `
                <tr>
                    <td>${product.rank}</td>
                    <td>${product.product}</td>
                    <td>${product.price}</td>
                    <td>${product.units}</td>
                    <td>${product.total}</td>
                </tr>
            `).join('');

            // Apply sorting to the top products table
            const topProductsTable = document.querySelector('.product-sales-grid .scrollable-table-container table');
            if (topProductsTable) {
                TableUtils.makeTableSortable(topProductsTable);
            }
        },

        /**
         * Render Top 10 Performance Leaderboard with header filter support
         * @param {string} year - Year to filter by (defaults to current selected year)
         * @param {string} region - Region to filter by (defaults to current selected region)
         */
        renderTop10Leaderboard(year = null, region = null) {
            const tableBody = document.querySelector('#bel-table tbody');
            if (!tableBody) return;
            
            // Use selected year/region or default
            const selectedYear = year || this.getSelectedYear();
            const selectedRegion = region || window.selectedDashboardRegion || 'all';
            
            console.log(`Rendering Top 10 Leaderboard for Year: ${selectedYear}, Region: ${selectedRegion}`);
            
            if (!APP_DATA.belProfiles?.leaderboard) {
                tableBody.innerHTML = `
                    <tr class="no-results">
                        <td colspan="11" style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                            No BEL data available.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Get filtered data based on region
            let filteredData = this.getFilteredData(selectedYear, selectedRegion);
            
            // Calculate yearly performance data for each BEL
            const belWithPerformance = filteredData.map(leader => {
                // When 'All Years' is selected, calculate total performance across all years
                const yearlyData = (selectedYear === 'all')
                    ? AccountManagement.calculateTotalPerformance(leader)
                    : AccountManagement.calculateYearlyData(leader, selectedYear);

                const conv = yearlyData.clicks > 0 ? (yearlyData.orders / yearlyData.clicks) * 100 : 0;
                const aov = yearlyData.orders > 0 ? yearlyData.revenue / yearlyData.orders : 0;
                
                return {
                    ...leader,
                    clicks: yearlyData.clicks,
                    orders: yearlyData.orders,
                    revenue: yearlyData.revenue,
                    convRate: conv,
                    aov: aov,
                    // Calculate a performance score (weighted combination of metrics)
                    performanceScore: (yearlyData.revenue * 0.4) + (yearlyData.orders * 0.3) + (yearlyData.clicks * 0.2) + (conv * 0.1)
                };
            });
            
            // Sort by performance score (descending) and take top 10
            const top10 = belWithPerformance
                .sort((a, b) => b.performanceScore - a.performanceScore)
                .slice(0, 10);
                
            console.log(`Top 10 BELs filtered:`, top10.length);
            
            // Handle empty results
            if (top10.length === 0) {
                tableBody.innerHTML = `
                    <tr class="no-results">
                        <td colspan="11" style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                            No accounts found matching the current filters.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Apply sorting to the BEL table
            const belTable = document.querySelector('#bel-table');
            if (belTable) {
                TableUtils.makeTableSortable(belTable);
            }
        },

        /**
         * Unified chart management system
         * Replaces: initializeCharts, and manages all chart initialization
         */
        initializeAllCharts(year = null, region = null) {
            console.log('Initializing all charts with filters:', year, region);
            
            // Force refresh Level Distribution Pie Chart
            this.initializePieChart(year, region);
            
            // Initialize Product Category Chart with current filters
            this.initializeProductCategoryChart(year, region);
            
            // Force refresh Performance Chart
            this.initializePerformanceChart(year, region);
        },

        initializePieChart(year = null, region = null) {
            console.log('Initializing 2-Layer Level Distribution Pie Chart with filters:', year, region);
            const pieCtx = document.getElementById('level-pie-chart');
            if (pieCtx && window.Chart) {
                console.log('Pie Chart canvas found, updating data...');
                // Calculate real-time level distribution from BEL profiles
                const levelCounts = this.calculateLevelDistribution(year, region);
                
                // Destroy existing chart if it exists
                if (window.levelPieChart) {
                    window.levelPieChart.destroy();
                }
                
                window.levelPieChart = new Chart(pieCtx, {
                    type: 'doughnut',
                    data: {
                        labels: levelCounts.allLabels,
                        datasets: [
                            {
                                label: 'Level K (Outer)',
                                data: levelCounts.outerData,
                                backgroundColor: levelCounts.outerColors,
                                borderColor: '#ffffff',
                                borderWidth: 2,
                                weight: 1
                            },
                            {
                                label: 'Level A (Inner)',
                                data: levelCounts.innerData,
                                backgroundColor: levelCounts.innerColors,
                                borderColor: '#ffffff',
                                borderWidth: 2,
                                weight: 0.6
                            }
                        ]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0
                            }
                        },
                        plugins: { 
                            legend: { 
                                position: 'left',
                                align: 'center',
                                labels: { 
                                    padding: 6,
                                    boxWidth: 10,
                                    boxHeight: 10,
                                    font: {
                                        size: 10
                                    },
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    generateLabels: function(chart) {
                                        const labels = [];
                                        const data = chart.data;
                                        
                                        // Generate labels for both datasets
                                        data.datasets.forEach((dataset, datasetIndex) => {
                                            const meta = chart.getDatasetMeta(datasetIndex);
                                            if (meta && dataset.data) {
                                                dataset.data.forEach((value, index) => {
                                                    if (value > 0) { // Only show non-zero values
                                                        const style = meta.controller.getStyle(index);
                                                        const levelType = datasetIndex === 0 ? 'K' : 'A';
                                                        const levelName = data.labels[index];
                                                        
                                                        labels.push({
                                                            text: `${levelName}-${levelType}: ${value}`,
                                                            fillStyle: style.backgroundColor,
                                                            strokeStyle: style.borderColor,
                                                            lineWidth: style.borderWidth,
                                                            pointStyle: 'circle',
                                                            hidden: isNaN(value) || meta.data[index].hidden,
                                                            datasetIndex: datasetIndex,
                                                            index: index
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                        
                                        return labels;
                                    }
                                } 
                            },
                            tooltip: {
                                callbacks: {
                                    title: function(context) {
                                        const ctx = context[0];
                                        const levelType = ctx.datasetIndex === 0 ? 'K' : 'A';
                                        const levelName = ctx.label;
                                        return `${levelName}-${levelType}`;
                                    },
                                    label: function(context) {
                                        const value = context.parsed;
                                        const dataset = context.dataset;
                                        const total = dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                        const layerName = context.datasetIndex === 0 ? 'Outer Layer' : 'Inner Layer';
                                        return `${layerName}: ${value} (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        elements: {
                            arc: {
                                borderWidth: 2
                            }
                        }
                    }
                });
            }
        },

        /**
         * Calculate real-time level distribution from BEL profiles data for 2-layer pie chart
         * @param {string} year - Year to calculate (defaults to current selected year)
         * @returns {Object} Level distribution with outer (K) and inner (A) layer data
         */
        calculateLevelDistribution(year = null, region = null) {
            if (!APP_DATA.belProfiles?.leaderboard) {
                return {
                    allLabels: ["Builder", "Enabler", "Exploder", "Leader"],
                    outerData: [0, 0, 0, 0],
                    innerData: [0, 0, 0, 0],
                    outerColors: ["#006EFF", "#00893a", "#f39800", "#db3a3a"],
                    innerColors: ["#4d9fff", "#4da854", "#f7b24d", "#e55d5d"]
                };
            }

            // For 2-layer pie chart: separate by A/K referral prefix
            const levelCountK = {
                'Builder': 0,
                'Enabler': 0,
                'Exploder': 0,
                'Leader': 0
            };
            
            const levelCountA = {
                'Builder': 0,
                'Enabler': 0,
                'Exploder': 0,
                'Leader': 0
            };

            // Get filtered data based on region
            const selectedRegion = region || window.selectedDashboardRegion || 'all';
            const filteredLeaderboard = this.getFilteredData(year, selectedRegion);

            // Count actual levels from filtered BEL profiles, separating by Referral ID prefix
            filteredLeaderboard.forEach(leader => {
                const level = leader.level;
                const referralPrefix = leader.id && leader.id.startsWith('A') ? 'A' : 'K';
                
                // Count K levels (outer layer)
                if (referralPrefix === 'K' && levelCountK[level] !== undefined) {
                    levelCountK[level]++;
                }
                
                // Count A levels (inner layer)
                if (referralPrefix === 'A' && levelCountA[level] !== undefined) {
                    levelCountA[level]++;
                }
            });

            return {
                allLabels: ["Builder", "Enabler", "Exploder", "Leader"],
                // Outer layer data (K levels) - darker colors
                outerData: [
                    levelCountK['Builder'],
                    levelCountK['Enabler'],
                    levelCountK['Exploder'],
                    levelCountK['Leader']
                ],
                // Inner layer data (A levels) - lighter colors
                innerData: [
                    levelCountA['Builder'],
                    levelCountA['Enabler'],
                    levelCountA['Exploder'],
                    levelCountA['Leader']
                ],
                // Outer layer colors (darker shades for K levels)
                outerColors: ["#006EFF", "#00893a", "#f39800", "#db3a3a"],
                // Inner layer colors (lighter shades for A levels)
                innerColors: ["#4d9fff", "#4da854", "#f7b24d", "#e55d5d"]
            };
        },

        // Resolve category/product units by year/region with sensible fallbacks
        getCategoryDataFor(year = null, region = null) {
            const selectedYear = year || this.getSelectedYear();
            const selectedRegion = region || window.selectedDashboardRegion || 'all';
            const analysis = APP_DATA?.dashboard?.productAnalysis || {};
            const byYR = analysis.categoryDataByYearRegion || null;

            // Helper to merge multiple categoryData objects
            const mergeCategoryData = (dataObjects) => {
                const result = {};
                dataObjects.forEach(dataObj => {
                    if (!dataObj) return;
                    Object.entries(dataObj).forEach(([category, products]) => {
                        if (!result[category]) result[category] = [];
                        (products || []).forEach(p => {
                            const idx = result[category].findIndex(x => x.product === p.product);
                            if (idx >= 0) {
                                // 合併數量，保持價格
                                result[category][idx].units += (p.units || 0);
                                // 如果當前產品有價格，使用它（假設同一產品在不同地區價格相同）
                                if (p.price && p.price > 0) {
                                    result[category][idx].price = p.price;
                                }
                            } else {
                                // 添加新產品，保留所有字段
                                result[category].push({ 
                                    product: p.product, 
                                    units: p.units || 0,
                                    price: p.price || 0
                                });
                            }
                        });
                    });
                });
                return result;
            };

            if (byYR) {
                // Exact match first
                const exact = byYR?.[selectedYear]?.[selectedRegion];
                if (exact) return exact;

                // All years for a specific region
                if (selectedYear === 'all' && selectedRegion !== 'all') {
                    const allYears = Object.values(byYR).map(regMap => regMap?.[selectedRegion]).filter(Boolean);
                    if (allYears.length) return mergeCategoryData(allYears);
                }

                // All regions for a specific year
                if (selectedRegion === 'all' && selectedYear !== 'all') {
                    const regMap = byYR?.[selectedYear] || {};
                    const allRegions = Object.values(regMap).filter(Boolean);
                    if (allRegions.length) return mergeCategoryData(allRegions);
                }

                // Both all -> merge everything
                if (selectedYear === 'all' && selectedRegion === 'all') {
                    const everything = [];
                    Object.values(byYR).forEach(regMap => {
                        Object.values(regMap || {}).forEach(cat => { if (cat) everything.push(cat); });
                    });
                    if (everything.length) return mergeCategoryData(everything);
                }

                // Fallback
                const fallback = byYR?.all?.all;
                if (fallback) return fallback;
            }

            // Legacy flat data
            return analysis.categoryData || {};
        },

        initializeProductCategoryChart(year = null, region = null) {
            const productCategoryCanvas = document.getElementById('product-category-chart');
            if (productCategoryCanvas && window.Chart) {
                // Destroy existing instance if present to avoid overlay/duplication
                if (window.productCategoryChart) {
                    try { window.productCategoryChart.destroy(); } catch (e) {}
                }
                
                // Get category data and calculate total units and revenue for each category
                const categoryData = this.getCategoryDataFor(year, region);
                const categoryStats = {};
                
                // Calculate total units and revenue for each category
                Object.keys(categoryData).forEach(category => {
                    const products = categoryData[category];
                    const totalUnits = products.reduce((sum, p) => sum + (p.units || 0), 0);
                    const totalRevenue = products.reduce((sum, p) => sum + ((p.units || 0) * (p.price || 0)), 0);
                    
                    categoryStats[category] = {
                        units: totalUnits,
                        revenue: totalRevenue
                    };
                });
                
                // Sort categories by total units and take top 5
                const sortedCategories = Object.entries(categoryStats)
                    .sort(([,a], [,b]) => b.units - a.units)
                    .slice(0, 5);
                
                const labels = sortedCategories.map(([category]) => category);
                const data = sortedCategories.map(([, stats]) => stats.units);
                
                // Store category stats for tooltip access
                const categoryStatsMap = {};
                sortedCategories.forEach(([category, stats]) => {
                    categoryStatsMap[category] = stats;
                });
                
                // Use gradient blue colors for the bars
                const blueShades = ['#003160', '#004280', '#336899', '#5a84b3', '#80a0bf'];

                window.productCategoryChart = new Chart(productCategoryCanvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Qty',
                            data: data,
                            backgroundColor: blueShades,
                            borderColor: blueShades,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    title: (tooltipItems) => tooltipItems[0].label,
                                    label: (context) => {
                                        const category = context.label;
                                        const stats = categoryStatsMap[category];
                                        if (stats) {
                                            return [
                                                `Qty: ${stats.units.toLocaleString()}`,
                                                `Total: $${stats.revenue.toLocaleString()}`
                                            ];
                                        }
                                        return `Qty: ${context.parsed.x.toLocaleString()}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: { 
                                    display: true, 
                                    text: 'Qty',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString();
                                    }
                                }
                            },
                            y: {
                                title: { 
                                    display: true, 
                                    text: 'Product Categories',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                },
                                ticks: {
                                    maxRotation: 0,
                                    font: {
                                        size: 11
                                    }
                                }
                            }
                        }
                    }
                });
            }
        },

        initializePerformanceChart(year = null, region = null) {
            console.log('Initializing Performance Chart with filters:', year, region);
            const performanceCtx = document.getElementById('performance-percentage-chart');
            if (performanceCtx && window.Chart) {
                console.log('Performance Chart canvas found, updating data...');
                // Use dynamic calculation instead of static data
                const performanceData = this.calculatePerformanceByLevel(year, region);
                
                // Destroy existing chart if it exists
                if (window.performanceChart) {
                    window.performanceChart.destroy();
                }
                
                // Get CSS variables for colors
                const rootStyle = getComputedStyle(document.documentElement);
                const colors = {
                    blue100: rootStyle.getPropertyValue('--ds-color-brand-dark').trim() || '#003160',
                    blue75: rootStyle.getPropertyValue('--ds-color-brand-light-75').trim() || '#336899',
                    blue30: rootStyle.getPropertyValue('--ds-color-brand-light-30').trim() || '#DFEBF7',
                    orange100: rootStyle.getPropertyValue('--ds-color-primary').trim() || '#F39800'
                };
                
                // Prepare data for the chart
                const labels = performanceData.map(d => d.level);
                const revenueData = performanceData.map(d => 
                    typeof d.revenue === 'string' ? parseFloat(d.revenue.replace(/[$,]/g, '')) : d.revenue
                );
                const clicksData = performanceData.map(d => 
                    typeof d.clicks === 'string' ? parseFloat(d.clicks.replace(/[,]/g, '')) : d.clicks
                );
                const ordersData = performanceData.map(d => d.orders);
                const convRateData = performanceData.map(d => 
                    typeof d.convRate === 'string' ? parseFloat(d.convRate.replace('%', '')) : d.convRate
                );

                window.performanceChart = new Chart(performanceCtx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Revenue ($000s)',
                                data: revenueData.map(val => val / 1000), // Convert to thousands
                                backgroundColor: colors.blue100,
                                borderColor: colors.blue100,
                                borderWidth: 1,
                                yAxisID: 'y',
                                order: 3
                            },
                            {
                                label: 'Clicks (00s)',
                                data: clicksData.map(val => val / 100), // Convert to thousands
                                backgroundColor: colors.blue75,
                                borderColor: colors.blue75,
                                borderWidth: 1,
                                yAxisID: 'y',
                                order: 2
                            },
                            {
                                label: 'Orders',
                                data: ordersData,
                                backgroundColor: colors.blue30,
                                borderColor: colors.blue30,
                                borderWidth: 1,
                                yAxisID: 'y1',
                                order: 1
                            },
                            {
                                label: 'C2O CVR (%)',
                                data: convRateData,
                                backgroundColor: colors.orange100,
                                borderColor: colors.orange100,
                                borderWidth: 3,
                                type: 'line',
                                fill: false,
                                tension: 0.1,
                                yAxisID: 'y2',
                                order: 0,
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                pointBackgroundColor: colors.orange100,
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    boxWidth: 12,
                                    padding: 15,
                                    font: { size: 11 }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    title: (tooltipItems) => `${tooltipItems[0].label} Level`,
                                    label: (context) => {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (label.includes('Revenue')) {
                                            label += `$${(context.parsed.y * 1000).toLocaleString()}`;
                                        } else if (label.includes('Clicks')) {
                                            label += `${(context.parsed.y * 1000).toLocaleString()}`;
                                        } else if (label.includes('C2O CVR (%)')) {
                                            label += `${context.parsed.y}%`;
                                        } else {
                                            label += context.parsed.y;
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'BEL Levels'
                                }
                            },
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Revenue ($000s) / Clicks (00s)'
                                },
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 30,  
                                    callback: function(value) {
                                        return value; 
                                    }
                                },
                                max: 700  
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Orders'
                                },
                                beginAtZero: true,
                                grid: {
                                    drawOnChartArea: false
                                }
                            },
                            y2: {
                                type: 'linear',
                                display: false,
                                position: 'right',
                                beginAtZero: true,
                                max: Math.max(...convRateData) * 1.2
                            }
                        }
                    }
                });
            }
        },

        setupViewSwitcher() {
            const viewSwitcher = document.getElementById('payout-view-switcher');
            if (!viewSwitcher) return;

            const viewButtons = viewSwitcher.querySelectorAll('.view-btn');
            const tableView = document.getElementById('performance-table-view');
            const chartView = document.getElementById('performance-chart-view');

            viewButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const viewType = btn.dataset.view;
                    
                    // Update active button
                    viewButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Show/hide content
                    if (viewType === 'table') {
                        tableView?.style.setProperty('display', 'block');
                        chartView?.style.setProperty('display', 'none');
                        
                        // Re-render performance table with current filters
                        const selectedYear = window.selectedDashboardYear || this.getSelectedYear();
                        const selectedRegion = window.selectedDashboardRegion || 'all';
                        this.renderPerformanceTable(selectedYear, selectedRegion);
                    } else {
                        tableView?.style.setProperty('display', 'none');
                        chartView?.style.setProperty('display', 'block');
                        
                        // Initialize performance chart with current filters
                        setTimeout(() => {
                            if (chartView?.style.display !== 'none') {
                                const selectedYear = window.selectedDashboardYear || this.getSelectedYear();
                                const selectedRegion = window.selectedDashboardRegion || 'all';
                                this.initializePerformanceChart(selectedYear, selectedRegion);
                            }
                        }, 100);
                    }
                });
            });

            // Initialize chart view by default with current filters
            setTimeout(() => {
                const selectedYear = window.selectedDashboardYear || this.getSelectedYear();
                const selectedRegion = window.selectedDashboardRegion || 'all';
                this.initializePerformanceChart(selectedYear, selectedRegion);
            }, 100);
        }
    };

    /* ========================================================================
       Account Management MANAGEMENT
       ======================================================================== */
    const AccountManagement = {
        belData: [],

        init() {
            // Initialize with current header filter values
            const selectedYear = window.selectedDashboardYear || new Date().getFullYear().toString();
            const selectedRegion = window.selectedDashboardRegion || 'all';
            
            this.updateBelDataForHeaderFilters(selectedYear, selectedRegion);
            this.setupEventListeners();
            this.populateFilters();
            this.renderTopPerformersCards();
            this.renderTable();
        },

        /**
         * Calculate cumulative yearly data from monthly data
         * @param {Object} record - BEL record with monthlyData
         * @param {string} year - Year to calculate (defaults to current selected year)
         * @returns {Object} Cumulative data { clicks, orders, revenue }
         */
        calculateYearlyData(record, year = null) {
            const selectedYear = year || window.selectedDashboardYear || new Date().getFullYear().toString();
            
            let cumulativeClicks = 0;
            let cumulativeOrders = 0;
            let cumulativeRevenue = 0;
            
            if (record.monthlyData?.[selectedYear]) {
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear().toString();
                const currentMonth = currentDate.getMonth(); // 0-based
                
                Object.entries(record.monthlyData[selectedYear]).forEach(([monthName, monthData]) => {
                    if (!monthData) return;
                    
                    // For current year, only sum up to current month
                    if (selectedYear === currentYear) {
                        const monthIndex = new Date(`${monthName} 1, ${currentYear}`).getMonth();
                        if (monthIndex > currentMonth) return;
                    }
                    
                    cumulativeClicks += monthData.clicks || 0;
                    cumulativeOrders += monthData.orders || 0;
                    cumulativeRevenue += monthData.revenue || 0;
                });
            }
            
            return {
                clicks: cumulativeClicks,
                orders: cumulativeOrders,
                revenue: cumulativeRevenue
            };
        },

        /**
         * Calculate total performance across all available years
         * @param {Object} record - BEL record with monthlyData
         * @returns {Object} Cumulative data { clicks, orders, revenue }
         */
        calculateTotalPerformance(record) {
            let totalClicks = 0;
            let totalOrders = 0;
            let totalRevenue = 0;

            if (record.monthlyData) {
                Object.keys(record.monthlyData).forEach(year => {
                    const yearlyData = this.calculateYearlyData(record, year);
                    totalClicks += yearlyData.clicks;
                    totalOrders += yearlyData.orders;
                    totalRevenue += yearlyData.revenue;
                });
            }

            return {
                clicks: totalClicks,
                orders: totalOrders,
                revenue: totalRevenue
            };
        },



        setupEventListeners() {
            // Remove Apply/Reset button event listeners - direct filtering implemented instead
            ui.rowsPerPage?.addEventListener('change', () => this.changeRowsPerPage());
            ui.prevBtn?.addEventListener('click', () => this.previousPage());
            ui.nextBtn?.addEventListener('click', () => this.nextPage());
            ui.thSelect?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
            ui.selectAllPage?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
            ui.thead?.addEventListener('click', (e) => this.handleSort(e));
            ui.exportBtn?.addEventListener('click', () => this.exportCSV());

            // Setup direct filtering for dropdown selects
            this.setupDirectFiltering();

            // Search suggestions with direct filtering
            this.setupSearchSuggestions();

            // Row selection
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('row-check')) {
                    const id = e.target.dataset.id;
                    if (e.target.checked) {
                        appState.selected.add(id);
                    } else {
                        appState.selected.delete(id);
                    }
                    this.updateSelectionUI();
                }
            });
        },

        populateFilters() {
            // Dynamically populate Level filter from current data
            const levels = [...new Set(this.belData.map(r => r.level))].sort();
            const levelSelect = document.getElementById('f-level');
            if (levelSelect) {
                levelSelect.innerHTML = '<option value="">All Levels</option>';
                levels.forEach(level => {
                    levelSelect.innerHTML += `<option value="${level}">${level}</option>`;
                });
            }

            // Dynamically populate Country filter from current data
            const countries = [...new Set(this.belData.map(r => r.country))].sort();
            if (ui.countrySel) {
                ui.countrySel.innerHTML = '<option value="">All Countries</option>';
                countries.forEach(country => {
                    ui.countrySel.innerHTML += `<option value="${country}">${country}</option>`;
                });
            }

            // Update Region filter with disabled options for regions without data
            this.updateRegionFilterWithDisabledOptions();
        },

        /**
         * Update Region filter with disabled options for regions that have no data
         */
        updateRegionFilterWithDisabledOptions() {
            const regionSelect = ui.regionSel;
            if (!regionSelect) return;

            // Get all available regions from actual data
            const allRegions = [...new Set(
                APP_DATA.belProfiles?.leaderboard?.map(profile => profile.region).filter(Boolean) || []
            )].sort();
            
            // Get regions that have data in current filtered belData
            const regionsWithData = new Set(this.belData.map(record => record.region).filter(Boolean));
            
            const currentValue = regionSelect.value;
            
            // Create region options with disabled state for regions without data
            const regionOptions = allRegions.map(region => {
                const hasData = regionsWithData.has(region);
                const disabled = hasData ? '' : ' disabled';
                const style = hasData ? '' : ' style="color: #999; font-style: italic;"';
                const suffix = hasData ? '' : ' (No data)';
                const selected = currentValue === region ? ' selected' : '';
                
                return `<option value="${region}"${disabled}${style}${selected}>${region}${suffix}</option>`;
            }).join('');
            
            // Update the select element
            regionSelect.innerHTML = `
                <option value="" ${currentValue === '' ? 'selected' : ''}>All Regions</option>
                ${regionOptions}
            `;
        },

        getProcessedData() {
            const { keyword, referralId, level, region, country, start, end, activity } = appState.filters;
            const startDate = utils.parseDate(start);
            const endDate = utils.parseDate(end);

            let filtered = this.belData.filter(record => {
                const kw = keyword.trim().toLowerCase();
                const rid = referralId.trim().toLowerCase();
                
                // Search by name field
                if (kw && !record.name.toLowerCase().includes(kw)) return false;
                // Search by referral ID field
                if (rid && !record.id.toLowerCase().includes(rid)) return false;
                
                if (level && record.level !== level) return false;
                if (region && record.region !== region) return false;
                if (country && record.country !== country) return false;
                if (activity === 'clicks' && !(record.clicks30 > 0 && record.orders30 === 0)) return false;
                if (activity === 'orders' && !(record.orders30 > 0)) return false;
                if (activity === 'none' && !((record.clicks30 + record.orders30) === 0)) return false;
                return true;
            });

            const { sortBy, sortDir } = appState;
            filtered.sort((a, b) => {
                const valA = a[sortBy];
                const valB = b[sortBy];
                let cmp = 0;
                if (typeof valA === 'number') cmp = valA - valB;
                else cmp = String(valA).localeCompare(String(valB));
                return sortDir === 'asc' ? cmp : -cmp;
            });

            return filtered;
        },

        /**
         * Render the Top Performers Cards
         */
        renderTopPerformersCards() {
            const selectedYear = window.selectedDashboardYear || '2025';
            
            // Get processed data
            const allData = this.belData.map(record => {
                const yearlyData = this.calculateYearlyData(record, selectedYear);
                return {
                    ...record,
                    clicks: yearlyData.clicks,
                    orders: yearlyData.orders,
                    revenue: yearlyData.revenue,
                    cvr: yearlyData.clicks > 0 ? (yearlyData.orders / yearlyData.clicks) * 100 : 0
                };
            });

            // Filter out records with no activity for meaningful rankings
            const activeData = allData.filter(record => 
                record.clicks > 0 || record.orders > 0 || record.revenue > 0
            );

            // Sort by revenue (descending) and take top 3
            const topRevenue = [...activeData]
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 3);

            // Sort by CVR (descending) and take top 3
            const topCVR = [...activeData]
                .filter(record => record.clicks > 0) // Must have clicks to have meaningful CVR
                .sort((a, b) => b.cvr - a.cvr)
                .slice(0, 3);

            // Render each card (only 2 cards now)
            this.renderPerformerCard('top-revenue-performers', topRevenue, 'revenue');
            this.renderPerformerCard('top-cvr-performers', topCVR, 'cvr');
        },

        /**
         * Render individual performer card
         */
        renderPerformerCard(containerId, performers, metricType) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (performers.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #666; font-style: italic; padding: 20px;">No data available</div>';
                return;
            }

            const html = performers.map(performer => {
                let valueDisplay = '';
                
                switch (metricType) {
                    case 'revenue':
                        valueDisplay = utils.formatMoney(performer.revenue);
                        break;
                    case 'cvr':
                        valueDisplay = utils.formatPercent(performer.cvr / 100);
                        break;
                }

                // Use the same avatar generation as bel-acct-mgmt-card
                const avatarHtml = utils.generateAvatarHTMLPlaceholder(performer.id, 40);

                return `
                    <div class="top-performer-item" data-id="${performer.id}" style="cursor: pointer;">
                        ${avatarHtml}
                        <div class="top-performer-info">
                            <div class="top-performer-name">${performer.name}</div>
                            <div class="top-performer-value">${valueDisplay}</div>
                        </div>
                    </div>
                `;
            }).join('');

            const containerHtml = `<div class="top-performers-container">${html}</div>`;
            container.innerHTML = containerHtml;

            // Add click event listeners to open BEL modal
            container.querySelectorAll('.top-performer-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    if (id && window.BELModal) {
                        window.BELModal.openModal(id);
                    }
                });
            });
        },

        renderTable() {
            const processed = this.getProcessedData();
            const total = processed.length;
            const startIndex = (appState.page - 1) * appState.rowsPerPage;
            const pageItems = processed.slice(startIndex, startIndex + appState.rowsPerPage);
            
            if (!ui.tbody) return;

            // Handle empty results
            if (pageItems.length === 0) {
                ui.tbody.innerHTML = `
                    <tr class="no-results">
                        <td colspan="11" style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                            No accounts found matching the current filters.
                        </td>
                    </tr>
                `;
            } else {
                const rows = pageItems.map(record => {
                    const conv = record.clicks30 ? record.orders30 / record.clicks30 : 0;
                    const aov = record.orders30 ? record.revenue30 / record.orders30 : 0;
                    return `
                        <tr data-id="${record.id}">
                            <td><input type="checkbox" class="row-check" data-id="${record.id}" ${appState.selected.has(record.id) ? 'checked' : ''} /></td>
                            <td>${record.id}</td>
                            <td>${record.name}</td>
                            <td><span class="bel-badge ${record.level.toLowerCase()}">${record.level}</span></td>
                            <td style="text-align:right;">${record.clicks30.toLocaleString()}</td>
                            <td style="text-align:right;">${record.orders30.toLocaleString()}</td>
                            <td style="text-align:right;">${utils.formatMoney(record.revenue30)}</td>
                            <td style="text-align:right;">${utils.formatPercent(conv)}</td>
                            <td style="text-align:right;">${record.orders30 ? utils.formatMoney(aov, 2) : '-'}</td>
                            <td>${record.region}</td>
                            <td>${record.country}</td>
                        </tr>
                    `;
                }).join('');
                
                ui.tbody.innerHTML = rows;
            }
            
            this.updatePaginationUI(total, startIndex, pageItems);
            this.updateSelectionUI();
            this.updateSortUI();
        },

        updatePaginationUI(total, startIndex, pageItems) {
            const allOnPageSelected = pageItems.length > 0 && pageItems.every(r => appState.selected.has(r.id));
            if (ui.thSelect) ui.thSelect.checked = allOnPageSelected;
            if (ui.selectAllPage) ui.selectAllPage.checked = allOnPageSelected;

            const from = total === 0 ? 0 : startIndex + 1;
            const to = Math.min(startIndex + appState.rowsPerPage, total);
            if (ui.rangeLabel) ui.rangeLabel.textContent = `${from}–${to} of ${total}`;
            if (ui.prevBtn) ui.prevBtn.disabled = appState.page === 1;
            if (ui.nextBtn) ui.nextBtn.disabled = to >= total;
        },

        updateSelectionUI() {
            if (ui.selectedCount) {
                ui.selectedCount.textContent = `${appState.selected.size} selected`;
            }
        },

        updateSortUI() {
            ui.thead?.querySelectorAll('th[data-sortable]').forEach(th => {
                const key = th.dataset.sortable;
                th.removeAttribute('data-sort-dir');
                if (key === appState.sortBy) th.setAttribute('data-sort-dir', appState.sortDir);
            });
        },

        applyFilters() {
            appState.page = 1;
            appState.selected.clear();
            appState.filters = {
                keyword: document.getElementById('f-name')?.value || '',
                referralId: document.getElementById('f-referral-id')?.value || '',
                level: document.getElementById('f-level')?.value || '',
                region: ui.regionSel?.value || '',
                country: ui.countrySel?.value || '',
                activity: document.getElementById('f-activity')?.value || ''
            };
            this.renderTable();
        },

        changeRowsPerPage() {
            appState.rowsPerPage = parseInt(ui.rowsPerPage?.value, 10) || 20;
            appState.page = 1;
            this.renderTable();
        },

        previousPage() {
            if (appState.page > 1) {
                appState.page--;
                this.renderTable();
            }
        },

        nextPage() {
            const total = this.getProcessedData().length;
            if (appState.page * appState.rowsPerPage < total) {
                appState.page++;
                this.renderTable();
            }
        },

        toggleSelectAll(checked) {
            const pageItems = this.getProcessedData().slice(
                (appState.page - 1) * appState.rowsPerPage, 
                appState.page * appState.rowsPerPage
            );
            pageItems.forEach(record => {
                if (checked) {
                    appState.selected.add(record.id);
                } else {
                    appState.selected.delete(record.id);
                }
            });
            this.renderTable();
        },

        handleSort(e) {
            const header = e.target.closest('th[data-sortable]');
            if (!header) return;
            
            const key = header.dataset.sortable;
            if (appState.sortBy === key) {
                appState.sortDir = appState.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                appState.sortBy = key;
                appState.sortDir = 'asc';
            }
            this.renderTable();
        },

        exportCSV() {
            const exportBtn = ui.exportBtn;
            if (exportBtn) {
                exportBtn.disabled = true;
                exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            }

            try {
                // Get the currently filtered and processed data
                const processedData = this.getProcessedData();
                
                if (processedData.length === 0) {
                    alert('No data to export. Please adjust your filters and try again.');
                    return;
                }

                // Define CSV headers
                const headers = [
                    'Referral ID',
                    'Name', 
                    'Level',
                    'Clicks',
                    'Orders',
                    'Revenue',
                    'C2O CVR (%)',
                    'AOV',
                    'Region',
                    'Country'
                ];

                // Create CSV content
                let csvContent = headers.join(',') + '\n';

                // Add data rows
                processedData.forEach(record => {
                    const conv = record.clicks30 ? (record.orders30 / record.clicks30) * 100 : 0;
                    const aov = record.orders30 ? record.revenue30 / record.orders30 : 0;
                    
                    const row = [
                        `"${record.id}"`,
                        `"${record.name}"`,
                        `"${record.level}"`,
                        record.clicks30,
                        record.orders30,
                        record.revenue30.toFixed(2),
                        conv.toFixed(2),
                        aov.toFixed(2),
                        `"${record.region}"`,
                        `"${record.country}"`
                    ];
                    csvContent += row.join(',') + '\n';
                });

                // Create and download the CSV file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                
                if (link.download !== undefined) {
                    // Create filename with current date and filter info
                    const currentDate = new Date().toISOString().split('T')[0];
                    const filterInfo = this.getFilterSummary();
                    const filename = `BEL_Performance_Leaderboard_${currentDate}${filterInfo}.csv`;
                    
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    // Show success message
                    if (exportBtn) {
                        exportBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
                        setTimeout(() => {
                            exportBtn.innerHTML = '<i class="fas fa-download"></i> Export CSV';
                        }, 2000);
                    }
                } else {
                    throw new Error('Your browser does not support file downloads');
                }
            } catch (error) {
                console.error('CSV Export Error:', error);
                alert('Failed to export CSV. Please try again.');
                
                if (exportBtn) {
                    exportBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Export Failed';
                    setTimeout(() => {
                        exportBtn.innerHTML = '<i class="fas fa-download"></i> Export CSV';
                    }, 2000);
                }
            } finally {
                if (exportBtn) {
                    exportBtn.disabled = false;
                }
            }
        },

        getFilterSummary() {
            const filters = appState.filters;
            let summary = '';
            
            if (filters.keyword) summary += `_name_${filters.keyword}`;
            if (filters.referralId) summary += `_id_${filters.referralId}`;
            if (filters.level) summary += `_level_${filters.level}`;
            if (filters.region) summary += `_region_${filters.region}`;
            if (filters.country) summary += `_country_${filters.country}`;
            if (filters.activity) summary += `_activity_${filters.activity}`;
            
            return summary.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50); // Clean and limit length
        },

        setupDirectFiltering() {
            // Setup direct filtering for dropdown selects
            const levelSelect = document.getElementById('f-level');
            const regionSelect = ui.regionSel;
            const countrySelect = ui.countrySel;
            const activitySelect = document.getElementById('f-activity');

            // Level filter - apply immediately on change
            levelSelect?.addEventListener('change', () => {
                this.applyFilters();
            });

            // Region filter - apply immediately on change
            regionSelect?.addEventListener('change', () => {
                this.applyFilters();
            });

            // Country filter - apply immediately on change
            countrySelect?.addEventListener('change', () => {
                this.applyFilters();
            });

            // Activity filter - apply immediately on change
            activitySelect?.addEventListener('change', () => {
                this.applyFilters();
            });
        },

        setupSearchSuggestions() {
            // Setup unified search suggestions
            this.setupSearchForField('f-name', 'search-suggestions-name', 'name');
            this.setupSearchForField('f-referral-id', 'search-suggestions-id', 'id');
        },

        setupSearchForField(inputId, suggestionsId, searchField) {
            const searchInput = document.getElementById(inputId);
            const suggestionsContainer = document.getElementById(suggestionsId);
            
            if (!searchInput || !suggestionsContainer) return;

            let selectedIndex = -1;

            searchInput.addEventListener('input', utils.debounce((e) => {
                const query = e.target.value.trim().toLowerCase();
                selectedIndex = -1;
                
                if (query.length === 0) {
                    this.hideSuggestions(suggestionsContainer);
                    return;
                }

                const suggestions = this.belData
                    .filter(record => record[searchField]?.toLowerCase().includes(query))
                    .slice(0, 8)
                    .map(record => ({
                        name: record.name,
                        id: record.id,
                        displayText: searchField === 'name' ? record.name : `${record.id} - ${record.name}`,
                        searchField
                    }));

                if (suggestions.length > 0) {
                    this.showSuggestions(suggestions, query, suggestionsContainer, searchInput);
                } else {
                    this.hideSuggestions(suggestionsContainer);
                }
            }, 150));

            // Keyboard navigation
            searchInput.addEventListener('keydown', (e) => {
                const items = suggestionsContainer.querySelectorAll('.search-suggestion-item');
                
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                        this.highlightSuggestion(items, selectedIndex);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        selectedIndex = Math.max(selectedIndex - 1, -1);
                        this.highlightSuggestion(items, selectedIndex);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (selectedIndex >= 0 && items[selectedIndex]) {
                            const suggestion = this.getCurrentSuggestions()[selectedIndex];
                            this.selectSuggestion(suggestion, searchInput);
                        } else {
                            this.applyFilters();
                        }
                        break;
                    case 'Escape':
                        this.hideSuggestions(suggestionsContainer);
                        searchInput.blur();
                        break;
                }
            });

            // Click outside to hide
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    this.hideSuggestions(suggestionsContainer);
                }
            });

            // Focus to show existing suggestions
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim().length > 0) {
                    searchInput.dispatchEvent(new Event('input'));
                }
            });
        },

        showSuggestions(suggestions, query, container, input) {
            if (!container) return;
            
            this.currentSuggestions = suggestions; // Store for keyboard navigation

            const html = suggestions.map((suggestion, index) => {
                const highlightedText = this.highlightMatch(suggestion.displayText, query);
                return `
                    <div class="search-suggestion-item" data-index="${index}">
                        ${suggestion.searchField === 'id' ? 
                            `<div class="suggestion-id-main">${highlightedText}</div>
                             <div class="suggestion-name-sub">${suggestion.name}</div>` :
                            `<div class="suggestion-content">${highlightedText}</div>`
                        }
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
            container.classList.add('show');

            // Add click listeners
            container.querySelectorAll('.search-suggestion-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    this.selectSuggestion(suggestions[index], input);
                });
            });
        },

        hideSuggestions(container) {
            if (container) {
                container.classList.remove('show');
                container.innerHTML = '';
            }
        },

        highlightSuggestion(items, index) {
            items.forEach((item, i) => {
                item.classList.toggle('highlighted', i === index);
            });
        },

        selectSuggestion(suggestion, input) {
            if (input) {
                input.value = suggestion.searchField === 'name' ? suggestion.name : suggestion.id;
                const container = input.nextElementSibling;
                this.hideSuggestions(container);
                this.applyFilters();
            }
        },

        getCurrentSuggestions() {
            return this.currentSuggestions || [];
        },

        highlightMatch(text, query) {
            if (!query) return text;
            
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<mark style="background-color: var(--ds-color-primary-light-30); font-weight: var(--fw-semibold);">$1</mark>');
        },



        /**
         * Update BEL table data based on header filter selections
         * @param {string} selectedYear - Year to filter by (or 'all' for all years)
         * @param {string} selectedRegion - Region to filter by (or 'all' for all regions)
         */
        updateBelDataForHeaderFilters(selectedYear, selectedRegion) {
            // Get all leaderboard data
            if (!APP_DATA.belProfiles?.leaderboard) {
                console.warn('No leaderboard data available');
                return;
            }

            let dataToProcess = APP_DATA.belProfiles.leaderboard;

            // Apply region filter first if specified
            if (selectedRegion && selectedRegion !== 'all') {
                dataToProcess = dataToProcess.filter(leader => leader.region === selectedRegion);
            }

            // Update BEL data with year-specific calculations
            this.belData = dataToProcess.map(leader => {
                // Calculate performance based on selected year
                const yearlyData = (selectedYear === 'all')
                    ? this.calculateTotalPerformance(leader)
                    : this.calculateYearlyData(leader, selectedYear);
                
                return {
                    id: leader.id,
                    name: leader.name,
                    email: leader.email || `${leader.name.toLowerCase().replace(' ', '.')}@company.com`,
                    level: leader.level,
                    clicks30: yearlyData.clicks,
                    orders30: yearlyData.orders,
                    revenue30: yearlyData.revenue,
                    monthlyData: leader.monthlyData,
                    bankingInfo: leader.bankingInfo,
                    country: utils.getCountryNameFromCode(utils.getCountryCodeFromId(leader.id)),
                    region: leader.region,
                    tags: leader.tags || ['Top Performer']
                };
            });

            console.log(`Updated BEL data for Year: ${selectedYear}, Region: ${selectedRegion}, Records: ${this.belData.length}`);
            
            // Update region filters with disabled options after data change
            this.updateRegionFilterWithDisabledOptions();
            
            // Update top performers cards with new data
            this.renderTopPerformersCards();
        }
    };

    /* ========================================================================
       BEL MODAL MANAGEMENT
       ======================================================================== */
    const BELModal = {
        performanceTrendChart: null,
        
        init() {
            this.setupEventListeners();
            this.setupTabs();
            this.setupBankingEdit();
            this.setupAddNoteTextarea();
        },
        setupEventListeners() {
            ui.modalClose?.addEventListener('click', () => this.closeModal());
            ui.saveBtn?.addEventListener('click', () => this.saveAccountChanges());
            ui.addNoteBtn?.addEventListener('click', () => this.addNote());
            ui.modal?.addEventListener('click', (e) => {
                if (e.target === ui.modal) this.closeModal();
            });
            // Handle year selector changes
            const yearSelector = document.getElementById('year-selector');
            if (yearSelector) {
                yearSelector.addEventListener('change', (e) => {
                    const selectedYear = e.target.value;
                    const record = this.getBelRecordById(appState.currentReferralId);
                    if (record) {
                        this.updatePerformanceMetrics(record);
                    }
                });
            }
            // Handle Referral ID link clicks
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a.referral-id-link');
                if (!link) return;
                e.preventDefault();
                const idText = (link.dataset.referralId || link.textContent || '').trim();
                this.openModal(idText, link);
            });
        },

        setupTabs() {
            if (!ui.modal) return;
            const tabLinks = ui.modal.querySelectorAll('.tab-link');
            const tabContents = ui.modal.querySelectorAll('.tab-content');
            
            tabLinks.forEach(link => {
                link.addEventListener('click', () => {
                    const tabId = link.dataset.tab;
                    tabLinks.forEach(l => l.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    link.classList.add('active');
                    ui.modal.querySelector(`#${tabId}`)?.classList.add('active');
                });
            });
        },

        async openModal(id, linkElement = null) {
            // Centralized record fetching
            const record = this.getBelRecordById(id, linkElement);

            if (!record) {
                console.error(`BEL record with ID ${id} not found.`);
                this.showCustomAlert(`Could not find details for BEL with ID ${id}.`, 'error');
                return;
            }

            // 確保 payout 數據已載入
            if (!APP_DATA.payouts && !window.PAYOUT_DATA) {
                console.log('Loading payout data before opening BEL modal...');
                try {
                    await ContentManager.loadPayoutData();
                } catch (error) {
                    console.error('Failed to load payout data:', error);
                }
            }

            appState.currentReferralId = record.id;
            this.fillModal(record);
            
            // Reset to first tab (Performance) when opening modal
            this.resetToFirstTab();
            
            ui.modal.style.zIndex = ContentManager.getNextModalZIndex();
            ui.modal?.classList.add('show');
            
            // Scroll modal to top when opened
            setTimeout(() => {
                const modalBody = ui.modal?.querySelector('.modal-body');
                if (modalBody) modalBody.scrollTop = 0;
            }, 50);
        },

        getBelRecordById(id, linkElement = null) {
            // 1. Check AccountManagement's pre-processed data first
            let record = AccountManagement.belData.find(r => r.id === id);
            if (record) {
                console.log(`Record ${id} found in AccountManagement.belData`);
                return record;
            }

            // 2. If not found, check the raw leaderboard data from APP_DATA
            if (APP_DATA.belProfiles && APP_DATA.belProfiles.leaderboard) {
                const leaderboardRecord = APP_DATA.belProfiles.leaderboard.find(r => r.id === id);
                if (leaderboardRecord) {
                    console.log(`Record ${id} found in APP_DATA.belProfiles.leaderboard`);
                    // Normalize the record to the format expected by the modal
                    return {
                        id: leaderboardRecord.id,
                        name: leaderboardRecord.name,
                        email: leaderboardRecord.email,
                        code: leaderboardRecord.id,
                        level: leaderboardRecord.level,
                        clicks30: leaderboardRecord.clicks,
                        orders30: leaderboardRecord.orders,
                        revenue30: leaderboardRecord.revenue,
                        monthlyData: leaderboardRecord.monthlyData,
                        bankingInfo: leaderboardRecord.bankingInfo,
                        region: utils.getRegionFromCountry(leaderboardRecord.email?.split('@')[1]?.includes('.') ? 
                               leaderboardRecord.email.split('@')[1].split('.')[1].toUpperCase() : 'US'),
                        country: leaderboardRecord.email?.split('@')[1]?.includes('.') ? 
                                leaderboardRecord.email.split('@')[1].split('.')[1].toUpperCase() : 'US',
                        city: '—',
                        status: 'Active',
                        tags: []
                    };
                }
            }

            // 3. Fallback for records not in main data sources (e.g., from other tables)
            if (linkElement) {
                console.log(`Record ${id} not found in data, creating from link element`);
                const tr = linkElement.closest('tr');
                if (tr) {
                    const name = tr.querySelector('td:nth-child(2)')?.textContent.trim();
                    const level = tr.querySelector('td:nth-child(3)')?.textContent.trim();
                    const clicks = parseInt(tr.querySelector('td:nth-child(4)')?.textContent.replace(/,/g, '')) || 0;
                    const orders = parseInt(tr.querySelector('td:nth-child(5)')?.textContent.replace(/,/g, '')) || 0;
                    const revenue = utils.parseMoney(tr.querySelector('td:nth-child(6)')?.textContent);
                    
                    return {
                        id: id,
                        name: name,
                        level: level,
                        clicks30: clicks,
                        orders30: orders,
                        revenue30: revenue,
                        email: '—',
                        code: id,
                        region: '—',
                        country: '—',
                        city: '—',
                        status: 'Active',
                        tags: []
                    };
                }
            }
            
            console.log(`Record ${id} could not be found anywhere.`);
            return null;
        },

        resetToFirstTab() {
            if (!ui.modal) return;
            
            const tabLinks = ui.modal.querySelectorAll('.tab-link');
            const tabContents = ui.modal.querySelectorAll('.tab-content');
            
            // Remove active class from all tabs and contents
            tabLinks.forEach(link => link.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to first tab and its content
            if (tabLinks[0]) {
                tabLinks[0].classList.add('active');
            }
            
            // Find and activate the corresponding content for the first tab
            const firstTabId = tabLinks[0]?.dataset.tab;
            if (firstTabId) {
                const firstContent = ui.modal.querySelector(`#${firstTabId}`);
                if (firstContent) {
                    firstContent.classList.add('active');
                }
            }
            
            // Ensure charts are properly rendered for the first tab (Performance)
            if (firstTabId === 'overview') {
                // Trigger chart initialization after a short delay to ensure DOM is ready
                setTimeout(() => {
                    const record = this.getBelRecordById(appState.currentReferralId);
                    if (record) {
                        this.initializePerformanceTrendChart(record);
                    }
                }, 150);
            }
        },

        fillModal(record) {
            if (!record) return;
            
            if (ui.modalBelName) ui.modalBelName.textContent = record.name || '—';
            if (ui.modalBelInfo) {
                const emailText = record.email || 'No email provided';
                ui.modalBelInfo.textContent = `Referral ID: ${record.id || '—'} | Email: ${emailText}`;
            }
            
            // Update level badge
            const levelBadge = document.getElementById('modal-bel-level-badge');
            if (levelBadge && record.level) {
                levelBadge.className = `bel-badge ${record.level.toLowerCase()}`;
                levelBadge.textContent = record.level;
            }
            
            if (ui.modalLevel && record.level) ui.modalLevel.value = record.level;
            
            // Update performance metrics in modal
            this.updatePerformanceMetrics(record);
            
            // Update modal avatar
            const modalAvatar = ui.modal?.querySelector('.modal-avatar-small');
            if (modalAvatar && record.name) {
                const generatedAvatar = utils.generateAvatar(record.name, record.email || record.id);
                generatedAvatar.className = 'modal-avatar-small generated-avatar';
                generatedAvatar.style.width = '60px';
                generatedAvatar.style.height = '60px';
                generatedAvatar.style.fontSize = '20px';
                modalAvatar.parentNode.replaceChild(generatedAvatar, modalAvatar);
            }
            
            const notes = appState.notes[record.id] || [];
            if (ui.notesHistory) {
                ui.notesHistory.innerHTML = notes.length
                    ? notes.map(n => `<div class="note-item"><p>${n.text}</p><span>${n.time}</span></div>`).join('')
                    : '<p class="text-muted" style="padding:10px;">No notes yet.</p>';
            }
            
            // Charts will be initialized by resetToFirstTab() function
            
            // Update Banking Information
            this.updateBankingInformation(record);
            
            // Setup payout year selector and update payout information
            this.setupPayoutYearSelector(record);
            
            // Update Payout Information
            this.updatePayoutInformation(record);

            // Update Customer Insights
            this.updateCustomerInsights(record);
        },

        setupPayoutYearSelector(record) {
            const yearSelector = document.getElementById('payout-year-selector');
            if (!yearSelector) return;
            
            // Clear existing options
            yearSelector.innerHTML = '';
            
            // Get available years from payout data
            const payoutData = APP_DATA.payouts || window.PAYOUT_DATA;
            let availableYears = [];
            
            if (payoutData && payoutData.belPayoutHistory) {
                const belPayout = payoutData.belPayoutHistory.find(bel => bel.belId === record.id);
                if (belPayout && belPayout.payoutHistory) {
                    const yearsSet = new Set(belPayout.payoutHistory.map(p => p.year));
                    availableYears = Array.from(yearsSet).sort((a, b) => b - a); // Newest first
                }
            }
            
            // If no payout years found, use current year as fallback
            if (availableYears.length === 0) {
                availableYears = [new Date().getFullYear()];
            }
            
            // Add options to selector
            availableYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelector.appendChild(option);
            });
            
            // Set default to most recent year (current year or latest available)
            const currentYear = new Date().getFullYear();
            if (availableYears.includes(currentYear)) {
                yearSelector.value = currentYear;
            } else {
                yearSelector.value = availableYears[0];
            }
            
            // Add event listener for year changes
            yearSelector.addEventListener('change', (e) => {
                const selectedYear = parseInt(e.target.value);
                this.updatePayoutInformationByYear(record, selectedYear);
            });
        },

        updatePerformanceMetrics(record) {
            if (!record) return;
            
            const totalClicksEl = document.getElementById('modal-total-clicks');
            const totalOrdersEl = document.getElementById('modal-total-orders');
            const totalRevenueEl = document.getElementById('modal-total-revenue');
            const convRateEl = document.getElementById('modal-conv-rate');
            const aovEl = document.getElementById('modal-aov');
            
            // Get the currently selected year from year selector, or default to 2025
            const yearSelector = document.getElementById('year-selector');
            const selectedYear = yearSelector && yearSelector.value ? yearSelector.value : '2025';
            
            // Calculate cumulative data from January to current month
            let cumulativeClicks = 0;
            let cumulativeOrders = 0;
            let cumulativeRevenue = 0;
            
            if (record.monthlyData && record.monthlyData[selectedYear]) {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const currentDate = new Date();
                
                // For 2025, only sum up to August (since it's September 8, 2025)
                // For 2024, sum the full year
                let monthsToSum = monthNames;
                if (selectedYear === '2025') {
                    monthsToSum = monthNames.slice(0, 8); // January to August
                }
                
                monthsToSum.forEach(monthName => {
                    const monthData = record.monthlyData[selectedYear][monthName];
                    if (monthData) {
                        cumulativeClicks += monthData.clicks || 0;
                        cumulativeOrders += monthData.orders || 0;
                        cumulativeRevenue += monthData.revenue || 0;
                    }
                });
            } else {
                // Fallback to record's direct values if no monthly data
                cumulativeClicks = record.clicks30 || record.clicks || 0;
                cumulativeOrders = record.orders30 || record.orders || 0;
                cumulativeRevenue = record.revenue30 || record.revenue || 0;
            }
            
            if (totalClicksEl) totalClicksEl.textContent = cumulativeClicks.toLocaleString();
            if (totalOrdersEl) totalOrdersEl.textContent = cumulativeOrders.toLocaleString();
            if (totalRevenueEl) totalRevenueEl.textContent = utils.formatMoney(cumulativeRevenue);
            
            // Calculate cumulative conversion rate and AOV
            let convRate = 0;
            let aov = 0;
            
            if (cumulativeClicks > 0) {
                convRate = (cumulativeOrders / cumulativeClicks) * 100;
            }
            
            if (cumulativeOrders > 0) {
                aov = cumulativeRevenue / cumulativeOrders;
            }
            
            if (convRateEl) convRateEl.textContent = `${convRate.toFixed(2)}%`;
            if (aovEl) aovEl.textContent = utils.formatMoney(aov, 2);
        },

        updateBankingInformation(record) {
            if (!record) return;
            
            // Get banking information from the record
            const bankingInfo = record.bankingInfo;
            
            // Elements for displaying banking information
            const bankNameDisplay = document.getElementById('bank-name-display');
            const swiftCodeDisplay = document.getElementById('swift-code-display');
            const accountHolderDisplay = document.getElementById('account-holder-display');
            const phoneDisplay = document.getElementById('phone-display');
            const addressDisplay = document.getElementById('address-display');
            
            // Elements for editing banking information
            const bankNameEdit = document.getElementById('bank-name-edit');
            const swiftCodeEdit = document.getElementById('swift-code-edit');
            const accountHolderEdit = document.getElementById('account-holder-edit');
            const phoneEdit = document.getElementById('phone-edit');
            const addressEdit = document.getElementById('address-edit');
            
            if (bankingInfo) {
                // Update display elements
                if (bankNameDisplay) bankNameDisplay.textContent = bankingInfo.bankName || '-';
                if (swiftCodeDisplay) swiftCodeDisplay.textContent = bankingInfo.swiftCode || '-';
                if (accountHolderDisplay) accountHolderDisplay.textContent = bankingInfo.accountHolder || '-';
                if (phoneDisplay) phoneDisplay.textContent = bankingInfo.phone || '-';
                if (addressDisplay) addressDisplay.textContent = bankingInfo.address || '-';
                
                // Update edit elements
                if (bankNameEdit) bankNameEdit.value = bankingInfo.bankName || '';
                if (swiftCodeEdit) swiftCodeEdit.value = bankingInfo.swiftCode || '';
                if (accountHolderEdit) accountHolderEdit.value = bankingInfo.accountHolder || '';
                if (phoneEdit) phoneEdit.value = bankingInfo.phone || '';
                if (addressEdit) addressEdit.value = bankingInfo.address || '';
            } else {
                // No banking info available, show placeholder
                if (bankNameDisplay) bankNameDisplay.textContent = '-';
                if (swiftCodeDisplay) swiftCodeDisplay.textContent = '-';
                if (accountHolderDisplay) accountHolderDisplay.textContent = '-';
                if (phoneDisplay) phoneDisplay.textContent = '-';
                if (addressDisplay) addressDisplay.textContent = '-';
                
                // Clear edit elements
                if (bankNameEdit) bankNameEdit.value = '';
                if (swiftCodeEdit) swiftCodeEdit.value = '';
                if (accountHolderEdit) accountHolderEdit.value = '';
                if (phoneEdit) phoneEdit.value = '';
                if (addressEdit) addressEdit.value = '';
            }
        },

        updatePayoutInformation(record) {
            if (!record) return;
            
            // 確保 payout 數據已載入
            const payoutData = APP_DATA.payouts || window.PAYOUT_DATA;
            if (!payoutData || !payoutData.belPayoutHistory) {
                console.log(`No payout data structure found for BEL ID: ${record.id}`);
                // Clear payout table if no data found
                const tbody = document.querySelector('#payout-history-tbody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No payout history available</td></tr>';
                }
                // Clear summary cards
                this.updatePayoutSummaryCards({ totalGross: 0, totalWht: 0, totalNet: 0, pendingAmount: 0 });
                return;
            }
            
            // Find BEL's payout history
            const belPayout = payoutData.belPayoutHistory.find(bel => bel.belId === record.id);
            
            if (!belPayout) {
                console.log(`No payout history found for BEL ID: ${record.id}`);
                // Clear payout table if no data found
                const tbody = document.querySelector('#payout-history-tbody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No payout history available</td></tr>';
                }
                // Clear summary cards
                this.updatePayoutSummaryCards({ totalGross: 0, totalWht: 0, totalNet: 0, pendingAmount: 0 });
                return;
            }
            
            console.log(`Found payout data for BEL ${record.id}:`, belPayout);
            
            // Get the selected year from payout year selector, default to current year (2025)
            const payoutYearSelector = document.getElementById('payout-year-selector');
            const selectedYear = payoutYearSelector ? parseInt(payoutYearSelector.value) : 2025;
            
            this.updatePayoutInformationByYear(record, selectedYear);
        },

        updatePayoutInformationByYear(record, year) {
            if (!record) return;
            
            // 確保 payout 數據已載入
            const payoutData = APP_DATA.payouts || window.PAYOUT_DATA;
            if (!payoutData || !payoutData.belPayoutHistory) {
                console.log(`No payout data structure found for BEL ID: ${record.id}`);
                // Clear payout table if no data found
                const tbody = document.querySelector('#payout-history-tbody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No payout history available</td></tr>';
                }
                // Clear summary cards
                this.updatePayoutSummaryCards({ totalGross: 0, totalWht: 0, totalNet: 0, pendingAmount: 0 });
                return;
            }
            
            // Find BEL's payout history
            const belPayout = payoutData.belPayoutHistory.find(bel => bel.belId === record.id);
            
            if (!belPayout) {
                console.log(`No payout history found for BEL ID: ${record.id}`);
                // Clear payout table if no data found
                const tbody = document.querySelector('#payout-history-tbody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No payout history available</td></tr>';
                }
                // Clear summary cards
                this.updatePayoutSummaryCards({ totalGross: 0, totalWht: 0, totalNet: 0, pendingAmount: 0 });
                return;
            }
            
            console.log(`Processing payout data for BEL ${record.id}, year ${year}:`, belPayout);
            
            // Calculate payout summary for selected year
            const payoutSummary = this.calculatePayoutSummaryByYear(belPayout.payoutHistory, year);
            
            // Update payout summary cards
            this.updatePayoutSummaryCards(payoutSummary);
            
            // Update payout history table
            this.updatePayoutHistoryTable(belPayout.payoutHistory, year);
        },

        calculatePayoutSummaryByYear(payoutHistory, year) {
            if (!payoutHistory || !Array.isArray(payoutHistory)) {
                return { totalGross: 0, totalWht: 0, totalNet: 0, pendingAmount: 0, recentPayouts: [] };
            }
            
            // Filter payouts for the selected year
            const yearPayouts = payoutHistory.filter(payout => payout.year === year);
            
            const totalGross = yearPayouts.reduce((sum, payout) => sum + payout.grossPayout, 0);
            const totalWht = yearPayouts.reduce((sum, payout) => sum + payout.wht, 0);
            const totalNet = yearPayouts.reduce((sum, payout) => sum + payout.netPayout, 0);
            
            // Get the most recent 10 payouts for the selected year
            const recentPayouts = yearPayouts
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10);
            
            // Calculate pending amount (To be payout) based on selected year
            let pendingAmount = 0;
            const currentYear = new Date().getFullYear();
            
            if (year === currentYear) {
                // For current year (2025), get previous month's revenue from belProfiles.json
                pendingAmount = this.calculateCurrentYearToBePayout();
            }
            // For past years, pendingAmount remains 0 (no "to be payout")
            
            return {
                totalGross,
                totalWht,
                totalNet,
                pendingAmount,
                recentPayouts,
                year
            };
        },
        calculatePayoutSummary(payoutHistory) {
            // This is the old function, now delegates to the year-specific version
            return this.calculatePayoutSummaryByYear(payoutHistory, 2025);
        },
        calculateCurrentYearToBePayout() {
            // Get current BEL's previous month revenue from belProfiles.json
            const currentBelId = this.getCurrentBelId();
            if (!currentBelId) return 0;

            // Find the BEL data in APP_DATA.belProfiles.leaderboard (修正路徑)
            const belData = APP_DATA.belProfiles?.leaderboard?.find(bel => bel.id === currentBelId);
            if (!belData || !belData.monthlyData) return 0;

            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); // 0-based (0=January, 8=September)
            
            // Get previous month name
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            
            let prevMonthIndex = currentMonth - 1;
            let targetYear = currentYear;
            
            // Handle January case (previous month is December of previous year)
            if (prevMonthIndex < 0) {
                prevMonthIndex = 11; // December
                targetYear = currentYear - 1;
            }
            
            const prevMonthName = monthNames[prevMonthIndex];
            
            // Get the revenue from the previous month
            if (belData.monthlyData[targetYear] && belData.monthlyData[targetYear][prevMonthName]) {
                const monthData = belData.monthlyData[targetYear][prevMonthName];
                return monthData.revenue || 0;
            }
            
            return 0;
        },
        getCurrentBelId() {
            // Prefer the ID stored in app state when modal is opened
            if (appState.currentReferralId) return appState.currentReferralId;

            // Fallback: read from modal DOM if needed (ensure correct modal ID)
            const modal = document.querySelector('#bel-details-modal');
            if (!modal) return null;

            const belIdElement = modal.querySelector('#bel-modal-id');
            return belIdElement ? belIdElement.textContent.trim() : null;
        },
        updatePayoutSummaryCards(summary) {
            // Update "Total Gross Amount" card
            const totalGrossCard = document.querySelector('#total-gross-amount');
            if (totalGrossCard) {
                totalGrossCard.textContent = `$${summary.totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            
            // Update "WHT" card 
            const totalWhtCard = document.querySelector('#total-wht-amount');
            if (totalWhtCard) {
                totalWhtCard.textContent = `-$${summary.totalWht.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            
            // Update "Total Net Amount" card
            const totalNetCard = document.querySelector('#total-net-amount');
            if (totalNetCard) {
                totalNetCard.textContent = `$${summary.totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            
            // Update "To be payout" card if exists
            const pendingAmountCard = document.querySelector('#pending-amount');
            if (pendingAmountCard) {
                pendingAmountCard.textContent = `$${summary.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        },

        updatePayoutHistoryTable(payoutHistory, year = null) {
            const tbody = document.querySelector('#payout-history-tbody');
            if (!tbody) return;
            
            if (!payoutHistory || !Array.isArray(payoutHistory)) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No payout history available</td></tr>';
                return;
            }
            
            // Filter by year if specified, otherwise show all
            let filteredPayouts = payoutHistory;
            if (year !== null) {
                filteredPayouts = payoutHistory.filter(payout => payout.year === year);
            }
            
            if (filteredPayouts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No payout history available for ${year || 'selected period'}</td></tr>`;
                return;
            }
            
            // Sort payouts by date (most recent first) - show all records
            const sortedPayouts = filteredPayouts
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            tbody.innerHTML = sortedPayouts.map(payout => `
                <tr>
                    <td>${payout.date}</td>
                    <td>$${payout.grossPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>$${payout.wht.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>$${payout.netPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td><span class="bel-badge ${payout.status.toLowerCase()}">${payout.status}</span></td>
                </tr>
            `).join('');
        },

        updateCustomerInsights(record) {
            if (!record) return;
            
            const salesData = this.getBelSalesData(record.id);
            const insights = this.generateInsights(record);
            
            // Calculate total sales statistics
            const totalOrders = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
            const totalRevenue = salesData.reduce((sum, sale) => sum + sale.totalRevenue, 0);
            
            // Update categories section
            const tagsContainer = document.querySelector('.tags-container');
            if (tagsContainer) {
                tagsContainer.innerHTML = insights.topCategories.map(category => {
                    const categoryRevenue = salesData
                        .filter(sale => sale.category === category)
                        .reduce((sum, sale) => sum + sale.totalRevenue, 0);
                    
                    return `
                        <span class="bel-badge hot-selling" title="${category}: $${categoryRevenue.toLocaleString()} revenue">
                            ${category}
                        </span>
                    `;
                }).join('');
            }
            
            // Update products section with actual sales data
            const productList = document.querySelector('.product-list');
            if (productList) {
                productList.innerHTML = insights.topProducts.map(productName => {
                    const productData = salesData.find(sale => sale.productName === productName);
                    const quantity = productData ? productData.quantity : 0;
                    const revenue = productData ? productData.totalRevenue : 0;
                    const description = productData ? productData.productDescription : '';
                    
                    return `
                        <div class="product-item">
                            <div class="product-info">
                                <div class="product-name">${productName}</div>
                                <div class="product-description">${description}</div>
                                <div class="product-stats">
                                    <span class="quantity">Sold: ${quantity} units</span>
                                    <span class="revenue">Revenue: $${revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            // Add sales summary header
            const insightsTab = document.getElementById('insights-tab');
            if (insightsTab) {
                let summaryDiv = insightsTab.querySelector('.sales-summary');
                if (!summaryDiv) {
                    summaryDiv = document.createElement('div');
                    summaryDiv.className = 'sales-summary';
                    insightsTab.insertBefore(summaryDiv, insightsTab.firstChild);
                }
                
                summaryDiv.innerHTML = `
                    <div class="summary-header">
                        <h4>Sales Performance Overview</h4>
                        <div class="summary-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total Orders:</span>
                                <span class="stat-value">${totalOrders}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total Revenue:</span>
                                <span class="stat-value">$${totalRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        },

        getCustomerInsights(referralId) {
            // Initialize customer insights data if not exists
            if (!appState.customerInsights) {
                appState.customerInsights = {};
            }
            
            if (!appState.customerInsights[referralId]) {
                // Generate insights based on BEL level and characteristics
                const record = AccountManagement.belData.find(x => x.id === referralId);
                appState.customerInsights[referralId] = this.generateInsights(record);
            }
            
            return appState.customerInsights[referralId];
        },

        generateInsights(record) {
            // Generate insights based on actual sales data for this BEL
            const salesData = this.getBelSalesData(record.id);
            
            // Analyze top-selling categories
            const categoryStats = {};
            salesData.forEach(sale => {
                categoryStats[sale.category] = (categoryStats[sale.category] || 0) + sale.quantity;
            });
            
            // Get top 4 categories by sales volume
            const topCategories = Object.entries(categoryStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4)
                .map(([category]) => category);
            
            // Get top 10 products by sales volume (increased from 8 to 10)
            const topProducts = salesData
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10)
                .map(sale => sale.productName);
            
            return {
                topCategories: topCategories.length > 0 ? topCategories : ['—', '—'],
                topProducts: topProducts.length > 0 ? topProducts : ['—', '—']
            };
        },

        getBelSalesData(referralId) {
            // Initialize sales data if not exists
            if (!appState.belSalesData) {
                appState.belSalesData = {};
            }
            
            if (!appState.belSalesData[referralId]) {
                appState.belSalesData[referralId] = this.generateSalesData(referralId);
            }
            
            return appState.belSalesData[referralId];
        },

        generateSalesData(referralId) {
            // Get BEL record to determine sales pattern based on level and performance
            const record = AccountManagement.belData.find(x => x.id === referralId);
            const level = record?.level || 'Exploder';
            const revenue = record?.revenue30 || 0;
            
            // If no revenue, return empty sales data
            if (revenue === 0) {
                return [];
            }
            
            // Get product catalog from loaded data
            let productCatalog = [];
            if (window.appData && window.appData.productCatalog) {
                productCatalog = window.appData.productCatalog.productCatalog || [];
            }
            
            // Fallback to basic products if catalog not loaded
            if (productCatalog.length === 0) {
                return [];
            }
            
            // Generate sales data based on BEL's revenue and level preferences
            const salesData = [];
            const baseOrderCount = Math.floor(revenue / 300); // Adjust based on higher product prices
            
            productCatalog.forEach(product => {
                const levelMultiplier = product.levelFactor[level] || 1.0;
                const randomFactor = 0.3 + Math.random() * 0.7; // Add some randomness
                const baseQuantity = Math.floor(baseOrderCount * levelMultiplier * randomFactor * 0.08);
                
                if (baseQuantity > 0) {
                    salesData.push({
                        productName: product.name,
                        productDescription: product.description,
                        category: product.category,
                        quantity: baseQuantity,
                        avgPrice: product.avgPrice,
                        totalRevenue: baseQuantity * product.avgPrice
                    });
                }
            });
            
            // Sort by quantity
            salesData.sort((a, b) => b.quantity - a.quantity);
            
            return salesData;
        },

        initializePerformanceTrendChart(record) {
            console.log('Initializing performance trend chart for record:', record);
            console.log('Record has monthlyData:', !!record.monthlyData);
            if (record.monthlyData) {
                console.log('Available years in monthlyData:', Object.keys(record.monthlyData));
            }
            
            const ctx = document.getElementById('bel-performance-trend-chart');
            if (!ctx || !window.Chart || !record) return;
            
            // Destroy existing chart if it exists
            if (this.performanceTrendChart) {
                this.performanceTrendChart.destroy();
            }
            
            // Get or populate year selector
            const yearSelector = document.getElementById('year-selector');
            if (yearSelector) {
                // Populate year options from data if not already populated
                if (yearSelector.children.length === 0) {
                    this.populateYearSelector(record, yearSelector);
                }
                
                // Remove existing event listeners and add new one
                const currentValue = yearSelector.value; // 保存當前選中的值
                yearSelector.replaceWith(yearSelector.cloneNode(true));
                const newYearSelector = document.getElementById('year-selector');
                
                // Re-populate after cloning only if needed
                if (newYearSelector.children.length === 0) {
                    this.populateYearSelector(record, newYearSelector);
                }
                
                // 恢復選中的值
                if (currentValue && newYearSelector.querySelector(`option[value="${currentValue}"]`)) {
                    newYearSelector.value = currentValue;
                } else {
                    newYearSelector.value = this.getDefaultYear(record);
                }
                
                newYearSelector.addEventListener('change', () => {
                    this.initializePerformanceTrendChart(record);
                    this.updatePerformanceMetrics(record); // Update performance metrics when year changes
                });
            }
            
            // Get selected year (default to most recent available year)
            const selectedYear = yearSelector && yearSelector.value ? yearSelector.value : this.getDefaultYear(record);
            console.log('Selected year:', selectedYear);
            
            // Generate 12 months labels
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // Get monthly data for the selected year
            let clicksTrend = [];
            let ordersTrend = [];
            let revenueTrend = [];
            let c2oCvrTrend = [];
            
            if (record.monthlyData && record.monthlyData[selectedYear]) {
                console.log('Using monthly data for year:', selectedYear);
                const yearData = record.monthlyData[selectedYear];
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                
                monthNames.forEach(monthName => {
                    const monthData = yearData[monthName];
                    if (monthData) {
                        clicksTrend.push(monthData.clicks || 0);
                        ordersTrend.push(monthData.orders || 0);
                        revenueTrend.push(monthData.revenue || 0);
                        // Calculate C2O CVR dynamically: orders / clicks * 100
                        const clicks = monthData.clicks || 0;
                        const orders = monthData.orders || 0;
                        const c2oCvr = clicks > 0 ? (orders / clicks) * 100 : 0;
                        c2oCvrTrend.push(Number(c2oCvr.toFixed(2)));
                    } else {
                        clicksTrend.push(0);
                        ordersTrend.push(0);
                        revenueTrend.push(0);
                        c2oCvrTrend.push(0);
                    }
                });
            } else {
                console.log('Using fallback data - no monthly data available');
                // Fallback: use current values for last month, zeros for others
                const currentMonth = record.clicks30 || record.clicks || 0;
                const currentOrders = record.orders30 || record.orders || 0;
                const currentRevenue = record.revenue30 || record.revenue || 0;
                const currentCvr = currentMonth > 0 ? (currentOrders / currentMonth) * 100 : 0;
                
                clicksTrend = Array(11).fill(0).concat([currentMonth]);
                ordersTrend = Array(11).fill(0).concat([currentOrders]);
                revenueTrend = Array(11).fill(0).concat([currentRevenue]);
                c2oCvrTrend = Array(11).fill(0).concat([Number(currentCvr.toFixed(2))]);
            }
            
            console.log('Chart data - Clicks:', clicksTrend);
            console.log('Chart data - Orders:', ordersTrend);
            console.log('Chart data - Revenue:', revenueTrend);
            console.log('Chart data - C2O CVR:', c2oCvrTrend);
            
            this.performanceTrendChart = new Chart(ctx, {
                type: 'bar', // Default type for mixed chart
                data: {
                    labels: months,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Clicks',
                            data: clicksTrend,
                            backgroundColor: '#003160',      // Primary blue with transparency
                            yAxisID: 'y'
                        },
                        {
                            type: 'bar',
                            label: 'Orders',
                            data: ordersTrend,
                            backgroundColor: '#336899',        // Green with transparency
                            yAxisID: 'y1'
                        },
                        {
                            type: 'bar',
                            label: 'Revenue',
                            data: revenueTrend,
                            backgroundColor: '#80A0BF',    // Yellow with transparency
                            yAxisID: 'y2'
                        },
                        {
                            type: 'line',
                            label: 'C2O CVR (%)',
                            data: c2oCvrTrend,
                            borderColor: '#F39800',      
                            backgroundColor: '#F39800',
                            fill: false,
                            tension: 0,   
                            pointBackgroundColor: '#F39800',
                            pointBorderColor: '#FFFFFF',
                            pointBorderWidth: 0.5,
                            pointRadius: 4,
                            pointHoverRadius: 5,
                            yAxisID: 'y3'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                title: (tooltipItems) => `${tooltipItems[0].label || 'Unknown'} ${selectedYear}`,
                                label: (context) => {
                                    const label = context.dataset.label;
                                    const value = context.parsed.y;
                                    
                                    if (label === 'Revenue') {
                                        return `${label}: ${utils.formatMoney(value)}`;
                                    } else if (label === 'C2O CVR (%)') {
                                        return `${label}: ${value}%`;
                                    } else if (label === 'Clicks') {
                                        return `${label}: ${value.toLocaleString()}`;
                                    } else if (label === 'Orders') {
                                        return `${label}: ${value.toLocaleString()}`;
                                    } else {
                                        return `${label}: ${value.toLocaleString()}`;
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: `Month (${selectedYear})`,
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Clicks',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            },
                            beginAtZero: true,
                            max: 1200,  // 調整為縮小後的範圍
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Orders',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            },
                            beginAtZero: true,
                            max: 50,  // 調整為縮小後的範圍
                            grid: {
                                drawOnChartArea: false
                            }
                        },
                        y2: {
                            type: 'linear',
                            display: false, // 隱藏Revenue軸但保持功能
                            position: 'right',
                            beginAtZero: true,
                            max: 35000,  // 調整為縮小後的範圍
                            grid: {
                                drawOnChartArea: false
                            }
                        },
                        y3: {
                            type: 'linear',
                            display: false, // 隱藏CVR軸
                            position: 'right',
                            beginAtZero: true,
                            max: 5, // CVR百分比範圍保持不變
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        },

        populateYearSelector(record, yearSelector) {
            console.log('Populating year selector for record:', record.id);
            // Clear existing options
            yearSelector.innerHTML = '';
            
            let availableYears = [];
            
            // Get available years from monthlyData
            if (record.monthlyData) {
                availableYears = Object.keys(record.monthlyData).sort((a, b) => b - a); // Sort descending (newest first)
                console.log('Available years from monthlyData:', availableYears);
            }
            
            // If no monthly data available, use current year as fallback
            if (availableYears.length === 0) {
                const currentYear = new Date().getFullYear().toString();
                availableYears = [currentYear];
                console.log('Using fallback year:', currentYear);
            }
            
            // Populate options
            availableYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelector.appendChild(option);
            });
            
            // Set default selection to most recent year
            if (availableYears.length > 0) {
                yearSelector.value = availableYears[0];
                console.log('Set default year to:', availableYears[0]);
            }
        },

        getDefaultYear(record) {
            if (record.monthlyData) {
                const years = Object.keys(record.monthlyData).sort((a, b) => b - a);
                if (years.length > 0) {
                    return years[0]; // Return most recent year
                }
            }
            return new Date().getFullYear().toString(); // Fallback to current year
        },

        closeModal() {
            ui.modal?.classList.remove('show');
            appState.currentReferralId = null;
            
            // Clean up charts
            if (this.performanceTrendChart) {
                this.performanceTrendChart.destroy();
                this.performanceTrendChart = null;
            }
        },

        saveAccountChanges() {
            if (!appState.currentReferralId) return;
            
            const record = AccountManagement.belData.find(x => x.id === appState.currentReferralId);
            if (!record) {
                this.showCustomAlert('This referral is not editable from Account Management.', 'error');
                this.closeModal();
                return;
            }
            
            if (ui.modalLevel) {
                const newLevel = ui.modalLevel.value;
                record.level = newLevel;
                
                // Sync the change back to the original dashboard data
                const dashboardRecord = APP_DATA.belProfiles.leaderboard.find(x => x.id === appState.currentReferralId);
                if (dashboardRecord) {
                    dashboardRecord.level = newLevel;
                }
            }
            
            this.showCustomAlert(`Saved changes for ${record.name}.`, 'success');
            
            // Update both Account Management and Dashboard with current filters
            AccountManagement.renderTable();
            const selectedYear = window.selectedDashboardYear || Dashboard.getSelectedYear();
            const selectedRegion = window.selectedDashboardRegion || 'all';
            Dashboard.renderPerformanceTable(selectedYear, selectedRegion);
            
            // Update Account Management cards if currently on that page
            const currentSection = document.querySelector('.content-section.active')?.id;
            if (currentSection === 'Account-Management') {
                ContentManager.renderAccountCards();
            }
            
            this.closeModal();
        },

        setupBankingEdit() {
            if (!ui.modal) return;

            // Banking edit functionality
            const editBankingBtn = ui.modal.querySelector('#edit-banking-btn');
            const saveBankingBtn = ui.modal.querySelector('#save-banking-btn');
            const cancelBankingBtn = ui.modal.querySelector('#cancel-banking-btn');
            const bankingHistoryBtn = ui.modal.querySelector('#banking-history-btn');
            const bankingGrid = ui.modal.querySelector('.banking-info-grid');
            const editActions = ui.modal.querySelector('.banking-edit-actions');

            if (editBankingBtn) {
                editBankingBtn.addEventListener('click', () => {
                    bankingGrid?.classList.add('banking-edit-mode');
                    editActions?.style.setProperty('display', 'block');
                    editBankingBtn.style.display = 'none';
                });
            }

            if (cancelBankingBtn) {
                cancelBankingBtn.addEventListener('click', () => {
                    this.cancelBankingEdit();
                });
            }

            if (saveBankingBtn) {
                saveBankingBtn.addEventListener('click', () => {
                    this.saveBankingInfo();
                });
            }

            if (bankingHistoryBtn) {
                bankingHistoryBtn.addEventListener('click', () => {
                    this.showBankingHistory();
                });
            }
        },

        cancelBankingEdit() {
            const bankingGrid = ui.modal?.querySelector('.banking-info-grid');
            const editActions = ui.modal?.querySelector('.banking-edit-actions');
            const editBankingBtn = ui.modal?.querySelector('#edit-banking-btn');

            bankingGrid?.classList.remove('banking-edit-mode');
            editActions?.style.setProperty('display', 'none');
            if (editBankingBtn) editBankingBtn.style.display = 'inline-block';

            // Reset form values to original
            const editFields = ui.modal?.querySelectorAll('.banking-edit');
            editFields?.forEach(field => {
                const displayField = field.previousElementSibling;
                if (displayField) {
                    field.value = displayField.textContent;
                }
            });
        },

        saveBankingInfo() {
            // Show custom confirmation dialog
            this.showBankingConfirmDialog();
        },

        showBankingConfirmDialog() {
            // Create custom confirmation modal
            const confirmModal = document.createElement('div');
            confirmModal.className = 'custom-modal-overlay';
            confirmModal.style.zIndex = '2002';
            confirmModal.innerHTML = `
                <div class="custom-modal-content" style="max-width: 500px;">
                    <div class="custom-modal-header">
                        <h3><i class="fas fa-exclamation-triangle" style="color: #f39800;"></i> Banking Information Update</h3>
                    </div>
                    <div class="custom-modal-body">
                        <div>
                            <label for="change-reason" style="font-weight: bold; display: block; margin-bottom: 8px;">Reason for Change:</label>
                            <textarea id="change-reason" placeholder="Please provide a reason for this banking information change..." 
                                style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                        </div>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px;">
                            <div style="display: flex; align-items: flex-start; gap: 10px;">
                                <input type="checkbox" id="confirm-accuracy" style="margin-top: 2px;">
                                <label for="confirm-accuracy" style="font-size: 0.9rem; line-height: 1.4;">
                                    I confirm that this change will affect BEL benefits and rights. I ensure that all information provided is accurate and correct.
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="custom-modal-footer">
                        <button class="bel-btn secondary" id="cancel-confirm-btn">Cancel</button>
                        <button class="bel-btn primary" id="proceed-confirm-btn" disabled style="margin-left: 10px;">
                            <i class="fas fa-save"></i> Update Banking Info
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmModal);
            confirmModal.style.zIndex = ContentManager.getNextModalZIndex();
            confirmModal.classList.add('show');

            // Get elements
            const reasonTextarea = confirmModal.querySelector('#change-reason');
            const confirmCheckbox = confirmModal.querySelector('#confirm-accuracy');
            const proceedBtn = confirmModal.querySelector('#proceed-confirm-btn');
            const cancelBtn = confirmModal.querySelector('#cancel-confirm-btn');

            // Enable/disable proceed button based on inputs
            const updateProceedButton = () => {
                const hasReason = reasonTextarea.value.trim().length > 0;
                const isConfirmed = confirmCheckbox.checked;
                proceedBtn.disabled = !(hasReason && isConfirmed);
            };

            reasonTextarea.addEventListener('input', updateProceedButton);
            confirmCheckbox.addEventListener('change', updateProceedButton);

            // Handle buttons
            cancelBtn.addEventListener('click', () => {
                confirmModal.remove();
            });

            proceedBtn.addEventListener('click', () => {
                const reason = reasonTextarea.value.trim();
                confirmModal.remove();
                this.proceedWithBankingUpdate(reason);
            });

            // Close on overlay click
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    confirmModal.remove();
                }
            });
        },

        proceedWithBankingUpdate(reason) {
            // Get all the edit fields
            const bankName = ui.modal?.querySelector('#bank-name-edit')?.value;
            const swiftCode = ui.modal?.querySelector('#swift-code-edit')?.value;
            const accountHolder = ui.modal?.querySelector('#account-holder-edit')?.value;
            const phone = ui.modal?.querySelector('#phone-edit')?.value;
            const address = ui.modal?.querySelector('#address-edit')?.value;

            // Validate required fields
            if (!bankName || !swiftCode || !accountHolder || !phone || !address) {
                this.showCustomAlert('All fields are required for banking information.', 'error');
                return;
            }

            // Update display fields
            const displays = {
                '#bank-name-display': bankName,
                '#swift-code-display': swiftCode,
                '#account-holder-display': accountHolder,
                '#phone-display': phone,
                '#address-display': address
            };

            Object.entries(displays).forEach(([selector, value]) => {
                const element = ui.modal?.querySelector(selector);
                if (element) element.textContent = value;
            });

            // Save to edit history with reason
            this.saveBankingEditHistory({
                bankName,
                swiftCode,
                accountHolder,
                phone,
                address,
                reason,
                timestamp: new Date().toISOString(),
                userId: appState.currentReferralId
            });

            // Exit edit mode
            this.cancelBankingEdit();

            this.showCustomAlert('Banking information updated successfully!', 'success');
        },

        showCustomAlert(message, type = 'info') {
            const alertModal = document.createElement('div');
            alertModal.className = 'custom-modal-overlay';
            alertModal.style.zIndex = ContentManager.getNextModalZIndex();
            
            const iconMap = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                info: 'fas fa-info-circle'
            };
            
            const colorMap = {
                success: '#28a745',
                error: '#dc3545',
                info: '#007bff'
            };

            alertModal.innerHTML = `
                <div class="custom-modal-content" style="max-width: 400px;">
                    <div class="custom-modal-body" style="text-align: center; padding: 30px 20px;">
                        <i class="${iconMap[type]}" style="font-size: 3rem; color: ${colorMap[type]}; margin-bottom: 15px;"></i>
                        <p style="font-size: 1.1rem; margin-bottom: 20px; line-height: 1.4;">${message}</p>
                        <button class="bel-btn primary" id="close-alert-btn">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(alertModal);
            alertModal.classList.add('show');

            // Handle close
            const closeBtn = alertModal.querySelector('#close-alert-btn');
            closeBtn.addEventListener('click', () => {
                alertModal.remove();
            });

            alertModal.addEventListener('click', (e) => {
                if (e.target === alertModal) {
                    alertModal.remove();
                }
            });

            // Auto close after 3 seconds for success messages
            if (type === 'success') {
                setTimeout(() => {
                    if (document.body.contains(alertModal)) {
                        alertModal.remove();
                    }
                }, 3000);
            }
        },

        saveBankingEditHistory(changeData) {
            if (!appState.currentReferralId) return;

            // Initialize banking history if not exists
            if (!appState.bankingHistory) {
                appState.bankingHistory = {};
            }

            if (!appState.bankingHistory[appState.currentReferralId]) {
                appState.bankingHistory[appState.currentReferralId] = [];
            }

            // Add new change to history
            appState.bankingHistory[appState.currentReferralId].unshift({
                ...changeData,
                changedBy: 'Admin', // In real app, this would be current user
                changeId: Date.now().toString()
            });

            console.log('Banking history updated:', appState.bankingHistory[appState.currentReferralId]);
        },

        showBankingHistory() {
            if (!appState.currentReferralId) return;

            // Check if history exists for this user
            const history = appState.bankingHistory?.[appState.currentReferralId] || [];
            
            if (history.length === 0) {
                alert('No banking edit history found for this user.');
                return;
            }

            // Create history modal content
            let historyContent = '<div style="max-height: 400px; overflow-y: auto;">';
            historyContent += '<h4>Banking Information Edit History</h4>';
            historyContent += '<p style="color: #666; font-size: 0.9rem; margin-bottom: 20px;">All changes to banking information are recorded for security and audit purposes.</p>';
            
            history.forEach((change, index) => {
                const date = new Date(change.timestamp).toLocaleString();
                
                historyContent += `
                    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 10px; background: #f9f9f9;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-weight: bold; color: #333;">Change #${index + 1}</div>
                            <div style="font-size: 0.85rem; color: #666;">${date}</div>
                        </div>
                        <div style="margin-bottom: 5px;"><strong>Modified by:</strong> ${change.changedBy}</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                            <div>
                                <div style="font-size: 0.85rem; color: #666;">Bank Name</div>
                                <div style="font-weight: 500;">${change.bankName}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: #666;">SWIFT Code</div>
                                <div style="font-weight: 500;">${change.swiftCode}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: #666;">Account Holder</div>
                                <div style="font-weight: 500;">${change.accountHolder}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: #666;">Phone</div>
                                <div style="font-weight: 500;">${change.phone}</div>
                            </div>
                            <div style="grid-column: 1 / -1;">
                                <div style="font-size: 0.85rem; color: #666;">Address</div>
                                <div style="font-weight: 500;">${change.address}</div>
                            </div>
                        </div>
                        ${change.reason ? `<div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 4px; font-size: 0.9rem;"><strong>Reason:</strong> ${change.reason}</div>` : ''}
                    </div>
                `;
            });
            
            historyContent += '</div>';

            // Create a simple modal for history display
            const historyModal = document.createElement('div');
            historyModal.className = 'modal-overlay';
            historyModal.style.zIndex = ContentManager.getNextModalZIndex();
            historyModal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-history"></i> Banking Edit History</h3>
                        <button class="close-button" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div style="padding-top: 10px;">
                        ${historyContent}
                    </div>
                </div>
            `;

            document.body.appendChild(historyModal);
            historyModal.classList.add('show');
        },

        addNote() {
            if (!appState.currentReferralId) return;
            
            const text = (ui.modalNote?.value || '').trim();
            if (!text) return;
            
            const timestamp = new Date().toLocaleString();
            appState.notes[appState.currentReferralId] = appState.notes[appState.currentReferralId] || [];
            appState.notes[appState.currentReferralId].unshift({ text, time: timestamp });
            
            if (ui.modalNote) ui.modalNote.value = '';
            
            // Find the complete BEL record and refresh modal with full data
            const fullRecord = AccountManagement.belData.find(record => record.id === appState.currentReferralId);
            if (fullRecord) {
                this.fillModal(fullRecord);
            }
        },

        setupAddNoteTextarea() {
            const textarea = ui.addNoteTextarea || ui.modalNote;
            const button = ui.addNoteBtnNew || ui.addNoteBtn;
            
            if (!textarea || !button) return;
            
            const updateButtonState = () => {
                const hasContent = textarea.value.trim().length > 0;
                if (hasContent) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            };
            
            // Listen for input changes
            textarea.addEventListener('input', updateButtonState);
            textarea.addEventListener('keyup', updateButtonState);
            textarea.addEventListener('paste', () => {
                setTimeout(updateButtonState, 10); // Small delay for paste event
            });
            
            // Initial state
            updateButtonState();
        }
    };

    /* ========================================================================
       DYNAMIC CONTENT INJECTION
       ======================================================================== */
    const ContentManager = {
        payoutModalEl: null,
        belPayoutModalEl: null,
        supportModalEl: null,
        announcementModalEl: null,
        imageModalEl: null,
        confirmModalEl: null,
        formModalEl: null,
        historyTicketsModalEl: null,
        currentModalZIndex: 2000, // Base z-index for modals
        currentContentType: 'dashboard', // Track current active content section
        
        getNextModalZIndex() {
            this.currentModalZIndex += 10; // Increment by 10 to allow for intermediate elements
            return this.currentModalZIndex;
        },
        
        init() {
            this.setupEventListeners(); // 先設置事件監聽器
            this.injectAccountManagement();
            this.injectPayoutsAndOrders();
            this.injectContent();
            this.injectContactSupport();
        },

        injectAccountManagement() {
            // Account Management功能會在導航切換時自動初始化
            // 這裡我們確保帳戶卡片在切換到Account Management頁面時正確渲染
            const accountManagementRoot = document.getElementById('Account-Management');
            if (!accountManagementRoot) return;

            // 檢查是否已經有帳戶容器，如果沒有則不需要做任何事
            // HTML中已經包含了帳戶容器的結構
            const accountContainer = accountManagementRoot.querySelector('#account-container');
            const appData = window.APP_DATA || APP_DATA;
            if (accountContainer && appData?.belProfiles?.leaderboard) {
                this.renderAccountCards();
                this.setupAccountFilters();
            }
        },

        setupAccountFilters() {
            const nameInput = document.getElementById('account-f-name');
            const idInput = document.getElementById('account-f-referral-id');
            const levelSelect = document.getElementById('account-f-level');
            const regionSelect = document.getElementById('account-f-region');
            const sortSelect = document.getElementById('account-f-sort');

            // Populate Level options for Account Management
            this.populateAccountLevelOptions(levelSelect);
            
            // Populate Region options for Account Management
            this.populateAccountRegionOptions(regionSelect);

            // Real-time filtering on input change
            if (nameInput) {
                nameInput.addEventListener('input', () => {
                    this.resetAccountPagination();
                    this.renderCurrentView();
                });
            }

            if (idInput) {
                idInput.addEventListener('input', () => {
                    this.resetAccountPagination();
                    this.renderCurrentView();
                });
            }

            if (levelSelect) {
                levelSelect.addEventListener('change', () => {
                    this.resetAccountPagination();
                    this.renderCurrentView();
                });
            }

            if (regionSelect) {
                regionSelect.addEventListener('change', () => {
                    this.resetAccountPagination();
                    this.renderCurrentView();
                });
            }

            if (sortSelect) {
                sortSelect.addEventListener('change', () => {
                    this.resetAccountPagination();
                    this.renderCurrentView();
                });
            }

            // Setup search suggestions for Account Management
            this.setupAccountSearchSuggestions();

            // Setup View Switcher
            this.setupViewSwitcher();

            // Setup pagination
            this.setupAccountPagination();
        },

        populateAccountLevelOptions(levelSelect) {
            if (!levelSelect) return;
            
            const appData = window.APP_DATA || APP_DATA;
            if (!appData?.belProfiles?.leaderboard) return;
            
            // Get unique levels from BEL data
            const levels = [...new Set(appData.belProfiles.leaderboard.map(leader => leader.level))].sort();
            
            levelSelect.innerHTML = '<option value="">All Levels</option>';
            levels.forEach(level => {
                levelSelect.innerHTML += `<option value="${level}">${level}</option>`;
            });
        },

        populateAccountRegionOptions(regionSelect) {
            if (!regionSelect) return;
            
            const appData = window.APP_DATA || APP_DATA;
            if (!appData?.belProfiles?.leaderboard) return;
            
            // Standard regions defined in getRegionFromCountry function
            const standardRegions = [
                'AAU / NZ', 'ASEAN', 'China', 'Europe', 'India', 'Japan',
                'Korea', 'LATAM', 'ME&A', 'North America', 'Taiwan', 
                'Russia & CIS', 'Others'
            ];
            
            // Get regions that have actual data
            const regionsWithData = new Set();
            appData.belProfiles.leaderboard.forEach(leader => {
                if (leader.region) {
                    regionsWithData.add(leader.region);
                }
            });
            
            // Create region options with disabled state for regions without data
            const regionOptions = standardRegions.map(region => {
                const hasData = regionsWithData.has(region);
                const disabled = hasData ? '' : ' disabled';
                const style = hasData ? '' : ' style="color: #999; font-style: italic;"';
                const suffix = hasData ? '' : ' (No data)';
                
                return `<option value="${region}"${disabled}${style}>${region}${suffix}</option>`;
            }).join('');
            
            regionSelect.innerHTML = `
                <option value="">All Regions</option>
                ${regionOptions}
            `;
        },

        resetAccountPagination() {
            appState.accountGridPage = 1;
            appState.accountListPage = 1;
        },

        setupAccountSearchSuggestions() {
            // Setup for Name search
            this.setupAccountSearchForField('account-f-name', 'account-search-suggestions-name', 'name');
            // Setup for Referral ID search
            this.setupAccountSearchForField('account-f-referral-id', 'account-search-suggestions-id', 'id');
        },

        setupAccountSearchForField(inputId, suggestionsId, searchField) {
            const searchInput = document.getElementById(inputId);
            const suggestionsContainer = document.getElementById(suggestionsId);
            
            if (!searchInput || !suggestionsContainer) return;

            let selectedIndex = -1;
            let suggestions = [];

            // Get BEL data for suggestions
            const getBelData = () => {
                const appData = window.APP_DATA || APP_DATA;
                if (!appData?.belProfiles?.leaderboard) return [];
                
                return appData.belProfiles.leaderboard.map(leader => ({
                    name: leader.name,
                    id: leader.id,
                    level: leader.level
                }));
            };

            // Input event for showing suggestions
            searchInput.addEventListener('input', utils.debounce((e) => {
                const query = e.target.value.trim().toLowerCase();
                selectedIndex = -1;
                
                if (query.length === 0) {
                    this.hideAccountSuggestions(suggestionsContainer);
                    return;
                }

                const belData = getBelData();
                
                // Find matching records based on search field
                if (searchField === 'name') {
                    suggestions = belData
                        .filter(record => record.name.toLowerCase().includes(query))
                        .slice(0, 8) // Limit to 8 suggestions
                        .map(record => ({
                            name: record.name,
                            id: record.id,
                            displayText: record.name,
                            searchField: 'name'
                        }));
                } else if (searchField === 'id') {
                    suggestions = belData
                        .filter(record => record.id.toLowerCase().includes(query))
                        .slice(0, 8) // Limit to 8 suggestions
                        .map(record => ({
                            name: record.name,
                            id: record.id,
                            displayText: `${record.id} - ${record.name}`,
                            searchField: 'id'
                        }));
                }

                if (suggestions.length > 0) {
                    this.showAccountSuggestions(suggestions, query, suggestionsContainer, searchInput);
                } else {
                    this.hideAccountSuggestions(suggestionsContainer);
                }
            }, 150));

            // Keyboard navigation
            searchInput.addEventListener('keydown', (e) => {
                const suggestionItems = suggestionsContainer.querySelectorAll('.search-suggestion-item');
                
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        selectedIndex = Math.min(selectedIndex + 1, suggestionItems.length - 1);
                        this.highlightAccountSuggestion(suggestionItems, selectedIndex);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        selectedIndex = Math.max(selectedIndex - 1, -1);
                        this.highlightAccountSuggestion(suggestionItems, selectedIndex);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (selectedIndex >= 0 && suggestionItems[selectedIndex]) {
                            this.selectAccountSuggestion(suggestions[selectedIndex], searchInput);
                        } else {
                            // Apply filter with current input value - trigger rendering
                            this.resetAccountPagination();
                            this.renderCurrentView();
                        }
                        break;
                    case 'Escape':
                        this.hideAccountSuggestions(suggestionsContainer);
                        searchInput.blur();
                        break;
                }
            });

            // Click outside to hide suggestions
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    this.hideAccountSuggestions(suggestionsContainer);
                }
            });

            // Focus event to show suggestions if there's a value
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim().length > 0) {
                    searchInput.dispatchEvent(new Event('input'));
                }
            });
        },

        showAccountSuggestions(suggestions, query, suggestionsContainer, searchInput) {
            if (!suggestionsContainer) return;

            const html = suggestions.map((suggestion, index) => {
                if (suggestion.searchField === 'id') {
                    // For Referral ID search: Black ID, gray name
                    const highlightedId = this.highlightAccountMatch(suggestion.id, query);
                    return `
                        <div class="search-suggestion-item" data-index="${index}">
                            <div class="suggestion-id-main">${highlightedId}</div>
                            <div class="suggestion-name-sub">${suggestion.name}</div>
                        </div>
                    `;
                } else {
                    // For name search: use original format
                    const highlightedName = this.highlightAccountMatch(suggestion.name, query);
                    return `
                        <div class="search-suggestion-item" data-index="${index}">
                            <div class="suggestion-content">${highlightedName}</div>
                        </div>
                    `;
                }
            }).join('');

            suggestionsContainer.innerHTML = html;
            suggestionsContainer.classList.add('show');

            // Add click listeners to suggestion items
            suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    this.selectAccountSuggestion(suggestions[index], searchInput);
                });
            });
        },

        hideAccountSuggestions(suggestionsContainer) {
            if (suggestionsContainer) {
                suggestionsContainer.classList.remove('show');
                suggestionsContainer.innerHTML = '';
            }
        },

        highlightAccountSuggestion(items, index) {
            items.forEach((item, i) => {
                item.classList.toggle('highlighted', i === index);
            });
        },

        selectAccountSuggestion(suggestion, searchInput) {
            if (searchInput) {
                if (suggestion.searchField === 'name') {
                    searchInput.value = suggestion.name;
                } else if (suggestion.searchField === 'id') {
                    searchInput.value = suggestion.id;
                }
                const suggestionsContainer = searchInput.nextElementSibling;
                this.hideAccountSuggestions(suggestionsContainer);
                this.resetAccountPagination();
                this.renderCurrentView();
            }
        },

        highlightAccountMatch(text, query) {
            if (!query) return text;
            
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<mark style="background-color: var(--ds-color-primary-light-30); font-weight: var(--fw-semibold);">$1</mark>');
        },

        setupViewSwitcher() {
            const viewSwitcher = document.getElementById('account-view-switcher');
            if (!viewSwitcher) return;

            const viewButtons = viewSwitcher.querySelectorAll('.view-btn');
            const gridView = document.getElementById('account-grid-view');
            const listView = document.getElementById('account-list-view');

            viewButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const view = btn.getAttribute('data-view');
                    
                    // Update button states
                    viewButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Switch views
                    if (view === 'grid') {
                        gridView.style.display = 'block';
                        listView.style.display = 'none';
                        gridView.classList.add('active');
                        listView.classList.remove('active');
                        this.renderAccountCards(); // Render grid view
                    } else {
                        gridView.style.display = 'none';
                        listView.style.display = 'block';
                        gridView.classList.remove('active');
                        listView.classList.add('active');
                        this.renderAccountList(); // Render list view
                    }
                });
            });
        },

        renderCurrentView() {
            // Check which view is currently active
            const gridView = document.getElementById('account-grid-view');
            const listView = document.getElementById('account-list-view');
            
            if (gridView && gridView.style.display !== 'none') {
                // Grid view is active
                this.renderAccountCards();
            } else if (listView && listView.style.display !== 'none') {
                // List view is active
                this.renderAccountList();
            } else {
                // Default to grid view if no view is explicitly active
                this.renderAccountCards();
            }
        },

        renderAccountCards() {
            const container = document.getElementById('account-container');
            const appData = window.APP_DATA || APP_DATA;
            
            if (!container || !appData?.belProfiles?.leaderboard) {
                console.log('Account Management: Missing container or belProfiles data');
                return;
            }

            // Get filter values
            const nameFilter = document.getElementById('account-f-name')?.value.toLowerCase() || '';
            const idFilter = document.getElementById('account-f-referral-id')?.value.toLowerCase() || '';
            const levelFilter = document.getElementById('account-f-level')?.value || '';
            const regionFilter = document.getElementById('account-f-region')?.value || '';
            const sortBy = document.getElementById('account-f-sort')?.value || 'name';

            // Helper function to get country from referral ID
            const getCountryFromId = (id) => {
                const prefix = id.substring(1, 3);
                const countryNames = {
                    'TW': 'Taiwan', 'US': 'United States', 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan',
                    'AU': 'Australia', 'KR': 'South Korea', 'IT': 'Italy', 'MX': 'Mexico', 'CN': 'China',
                    'CA': 'Canada', 'IN': 'India', 'NO': 'Norway', 'NL': 'Netherlands', 'BR': 'Brazil',
                    'SE': 'Sweden', 'CH': 'Switzerland', 'DK': 'Denmark', 'PL': 'Poland', 'BE': 'Belgium',
                    'SG': 'Singapore', 'TH': 'Thailand', 'MY': 'Malaysia', 'ZA': 'South Africa'
                };
                const countryMap = {
                    'TW': 'TW', 'US': 'US', 'DE': 'DE', 'FR': 'FR', 'JP': 'JP',
                    'AU': 'AU', 'KR': 'KR', 'IT': 'IT', 'MX': 'MX', 'CN': 'CN',
                    'CA': 'CA', 'IN': 'IN', 'NO': 'NO', 'NL': 'NL', 'BR': 'BR',
                    'SE': 'SE', 'CH': 'CH', 'DA': 'DK', 'PL': 'PL', 'BE': 'BE',
                    'SG': 'SG', 'TH': 'TH', 'MY': 'MY', 'ZA': 'ZA'
                };
                const countryCode = countryMap[prefix] || 'US';
                return countryNames[countryCode] || 'United States';
            };

            // 使用現有的 leaderboard 資料來渲染帳戶卡片
            let accountData = appData.belProfiles.leaderboard.map(account => {
                const country = getCountryFromId(account.id);
                
                // Calculate yearly cumulative data (defaults to 2025)
                const yearlyData = AccountManagement.calculateYearlyData(account);
                
                return {
                    referralId: account.id,
                    name: account.name,
                    level: account.level,
                    clicks: yearlyData.clicks,
                    orders: yearlyData.orders,
                    revenue: yearlyData.revenue,
                    c20cvr: yearlyData.clicks > 0 ? parseFloat(((yearlyData.orders / yearlyData.clicks) * 100).toFixed(2)) : 0,
                    aov: yearlyData.orders > 0 ? yearlyData.revenue / yearlyData.orders : 0,
                    email: account.email,
                    country: country,
                    region: utils.getRegionFromCountry(country)
                };
            });

            // Apply filters
            if (nameFilter) {
                accountData = accountData.filter(account => 
                    account.name.toLowerCase().includes(nameFilter)
                );
            }
            if (idFilter) {
                accountData = accountData.filter(account => 
                    account.referralId.toLowerCase().includes(idFilter)
                );
            }
            if (levelFilter) {
                accountData = accountData.filter(account => 
                    account.level === levelFilter
                );
            }
            if (regionFilter) {
                accountData = accountData.filter(account => 
                    account.region === regionFilter
                );
            }

            // Apply sorting
            accountData.sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'id':
                        return a.referralId.localeCompare(b.referralId);
                    case 'level':
                        // Sort by level hierarchy: Leader > Exploder > Enabler > Builder
                        const levelOrder = { 'Leader': 4, 'Exploder': 3, 'Enabler': 2, 'Builder': 1 };
                        return (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0);
                    case 'orders':
                        return b.orders - a.orders; // Descending order
                    case 'clicks':
                        return b.clicks - a.clicks; // Descending order
                    case 'revenue':
                        return b.revenue - a.revenue; // Descending order
                    default:
                        return a.name.localeCompare(b.name);
                }
            });

            // Apply pagination
            const totalCards = accountData.length;
            const startIndex = (appState.accountGridPage - 1) * appState.accountGridRowsPerPage;
            const endIndex = Math.min(startIndex + appState.accountGridRowsPerPage, totalCards);
            const paginatedData = accountData.slice(startIndex, endIndex);

            container.innerHTML = '';
            
            // Show message if no results
            if (totalCards === 0) {
                container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">No accounts found matching the current filters.</div>';
                this.updateAccountGridPaginationUI(0, 0, 0);
                return;
            }

            paginatedData.forEach(account => {
                const card = document.createElement('div');
                card.className = 'bel-acct-mgmt-card flex flex-col space-y-4';
                card.style.cursor = 'pointer';
                card.setAttribute('data-account-id', account.referralId);

                card.innerHTML = `
                    <!-- Main user info -->
                    <div class="flex items-center space-x-4">
                        ${utils.generateAvatarHTMLPlaceholder(account.referralId, 48)}
                        <div class="flex-1 min-w-0">
                            <!-- Name and level pill -->
                            <div class="flex items-center space-x-2">
                                <h2 class="bel-acct-mgmt-text-xl-var flex-1 whitespace-nowrap overflow-hidden text-ellipsis">${account.name}</h2>
                                <span class="bel-badge ${account.level.toLowerCase()}">
                                    ${account.level}
                                </span>
                            </div>
                            <p class="bel-acct-mgmt-text-xs-var">${account.referralId}</p>
                        </div>
                    </div>

                    <!-- Metrics container -->
                    <div class="flex flex-col space-y-2 mt-4 text-sm">
                        <div class="flex items-center justify-between">
                            <span class="flex items-center space-x-1">
                                <span class="bel-acct-mgmt-text-clicks-var">${account.revenue > 9999 ? '$' + Math.round(account.revenue / 1000) + 'K' : utils.formatMoney(account.revenue, 0)}</span>
                                <span class="bel-acct-mgmt-text-xs-var">Rev.</span>
                            </span>
                            <span class="flex items-center space-x-1">
                                <span class="bel-acct-mgmt-text-orders-var">${account.orders.toLocaleString()}</span>
                                <span class="bel-acct-mgmt-text-xs-var">Orders</span>
                            </span>
                            <span class="flex items-center space-x-1">
                                <span class="bel-acct-mgmt-text-cvr-var">${account.c20cvr.toFixed(2)}%</span>
                                <span class="bel-acct-mgmt-text-xs-var">C2OCVR</span>
                            </span>
                        </div>
                    </div>

                    <!-- Email at the bottom -->
                    <div class="flex flex-col mt-4 pt-4" style="border-top: 1px solid var(--ot-color-gray-45);">
                        <div class="flex items-center justify-start mb-2">
                            <i class="fas fa-envelope bel-acct-mgmt-text-gray-40-var mr-2"></i>
                            <a href="mailto:${account.email}" style="font-size: var(--fs-sm); color: var(--ds-color-gray-70); font-weight: var(--fw-normal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;" onclick="event.stopPropagation();">${account.email}</a>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            // Update pagination UI
            this.updateAccountGridPaginationUI(totalCards, startIndex, endIndex);

            // 添加點擊事件處理
            this.setupAccountCardEvents();
        },

        setupAccountCardEvents() {
            const accountCards = document.querySelectorAll('.bel-acct-mgmt-card');
            accountCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    // 防止子元素的事件冒泡（如email鏈接）
                    const accountId = card.getAttribute('data-account-id');
                    // 觸發現有的BEL詳情模態框
                    const accountData = APP_DATA.belProfiles.leaderboard.find(account => account.id === accountId);
                    if (accountData) {
                        // 使用現有的模態框邏輯
                        BELModal.openModal(accountData.id);
                    }
                });
            });
        },

        renderAccountList() {
            const tableBody = document.querySelector('#account-list-table tbody');
            const appData = window.APP_DATA || APP_DATA;
            if (!tableBody || !appData?.belProfiles?.leaderboard) return;

            // Get filter values (same logic as grid view)
            const nameFilter = document.getElementById('account-f-name')?.value.toLowerCase() || '';
            const idFilter = document.getElementById('account-f-referral-id')?.value.toLowerCase() || '';
            const levelFilter = document.getElementById('account-f-level')?.value || '';
            const regionFilter = document.getElementById('account-f-region')?.value || '';
            const sortBy = document.getElementById('account-f-sort')?.value || 'name';

            // 將國碼轉換為國家名稱的輔助函數
            const getCountryFromId = (id) => {
                const prefix = id.substring(1, 3);
                const countryNames = {
                    'TW': 'Taiwan', 'US': 'United States', 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan',
                    'AU': 'Australia', 'KR': 'South Korea', 'IT': 'Italy', 'MX': 'Mexico', 'CN': 'China',
                    'CA': 'Canada', 'IN': 'India', 'NO': 'Norway', 'NL': 'Netherlands', 'BR': 'Brazil',
                    'SE': 'Sweden', 'CH': 'Switzerland', 'DK': 'Denmark', 'PL': 'Poland', 'BE': 'Belgium',
                    'SG': 'Singapore', 'TH': 'Thailand', 'MY': 'Malaysia', 'ZA': 'South Africa'
                };
                const countryMap = {
                    'TW': 'TW', 'US': 'US', 'DE': 'DE', 'FR': 'FR', 'JP': 'JP',
                    'AU': 'AU', 'KR': 'KR', 'IT': 'IT', 'MX': 'MX', 'CN': 'CN',
                    'CA': 'CA', 'IN': 'IN', 'NO': 'NO', 'NL': 'NL', 'BR': 'BR',
                    'SE': 'SE', 'CH': 'CH', 'DA': 'DK', 'PL': 'PL', 'BE': 'BE',
                    'SG': 'SG', 'TH': 'TH', 'MY': 'MY', 'ZA': 'ZA'
                };
                const countryCode = countryMap[prefix] || 'US';
                return countryNames[countryCode] || 'United States';
            };

            // 使用現有的 leaderboard 資料來渲染帳戶列表
            let accountData = appData.belProfiles.leaderboard.map(account => {
                const country = getCountryFromId(account.id);
                
                // Calculate yearly cumulative data (defaults to 2025)
                const yearlyData = AccountManagement.calculateYearlyData(account);
                
                return {
                    referralId: account.id,
                    name: account.name,
                    level: account.level,
                    clicks: yearlyData.clicks,
                    orders: yearlyData.orders,
                    revenue: yearlyData.revenue,
                    c20cvr: yearlyData.clicks > 0 ? parseFloat(((yearlyData.orders / yearlyData.clicks) * 100).toFixed(2)) : 0,
                    aov: yearlyData.orders > 0 ? yearlyData.revenue / yearlyData.orders : 0,
                    email: account.email,
                    country: country,
                    region: utils.getRegionFromCountry(country)
                };
            });

            // Apply filters (same logic as grid view)
            if (nameFilter) {
                accountData = accountData.filter(account => 
                    account.name.toLowerCase().includes(nameFilter)
                );
            }
            if (idFilter) {
                accountData = accountData.filter(account => 
                    account.referralId.toLowerCase().includes(idFilter)
                );
            }
            if (levelFilter) {
                accountData = accountData.filter(account => 
                    account.level === levelFilter
                );
            }
            if (regionFilter) {
                accountData = accountData.filter(account => 
                    account.region === regionFilter
                );
            }

            // Apply sorting (same logic as grid view)
            accountData.sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'id':
                        return a.referralId.localeCompare(b.referralId);
                    case 'level':
                        // Sort by level hierarchy: Leader > Exploder > Enabler > Builder
                        const levelOrder = { 'Leader': 4, 'Exploder': 3, 'Enabler': 2, 'Builder': 1 };
                        return (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0);
                    case 'orders':
                        return b.orders - a.orders; // Descending order
                    case 'clicks':
                        return b.clicks - a.clicks; // Descending order
                    case 'revenue':
                        return b.revenue - a.revenue; // Descending order
                    case 'c20cvr':
                        return b.c20cvr - a.c20cvr; // Descending order
                    case 'aov':
                        return parseFloat(b.aov.replace(/[$,]/g, '')) - parseFloat(a.aov.replace(/[$,]/g, '')); // Descending order
                    case 'region':
                        return a.region.localeCompare(b.region); // Ascending order
                    default:
                        return a.name.localeCompare(b.name);
                }
            });

            // Apply pagination
            const totalRows = accountData.length;
            const startIndex = (appState.accountListPage - 1) * appState.accountListRowsPerPage;
            const endIndex = Math.min(startIndex + appState.accountListRowsPerPage, totalRows);
            const paginatedData = accountData.slice(startIndex, endIndex);

            tableBody.innerHTML = '';
            
            // Show message if no results
            if (totalRows === 0) {
                tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem; color: #666;">No accounts found matching the current filters.</td></tr>';
                this.updateAccountListPaginationUI(0, 0, 0);
                return;
            }

            paginatedData.forEach(account => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.setAttribute('data-account-id', account.referralId);
                
                row.innerHTML = `
                    <td><a href="#" class="referral-id-link" data-referral-id="${account.referralId}">${account.referralId}</a></td>
                    <td>${account.name}</td>
                    <td><span class="bel-badge ${account.level.toLowerCase()}">${account.level}</span></td>
                    <td style="text-align: right;">${account.clicks.toLocaleString()}</td>
                    <td style="text-align: right;">${account.orders.toLocaleString()}</td>
                    <td style="text-align: right;">$${account.revenue.toLocaleString()}</td>
                    <td style="text-align: right;">${account.c20cvr.toFixed(2)}%</td>
                    <td style="text-align: right;">${utils.formatMoney(account.aov, 2)}</td>
                    <td>${account.region}</td>
                    <td>${account.country}</td>
                `;

                tableBody.appendChild(row);
            });

            // Update pagination UI
            this.updateAccountListPaginationUI(totalRows, startIndex, endIndex);

            // 添加點擊事件處理
            this.setupAccountListEvents();
        },

        updateAccountGridPaginationUI(total, startIndex, endIndex) {
            const rangeLabel = document.getElementById('account-grid-range-label');
            const prevBtn = document.getElementById('account-grid-prev-page');
            const nextBtn = document.getElementById('account-grid-next-page');
            const rowsSelect = document.getElementById('account-grid-rows-per-page');

            if (rangeLabel) {
                const from = total === 0 ? 0 : startIndex + 1;
                const to = endIndex;
                rangeLabel.textContent = `${from}–${to} of ${total}`;
            }

            if (prevBtn) {
                prevBtn.disabled = appState.accountGridPage === 1;
            }

            if (nextBtn) {
                nextBtn.disabled = endIndex >= total;
            }

            if (rowsSelect) {
                const availableOptions = ['6', '12', '24'];
                const currentValue = appState.accountGridRowsPerPage.toString();
                rowsSelect.value = availableOptions.includes(currentValue) ? currentValue : '12';
            }
        },

        updateAccountListPaginationUI(total, startIndex, endIndex) {
            const rangeLabel = document.getElementById('account-list-range-label');
            const prevBtn = document.getElementById('account-list-prev-page');
            const nextBtn = document.getElementById('account-list-next-page');
            const rowsSelect = document.getElementById('account-list-rows-per-page');

            if (rangeLabel) {
                const from = total === 0 ? 0 : startIndex + 1;
                const to = endIndex;
                rangeLabel.textContent = `${from}–${to} of ${total}`;
            }

            if (prevBtn) {
                prevBtn.disabled = appState.accountListPage === 1;
            }

            if (nextBtn) {
                nextBtn.disabled = endIndex >= total;
            }

            if (rowsSelect) {
                const availableOptions = ['5', '10', '20'];
                const currentValue = appState.accountListRowsPerPage.toString();
                rowsSelect.value = availableOptions.includes(currentValue) ? currentValue : '10';
            }
        },

        setupAccountPagination() {
            // Grid view pagination
            const gridPrevBtn = document.getElementById('account-grid-prev-page');
            const gridNextBtn = document.getElementById('account-grid-next-page');
            const gridRowsSelect = document.getElementById('account-grid-rows-per-page');

            if (gridPrevBtn) {
                gridPrevBtn.addEventListener('click', () => {
                    if (appState.accountGridPage > 1) {
                        appState.accountGridPage--;
                        this.renderAccountCards();
                    }
                });
            }

            if (gridNextBtn) {
                gridNextBtn.addEventListener('click', () => {
                    // Get current filtered data count
                    const appData = window.APP_DATA || APP_DATA;
                    if (!appData?.belProfiles?.leaderboard) return;
                    
                    // Apply current filters to get total count
                    const nameFilter = document.getElementById('account-f-name')?.value.toLowerCase() || '';
                    const idFilter = document.getElementById('account-f-referral-id')?.value.toLowerCase() || '';
                    const levelFilter = document.getElementById('account-f-level')?.value || '';
                    const regionFilter = document.getElementById('account-f-region')?.value || '';
                    
                    let accountData = appData.belProfiles.leaderboard;
                    
                    // Apply filters
                    if (nameFilter) {
                        accountData = accountData.filter(account => 
                            account.name.toLowerCase().includes(nameFilter)
                        );
                    }
                    if (idFilter) {
                        accountData = accountData.filter(account => 
                            account.id.toLowerCase().includes(idFilter)
                        );
                    }
                    if (levelFilter) {
                        accountData = accountData.filter(account => 
                            account.level === levelFilter
                        );
                    }
                    if (regionFilter) {
                        accountData = accountData.filter(account => 
                            account.region === regionFilter
                        );
                    }
                    
                    const totalCards = accountData.length;
                    const maxPage = Math.ceil(totalCards / appState.accountGridRowsPerPage);
                    
                    if (appState.accountGridPage < maxPage) {
                        appState.accountGridPage++;
                        this.renderAccountCards();
                    }
                });
            }

            if (gridRowsSelect) {
                gridRowsSelect.addEventListener('change', (e) => {
                    appState.accountGridRowsPerPage = parseInt(e.target.value, 10);
                    appState.accountGridPage = 1; // Reset to first page
                    this.renderAccountCards();
                });
            }

            // List view pagination
            const listPrevBtn = document.getElementById('account-list-prev-page');
            const listNextBtn = document.getElementById('account-list-next-page');
            const listRowsSelect = document.getElementById('account-list-rows-per-page');

            if (listPrevBtn) {
                listPrevBtn.addEventListener('click', () => {
                    if (appState.accountListPage > 1) {
                        appState.accountListPage--;
                        this.renderAccountList();
                    }
                });
            }

            if (listNextBtn) {
                listNextBtn.addEventListener('click', () => {
                    // Get current filtered data count
                    const appData = window.APP_DATA || APP_DATA;
                    if (!appData?.belProfiles?.leaderboard) return;
                    
                    // Apply current filters to get total count
                    const nameFilter = document.getElementById('account-f-name')?.value.toLowerCase() || '';
                    const idFilter = document.getElementById('account-f-referral-id')?.value.toLowerCase() || '';
                    const levelFilter = document.getElementById('account-f-level')?.value || '';
                    const regionFilter = document.getElementById('account-f-region')?.value || '';
                    
                    let accountData = appData.belProfiles.leaderboard;
                    
                    // Apply filters
                    if (nameFilter) {
                        accountData = accountData.filter(account => 
                            account.name.toLowerCase().includes(nameFilter)
                        );
                    }
                    if (idFilter) {
                        accountData = accountData.filter(account => 
                            account.id.toLowerCase().includes(idFilter)
                        );
                    }
                    if (levelFilter) {
                        accountData = accountData.filter(account => 
                            account.level === levelFilter
                        );
                    }
                    if (regionFilter) {
                        accountData = accountData.filter(account => 
                            account.region === regionFilter
                        );
                    }
                    
                    const totalRows = accountData.length;
                    const maxPage = Math.ceil(totalRows / appState.accountListRowsPerPage);
                    
                    if (appState.accountListPage < maxPage) {
                        appState.accountListPage++;
                        this.renderAccountList();
                    }
                });
            }

            if (listRowsSelect) {
                listRowsSelect.addEventListener('change', (e) => {
                    appState.accountListRowsPerPage = parseInt(e.target.value, 10);
                    appState.accountListPage = 1; // Reset to first page
                    this.renderAccountList();
                });
            }
        },

        setupAccountListEvents() {
            const accountRows = document.querySelectorAll('#account-list-table tbody tr[data-account-id]');
            accountRows.forEach(row => {
                row.addEventListener('click', (e) => {
                    // 如果點擊的是 referral ID 連結，打開 BEL 詳情模態框
                    if (e.target.closest('a.referral-id-link')) {
                        e.preventDefault();
                        e.stopPropagation();
                        const referralId = e.target.closest('a.referral-id-link').getAttribute('data-referral-id');
                        const accountData = APP_DATA.belProfiles.leaderboard.find(account => account.id === referralId);
                        if (accountData) {
                            BELModal.openModal(accountData.id);
                        }
                        return;
                    }
                    
                    // 否則，點擊行的其他部分也會打開模態框
                    const accountId = row.getAttribute('data-account-id');
                    const accountData = APP_DATA.belProfiles.leaderboard.find(account => account.id === accountId);
                    if (accountData) {
                        BELModal.openModal(accountData.id);
                    }
                });
            });
        },

        injectPayoutsAndOrders() {
            const payoutsOrderRoot = document.getElementById('payouts-order');
            if (!payoutsOrderRoot) return;

            payoutsOrderRoot.innerHTML = `
                <h1 class="bel-h1">Payouts & Orders</h1>
                
                <!-- Payout Statistics Cards -->
                <div class="bel-stats-cards grid-cols-3">
                    <!-- Cards will be populated by JavaScript -->
                </div>
                
                <div class="bel-panel" id="payouts-history-panel">
                    <div class="panel-header">
                        <h3 style="margin:0;">Payout History 
                            <span class="bel-badge approved" style="margin-left:4px;">Monthly payout on 12th</span>
                        </h3>
                    </div>
                    <div class="scrollable-table-container">
                        <table class="bel-table" id="payout-history-table">
                            <thead>
                                <tr>
                                    <th data-sortable data-type="string">Payout Month</th>
                                    <th data-sortable data-type="number">Total Net Payouts</th>
                                    <th data-sortable data-type="number">BEL Count</th>
                                    <th>View Detail</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                    <div class="pagination-bar">
                        <div class="rows-select">
                            <label for="payout-rows-per-page">Rows per page</label>
                            <select id="payout-rows-per-page" class="bel-form-control bel-form-select">
                                <option>5</option>
                                <option selected>12</option>
                                <option>20</option>
                            </select>
                        </div>
                        <div class="pagination-controls">
                            <span id="payout-range-label" class="text-muted">0–0 of 0</span>
                            <button class="bel-btn secondary" id="payout-prev-page" aria-label="Previous page">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="bel-btn secondary" id="payout-next-page" aria-label="Next page">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="bel-panel" id="order-tracking-panel-payout" style="margin-top: 20px;">
                    <div class="panel-header">
                        <h3 style="margin:0;">Order Tracking</h3>
                        <div style="display: flex; gap: 8px;">
                            <button class="bel-btn secondary" id="order-filter-btn">
                                <i class="fas fa-filter"></i> Filter
                            </button>
                        </div>
                    </div>
                    
                    <!-- Filter Panel (initially hidden) -->
                    <div class="filter-panel" id="order-filter-panel" style="display: none;">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="order-date-range">Order Date</label>
                                <input type="text" id="order-date-range" class="bel-form-control bel-form-input" placeholder="Select date range" autocomplete="off">
                            </div>
                            <div class="filter-group">
                                <label for="order-search">Search</label>
                                <div class="search-input-container">
                                    <input type="text" id="order-search" class="bel-form-control bel-form-input" placeholder="Order Number / ID  / Name">
                                    <div id="order-search-suggestions" class="search-suggestions"></div>
                                </div>
                            </div>
                            <div class="filter-group">
                                <label for="order-amount">Order Amount(USD)</label>
                                <input type="text" id="order-amount" class="bel-form-control bel-form-input" placeholder="e.g. 100-500 or >=100" autocomplete="off">
                            </div>
                            <div class="filter-group">
                                <label for="order-status-filter">Status</label>
                                <select id="order-status-filter" class="bel-form-control bel-form-select">
                                    <option value="">All Status</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Canceled">Canceled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scrollable-table-container">
                        <table class="bel-table" id="order-tracking-table-payout">
                            <thead>
                                <tr>
                                    <th data-sortable data-type="string">Order Placed</th>
                                    <th data-sortable data-type="string">Order Number</th>
                                    <th data-sortable data-type="string">Referral ID</th>
                                    <th data-sortable data-type="string">BEL Name</th>
                                    <th data-sortable data-type="number">Order Amount(USD)</th>
                                    <th data-sortable data-type="string">Currency</th>
                                    <th data-sortable data-type="string">Status</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                    <div class="pagination-bar">
                        <div class="rows-select">
                            <label for="order-rows-per-page-payout">Rows per page</label>
                            <select id="order-rows-per-page-payout" class="bel-form-control bel-form-select">
                                <option>5</option>
                                <option selected>10</option>
                                <option>20</option>
                            </select>
                        </div>
                        <div class="pagination-controls">
                            <span id="order-range-label-payout" class="text-muted">0–0 of 0</span>
                            <button class="bel-btn secondary" id="order-prev-page-payout" aria-label="Previous page">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="bel-btn secondary" id="order-next-page-payout" aria-label="Next page">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Render data after DOM injection
            setTimeout(async () => {
                await this.loadPayoutData(); // Ensure payout data is loaded first
                
                // Get current filter values
                const selectedYear = document.getElementById('header-year-filter') ? 
                    document.getElementById('header-year-filter').value : null;
                const selectedRegion = document.getElementById('header-region-filter') ? 
                    document.getElementById('header-region-filter').value : 'all';
                
                this.renderPayoutStatsCards(selectedYear, selectedRegion);
                this.renderPayoutHistory(selectedYear, selectedRegion);
                this.renderOrdersInPayout(selectedYear, selectedRegion);
                this.setupPayoutPagination();
                this.setupOrdersPaginationForPayout();
                this.setupOrderFilters();
            }, 0);
        },

        /**
         * Calculate payout statistics for the stats cards
         * @param {string} selectedYear - Year to filter by (defaults to current selected year)
         * @param {string} selectedRegion - Region to filter by (defaults to 'all')
         * @returns {Object} Calculated payout statistics
         */
        calculatePayoutStats(selectedYear = null, selectedRegion = 'all') {
            // Ensure payout data is loaded
            if (!window.PAYOUT_DATA || !window.PAYOUT_DATA.belPayoutHistory) {
                return {
                    totalPayoutAmount: 0,
                    activeBelCount: 0,
                    totalOrderCount: 0
                };
            }

            // Get BEL profiles data for order count calculation
            const belProfilesData = APP_DATA?.belProfiles?.leaderboard || [];
            
            let totalPayoutAmount = 0;
            const activeBelIds = new Set();
            let totalOrderCount = 0;
            
            const currentYear = new Date().getFullYear();
            const targetYear = selectedYear && selectedYear !== 'all' ? parseInt(selectedYear) : currentYear;
            
            // Process all BEL payout records
            window.PAYOUT_DATA.belPayoutHistory.forEach(bel => {
                // Filter by selected region if specified
                if (selectedRegion && selectedRegion !== 'all' && bel.belRegion !== selectedRegion) {
                    return;
                }
                
                // Filter payout history by year
                const filteredPayouts = bel.payoutHistory.filter(payout => {
                    if (selectedYear === 'all') {
                        return true; // Include all years
                    }
                    return payout.year === targetYear;
                });
                
                // Sum up payout amounts and count active BELs
                if (filteredPayouts.length > 0) {
                    activeBelIds.add(bel.belId);
                    filteredPayouts.forEach(payout => {
                        totalPayoutAmount += payout.netPayout || 0;
                    });
                }
            });
            
            // Calculate order count from belProfiles.json leaderboard data
            belProfilesData.forEach(leader => {
                // Apply region filter
                if (selectedRegion && selectedRegion !== 'all' && leader.region !== selectedRegion) {
                    return;
                }
                
                // Sum orders from monthly data based on year filter
                if (leader.monthlyData) {
                    if (selectedYear === 'all') {
                        // Sum all years
                        Object.keys(leader.monthlyData).forEach(year => {
                            Object.keys(leader.monthlyData[year]).forEach(month => {
                                const monthData = leader.monthlyData[year][month];
                                if (monthData && monthData.orders) {
                                    totalOrderCount += monthData.orders;
                                }
                            });
                        });
                    } else {
                        // Sum specific year
                        const yearData = leader.monthlyData[targetYear.toString()];
                        if (yearData) {
                            Object.keys(yearData).forEach(month => {
                                const monthData = yearData[month];
                                if (monthData && monthData.orders) {
                                    totalOrderCount += monthData.orders;
                                }
                            });
                        }
                    }
                }
            });
            
            return {
                totalPayoutAmount,
                activeBelCount: activeBelIds.size,
                totalOrderCount
            };
        },

        /**
         * Calculate previous month statistics for trend comparison
         * @param {string} selectedYear - Year to filter by
         * @param {string} selectedRegion - Region to filter by
         * @returns {Object} Previous month statistics and trend information
         */
        calculatePreviousMonthTrends(selectedYear = null, selectedRegion = 'all') {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // 1-12
            const currentYear = currentDate.getFullYear();
            
            // Calculate previous month (the month we want to show trends for)
            let targetMonth = currentMonth - 1;
            let targetYear = currentYear;
            if (targetMonth === 0) {
                targetMonth = 12;
                targetYear = currentYear - 1;
            }
            
            // Calculate the month before the target month (for comparison)
            let comparisonMonth = targetMonth - 1;
            let comparisonYear = targetYear;
            if (comparisonMonth === 0) {
                comparisonMonth = 12;
                comparisonYear = targetYear - 1;
            }
            
            // Get month names
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const targetMonthName = monthNames[targetMonth - 1];
            
            // Calculate target month stats (e.g., August)
            const targetMonthStats = this.calculatePayoutStatsForSpecificMonth(targetYear, targetMonth, selectedRegion);
            
            // Calculate comparison month stats (e.g., July for comparison with August)
            const comparisonMonthStats = this.calculatePayoutStatsForSpecificMonth(comparisonYear, comparisonMonth, selectedRegion);
            
            // Calculate growth/decline from comparison month to target month
            const payoutAmountGrowth = targetMonthStats.totalPayoutAmount - comparisonMonthStats.totalPayoutAmount;
            const belCountGrowth = targetMonthStats.activeBelCount - comparisonMonthStats.activeBelCount;
            const orderCountGrowth = targetMonthStats.totalOrderCount - comparisonMonthStats.totalOrderCount;
            
            // Format trend values
            const formatTrendValue = (growth, isMonetary = false) => {
                if (growth === 0) return '0';
                const sign = growth > 0 ? '+' : '';
                
                if (isMonetary) {
                    if (Math.abs(growth) >= 100000) {
                        return `${sign}$${(growth / 1000).toFixed(0)}k`;
                    } else {
                        return `${sign}$${Math.abs(growth).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}`;
                    }
                } else {
                    if (Math.abs(growth) >= 1000) {
                        return `${sign}${(growth / 1000).toFixed(0)}k`;
                    }
                    return `${sign}${growth.toLocaleString()}`;
                }
            };
            
            return {
                targetMonthName,
                payoutAmountTrend: {
                    value: formatTrendValue(payoutAmountGrowth, true),
                    status: payoutAmountGrowth >= 0 ? 'positive' : 'negative',
                    text: `${payoutAmountGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                },
                belCountTrend: {
                    value: formatTrendValue(belCountGrowth),
                    status: belCountGrowth >= 0 ? 'positive' : 'negative',
                    text: `${belCountGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                },
                orderCountTrend: {
                    value: formatTrendValue(orderCountGrowth),
                    status: orderCountGrowth >= 0 ? 'positive' : 'negative',
                    text: `${orderCountGrowth >= 0 ? 'Increased' : 'Decreased'} in ${targetMonthName} (MoM)`
                }
            };
        },

        /**
         * Calculate payout statistics for a specific month
         * @param {number} year - Specific year
         * @param {number} month - Specific month (1-12)
         * @param {string} selectedRegion - Region to filter by
         * @returns {Object} Statistics for the specific month
         */
        calculatePayoutStatsForSpecificMonth(year, month, selectedRegion = 'all') {
            if (!window.PAYOUT_DATA || !window.PAYOUT_DATA.belPayoutHistory) {
                return {
                    totalPayoutAmount: 0,
                    activeBelCount: 0,
                    totalOrderCount: 0
                };
            }

            // Get BEL profiles data for order count calculation
            const belProfilesData = APP_DATA?.belProfiles?.leaderboard || [];
            
            let totalPayoutAmount = 0;
            const activeBelIds = new Set();
            let totalOrderCount = 0;
            
            // Process payout data for specific month
            window.PAYOUT_DATA.belPayoutHistory.forEach(bel => {
                // Filter by selected region if specified
                if (selectedRegion && selectedRegion !== 'all' && bel.belRegion !== selectedRegion) {
                    return;
                }
                
                // Find payouts for the specific month
                const monthPayouts = bel.payoutHistory.filter(payout => 
                    payout.year === year && payout.month === month
                );
                
                if (monthPayouts.length > 0) {
                    activeBelIds.add(bel.belId);
                    monthPayouts.forEach(payout => {
                        totalPayoutAmount += payout.netPayout || 0;
                    });
                }
            });
            
            // Calculate order count from belProfiles.json for specific month
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = monthNames[month - 1];
            
            belProfilesData.forEach(leader => {
                // Apply region filter
                if (selectedRegion && selectedRegion !== 'all' && leader.region !== selectedRegion) {
                    return;
                }
                
                // Get orders for specific year and month
                if (leader.monthlyData && leader.monthlyData[year.toString()]) {
                    const monthData = leader.monthlyData[year.toString()][monthName];
                    if (monthData && monthData.orders) {
                        totalOrderCount += monthData.orders;
                    }
                }
            });
            
            return {
                totalPayoutAmount,
                activeBelCount: activeBelIds.size,
                totalOrderCount
            };
        },

        /**
         * Render payout statistics cards
         * @param {string} selectedYear - Year to filter by
         * @param {string} selectedRegion - Region to filter by
         */
        renderPayoutStatsCards(selectedYear = null, selectedRegion = 'all') {
            const statsContainer = document.querySelector('#payouts-order .bel-stats-cards');
            if (!statsContainer) return;
            
            // Calculate statistics based on filters
            const stats = this.calculatePayoutStats(selectedYear, selectedRegion);
            
            // Calculate trends compared to previous month
            const trends = this.calculatePreviousMonthTrends(selectedYear, selectedRegion);
            
            // Format values for display
            const payoutAmountFormatted = stats.totalPayoutAmount >= 100000 ? 
                `$${(stats.totalPayoutAmount / 1000).toFixed(0)}k` : 
                `$${stats.totalPayoutAmount.toLocaleString()}`;
            
            const activeBelCountFormatted = stats.activeBelCount.toString();
            
            const orderCountFormatted = stats.totalOrderCount >= 100000 ? 
                `${(stats.totalOrderCount / 1000).toFixed(0)}k` : 
                stats.totalOrderCount.toLocaleString();
            
            // Define the three cards as requested
            const cardsData = [
                {
                    title: 'Net Payout Amount ($)',
                    value: payoutAmountFormatted,
                    icon: 'fas fa-dollar-sign',
                    trend: trends.payoutAmountTrend.value,
                    trendText: trends.payoutAmountTrend.text,
                    status: trends.payoutAmountTrend.status
                },
                {
                    title: 'Active BEL Count (#)',
                    value: activeBelCountFormatted,
                    icon: 'fas fa-users',
                    trend: trends.belCountTrend.value,
                    trendText: trends.belCountTrend.text,
                    status: trends.belCountTrend.status
                },
                {
                    title: 'Total Orders (#)',
                    value: orderCountFormatted,
                    icon: 'fas fa-shopping-cart',
                    trend: trends.orderCountTrend.value,
                    trendText: trends.orderCountTrend.text,
                    status: trends.orderCountTrend.status
                }
            ];
            
            // Render the cards
            statsContainer.innerHTML = cardsData.map(card => `
                <div class="bel-card">
                    <div style="width: 100%;display: flex; flex-direction: row; justify-content: space-between;">
                        <div>
                            <div class="bel-card-title">${card.title}</div>
                            <div class="bel-card-value">${card.value}</div>
                        </div>
                        <div class="bel-card-icon"><i class="${card.icon}"></i></div>
                    </div>
                    <div class="trend-indicator ${card.status}">
                        <i class="fas fa-caret-${card.status === 'positive' ? 'up' : 'down'}"></i> 
                        ${card.trend} 
                        <span class="trend-indicator-text">${card.trendText}</span>
                    </div>
                </div>
            `).join('');
        },

        injectContent() {
            const contentRoot = document.getElementById('content');
            if (!contentRoot) return;

            contentRoot.innerHTML = `
                <h1 class="bel-h1">Publish Resources</h1>
                <div class="bel-panel" id="content-mgmt-panel">
                    <div class="panel-header">
                        <h3 style="margin:0;">Content Management</h3>
                        <button class="bel-btn primary" id="asset-add-btn">
                            <i class="fas fa-plus"></i> Add Asset
                        </button>
                    </div>
                    <div class="scrollable-table-container">
                        <table class="bel-table" id="asset-table">
                            <thead>
                                <tr>
                                    <th data-sortable data-type="string">Upload Date</th>
                                    <th data-sortable data-type="string">Title</th>
                                    <th data-sortable data-type="string">Subtitle</th>
                                    <th data-sortable data-type="string">Category</th>
                                    <th data-sortable data-type="string">Page Link URL</th>
                                    <th>Edit</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            `;

            setTimeout(() => this.renderAssets(), 0);
        },

        injectContactSupport() {
            const contactSupportRoot = document.getElementById('contact-support');
            if (!contactSupportRoot) return;

            contactSupportRoot.innerHTML = `
                <h1 class="bel-h1">Respond to Leader</h1>
                
                <!-- Open Tickets Table -->
                <div class="bel-panel" id="open-tickets-panel">
                    <div class="panel-header">
                        <h3 style="margin:0;">Open Tickets</h3>
                        <button class="bel-btn secondary" id="view-history-tickets-btn">
                            <i class="fas fa-history"></i> View History Tickets
                        </button>
                    </div>
                    <div class="scrollable-table-container">
                        <table class="bel-table" id="open-tickets-table">
                            <thead>
                                <tr>
                                    <th data-sortable data-type="string">Ticket #</th>
                                    <th data-sortable data-type="string">BEL Name</th>
                                    <th data-sortable data-type="string">Referral ID</th>
                                    <th data-sortable data-type="string">Subject</th>
                                    <th data-sortable data-type="string">Status</th>
                                    <th>View Detail</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>

                <!-- System Announcements Panel -->
                <div class="bel-panel" id="announcements-panel" style="margin-top: 20px;">
                    <div class="panel-header">
                        <h3 style="margin:0;">System Announcements</h3>
                        <button class="bel-btn primary" id="send-announcement-btn-new">
                            <i class="fas fa-bullhorn"></i> Send Announcement
                        </button>
                    </div>
                    <div class="scrollable-table-container">
                        <table class="bel-table" id="announcements-table">
                            <thead>
                                <tr>
                                    <th data-sortable data-type="string">Created</th>
                                    <th data-sortable data-type="string">Level</th>
                                    <th data-sortable data-type="string">Title</th>
                                    <th data-sortable data-type="string">Body</th>
                                    <th data-sortable data-type="string">Link</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            `;

            setTimeout(() => {
                this.renderContactSupportTickets();
                this.renderAnnouncementsNew();
            }, 0);
        },

        async renderPayoutHistory(selectedYear = null, selectedRegion = 'all') {
            const tableBody = document.querySelector('#payout-history-table tbody');
            if (!tableBody) return;
            
            // Ensure payout data is loaded
            await this.loadPayoutData();
            
            // Initialize year selector if not already done
            this.initializePayoutYearSelector();
            
            // Get selected year from selector if not provided
            if (selectedYear === null) {
                const yearSelect = document.getElementById('payout-year-select');
                selectedYear = yearSelect ? yearSelect.value : null;
            }
            
            // Get selected region from header filter if not provided
            if (selectedRegion === 'all') {
                const headerRegionSelect = document.getElementById('header-region-filter');
                selectedRegion = headerRegionSelect ? headerRegionSelect.value : 'all';
            }
            
            // Calculate monthly statistics from payouts.json with region filtering
            const monthlyStats = this.calculateMonthlyPayoutStats(selectedYear, selectedRegion);
            
            // Apply pagination
            const totalPayouts = monthlyStats.length;
            const startIndex = (appState.payoutPage - 1) * appState.payoutRowsPerPage;
            const endIndex = Math.min(startIndex + appState.payoutRowsPerPage, totalPayouts);
            const paginatedPayouts = monthlyStats.slice(startIndex, endIndex);
            
            tableBody.innerHTML = paginatedPayouts.map(monthData => `
                <tr>
                    <td>${monthData.monthYear}</td>
                    <td>${utils.formatMoney(monthData.totalAmount, 2)}</td>
                    <td>${monthData.belCount}</td>
                    <td>
                        <a href="#" class="referral-id-link payout-view-btn" data-payout-month="${monthData.key}">
                            <i class="fas fa-eye"></i> View Detail
                        </a>
                    </td>
                </tr>
            `).join('');

            // Update pagination UI
            this.updatePayoutPaginationUI(totalPayouts, startIndex, endIndex);

            // Apply sorting to payout history table
            const payoutTable = document.getElementById('payout-history-table');
            if (payoutTable) {
                TableUtils.makeTableSortable(payoutTable);
            }
        },

        updatePayoutPaginationUI(totalPayouts, startIndex, endIndex) {
            const rangeLabel = document.getElementById('payout-range-label');
            const prevBtn = document.getElementById('payout-prev-page');
            const nextBtn = document.getElementById('payout-next-page');
            const rowsSelect = document.getElementById('payout-rows-per-page');

            if (rangeLabel) {
                const from = totalPayouts === 0 ? 0 : startIndex + 1;
                const to = endIndex;
                rangeLabel.textContent = `${from}–${to} of ${totalPayouts} payouts`;
            }

            if (prevBtn) {
                prevBtn.disabled = appState.payoutPage === 1;
            }

            if (nextBtn) {
                nextBtn.disabled = endIndex >= totalPayouts;
            }

            if (rowsSelect) {
                // Set the selected value based on current appState, default to 12 if not available
                const availableOptions = ['5', '12', '20'];
                const currentValue = appState.payoutRowsPerPage.toString();
                rowsSelect.value = availableOptions.includes(currentValue) ? currentValue : '12';
            }
        },

        calculateMonthlyPayoutStats(selectedYear = null, selectedRegion = 'all') {
            // Load payout data from payouts.json if not already loaded
            if (!window.PAYOUT_DATA) {
                this.loadPayoutData();
            }
            
            if (!window.PAYOUT_DATA || !window.PAYOUT_DATA.belPayoutHistory) {
                return [];
            }

            const monthlyMap = new Map();
            
            // Process all BEL payout records
            window.PAYOUT_DATA.belPayoutHistory.forEach(bel => {
                // Filter by selected region if specified
                if (selectedRegion && selectedRegion !== 'all' && bel.belRegion !== selectedRegion) {
                    return;
                }
                
                bel.payoutHistory.forEach(payout => {
                    // Filter by selected year if specified (skip if 'all' is selected)
                    if (selectedYear && selectedYear !== 'all' && payout.year !== parseInt(selectedYear)) {
                        return;
                    }
                    
                    const key = `${payout.year}-${String(payout.month).padStart(2, '0')}`;
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthYear = `${monthNames[payout.month - 1]} ${payout.year}`;
                    
                    if (!monthlyMap.has(key)) {
                        monthlyMap.set(key, {
                            key: key,
                            monthYear: monthYear,
                            year: payout.year,
                            month: payout.month,
                            totalAmount: 0,
                            belCount: 0,
                            payouts: []
                        });
                    }
                    
                    const monthData = monthlyMap.get(key);
                    monthData.totalAmount += payout.netPayout || 0;
                    monthData.belCount++;
                    monthData.payouts.push({
                        ...payout,
                        belId: bel.belId,
                        belName: bel.belName,
                        belRegion: bel.belRegion
                    });
                });
            });
            
            // Convert to array and sort by year/month descending
            return Array.from(monthlyMap.values())
                .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });
        },

        async loadPayoutData() {
            try {
                const response = await fetch('data/payouts.json');
                if (response.ok) {
                    const payoutData = await response.json();
                    window.PAYOUT_DATA = payoutData;
                    APP_DATA.payouts = payoutData; // Also set in APP_DATA
                } else {
                    console.error('Failed to load payouts.json');
                    const fallbackData = { belPayoutHistory: [] };
                    window.PAYOUT_DATA = fallbackData;
                    APP_DATA.payouts = fallbackData;
                }
            } catch (error) {
                console.error('Error loading payouts.json:', error);
                const fallbackData = { belPayoutHistory: [] };
                window.PAYOUT_DATA = fallbackData;
                APP_DATA.payouts = fallbackData;
            }
        },

        initializePayoutYearSelector() {
            const yearSelect = document.getElementById('payout-year-select');
            if (!yearSelect || yearSelect.children.length > 0) return; // Already initialized
            
            if (!window.PAYOUT_DATA || !window.PAYOUT_DATA.belPayoutHistory) return;
            
            // Get all unique years from payout data
            const years = new Set();
            window.PAYOUT_DATA.belPayoutHistory.forEach(bel => {
                bel.payoutHistory.forEach(payout => {
                    years.add(payout.year);
                });
            });
            
            // Sort years in descending order
            const sortedYears = Array.from(years).sort((a, b) => b - a);
            
            // Add "All Years" option first
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = 'All Years';
            yearSelect.appendChild(allOption);
            
            // Add year options
            sortedYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
            
            // Set default to current year if available, otherwise "All Years"
            const currentYear = new Date().getFullYear();
            if (sortedYears.includes(currentYear)) {
                yearSelect.value = currentYear;
            } else {
                yearSelect.value = '';
            }
            
            // Add event listener for year selection changes
            yearSelect.addEventListener('change', () => {
                this.renderPayoutHistory(yearSelect.value);
            });
        },

        renderOrdersInPayout(selectedYear = null, selectedRegion = 'all') {
            const tableBody = document.querySelector('#order-tracking-table-payout tbody');
            if (!tableBody) return;
            
            let orders = APP_DATA.orders.history;
            
            // Apply year and region filters
            if (selectedYear || (selectedRegion && selectedRegion !== 'all')) {
                orders = orders.filter(order => {
                    // Filter by year if specified (skip if 'all' is selected)
                    if (selectedYear && selectedYear !== 'all') {
                        const orderYear = new Date(order.orderDate).getFullYear();
                        if (orderYear !== parseInt(selectedYear)) {
                            return false;
                        }
                    }
                    
                    // Filter by region if specified
                    if (selectedRegion && selectedRegion !== 'all') {
                        // Get the BEL profile for this referral ID to find the region
                        const bel = window.APP_DATA?.belProfiles?.leaderboard?.find(profile => profile.id === order.referralId);
                        if (bel && bel.countryCode) {
                            // Convert country code to country name
                            const getCountryName = (countryCode) => {
                                const countryNames = {
                                    'TW': 'Taiwan', 'US': 'United States', 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan',
                                    'AU': 'Australia', 'KR': 'South Korea', 'IT': 'Italy', 'MX': 'Mexico', 'CN': 'China',
                                    'CA': 'Canada', 'IN': 'India', 'NO': 'Norway', 'NL': 'Netherlands', 'BR': 'Brazil',
                                    'SE': 'Sweden', 'CH': 'Switzerland', 'DK': 'Denmark', 'PL': 'Poland', 'BE': 'Belgium',
                                    'SG': 'Singapore', 'TH': 'Thailand', 'MY': 'Malaysia', 'ZA': 'South Africa'
                                };
                                return countryNames[countryCode] || 'Others';
                            };
                            
                            // Convert country name to region using utils function
                            const countryName = getCountryName(bel.countryCode);
                            const belRegion = utils.getRegionFromCountry(countryName);
                            
                            if (belRegion !== selectedRegion) {
                                return false;
                            }
                        } else {
                            // If no BEL found or no country code, exclude from filtered results
                            return false;
                        }
                    }
                    
                    return true;
                });
            }
            
            // Apply order-specific filters
            orders = this.applyOrderFilters(orders);
            
            const totalOrders = orders.length;
            const startIndex = (appState.orderPagePayout - 1) * appState.orderRowsPerPagePayout;
            const endIndex = Math.min(startIndex + appState.orderRowsPerPagePayout, totalOrders);
            const paginatedOrders = orders.slice(startIndex, endIndex);
            
            tableBody.innerHTML = paginatedOrders.map(order => {
                let statusClass = 'processing';
                if (order.status === 'Completed') statusClass = 'completed';
                else if (order.status === 'Canceled') statusClass = 'danger';
                else if (order.status === 'Processing') statusClass = 'processing';
                
                // Display original amount directly from orders.json
                const formattedAmount = utils.formatMoney(order.amount, 2);
                
                return `
                    <tr>
                        <td>${order.orderDate}</td>
                        <td>${order.orderNumber}</td>
                        <td>${order.referralId}</td>
                        <td>${order.belName}</td>
                        <td>${formattedAmount}</td>
                        <td>${order.currency || 'USD'}</td>
                        <td><span class="bel-badge ${statusClass}">${order.status}</span></td>
                    </tr>
                `;
            }).join('');

            // Update pagination UI
            this.updateOrdersPaginationUIForPayout(totalOrders, startIndex, endIndex);

            // Apply sorting to order tracking table
            const orderTable = document.getElementById('order-tracking-table-payout');
            if (orderTable) {
                TableUtils.makeTableSortable(orderTable);
            }
        },

        applyOrderFilters(orders) {
            const filters = appState.orderFilters;
            
            return orders.filter(order => {
                // Date range filter
                if (filters.dateFrom) {
                    const orderDate = new Date(order.orderDate);
                    const fromDate = new Date(filters.dateFrom);
                    if (orderDate < fromDate) return false;
                }
                
                if (filters.dateTo) {
                    const orderDate = new Date(order.orderDate);
                    const toDate = new Date(filters.dateTo);
                    // Set toDate to end of day for inclusive filtering
                    toDate.setHours(23, 59, 59, 999);
                    if (orderDate > toDate) return false;
                }
                
                // Search filter (Order Number, Referral ID or BEL Name)
                if (filters.search) {
                    const searchTerm = filters.search.toLowerCase();
                    const orderNumberMatch = order.orderNumber.toLowerCase().includes(searchTerm);
                    const referralIdMatch = order.referralId.toLowerCase().includes(searchTerm);
                    const belNameMatch = order.belName.toLowerCase().includes(searchTerm);
                    if (!orderNumberMatch && !referralIdMatch && !belNameMatch) return false;
                }
                
                // Amount range filter 
                if (filters.amountMin) {
                    const minAmount = parseFloat(filters.amountMin);
                    if (order.amount < minAmount) return false;
                }
                
                if (filters.amountMax) {
                    const maxAmount = parseFloat(filters.amountMax);
                    if (order.amount > maxAmount) return false;
                }
                
                // Status filter
                if (filters.status && filters.status !== '') {
                    if (order.status !== filters.status) return false;
                }
                
                return true;
            });
        },

        updateOrdersPaginationUIForPayout(totalOrders, startIndex, endIndex) {
            const rangeLabel = document.getElementById('order-range-label-payout');
            const prevBtn = document.getElementById('order-prev-page-payout');
            const nextBtn = document.getElementById('order-next-page-payout');
            const rowsSelect = document.getElementById('order-rows-per-page-payout');

            if (rangeLabel) {
                const from = totalOrders === 0 ? 0 : startIndex + 1;
                const to = endIndex;
                rangeLabel.textContent = `${from}–${to} of ${totalOrders} orders`;
            }

            if (prevBtn) {
                prevBtn.disabled = appState.orderPagePayout === 1;
            }

            if (nextBtn) {
                nextBtn.disabled = endIndex >= totalOrders;
            }

            if (rowsSelect) {
                // Set the selected value based on current appState, default to 10 if not available
                const availableOptions = ['5', '10', '20'];
                const currentValue = appState.orderRowsPerPagePayout.toString();
                rowsSelect.value = availableOptions.includes(currentValue) ? currentValue : '10';
            }
        },

        setupPayoutPagination() {
            const prevBtn = document.getElementById('payout-prev-page');
            const nextBtn = document.getElementById('payout-next-page');
            const rowsSelect = document.getElementById('payout-rows-per-page');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (appState.payoutPage > 1) {
                        appState.payoutPage--;
                        // Get current filter values
                        const selectedYear = document.getElementById('header-year-filter') ? 
                            document.getElementById('header-year-filter').value : null;
                        const selectedRegion = document.getElementById('header-region-filter') ? 
                            document.getElementById('header-region-filter').value : 'all';
                        this.renderPayoutHistory(selectedYear, selectedRegion);
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    appState.payoutPage++;
                    // Get current filter values
                    const selectedYear = document.getElementById('header-year-filter') ? 
                        document.getElementById('header-year-filter').value : null;
                    const selectedRegion = document.getElementById('header-region-filter') ? 
                        document.getElementById('header-region-filter').value : 'all';
                    this.renderPayoutHistory(selectedYear, selectedRegion);
                });
            }

            if (rowsSelect) {
                rowsSelect.addEventListener('change', (e) => {
                    appState.payoutRowsPerPage = parseInt(e.target.value, 10);
                    appState.payoutPage = 1; // Reset to first page
                    // Get current filter values
                    const selectedYear = document.getElementById('header-year-filter') ? 
                        document.getElementById('header-year-filter').value : null;
                    const selectedRegion = document.getElementById('header-region-filter') ? 
                        document.getElementById('header-region-filter').value : 'all';
                    this.renderPayoutHistory(selectedYear, selectedRegion);
                });
            }
        },

        setupOrdersPaginationForPayout() {
            const prevBtn = document.getElementById('order-prev-page-payout');
            const nextBtn = document.getElementById('order-next-page-payout');
            const rowsSelect = document.getElementById('order-rows-per-page-payout');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (appState.orderPagePayout > 1) {
                        appState.orderPagePayout--;
                        // Get current filter values
                        const selectedYear = document.getElementById('header-year-filter') ? 
                            document.getElementById('header-year-filter').value : null;
                        const selectedRegion = document.getElementById('header-region-filter') ? 
                            document.getElementById('header-region-filter').value : 'all';
                        this.renderOrdersInPayout(selectedYear, selectedRegion);
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    const totalOrders = APP_DATA.orders.history.length;
                    const maxPage = Math.ceil(totalOrders / appState.orderRowsPerPagePayout);
                    if (appState.orderPagePayout < maxPage) {
                        appState.orderPagePayout++;
                        // Get current filter values
                        const selectedYear = document.getElementById('header-year-filter') ? 
                            document.getElementById('header-year-filter').value : null;
                        const selectedRegion = document.getElementById('header-region-filter') ? 
                            document.getElementById('header-region-filter').value : 'all';
                        this.renderOrdersInPayout(selectedYear, selectedRegion);
                    }
                });
            }

            if (rowsSelect) {
                rowsSelect.addEventListener('change', (e) => {
                    appState.orderRowsPerPagePayout = parseInt(e.target.value, 10);
                    appState.orderPagePayout = 1; // Reset to first page
                    // Get current filter values
                    const selectedYear = document.getElementById('header-year-filter') ? 
                        document.getElementById('header-year-filter').value : null;
                    const selectedRegion = document.getElementById('header-region-filter') ? 
                        document.getElementById('header-region-filter').value : 'all';
                    this.renderOrdersInPayout(selectedYear, selectedRegion);
                });
            }
        },

        setupOrderFilters() {
            console.log('🔧 Setting up order filters...');
            
            const filterBtn = document.getElementById('order-filter-btn');
            const filterPanel = document.getElementById('order-filter-panel');
            const searchInput = document.getElementById('order-search');
            const suggestionsContainer = document.getElementById('order-search-suggestions');
            const dateRangeInput = document.getElementById('order-date-range');
            
            console.log('📍 Order filter elements found:', {
                filterBtn: !!filterBtn,
                filterPanel: !!filterPanel,
                searchInput: !!searchInput,
                suggestionsContainer: !!suggestionsContainer
            });

            // Toggle filter panel
            if (filterBtn) {
                filterBtn.addEventListener('click', () => {
                    const isVisible = filterPanel.style.display !== 'none';
                    filterPanel.style.display = isVisible ? 'none' : 'block';
                    filterBtn.innerHTML = isVisible 
                        ? '<i class="fas fa-filter"></i> Filter'
                        : '<i class="fas fa-filter"></i> Hide Filters';
                });
            }

            // Initialize date range picker (one input for start/end)
            let fpInstance = null;
            if (dateRangeInput && window.flatpickr) {
                try {
                    fpInstance = window.flatpickr(dateRangeInput, {
                        mode: 'range',
                        dateFormat: 'Y-m-d',
                        allowInput: true,
                        onChange: (selectedDates) => {
                            // When two dates selected, auto-apply
                            if (selectedDates.length === 2) {
                                applyFilters();
                            }
                        },
                        onClose: () => applyFilters()
                    });
                } catch (e) {
                    console.warn('flatpickr init failed, fallback to manual parsing.', e);
                }
            }

            // Clear button removed per request; users can erase inputs to clear filters

            // Auto-apply filters function
            const parseRangeValue = () => {
                // Returns { from, to } in 'YYYY-MM-DD' or empty strings
                let from = '', to = '';
                if (fpInstance && fpInstance.selectedDates && fpInstance.selectedDates.length) {
                    const dates = fpInstance.selectedDates;
                    if (dates[0]) from = dates[0].toISOString().slice(0,10);
                    if (dates[1]) to = dates[1].toISOString().slice(0,10);
                } else if (dateRangeInput && dateRangeInput.value) {
                    // Fallback: try to split by ' to ' or ' - '
                    const raw = dateRangeInput.value.trim();
                    let parts = raw.split(' to ');
                    if (parts.length < 2) parts = raw.split(' - ');
                    if (parts.length === 2) {
                        from = parts[0].trim();
                        to = parts[1].trim();
                    } else if (parts.length === 1) {
                        from = raw; // single date
                    }
                }
                return { from, to };
            };

            const parseAmount = () => {
                // Reads from #order-amount and returns {min,max} as numbers or ''
                const input = document.getElementById('order-amount');
                if (!input) return { min: '', max: '' };
                const raw = (input.value || '').trim();
                if (!raw) return { min: '', max: '' };

                // Formats supported: "a-b", ">=a", "<=b", ">a", "<b", single number
                const between = raw.match(/^\s*(\d+(?:\.\d+)?)\s*(?:-|~|–|—|to)\s*(\d+(?:\.\d+)?)\s*$/i);
                if (between) {
                    const a = parseFloat(between[1]);
                    const b = parseFloat(between[2]);
                    if (!isNaN(a) && !isNaN(b)) return { min: Math.min(a,b), max: Math.max(a,b) };
                }

                const gte = raw.match(/^\s*>?=\s*(\d+(?:\.\d+)?)\s*$/);
                if (gte) {
                    const a = parseFloat(gte[1]);
                    if (!isNaN(a)) return { min: a, max: '' };
                }

                const lte = raw.match(/^\s*<=\s*(\d+(?:\.\d+)?)\s*$/);
                if (lte) {
                    const b = parseFloat(lte[1]);
                    if (!isNaN(b)) return { min: '', max: b };
                }

                const gt = raw.match(/^\s*>\s*(\d+(?:\.\d+)?)\s*$/);
                if (gt) {
                    const a = parseFloat(gt[1]);
                    if (!isNaN(a)) return { min: a + Number.EPSILON, max: '' };
                }

                const lt = raw.match(/^\s*<\s*(\d+(?:\.\d+)?)\s*$/);
                if (lt) {
                    const b = parseFloat(lt[1]);
                    if (!isNaN(b)) return { min: '', max: b - Number.EPSILON };
                }

                // single number -> min only
                const single = parseFloat(raw);
                if (!isNaN(single)) return { min: single, max: '' };

                return { min: '', max: '' };
            };

            const applyFilters = () => {
                // Update filter state
                const range = parseRangeValue();
                appState.orderFilters.dateFrom = range.from;
                appState.orderFilters.dateTo = range.to;
                appState.orderFilters.search = document.getElementById('order-search').value;
                const amt = parseAmount();
                appState.orderFilters.amountMin = amt.min === '' ? '' : String(amt.min);
                appState.orderFilters.amountMax = amt.max === '' ? '' : String(amt.max);
                appState.orderFilters.status = document.getElementById('order-status-filter').value;

                // Reset to first page and re-render
                appState.orderPagePayout = 1;
                
                // Get current year and region filters
                const selectedYear = document.getElementById('header-year-filter') ? 
                    document.getElementById('header-year-filter').value : null;
                const selectedRegion = document.getElementById('header-region-filter') ? 
                    document.getElementById('header-region-filter').value : 'all';
                
                this.renderOrdersInPayout(selectedYear, selectedRegion);
            };

            // Add auto-apply event listeners to all filter inputs
            const filterInputs = [
                'order-date-range', 
                'order-search',
                'order-amount',
                'order-status-filter'
            ];

            filterInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input) {
                    if (input.id === 'order-date-range') {
                        // flatpickr handles change; also listen to manual input
                        input.addEventListener('change', applyFilters);
                        input.addEventListener('blur', utils.debounce(() => applyFilters(), 300));
                    } else if (input.type === 'text' || input.type === 'number') {
                        // Use debounced input for text and number inputs to avoid too many calls
                        input.addEventListener('input', utils.debounce(() => applyFilters(), 500));
                    } else {
                        // For date and select inputs, apply immediately
                        input.addEventListener('change', applyFilters);
                    }
                }
            });

            // Setup search suggestions for the search input
            this.setupOrderSearchSuggestions();
        },

        // Highlight helper for Order suggestions (ContentManager scope)
        highlightMatch(text, query) {
            if (!query) return text;
            const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${safe})`, 'gi');
            return String(text).replace(regex, '<mark style="background-color: var(--ds-color-primary-light-30); font-weight: var(--fw-semibold);">$1</mark>');
        },

        // Order search suggestions (ContentManager scope)
        setupOrderSearchSuggestions() {
            const searchInput = document.getElementById('order-search');
            const suggestionsContainer = document.getElementById('order-search-suggestions');

            if (!searchInput || !suggestionsContainer) return;

            let selectedIndex = -1;
            let suggestions = [];

            // Input event for showing suggestions
            searchInput.addEventListener('input', utils.debounce((e) => {
                const query = e.target.value.trim().toLowerCase();
                selectedIndex = -1;

                if (query.length === 0) {
                    this.hideOrderSuggestions(suggestionsContainer);
                    return;
                }

                // Validate data
                const data = (window.APP_DATA || APP_DATA);
                if (!data?.orders?.history) {
                    this.hideOrderSuggestions(suggestionsContainer);
                    return;
                }

                suggestions = [];

                // Build suggestions: orderNumber, referralId, belName
                data.orders.history.forEach(order => {
                    const orderNumber = (order.orderNumber || '').toLowerCase();
                    const referralId = (order.referralId || '').toLowerCase();
                    const belName = (order.belName || '').toLowerCase();

                    if (orderNumber.includes(query)) {
                        suggestions.push({
                            orderNumber: order.orderNumber,
                            referralId: order.referralId,
                            belName: order.belName,
                            displayText: order.orderNumber,
                            subText: `${order.belName} ・ ${order.referralId}`,
                            searchField: 'orderNumber',
                            matchValue: order.orderNumber
                        });
                    } else if (referralId.includes(query)) {
                        suggestions.push({
                            orderNumber: order.orderNumber,
                            referralId: order.referralId,
                            belName: order.belName,
                            displayText: `${order.referralId}`,
                            subText: `${order.belName} ・ Order:${order.orderNumber}`,
                            searchField: 'referralId',
                            matchValue: order.referralId
                        });
                    } else if (belName.includes(query)) {
                        suggestions.push({
                            orderNumber: order.orderNumber,
                            referralId: order.referralId,
                            belName: order.belName,
                            displayText: `${order.belName} `,
                            subText: `${order.referralId} ・ Order:${order.orderNumber}`,
                            searchField: 'belName',
                            matchValue: order.belName
                        });
                    }
                });

                // De-duplicate and limit
                const uniqueSuggestions = [];
                const seen = new Set();
                for (const s of suggestions) {
                    const key = `${s.searchField}-${s.matchValue}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueSuggestions.push(s);
                        if (uniqueSuggestions.length >= 8) break;
                    }
                }

                if (uniqueSuggestions.length > 0) {
                    this.showOrderSuggestions(uniqueSuggestions, query, suggestionsContainer, searchInput);
                } else {
                    this.hideOrderSuggestions(suggestionsContainer);
                }
            }, 150));

            // Keyboard navigation
            searchInput.addEventListener('keydown', (e) => {
                const items = suggestionsContainer.querySelectorAll('.search-suggestion-item');
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                        this.highlightOrderSuggestion(items, selectedIndex);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        selectedIndex = Math.max(selectedIndex - 1, -1);
                        this.highlightOrderSuggestion(items, selectedIndex);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (selectedIndex >= 0 && items[selectedIndex]) {
                            this.selectOrderSuggestion(suggestions[selectedIndex], searchInput);
                        }
                        break;
                    case 'Escape':
                        this.hideOrderSuggestions(suggestionsContainer);
                        searchInput.blur();
                        break;
                }
            });

            // Click outside to hide
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    this.hideOrderSuggestions(suggestionsContainer);
                }
            });

            // Focus to re-show suggestions
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim().length > 0) {
                    searchInput.dispatchEvent(new Event('input'));
                }
            });
        },

        showOrderSuggestions(suggestions, query, suggestionsContainer, searchInput) {
            if (!suggestionsContainer) return;
            const html = suggestions.map((s, index) => {
                const highlighted = this.highlightMatch(s.displayText, query);
                const sub = s.subText ?? '';
                return `
                    <div class="search-suggestion-item" data-index="${index}">
                        <div class="suggestion-name">${highlighted}</div>
                        <div class="suggestion-id">${sub}</div>
                    </div>
                `;
            }).join('');

            suggestionsContainer.innerHTML = html;
            suggestionsContainer.classList.add('show');

            suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    this.selectOrderSuggestion(suggestions[index], searchInput);
                });
            });
        },

        hideOrderSuggestions(suggestionsContainer) {
            if (suggestionsContainer) {
                suggestionsContainer.classList.remove('show');
                suggestionsContainer.innerHTML = '';
            }
        },

        highlightOrderSuggestion(items, index) {
            items.forEach((item, i) => item.classList.toggle('highlighted', i === index));
        },

        selectOrderSuggestion(suggestion, searchInput) {
            if (!searchInput || !suggestion) return;
            searchInput.value = suggestion.displayText || '';
            const suggestionsContainer = document.getElementById('order-search-suggestions');
            this.hideOrderSuggestions(suggestionsContainer);

            // Auto-apply filters after selection
            appState.orderFilters.search = searchInput.value;
            appState.orderPagePayout = 1;

            const selectedYear = document.getElementById('header-year-filter')?.value ?? null;
            const selectedRegion = document.getElementById('header-region-filter')?.value ?? 'all';
            if (typeof this.renderOrdersInPayout === 'function') {
                this.renderOrdersInPayout(selectedYear, selectedRegion);
            }
        },

        renderAssets() {
            const tableBody = document.querySelector('#asset-table tbody');
            if (!tableBody) return;
            
            const assets = APP_DATA.content.assets;
            tableBody.innerHTML = assets.map((asset, index) => {
                const categoryClass = asset.category === 'IoTMart Campaign' ? 'iotmart' : 'advantech';
                return `
                <tr data-asset-id="asset-${index}">
                    <td>${asset.uploadDate}</td>
                    <td>${asset.title}</td>
                    <td class="subtitle-cell">${asset.subtitle}</td>
                    <td><span class="bel-badge ${categoryClass}">${asset.category || 'Uncategorized'}</span></td>
                    <td class="pagelink-cell"><a href="${asset.pageLink}" target="_blank" class="referral-id-link">${asset.pageLink}</a></td>
                    <td><button class="bel-btn-s secondary asset-edit-btn" data-asset-id="asset-${index}"><i class="fas fa-edit"></i> Edit</button></td>
                    <td><button class="bel-btn-s danger asset-delete-btn" data-asset-id="asset-${index}"><i class="fas fa-trash"></i> Delete</button></td>
                </tr>
                `;
            }).join('');

            // Apply sorting to assets table
            const assetTable = document.getElementById('asset-table');
            if (assetTable) {
                TableUtils.makeTableSortable(assetTable);
            }
        },

        renderContactSupportTickets() {
            const openTableBody = document.querySelector('#open-tickets-table tbody');
            if (!openTableBody) return;
            
            const tickets = APP_DATA.contactSupport.tickets;
            
            // Separate tickets into open and history
            const openTickets = tickets.filter(ticket => ticket.status === 'Open');
            
            // Render open tickets (no pagination)
            openTableBody.innerHTML = openTickets.map(ticket => `
                <tr>
                    <td>${ticket.ticketNumber}</td>
                    <td>${ticket.belName}</td>
                    <td><a href="#" class="referral-id-link" data-referral-id="${ticket.referralId}">${ticket.referralId}</a></td>
                    <td>${ticket.subject}</td>
                    <td><span class="bel-badge pending">${ticket.status}</span></td>
                    <td>
                        <button class="bel-btn-s secondary support-view-btn" data-ticket-id="${ticket.ticketNumber}">
                            <i class="fas fa-eye"></i> View Detail
                        </button>
                    </td>
                </tr>
            `).join('');

            // Apply sorting to open tickets table
            const openTicketsTable = document.getElementById('open-tickets-table');
            if (openTicketsTable) {
                TableUtils.makeTableSortable(openTicketsTable);
            }
        },

        ensureHistoryTicketsModal() {
            if (this.historyTicketsModalEl) return this.historyTicketsModalEl;
            
            const wrap = document.createElement('div');
            wrap.className = 'modal-overlay';
            wrap.id = 'history-tickets-modal';
            wrap.innerHTML = `
                <div class="modal-content" style="max-width:1200px;">
                    <div class="modal-header">
                        <h3 style="margin:0;">History Tickets</h3>
                        <button class="close-button" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body-grid" style="grid-template-columns: 1fr;">
                        <div>
                            <div class="scrollable-table-container">
                                <table class="bel-table" id="history-tickets-modal-table">
                                    <thead>
                                        <tr>
                                            <th data-sortable data-type="string">Ticket #</th>
                                            <th data-sortable data-type="string">BEL Name</th>
                                            <th data-sortable data-type="string">Referral ID</th>
                                            <th data-sortable data-type="string">Subject</th>
                                            <th data-sortable data-type="string">Status</th>
                                            <th>View Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                            <!-- Pagination for History Tickets Modal -->
                            <div class="pagination-bar" style="margin-top: 16px;">
                                <div class="rows-select">
                                    <label for="history-modal-rows-per-page">Rows per page</label>
                                    <select id="history-modal-rows-per-page" class="bel-form-control bel-form-select">
                                        <option>5</option>
                                        <option selected>10</option>
                                        <option>20</option>
                                    </select>
                                </div>
                                <div class="pagination-controls">
                                    <span id="history-modal-range-label" class="text-muted">0–0 of 0</span>
                                    <button class="bel-btn secondary" id="history-modal-prev-page" aria-label="Previous page">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <button class="bel-btn secondary" id="history-modal-next-page" aria-label="Next page">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            this.historyTicketsModalEl = wrap;

            const close = () => this.historyTicketsModalEl.classList.remove('show');
            this.historyTicketsModalEl.querySelector('.close-button')?.addEventListener('click', close);
            this.historyTicketsModalEl.addEventListener('click', (e) => { 
                if (e.target === this.historyTicketsModalEl) close(); 
            });

            // Setup pagination for the modal
            this.setupHistoryTicketsModalPagination();

            return this.historyTicketsModalEl;
        },

        setupHistoryTicketsModalPagination() {
            // Setup event listeners for history tickets modal pagination
            const historyRowsPerPageSelect = document.getElementById('history-modal-rows-per-page');
            const historyPrevBtn = document.getElementById('history-modal-prev-page');
            const historyNextBtn = document.getElementById('history-modal-next-page');
            
            if (historyRowsPerPageSelect) {
                historyRowsPerPageSelect.addEventListener('change', () => {
                    appState.historyTicketsRowsPerPage = parseInt(historyRowsPerPageSelect.value, 10) || 10;
                    appState.historyTicketsPage = 1;
                    this.renderHistoryTicketsModal();
                });
            }
            
            if (historyPrevBtn) {
                historyPrevBtn.addEventListener('click', () => {
                    if (appState.historyTicketsPage > 1) {
                        appState.historyTicketsPage--;
                        this.renderHistoryTicketsModal();
                    }
                });
            }
            
            if (historyNextBtn) {
                historyNextBtn.addEventListener('click', () => {
                    const tickets = APP_DATA.contactSupport.tickets;
                    const allHistoryTickets = tickets.filter(ticket => ticket.status === 'Closed');
                    const total = allHistoryTickets.length;
                    if (appState.historyTicketsPage * appState.historyTicketsRowsPerPage < total) {
                        appState.historyTicketsPage++;
                        this.renderHistoryTicketsModal();
                    }
                });
            }
        },

        renderHistoryTicketsModal() {
            const modalTableBody = document.querySelector('#history-tickets-modal-table tbody');
            if (!modalTableBody) return;
            
            const tickets = APP_DATA.contactSupport.tickets;
            const allHistoryTickets = tickets.filter(ticket => ticket.status === 'Closed');
            
            // Implement pagination for history tickets modal
            const historyTotal = allHistoryTickets.length;
            const historyStartIndex = (appState.historyTicketsPage - 1) * appState.historyTicketsRowsPerPage;
            const historyPageItems = allHistoryTickets.slice(historyStartIndex, historyStartIndex + appState.historyTicketsRowsPerPage);
            
            // Render history tickets with pagination
            modalTableBody.innerHTML = historyPageItems.map(ticket => `
                <tr>
                    <td>${ticket.ticketNumber}</td>
                    <td>${ticket.belName}</td>
                    <td><a href="#" class="referral-id-link" data-referral-id="${ticket.referralId}">${ticket.referralId}</a></td>
                    <td>${ticket.subject}</td>
                    <td><span class="bel-badge completed">${ticket.status}</span></td>
                    <td>
                        <button class="bel-btn-s secondary support-view-btn" data-ticket-id="${ticket.ticketNumber}">
                            <i class="fas fa-eye"></i> View Detail
                        </button>
                    </td>
                </tr>
            `).join('');

            // Update pagination UI for history tickets modal
            this.updateHistoryTicketsModalPaginationUI(historyTotal, historyStartIndex, historyPageItems);

            // Apply sorting to modal table
            const historyTicketsModalTable = document.getElementById('history-tickets-modal-table');
            if (historyTicketsModalTable) {
                TableUtils.makeTableSortable(historyTicketsModalTable);
            }
        },

        updateHistoryTicketsModalPaginationUI(total, startIndex, pageItems) {
            const historyRangeLabel = document.getElementById('history-modal-range-label');
            const historyPrevBtn = document.getElementById('history-modal-prev-page');
            const historyNextBtn = document.getElementById('history-modal-next-page');
            
            if (historyRangeLabel) {
                const from = total === 0 ? 0 : startIndex + 1;
                const to = Math.min(startIndex + appState.historyTicketsRowsPerPage, total);
                historyRangeLabel.textContent = `${from}–${to} of ${total}`;
            }
            
            if (historyPrevBtn) {
                historyPrevBtn.disabled = appState.historyTicketsPage === 1;
            }
            
            if (historyNextBtn) {
                const to = Math.min(startIndex + appState.historyTicketsRowsPerPage, total);
                historyNextBtn.disabled = to >= total;
            }
        },

        openHistoryTicketsModal() {
            const modal = this.ensureHistoryTicketsModal();
            this.renderHistoryTicketsModal();
            modal.style.zIndex = this.getNextModalZIndex();
            modal.classList.add('show');
        },

        getCategoryBadgeClass(category) {
            switch(category) {
                case 'All':
                    return 'admin';
                case 'Builder':
                    return 'builder';
                case 'Enabler':
                    return 'enabler';
                case 'Exploder':
                    return 'exploder';
                case 'Leader':
                    return 'leader';
                default:
                    return 'secondary-color';
            }
        },

        getNotificationTagClass(category) {
            switch(category) {
                case 'All':
                    return 'admin';
                case 'Builder':
                    return 'builder';
                case 'Enabler':
                    return 'enabler';
                case 'Exploder':
                    return 'exploder';
                case 'Leader':
                    return 'leader';
                default:
                    return '';
            }
        },

        renderAnnouncementsNew() {
            const tableBody = document.querySelector('#announcements-table tbody');
            if (!tableBody) return;
            
            const announcements = APP_DATA.announcements.announcements;
            tableBody.innerHTML = announcements.map(ann => `
                <tr>
                    <td>${ann.created}</td>
                    <td><span class="bel-badge ${this.getCategoryBadgeClass(ann.category)}">${ann.category}</span></td>
                    <td>${ann.title}</td>
                    <td>${ann.body}</td>
                    <td><a href="${ann.link}" target="_blank" class="referral-id-link">${ann.link}</a></td>
                </tr>
            `).join('');

            // Apply sorting to announcements table
            const announcementsTable = document.getElementById('announcements-table');
            if (announcementsTable) {
                TableUtils.makeTableSortable(announcementsTable);
            }
        },

        ensurePayoutModal() {
            if (this.payoutModalEl) return this.payoutModalEl;
            
            const wrap = document.createElement('div');
            wrap.className = 'modal-overlay';
            wrap.id = 'payout-detail-modal';
            wrap.innerHTML = `
                <div class="modal-content" style="max-width:1100px;">
                    <div class="modal-header">
                        <h3 style="margin:0;">Payout Detail</h3>
                        <button class="close-button" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body-grid" style="grid-template-columns: 1fr;">
                        <div>
                            <div style="margin-bottom:12px;">
                                <span id="payout-modal-date" class="bel-badge approved">Date: —</span>
                                <span id="payout-modal-total" class="bel-badge processing" style="margin-left:8px;">Total: —</span>
                                <span id="payout-modal-count" class="bel-badge completed" style="margin-left:8px;">BEL: —</span>
                            </div>
                            <div class="scrollable-table-container">
                                <table class="bel-table" id="payout-detail-table">
                                    <thead>
                                        <tr>
                                            <th data-sortable data-type="string">Payout ID</th>
                                            <th data-sortable data-type="string">Referral ID</th>
                                            <th data-sortable data-type="string">Name</th>
                                            <th data-sortable data-type="number">Gross</th>
                                            <th data-sortable data-type="number">Fees</th>
                                            <th data-sortable data-type="number">Tax</th>
                                            <th data-sortable data-type="number">Net</th>
                                            <th data-sortable data-type="string">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                            <div class="modal-actions" style="margin-top:16px; display:flex; justify-content:flex-end;">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            this.payoutModalEl = wrap;

            const closeBtn = this.payoutModalEl.querySelector('.close-button');
            const closeBtn2 = this.payoutModalEl.querySelector('.payout-close-btn');
            const close = () => this.payoutModalEl.classList.remove('show');
            closeBtn?.addEventListener('click', close);
            closeBtn2?.addEventListener('click', close);
            this.payoutModalEl.addEventListener('click', (e) => { 
                if (e.target === this.payoutModalEl) close(); 
            });

            return this.payoutModalEl;
        },

        async openBelPayoutModal(payoutMonth) {
            // Load payout data if not already loaded
            await this.loadPayoutData();
            
            // Get current filter values
            const selectedYear = document.getElementById('header-year-filter') ? 
                document.getElementById('header-year-filter').value : null;
            const selectedRegion = document.getElementById('header-region-filter') ? 
                document.getElementById('header-region-filter').value : 'all';
            
            const monthlyStats = this.calculateMonthlyPayoutStats(selectedYear, selectedRegion);
            const monthData = monthlyStats.find(m => m.key === payoutMonth);
            
            if (!monthData) {
                console.error('Month data not found for:', payoutMonth);
                return;
            }

            const modal = this.ensureBelPayoutModal();
            
            // Update modal header
            modal.querySelector('#bel-payout-modal-date').textContent = `Payout Month: ${monthData.monthYear}`;
            modal.querySelector('#bel-payout-modal-total').textContent = `Total Amount: ${utils.formatMoney(monthData.totalAmount, 2)}`;
            modal.querySelector('#bel-payout-modal-count').textContent = `BEL Count: ${monthData.belCount}`;

            // Fill the table with BEL payout records
            const tbody = modal.querySelector('#bel-payout-detail-table tbody');
            tbody.innerHTML = monthData.payouts.map(payout => `
                <tr data-payout-id="${payout.payoutId}">
                    <td>${payout.payoutId}</td>
                    <td>${payout.belId}</td>
                    <td>${payout.belName}</td>
                    <td>${payout.belRegion}</td>
                    <td>${payout.date}</td>
                    <td>${utils.formatMoney(payout.grossPayout, 2)}</td>
                    <td>${utils.formatMoney(payout.wht, 2)}</td>
                    <td><strong>${utils.formatMoney(payout.netPayout, 2)}</strong></td>
                    <td>
                        <span class="bel-badge ${payout.status === 'Completed' ? 'completed' : 'danger'}">${payout.status}</span>
                    </td>
                </tr>
            `).join('');

            // Make table sortable
            const table = modal.querySelector('#bel-payout-detail-table');
            if (table) {
                TableUtils.makeTableSortable(table);
            }

            modal.style.zIndex = this.getNextModalZIndex();
            modal.classList.add('show');
        },

        ensureBelPayoutModal() {
            if (this.belPayoutModalEl) return this.belPayoutModalEl;
            
            const wrap = document.createElement('div');
            wrap.className = 'modal-overlay';
            wrap.id = 'bel-payout-modal';
            wrap.innerHTML = `
                <div class="modal-content" style="max-width: 1200px;">
                    <div class="modal-header">
                        <div style="flex: 1;">
                            <h3 style="margin:0;">BEL Payout Details</h3>
                            <div style="display: flex; gap: 20px; margin-top: 8px; font-size: 0.9rem; color: #666;">
                                <span id="bel-payout-modal-date"></span>
                                <span id="bel-payout-modal-total"></span>
                                <span id="bel-payout-modal-count"></span>
                            </div>
                        </div>
                        <button class="close-button" aria-label="Close">&times;</button>
                    </div>
                    
                    <div class="modal-body" style="padding: 20px;">
                        <div class="scrollable-table-container" style="max-height: 500px;">
                            <table class="bel-table" id="bel-payout-detail-table">
                                <thead>
                                    <tr>
                                        <th data-sortable data-type="string">Payout ID</th>
                                        <th data-sortable data-type="string">BEL ID</th>
                                        <th data-sortable data-type="string">BEL Name</th>
                                        <th data-sortable data-type="string">Region</th>
                                        <th data-sortable data-type="string">Date</th>
                                        <th data-sortable data-type="number">Gross Payout</th>
                                        <th data-sortable data-type="number">WHT</th>
                                        <th data-sortable data-type="number">Net Payout</th>
                                        <th data-sortable data-type="string">Status</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            this.belPayoutModalEl = wrap;

            const close = () => this.belPayoutModalEl.classList.remove('show');
            this.belPayoutModalEl.querySelector('.close-button')?.addEventListener('click', close);
            this.belPayoutModalEl.addEventListener('click', (e) => { 
                if (e.target === this.belPayoutModalEl) close(); 
            });

            return this.belPayoutModalEl;
        },

        openPayoutModal(payoutDate) {
            const payout = APP_DATA.payouts.history.find(p => p.date === payoutDate);
            if (!payout) return;

            const modal = this.ensurePayoutModal();
            modal.querySelector('#payout-modal-date').textContent = `Date: ${payout.date}`;
            modal.querySelector('#payout-modal-total').textContent = `Total: ${utils.formatMoney(payout.total, 2)}`;
            modal.querySelector('#payout-modal-count').textContent = `BEL: ${payout.belCount}`;

            const tbody = modal.querySelector('#payout-detail-table tbody');
            tbody.innerHTML = payout.details.map(d => `
                <tr data-payout-id="${d.payoutId}">
                    <td>${d.payoutId}</td>
                    <td><a href="#" class="referral-id-link" data-referral-id="${d.referralId}">${d.referralId}</a></td>
                    <td>${d.belName}</td>
                    <td>${utils.formatMoney(d.gross, 2)}</td>
                    <td>${utils.formatMoney(d.fees, 2)}</td>
                    <td>${utils.formatMoney(d.tax, 2)}</td>
                    <td><strong>${utils.formatMoney(d.net, 2)}</strong></td>
                    <td>
                        <span class="bel-badge ${d.status === 'Success' ? 'completed' : 'danger'}">${d.status}</span>
                    </td>
                </tr>
            `).join('');

            const table = modal.querySelector('#payout-detail-table');
            if (table) {
                TableUtils.makeTableSortable(table);
            }

            modal.style.zIndex = this.getNextModalZIndex();
            modal.classList.add('show');
        },

        ensureSupportModal() {
            if (this.supportModalEl) return this.supportModalEl;
            
            const wrap = document.createElement('div');
            wrap.className = 'modal-overlay';
            wrap.id = 'support-ticket-modal';
            wrap.innerHTML = `
                <div class="modal-content" style="max-width:700px;">
                    <div class="modal-header" style="border-bottom: none; padding-bottom: 8px;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <h3 id="sup-modal-title" style="margin:0; font-size: 1.4rem; font-weight: 600;">Support Ticket</h3>
                                <span id="sup-modal-status"></span>
                            </div>
                            <div id="sup-modal-ticket-num" style="color: var(--ds-color-gray-70); font-size: 0.9rem; margin-top: 4px;">Ticket #</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button class="close-button" aria-label="Close">&times;</button>
                        </div>
                    </div>
                    
                    <hr style="margin-bottom: 16px; border: none; border-top: 1px solid #e5e7eb; opacity: 0.6;">
                    
                    <div class="modal-body-grid" style="grid-template-columns: 1fr; padding: 0 0px 0px;">
                        <div>
                            <!-- Question Message Box -->
                            <div class="support-question-box">
                                <div class="support-bel-profile">
                                    <div id="sup-bel-avatar" class="support-bel-avatar"></div>
                                    <div class="support-profile-info">
                                        <div class="support-profile-header">
                                            <strong id="sup-bel-name" class="support-bel-name"></strong>
                                            <span id="sup-referral-id" class="support-referral-id"></span>
                                        </div>
                                        <div id="sup-message" class="support-message"></div>
                                        <div id="sup-message-time" class="support-reply-meta" style="margin-top: 8px;"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Replies Section (only for Closed tickets) -->
                            <div id="conversation-title" class="support-conversation-section" style="display: none;">
                                <div id="sup-replies" class="support-replies-container"></div>
                            </div>

                            <!-- Reply Section (only for Open tickets) -->
                            <div id="sup-reply-section" class="support-reply-section">
                                <div class="support-reply-form-header">
                                    <i class="fas fa-reply" style="color: var(--ds-color-gray-70);"></i>
                                    <span class="support-reply-form-title">Your Reply</span>
                                </div>
                                <textarea id="sup-reply-input" placeholder="Type your reply..." class="bel-form-control bel-form-textarea"></textarea>
                                
                                <!-- Attachment Section -->
                                <div class="support-attachment-section" style="margin-top: 12px;">
                                    <div class="attachment-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                        <i class="fas fa-paperclip" style="color: var(--ds-color-gray-70); font-size: 0.9rem;"></i>
                                        <span style="font-size: 0.9rem; color: var(--ds-color-gray-70); font-weight: 500;">Attachments (Optional)</span>
                                    </div>
                                    
                                    <!-- File Upload Area -->
                                    <div class="attachment-upload-area" style="border: 2px dashed var(--ds-color-gray-50); border-radius: 4px; padding: 16px; text-align: center; background-color: var(--ds-color-gray-30); cursor: pointer; transition: all 0.3s ease;" onclick="document.getElementById('sup-attachment-input').click();">
                                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                            <i class="fas fa-cloud-upload-alt" style="font-size: 20px; color: var(--ds-color-gray-60);"></i>
                                            <span style="font-size: 0.85rem; color: var(--ds-color-gray-70);">Click to attach files or drag and drop</span>
                                            <span style="font-size: 0.75rem; color: var(--ds-color-gray-60);">Max 5 files, 10MB each</span>
                                        </div>
                                        <input type="file" id="sup-attachment-input" multiple accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls" style="display: none;" />
                                    </div>
                                    
                                    <!-- Attached Files List -->
                                    <div id="sup-attached-files" class="attached-files-list" style="margin-top: 8px;"></div>
                                </div>
                                
                                <div class="support-reply-actions" style="margin-top: 16px;">
                                    <button class="bel-btn primary" id="sup-send-btn" style="flex: 1;"><i class="fas fa-reply"></i> Send Reply</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            this.supportModalEl = wrap;

            const close = () => this.supportModalEl.classList.remove('show');
            this.supportModalEl.querySelector('.close-button')?.addEventListener('click', close);
            this.supportModalEl.addEventListener('click', (e) => { 
                if (e.target === this.supportModalEl) close(); 
            });

            // Setup attachment functionality
            this.setupSupportAttachments();

            // send reply functionality
            this.supportModalEl.querySelector('#sup-send-btn')?.addEventListener('click', () => {
                const ticketId = this.supportModalEl.dataset.ticketId;
                const ticket = APP_DATA.contactSupport.tickets.find(t => t.ticketNumber === ticketId);
                if (!ticket) return;
                
                const textarea = this.supportModalEl.querySelector('#sup-reply-input');
                const txt = (textarea.value || '').trim();
                if (!txt) { 
                    alert('Reply cannot be empty.'); 
                    return; 
                }
                
                // Get attached files
                const attachedFiles = this.getSupportAttachedFiles();
                
                ticket.replies = ticket.replies || [];
                ticket.replies.push({ 
                    time: new Date().toISOString().slice(0, 16).replace('T', ' '), 
                    text: txt,
                    attachments: attachedFiles
                });
                
                // 回覆後直接關閉ticket
                ticket.status = 'Closed';
                textarea.value = '';
                this.clearSupportAttachments();
                this.fillSupportModal(ticket);
                this.renderContactSupportTickets();
            });

            return this.supportModalEl;
        },

        setupSupportAttachments() {
            const fileInput = this.supportModalEl.querySelector('#sup-attachment-input');
            const uploadArea = this.supportModalEl.querySelector('.attachment-upload-area');
            
            if (!fileInput || !uploadArea) return;

            // File input change event
            fileInput.addEventListener('change', (e) => {
                this.handleSupportAttachmentFiles(Array.from(e.target.files));
            });

            // Drag and drop functionality
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--ds-color-gray-60)';
                uploadArea.style.backgroundColor = 'var(--ds-color-gray-30)';
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--ds-color-gray-50)';
                uploadArea.style.backgroundColor = 'var(--ds-color-gray-30)';
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--ds-color-gray-50)';
                uploadArea.style.backgroundColor = 'var(--ds-color-gray-30)';
                
                const files = Array.from(e.dataTransfer.files);
                this.handleSupportAttachmentFiles(files);
            });
        },

        handleSupportAttachmentFiles(files) {
            const attachedFilesList = this.supportModalEl.querySelector('#sup-attached-files');
            if (!attachedFilesList) return;

            // Validate files
            const validFiles = files.filter(file => {
                // Max file size: 10MB
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
                    return false;
                }
                return true;
            });

            // Check total file count (max 5)
            const currentFiles = attachedFilesList.querySelectorAll('.attached-file-item');
            if (currentFiles.length + validFiles.length > 5) {
                alert('Maximum 5 files can be attached.');
                return;
            }

            // Add files to the list
            validFiles.forEach(file => {
                this.addSupportAttachmentItem(file);
            });
        },

        addSupportAttachmentItem(file) {
            const attachedFilesList = this.supportModalEl.querySelector('#sup-attached-files');
            if (!attachedFilesList) return;

            const fileItem = document.createElement('div');
            fileItem.className = 'attached-file-item';
            fileItem.style.cssText = `
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
                padding: 8px 12px; 
                background: var(--ds-color-gray-30); 
                border: 1px solid var(--ds-color-gray-40); 
                border-radius: 4px; 
                margin-bottom: 6px;
            `;

            const fileIcon = this.getFileIcon(file.type);
            const fileSize = this.formatFileSize(file.size);

            fileItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                    <i class="${fileIcon}" style="color: var(--ds-color-gray-70); font-size: 0.9rem;"></i>
                    <div style="min-width: 0; flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 500; color: var(--ds-color-gray-80); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${file.name}">${file.name}</div>
                        <div style="font-size: 0.75rem; color: var(--ds-color-gray-70);">${fileSize}</div>
                    </div>
                </div>
                <button class="remove-attachment-btn" style="background: none; border: none; color: var(--ds-color-error); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center;" title="Remove file">
                    <i class="fas fa-times" style="font-size: 0.8rem;"></i>
                </button>
            `;

            // Store file data
            fileItem.dataset.fileName = file.name;
            fileItem.dataset.fileSize = file.size;
            fileItem.dataset.fileType = file.type;
            
            // Convert file to base64 for storage
            const reader = new FileReader();
            reader.onload = (e) => {
                fileItem.dataset.fileData = e.target.result;
            };
            reader.readAsDataURL(file);

            // Remove button event
            fileItem.querySelector('.remove-attachment-btn').addEventListener('click', () => {
                fileItem.remove();
            });

            attachedFilesList.appendChild(fileItem);
        },

        getFileIcon(fileType) {
            if (fileType.startsWith('image/')) return 'fas fa-image';
            if (fileType === 'application/pdf') return 'fas fa-file-pdf';
            if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word';
            if (fileType.includes('sheet') || fileType.includes('excel')) return 'fas fa-file-excel';
            if (fileType.includes('text')) return 'fas fa-file-alt';
            return 'fas fa-file';
        },

        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        getSupportAttachedFiles() {
            const attachedFilesList = this.supportModalEl.querySelector('#sup-attached-files');
            if (!attachedFilesList) return [];

            const fileItems = attachedFilesList.querySelectorAll('.attached-file-item');
            return Array.from(fileItems).map(item => ({
                name: item.dataset.fileName,
                size: parseInt(item.dataset.fileSize),
                type: item.dataset.fileType,
                data: item.dataset.fileData
            }));
        },

        clearSupportAttachments() {
            const attachedFilesList = this.supportModalEl.querySelector('#sup-attached-files');
            const fileInput = this.supportModalEl.querySelector('#sup-attachment-input');
            
            if (attachedFilesList) {
                attachedFilesList.innerHTML = '';
            }
            if (fileInput) {
                fileInput.value = '';
            }
        },

        fillSupportModal(ticket) {
            const modal = this.ensureSupportModal();
            modal.dataset.ticketId = ticket.ticketNumber;
            
            // Update modal title and ticket number
            modal.querySelector('#sup-modal-title').textContent = ticket.subject || 'Support Ticket';
            modal.querySelector('#sup-modal-ticket-num').textContent = ticket.ticketNumber;
            
            // Update status badge
            modal.querySelector('#sup-modal-status').innerHTML = `<span class="bel-badge ${ticket.status === 'Open' ? 'pending' : 'completed'}">${ticket.status}</span>`;
            
            // Create BEL profile with avatar
            const avatarContainer = modal.querySelector('#sup-bel-avatar');
            const avatarHTML = utils.generateAvatarHTML(ticket.belName, ticket.referralId, 40);
            avatarContainer.innerHTML = avatarHTML;
            
            modal.querySelector('#sup-bel-name').textContent = ticket.belName;
            modal.querySelector('#sup-referral-id').innerHTML = `<a href="#" class="referral-id-link" data-referral-id="${ticket.referralId}">${ticket.referralId}</a>`;
            modal.querySelector('#sup-message').textContent = ticket.message || 'No message provided.';
            
            // 添加用戶問題的時間戳
            const messageTimeElement = modal.querySelector('#sup-message-time');
            if (messageTimeElement) {
                const questionTime = ticket.questionTime || '—'; // 從ticket中獲取或顯示空值
                // 從BEL profiles leaderboard中獲取BEL的實際email
                const appData = window.APP_DATA || APP_DATA;
                const belProfile = appData?.belProfiles?.leaderboard?.find(bel => bel.id === ticket.referralId);
                const belEmail = belProfile ? belProfile.email : `${ticket.belName.toLowerCase().replace(' ', '.')}@email.com`;
                messageTimeElement.textContent = `${questionTime} • ${belEmail}`;
            }

            // Update replies section - 根據邏輯調整
            const repliesContainer = modal.querySelector('#sup-replies');
            const conversationTitle = modal.querySelector('#conversation-title');
            
            if (ticket.status === 'Closed' && ticket.replies && ticket.replies.length) {
                // Closed tickets show conversation history
                if (conversationTitle) conversationTitle.style.display = 'block';
                repliesContainer.innerHTML = ticket.replies.map(reply => {
                    let attachmentsHtml = '';
                    if (reply.attachments && reply.attachments.length > 0) {
                        attachmentsHtml = `
                            <div class="reply-attachments" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--ds-color-gray-40);">
                                <div style="font-size: 0.85rem; color: var(--ds-color-gray-70); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-paperclip"></i>
                                    <span>Attachments (${reply.attachments.length})</span>
                                </div>
                                <div class="attachment-list" style="display: flex; flex-direction: column; gap: 6px;">
                                    ${reply.attachments.map(attachment => `
                                        <div class="attachment-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--ds-color-gray-30); border: 1px solid var(--ds-color-gray-40); border-radius: 4px;">
                                            <i class="${this.getFileIcon(attachment.type)}" style="color: var(--ds-color-gray-70); font-size: 0.9rem;"></i>
                                            <div style="flex: 1; min-width: 0;">
                                                <div style="font-size: 0.85rem; font-weight: 500; color: var(--ds-color-gray-80); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${attachment.name}">${attachment.name}</div>
                                                <div style="font-size: 0.75rem; color: var(--ds-color-gray-70);">${this.formatFileSize(attachment.size)}</div>
                                            </div>
                                            <a href="${attachment.data}" download="${attachment.name}" class="download-attachment" style="color: var(--ds-color-link); text-decoration: none; padding: 4px; border-radius: 4px; display: flex; align-items: center;" title="Download">
                                                <i class="fas fa-download" style="font-size: 0.8rem;"></i>
                                            </a>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                    
                    return `
                        <div class="support-reply-item">
                            <div class="support-reply-header">
                                <i class="fas fa-user-circle" style="color: var(--ds-color-gray-70);"></i>
                                <span style="font-weight: 600; color: var(--ds-color-gray-80);">Admin Reply</span>
                            </div>
                            <div class="support-reply-content">${reply.text}</div>
                            ${attachmentsHtml}
                            <div class="support-reply-meta">
                                ${reply.time} • admin@advantech.com
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                // Open tickets and other statuses don't show conversation history
                if (conversationTitle) conversationTitle.style.display = 'none';
                repliesContainer.innerHTML = '';
            }
            
            // Show/hide reply section - Open tickets always show reply section
            const replySection = modal.querySelector('#sup-reply-section');
            if (ticket.status === 'Open') {
                replySection.style.display = 'block';
                // Clear any previous attachments when opening a new ticket
                this.clearSupportAttachments();
            } else {
                replySection.style.display = 'none';
            }
        },

        openSupportModal(ticketId) {
            // Try to find ticket in both data sources
            let ticket = APP_DATA.contactSupport.tickets.find(t => t.ticketNumber === ticketId);
            if (!ticket) {
                ticket = APP_DATA.contactSupport.tickets.find(t => t.ticketNumber === ticketId);
            }
            if (!ticket) return;

            const modal = this.ensureSupportModal();
            this.fillSupportModal(ticket);
            modal.style.zIndex = this.getNextModalZIndex();
            modal.classList.add('show');
        },

        ensureAnnouncementModal() {
            if (this.announcementModalEl) return this.announcementModalEl;
            
            const wrap = document.createElement('div');
            wrap.className = 'modal-overlay';
            wrap.id = 'send-announcement-modal';
            wrap.innerHTML = `
                <div class="modal-content" style="max-width:440px;">
                    <div class="modal-header">
                        <h3 style="margin:0;">Send Announcement</h3>
                        <button class="close-button" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body-grid" style="grid-template-columns: 1fr;">
                        <div>
                            <div class="bel-form-group" style="margin-bottom:12px;">
                                <label>Level</label>
                                <select id="ann-category" class="bel-form-control bel-form-select">
                                    <option>All</option>
                                    <option>Builder</option>
                                    <option>Enabler</option>
                                    <option>Exploder</option>
                                    <option>Leader</option>
                                </select>
                            </div>
                            <div class="bel-form-group" style="margin-bottom:12px;">
                                <label>Title</label>
                                <div class="input-with-counter">
                                    <input type="text" id="ann-title" class="bel-form-control bel-form-input" maxlength="20" required placeholder="Enter announcement title" />
                                    <small class="char-counter"><span id="title-count">0</span>/20</small>
                                </div>
                            </div>
                            <div class="bel-form-group" style="margin-bottom:12px;">
                                <label>Body</label>
                                <div class="input-with-counter">
                                    <input type="text" id="ann-body" class="bel-form-control bel-form-input" maxlength="40" required placeholder="Enter announcement content" />
                                    <small class="char-counter"><span id="body-count">0</span>/40</small>
                                </div>
                            </div>
                            <div class="bel-form-group" style="margin-bottom:12px;">
                                <label>Link (optional)</label>
                                <input type="url" id="ann-link" class="bel-form-control bel-form-input" placeholder="https://example.com/link"/>
                            </div>
                            <div class="modal-actions" style="display:flex; justify-content:flex-end; gap:8px;">
                                <button class="bel-btn primary" id="ann-send"><i class="fas fa-paper-plane"></i> Send</button>
                                <button class="bel-btn secondary" id="ann-cancel">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            this.announcementModalEl = wrap;

            const close = () => {
                this.announcementModalEl.classList.remove('show');
                // Reset form when closing
                setTimeout(() => {
                    this.announcementModalEl.querySelector('#ann-category').selectedIndex = 0;
                    this.announcementModalEl.querySelector('#ann-title').value = '';
                    this.announcementModalEl.querySelector('#ann-body').value = '';
                    this.announcementModalEl.querySelector('#ann-link').value = '';
                    this.announcementModalEl.querySelector('#title-count').textContent = '0';
                    this.announcementModalEl.querySelector('#body-count').textContent = '0';
                }, 200);
            };
            this.announcementModalEl.querySelector('.close-button')?.addEventListener('click', close);
            this.announcementModalEl.querySelector('#ann-cancel')?.addEventListener('click', close);
            this.announcementModalEl.addEventListener('click', (e) => { 
                if (e.target === this.announcementModalEl) close(); 
            });

            // 字數統計功能
            const titleInput = this.announcementModalEl.querySelector('#ann-title');
            const bodyInput = this.announcementModalEl.querySelector('#ann-body');
            const titleCount = this.announcementModalEl.querySelector('#title-count');
            const bodyCount = this.announcementModalEl.querySelector('#body-count');

            titleInput.addEventListener('input', () => {
                titleCount.textContent = titleInput.value.length;
            });

            bodyInput.addEventListener('input', () => {
                bodyCount.textContent = bodyInput.value.length;
            });

            this.announcementModalEl.querySelector('#ann-send')?.addEventListener('click', () => {
                const cat = this.announcementModalEl.querySelector('#ann-category').value.trim();
                const title = this.announcementModalEl.querySelector('#ann-title').value.trim();
                const body = this.announcementModalEl.querySelector('#ann-body').value.trim();
                const link = this.announcementModalEl.querySelector('#ann-link').value.trim();

                if (!title || title.length > 20) { 
                    alert('Title is required and must be ≤ 20 characters.'); 
                    return; 
                }
                if (!body || body.length > 40) { 
                    alert('Body is required and must be ≤ 40 characters.'); 
                    return; 
                }
                if (link && !/^https?:\/\/.+/i.test(link)) { 
                    alert('Link must start with http:// or https://'); 
                    return; 
                }

                const newAnnouncement = {
                    created: new Date().toISOString().slice(0, 10),
                    category: cat,
                    title,
                    body,
                    link: link || '—'
                };

                // Add to announcements data
                APP_DATA.announcements.announcements.unshift(newAnnouncement);
                
                // Re-render the announcements table
                this.renderAnnouncementsNew();

                // Optional: push into top-right notification panel if exists
                try {
                    const list = document.querySelector('.bel-notification-list');
                    if (list) {
                        const li = document.createElement('li');
                        li.className = 'bel-notification-item';
                        const tagClass = this.getNotificationTagClass(cat);
                        li.innerHTML = `
                            <div class="title"><span class="bel-badge ${tagClass}">${cat}</span>${title}</div>
                            <div class="date">${new Date().toISOString().slice(0,10)}</div>
                        `;
                        list.prepend(li);
                    }
                } catch {}

                this.announcementModalEl.classList.remove('show');
                
                // Clear form and reset counters
                this.announcementModalEl.querySelector('#ann-category').selectedIndex = 0;
                this.announcementModalEl.querySelector('#ann-title').value = '';
                this.announcementModalEl.querySelector('#ann-body').value = '';
                this.announcementModalEl.querySelector('#ann-link').value = '';
                this.announcementModalEl.querySelector('#title-count').textContent = '0';
                this.announcementModalEl.querySelector('#body-count').textContent = '0';
                
                // Show success message
                alert('Announcement sent successfully! New announcement added to the top of the list.');
            });

            return this.announcementModalEl;
        },

        setupEventListeners() {
            // Event delegation for payout view buttons
            document.addEventListener('click', async (e) => {
                const payoutBtn = e.target.closest('.payout-view-btn');
                if (payoutBtn) {
                    const payoutMonth = payoutBtn.getAttribute('data-payout-month');
                    if (payoutMonth) {
                        await this.openBelPayoutModal(payoutMonth);
                    } else {
                        // Fallback for old data-payout-date format
                        const payoutDate = payoutBtn.getAttribute('data-payout-date');
                        this.openPayoutModal(payoutDate);
                    }
                    return;
                }

                // Event delegation for support view buttons  
                const supportBtn = e.target.closest('.support-view-btn');
                if (supportBtn) {
                    const ticketId = supportBtn.getAttribute('data-ticket-id');
                    this.openSupportModal(ticketId);
                    return;
                }

                // Event delegation for pay buttons in payout modal - REMOVED
                // Pay/retry functionality has been disabled as requested

                // Event delegation for asset edit buttons
                const editBtn = e.target.closest('.asset-edit-btn');
                if (editBtn) {
                    const assetId = editBtn.getAttribute('data-asset-id');
                    this.openFormModal('edit', assetId);
                    return;
                }

                // Event delegation for asset delete buttons
                const deleteBtn = e.target.closest('.asset-delete-btn');
                if (deleteBtn) {
                    const assetId = deleteBtn.getAttribute('data-asset-id');
                    this.openConfirmModal(assetId);
                    return;
                }

                // Event delegation for add asset button
                const addBtn = e.target.closest('#asset-add-btn');
                if (addBtn) {
                    this.openFormModal('add', null);
                    return;
                }

                // Event delegation for send announcement button (new)
                const announcementBtnNew = e.target.closest('#send-announcement-btn-new');
                if (announcementBtnNew) {
                    const modal = this.ensureAnnouncementModal();
                    modal.style.zIndex = this.getNextModalZIndex();
                    modal.classList.add('show');
                    return;
                }

                // Event delegation for view history tickets button
                const historyTicketsBtn = e.target.closest('#view-history-tickets-btn');
                if (historyTicketsBtn) {
                    this.openHistoryTicketsModal();
                    return;
                }
            });
        },

        // handlePayButtonClick function removed - retry functionality disabled as requested
        // handlePayButtonClick(payoutId) { ... }

        // Content Asset Modals
        ensureConfirmModal() {
            if (this.confirmModalEl) return this.confirmModalEl;
            
            const wrap = document.createElement('div');
            wrap.className = 'modal-overlay';
            wrap.id = 'asset-delete-modal';
            wrap.innerHTML = `
                <div class="modal-content" style="max-width:520px;">
                    <div class="modal-header">
                        <h3 style="margin:0;">Confirm Deletion</h3>
                        <button class="close-button" aria-label="Close">&times;</button>
                    </div>
                    <div style="padding-top:16px;">
                        <p style="line-height:1.6; font-size:0.95rem;">
                            This action <strong>cannot be undone</strong>. Are you sure you want to delete this asset?
                        </p>
                        <div class="modal-actions" style="margin-top:16px; display:flex; justify-content:flex-end; gap:8px;">
                            <button class="bel-btn danger confirm-delete-btn">Delete</button>
                            <button class="bel-btn secondary confirm-cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            this.confirmModalEl = wrap;

            const close = () => this.confirmModalEl.classList.remove('show');
            this.confirmModalEl.querySelector('.close-button')?.addEventListener('click', close);
            this.confirmModalEl.querySelector('.confirm-cancel-btn')?.addEventListener('click', close);
            this.confirmModalEl.addEventListener('click', (e) => { 
                if (e.target === this.confirmModalEl) close(); 
            });

            // Handle delete confirmation
            this.confirmModalEl.querySelector('.confirm-delete-btn')?.addEventListener('click', () => {
                const assetId = this.confirmModalEl.getAttribute('data-asset-id');
                this.deleteAsset(assetId);
                close();
            });

            return this.confirmModalEl;
        },

        openConfirmModal(assetId) {
            const modal = this.ensureConfirmModal();
            modal.setAttribute('data-asset-id', assetId);
            modal.style.zIndex = this.getNextModalZIndex();
            modal.classList.add('show');
        },

        ensureFormModal() {
            if (this.formModalEl) return this.formModalEl;
            
            const wrap = document.createElement('div');
            wrap.className = 'modal-overlay';
            wrap.id = 'asset-form-modal';
            wrap.innerHTML = `
                <div class="modal-content" style="max-width:800px;">
                    <div class="modal-header">
                        <h3 style="margin:0;" id="asset-form-title">Add Asset</h3>
                        <button class="close-button" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
                        <!-- Left Column: Data Fields -->
                        <div class="form-data-column">
                            <form id="asset-form">
                                <div class="bel-form-group" style="margin-bottom:4px;">
                                    <label>Category</label>
                                    <select id="asset-category" class="bel-form-control bel-form-select" required>
                                        <option value="">Select a category</option>
                                        <option value="IoTMart Campaign">IoTMart Campaign</option>
                                        <option value="Advantech Resource Website">Advantech Resource Website</option>
                                    </select>
                                </div>
                                <div class="bel-form-group" style="margin-bottom:4px;">
                                    <label>Title</label>
                                    <input type="text" id="asset-title" class="bel-form-control bel-form-input" maxlength="25" required />
                                </div>
                                <div class="bel-form-group" style="margin-bottom:4px;">
                                    <label>Subtitle</label>
                                    <input type="text" id="asset-subtitle" class="bel-form-control bel-form-input" maxlength="60" required />
                                </div>
                                <div class="bel-form-group" style="margin-bottom:4px;">
                                    <label>Page Link URL</label>
                                    <input type="url" id="asset-url" class="bel-form-control bel-form-input" placeholder="https://example.com/..." required />
                                </div>
                            </form>
                        </div>
                        
                        <!-- Right Column: Picture Upload -->
                        <div class="form-picture-column">
                            <div class="bel-form-group">
                                <label>Picture <span style="color: var(--ds-color-gray-60); font-size: 0.9em;">(Recommended: 1200 × 740 pixels)</span></label>
                                <div class="picture-upload-area" style="border: 2px dashed var(--bel-border-color); border-radius: 4px; padding: 32px; text-align: center; background-color: #f8f9fa; cursor: pointer; transition: all 0.3s ease; min-height: 200px; display: flex; flex-direction: column; justify-content: center;" onclick="document.getElementById('asset-picture').click();">
                                    <div class="upload-icon" style="font-size: 48px; color: #ccc; margin-bottom: 12px;">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                    </div>
                                    <div class="upload-text" style="color: var(--ds-color-gray-70); margin-bottom: 8px; font-weight: 600;">
                                        Click to upload picture
                                    </div>
                                    <div class="upload-text-secondary" style="color: var(--ds-color-gray-60); margin-bottom: 8px; font-size: 0.9em;">
                                        or drag and drop
                                    </div>
                                    <div class="upload-dimensions" style="color: var(--ds-color-gray-70); font-size: 0.85em;">
                                        Recommended: 1200 × 740 pixels
                                    </div>
                                    <input type="file" id="asset-picture" accept="image/*" style="display: none;" />
                                </div>
                                <div id="picture-preview" style=" display: none;">
                                    <div class="preview-image-container" style="position: relative; cursor: pointer; border-radius: 4px; overflow: hidden;" onclick="document.getElementById('asset-picture').click();">
                                        <img id="preview-image" style="width: 100%; height: auto; display: block; border: 1px solid var(--bel-border-color);" />
                                        <div class="image-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); color: white; display: none; flex-direction: column; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                                            <i class="fas fa-camera" style="font-size: 24px; margin-bottom: 8px;"></i>
                                            <div>Click to change picture</div>
                                        </div>
                                    </div>
                                    <div id="picture-info" style="color: var(--ds-color-gray-40); font-size:12px; text-align: right;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-actions" style="grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:8px;">
                            <button class="bel-btn primary" id="asset-save-btn">Save Asset</button>
                            <button class="bel-btn secondary" id="asset-cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(wrap);
            this.formModalEl = wrap;

            const close = () => this.formModalEl.classList.remove('show');
            this.formModalEl.querySelector('.close-button')?.addEventListener('click', close);
            this.formModalEl.querySelector('#asset-cancel-btn')?.addEventListener('click', close);
            this.formModalEl.addEventListener('click', (e) => { 
                if (e.target === this.formModalEl) close(); 
            });

            // Handle form submission
            this.formModalEl.querySelector('#asset-save-btn')?.addEventListener('click', () => {
                this.saveAsset();
            });

            // Handle picture upload
            const pictureInput = this.formModalEl.querySelector('#asset-picture');
            const uploadArea = this.formModalEl.querySelector('.picture-upload-area');
            const preview = this.formModalEl.querySelector('#picture-preview');
            const previewImage = this.formModalEl.querySelector('#preview-image');
            const pictureInfo = this.formModalEl.querySelector('#picture-info');

            // File input change handler
            pictureInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handlePictureUpload(file);
                }
            });

            // Drag and drop handlers
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--ds-color-primary)';
                uploadArea.style.backgroundColor = '#f0f8ff';
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--bel-border-color)';
                uploadArea.style.backgroundColor = '#f8f9fa';
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--bel-border-color)';
                uploadArea.style.backgroundColor = '#f8f9fa';
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    pictureInput.files = files;
                    this.handlePictureUpload(files[0]);
                }
            });

            // Image preview hover effects
            const previewContainer = this.formModalEl.querySelector('.preview-image-container');
            const imageOverlay = this.formModalEl.querySelector('.image-overlay');
            
            if (previewContainer && imageOverlay) {
                previewContainer.addEventListener('mouseenter', () => {
                    imageOverlay.style.display = 'flex';
                    imageOverlay.style.opacity = '1';
                });
                
                previewContainer.addEventListener('mouseleave', () => {
                    imageOverlay.style.opacity = '0';
                    setTimeout(() => {
                        if (imageOverlay.style.opacity === '0') {
                            imageOverlay.style.display = 'none';
                        }
                    }, 300);
                });
            }

            // Global function for removing picture
            window.removePicture = () => {
                pictureInput.value = '';
                preview.style.display = 'none';
                uploadArea.style.display = 'block';
            };

            return this.formModalEl;
        },

        openFormModal(mode, assetId) {
            const modal = this.ensureFormModal();
            const title = modal.querySelector('#asset-form-title');
            const pictureInput = modal.querySelector('#asset-picture');
            const uploadArea = modal.querySelector('.picture-upload-area');
            const preview = modal.querySelector('#picture-preview');
            const previewImage = modal.querySelector('#preview-image');
            const pictureInfo = modal.querySelector('#picture-info');
            
            // Reset picture upload state
            pictureInput.value = '';
            uploadArea.style.display = 'block';
            preview.style.display = 'none';
            
            if (mode === 'add') {
                title.textContent = 'Add Asset';
                modal.querySelector('#asset-title').value = '';
                modal.querySelector('#asset-subtitle').value = '';
                modal.querySelector('#asset-category').value = '';
                modal.querySelector('#asset-url').value = '';
                modal.setAttribute('data-mode', 'add');
            } else if (mode === 'edit' && assetId) {
                title.textContent = 'Edit Asset';
                const assetIndex = parseInt(assetId.replace('asset-', ''));
                const asset = APP_DATA.content.assets[assetIndex];
                if (asset) {
                    modal.querySelector('#asset-title').value = asset.title;
                    modal.querySelector('#asset-subtitle').value = asset.subtitle;
                    modal.querySelector('#asset-category').value = asset.category || '';
                    modal.querySelector('#asset-url').value = asset.pageLink;
                    modal.setAttribute('data-mode', 'edit');
                    modal.setAttribute('data-asset-id', assetId);
                    
                    // Show existing picture or placeholder if available
                    if (asset.picture && asset.picture.data) {
                        previewImage.src = asset.picture.data;
                        pictureInfo.innerHTML = `
                            <div><strong>File:</strong> ${asset.picture.name}</div>
                            <div><strong>Size:</strong> ${(asset.picture.size / 1024).toFixed(1)} KB</div>
                            <div><strong>Type:</strong> ${asset.picture.type}</div>
                        `;
                        uploadArea.style.display = 'none';
                        preview.style.display = 'block';
                    } else {
                        // Show placeholder image based on asset index
                        const placeholderImages = [
                            'https://irp.cdn-website.com/56869327/dms3rep/multi/BEL-PCs.png',
                            'https://irp.cdn-website.com/56869327/dms3rep/multi/BEL-PoE.png'
                        ];
                        const placeholderSrc = placeholderImages[assetIndex % placeholderImages.length];
                        
                        previewImage.src = placeholderSrc;
                        pictureInfo.innerHTML = `
                            <div style="color: #666; font-style: italic;">
                                <i class="fas fa-image"></i> BEL-PoE.png
                            </div>
                        `;
                        uploadArea.style.display = 'none';
                        preview.style.display = 'block';
                    }
                }
            }

            modal.style.zIndex = this.getNextModalZIndex();
            modal.classList.add('show');
        },

        handlePictureUpload(file) {
            const preview = this.formModalEl.querySelector('#picture-preview');
            const previewImage = this.formModalEl.querySelector('#preview-image');
            const pictureInfo = this.formModalEl.querySelector('#picture-info');
            const uploadArea = this.formModalEl.querySelector('.picture-upload-area');

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.');
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('File size must be less than 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                // Create image to check dimensions
                const img = new Image();
                img.onload = () => {
                    const width = img.naturalWidth;
                    const height = img.naturalHeight;
                    
                    // Show dimensions info
                    let dimensionText = `${width} × ${height} pixels`;
                    if (width === 1200 && height === 740) {
                        dimensionText += ' ✓ Perfect size!';
                        pictureInfo.style.color = '#28a745';
                    } else {
                        dimensionText += ' (Recommended: 1200 × 740)';
                        pictureInfo.style.color = '#ffc107';
                    }

                    previewImage.src = e.target.result;
                    pictureInfo.innerHTML = `
                        <div><strong>File:</strong> ${file.name}</div>
                        <div><strong>Size:</strong> ${(file.size / 1024).toFixed(1)} KB</div>
                        <div><strong>Dimensions:</strong> ${dimensionText}</div>
                    `;
                    
                    uploadArea.style.display = 'none';
                    preview.style.display = 'block';
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        saveAsset() {
            const modal = this.formModalEl;
            const mode = modal.getAttribute('data-mode');
            const title = modal.querySelector('#asset-title').value;
            const subtitle = modal.querySelector('#asset-subtitle').value;
            const category = modal.querySelector('#asset-category').value;
            const url = modal.querySelector('#asset-url').value;
            const pictureInput = modal.querySelector('#asset-picture');

            if (!title || !subtitle || !category || !url) {
                alert('Please fill in all required fields.');
                return;
            }

            const assetData = {
                title,
                subtitle,
                category,
                pageLink: url,
                uploadDate: new Date().toISOString().split('T')[0]
            };

            // Handle picture data
            if (pictureInput.files && pictureInput.files[0]) {
                const file = pictureInput.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    assetData.picture = {
                        data: e.target.result,
                        name: file.name,
                        size: file.size,
                        type: file.type
                    };
                    this.saveAssetData(mode, assetData, modal);
                };
                reader.readAsDataURL(file);
            } else {
                // In edit mode, preserve existing picture data if no new file is uploaded
                if (mode === 'edit') {
                    const assetId = modal.getAttribute('data-asset-id');
                    const assetIndex = parseInt(assetId.replace('asset-', ''));
                    const existingAsset = APP_DATA.content.assets[assetIndex];
                    if (existingAsset && existingAsset.picture) {
                        assetData.picture = existingAsset.picture;
                    }
                }
                this.saveAssetData(mode, assetData, modal);
            }
        },

        saveAssetData(mode, assetData, modal) {
            if (mode === 'add') {
                APP_DATA.content.assets.push(assetData);
            } else if (mode === 'edit') {
                const assetId = modal.getAttribute('data-asset-id');
                const assetIndex = parseInt(assetId.replace('asset-', ''));
                if (APP_DATA.content.assets[assetIndex]) {
                    Object.assign(APP_DATA.content.assets[assetIndex], assetData);
                }
            }

            this.renderAssets();
            modal.classList.remove('show');
        },

        deleteAsset(assetId) {
            const assetIndex = parseInt(assetId.replace('asset-', ''));
            if (APP_DATA.content.assets[assetIndex]) {
                APP_DATA.content.assets.splice(assetIndex, 1);
                this.renderAssets();
            }
        }
    };

    /* ========================================================================
       TABLE UTILITIES
       ======================================================================== */
    const TableUtils = {
        makeTableSortable(table) {
            if (!table) return;
            
            const headers = table.querySelectorAll('th[data-sortable]');
            const tbody = table.querySelector('tbody');
            
            if (!tbody || headers.length === 0) return;
            
            // Remove existing event listeners to prevent duplicates
            headers.forEach(header => {
                const newHeader = header.cloneNode(true);
                header.parentNode.replaceChild(newHeader, header);
            });
            
            // Re-query headers after replacement
            const freshHeaders = table.querySelectorAll('th[data-sortable]');
            
            freshHeaders.forEach((header, index) => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    if (rows.length === 0) return;
                    
                    const sortDir = header.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
                    const dataType = header.getAttribute('data-type') || 'string';
                    
                    // Clear all sort indicators
                    freshHeaders.forEach(h => h.removeAttribute('data-sort-dir'));
                    header.setAttribute('data-sort-dir', sortDir);
                    
                    // Sort rows
                    rows.sort((a, b) => {
                        let cellA = a.children[index];
                        let cellB = b.children[index];
                        
                        if (!cellA || !cellB) return 0;
                        
                        // Check for data-sort-value attribute first, then fall back to textContent
                        let valA = cellA.getAttribute('data-sort-value') || cellA.textContent.trim();
                        let valB = cellB.getAttribute('data-sort-value') || cellB.textContent.trim();
                        
                        if (dataType === 'number') {
                            // If we have data-sort-value, use it directly as number, otherwise extract from text
                            if (cellA.getAttribute('data-sort-value')) {
                                valA = parseFloat(valA) || 0;
                                valB = parseFloat(valB) || 0;
                            } else {
                                // Extract numbers from text (handle currency, percentages, etc.)
                                valA = parseFloat(valA.replace(/[^0-9.-]/g, '')) || 0;
                                valB = parseFloat(valB.replace(/[^0-9.-]/g, '')) || 0;
                            }
                        } else if (dataType === 'date') {
                            valA = new Date(valA);
                            valB = new Date(valB);
                        }
                        
                        let comparison = 0;
                        if (valA < valB) comparison = -1;
                        else if (valA > valB) comparison = 1;
                        
                        return sortDir === 'asc' ? comparison : -comparison;
                    });
                    
                    // Re-append sorted rows
                    tbody.innerHTML = '';
                    rows.forEach(row => tbody.appendChild(row));
                });
            });
        },

        // Initialize sorting for all tables with sortable headers
        initializeAllTables() {
            const tables = document.querySelectorAll('table.bel-table');
            tables.forEach(table => {
                this.makeTableSortable(table);
            });
        }
    };

    // Initialize all avatars in the application
    function initializeAllAvatars() {
        // Replace any remaining static avatars with generated ones
        const staticAvatars = document.querySelectorAll('img[alt="User Avatar"]:not([src=""]):not([style*="display: none"])');
        staticAvatars.forEach(img => {
            const name = img.closest('.bel-user-profile')?.nextElementSibling?.textContent || 
                        img.closest('.bel-profile-identifier')?.querySelector('h3')?.textContent || 
                        'User';
            const generatedAvatar = utils.generateAvatar(name);
            img.parentNode.replaceChild(generatedAvatar, img);
        });
    }
    
    // Setup logout functionality after DOM is loaded
    setTimeout(() => {
        setupLogout();
    }, 1000);

    // Expose BELModal to global scope for external access
    window.BELModal = BELModal;

});

} // Close the authentication check
