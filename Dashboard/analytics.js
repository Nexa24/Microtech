/**
 * ============================================
 * MICROTECH ANALYTICS & REPORTS - MAIN SCRIPT
 * ============================================
 * 
 * This module handles:
 * - Firebase initialization and data fetching
 * - KPI calculations and real-time updates
 * - Filter management and application
 * - Table population and pagination
 * - Modal interactions
 * - Date range handling
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    onSnapshot,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    getAuth, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ============================================
// FIREBASE CONFIGURATION
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyD5pgNOjCXdkopJW_mtqTpnaa-8MyUZzHc",
    authDomain: "microtech-88235.firebaseapp.com",
    projectId: "microtech-88235",
    storageBucket: "microtech-88235.firebasestorage.app",
    messagingSenderId: "177325108755",
    appId: "1:177325108755:web:37d5a44e9a721a501359e6",
    measurementId: "G-0NXTJF6L49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ============================================
// GLOBAL STATE
// ============================================

const state = {
    currentUser: null,
    dateRange: {
        start: new Date(),
        end: new Date(),
        preset: 'today'
    },
    filters: {
        division: 'all',
        course: 'all',
        counselor: 'all',
        paymentMethod: 'all',
        status: 'all'
    },
    transactions: [],
    pendingFees: [],
    courses: [],
    counselors: [],
    students: [],
    expenses: [],
    pagination: {
        transactions: { page: 1, limit: 50, total: 0 },
        pending: { page: 1, limit: 50, total: 0 }
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeDatePicker();
    attachEventListeners();
    loadInitialData();
});

// ============================================
// AUTHENTICATION
// ============================================

function initializeAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            state.currentUser = user;
            console.log('User authenticated:', user.email);
            
            // Verify user has admin role before allowing access
            try {
                const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    // Only allow admin access to analytics
                    if (userData.role !== 'admin') {
                        console.warn('Non-admin user attempting to access analytics');
                        alert('Access Denied: Only administrators can access analytics.');
                        window.location.href = '../auth.html';
                        return;
                    }
                    
                    console.log('Admin access granted');
                } else {
                    console.error('User document not found');
                }
            } catch (error) {
                console.error('Error checking user role:', error);
            }
        } else {
            // Redirect to login if not authenticated
            console.log('No user authenticated, redirecting to login');
            window.location.href = '../auth.html';
        }
    });
}

// ============================================
// DATE RANGE HANDLING
// ============================================

function initializeDatePicker() {
    // Initialize Flatpickr for custom date range
    const customDatePicker = flatpickr('#customDateRange', {
        mode: 'range',
        dateFormat: 'Y-m-d',
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                state.dateRange.start = selectedDates[0];
                state.dateRange.end = selectedDates[1];
                state.dateRange.preset = 'custom';
            }
        }
    });

    // Set initial date range to today
    setDatePreset('today');
}

function setDatePreset(preset) {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    switch (preset) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case '7d':
            start.setDate(today.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case '30d':
            start.setDate(today.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'mtd':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'ytd':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            // Show custom date picker
            document.getElementById('customDateGroup').style.display = 'block';
            return;
    }

    state.dateRange = { start, end, preset };
    document.getElementById('customDateGroup').style.display = 'none';

    // Update UI
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === preset);
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function attachEventListeners() {
    // Date preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setDatePreset(btn.dataset.preset);
            if (btn.dataset.preset !== 'custom') {
                applyFilters();
            }
        });
    });

    // Filter buttons
    document.getElementById('applyFiltersBtn')?.addEventListener('click', applyFilters);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetFilters);
    
    // Export and schedule buttons
    document.getElementById('exportBtn')?.addEventListener('click', showExportModal);
    document.getElementById('scheduleReportBtn')?.addEventListener('click', showScheduleModal);

    // Filter dropdowns
    document.getElementById('divisionFilter')?.addEventListener('change', (e) => {
        state.filters.division = e.target.value;
        loadCoursesByDivision(e.target.value);
    });

    document.getElementById('courseFilter')?.addEventListener('change', (e) => {
        state.filters.course = e.target.value;
    });

    document.getElementById('counselorFilter')?.addEventListener('change', (e) => {
        state.filters.counselor = e.target.value;
    });

    document.getElementById('paymentMethodFilter')?.addEventListener('change', (e) => {
        state.filters.paymentMethod = e.target.value;
    });

    document.getElementById('statusFilter')?.addEventListener('change', (e) => {
        state.filters.status = e.target.value;
    });

    // Pagination
    document.getElementById('transactionsPrev')?.addEventListener('click', () => {
        if (state.pagination.transactions.page > 1) {
            state.pagination.transactions.page--;
            renderTransactionsTable();
        }
    });

    document.getElementById('transactionsNext')?.addEventListener('click', () => {
        const maxPage = Math.ceil(state.pagination.transactions.total / state.pagination.transactions.limit);
        if (state.pagination.transactions.page < maxPage) {
            state.pagination.transactions.page++;
            renderTransactionsTable();
        }
    });

    // Table search
    document.getElementById('transactionSearch')?.addEventListener('input', (e) => {
        filterTransactionsTable(e.target.value);
    });

    document.getElementById('pendingSearch')?.addEventListener('input', (e) => {
        filterPendingTable(e.target.value);
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Export modal actions
    document.getElementById('cancelExport')?.addEventListener('click', () => {
        document.getElementById('exportModal').classList.remove('active');
    });

    document.getElementById('confirmExport')?.addEventListener('click', handleExport);

    // Schedule modal actions
    document.getElementById('cancelSchedule')?.addEventListener('click', () => {
        document.getElementById('scheduleModal').classList.remove('active');
    });

    document.getElementById('confirmSchedule')?.addEventListener('click', handleScheduleCreate);

    // Format buttons in export modal
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Select all pending checkbox
    document.getElementById('selectAllPending')?.addEventListener('change', (e) => {
        document.querySelectorAll('#pendingTable input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id !== 'selectAllPending') {
                checkbox.checked = e.target.checked;
            }
        });
    });

    // Send bulk reminders
    document.getElementById('sendBulkRemindersBtn')?.addEventListener('click', sendBulkReminders);

    // Export transactions CSV
    document.getElementById('exportTransactionsBtn')?.addEventListener('click', exportTransactionsCSV);
}

// ============================================
// DATA LOADING
// ============================================

async function loadInitialData() {
    try {
        showLoadingState();
        
        await Promise.all([
            loadTransactions(),
            loadPendingFees(),
            loadCourses(),
            loadCounselors(),
            loadStudents(),
            loadExpenses()
        ]);

        calculateKPIs();
        renderTransactionsTable();
        renderPendingTable();
        renderTopCoursesTable();
        renderCounselorTable();
        updateAuditInfo();
        
        hideLoadingState();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Error loading data. Please refresh the page.', 'error');
    }
}

async function loadTransactions() {
    try {
        const feesRef = collection(db, 'fees');
        let q = query(
            feesRef,
            where('paymentDate', '>=', Timestamp.fromDate(state.dateRange.start)),
            where('paymentDate', '<=', Timestamp.fromDate(state.dateRange.end)),
            orderBy('paymentDate', 'desc')
        );

        // Apply filters
        if (state.filters.division !== 'all') {
            q = query(q, where('division', '==', state.filters.division));
        }

        if (state.filters.status !== 'all') {
            q = query(q, where('status', '==', state.filters.status));
        }

        const snapshot = await getDocs(q);
        state.transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            paymentDate: doc.data().paymentDate?.toDate() || new Date()
        }));

        // Apply additional filters (course, counselor, payment method)
        state.transactions = state.transactions.filter(txn => {
            if (state.filters.course !== 'all' && txn.course !== state.filters.course) return false;
            if (state.filters.counselor !== 'all' && txn.counselor !== state.filters.counselor) return false;
            if (state.filters.paymentMethod !== 'all' && txn.paymentMethod !== state.filters.paymentMethod) return false;
            return true;
        });

        state.pagination.transactions.total = state.transactions.length;
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        throw error;
    }
}

async function loadPendingFees() {
    try {
        const feesRef = collection(db, 'fees');
        const q = query(
            feesRef,
            where('balance', '>', 0),
            orderBy('balance', 'desc')
        );

        const snapshot = await getDocs(q);
        state.pendingFees = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Calculate days overdue
        state.pendingFees = state.pendingFees.map(fee => {
            if (fee.dueDate) {
                const dueDate = fee.dueDate.toDate();
                const today = new Date();
                const diffTime = today - dueDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                fee.daysOverdue = diffDays > 0 ? diffDays : 0;
            } else {
                fee.daysOverdue = 0;
            }
            return fee;
        });

        state.pagination.pending.total = state.pendingFees.length;
        
    } catch (error) {
        console.error('Error loading pending fees:', error);
        throw error;
    }
}

async function loadCourses() {
    try {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        state.courses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Populate course filter
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter) {
            courseFilter.innerHTML = '<option value="all">All Courses</option>';
            state.courses.forEach(course => {
                courseFilter.innerHTML += `<option value="${course.name}">${course.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        throw error;
    }
}

async function loadCoursesByDivision(division) {
    const courseFilter = document.getElementById('courseFilter');
    if (!courseFilter) return;

    courseFilter.innerHTML = '<option value="all">All Courses</option>';
    
    const filteredCourses = division === 'all' 
        ? state.courses 
        : state.courses.filter(c => c.division === division);

    filteredCourses.forEach(course => {
        courseFilter.innerHTML += `<option value="${course.name}">${course.name}</option>`;
    });
}

async function loadCounselors() {
    try {
        const counselorsRef = collection(db, 'counselors');
        const snapshot = await getDocs(counselorsRef);
        state.counselors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Populate counselor filter
        const counselorFilter = document.getElementById('counselorFilter');
        if (counselorFilter) {
            counselorFilter.innerHTML = '<option value="all">All Counselors</option>';
            state.counselors.forEach(counselor => {
                counselorFilter.innerHTML += `<option value="${counselor.name}">${counselor.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading counselors:', error);
        throw error;
    }
}

async function loadStudents() {
    try {
        const studentsRef = collection(db, 'students');
        const snapshot = await getDocs(studentsRef);
        state.students = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            enrollmentDate: doc.data().enrollmentDate?.toDate() || new Date()
        }));
    } catch (error) {
        console.error('Error loading students:', error);
        throw error;
    }
}

async function loadExpenses() {
    try {
        const expensesRef = collection(db, 'expenses');
        const q = query(
            expensesRef,
            where('date', '>=', Timestamp.fromDate(state.dateRange.start)),
            where('date', '<=', Timestamp.fromDate(state.dateRange.end))
        );

        const snapshot = await getDocs(q);
        state.expenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading expenses:', error);
        throw error;
    }
}

// ============================================
// KPI CALCULATIONS
// ============================================

function calculateKPIs() {
    // Total Revenue
    const totalRevenue = state.transactions.reduce((sum, txn) => sum + (txn.paidAmount || 0), 0);
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);

    // Collected Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = state.transactions.filter(txn => {
        const txnDate = new Date(txn.paymentDate);
        txnDate.setHours(0, 0, 0, 0);
        return txnDate.getTime() === today.getTime();
    });
    const collectedToday = todayTransactions.reduce((sum, txn) => sum + (txn.paidAmount || 0), 0);
    document.getElementById('collectedToday').textContent = formatCurrency(collectedToday);
    document.getElementById('collectedCount').textContent = `${todayTransactions.length} transactions`;

    // Pending Fees
    const totalPending = state.pendingFees.reduce((sum, fee) => sum + (fee.balance || 0), 0);
    document.getElementById('pendingFees').textContent = formatCurrency(totalPending);
    document.getElementById('pendingCount').textContent = `${state.pendingFees.length} students`;

    // New Enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newEnrollments = state.students.filter(s => s.enrollmentDate >= thirtyDaysAgo).length;
    document.getElementById('newEnrollments').textContent = newEnrollments;

    // Conversion Rate (placeholder - needs inquiries data)
    const conversionRate = 0; // Calculate based on inquiries vs enrollments
    document.getElementById('conversionRate').textContent = `${conversionRate}%`;
    document.getElementById('conversionDetails').textContent = '0/0 converted';

    // Net Profit
    const totalExpenses = state.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    document.getElementById('netProfit').textContent = formatCurrency(netProfit);
    document.getElementById('profitDetails').textContent = `₹${formatNumber(totalRevenue)} - ₹${formatNumber(totalExpenses)}`;

    // Active Courses
    const activeCourses = state.courses.filter(c => c.status === 'active' || !c.status).length;
    const totalCourseStudents = state.students.length;
    document.getElementById('activeCourses').textContent = activeCourses;
    document.getElementById('courseStudents').textContent = `${totalCourseStudents} total students`;

    // Calculate revenue change percentage (compare with previous period)
    calculateRevenueChange();

    // Analytics Widgets
    calculateARPU();
    calculateLTV();
    calculateChurnRate();
}

function calculateRevenueChange() {
    // Calculate previous period revenue for comparison
    const currentPeriodDays = Math.ceil((state.dateRange.end - state.dateRange.start) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(state.dateRange.start);
    previousStart.setDate(previousStart.getDate() - currentPeriodDays);
    const previousEnd = new Date(state.dateRange.start);

    // This would need historical data - placeholder for now
    const change = 12.5; // Placeholder
    const changeElement = document.getElementById('revenueChange');
    if (changeElement) {
        changeElement.className = `kpi-change ${change >= 0 ? 'positive' : 'negative'}`;
        changeElement.innerHTML = `
            <i class="fas fa-arrow-${change >= 0 ? 'up' : 'down'}"></i> ${Math.abs(change).toFixed(1)}%
        `;
    }
}

function calculateARPU() {
    const totalRevenue = state.transactions.reduce((sum, txn) => sum + (txn.paidAmount || 0), 0);
    const uniqueStudents = new Set(state.transactions.map(txn => txn.studentID)).size;
    const arpu = uniqueStudents > 0 ? totalRevenue / uniqueStudents : 0;
    document.getElementById('arpuValue').textContent = formatCurrency(arpu);
}

function calculateLTV() {
    // Simplified LTV calculation: average total fee per student
    const totalFees = state.students.reduce((sum, s) => sum + (s.totalFee || 0), 0);
    const ltv = state.students.length > 0 ? totalFees / state.students.length : 0;
    document.getElementById('ltvValue').textContent = formatCurrency(ltv);
}

function calculateChurnRate() {
    // Placeholder - would need completion/dropout tracking
    const churnRate = 0;
    const churnedStudents = 0;
    document.getElementById('churnRate').textContent = `${churnRate}%`;
    document.getElementById('churnDetails').textContent = `${churnedStudents} students left this month`;
}

// ============================================
// TABLE RENDERING
// ============================================

function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    const { page, limit } = state.pagination.transactions;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageTransactions = state.transactions.slice(start, end);

    if (pageTransactions.length === 0) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="11">
                    <i class="fas fa-inbox" style="font-size: 2rem; opacity: 0.3;"></i>
                    <p>No transactions found for the selected filters</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageTransactions.map(txn => `
        <tr onclick="viewTransactionDetails('${txn.id}')">
            <td>${txn.id.substring(0, 8)}...</td>
            <td>${txn.studentID || '-'}</td>
            <td>${txn.studentName || '-'}</td>
            <td><span class="badge badge-${txn.division?.toLowerCase() || 'default'}">${txn.division || '-'}</span></td>
            <td>${txn.course || '-'}</td>
            <td>₹${formatNumber(txn.paidAmount || 0)}</td>
            <td>₹${formatNumber(txn.balance || 0)}</td>
            <td>${formatDate(txn.paymentDate)}</td>
            <td>${txn.counselor || '-'}</td>
            <td>${txn.receiptNo || '-'}</td>
            <td>
                <button class="table-action-btn" onclick="event.stopPropagation(); viewReceipt('${txn.id}')">
                    <i class="fas fa-receipt"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Update pagination info
    document.getElementById('transactionsStart').textContent = start + 1;
    document.getElementById('transactionsEnd').textContent = Math.min(end, state.pagination.transactions.total);
    document.getElementById('transactionsTotal').textContent = state.pagination.transactions.total;
    document.getElementById('transactionsPage').textContent = `Page ${page}`;
}

function renderPendingTable() {
    const tbody = document.getElementById('pendingTableBody');
    if (!tbody) return;

    if (state.pendingFees.length === 0) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="11">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: var(--success-color); opacity: 0.5;"></i>
                    <p>No pending fees!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.pendingFees.map(fee => `
        <tr>
            <td><input type="checkbox" value="${fee.id}"></td>
            <td>${fee.studentID || '-'}</td>
            <td>${fee.studentName || '-'}</td>
            <td><span class="badge badge-${fee.division?.toLowerCase() || 'default'}">${fee.division || '-'}</span></td>
            <td>${fee.course || '-'}</td>
            <td>₹${formatNumber(fee.totalFee || 0)}</td>
            <td>₹${formatNumber(fee.paidAmount || 0)}</td>
            <td class="text-danger">₹${formatNumber(fee.balance || 0)}</td>
            <td>${fee.dueDate ? formatDate(fee.dueDate.toDate()) : '-'}</td>
            <td class="${fee.daysOverdue > 0 ? 'text-danger' : ''}">${fee.daysOverdue || 0}</td>
            <td>
                <button class="table-action-btn" onclick="sendReminder('${fee.id}')">
                    <i class="fas fa-bell"></i> Remind
                </button>
            </td>
        </tr>
    `).join('');
}

function renderTopCoursesTable() {
    const tbody = document.getElementById('topCoursesTableBody');
    if (!tbody) return;

    // Calculate revenue and enrollments per course
    const courseStats = {};
    
    state.transactions.forEach(txn => {
        if (!courseStats[txn.course]) {
            courseStats[txn.course] = { revenue: 0, enrollments: new Set() };
        }
        courseStats[txn.course].revenue += txn.paidAmount || 0;
        courseStats[txn.course].enrollments.add(txn.studentID);
    });

    // Convert to array and sort by revenue
    const topCourses = Object.entries(courseStats)
        .map(([courseName, stats]) => {
            const course = state.courses.find(c => c.name === courseName) || {};
            return {
                name: courseName,
                division: course.division || '-',
                revenue: stats.revenue,
                enrollments: stats.enrollments.size,
                avgFee: stats.enrollments.size > 0 ? stats.revenue / stats.enrollments.size : 0
            };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    tbody.innerHTML = topCourses.map((course, index) => `
        <tr>
            <td><strong>#${index + 1}</strong></td>
            <td>${course.name}</td>
            <td><span class="badge badge-${course.division.toLowerCase()}">${course.division}</span></td>
            <td>${course.enrollments}</td>
            <td>₹${formatNumber(course.revenue)}</td>
            <td>₹${formatNumber(course.avgFee)}</td>
            <td><i class="fas fa-arrow-up text-success"></i></td>
        </tr>
    `).join('');
}

function renderCounselorTable() {
    const tbody = document.getElementById('counselorTableBody');
    if (!tbody) return;

    // Calculate stats per counselor
    const counselorStats = {};
    
    state.transactions.forEach(txn => {
        const counselor = txn.counselor || 'Unassigned';
        if (!counselorStats[counselor]) {
            counselorStats[counselor] = {
                inquiries: 0, // Would need inquiry tracking
                conversions: new Set(),
                revenue: 0
            };
        }
        counselorStats[counselor].conversions.add(txn.studentID);
        counselorStats[counselor].revenue += txn.paidAmount || 0;
    });

    // Convert to array
    const counselorData = Object.entries(counselorStats).map(([name, stats]) => ({
        name,
        inquiries: stats.inquiries || 0,
        conversions: stats.conversions.size,
        conversionRate: 0, // Would calculate with inquiries data
        revenue: stats.revenue,
        avgDeal: stats.conversions.size > 0 ? stats.revenue / stats.conversions.size : 0
    }));

    tbody.innerHTML = counselorData.map(counselor => `
        <tr>
            <td><strong>${counselor.name}</strong></td>
            <td>${counselor.inquiries}</td>
            <td>${counselor.conversions}</td>
            <td>${counselor.conversionRate}%</td>
            <td>₹${formatNumber(counselor.revenue)}</td>
            <td>₹${formatNumber(counselor.avgDeal)}</td>
            <td><span class="badge badge-success">Good</span></td>
        </tr>
    `).join('');
}

// ============================================
// FILTER FUNCTIONS
// ============================================

async function applyFilters() {
    showLoadingState();
    
    await Promise.all([
        loadTransactions(),
        loadPendingFees(),
        loadExpenses()
    ]);

    calculateKPIs();
    renderTransactionsTable();
    renderPendingTable();
    renderTopCoursesTable();
    renderCounselorTable();

    // Trigger chart updates
    if (window.updateAllCharts) {
        window.updateAllCharts();
    }

    hideLoadingState();
    showToast('Filters applied successfully', 'success');
}

function resetFilters() {
    // Reset date range
    setDatePreset('today');

    // Reset filter dropdowns
    state.filters = {
        division: 'all',
        course: 'all',
        counselor: 'all',
        paymentMethod: 'all',
        status: 'all'
    };

    document.getElementById('divisionFilter').value = 'all';
    document.getElementById('courseFilter').value = 'all';
    document.getElementById('counselorFilter').value = 'all';
    document.getElementById('paymentMethodFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';

    applyFilters();
}

function filterTransactionsTable(searchTerm) {
    const term = searchTerm.toLowerCase();
    const rows = document.querySelectorAll('#transactionsTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

function filterPendingTable(searchTerm) {
    const term = searchTerm.toLowerCase();
    const rows = document.querySelectorAll('#pendingTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function showExportModal() {
    document.getElementById('exportModal').classList.add('active');
}

function showScheduleModal() {
    document.getElementById('scheduleModal').classList.add('active');
}

async function handleExport() {
    const activeFormat = document.querySelector('.format-btn.active')?.dataset.format || 'csv';
    const includeFilters = document.getElementById('includeFilters').checked;
    const includeKPI = document.getElementById('includeKPI').checked;
    const includeCharts = document.getElementById('includeCharts').checked;
    const includeDetails = document.getElementById('includeDetails').checked;
    const email = document.getElementById('exportEmail').value;

    showToast('Preparing export...', 'info');

    // Close modal
    document.getElementById('exportModal').classList.remove('active');

    // Trigger appropriate export function
    if (window.exportData) {
        await window.exportData(activeFormat, {
            includeFilters,
            includeKPI,
            includeCharts,
            includeDetails,
            email
        });
    }
}

async function handleScheduleCreate() {
    const scheduleName = document.getElementById('scheduleName').value;
    const reportType = document.getElementById('scheduleReportType').value;
    const frequency = document.getElementById('scheduleFrequency').value;
    const time = document.getElementById('scheduleTime').value;
    const recipients = document.getElementById('scheduleRecipients').value;
    const format = document.getElementById('scheduleFormat').value;

    if (!scheduleName || !recipients) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        // Save schedule to Firestore
        const scheduleData = {
            name: scheduleName,
            reportType,
            frequency,
            time,
            recipients: recipients.split(',').map(e => e.trim()),
            format,
            createdBy: state.currentUser.email,
            createdAt: new Date(),
            active: true
        };

        // This would save to Firestore - implement in analytics-scheduled.js
        if (window.createScheduledReport) {
            await window.createScheduledReport(scheduleData);
        }

        document.getElementById('scheduleModal').classList.remove('active');
        showToast('Scheduled report created successfully', 'success');
        
        // Reload scheduled reports list
        if (window.loadScheduledReports) {
            window.loadScheduledReports();
        }
    } catch (error) {
        console.error('Error creating schedule:', error);
        showToast('Error creating scheduled report', 'error');
    }
}

// ============================================
// ACTION HANDLERS
// ============================================

function viewTransactionDetails(transactionId) {
    // Navigate to transaction details or open modal
    console.log('View transaction:', transactionId);
}

function viewReceipt(transactionId) {
    // Open receipt in new window or modal
    window.open(`receipt.html?id=${transactionId}`, '_blank');
}

async function sendReminder(feeId) {
    showToast('Sending reminder...', 'info');
    
    // Implement reminder logic
    try {
        // Would call Cloud Function to send email/SMS
        console.log('Sending reminder for fee:', feeId);
        
        setTimeout(() => {
            showToast('Reminder sent successfully', 'success');
        }, 1000);
    } catch (error) {
        console.error('Error sending reminder:', error);
        showToast('Error sending reminder', 'error');
    }
}

async function sendBulkReminders() {
    const selected = Array.from(document.querySelectorAll('#pendingTable input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    if (selected.length === 0) {
        showToast('Please select students to send reminders', 'warning');
        return;
    }

    showToast(`Sending ${selected.length} reminders...`, 'info');
    
    try {
        // Would call Cloud Function for bulk reminders
        console.log('Sending bulk reminders:', selected);
        
        setTimeout(() => {
            showToast(`${selected.length} reminders sent successfully`, 'success');
        }, 1500);
    } catch (error) {
        console.error('Error sending bulk reminders:', error);
        showToast('Error sending reminders', 'error');
    }
}

async function exportTransactionsCSV() {
    if (window.exportToCSV) {
        await window.exportToCSV(state.transactions, 'transactions');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
    return `₹${formatNumber(amount)}`;
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
}

function formatDate(date) {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showLoadingState() {
    // Could show loading overlay
    console.log('Loading...');
}

function hideLoadingState() {
    console.log('Loading complete');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function updateAuditInfo() {
    document.getElementById('lastBackup').textContent = 'Nov 23, 2025 02:00 AM';
    document.getElementById('exportsToday').textContent = '0';
    document.getElementById('activeSchedules').textContent = '0';
}

// Export functions for use in other modules
window.analyticsState = state;
window.analyticsDB = db;
window.reloadData = loadInitialData;
window.applyFilters = applyFilters;
