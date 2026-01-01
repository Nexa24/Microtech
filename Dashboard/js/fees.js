// ============================================
// FEE MANAGEMENT MODULE - MICROTECH ADMIN PANEL
// Complete Fee Management System with Firebase Firestore
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
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getAuth,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Receipt Template Import
import { generateReceiptHTML } from './receipt-template.js';

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
let userRole = 'admin';
let allFees = [];
let revenueChart = null;
let currentReceiptData = null; // Store current receipt data for PDF generation

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
        max-width: 350px;
        font-size: 14px;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
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
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ============================================
// FEE MANAGER CLASS
// ============================================
class FeeManager {
    constructor() {
        this.fees = [];
        this.students = [];
    }

    async init() {
        try {
            console.log('⚙️ Initializing Fee Management...');

            this.setupEventListeners();
            await this.loadStudents();
            await this.loadFees();
            this.setupRealtimeListeners();
            this.initializeChart();

            showToast('Fee Management System ready!', 'success');
        } catch (error) {
            console.error('❌ Error:', error);
            showToast('Error loading system', 'error');
        }
    }

    // Load Students from Firestore (from 'users' collection)
    async loadStudents() {
        try {
            console.log('👥 Loading students from users collection...');
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('name', 'asc'));
            const snapshot = await getDocs(q);

            this.students = [];
            snapshot.forEach(doc => {
                this.students.push({ id: doc.id, ...doc.data() });
            });

            console.log(`✅ Loaded ${this.students.length} students from users collection`);
        } catch (error) {
            console.error('❌ Error loading students:', error);
            showToast('Error loading students', 'error');
        }
    }

    setupEventListeners() {
        const modal = document.getElementById('fee-modal');
        const addFeeBtn = document.getElementById('add-fee-btn');
        const closeBtn = document.querySelector('.close-btn');
        const form = document.getElementById('add-fee-form');

        if (addFeeBtn) {
            addFeeBtn.onclick = () => {
                modal.style.display = 'flex';
                this.setupStudentAutocomplete();
            };
        }

        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                this.clearAutocomplete();
            };
        }

        window.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                this.clearAutocomplete();
            }
        };

        // Tabs
        document.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.getAttribute('data-tab');
                document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                link.classList.add('active');
                document.getElementById(tabId)?.classList.add('active');
            });
        });

        // Form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveFee();
            });
        }

        // Division change - handle total fee visibility for GAMA and auto-select course
        const divisionSelect = document.getElementById('division');
        if (divisionSelect) {
            divisionSelect.addEventListener('change', (e) => {
                const divisionRaw = (e.target.value || '').toString();
                const division = divisionRaw.toLowerCase();
                const totalFeeGroup = document.getElementById('total-fee')?.closest('.form-group');
                const gamaHint = document.getElementById('gama-hint');
                const courseInput = document.getElementById('course');
                const isGama = division.includes('gama') || division === 'gama' || divisionRaw.toLowerCase().includes('gama');

                // Handle total fee visibility / requirement
                if (totalFeeGroup) {
                    if (isGama) {
                        // Hide total fee for GAMA (pay-as-you-go)
                        totalFeeGroup.style.display = 'none';
                        const tf = document.getElementById('total-fee');
                        if (tf) {
                            tf.removeAttribute('required');
                            tf.value = '0';
                        }

                        // Show GAMA hint
                        if (gamaHint) gamaHint.style.display = 'block';
                    } else {
                        // Show total fee for other divisions
                        totalFeeGroup.style.display = 'block';
                        const tf = document.getElementById('total-fee');
                        if (tf) tf.setAttribute('required', 'required');

                        // Hide GAMA hint
                        if (gamaHint) gamaHint.style.display = 'none';
                    }
                }

                // Auto-set course for GAMA and lock the field
                if (courseInput) {
                    if (isGama) {
                        courseInput.value = 'Gama Abacus';
                        courseInput.setAttribute('readonly', 'readonly');
                        courseInput.classList.add('disabled');
                    } else {
                        // Re-enable and clear only if it was previously auto-filled
                        if (courseInput.getAttribute('readonly') !== null) {
                            courseInput.removeAttribute('readonly');
                            courseInput.classList.remove('disabled');
                            courseInput.value = '';
                        }
                    }
                }
            });

            // Trigger initial change to set correct state on open
            divisionSelect.dispatchEvent(new Event('change'));
        }

        // Search functionality
        const searchInput = document.getElementById('fee-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const results = this.searchFees(e.target.value);
                this.fees = results;
                this.renderTables();
            });
        }

        // Filter by division
        const divisionFilter = document.getElementById('filter-division');
        if (divisionFilter) {
            divisionFilter.addEventListener('change', (e) => {
                this.applyFilters();
            });
        }

        // Filter by status
        const statusFilter = document.getElementById('filter-status');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.applyFilters();
            });
        }

        // Date range filters
        const startDateFilter = document.getElementById('filter-start-date');
        const endDateFilter = document.getElementById('filter-end-date');
        if (startDateFilter) {
            startDateFilter.addEventListener('change', () => this.applyFilters());
        }
        if (endDateFilter) {
            endDateFilter.addEventListener('change', () => this.applyFilters());
        }

        // Export buttons
        const exportCsvBtn = document.getElementById('export-csv');
        const exportPdfBtn = document.getElementById('export-pdf');
        if (exportCsvBtn) exportCsvBtn.onclick = () => this.exportToCSV();
        if (exportPdfBtn) exportPdfBtn.onclick = () => this.exportToPDF();

        // Show pending fees modal
        const showPendingBtn = document.getElementById('show-pending');
        if (showPendingBtn) {
            showPendingBtn.onclick = () => {
                this.showPendingFeesModal();
            };
        }

        // Reset filters
        const resetFiltersBtn = document.getElementById('reset-filters');
        if (resetFiltersBtn) {
            resetFiltersBtn.onclick = () => {
                this.loadFees();
                if (searchInput) searchInput.value = '';
                if (divisionFilter) divisionFilter.value = 'all';
                if (statusFilter) statusFilter.value = 'all';
                if (startDateFilter) startDateFilter.value = '';
                if (endDateFilter) endDateFilter.value = '';
            };
        }
    }

    applyFilters() {
        let filtered = allFees;

        const division = document.getElementById('filter-division')?.value;
        const status = document.getElementById('filter-status')?.value;
        const startDate = document.getElementById('filter-start-date')?.value;
        const endDate = document.getElementById('filter-end-date')?.value;

        if (division && division !== 'all') {
            filtered = filtered.filter(f => f.division === division);
        }

        if (status && status !== 'all') {
            filtered = filtered.filter(f => f.status === status);
        }

        if (startDate || endDate) {
            filtered = this.filterByDateRange(startDate, endDate);
        }

        this.fees = filtered;
        this.renderTables();
        showToast(`${filtered.length} records found`, 'info');
    }

    // Student Autocomplete
    setupStudentAutocomplete() {
        const studentIdInput = document.getElementById('student-id');
        const studentNameInput = document.getElementById('student-name');

        if (!studentIdInput || !studentNameInput) return;

        // Create autocomplete container for student name
        const wrapper = studentNameInput.parentElement;
        if (!wrapper.querySelector('.autocomplete-results')) {
            const resultsDiv = document.createElement('div');
            resultsDiv.className = 'autocomplete-results';
            resultsDiv.id = 'student-autocomplete';
            resultsDiv.style.display = 'none';
            wrapper.style.position = 'relative';
            wrapper.appendChild(resultsDiv);
        }

        // Student ID input - Auto-load student details on blur or Enter key
        studentIdInput.addEventListener('blur', async () => {
            const studentId = studentIdInput.value.trim();
            if (studentId) {
                await this.loadStudentByStudentId(studentId);
            }
        });

        studentIdInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const studentId = studentIdInput.value.trim();
                if (studentId) {
                    await this.loadStudentByStudentId(studentId);
                }
            }
        });

        // Student Name autocomplete
        studentNameInput.addEventListener('input', (e) => {
            this.searchStudents(e.target.value, 'name');
        });

        // Student ID autocomplete (while typing)
        studentIdInput.addEventListener('input', (e) => {
            this.searchStudents(e.target.value, 'id');
        });

        // Close autocomplete on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group')) {
                this.clearAutocomplete();
            }
        });
    }

    // Load student details by Student ID
    async loadStudentByStudentId(studentId) {
        try {
            // Find student by studentId or id
            const student = this.students.find(s =>
                s.studentId === studentId ||
                s.id === studentId ||
                s.studentId?.toLowerCase() === studentId.toLowerCase()
            );

            if (student) {
                await this.selectStudent(student.id);
            } else {
                showToast(`Student ID "${studentId}" not found`, 'warning');
                // Clear other fields if student not found
                document.getElementById('student-name').value = '';
                document.getElementById('division').value = '';
                document.getElementById('course').value = '';
                document.getElementById('counselor-id').value = '';
            }
        } catch (error) {
            console.error('Error loading student:', error);
            showToast('Error loading student details', 'error');
        }
    }

    searchStudents(searchTerm, searchBy = 'name') {
        const resultsDiv = document.getElementById('student-autocomplete');

        if (!searchTerm || searchTerm.length < 2) {
            resultsDiv.style.display = 'none';
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const matches = this.students.filter(student => {
            if (searchBy === 'name') {
                return student.name?.toLowerCase().includes(searchLower);
            } else {
                return student.studentId?.toLowerCase().includes(searchLower) ||
                    student.id?.toLowerCase().includes(searchLower);
            }
        }).slice(0, 5); // Limit to 5 results

        if (matches.length === 0) {
            resultsDiv.style.display = 'none';
            return;
        }

        resultsDiv.innerHTML = matches.map(student => `
            <div class="autocomplete-item" data-student-id="${student.id}">
                <div class="autocomplete-item-name">${student.name || 'N/A'}</div>
                <div class="autocomplete-item-details">
                    ID: ${student.studentId || student.id} | 
                    Division: ${student.division?.toUpperCase() || 'N/A'} | 
                    Course: ${student.course || 'N/A'}
                </div>
            </div>
        `).join('');

        resultsDiv.style.display = 'block';

        // Add click handlers
        resultsDiv.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const studentId = item.getAttribute('data-student-id');
                this.selectStudent(studentId);
            });
        });
    }

    async selectStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Populate form fields with all known student details
        document.getElementById('student-id').value = student.studentId || student.id;
        document.getElementById('student-name').value = student.name || '';

        // Map division names to select dropdown values
        let divisionValue = '';
        const divisionRaw = (student.division || '').toLowerCase();

        if (divisionRaw.includes('gama')) {
            divisionValue = 'gama';
        } else if (divisionRaw.includes('lbs')) {
            divisionValue = 'lbs';
        } else if (divisionRaw.includes('capt')) {
            divisionValue = 'capt';
        } else {
            divisionValue = divisionRaw;
        }

        document.getElementById('division').value = divisionValue;

        // Trigger division change event to update course and other fields
        const divisionSelect = document.getElementById('division');
        if (divisionSelect) {
            divisionSelect.dispatchEvent(new Event('change'));
        }

        // Set course (will be overridden by division change handler if Gama)
        if (student.course && divisionValue !== 'gama') {
            document.getElementById('course').value = student.course;
        }

        // Set counselor if available
        if (student.counselorId) {
            document.getElementById('counselor-id').value = student.counselorId;
        }

        // Handle Total Fee field based on division
        const totalFeeGroup = document.getElementById('total-fee')?.closest('.form-group');
        const gamaHint = document.getElementById('gama-hint');
        const isGama = divisionValue === 'gama';

        if (totalFeeGroup) {
            if (isGama) {
                // Hide total fee for GAMA students (pay-as-you-go)
                totalFeeGroup.style.display = 'none';
                document.getElementById('total-fee').removeAttribute('required');
                document.getElementById('total-fee').value = '0';

                // Show GAMA hint
                if (gamaHint) {
                    gamaHint.style.display = 'block';
                }
            } else {
                // Show total fee for other divisions
                totalFeeGroup.style.display = 'block';
                document.getElementById('total-fee').setAttribute('required', 'required');

                // Hide GAMA hint
                if (gamaHint) {
                    gamaHint.style.display = 'none';
                }

                // Set total fee if available from student data
                if (student.totalFee) {
                    document.getElementById('total-fee').value = student.totalFee;
                }
            }
        }

        // Set email if available
        if (student.email && document.getElementById('student-email')) {
            document.getElementById('student-email').value = student.email;
        }

        // Set phone if available
        if (student.phone && document.getElementById('student-phone')) {
            document.getElementById('student-phone').value = student.phone;
        }

        // Load existing fee records for this student
        await this.loadStudentFeeHistory(student.studentId || student.id);

        this.clearAutocomplete();

        const divisionName = isGama ? 'Gama Abacus (Pay-as-you-go)' : student.division;
        showToast(`✅ ${student.name} loaded - ${divisionName}`, 'success');
    }

    // Load student's fee history and calculate totals
    async loadStudentFeeHistory(studentId) {
        try {
            const feesRef = collection(db, 'fees');
            const q = query(feesRef, where('studentId', '==', studentId));
            const snapshot = await getDocs(q);

            let totalPaid = 0;
            let totalBalance = 0;
            let lastPaymentDate = null;
            let lastPaymentMode = null;

            snapshot.forEach(doc => {
                const feeData = doc.data();
                totalPaid += feeData.amountPaid || 0;
                totalBalance += feeData.balance || 0;

                if (feeData.paymentDate) {
                    if (!lastPaymentDate || new Date(feeData.paymentDate) > new Date(lastPaymentDate)) {
                        lastPaymentDate = feeData.paymentDate;
                        lastPaymentMode = feeData.mode;
                    }
                }
            });

            // Display fee history info
            const totalFeeInput = document.getElementById('total-fee');
            const currentTotalFee = parseFloat(totalFeeInput.value || 0);

            // If student has existing records, show info
            if (snapshot.size > 0) {
                const infoDiv = document.getElementById('student-fee-info');
                if (infoDiv) {
                    infoDiv.innerHTML = `
                        <div class="fee-history-info">
                            <div class="info-item">
                                <span class="info-label">Previous Payments:</span>
                                <span class="info-value">${snapshot.size}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Total Paid:</span>
                                <span class="info-value">${formatCurrency(totalPaid)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Remaining Balance:</span>
                                <span class="info-value ${totalBalance > 0 ? 'text-warning' : 'text-success'}">${formatCurrency(totalBalance)}</span>
                            </div>
                            ${lastPaymentDate ? `
                                <div class="info-item">
                                    <span class="info-label">Last Payment:</span>
                                    <span class="info-value">${formatDate(lastPaymentDate)} (${lastPaymentMode})</span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                    infoDiv.style.display = 'block';
                }

                // If there's a remaining balance, suggest it
                if (totalBalance > 0) {
                    showToast(`Student has pending balance: ${formatCurrency(totalBalance)}`, 'warning');
                }
            } else {
                const infoDiv = document.getElementById('student-fee-info');
                if (infoDiv) {
                    infoDiv.innerHTML = '<p class="text-info">No previous fee records found for this student.</p>';
                    infoDiv.style.display = 'block';
                }
            }

            console.log(`📊 Student ${studentId} - Payments: ${snapshot.size}, Paid: ${totalPaid}, Balance: ${totalBalance}`);
        } catch (error) {
            console.error('❌ Error loading student fee history:', error);
        }
    }

    clearAutocomplete() {
        const resultsDiv = document.getElementById('student-autocomplete');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
            resultsDiv.innerHTML = '';
        }
    }

    async loadFees() {
        try {
            console.log('📥 Loading fees and students...');

            // Load all students
            const studentsRef = collection(db, 'users');
            const studentsSnapshot = await getDocs(studentsRef);
            const students = [];
            studentsSnapshot.forEach(doc => {
                students.push({ id: doc.id, ...doc.data() });
            });

            // Load all fee records
            const feesRef = collection(db, 'fees');
            const q = query(feesRef, orderBy('createdAt', 'desc'));
            const feesSnapshot = await getDocs(q);

            this.fees = [];
            feesSnapshot.forEach(doc => {
                this.fees.push({ id: doc.id, ...doc.data() });
            });

            // Merge student data with fee status
            this.studentsWithFees = students.map(student => {
                // Find latest fee payment for this student
                const studentFees = this.fees.filter(fee =>
                    fee.studentId === student.id || fee.studentId === student.studentId
                );

                const latestFee = studentFees.length > 0 ? studentFees[0] : null;
                const totalPaid = studentFees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);
                const totalBalance = studentFees.reduce((sum, fee) => sum + (fee.balance || 0), 0);

                // Calculate pending status
                let pendingStatus = 'paid';
                let pendingDays = 0;

                if (latestFee && latestFee.nextDueDate) {
                    const dueDate = new Date(latestFee.nextDueDate);
                    const today = new Date();
                    const diffTime = today - dueDate;
                    pendingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (pendingDays > 0) {
                        pendingStatus = 'pending';
                    }
                } else if (student.feeStatus === 'Pending' || totalBalance > 0) {
                    // Calculate days since admission or last payment
                    const lastPaymentDate = latestFee ? new Date(latestFee.paymentDate) : new Date(student.admissionDate);
                    const today = new Date();
                    const diffTime = today - lastPaymentDate;
                    pendingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    pendingStatus = 'pending';
                }

                return {
                    ...student,
                    latestFee,
                    totalPaid,
                    totalBalance,
                    pendingStatus,
                    pendingDays,
                    feeHistory: studentFees
                };
            });

            allFees = this.fees;
            console.log(`✅ Loaded ${this.fees.length} fee records and ${students.length} students`);

            this.updateAnalytics();
            this.renderStudentFeeTable();
            this.renderTables(); // Render division-specific tables
        } catch (error) {
            console.error('❌ Error loading fees:', error);
            showToast('Error loading fees', 'error');
        }
    }

    setupRealtimeListeners() {
        const feesRef = collection(db, 'fees');
        onSnapshot(feesRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    this.loadFees();
                }
            });
        });
    }

    async saveFee() {
        try {
            const studentId = document.getElementById('student-id')?.value;
            const studentName = document.getElementById('student-name')?.value || 'N/A';
            const division = document.getElementById('division')?.value;
            const course = document.getElementById('course')?.value || 'N/A';
            const feeType = document.getElementById('fee-type')?.value;
            const amountPaid = parseFloat(document.getElementById('amount')?.value || 0);
            const totalFee = parseFloat(document.getElementById('total-fee')?.value || amountPaid);
            const balance = totalFee - amountPaid;
            const date = document.getElementById('payment-date')?.value;
            const mode = document.getElementById('payment-mode')?.value;
            const status = balance > 0 ? 'partial' : 'paid';
            const notes = document.getElementById('notes')?.value || '';
            const counselorID = document.getElementById('counselor-id')?.value || 'N/A';
            const nextDueDate = document.getElementById('next-due-date')?.value || null;

            const receiptNo = generateReceiptNo(division);
            const transactionID = generateTransactionID();

            await addDoc(collection(db, 'fees'), {
                studentId,
                studentName,
                division,
                course,
                type: feeType,
                amountPaid,
                totalFee,
                balance,
                paymentDate: date,
                mode,
                status,
                notes,
                receiptNo,
                transactionID,
                counselorID,
                nextDueDate,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            document.getElementById('add-fee-form').reset();
            document.getElementById('fee-modal').style.display = 'none';

            showToast('Fee payment recorded successfully!', 'success');

            // Generate and show receipt
            const receiptData = {
                receiptNo,
                receiptDate: date,
                studentName,
                studentId,
                division,
                course,
                totalFee,
                amountPaid,
                balance,
                paymentMode: mode,
                paymentDate: date,
                counselor: counselorID,
                feeType,
                notes,
                transactionID
            };

            // Show receipt preview modal
            showReceiptPreview(receiptData);

            this.loadFees();
        } catch (error) {
            console.error('❌ Error saving fee:', error);
            showToast('Error saving fee: ' + error.message, 'error');
        }
    }

    // Search and Filter Functions
    searchFees(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        return this.fees.filter(fee =>
            fee.studentId?.toLowerCase().includes(searchTerm) ||
            fee.studentName?.toLowerCase().includes(searchTerm) ||
            fee.receiptNo?.toLowerCase().includes(searchTerm)
        );
    }

    filterByDivision(division) {
        if (!division || division === 'all') return this.fees;
        return this.fees.filter(fee => fee.division === division);
    }

    filterByStatus(status) {
        if (!status || status === 'all') return this.fees;
        return this.fees.filter(fee => fee.status === status);
    }

    filterByDateRange(startDate, endDate) {
        return this.fees.filter(fee => {
            const feeDate = new Date(fee.paymentDate);
            const start = startDate ? new Date(startDate) : new Date('1900-01-01');
            const end = endDate ? new Date(endDate) : new Date('2100-12-31');
            return feeDate >= start && feeDate <= end;
        });
    }

    // Pending Fees Management
    getPendingFees() {
        return this.fees.filter(fee => fee.status === 'pending' || fee.balance > 0);
    }

    async sendReminder(studentId, studentName) {
        try {
            // Placeholder for WhatsApp/Email integration
            console.log(`📧 Sending reminder to ${studentName} (${studentId})`);

            // Log reminder in Firestore
            await addDoc(collection(db, 'reminders'), {
                studentId,
                studentName,
                reminderDate: Timestamp.now(),
                status: 'sent',
                type: 'fee-pending'
            });

            showToast(`Reminder sent to ${studentName}`, 'success');
            // TODO: Integrate with WhatsApp API or Email service
        } catch (error) {
            console.error('❌ Error sending reminder:', error);
            showToast('Error sending reminder', 'error');
        }
    }

    viewStudentFeeHistory(studentId) {
        const student = this.studentsWithFees?.find(s => s.id === studentId || s.studentId === studentId);
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }

        // Create modal to show fee history
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>Fee History - ${student.name}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <p><strong>Student ID:</strong> ${student.studentId || 'N/A'}</p>
                        <p><strong>Division:</strong> ${student.division || 'N/A'}</p>
                        <p><strong>Total Paid:</strong> ${formatCurrency(student.totalPaid)}</p>
                        <p><strong>Balance:</strong> ${formatCurrency(student.totalBalance)}</p>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Amount Paid</th>
                                <th>Balance</th>
                                <th>Mode</th>
                                <th>Receipt No</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${student.feeHistory.map(fee => `
                                <tr>
                                    <td>${formatDate(fee.paymentDate)}</td>
                                    <td>${fee.type}</td>
                                    <td>${formatCurrency(fee.amountPaid)}</td>
                                    <td>${formatCurrency(fee.balance)}</td>
                                    <td>${fee.mode}</td>
                                    <td>${fee.receiptNo}</td>
                                    <td><span class="status-badge status-${fee.status}">${fee.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    collectFee(studentId) {
        const student = this.studentsWithFees?.find(s => s.id === studentId || s.studentId === studentId);
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }

        // Pre-fill the add fee form with student details
        document.getElementById('student-id').value = student.studentId || student.id;
        document.getElementById('student-name').value = student.name;
        document.getElementById('division').value = student.division;
        document.getElementById('course').value = student.course || '';

        // Show the fee modal
        document.getElementById('fee-modal').style.display = 'flex';
        showToast(`Collecting fee for ${student.name}`, 'info');
    }

    // Receipt Generation
    generateReceipt(feeId) {
        const fee = this.fees.find(f => f.id === feeId);
        if (!fee) {
            showToast('Fee record not found', 'error');
            return;
        }

        // Create receipt HTML
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${fee.receiptNo}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; background: white; color: black; }
                    .receipt { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
                    .details { margin: 20px 0; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
                    .label { font-weight: bold; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                    .signature { margin-top: 60px; border-top: 1px solid #333; width: 200px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <div class="logo">🎓 MicroTech Center</div>
                        <p>Fee Payment Receipt</p>
                    </div>
                    <div class="details">
                        <div class="row"><span class="label">Receipt No:</span><span>${fee.receiptNo}</span></div>
                        <div class="row"><span class="label">Transaction ID:</span><span>${fee.transactionID}</span></div>
                        <div class="row"><span class="label">Student ID:</span><span>${fee.studentId}</span></div>
                        <div class="row"><span class="label">Student Name:</span><span>${fee.studentName || 'N/A'}</span></div>
                        <div class="row"><span class="label">Division:</span><span>${fee.division?.toUpperCase()}</span></div>
                        <div class="row"><span class="label">Course:</span><span>${fee.course || 'N/A'}</span></div>
                        <div class="row"><span class="label">Fee Type:</span><span>${fee.type}</span></div>
                        <div class="row"><span class="label">Amount Paid:</span><span>${formatCurrency(fee.amountPaid)}</span></div>
                        <div class="row"><span class="label">Total Fee:</span><span>${formatCurrency(fee.totalFee)}</span></div>
                        <div class="row"><span class="label">Balance:</span><span>${formatCurrency(fee.balance)}</span></div>
                        <div class="row"><span class="label">Payment Date:</span><span>${formatDate(fee.paymentDate)}</span></div>
                        <div class="row"><span class="label">Payment Mode:</span><span>${fee.mode}</span></div>
                        <div class="row"><span class="label">Status:</span><span>${fee.status?.toUpperCase()}</span></div>
                    </div>
                    <div class="signature">
                        <p>Authorized Signature</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for your payment!</p>
                        <p>MicroTech Center | Contact: info@microtech.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 500);

        showToast('Receipt generated!', 'success');
    }

    // Refund Management
    async issueRefund(feeId, refundAmount, reason) {
        try {
            const fee = this.fees.find(f => f.id === feeId);
            if (!fee) {
                showToast('Fee record not found', 'error');
                return;
            }

            // Create refund record
            await addDoc(collection(db, 'refunds'), {
                feeId,
                studentId: fee.studentId,
                studentName: fee.studentName,
                division: fee.division,
                refundAmount,
                reason,
                refundDate: Timestamp.now(),
                processedBy: currentUser?.email || 'admin'
            });

            // Update fee record
            const newAmountPaid = fee.amountPaid - refundAmount;
            const newBalance = fee.totalFee - newAmountPaid;

            await updateDoc(doc(db, 'fees', feeId), {
                amountPaid: newAmountPaid,
                balance: newBalance,
                status: newBalance > 0 ? 'partial' : 'paid',
                updatedAt: Timestamp.now(),
                refunded: true,
                refundAmount
            });

            showToast('Refund issued successfully!', 'success');
            this.loadFees();
        } catch (error) {
            console.error('❌ Error issuing refund:', error);
            showToast('Error issuing refund', 'error');
        }
    }

    // Export Functions
    exportToCSV() {
        try {
            const headers = ['Student ID', 'Student Name', 'Division', 'Course', 'Type', 'Amount Paid', 'Total Fee', 'Balance', 'Date', 'Mode', 'Status', 'Receipt No', 'Transaction ID'];
            const csvContent = [
                headers.join(','),
                ...this.fees.map(fee => [
                    fee.studentId,
                    fee.studentName || 'N/A',
                    fee.division,
                    fee.course || 'N/A',
                    fee.type,
                    fee.amountPaid,
                    fee.totalFee,
                    fee.balance,
                    fee.paymentDate,
                    fee.mode,
                    fee.status,
                    fee.receiptNo,
                    fee.transactionID
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `fees_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            showToast('CSV exported successfully!', 'success');
        } catch (error) {
            console.error('❌ Error exporting CSV:', error);
            showToast('Error exporting CSV', 'error');
        }
    }

    exportToPDF() {
        try {
            // Generate printable report
            const reportHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Fee Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #3b82f6; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background-color: #3b82f6; color: white; }
                        tr:nth-child(even) { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>📊 Fee Management Report</h1>
                    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Total Records:</strong> ${this.fees.length}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Division</th>
                                <th>Amount</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.fees.map(fee => `
                                <tr>
                                    <td>${fee.studentId}</td>
                                    <td>${fee.studentName || 'N/A'}</td>
                                    <td>${fee.division?.toUpperCase()}</td>
                                    <td>${formatCurrency(fee.amountPaid)}</td>
                                    <td>${formatCurrency(fee.balance)}</td>
                                    <td>${fee.status}</td>
                                    <td>${formatDate(fee.paymentDate)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(reportHTML);
            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
            }, 500);

            showToast('PDF report generated!', 'success');
        } catch (error) {
            console.error('❌ Error exporting PDF:', error);
            showToast('Error exporting PDF', 'error');
        }
    }

    // Analytics & Reports
    getRevenueByPaymentMode() {
        const modeStats = { cash: 0, upi: 0, card: 0, bank: 0 };
        this.fees.forEach(fee => {
            if (fee.status === 'paid' || fee.status === 'partial') {
                const mode = fee.mode?.toLowerCase() || 'cash';
                if (modeStats.hasOwnProperty(mode)) {
                    modeStats[mode] += fee.amountPaid;
                }
            }
        });
        return modeStats;
    }

    getTotalCollected() {
        return this.fees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);
    }

    getTotalPending() {
        return this.fees.reduce((sum, fee) => sum + (fee.balance || 0), 0);
    }

    // Role-based Access Control
    checkPermission(action) {
        const permissions = {
            admin: ['add', 'edit', 'delete', 'view', 'refund', 'export'],
            counselor: ['add', 'view'],
            teacher: ['view'],
            student: ['view-own']
        };

        const userPermissions = permissions[userRole] || [];
        return userPermissions.includes(action);
    }

    // Edit Fee Record
    async editFee(feeId, updates) {
        try {
            if (!this.checkPermission('edit')) {
                showToast('You do not have permission to edit fees', 'error');
                return;
            }

            await updateDoc(doc(db, 'fees', feeId), {
                ...updates,
                updatedAt: Timestamp.now()
            });

            showToast('Fee record updated successfully!', 'success');
            this.loadFees();
        } catch (error) {
            console.error('❌ Error editing fee:', error);
            showToast('Error updating fee', 'error');
        }
    }

    // Delete Fee Record
    async deleteFee(feeId) {
        try {
            if (!this.checkPermission('delete')) {
                showToast('You do not have permission to delete fees', 'error');
                return;
            }

            if (!confirm('Are you sure you want to delete this fee record?')) {
                return;
            }

            await deleteDoc(doc(db, 'fees', feeId));
            showToast('Fee record deleted successfully!', 'success');
            this.loadFees();
        } catch (error) {
            console.error('❌ Error deleting fee:', error);
            showToast('Error deleting fee', 'error');
        }
    }

    updateAnalytics() {
        let totalRevenue = 0;
        let gamaRevenue = 0;
        let lbsRevenue = 0;
        let captRevenue = 0;
        let totalPending = 0;

        this.fees.forEach(fee => {
            const amountPaid = fee.amountPaid || fee.amount || 0;
            totalRevenue += amountPaid;
            totalPending += fee.balance || 0;

            if (fee.division === 'gama') gamaRevenue += amountPaid;
            if (fee.division === 'lbs') lbsRevenue += amountPaid;
            if (fee.division === 'capt') captRevenue += amountPaid;
        });

        // Update analytics cards
        const totalRevenueEl = document.getElementById('total-revenue');
        const gamaRevenueEl = document.getElementById('gama-revenue');
        const lbsRevenueEl = document.getElementById('lbs-revenue');
        const captRevenueEl = document.getElementById('capt-revenue');
        const totalPendingEl = document.getElementById('total-pending');
        const totalCollectedEl = document.getElementById('total-collected');
        const pendingCountEl = document.getElementById('pending-count');

        if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
        if (gamaRevenueEl) gamaRevenueEl.textContent = formatCurrency(gamaRevenue);
        if (lbsRevenueEl) lbsRevenueEl.textContent = formatCurrency(lbsRevenue);
        if (captRevenueEl) captRevenueEl.textContent = formatCurrency(captRevenue);
        if (totalPendingEl) totalPendingEl.textContent = formatCurrency(totalPending);
        if (totalCollectedEl) totalCollectedEl.textContent = formatCurrency(totalRevenue);
        if (pendingCountEl) pendingCountEl.textContent = this.getPendingFees().length;

        this.updateChart({ gama: gamaRevenue, lbs: lbsRevenue, capt: captRevenue });
        this.updatePaymentModeChart();
    }

    updatePaymentModeChart() {
        const modeStats = this.getRevenueByPaymentMode();
        const ctx = document.getElementById('payment-mode-chart');
        if (!ctx) return;

        if (window.paymentModeChart) {
            window.paymentModeChart.destroy();
        }

        window.paymentModeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cash', 'UPI', 'Card', 'Bank'],
                datasets: [{
                    data: [modeStats.cash, modeStats.upi, modeStats.card, modeStats.bank],
                    backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
                    borderColor: '#1f2937',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#f0f0f0', padding: 15 }
                    }
                }
            }
        });
    }

    renderStudentFeeTable() {
        const tableBody = document.getElementById('all-students-fee-table')?.querySelector('tbody');
        if (!tableBody) {
            console.warn('⚠️ Student fee table not found, using old table structure');
            this.renderTables();
            return;
        }

        tableBody.innerHTML = '';

        if (!this.studentsWithFees || this.studentsWithFees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No students found</td></tr>';
            return;
        }

        this.studentsWithFees.forEach(student => {
            const row = this.createStudentFeeRow(student);
            tableBody.appendChild(row);
        });
    }

    createStudentFeeRow(student) {
        const row = document.createElement('tr');

        // Determine status badge color based on pending days
        let statusClass = 'status-paid';
        let statusText = 'Paid';
        let statusColor = '#10B981'; // Green

        if (student.pendingStatus === 'pending') {
            if (student.pendingDays <= 30) {
                // Current pending (0-30 days) - Yellow
                statusClass = 'status-pending-current';
                statusText = `Pending (${student.pendingDays}d)`;
                statusColor = '#FBB24'; // Yellow
            } else if (student.pendingDays <= 60) {
                // 1 month pending (31-60 days) - Orange
                statusClass = 'status-pending-month';
                statusText = `Overdue (${student.pendingDays}d)`;
                statusColor = '#F97316'; // Orange
            } else {
                // More than 1 month (60+ days) - Red
                statusClass = 'status-pending-critical';
                statusText = `Critical (${student.pendingDays}d)`;
                statusColor = '#EF4444'; // Red
            }
        }

        row.style.backgroundColor = student.pendingStatus === 'pending' ?
            `${statusColor}15` : 'transparent';

        row.innerHTML = `
            <td>
                <img src="${student.photoURL || 'https://i.pinimg.com/736x/38/41/97/384197530d32338dd6caafaf1c6a26c4.jpg'}" 
                     alt="${student.name}" 
                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            </td>
            <td>
                <div>${student.name || 'N/A'}</div>
                <small style="color: #94A3B8;">${student.studentId || 'No ID'}</small>
            </td>
            <td>${student.division || 'N/A'}</td>
            <td>${student.course || '-'}</td>
            <td>${formatCurrency(student.totalPaid || 0)}</td>
            <td>${formatCurrency(student.totalBalance || 0)}</td>
            <td>
                <span class="${statusClass}" style="
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: ${statusColor};
                    background: ${statusColor}30;
                    border: 1px solid ${statusColor}50;
                ">${statusText}</span>
            </td>
            <td>${student.latestFee ? formatDate(student.latestFee.paymentDate) : '-'}</td>
            <td>${student.latestFee?.nextDueDate ? formatDate(student.latestFee.nextDueDate) : '-'}</td>
            <td class="action-buttons">
                <button class="btn-icon" onclick="window.feeManager.viewStudentFeeHistory('${student.id}')" title="View History">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn-icon" onclick="window.feeManager.collectFee('${student.id}')" title="Collect Fee">
                    <i class="fas fa-money-bill-wave"></i>
                </button>
                ${student.pendingStatus === 'pending' ? `
                    <button class="btn-icon" style="color: #F59E0B;" onclick="window.feeManager.sendReminder('${student.id}', '${student.name}')" title="Send Reminder">
                        <i class="fas fa-bell"></i>
                    </button>
                ` : ''}
            </td>
        `;

        return row;
    }

    renderTables() {
        // Render division-specific tables with all students
        this.renderDivisionTable('gama', 'Gama Abacus');
        this.renderDivisionTable('lbs', 'LBS');
        this.renderDivisionTable('capt', 'CAPT');
    }

    renderDivisionTable(divisionId, divisionName) {
        const table = document.getElementById(`${divisionId}-fees-table`)?.querySelector('tbody');
        if (!table) {
            console.log(`⚠️ Table not found for division: ${divisionId}`);
            return;
        }

        table.innerHTML = '';

        console.log(`📊 Rendering ${divisionName} table...`);
        console.log(`Total students with fees:`, this.studentsWithFees?.length || 0);

        // Filter students by division
        const divisionStudents = this.studentsWithFees?.filter(student => {
            const studentDiv = (student.division || '').toLowerCase();
            const matches = studentDiv === divisionId ||
                studentDiv === divisionName.toLowerCase() ||
                (divisionName === 'Gama Abacus' && studentDiv.includes('gama')) ||
                (divisionId === 'lbs' && (studentDiv.includes('lbs') || studentDiv === 'lbs skill centre')) ||
                (divisionId === 'capt' && studentDiv.includes('capt'));

            if (matches) {
                console.log(`✓ Student ${student.name} matched for ${divisionName} (division: ${student.division})`);
            }
            return matches;
        }) || [];

        console.log(`Found ${divisionStudents.length} students in ${divisionName}`);

        const colspan = divisionId === 'gama' ? '9' : '10'; // Gama has one less column

        if (divisionStudents.length === 0) {
            table.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 30px; color: #94A3B8;">No students found in this division</td></tr>`;
            return;
        }

        // Render each student
        divisionStudents.forEach(student => {
            const row = this.createDivisionStudentRow(student, divisionId);
            table.appendChild(row);
        });

        console.log(`✅ Rendered ${divisionStudents.length} students in ${divisionName} table`);
    }

    createDivisionStudentRow(student, divisionId) {
        const row = document.createElement('tr');
        const isGama = divisionId === 'gama';

        // Determine status badge color based on pending days
        let statusClass = 'status-paid';
        let statusText = 'Paid';
        let statusColor = '#10B981'; // Green

        if (student.pendingStatus === 'pending') {
            if (student.pendingDays <= 30) {
                statusClass = 'status-pending-current';
                statusText = `Pending (${student.pendingDays}d)`;
                statusColor = '#FBBF24';
            } else if (student.pendingDays <= 60) {
                statusClass = 'status-pending-month';
                statusText = `Overdue (${student.pendingDays}d)`;
                statusColor = '#F97316';
            } else {
                statusClass = 'status-pending-critical';
                statusText = `Critical (${student.pendingDays}d)`;
                statusColor = '#EF4444';
            }
        }

        row.style.backgroundColor = student.pendingStatus === 'pending' ?
            `${statusColor}15` : 'transparent';

        // Build row HTML - exclude "Total Paid" for Gama Abacus (pay-as-you-go)
        row.innerHTML = `
            <td>
                <img src="${student.photoURL || 'https://i.pinimg.com/736x/38/41/97/384197530d32338dd6caafaf1c6a26c4.jpg'}" 
                     alt="${student.name}" 
                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            </td>
            <td>
                <div>${student.name || 'N/A'}</div>
                <small style="color: #94A3B8;">${student.studentId || 'No ID'}</small>
            </td>
            <td>${student.course || '-'}</td>
            ${!isGama ? `<td>${formatCurrency(student.totalPaid || 0)}</td>` : ''}
            <td>${formatCurrency(student.totalBalance || 0)}</td>
            <td>
                <span class="${statusClass}" style="
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: ${statusColor};
                    background: ${statusColor}30;
                    border: 1px solid ${statusColor}50;
                ">${statusText}</span>
            </td>
            <td>${student.latestFee ? formatDate(student.latestFee.paymentDate) : '-'}</td>
            <td>${student.latestFee?.nextDueDate ? formatDate(student.latestFee.nextDueDate) : '-'}</td>
            <td>${student.latestFee?.receiptNo || '-'}</td>
            <td class="action-buttons">
                <button class="btn-icon" onclick="window.feeManager.viewStudentFeeHistory('${student.id}')" title="View History">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn-icon" onclick="window.feeManager.collectFee('${student.id}')" title="Collect Fee">
                    <i class="fas fa-money-bill-wave"></i>
                </button>
                ${student.pendingStatus === 'pending' ? `
                    <button class="btn-icon" style="color: #F59E0B;" onclick="window.feeManager.sendReminder('${student.id}', '${student.name}')" title="Send Reminder">
                        <i class="fas fa-bell"></i>
                    </button>
                ` : ''}
            </td>
        `;

        return row;
    }

    createTableRow(fee) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fee.studentId}</td>
            <td>${fee.studentName || 'N/A'}</td>
            <td>${fee.type}</td>
            <td>${formatCurrency(fee.amountPaid)}</td>
            <td>${formatCurrency(fee.balance || 0)}</td>
            <td>${formatDate(fee.paymentDate)}</td>
            <td>${fee.mode}</td>
            <td><span class="status-badge status-${fee.status}">${fee.status}</span></td>
            <td>${fee.receiptNo}</td>
            <td class="action-buttons">
                <button class="btn-icon" onclick="window.feeManager.generateReceipt('${fee.id}')" title="Generate Receipt">
                    <i class="fas fa-receipt"></i>
                </button>
                ${fee.balance > 0 ? `
                    <button class="btn-icon" onclick="window.feeManager.sendReminder('${fee.studentId}', '${fee.studentName}')" title="Send Reminder">
                        <i class="fas fa-bell"></i>
                    </button>
                ` : ''}
                ${this.checkPermission('delete') ? `
                    <button class="btn-icon btn-danger" onclick="window.feeManager.deleteFee('${fee.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        `;
        return row;
    }

    initializeChart() {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Gama', 'LBS', 'CAPT'],
                datasets: [{
                    label: 'Revenue by Division',
                    data: [0, 0, 0],
                    backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)'],
                    borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)', 'rgba(245, 158, 11, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#f0f0f0' }, grid: { color: '#444' } },
                    x: { ticks: { color: '#f0f0f0' }, grid: { color: '#444' } }
                },
                plugins: { legend: { labels: { color: '#f0f0f0' } } }
            }
        });
    }

    updateChart(data) {
        if (revenueChart) {
            revenueChart.data.datasets[0].data = [data.gama, data.lbs, data.capt];
            revenueChart.update();
        }
    }

    // ============================================
    // PENDING FEES MODAL FUNCTIONS
    // ============================================

    async showPendingFeesModal() {
        console.log('🚀 Opening Outstanding Fees Modal...');

        const modal = document.getElementById('pending-fees-modal');
        if (!modal) {
            console.error('❌ Modal element not found! ID: pending-fees-modal');
            showToast('Error: Modal not found', 'error');
            return;
        }

        console.log('✅ Modal found, displaying...');
        modal.style.display = 'flex';

        try {
            await this.loadPendingFees();
            this.setupPendingFeesListeners();
            console.log('✅ Modal fully loaded');
        } catch (error) {
            console.error('❌ Error loading pending fees modal:', error);
            showToast('Error loading outstanding fees: ' + error.message, 'error');
        }
    }

    async loadPendingFees() {
        try {
            console.log('📊 Loading fee status report...');

            // Show loading state
            const tbody = document.getElementById('pending-fees-tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="12" style="text-align: center; padding: 40px;">
                            <div class="spinner" style="margin: 0 auto 10px;"></div>
                            <div style="color: #94A3B8;">Loading fee status...</div>
                        </td>
                    </tr>
                `;
            }

            // Use the same studentsWithFees data from loadFees()
            if (!this.studentsWithFees || this.studentsWithFees.length === 0) {
                console.log('⚠️ No studentsWithFees data found, loading fresh...');
                await this.loadFees();
            }

            console.log(`📋 Processing ${this.studentsWithFees.length} students with fee data`);

            // Build status list from studentsWithFees (same as main table)
            const pendingList = [];
            let totalPendingAmount = 0;

            this.studentsWithFees.forEach(student => {
                const balance = student.totalBalance || 0;
                const totalPaid = student.totalPaid || 0;
                const totalFee = totalPaid + balance; // Calculate total fee

                // Use the same pendingStatus and pendingDays from main table
                const pendingStatus = student.pendingStatus || 'paid';
                const pendingDays = student.pendingDays || 0;

                // Only count unpaid balance in total
                if (balance > 0) {
                    totalPendingAmount += balance;
                }

                // Determine status label
                let statusLabel = 'PAID';
                if (balance > 0) {
                    if (pendingDays > 60) statusLabel = 'CRITICAL';
                    else if (pendingDays > 30) statusLabel = 'OVERDUE';
                    else statusLabel = 'PENDING';
                }

                console.log(`💰 ${statusLabel}:`, student.name, '- Balance:', balance.toFixed(2), '- Days:', pendingDays);

                // Get last payment date from latest fee
                const lastPaymentDate = student.latestFee?.paymentDate || null;

                // Add all students EXCEPT those with "paid" status
                // This includes: pending, overdue, critical, and even those with issues (NaN, ₹0 with status)
                if (pendingStatus !== 'paid') {
                    pendingList.push({
                        studentName: student.name || 'N/A',
                        studentId: student.studentId || student.id,
                        division: student.division || 'N/A',
                        course: student.course || 'N/A',
                        batch: student.batch || 'N/A',
                        phone: student.phone || 'N/A',
                        email: student.email || 'N/A',
                        totalFee: totalFee,
                        totalPaid: totalPaid,
                        balance: balance,
                        lastPaymentDate: lastPaymentDate,
                        daysOverdue: pendingDays,
                        admissionDate: student.admissionDate || 'N/A',
                        pendingStatus: pendingStatus
                    });
                }
            });

            // Sort by priority: Critical > Overdue > Pending, then by balance (highest first)
            pendingList.sort((a, b) => {
                // Priority order: Critical (>60) > Overdue (>30) > Pending (0-30)
                if (a.daysOverdue > 60 && b.daysOverdue <= 60) return -1;
                if (a.daysOverdue <= 60 && b.daysOverdue > 60) return 1;
                if (a.daysOverdue > 30 && b.daysOverdue <= 30) return -1;
                if (a.daysOverdue <= 30 && b.daysOverdue > 30) return 1;

                // Same priority - sort by balance (highest first)
                return b.balance - a.balance;
            });

            // Count by status (all have balance > 0)
            const pending = pendingList.filter(p => p.daysOverdue <= 30).length;
            const overdue = pendingList.filter(p => p.daysOverdue > 30 && p.daysOverdue <= 60).length;
            const critical = pendingList.filter(p => p.daysOverdue > 60).length;

            console.log('📊 Outstanding fees breakdown:', { pending, overdue, critical });

            // Update UI
            document.getElementById('total-pending-amount').textContent = formatCurrency(totalPendingAmount);
            document.getElementById('pending-students-count').textContent = pendingList.length;

            // Store for export
            this.currentPendingFees = pendingList;

            // Render table
            this.renderPendingFeesTable(pendingList);

            showToast(`${pendingList.length} students with outstanding fees: ${critical} Critical, ${overdue} Overdue, ${pending} Pending`, 'info');

        } catch (error) {
            console.error('❌ Error loading pending fees:', error);
            showToast('Error loading pending fees', 'error');
        }
    }

    renderPendingFeesTable(pendingList) {
        const tbody = document.getElementById('pending-fees-tbody');
        if (!tbody) return;

        if (pendingList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align: center; padding: 40px; color: #64748B;">
                        <i class="fas fa-check-circle" style="font-size: 48px; color: #10B981; margin-bottom: 10px;"></i>
                        <div style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">All Clear!</div>
                        <div>No pending fees found</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pendingList.map((item, index) => {
            let overdueClass = '';
            let overdueBadge = '';
            let statusIcon = '';

            // Ensure daysOverdue is a valid number
            const daysOverdue = isNaN(item.daysOverdue) ? 90 : Math.max(0, item.daysOverdue);
            const daysText = isNaN(item.daysOverdue) ? '?' : Math.floor(daysOverdue);
            const balance = parseFloat(item.balance) || 0;

            // Check if fully paid first
            if (balance <= 0) {
                // Paid - Fully settled
                overdueClass = '';
                overdueBadge = '<span class="pending-badge" style="background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid #10B981;"><i class="fas fa-check-circle"></i> PAID</span>';
                statusIcon = '✅';
            } else if (daysOverdue > 60) {
                // Critical - Overdue more than 60 days
                overdueClass = 'overdue-critical';
                overdueBadge = `<span class="pending-badge critical"><i class="fas fa-exclamation-triangle"></i> CRITICAL (${daysText}d)</span>`;
                statusIcon = '�';
            } else if (daysOverdue > 30) {
                // Overdue - Between 31-60 days
                overdueClass = 'overdue-warning';
                overdueBadge = `<span class="pending-badge warning"><i class="fas fa-clock"></i> OVERDUE (${daysText}d)</span>`;
                statusIcon = '�';
            } else {
                // Pending - 0-30 days
                overdueClass = 'overdue-recent';
                overdueBadge = `<span class="pending-badge recent"><i class="fas fa-hourglass-half"></i> PENDING (${daysText}d)</span>`;
                statusIcon = '�';
            }

            // Set row class and balance color based on status (all have balance > 0)
            let rowClass = '';
            let balanceColor = '';

            if (daysOverdue > 60) {
                rowClass = 'status-row-critical';
                balanceColor = '#EF4444';
            } else if (daysOverdue > 30) {
                rowClass = 'status-row-overdue';
                balanceColor = '#F59E0B';
            } else {
                rowClass = 'status-row-pending';
                balanceColor = '#EAB308';
            }

            return `
                <tr class="${rowClass}">
                    <td>${index + 1}</td>
                    <td style="font-weight: 600;">${item.studentName}</td>
                    <td>${item.studentId}</td>
                    <td>${item.division}</td>
                    <td>${item.course}</td>
                    <td>${item.batch}</td>
                    <td>${item.phone}</td>
                    <td>${formatCurrency(item.totalFee)}</td>
                    <td style="color: #10B981;">${formatCurrency(item.totalPaid)}</td>
                    <td style="font-weight: 700; color: ${balanceColor};">${formatCurrency(item.balance)}</td>
                    <td>${formatDate(item.lastPaymentDate)}</td>
                    <td>${overdueBadge}</td>
                </tr>
            `;
        }).join('');
    }

    setupPendingFeesListeners() {
        // Search functionality
        const searchInput = document.getElementById('pending-search');
        if (searchInput) {
            searchInput.removeEventListener('input', this.handlePendingSearch);
            searchInput.addEventListener('input', this.handlePendingSearch.bind(this));
        }

        // Division filter
        const divisionFilter = document.getElementById('pending-division-filter');
        if (divisionFilter) {
            divisionFilter.removeEventListener('change', this.handlePendingFilter);
            divisionFilter.addEventListener('change', this.handlePendingFilter.bind(this));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-pending');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadPendingFees();
        }

        // Download buttons
        const excelBtn = document.getElementById('download-pending-excel');
        const pdfBtn = document.getElementById('download-pending-pdf');

        if (excelBtn) {
            excelBtn.onclick = () => this.exportPendingToExcel();
        }

        if (pdfBtn) {
            pdfBtn.onclick = () => this.exportPendingToPDF();
        }
    }

    handlePendingSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = this.currentPendingFees.filter(item =>
            item.studentName.toLowerCase().includes(searchTerm) ||
            item.studentId.toLowerCase().includes(searchTerm) ||
            item.division.toLowerCase().includes(searchTerm) ||
            item.phone.includes(searchTerm)
        );
        this.renderPendingFeesTable(filtered);
    }

    handlePendingFilter(e) {
        const divisionValue = e.target.value;
        if (divisionValue === 'all') {
            this.renderPendingFeesTable(this.currentPendingFees);
        } else {
            const filtered = this.currentPendingFees.filter(item => {
                const divLower = item.division.toLowerCase();
                return divLower.includes(divisionValue);
            });
            this.renderPendingFeesTable(filtered);
        }
    }

    exportPendingToExcel() {
        if (!this.currentPendingFees || this.currentPendingFees.length === 0) {
            showToast('No pending fees to export', 'warning');
            return;
        }

        try {
            // Create CSV content with main details only
            const headers = ['#', 'Name', 'Student ID', 'Division', 'Course', 'Batch', 'Mobile No.', 'Email', 'Total Fee', 'Paid', 'Balance', 'Last Payment', 'Admission Date'];
            const rows = this.currentPendingFees.map((item, index) => [
                index + 1,
                item.studentName,
                item.studentId,
                item.division,
                item.course,
                item.batch,
                item.phone,
                item.email,
                item.totalFee,
                item.totalPaid,
                item.balance,
                formatDate(item.lastPaymentDate),
                item.admissionDate
            ]);

            let csvContent = headers.join(',') + '\n';
            rows.forEach(row => {
                csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
            });

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().split('T')[0];

            link.setAttribute('href', url);
            link.setAttribute('download', `Pending_Fees_${timestamp}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('✅ Excel file downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            showToast('Error exporting to Excel', 'error');
        }
    }

    exportPendingToPDF() {
        if (!this.currentPendingFees || this.currentPendingFees.length === 0) {
            showToast('No pending fees to export', 'warning');
            return;
        }

        try {
            // Create a printable HTML
            const timestamp = new Date().toLocaleString('en-IN');
            const totalPending = this.currentPendingFees.reduce((sum, item) => sum + item.balance, 0);

            let htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Pending Fees Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #1e40af; text-align: center; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        .legend { display: flex; gap: 20px; justify-content: center; margin-bottom: 20px; font-size: 12px; }
                        .legend-item { display: flex; align-items: center; gap: 5px; }
                        .legend-box { width: 15px; height: 15px; border-radius: 3px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #1e40af; color: white; padding: 12px; text-align: left; font-size: 12px; }
                        td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
                        
                        /* Status-based row colors */
                        .row-paid { background: rgba(16, 185, 129, 0.08) !important; }
                        .row-pending { background: rgba(234, 179, 8, 0.08) !important; }
                        .row-overdue { background: rgba(251, 191, 36, 0.1) !important; }
                        .row-critical { background: rgba(239, 68, 68, 0.1) !important; }
                        
                        /* Balance text colors */
                        .balance-paid { color: #10B981; font-weight: bold; }
                        .balance-pending { color: #EAB308; font-weight: bold; }
                        .balance-overdue { color: #F59E0B; font-weight: bold; }
                        .balance-critical { color: #EF4444; font-weight: bold; }
                        
                        /* Status badges */
                        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; display: inline-block; }
                        .badge-paid { background: #10B981; color: white; }
                        .badge-pending { background: #EAB308; color: white; }
                        .badge-overdue { background: #F59E0B; color: white; }
                        .badge-critical { background: #EF4444; color: white; }
                        
                        .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Pending Fees Report</h1>
                        <p>MicroTech Center | Generated on: ${timestamp}</p>
                    </div>
                    
                    <div class="summary">
                        <strong>Total Pending Amount:</strong> ₹${totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                        <strong>Number of Students:</strong> ${this.currentPendingFees.length}
                    </div>
                    
                    <div class="legend">
                        <div class="legend-item">
                            <div class="legend-box" style="background: rgba(234, 179, 8, 0.3);"></div>
                            <span><strong>PENDING</strong> - 0-30 days unpaid</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box" style="background: rgba(251, 191, 36, 0.3);"></div>
                            <span><strong>OVERDUE</strong> - 31-60 days unpaid</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box" style="background: rgba(239, 68, 68, 0.3);"></div>
                            <span><strong>CRITICAL</strong> - > 60 days unpaid</span>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>ID</th>
                                <th>Division</th>
                                <th>Course</th>
                                <th>Batch</th>
                                <th>Mobile</th>
                                <th>Total Fee</th>
                                <th>Paid</th>
                                <th>Balance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            this.currentPendingFees.forEach((item, index) => {
                const balance = parseFloat(item.balance) || 0;
                const daysOverdue = item.daysOverdue || 0;

                // Determine row class and status (all students have balance > 0)
                let rowClass = '';
                let balanceClass = '';
                let statusBadge = '';

                if (daysOverdue > 60) {
                    rowClass = 'row-critical';
                    balanceClass = 'balance-critical';
                    statusBadge = `<span class="status-badge badge-critical">! CRITICAL (${daysOverdue}d)</span>`;
                } else if (daysOverdue > 30) {
                    rowClass = 'row-overdue';
                    balanceClass = 'balance-overdue';
                    statusBadge = `<span class="status-badge badge-overdue">OVERDUE (${daysOverdue}d)</span>`;
                } else {
                    rowClass = 'row-pending';
                    balanceClass = 'balance-pending';
                    statusBadge = `<span class="status-badge badge-pending">PENDING (${daysOverdue}d)</span>`;
                }

                htmlContent += `
                    <tr class="${rowClass}">
                        <td>${index + 1}</td>
                        <td>${item.studentName}</td>
                        <td>${item.studentId}</td>
                        <td>${item.division}</td>
                        <td>${item.course}</td>
                        <td>${item.batch}</td>
                        <td>${item.phone}</td>
                        <td>₹${item.totalFee.toLocaleString('en-IN')}</td>
                        <td style="color: #10B981;">₹${item.totalPaid.toLocaleString('en-IN')}</td>
                        <td class="${balanceClass}">₹${item.balance.toLocaleString('en-IN')}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });

            htmlContent += `
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>This is a computer-generated report. © ${new Date().getFullYear()} MicroTech Center</p>
                    </div>
                </body>
                </html>
            `;

            // Open in new window and trigger print
            const printWindow = window.open('', '_blank');
            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Auto print after content loads
            printWindow.onload = () => {
                printWindow.print();
                showToast('✅ PDF print dialog opened!', 'success');
            };

        } catch (error) {
            console.error('Error exporting to PDF:', error);
            showToast('Error exporting to PDF', 'error');
        }
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
let feeManager = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Fee Management Module - Initializing...');

    try {
        // Check authentication
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                console.log('✅ User authenticated:', user.email);
            } else {
                console.log('ℹ️ No user authenticated - demo mode');
            }
        });

        // Initialize Fee Manager
        feeManager = new FeeManager();
        await feeManager.init();

        window.feeManager = feeManager;
        console.log('✅ Fee Manager initialized');
    } catch (error) {
        console.error('❌ Error initializing:', error);
        showToast('Error initializing system', 'error');
    }
});

// ============================================
// RECEIPT MANAGEMENT FUNCTIONS
// ============================================

/**
 * Show Receipt Preview Modal
 * @param {Object} receiptData - Receipt data object
 */
function showReceiptPreview(receiptData) {
    try {
        // Store receipt data globally for PDF generation
        currentReceiptData = receiptData;

        // Generate receipt HTML
        const receiptHTML = generateReceiptHTML(receiptData);

        // Create a temporary container to extract just the body content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = receiptHTML;
        const bodyContent = tempDiv.querySelector('.receipt-container');

        // Inject into preview modal
        const previewContent = document.getElementById('receipt-preview-content');
        if (previewContent && bodyContent) {
            previewContent.innerHTML = '';
            previewContent.appendChild(bodyContent.cloneNode(true));
        }

        // Show modal
        const modal = document.getElementById('receipt-preview-modal');
        if (modal) {
            modal.style.display = 'flex';
        }

        console.log('✅ Receipt preview displayed');
    } catch (error) {
        console.error('❌ Error showing receipt preview:', error);
        showToast('Error displaying receipt', 'error');
    }
}

/**
 * Close Receipt Preview Modal
 */
window.closeReceiptPreview = function () {
    const modal = document.getElementById('receipt-preview-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentReceiptData = null;
};

/**
 * Print Receipt from Preview
 */
window.printReceiptFromPreview = function () {
    if (!currentReceiptData) {
        showToast('No receipt data available', 'error');
        return;
    }

    try {
        // Generate full receipt HTML
        const receiptHTML = generateReceiptHTML(currentReceiptData);

        // Open in new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = function () {
            printWindow.focus();
            printWindow.print();
        };

        showToast('Opening print dialog...', 'info');
        console.log('✅ Receipt sent to printer');
    } catch (error) {
        console.error('❌ Error printing receipt:', error);
        showToast('Error printing receipt', 'error');
    }
};

/**
 * Download Receipt as PDF
 */
window.downloadReceiptPDF = async function () {
    if (!currentReceiptData) {
        showToast('No receipt data available', 'error');
        return;
    }

    try {
        showToast('Generating PDF...', 'info');

        // Get the receipt container from preview
        const receiptContainer = document.querySelector('#receipt-preview-content .receipt-container');

        if (!receiptContainer) {
            throw new Error('Receipt content not found');
        }

        // Use html2canvas to capture the receipt
        const canvas = await html2canvas(receiptContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png');

        // Create PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Calculate dimensions to fit A4
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        // Generate filename
        const filename = `Receipt_${currentReceiptData.receiptNo}_${currentReceiptData.studentName.replace(/\s+/g, '_')}.pdf`;

        // Save PDF
        pdf.save(filename);

        showToast('PDF downloaded successfully!', 'success');
        console.log('✅ PDF generated:', filename);
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        showToast('Error generating PDF: ' + error.message, 'error');
    }
};

/**
 * Share Receipt via WhatsApp (Placeholder)
 */
window.shareReceiptWhatsApp = function () {
    if (!currentReceiptData) {
        showToast('No receipt data available', 'error');
        return;
    }

    try {
        const message = `
*MicroTech Center - Fee Receipt*

Receipt No: ${currentReceiptData.receiptNo}
Student: ${currentReceiptData.studentName}
Amount Paid: ₹${currentReceiptData.amountPaid.toLocaleString('en-IN')}
Balance: ₹${currentReceiptData.balance.toLocaleString('en-IN')}
Date: ${new Date(currentReceiptData.paymentDate).toLocaleDateString('en-IN')}

Thank you for your payment!
        `.trim();

        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp with pre-filled message
        // Note: This requires a phone number. For now, just open WhatsApp web
        const whatsappURL = `https://wa.me/?text=${encodedMessage}`;

        window.open(whatsappURL, '_blank');

        showToast('Opening WhatsApp...', 'info');
        console.log('✅ WhatsApp share initiated');
    } catch (error) {
        console.error('❌ Error sharing via WhatsApp:', error);
        showToast('Error sharing receipt', 'error');
    }
};

/**
 * View Receipt from Fee History
 * @param {Object} feeData - Fee record data
 */
window.viewFeeReceipt = function (feeData) {
    const receiptData = {
        receiptNo: feeData.receiptNo,
        receiptDate: feeData.paymentDate,
        studentName: feeData.studentName,
        studentId: feeData.studentId,
        division: feeData.division,
        course: feeData.course,
        totalFee: feeData.totalFee,
        amountPaid: feeData.amountPaid,
        balance: feeData.balance,
        paymentMode: feeData.mode,
        paymentDate: feeData.paymentDate,
        counselor: feeData.counselorID,
        feeType: feeData.type,
        notes: feeData.notes,
        transactionID: feeData.transactionID
    };

    showReceiptPreview(receiptData);
};

console.log('✅ Receipt management functions loaded');
