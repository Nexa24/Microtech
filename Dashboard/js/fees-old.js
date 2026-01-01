// ============================================
// FEE MANAGEMENT MODULE - MICROTECH ADMIN PANEL
// Tech Stack: Firebase Firestore, Chart.js, HTML5, CSS3, JavaScript ES6+
// Features: Fee Collection, Tracking, Reminders, Reports, Receipts, Role-based Access
// ============================================

// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getAuth,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDUJut5RTre7-dMnZa1F7aMUgYMz3xN06Y",
    authDomain: "microtech-88235.firebaseapp.com",
    projectId: "microtech-88235",
    storageBucket: "microtech-88235.appspot.com",
    messagingSenderId: "156750699730",
    appId: "1:156750699730:web:5ec11e8b5af90a21a26159"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('✅ Firebase initialized for Fee Management');

// Global Variables
let currentUser = null;
let userRole = 'admin'; // Will be fetched from auth
let allFees = [];
let notificationManager = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Toast Notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#fbbf24' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        font-size: 14px;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Generate Transaction ID
function generateTransactionID() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
}

// Generate Receipt Number
function generateReceiptNo(division) {
    const timestamp = Date.now().toString().slice(-6);
    const divPrefix = division ? division.toUpperCase().substring(0, 3) : 'GEN';
    return `${divPrefix}-RCP-${timestamp}`;
}

// Format Currency
function formatCurrency(amount) {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format Date
function formatDate(date) {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Calculate Balance
function calculateBalance(totalFee, amountPaid) {
    return parseFloat(totalFee || 0) - parseFloat(amountPaid || 0);
}

// DOM Elements
const modal = document.getElementById('fee-modal');
const addFeeBtn = document.getElementById('add-fee-btn');
const closeModalBtn = document.querySelector('.close-btn');
const addFeeForm = document.getElementById('add-fee-form');

const totalRevenueEl = document.getElementById('total-revenue');
const gamaRevenueEl = document.getElementById('gama-revenue');
const lbsRevenueEl = document.getElementById('lbs-revenue');
const captRevenueEl = document.getElementById('capt-revenue');

const gamaFeesTable = document.getElementById('gama-fees-table');
const lbsFeesTable = document.getElementById('lbs-fees-table');
const captFeesTable = document.getElementById('capt-fees-table');

const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

let revenueChart = null;

// ============================================
// FEE MANAGER CLASS - MAIN CONTROLLER
// ============================================
class FeeManager {
    constructor() {
        this.fees = [];
        this.filteredFees = [];
    }

    // ==================== INITIALIZATION ====================
    async init() {
        try {
            console.log('⚙️ Initializing Fee Management System...');
            
            // Setup event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup');
            
            // Load fees from Firestore
            await this.loadFees();
            console.log('✅ Fees loaded');
            
            // Setup real-time listeners
            this.setupRealtimeListeners();
            console.log('✅ Real-time listeners active');
            
            // Initialize charts
            this.initializeCharts();
            console.log('✅ Charts initialized');
            
            showToast('Fee Management System ready!', 'success');
        } catch (error) {
            console.error('❌ Error initializing Fee Manager:', error);
            showToast('Error loading system: ' + error.message, 'error');
        }
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Modal controls
        if (addFeeBtn) addFeeBtn.onclick = () => this.openAddFeeModal();
        if (closeModalBtn) closeModalBtn.onclick = () => this.closeFeeModal();
        
        window.onclick = (event) => {
            if (event.target === modal) {
                this.closeFeeModal();
            }
        };

        // Tab controls
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Form submission
        if (addFeeForm) {
            addFeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFee();
            });
        }

        // Auto-calculate balance
        const totalFeeInput = document.getElementById('amount');
        const amountPaidInput = document.getElementById('amount');
        if (totalFeeInput && amountPaidInput) {
            const calculateBal = () => {
                const total = parseFloat(document.getElementById('total-fee')?.value || 0);
                const paid = parseFloat(amountPaidInput.value || 0);
                const balanceEl = document.getElementById('balance-display');
                if (balanceEl) {
                    const balance = total - paid;
                    balanceEl.textContent = formatCurrency(balance);
                    balanceEl.style.color = balance > 0 ? '#fbbf24' : '#10b981';
                }
            };
            totalFeeInput.addEventListener('input', calculateBal);
            amountPaidInput.addEventListener('input', calculateBal);
        }
    }

    // ==================== TAB MANAGEMENT ====================
    switchTab(tabId) {
        tabLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        const activeLink = document.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(tabId);
        
        if (activeLink) activeLink.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }

// --- Firestore Logic ---

// Add new fee document
addFeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentId = document.getElementById('student-id').value;
    const division = document.getElementById('division').value;
    const feeType = document.getElementById('fee-type').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('payment-date').value;
    const mode = document.getElementById('payment-mode').value;
    const status = document.getElementById('payment-status').value;
    const notes = document.getElementById('notes').value;

    try {
        const receiptNo = `${division.toUpperCase()}-${Date.now().toString().slice(-5)}`;
        await addDoc(feesCollection, {
            studentId,
            division,
            type: feeType,
            amount,
            date,
            mode,
            status,
            notes,
            receiptNo,
            createdAt: new Date()
        });
        addFeeForm.reset();
        modal.style.display = 'none';
        
        // Add fee payment notification
        if (notificationManager) {
            notificationManager.notifyFeeCollected(
                'Fee Payment Recorded',
                `Fee payment of ₹${amount.toLocaleString()} from Student ID: ${studentId} has been recorded successfully.`,
                'success'
            );
        }
        
        alert('Fee payment added successfully!');
    } catch (error) {
        console.error('Error adding document: ', error);
        alert('Failed to add fee payment.');
    }
});

// Listen for real-time updates
onSnapshot(query(feesCollection, orderBy('date', 'desc')), (snapshot) => {
    const allFees = [];
    snapshot.forEach(doc => {
        allFees.push({ id: doc.id, ...doc.data() });
    });

    // Clear existing table rows
    gamaFeesTable.innerHTML = '';
    lbsFeesTable.innerHTML = '';
    captFeesTable.innerHTML = '';

    // Process data for analytics and tables
    let totalRevenue = 0;
    let gamaRevenue = 0;
    let lbsRevenue = 0;
    let captRevenue = 0;
    const monthlyRevenue = {};

    allFees.forEach(fee => {
        if (fee.status === 'paid') {
            totalRevenue += fee.amount;
            const month = fee.date.substring(0, 7); // YYYY-MM
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + fee.amount;

            if (fee.division === 'gama') {
                gamaRevenue += fee.amount;
                renderFeeRow(gamaFeesTable, fee);
            } else if (fee.division === 'lbs') {
                lbsRevenue += fee.amount;
                renderFeeRow(lbsFeesTable, fee);
            } else if (fee.division === 'capt') {
                captRevenue += fee.amount;
                renderFeeRow(captFeesTable, fee);
            }
        } else {
            // Also render pending fees
            if (fee.division === 'gama') renderFeeRow(gamaFeesTable, fee);
            else if (fee.division === 'lbs') renderFeeRow(lbsFeesTable, fee);
            else if (fee.division === 'capt') renderFeeRow(captFeesTable, fee);
        }
    });

    // Update analytics cards
    totalRevenueEl.textContent = `₹${totalRevenue.toLocaleString()}`;
    gamaRevenueEl.textContent = `₹${gamaRevenue.toLocaleString()}`;
    lbsRevenueEl.textContent = `₹${lbsRevenue.toLocaleString()}`;
    captRevenueEl.textContent = `₹${captRevenue.toLocaleString()}`;

    // Update chart
    updateChart(monthlyRevenue);
});

function renderFeeRow(tableBody, fee) {
    const row = tableBody.insertRow();
    row.innerHTML = `
        <td>${fee.studentId}</td>
        <td>${fee.type}</td>
        <td>₹${fee.amount.toLocaleString()}</td>
        <td>${fee.date}</td>
        <td>${fee.mode}</td>
        <td><span class="status-${fee.status.toLowerCase()}">${fee.status}</span></td>
        <td>${fee.receiptNo}</td>
    `;
}

function updateChart(monthlyRevenue) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    const sortedMonths = Object.keys(monthlyRevenue).sort();

    const chartData = {
        labels: sortedMonths,
        datasets: [{
            label: 'Monthly Revenue',
            data: sortedMonths.map(month => monthlyRevenue[month]),
            backgroundColor: 'rgba(0, 123, 255, 0.5)',
            borderColor: 'rgba(0, 123, 255, 1)',
            borderWidth: 1,
            borderRadius: 5
        }]
    };

    if (revenueChart) {
        revenueChart.data = chartData;
        revenueChart.update();
    } else {
        revenueChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#f0f0f0'
                        },
                        grid: {
                            color: '#444'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#f0f0f0'
                        },
                        grid: {
                            color: '#444'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f0f0f0'
                        }
                    }
                }
            }
        });
    }
}

// Initialize profile functionality when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fees management page loaded');
    
    // Initialize notification system
    initializeNotifications();
    
    // Initialize profile functionality
    addProfileStyles();
    initializeUserProfile();
});

function initializeNotifications() {
    notificationManager = new NotificationManager('fee-management');
    
    // Load some default fee notifications if empty
    if (notificationManager.getUnreadCount() === 0) {
        notificationManager.addNotification({
            title: 'Welcome to Fee Management',
            message: 'Track and manage all fee payments across divisions.',
            type: 'info',
            priority: 'medium'
        });
    }
}

// Function to add fee-related notifications
function addFeeNotification(title, message, type = 'info') {
    if (notificationManager) {
        notificationManager.notifyFeeCollected(title, message, type);
    }
}
