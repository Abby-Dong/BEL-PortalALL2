// Charts functionality for BEL Portal
let payoutChartInstance = null; // To hold the chart instance
let annualSalesChartInstance = null; // To hold the annual sales chart instance
let productCategoryChartInstance = null; // To hold the product category chart instance

function initializeCharts() {
    // Initialize dashboard charts if on dashboard page
    if (window.location.pathname.split('/').pop() === 'index.html' || 
        window.location.pathname.split('/').pop() === '') {
        initializeDashboardCharts();
        // Initialize market regions chart after data is loaded
        setTimeout(() => {
            if (window.marketAnalysisData) {
                createMarketRegionsChart(window.marketAnalysisData);
            }
        }, 1000);
    }
}

async function initializeDashboardCharts() {
    try {
        const performance = await window.dataLoader.loadAnnualPerformance();
        const productAnalysis = await window.dataLoader.loadProductAnalysis();
        
        // Annual Sales Chart
        if (performance) {
            createAnnualSalesChart(performance);
        }
        
        // Product Category Chart  
        if (productAnalysis) {
            createProductCategoryChart(productAnalysis);
            // Render top products table
            renderTopProductsTable();
        }
        
        // Setup year selector
        setupYearSelector(performance);
        
    } catch (error) {
        console.error('Error initializing dashboard charts:', error);
    }
}

function createAnnualSalesChart(performanceData) {
    const annualSalesCanvas = document.getElementById('annual-sales-chart');
    if (annualSalesCanvas) {
        // Get current year data (default to 2025)
        const currentYear = document.getElementById('year-select')?.value || '2025';
        const yearData = performanceData.yearlyData[currentYear];
        
        if (yearData) {
            if (annualSalesChartInstance) {
                annualSalesChartInstance.destroy();
            }
            
            annualSalesChartInstance = new Chart(annualSalesCanvas, {
                type: 'line',
                data: {
                    labels: yearData.months,
                    datasets: [{
                        label: 'Sales ($)',
                        data: yearData.salesData,
                        tension: 0.4,
                        borderColor: 'rgb(0, 110, 255)',
                        backgroundColor: 'rgba(0, 110, 255, 0.1)',
                        fill: true,
                        orderVolume: yearData.ordersData
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    scales: { y: { beginAtZero: true } }, 
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => `Sales: $${context.parsed.y.toLocaleString()}`,
                                afterLabel: (context) => `Orders: ${context.dataset.orderVolume[context.dataIndex]}`
                            }
                        }
                    } 
                }
            });
        }
    }
}

function createProductCategoryChart(productAnalysis) {
    const productCategoryCanvas = document.getElementById('product-category-chart');
    if (productCategoryCanvas) {
        if (productCategoryChartInstance) {
            productCategoryChartInstance.destroy();
        }
        
        // Sample category data - similar to BEL-ManagementPortal structure
        const categoryData = {
            "IoT Gateway & Edge Intelligence": { units: 1250, color: "#003160" },
            "Remote I/O Modules": { units: 950, color: "#336899" },
            "Embedded Computers": { units: 880, color: "#80A0BF" },
            "Wireless Sensing & Solutions": { units: 720, color: "#B3CCE6" },
            "Edge AI Solutions": { units: 560, color: "#E6F0FF" }
        };
        
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData).map(cat => cat.units);
        const colors = Object.values(categoryData).map(cat => cat.color);
        
        productCategoryChartInstance = new Chart(productCategoryCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Units Sold',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bar chart
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Units Sold: ${context.parsed.x.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
}

// Render Top 20 Products Table
function renderTopProductsTable() {
    const tableBody = document.querySelector('.product-sales-grid .scrollable-table-container tbody');
    if (!tableBody) return;
    
    // Sample top products data - similar to BEL-ManagementPortal structure
    const topProducts = [
        { rank: 1, product: "EKI-1211-A", price: 299, qty: 156, total: 46644 },
        { rank: 2, product: "ECU-150-12A", price: 89, qty: 142, total: 12638 },
        { rank: 3, product: "AIR-030-S30A1", price: 1299, qty: 98, total: 127302 },
        { rank: 4, product: "WISE-4012E", price: 199, qty: 95, total: 18905 },
        { rank: 5, product: "UNO-2484G-7731BE", price: 45, qty: 89, total: 4005 },
        { rank: 6, product: "WISE-4050E", price: 189, qty: 78, total: 14742 },
        { rank: 7, product: "UNO-247-N3N1A", price: 125, qty: 72, total: 9000 },
        { rank: 8, product: "AIR-020X-S9A1", price: 599, qty: 68, total: 40732 },
        { rank: 9, product: "ADAM-6018-D", price: 65, qty: 65, total: 4225 },
        { rank: 10, product: "UNO-2271G-N231AE", price: 89, qty: 58, total: 5162 },
        { rank: 11, product: "UNO-238-C7N1AE", price: 159, qty: 52, total: 8268 },
        { rank: 12, product: "ADAM-6050-D", price: 39, qty: 48, total: 1872 },
        { rank: 13, product: "OPT1-ANT-5GSSW-30", price: 249, qty: 45, total: 11205 },
        { rank: 14, product: "ARK-2251-S3A1U", price: 179, qty: 42, total: 7518 },
        { rank: 15, product: "ADAM-6015-D", price: 399, qty: 38, total: 15162 },
        { rank: 16, product: "ARK-3534B-00A1", price: 69, qty: 35, total: 2415 },
        { rank: 17, product: "WISE-4250-S214", price: 199, qty: 32, total: 6368 },
        { rank: 18, product: "ICR-2437-DE", price: 159, qty: 29, total: 4611 },
        { rank: 19, product: "MIC-711-ON3A1", price: 129, qty: 26, total: 3354 },
        { rank: 20, product: "WISE-4250-S252", price: 79, qty: 24, total: 1896 }
    ];
    
    tableBody.innerHTML = topProducts.map(product => `
        <tr>
            <td>${product.rank}</td>
            <td>${product.product}</td>
            <td>$${product.price.toLocaleString()}</td>
            <td>${product.qty.toLocaleString()}</td>
            <td>$${product.total.toLocaleString()}</td>
        </tr>
    `).join('');
}

function setupYearSelector(performanceData) {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect && performanceData) {
        yearSelect.addEventListener('change', (e) => {
            const selectedYear = e.target.value;
            const yearData = performanceData.yearlyData[selectedYear];
            
            if (yearData && annualSalesChartInstance) {
                // Update chart data
                annualSalesChartInstance.data.labels = yearData.months;
                annualSalesChartInstance.data.datasets[0].data = yearData.salesData;
                annualSalesChartInstance.data.datasets[0].orderVolume = yearData.ordersData;
                annualSalesChartInstance.update();
            }
        });
    }
}

// Payout History Chart
function renderPayoutChart() {
    const payoutHistoryCanvas = document.getElementById('payout-history-chart');
    if (!payoutHistoryCanvas) return;

    if (payoutChartInstance) {
        payoutChartInstance.destroy(); // Destroy previous instance if it exists
    }

    // Get data from the table dynamically
    const tableRows = document.querySelectorAll('#payout-history-table tbody tr');
    const payoutData = Array.from(tableRows).map(row => {
        const dateCell = row.children[1].textContent.trim();
        const payoutCell = row.children[4].textContent.trim(); // Changed from index 5 to 4
        return {
            date: dateCell,
            payout: parseFloat(payoutCell.replace(/[^0-9.-]+/g, ""))
        };
    }).reverse(); // Reverse to show oldest first

    const labels = payoutData.map(d => new Date(d.date).toLocaleString('default', { month: 'short', year: 'numeric' }));
    const data = payoutData.map(d => d.payout);

    payoutChartInstance = new Chart(payoutHistoryCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Payout (USD)',
                data: data,
                backgroundColor: 'rgba(0, 110, 255, 0.8)',
                borderColor: 'rgba(0, 110, 255, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Net Payout: $${context.parsed.y.toLocaleString('en-US')}`;
                        }
                    }
                }
            }
        }
    });
}

// Annual Performance Chart (similar to BELModal performance trend)
function initAnnualPerformanceChart() {
    const ctx = document.getElementById('annual-performance-chart');
    if (!ctx) return;

    const yearSelector = document.getElementById('year-select');
    const selectedYear = yearSelector ? yearSelector.value : '2025';
    
    // Generate 12 months labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Sample monthly data based on selected year
    let clicksData = [];
    let ordersData = [];
    let revenueData = [];
    let c2oCvrData = [];
    
    if (selectedYear === '2025') {
        // 2025 data (current year with data up to August)
        clicksData = [120, 135, 110, 95, 150, 180, 165, 140, 0, 0, 0, 0];
        ordersData = [8, 12, 9, 7, 15, 18, 16, 14, 0, 0, 0, 0];
        revenueData = [2400, 3600, 2700, 2100, 4500, 5400, 4800, 4200, 0, 0, 0, 0];
    } else if (selectedYear === '2024') {
        // 2024 full year data
        clicksData = [90, 105, 85, 110, 125, 140, 155, 170, 145, 130, 115, 100];
        ordersData = [6, 8, 5, 9, 10, 12, 14, 16, 13, 11, 9, 8];
        revenueData = [1800, 2400, 1500, 2700, 3000, 3600, 4200, 4800, 3900, 3300, 2700, 2400];
    } else {
        // 2023 data
        clicksData = [75, 80, 70, 85, 95, 110, 125, 135, 120, 105, 90, 85];
        ordersData = [4, 5, 3, 6, 7, 9, 11, 12, 10, 8, 6, 5];
        revenueData = [1200, 1500, 900, 1800, 2100, 2700, 3300, 3600, 3000, 2400, 1800, 1500];
    }
    
    // Calculate C2O CVR dynamically
    c2oCvrData = clicksData.map((clicks, index) => {
        const orders = ordersData[index];
        return clicks > 0 ? Number(((orders / clicks) * 100).toFixed(2)) : 0;
    });

    if (window.annualPerformanceChart) {
        window.annualPerformanceChart.destroy();
    }

    window.annualPerformanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    type: 'bar',
                    label: 'Clicks',
                    data: clicksData,
                    backgroundColor: '#003160',
                    yAxisID: 'y'
                },
                {
                    type: 'bar',
                    label: 'Orders',
                    data: ordersData,
                    backgroundColor: '#336899',
                    yAxisID: 'y1'
                },
                {
                    type: 'bar',
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: '#80A0BF',
                    yAxisID: 'y2'
                },
                {
                    type: 'line',
                    label: 'C2O CVR (%)',
                    data: c2oCvrData,
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
                                return `${label}: $${value.toLocaleString()}`;
                            } else if (label === 'C2O CVR (%)') {
                                return `${label}: ${value}%`;
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
                    max: 200,
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
                    max: 20,
                    grid: {
                        drawOnChartArea: false
                    }
                },
                y2: {
                    type: 'linear',
                    display: false, // Hide Revenue axis but keep functionality
                    position: 'right',
                    beginAtZero: true,
                    max: 6000,
                    grid: {
                        drawOnChartArea: false
                    }
                },
                y3: {
                    type: 'linear',
                    display: false, // Hide CVR axis
                    position: 'right',
                    beginAtZero: true,
                    max: 15, // CVR percentage range
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add a delay to ensure data is loaded first
    setTimeout(initializeCharts, 500);
    initAnnualPerformanceChart();
    
    // Render top products table
    renderTopProductsTable();
    
    // Add year selector event listener
    const yearSelector = document.getElementById('year-select');
    if (yearSelector) {
        yearSelector.addEventListener('change', function() {
            initAnnualPerformanceChart();
        });
    }
});

// Market Regions Pie Chart
function createMarketRegionsChart(marketData) {
    const marketRegionsCanvas = document.getElementById('market-regions-chart');
    if (!marketRegionsCanvas || !marketData) return;

    // Extract sales data and parse numbers
    const labels = marketData.map(market => market.region || market.market || market.name);
    const salesData = marketData.map(market => {
        const sales = market.sales;
        if (typeof sales === 'string') {
            // Remove currency symbols and commas, then parse
            return parseFloat(sales.replace(/[$,]/g, ''));
        }
        return parseFloat(sales) || 0;
    });

    // Define colors for the pie chart - using Level Distribution colors from Management Portal
    const colors = [
        '#006EFF', // Builder - Blue
        '#00893a', // Enabler - Green  
        '#f39800', // Exploder - Orange
        '#db3a3a', // Leader - Red
        '#80A0BF'  // Additional color for 5th region
    ];

    if (window.marketRegionsChartInstance) {
        window.marketRegionsChartInstance.destroy();
    }

    window.marketRegionsChartInstance = new Chart(marketRegionsCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: salesData,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
