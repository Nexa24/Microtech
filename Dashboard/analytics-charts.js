/**
 * ============================================
 * MICROTECH ANALYTICS - CHARTS MODULE
 * ============================================
 * 
 * This module handles all Chart.js visualizations including:
 * - Revenue trend line charts
 * - Division revenue pie/donut charts
 * - Enrollments vs dropoffs bar charts
 * - Payment method distribution
 * - Top courses performance
 * - Drill-down interactions
 */

// Chart instances storage
const charts = {
    revenueTrend: null,
    divisionRevenue: null,
    enrollments: null,
    paymentMode: null,
    topCourses: null
};

// Chart color schemes
const colors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    pink: '#ec4899',
    orange: '#f97316',
    divisions: {
        GAMA: '#3b82f6',
        CAPT: '#10b981',
        LBS: '#f59e0b',
        Others: '#8b5cf6'
    }
};

// Default chart options for dark theme
const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#cbd5e1',
                font: {
                    family: 'Inter, sans-serif',
                    size: 12
                }
            }
        },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true
        }
    },
    scales: {
        x: {
            grid: {
                color: '#334155',
                borderColor: '#475569'
            },
            ticks: {
                color: '#94a3b8',
                font: {
                    family: 'Inter, sans-serif',
                    size: 11
                }
            }
        },
        y: {
            grid: {
                color: '#334155',
                borderColor: '#475569'
            },
            ticks: {
                color: '#94a3b8',
                font: {
                    family: 'Inter, sans-serif',
                    size: 11
                },
                callback: function(value) {
                    return '₹' + value.toLocaleString('en-IN');
                }
            }
        }
    }
};

// ============================================
// CHART INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    attachChartEventListeners();
});

function initializeCharts() {
    initRevenueTrendChart();
    initDivisionRevenueChart();
    initEnrollmentsChart();
    initPaymentModeChart();
    initTopCoursesChart();
}

function attachChartEventListeners() {
    // Revenue trend granularity selector
    document.getElementById('revenueTrendGranularity')?.addEventListener('change', (e) => {
        updateRevenueTrendChart(e.target.value);
    });

    // Top courses metric selector
    document.getElementById('topCoursesMetric')?.addEventListener('change', (e) => {
        updateTopCoursesChart(e.target.value);
    });
}

// ============================================
// REVENUE TREND CHART
// ============================================

function initRevenueTrendChart() {
    const ctx = document.getElementById('revenueTrendChart');
    if (!ctx) return;

    const data = generateRevenueTrendData('monthly');

    charts.revenueTrend = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            ...defaultOptions,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                ...defaultOptions.plugins,
                legend: {
                    ...defaultOptions.plugins.legend,
                    position: 'top'
                },
                tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '₹' + context.parsed.y.toLocaleString('en-IN');
                            return label;
                        }
                    }
                }
            },
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const dataIndex = activeElements[0].index;
                    const label = charts.revenueTrend.data.labels[dataIndex];
                    handleRevenueTrendClick(label);
                }
            }
        }
    });
}

function generateRevenueTrendData(granularity) {
    const state = window.analyticsState;
    if (!state || !state.transactions) {
        return { labels: [], datasets: [] };
    }

    let labels = [];
    let revenueData = [];
    let expenseData = [];

    if (granularity === 'daily') {
        // Generate daily data for the date range
        const days = Math.ceil((state.dateRange.end - state.dateRange.start) / (1000 * 60 * 60 * 24));
        for (let i = 0; i <= days; i++) {
            const date = new Date(state.dateRange.start);
            date.setDate(date.getDate() + i);
            labels.push(date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));

            // Sum transactions for this day
            const dayRevenue = state.transactions
                .filter(txn => {
                    const txnDate = new Date(txn.paymentDate);
                    return txnDate.toDateString() === date.toDateString();
                })
                .reduce((sum, txn) => sum + (txn.paidAmount || 0), 0);

            const dayExpenses = (state.expenses || [])
                .filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.toDateString() === date.toDateString();
                })
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);

            revenueData.push(dayRevenue);
            expenseData.push(dayExpenses);
        }
    } else if (granularity === 'weekly') {
        // Generate weekly data
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        // Simplified - would need proper week calculation
        revenueData = [125000, 135000, 145000, 155000];
        expenseData = [45000, 48000, 52000, 50000];
    } else {
        // Monthly data (last 12 months)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        
        for (let i = 11; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            labels.push(months[monthIndex]);
        }

        // Generate sample monthly data (would aggregate from transactions)
        revenueData = [320000, 345000, 389000, 412000, 398000, 425000, 445000, 467000, 489000, 512000, 534000, 556000];
        expenseData = [145000, 152000, 148000, 161000, 155000, 159000, 168000, 172000, 178000, 182000, 189000, 195000];
    }

    return {
        labels,
        datasets: [
            {
                label: 'Revenue',
                data: revenueData,
                borderColor: colors.primary,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: colors.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            },
            {
                label: 'Expenses',
                data: expenseData,
                borderColor: colors.danger,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: colors.danger,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ]
    };
}

function updateRevenueTrendChart(granularity) {
    if (!charts.revenueTrend) return;

    const data = generateRevenueTrendData(granularity);
    charts.revenueTrend.data = data;
    charts.revenueTrend.update();
}

function handleRevenueTrendClick(label) {
    console.log('Revenue trend clicked:', label);
    // Could drill down to show transactions for that period
}

// ============================================
// DIVISION REVENUE CHART (PIE/DONUT)
// ============================================

function initDivisionRevenueChart() {
    const ctx = document.getElementById('divisionRevenueChart');
    if (!ctx) return;

    const data = generateDivisionRevenueData();

    charts.divisionRevenue = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                        }
                    }
                }
            },
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const dataIndex = activeElements[0].index;
                    const division = charts.divisionRevenue.data.labels[dataIndex];
                    handleDivisionClick(division);
                }
            }
        }
    });
}

function generateDivisionRevenueData() {
    const state = window.analyticsState;
    if (!state || !state.transactions) {
        return { labels: [], datasets: [] };
    }

    const divisionRevenue = {
        GAMA: 0,
        CAPT: 0,
        LBS: 0,
        Others: 0
    };

    state.transactions.forEach(txn => {
        const division = txn.division || 'Others';
        divisionRevenue[division] = (divisionRevenue[division] || 0) + (txn.paidAmount || 0);
    });

    const labels = Object.keys(divisionRevenue).filter(d => divisionRevenue[d] > 0);
    const data = labels.map(d => divisionRevenue[d]);
    const backgroundColors = labels.map(d => colors.divisions[d] || colors.purple);

    return {
        labels,
        datasets: [{
            data,
            backgroundColor: backgroundColors,
            borderColor: '#1e293b',
            borderWidth: 2,
            hoverOffset: 10
        }]
    };
}

function handleDivisionClick(division) {
    console.log('Division clicked:', division);
    // Filter transactions by division
    document.getElementById('divisionFilter').value = division;
    if (window.applyFilters) {
        window.applyFilters();
    }
}

// ============================================
// ENROLLMENTS VS DROPOFFS CHART
// ============================================

function initEnrollmentsChart() {
    const ctx = document.getElementById('enrollmentsChart');
    if (!ctx) return;

    const data = generateEnrollmentsData();

    charts.enrollments = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            ...defaultOptions,
            plugins: {
                ...defaultOptions.plugins,
                legend: {
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            scales: {
                ...defaultOptions.scales,
                x: {
                    ...defaultOptions.scales.x,
                    stacked: false
                },
                y: {
                    ...defaultOptions.scales.y,
                    stacked: false,
                    ticks: {
                        ...defaultOptions.scales.y.ticks,
                        callback: function(value) {
                            return value; // No currency symbol for count
                        }
                    }
                }
            }
        }
    });
}

function generateEnrollmentsData() {
    const state = window.analyticsState;
    
    // Generate last 6 months data
    const months = [];
    const enrollments = [];
    const dropoffs = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
        
        // Sample data - would calculate from actual enrollment/dropout records
        enrollments.push(Math.floor(Math.random() * 30) + 20);
        dropoffs.push(Math.floor(Math.random() * 8) + 2);
    }

    return {
        labels: months,
        datasets: [
            {
                label: 'New Enrollments',
                data: enrollments,
                backgroundColor: colors.success,
                borderColor: colors.success,
                borderWidth: 1,
                borderRadius: 6
            },
            {
                label: 'Dropoffs',
                data: dropoffs,
                backgroundColor: colors.danger,
                borderColor: colors.danger,
                borderWidth: 1,
                borderRadius: 6
            }
        ]
    };
}

// ============================================
// PAYMENT MODE CHART
// ============================================

function initPaymentModeChart() {
    const ctx = document.getElementById('paymentModeChart');
    if (!ctx) return;

    const data = generatePaymentModeData();

    charts.paymentMode = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 11
                        },
                        padding: 10,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function generatePaymentModeData() {
    const state = window.analyticsState;
    if (!state || !state.transactions) {
        return { labels: [], datasets: [] };
    }

    const paymentModes = {};
    
    state.transactions.forEach(txn => {
        const mode = txn.paymentMethod || 'Cash';
        paymentModes[mode] = (paymentModes[mode] || 0) + 1;
    });

    const labels = Object.keys(paymentModes);
    const data = Object.values(paymentModes);
    const backgroundColors = [
        colors.primary,
        colors.success,
        colors.warning,
        colors.purple,
        colors.cyan,
        colors.pink
    ];

    return {
        labels,
        datasets: [{
            data,
            backgroundColor: backgroundColors.slice(0, labels.length),
            borderColor: '#1e293b',
            borderWidth: 2
        }]
    };
}

// ============================================
// TOP COURSES CHART
// ============================================

function initTopCoursesChart() {
    const ctx = document.getElementById('topCoursesChart');
    if (!ctx) return;

    const data = generateTopCoursesData('revenue');

    charts.topCourses = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            ...defaultOptions,
            indexAxis: 'y', // Horizontal bar chart
            plugins: {
                ...defaultOptions.plugins,
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ...defaultOptions.scales.x,
                    ticks: {
                        ...defaultOptions.scales.x.ticks,
                        callback: function(value) {
                            return '₹' + (value / 1000).toFixed(0) + 'k';
                        }
                    }
                },
                y: {
                    ...defaultOptions.scales.y,
                    ticks: {
                        ...defaultOptions.scales.y.ticks,
                        callback: function(value, index) {
                            const label = this.getLabelForValue(value);
                            return label.length > 15 ? label.substring(0, 15) + '...' : label;
                        }
                    }
                }
            }
        }
    });
}

function generateTopCoursesData(metric) {
    const state = window.analyticsState;
    if (!state || !state.transactions) {
        return { labels: [], datasets: [] };
    }

    const courseStats = {};
    
    state.transactions.forEach(txn => {
        const course = txn.course || 'Unknown';
        if (!courseStats[course]) {
            courseStats[course] = { revenue: 0, enrollments: new Set() };
        }
        courseStats[course].revenue += txn.paidAmount || 0;
        courseStats[course].enrollments.add(txn.studentID);
    });

    // Convert to array and sort
    let coursesArray = Object.entries(courseStats).map(([name, stats]) => ({
        name,
        value: metric === 'revenue' ? stats.revenue : stats.enrollments.size
    }));

    coursesArray.sort((a, b) => b.value - a.value);
    coursesArray = coursesArray.slice(0, 5); // Top 5

    const labels = coursesArray.map(c => c.name);
    const data = coursesArray.map(c => c.value);

    return {
        labels,
        datasets: [{
            label: metric === 'revenue' ? 'Revenue (₹)' : 'Enrollments',
            data,
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            borderWidth: 1,
            borderRadius: 6
        }]
    };
}

function updateTopCoursesChart(metric) {
    if (!charts.topCourses) return;

    const data = generateTopCoursesData(metric);
    charts.topCourses.data = data;
    charts.topCourses.options.scales.x.ticks.callback = metric === 'revenue' 
        ? function(value) { return '₹' + (value / 1000).toFixed(0) + 'k'; }
        : function(value) { return value; };
    charts.topCourses.update();
}

// ============================================
// UPDATE ALL CHARTS
// ============================================

function updateAllCharts() {
    updateRevenueTrendChart('monthly');
    
    if (charts.divisionRevenue) {
        charts.divisionRevenue.data = generateDivisionRevenueData();
        charts.divisionRevenue.update();
    }
    
    if (charts.enrollments) {
        charts.enrollments.data = generateEnrollmentsData();
        charts.enrollments.update();
    }
    
    if (charts.paymentMode) {
        charts.paymentMode.data = generatePaymentModeData();
        charts.paymentMode.update();
    }
    
    if (charts.topCourses) {
        const metric = document.getElementById('topCoursesMetric')?.value || 'revenue';
        charts.topCourses.data = generateTopCoursesData(metric);
        charts.topCourses.update();
    }
}

// Export function for global access
window.updateAllCharts = updateAllCharts;
window.analyticsCharts = charts;
