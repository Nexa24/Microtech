import { db, auth } from '../firebase.js';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter, 
    getCountFromServer, 
    doc, 
    getDoc, 
    addDoc, 
    updateDoc,
    deleteDoc,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { showToast } from './toast.js';
import { initializeUserProfile, addProfileStyles } from './profile-utils.js';

// =============================================================================
// BULK OPERATIONS SYSTEM
// =============================================================================

// Global variables for bulk operations
let selectedStudents = new Set();

// Setup bulk operations event listeners
function setupBulkOperations() {
    // Master checkbox (select all)
    const masterCheckbox = document.getElementById('select-all-students');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    
    if (masterCheckbox) {
        masterCheckbox.addEventListener('change', handleMasterCheckboxChange);
    }
    
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', openBulkDeleteModal);
    }
    
    // Bulk delete modal event listeners
    const passwordModal = document.getElementById('bulk-delete-password-modal');
    const passwordClose = document.getElementById('bulk-delete-password-modal-close');
    const passwordCancel = document.getElementById('bulk-delete-password-cancel');
    const passwordConfirm = document.getElementById('bulk-delete-password-confirm');
    const passwordInput = document.getElementById('bulk-delete-password');
    
    if (passwordClose) passwordClose.addEventListener('click', closeBulkDeleteModal);
    if (passwordCancel) passwordCancel.addEventListener('click', closeBulkDeleteModal);
    if (passwordConfirm) passwordConfirm.addEventListener('click', confirmBulkDelete);
    
    // Enter key in password input
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                confirmBulkDelete();
            }
        });
    }
    
    // Close modal when clicking outside
    if (passwordModal) {
        passwordModal.addEventListener('click', function(e) {
            if (e.target === passwordModal) {
                closeBulkDeleteModal();
            }
        });
    }
}

// Handle master checkbox change
function handleMasterCheckboxChange() {
    const masterCheckbox = document.getElementById('select-all-students');
    const isChecked = masterCheckbox.checked;
    
    // Get all individual checkboxes
    const individualCheckboxes = document.querySelectorAll('.student-checkbox');
    
    // Update all individual checkboxes
    individualCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        handleStudentCheckboxChange(checkbox);
    });
}

// Handle individual student checkbox change
function handleStudentCheckboxChange(checkbox) {
    const studentId = checkbox.getAttribute('data-student-id');
    
    if (checkbox.checked) {
        selectedStudents.add(studentId);
    } else {
        selectedStudents.delete(studentId);
        // Uncheck master checkbox if any individual checkbox is unchecked
        const masterCheckbox = document.getElementById('select-all-students');
        if (masterCheckbox) {
            masterCheckbox.checked = false;
        }
    }
    
    updateBulkDeleteButton();
    updateMasterCheckboxState();
}

// Update bulk delete button visibility and text
function updateBulkDeleteButton() {
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const selectedCount = selectedStudents.size;
    
    if (bulkDeleteBtn) {
        if (selectedCount > 0) {
            bulkDeleteBtn.style.display = 'inline-flex';
            const countSpan = bulkDeleteBtn.querySelector('.selected-count');
            if (countSpan) {
                countSpan.textContent = selectedCount;
            }
        } else {
            bulkDeleteBtn.style.display = 'none';
        }
    }
}

// Update master checkbox state based on individual selections
function updateMasterCheckboxState() {
    const masterCheckbox = document.getElementById('select-all-students');
    const individualCheckboxes = document.querySelectorAll('.student-checkbox');
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    
    if (masterCheckbox && individualCheckboxes.length > 0) {
        if (checkedBoxes.length === individualCheckboxes.length) {
            masterCheckbox.checked = true;
            masterCheckbox.indeterminate = false;
        } else if (checkedBoxes.length > 0) {
            masterCheckbox.checked = false;
            masterCheckbox.indeterminate = true;
        } else {
            masterCheckbox.checked = false;
            masterCheckbox.indeterminate = false;
        }
    }
}

// Open bulk delete modal
function openBulkDeleteModal() {
    const modal = document.getElementById('bulk-delete-password-modal');
    const countElement = document.getElementById('bulk-delete-count');
    const passwordInput = document.getElementById('bulk-delete-password');
    const errorElement = document.getElementById('password-error');
    
    if (modal && countElement) {
        countElement.textContent = selectedStudents.size;
        passwordInput.value = '';
        errorElement.style.display = 'none';
        modal.style.display = 'flex';
        
        // Focus on password input
        setTimeout(() => passwordInput.focus(), 100);
    }
}

// Close bulk delete modal
function closeBulkDeleteModal() {
    const modal = document.getElementById('bulk-delete-password-modal');
    const passwordInput = document.getElementById('bulk-delete-password');
    const errorElement = document.getElementById('password-error');
    
    if (modal) {
        modal.style.display = 'none';
        passwordInput.value = '';
        errorElement.style.display = 'none';
    }
}

// Confirm bulk delete with password validation
async function confirmBulkDelete() {
    const passwordInput = document.getElementById('bulk-delete-password');
    const errorElement = document.getElementById('password-error');
    const confirmBtn = document.getElementById('bulk-delete-password-confirm');
    const password = passwordInput.value;
    
    // Validate password
    if (password !== 'jenny22*') {
        errorElement.style.display = 'block';
        passwordInput.focus();
        return;
    }
    
    // Disable button and show loading
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    
    try {
        await performBulkDelete();
        closeBulkDeleteModal();
        showToast('Students deleted successfully', 'success');
        
        // Clear selections and reload
        selectedStudents.clear();
        updateBulkDeleteButton();
        await loadAllStudents();
    } catch (error) {
        console.error('Bulk delete error:', error);
        showToast('Error deleting students: ' + error.message, 'error');
    } finally {
        // Reset button
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Delete Students';
    }
}

// Perform the actual bulk delete operation
async function performBulkDelete() {
    const promises = Array.from(selectedStudents).map(async (studentId) => {
        try {
            const studentRef = doc(db, 'users', studentId);
            await deleteDoc(studentRef);
            return { success: true, id: studentId };
        } catch (error) {
            console.error(`Failed to delete student ${studentId}:`, error);
            return { success: false, id: studentId, error: error.message };
        }
    });
    
    const results = await Promise.allSettled(promises);
    
    // Check for any failures
    const failures = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.success)
    );
    
    if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} out of ${selectedStudents.size} students`);
    }
}

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isDropdownOpen = false;
        this.storageKey = 'microtech_notifications';
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.updateBadge();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.notifications = data.map(notification => ({
                    ...notification,
                    timestamp: new Date(notification.timestamp)
                }));
                this.updateUnreadCount();
            } else {
                this.loadDefaultNotifications();
            }
        } catch (error) {
            console.error('Error loading notifications from storage:', error);
            this.loadDefaultNotifications();
        }
    }

    saveToStorage() {
        try {
            const data = this.notifications.map(notification => ({
                ...notification,
                timestamp: notification.timestamp.toISOString()
            }));
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving notifications to storage:', error);
        }
    }

    loadDefaultNotifications() {
        // Load some sample notifications on first load
        const defaultNotifications = [
            {
                type: 'info',
                title: 'Welcome to MicroTech Dashboard',
                message: 'Notification system is now active. You will receive updates here.'
            },
            {
                type: 'success',
                title: 'System Ready',
                message: 'All dashboard features are loaded and ready to use.'
            }
        ];

        defaultNotifications.forEach(notification => {
            this.addNotification(notification, false); // Don't save to storage yet
        });
    }

    bindEvents() {
        const notificationBell = document.getElementById('notification-bell');
        const notificationsContainer = document.getElementById('notifications-container');
        const markAllRead = document.getElementById('mark-all-read');

        if (notificationBell) {
            notificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        if (markAllRead) {
            markAllRead.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationsContainer?.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (!dropdown) return;

        this.isDropdownOpen = !this.isDropdownOpen;
        
        if (this.isDropdownOpen) {
            dropdown.classList.add('show');
            this.renderNotifications();
        } else {
            dropdown.classList.remove('show');
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
            this.isDropdownOpen = false;
        }
    }

    addNotification(notification, saveToStorage = true) {
        const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        this.updateUnreadCount();
        this.updateBadge();
        
        if (this.isDropdownOpen) {
            this.renderNotifications();
        }

        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        if (saveToStorage) {
            this.saveToStorage();
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.updateUnreadCount();
            this.updateBadge();
            this.renderNotifications();
            this.saveToStorage();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.updateUnreadCount();
        this.updateBadge();
        this.renderNotifications();
        this.saveToStorage();
        showToast('All notifications marked as read', 'success');
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    renderNotifications() {
        const list = document.getElementById('notifications-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div style="padding: 40px 20px; text-align: center; color: #9CA3AF;">
                    <i class="fas fa-bell-slash" style="font-size: 32px; margin-bottom: 12px; display: block;"></i>
                    No notifications yet
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${!notification.read ? 'unread' : ''}" 
                 onclick="notificationManager.markAsRead(${notification.id})">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${this.getIconClass(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getIconClass(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    // Public methods for integration with student management system
    notifyStudentAdded(studentName) {
        this.addNotification({
            type: 'success',
            title: 'Student Added',
            message: `${studentName} has been successfully registered.`
        });
    }

    notifyStudentUpdated(studentName) {
        this.addNotification({
            type: 'info',
            title: 'Student Updated',
            message: `${studentName}'s information has been updated.`
        });
    }

    notifyStudentDeleted(studentName) {
        this.addNotification({
            type: 'warning',
            title: 'Student Deleted',
            message: `${studentName} has been removed from the system.`
        });
    }

    notifyExportComplete(type, count) {
        this.addNotification({
            type: 'success',
            title: `${type} Export Complete`,
            message: `Successfully exported ${count} student records.`
        });
    }

    notifyBulkUploadComplete(count) {
        this.addNotification({
            type: 'success',
            title: 'Bulk Upload Complete',
            message: `Successfully imported ${count} student records.`
        });
    }

    notifyError(title, message) {
        this.addNotification({
            type: 'error',
            title: title,
            message: message
        });
    }
}

// Initialize notification manager
let notificationManager;

// Make notification manager globally accessible
window.notificationManager = null;

// =============================================================================
// UNIQUE STUDENT ID GENERATION SYSTEM
// =============================================================================

/**
 * Generates a unique student ID with automatic sequential numbering
 * Format: std-division-XXXX
 * Example: std-gama-0001, std-capt-0002, std-lbs-0003
 */
async function generateUniqueStudentId(division) {
    try {
        // Get division prefix
        const divisionPrefix = getDivisionPrefix(division);
        
        // Query to find the last student ID with this division prefix
        const usersRef = collection(db, "users");
        const divisionPattern = `std-${divisionPrefix}`;
        
        // Get all students with IDs starting with this division prefix
        const q = query(
            usersRef,
            where("studentId", ">=", divisionPattern),
            where("studentId", "<=", divisionPattern + "\uf8ff"),
            orderBy("studentId", "desc"),
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        let sequence = 1;
        
        if (!snapshot.empty) {
            // Extract the sequence number from the last ID
            const lastId = snapshot.docs[0].data().studentId;
            const lastSequence = parseInt(lastId.split('-')[2], 10);
            sequence = lastSequence + 1;
        }
        
        // Format sequence with leading zeros (4 digits)
        const sequenceStr = String(sequence).padStart(4, '0');
        
        // Generate final ID
        const studentId = `std-${divisionPrefix}-${sequenceStr}`;
        
        console.log('✅ Generated Student ID:', studentId);
        return studentId;
        
    } catch (error) {
        console.error('❌ Error generating student ID:', error);
        // Fallback to timestamp-based ID
        const timestamp = Date.now();
        const fallbackId = `std-${timestamp}`;
        console.warn('⚠️ Using fallback ID:', fallbackId);
        return fallbackId;
    }
}

/**
 * Gets the division prefix for student IDs (lowercase)
 */
function getDivisionPrefix(division) {
    const prefixes = {
        'CAPT': 'capt',
        'LBS': 'lbs',
        'Gama Abacus': 'gama',
        'OTHERS': 'others'
    };
    
    return prefixes[division] || 'std';
}

/**
 * Validates if a student ID is unique
 */
async function isStudentIdUnique(studentId) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("studentId", "==", studentId), limit(1));
        const snapshot = await getDocs(q);
        return snapshot.empty;
    } catch (error) {
        console.error('Error checking student ID uniqueness:', error);
        return false;
    }
}

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        console.log('Testing Firestore connection...');
        const testRef = collection(db, "users");
        const testSnapshot = await getDocs(query(testRef, limit(1)));
        console.log('✅ Firestore connection successful, found', testSnapshot.docs.length, 'documents');
        return true;
    } catch (error) {
        console.error('❌ Firestore connection failed:', error);
        showToast('Database connection failed: ' + error.message, 'error');
        
        // Add error notification
        if (notificationManager) {
            notificationManager.notifyError('Database Connection Failed', 'Unable to connect to the database. Please check your internet connection.');
        }
        
        return false;
    }
}

/**
 * Loads the main student analytics data from the 'users' collection and updates the UI.
 */
async function loadStudentAnalytics() {
    console.log('Loading student analytics...');
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map(doc => doc.data());

        // Perform analytics calculations
        const total = users.length;
        const capt = users.filter(u => u.division === "CAPT").length;
        const lbs = users.filter(u => u.division === "LBS").length;
        const gama = users.filter(u => u.division === "Gama Abacus").length;
        const pending = users.filter(u => u.feeStatus === "Pending").length;
        const active = users.filter(u => u.status === "active").length;
        const inactive = users.filter(u => u.status === "inactive").length;

        // Update UI elements safely
        const updateElementText = (id, text) => {
            const element = document.getElementById(id);
            if (element) {
                element.innerText = text;
            } else {
                console.warn(`UI element with id '${id}' not found.`);
            }
        };

        updateElementText("total-students", total);
        updateElementText("capt-students", capt);
        updateElementText("lbs-students", lbs);
        updateElementText("gama-students", gama);
        updateElementText("pending-students", pending);
        updateElementText("active-students", active || 0);
        updateElementText("inactive-students", inactive || 0);

        console.log('Student analytics loaded successfully.');

    } catch (err) {
        console.error("Error loading student analytics:", err);
    }
}

/**
 * Loads the logged-in user's details (name, role) into the header.
 */
async function loadUserData() {
    console.log('Loading user data for header...');
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User is logged in:', user.uid);
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('User data found:', userData);
                const userNameEl = document.querySelector('.user-name');
                const userRoleEl = document.querySelector('.user-role');
                if (userNameEl) userNameEl.textContent = userData.name || 'User';
                if (userRoleEl) userRoleEl.textContent = userData.role || 'Role';
            } else {
                console.warn('No user document found in Firestore for the logged-in user.');
            }
        } else {
            console.log('User is not logged in.');
            const userNameEl = document.querySelector('.user-name');
            const userRoleEl = document.querySelector('.user-role');
            if (userNameEl) userNameEl.textContent = 'Guest User';
            if (userRoleEl) userRoleEl.textContent = 'Not Logged In';
        }
    });
}

// --- Global State ---
let currentPage = 1;
const STUDENTS_PER_PAGE = 10;
let lastVisible = null;
let totalStudents = 0;

// Enhanced filtering system state
let allStudents = [];
let filteredStudents = [];
let currentFilters = {
    search: '',
    division: 'all',
    course: 'all',
    status: 'all',
    sortBy: 'name'
};

/**
 * Loads all students from Firestore and caches them locally for filtering.
 */
async function loadAllStudents() {
    console.log('Loading all students for filtering...');
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        
        allStudents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Loaded ${allStudents.length} students for filtering`);
        
        // Initialize filtered students with all students
        filteredStudents = [...allStudents];
        
        // Apply any current filters
        filterStudents();
        
    } catch (error) {
        console.error("Error loading students:", error);
        showToast('Error loading students: ' + error.message, 'error');
    }
}

/**
 * Filters students based on current filters and displays them with pagination.
 */
function filterStudents() {
    console.log('Filtering students with:', currentFilters);

    if (!allStudents || allStudents.length === 0) {
        console.log('No students loaded yet, loading from Firestore...');
        loadAllStudents();
        return;
    }

    // Apply filters
    filteredStudents = allStudents.filter(student => {
        // Search filter (across multiple fields)
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            const searchableText = [
                student.name,
                student.email,
                student.phone,
                student.mobile,
                student.guardianName,
                student.division,
                student.course,
                student.address,
                student.district,
                student.state
            ].filter(Boolean).join(' ').toLowerCase();
            
            if (!searchableText.includes(searchLower)) {
                return false;
            }
        }

        // Division filter
        if (currentFilters.division && currentFilters.division !== 'all') {
            if (student.division !== currentFilters.division) {
                return false;
            }
        }

        // Course filter
        if (currentFilters.course && currentFilters.course !== 'all') {
            if (student.course !== currentFilters.course) {
                return false;
            }
        }

        // Status filter
        if (currentFilters.status && currentFilters.status !== 'all') {
            if (student.status !== currentFilters.status) {
                return false;
            }
        }

        return true;
    });

    // Apply sorting
    if (currentFilters.sortBy) {
        filteredStudents.sort((a, b) => {
            switch (currentFilters.sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'division':
                    return (a.division || '').localeCompare(b.division || '');
                case 'date':
                    const dateA = a.admissionDate?.seconds || 0;
                    const dateB = b.admissionDate?.seconds || 0;
                    return dateB - dateA; // Newest first
                default:
                    return 0;
            }
        });
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
    const endIndex = startIndex + STUDENTS_PER_PAGE;
    const studentsToShow = filteredStudents.slice(startIndex, endIndex);

    console.log(`Showing ${studentsToShow.length} students on page ${currentPage}`);
    
    // Render the filtered and paginated students
    renderStudentTable(studentsToShow);
    
    // Update pagination info
    updatePaginationInfo();
}

/**
 * Refreshes student data cache and re-applies filters.
 */
async function refreshStudentData() {
    console.log('Refreshing student data...');
    allStudents = [];
    filteredStudents = [];
    currentPage = 1;
    await loadAllStudents();
    showRefreshNotification();
}

/**
 * Legacy function - now redirects to enhanced filtering system
 */
async function loadStudentList() {
    console.log('loadStudentList called, using enhanced filtering system...');
    await loadAllStudents();
}

/**
 * Renders the student data into the table.
 */
function renderStudentTable(students) {
    const tableBody = document.getElementById('student-table-body');
    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11">No students found.</td></tr>';
        return;
    }

    tableBody.innerHTML = students.map(student => {
        // Handle different date formats
        let admissionDateStr = 'N/A';
        if (student.admissionDate) {
            if (student.admissionDate.seconds) {
                // Firestore Timestamp
                admissionDateStr = new Date(student.admissionDate.seconds * 1000).toLocaleDateString();
            } else if (student.admissionDate instanceof Date) {
                // Regular Date object
                admissionDateStr = student.admissionDate.toLocaleDateString();
            } else if (typeof student.admissionDate === 'string') {
                // String date
                admissionDateStr = new Date(student.admissionDate).toLocaleDateString();
            }
        }

        return `
            <tr>
                <td>
                    <input type="checkbox" class="student-checkbox" data-student-id="${student.id}" 
                           ${selectedStudents.has(student.id) ? 'checked' : ''}>
                </td>
                <td><img src="${student.photoURL || 'https://i.pinimg.com/736x/38/41/97/384197530d32338dd6caafaf1c6a26c4.jpg'}" alt="${student.name || 'Student'}" class="student-photo"></td>
                <td>
                    <div>${student.name || 'N/A'}</div>
                    <div class="student-id-badge">${student.studentId || 'No ID'}</div>
                </td>
                <td>${student.division || 'N/A'}</td>
                <td>${student.division !== 'Gama Abacus' ? (student.course || 'N/A') : '-'}</td>
                <td>${student.guardianName || 'N/A'}</td>
                <td>${student.email || 'N/A'}</td>
                <td>${student.phone || student.mobile || 'N/A'}</td>
                <td>${admissionDateStr}</td>
                <td><span class="badge ${student.feeStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">${student.feeStatus || 'N/A'}</span></td>
                <td><span class="badge ${student.status === 'active' ? 'badge-success' : 'badge-danger'}">${student.status || 'N/A'}</span></td>
                <td>
                    <button class="sm-btn sm-btn-sm sm-btn-outline view-btn" data-id="${student.id}" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="sm-btn sm-btn-sm sm-btn-outline edit-btn" data-id="${student.id}" title="Edit Student"><i class="fas fa-edit"></i></button>
                    <button class="sm-btn sm-btn-sm sm-btn-outline delete-btn" data-id="${student.id}" title="Delete Student"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    // Add event listeners to action buttons
    addActionButtonListeners();
    
    // Add event listeners to checkboxes
    addCheckboxListeners();
}

// Function to add event listeners to action buttons
function addActionButtonListeners() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const studentId = btn.getAttribute('data-id');
            if (studentId) {
                viewStudent(studentId);
            }
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const studentId = btn.getAttribute('data-id');
            if (studentId) {
                editStudent(studentId);
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const studentId = btn.getAttribute('data-id');
            if (studentId) {
                deleteStudent(studentId);
            }
        });
    });
}

// Function to add event listeners to checkboxes
function addCheckboxListeners() {
    document.querySelectorAll('.student-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleStudentCheckboxChange(this);
        });
    });
    
    // Update bulk operations state after adding listeners
    updateBulkDeleteButton();
    updateMasterCheckboxState();
}

/**
 * Updates pagination controls and info display.
 */
function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    if (pageInfo) {
        if (filteredStudents.length === 0) {
            pageInfo.textContent = 'No students found';
        } else {
            const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE + 1;
            const endIndex = Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length);
            pageInfo.textContent = `${startIndex}-${endIndex} of ${filteredStudents.length} students (Page ${currentPage} of ${totalPages})`;
        }
    }

    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages || filteredStudents.length === 0;
    }
}

/**
 * Updates the pagination controls and info text.
 */
// --- Initial Load ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed.');
    
    // Initialize state
    window.bulkUploadData = {
        file: null,
        parsedData: [],
        validatedData: [],
        currentStep: 1
    };
    
    // Initialize bulk upload modal functionality
    initializeBulkUploadModal();
    
    // Initialize bulk operations
    setupBulkOperations();
    
    // Initialize profile functionality and styles
    addProfileStyles();
    initializeUserProfile();
    
    // Initialize notification system
    notificationManager = new NotificationManager();
    window.notificationManager = notificationManager;
    console.log('✅ Notification system initialized');
    
    // Add demo notifications if none exist
    if (notificationManager.notifications.length === 0) {
        notificationManager.addNotification({
            type: 'success',
            title: 'Student System Ready',
            message: 'You can now manage students, track attendance, and export data.',
            category: 'Students'
        });
        
        notificationManager.addNotification({
            type: 'info',
            title: 'Bulk Upload Available',
            message: 'Import multiple students at once using Excel or CSV files.',
            category: 'Students'
        });
        
        notificationManager.addNotification({
            type: 'error',
            title: 'Action Required',
            message: '5 student profiles need verification before enrollment.',
            category: 'Students'
        });
    }
    
    // Test Firebase connection first
    const isConnected = await testFirebaseConnection();
    if (!isConnected) {
        console.error('Firebase connection failed, stopping initialization');
        return;
    }
    
    loadStudentAnalytics();
    loadUserData();
    
    // Initialize the enhanced filtering system
    await loadAllStudents();

    // Filter button event (legacy - now triggers refresh)
    document.getElementById('filter-btn').addEventListener('click', () => {
        currentPage = 1;
        refreshStudentData();
        showFilterNotification();
    });

    // Search input (from header)
    const searchInput = document.querySelector('.header-search input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.trim();
            currentPage = 1; // Reset to first page on search
            filterStudents();
        });
        console.log('✅ Header search input connected');
    } else {
        console.warn('⚠️ Header search input not found');
    }

    // Main search input (from controls bar)
    const mainSearchInput = document.getElementById('student-search-input');
    if (mainSearchInput) {
        mainSearchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.trim();
            currentPage = 1; // Reset to first page on search
            filterStudents();
        });
        console.log('✅ Main search input connected');
    } else {
        console.warn('⚠️ Main search input not found');
    }

    // Filter controls
    const divisionFilter = document.getElementById('division-filter');
    const feeStatusFilter = document.getElementById('fee-status-filter');
    const statusFilter = document.getElementById('status-filter');

    if (divisionFilter) {
        divisionFilter.addEventListener('change', (e) => {
            currentFilters.division = e.target.value || 'all';
            currentPage = 1; // Reset to first page on filter change
            filterStudents();
        });
        console.log('✅ Division filter connected');
    } else {
        console.warn('⚠️ Division filter not found');
    }

    if (feeStatusFilter) {
        feeStatusFilter.addEventListener('change', (e) => {
            // Map fee status filter to status filter for now
            currentFilters.status = e.target.value || 'all';
            currentPage = 1; // Reset to first page on filter change
            filterStudents();
        });
        console.log('✅ Fee status filter connected');
    } else {
        console.warn('⚠️ Fee status filter not found');
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentFilters.status = e.target.value || 'all';
            currentPage = 1; // Reset to first page on filter change
            filterStudents();
        });
        console.log('✅ Status filter connected');
    } else {
        console.warn('⚠️ Status filter not found');
    }

    // Pagination controls
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                filterStudents();
                const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
                showPaginationNotification(currentPage, totalPages);
            }
        });
        console.log('✅ Previous page button connected');
    } else {
        console.warn('⚠️ Previous page button not found');
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                filterStudents();
                showPaginationNotification(currentPage, totalPages);
            }
        });
        console.log('✅ Next page button connected');
    } else {
        console.warn('⚠️ Next page button not found');
    }

    // --- Add Student Modal Logic ---
    const addStudentBtn = document.getElementById('add-student-btn');
    const addStudentModal = document.getElementById('add-student-modal');
    const addStudentModalClose = document.getElementById('add-student-modal-close');
    const addStudentForm = document.getElementById('add-student-form');

    if (addStudentBtn && addStudentModal && addStudentModalClose && addStudentForm) {
        console.log('✅ Modal elements found and ready');

        // Get form elements
        const divisionSelect = document.getElementById('division-select');
        const courseGroup = document.getElementById('course-group');
        const courseSelect = document.getElementById('course-select');
        const feeStatusGroup = document.getElementById('fee-status-group');
        const dobInput = document.getElementById('dob');
        const ageInput = document.getElementById('age');

        // Load courses function
        async function loadCourses() {
            try {
                const coursesRef = collection(db, 'courses');
                const snapshot = await getDocs(coursesRef);
                return snapshot.docs.map(doc => doc.data().name).filter(Boolean);
            } catch (e) {
                console.error('Error loading courses:', e);
                return ['Computer Programming', 'Web Development', 'Data Entry'];
            }
        }

        // Handle division change
        async function handleDivisionChange() {
            const division = divisionSelect.value;
            const totalFeesGroup = document.getElementById('total-fees-group');
            const totalFeesInput = document.getElementById('total-fees');
            const paymentTypeGroup = document.getElementById('payment-type-group');
            const paymentTypeInput = document.getElementById('payment-type');
            
            console.log('🔄 Division changed to:', division);
            
            if (division === 'CAPT' || division === 'LBS') {
                // Show course, fee status, total fees, and payment type groups
                if (courseGroup) {
                    courseGroup.style.display = 'block';
                    console.log('✅ Course group shown');
                }
                if (feeStatusGroup) {
                    feeStatusGroup.style.display = 'block';
                    console.log('✅ Fee status group shown');
                }
                if (totalFeesGroup) {
                    totalFeesGroup.style.display = 'block';
                    console.log('✅ Total fees group shown');
                }
                if (paymentTypeGroup) {
                    paymentTypeGroup.style.display = 'block';
                    console.log('✅ Payment type group shown');
                }
                
                // Load and populate courses
                if (courseSelect) {
                    courseSelect.innerHTML = '<option value="">Select Course</option>';
                    const courses = await loadCourses();
                    console.log('📚 Loaded courses:', courses);
                    courses.forEach(course => {
                        const option = document.createElement('option');
                        option.value = course;
                        option.textContent = course;
                        courseSelect.appendChild(option);
                    });
                    courseSelect.required = true;
                    console.log('✅ Course select populated with', courses.length, 'courses');
                }
                
                // Set fee status, total fees, and payment type as required
                const feeStatusSelect = document.getElementById('fee-status');
                if (feeStatusSelect) feeStatusSelect.required = true;
                if (totalFeesInput) totalFeesInput.required = true;
                if (paymentTypeInput) paymentTypeInput.required = true;
                
            } else {
                // Hide course, fee status, total fees, and payment type for Gama Abacus
                console.log('🎯 Gama Abacus selected - hiding course/fee fields');
                if (courseGroup) {
                    courseGroup.style.display = 'none';
                    console.log('✅ Course group hidden');
                }
                if (feeStatusGroup) {
                    feeStatusGroup.style.display = 'none';
                    console.log('✅ Fee status group hidden');
                }
                if (totalFeesGroup) {
                    totalFeesGroup.style.display = 'none';
                    console.log('✅ Total fees group hidden');
                }
                if (paymentTypeGroup) {
                    paymentTypeGroup.style.display = 'none';
                    console.log('✅ Payment type group hidden');
                }
                
                // Remove required attributes
                if (courseSelect) courseSelect.required = false;
                const feeStatusSelect = document.getElementById('fee-status');
                if (feeStatusSelect) feeStatusSelect.required = false;
                if (totalFeesInput) {
                    totalFeesInput.required = false;
                    totalFeesInput.value = ''; // Clear value for Gama
                }
                if (paymentTypeInput) {
                    paymentTypeInput.required = false;
                    paymentTypeInput.value = ''; // Clear value for Gama
                }
            }
        }

        // Bind division change event
        if (divisionSelect) {
            divisionSelect.addEventListener('change', handleDivisionChange);
        }

        // Age calculation from DOB
        function calculateAgeFromDOB(dob) {
            if (!dob) return '';
            const birth = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age > 0 ? age : '';
        }

        // Bind DOB change event
        if (dobInput && ageInput) {
            dobInput.addEventListener('change', () => {
                ageInput.value = calculateAgeFromDOB(dobInput.value);
            });
        }

        // Modal open/close handlers
        addStudentBtn.addEventListener('click', () => {
            addStudentModal.classList.add('show');
            handleDivisionChange(); // Set initial state
        });

        addStudentModalClose.addEventListener('click', () => {
            addStudentModal.classList.remove('show');
            addStudentForm.reset();
            // Reset visibility
            const totalFeesGroup = document.getElementById('total-fees-group');
            const paymentTypeGroup = document.getElementById('payment-type-group');
            if (courseGroup) courseGroup.style.display = 'none';
            if (feeStatusGroup) feeStatusGroup.style.display = 'none';
            if (totalFeesGroup) totalFeesGroup.style.display = 'none';
            if (paymentTypeGroup) paymentTypeGroup.style.display = 'none';
        });

        // Close modal when clicking outside
        addStudentModal.addEventListener('click', (e) => {
            if (e.target === addStudentModal) {
                const totalFeesGroup = document.getElementById('total-fees-group');
                const paymentTypeGroup = document.getElementById('payment-type-group');
                addStudentModal.classList.remove('show');
                addStudentForm.reset();
                if (courseGroup) courseGroup.style.display = 'none';
                if (feeStatusGroup) feeStatusGroup.style.display = 'none';
                if (totalFeesGroup) totalFeesGroup.style.display = 'none';
                if (paymentTypeGroup) paymentTypeGroup.style.display = 'none';
            }
        });

        // Form submission handler
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            console.log('🚀 Form submission started...');
            
            // Get submit button for state management
            const submitBtn = addStudentForm.querySelector('button[type="submit"]');
            
            try {
                // Disable submit button to prevent double submission
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Adding Student...';
                    console.log('✅ Submit button disabled');
                }

                // Simple form data collection - using direct element access
                console.log('📋 Collecting form data...');
                
                const formData = new FormData(addStudentForm);
                const division = document.getElementById('division-select')?.value;
                const name = document.getElementById('student-name')?.value;
                const dob = document.getElementById('dob')?.value;
                const age = parseInt(document.getElementById('age')?.value, 10);
                const gender = document.getElementById('gender')?.value;
                const guardianName = document.getElementById('guardian-name')?.value;
                const guardianOccupation = document.getElementById('guardian-occupation')?.value || '';
                const address = document.getElementById('address')?.value;
                const district = document.getElementById('district')?.value;
                const state = document.getElementById('state')?.value;
                const country = document.getElementById('country')?.value;
                const zip = document.getElementById('zip')?.value;
                const email = document.getElementById('email')?.value;
                const phone = document.getElementById('phone')?.value;
                const admissionDate = document.getElementById('admission-date')?.value;
                const admissionFee = parseFloat(document.getElementById('admission-fee')?.value);
                const totalFees = parseFloat(document.getElementById('total-fees')?.value) || 0;
                const paymentType = document.getElementById('payment-type')?.value || '';
                const status = document.getElementById('status')?.value;
                const batchTime = document.getElementById('batch-time')?.value;
                
                console.log('📊 Basic form data:', {
                    division, name, dob, age, gender, guardianName,
                    address, district, state, country, zip, email, phone,
                    admissionDate, admissionFee, totalFees, paymentType, status, batchTime
                });

                // Quick validation
                if (!division || !name || !email || !phone || !admissionDate) {
                    console.error('❌ Basic validation failed');
                    showToast('Please fill all required fields', 'error');
                    return;
                }

                console.log('✅ Basic validation passed');

                // Division-specific fields
                let course = 'General', feeStatus = 'Pending';
                if (division === 'CAPT' || division === 'LBS') {
                    course = document.getElementById('course-select')?.value;
                    feeStatus = document.getElementById('fee-status')?.value || 'Pending';
                    
                    // Validate course is selected for CAPT/LBS
                    if (!course || course === '') {
                        console.error('❌ Course validation failed for', division);
                        showToast(`Please select a course for ${division}`, 'error');
                        return;
                    }
                    
                    // Validate payment type is selected for CAPT/LBS
                    if (!paymentType || paymentType === '') {
                        console.error('❌ Payment type validation failed for', division);
                        showToast(`Please select a payment type for ${division}`, 'error');
                        return;
                    }
                } else if (division === 'Gama Abacus') {
                    course = 'Gama Abacus';
                    feeStatus = 'Paid';
                }

                console.log('📚 Course data:', { course, feeStatus, paymentType });

                // Generate unique student ID
                console.log('🆔 Generating unique student ID...');
                const studentId = await generateUniqueStudentId(division);
                console.log('✅ Generated Student ID:', studentId);

                // Create document with default photo URL
                console.log('📄 Creating student document...');
                const studentDoc = {
                    studentId: studentId,
                    name: name || 'Test Student',
                    email: email || 'test@example.com',
                    phone: phone || '0000000000',
                    division: division || 'CAPT',
                    course: course,
                    feeStatus: feeStatus,
                    guardianName: guardianName || 'Guardian',
                    address: address || 'Address',
                    district: district || 'District',
                    state: state || 'State',
                    country: country || 'Country',
                    zip: zip || '000000',
                    age: age || 18,
                    gender: gender || 'male',
                    status: status || 'active',
                    batchTime: batchTime || '09:00',
                    admissionFee: admissionFee || 1000,
                    totalFees: totalFees || 0,
                    paymentType: paymentType || '',
                    admissionDate: new Date(admissionDate),
                    guardianOccupation: guardianOccupation,
                    dob: dob || '2000-01-01',
                    photoURL: 'https://i.pinimg.com/736x/38/41/97/384197530d32338dd6caafaf1c6a26c4.jpg',
                    role: 'student',
                    createdAt: new Date()
                };
                
                console.log('📋 Final document to save:', studentDoc);
                
                // Test Firestore save
                console.log('💾 Attempting to save to Firestore...');
                const docRef = await addDoc(collection(db, 'users'), studentDoc);
                console.log('✅ SUCCESS! Document saved with ID:', docRef.id);
                
                showToast('Student added successfully!', 'success');
                
                // Add notification
                if (notificationManager) {
                    notificationManager.notifyStudentAdded(studentDoc.name);
                }
                
                // Close modal and refresh
                setTimeout(async () => {
                    addStudentModal.classList.remove('show');
                    addStudentForm.reset();
                    loadStudentAnalytics();
                    // Refresh the student cache with new data
                    await refreshStudentData();
                }, 1000);
                
            } catch (err) {
                console.error('❌ CRITICAL ERROR:', err);
                console.error('Error details:', {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                });
                showToast('Error: ' + err.message, 'error');
            } finally {
                // Always re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit';
                    console.log('🔄 Submit button re-enabled');
                }
            }
        });
    } else {
        console.error('❌ Required modal elements not found');
    }

    // --- Export and Bulk Upload Button Event Listeners ---
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const bulkUploadBtn = document.getElementById('bulk-upload-btn');

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', handleExportPDF);
        console.log('✅ Export PDF button connected');
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', handleExportExcel);
        console.log('✅ Export Excel button connected');
    }

    if (bulkUploadBtn) {
        bulkUploadBtn.addEventListener('click', handleBulkUpload);
        console.log('✅ Bulk Upload button connected');
    }
});

// =============================================================================
// CRUD OPERATIONS FOR STUDENT MANAGEMENT
// =============================================================================

// Function to load student fee information from fees collection
async function loadStudentFeeInfo(student, modal) {
    try {
        // Query fees collection for this student
        const feesRef = collection(db, 'fees');
        const q = query(feesRef, where('studentId', '==', student.studentId || student.id));
        const snapshot = await getDocs(q);
        
        let totalPaid = 0;
        let admissionFeePaid = 0;
        
        snapshot.forEach(doc => {
            const fee = doc.data();
            totalPaid += parseFloat(fee.amountPaid || 0);
            
            // Check if this is admission fee payment
            if (fee.type && fee.type.toLowerCase().includes('admission')) {
                admissionFeePaid += parseFloat(fee.amountPaid || 0);
            }
        });
        
        // Calculate pending admission fee
        const totalAdmissionFee = parseFloat(student.admissionFee || 0);
        const pendingAdmissionFee = Math.max(0, totalAdmissionFee - admissionFeePaid);
        
        // Calculate outstanding fees (total fees - total paid)
        const totalCourseFees = parseFloat(student.totalFees || 0);
        const outstandingFees = Math.max(0, totalCourseFees - totalPaid);
        
        // Update modal with fee information
        const courseFeesElement = modal.querySelector('#view-student-course-fees');
        if (courseFeesElement) courseFeesElement.textContent = totalCourseFees > 0 ? `₹${totalCourseFees.toFixed(2)}` : '₹0.00';
        
        const pendingAdmissionElement = modal.querySelector('#view-student-pending-admission');
        if (pendingAdmissionElement) {
            pendingAdmissionElement.textContent = `₹${pendingAdmissionFee.toFixed(2)}`;
            pendingAdmissionElement.style.color = pendingAdmissionFee > 0 ? '#F59E0B' : '#10B981';
        }
        
        const outstandingFeesElement = modal.querySelector('#view-student-outstanding-fees');
        if (outstandingFeesElement) {
            outstandingFeesElement.textContent = `₹${outstandingFees.toFixed(2)}`;
            outstandingFeesElement.style.color = outstandingFees > 0 ? '#EF4444' : '#10B981';
        }
        
        const totalPaidElement = modal.querySelector('#view-student-total-paid');
        if (totalPaidElement) totalPaidElement.textContent = `₹${totalPaid.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading student fee info:', error);
        // Set default values if error
        const courseFeesElement = modal.querySelector('#view-student-course-fees');
        if (courseFeesElement) courseFeesElement.textContent = '₹0.00';
        
        const pendingAdmissionElement = modal.querySelector('#view-student-pending-admission');
        if (pendingAdmissionElement) pendingAdmissionElement.textContent = 'Error loading';
        
        const outstandingFeesElement = modal.querySelector('#view-student-outstanding-fees');
        if (outstandingFeesElement) outstandingFeesElement.textContent = 'Error loading';
        
        const totalPaidElement = modal.querySelector('#view-student-total-paid');
        if (totalPaidElement) totalPaidElement.textContent = '₹0.00';
    }
}

// Function to view student details
window.viewStudent = async function(studentId) {
    try {
        console.log('Viewing student with ID:', studentId);
        
        // Find student in the all students array
        const student = allStudents.find(s => s.id === studentId);
        
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }
        
        // Populate modal with student data
        const modal = document.getElementById('view-student-modal');
        
        // Photo and basic info
        modal.querySelector('#view-student-photo').src = student.photoURL || 'https://i.pinimg.com/736x/38/41/97/384197530d32338dd6caafaf1c6a26c4.jpg';
        modal.querySelector('#view-student-name').textContent = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        modal.querySelector('#view-student-id').textContent = student.studentId || `ID: ${student.id}`;
        
        // Personal Information - using direct element IDs
        const dobElement = modal.querySelector('#view-student-dob');
        if (dobElement) dobElement.textContent = formatDate(student.dob) || 'Not provided';
        
        const ageElement = modal.querySelector('#view-student-age');
        if (ageElement) ageElement.textContent = student.age || 'Not provided';
        
        const genderElement = modal.querySelector('#view-student-gender');
        if (genderElement) genderElement.textContent = student.gender || 'Not provided';
        
        // Academic Information
        const divisionElement = modal.querySelector('#view-student-division');
        if (divisionElement) divisionElement.textContent = student.division || 'Not provided';
        
        const courseElement = modal.querySelector('#view-student-course');
        if (courseElement) courseElement.textContent = student.course || 'Not provided';
        
        const batchTimeElement = modal.querySelector('#view-student-batch-time');
        if (batchTimeElement) batchTimeElement.textContent = student.batchTime || 'Not provided';
        
        const admissionDateElement = modal.querySelector('#view-student-admission-date');
        if (admissionDateElement) admissionDateElement.textContent = formatDate(student.admissionDate) || 'Not provided';
        
        const admissionFeeElement = modal.querySelector('#view-student-admission-fee');
        if (admissionFeeElement) admissionFeeElement.textContent = student.admissionFee ? `₹${student.admissionFee}` : 'Not provided';
        
        const totalFeesElement = modal.querySelector('#view-student-total-fees');
        if (totalFeesElement) totalFeesElement.textContent = student.totalFees ? `₹${student.totalFees}` : 'Not provided';
        
        // Payment Type
        const paymentTypeElement = modal.querySelector('#view-student-payment-type');
        if (paymentTypeElement) {
            const paymentType = student.paymentType || 'Not specified';
            paymentTypeElement.textContent = paymentType;
            // Add badge styling for payment type
            if (paymentType === 'One Time') {
                paymentTypeElement.style.color = '#10B981';
            } else if (paymentType === 'Installment') {
                paymentTypeElement.style.color = '#3B82F6';
            }
        }
        
        // Fee Information - Calculate from fees collection
        await loadStudentFeeInfo(student, modal);
        
        // Guardian Information
        const guardianNameElement = modal.querySelector('#view-student-guardian-name');
        if (guardianNameElement) guardianNameElement.textContent = student.guardianName || 'Not provided';
        
        const guardianOccupationElement = modal.querySelector('#view-student-guardian-occupation');
        if (guardianOccupationElement) guardianOccupationElement.textContent = student.guardianOccupation || 'Not provided';
        
        // Contact Information
        const emailElement = modal.querySelector('#view-student-email');
        if (emailElement) emailElement.textContent = student.email || 'Not provided';
        
        const phoneElement = modal.querySelector('#view-student-phone');
        if (phoneElement) phoneElement.textContent = student.phone || 'Not provided';
        
        const addressElement = modal.querySelector('#view-student-address');
        if (addressElement) addressElement.textContent = student.address || 'Not provided';
        
        const districtElement = modal.querySelector('#view-student-district');
        if (districtElement) districtElement.textContent = student.district || 'Not provided';
        
        const stateElement = modal.querySelector('#view-student-state');
        if (stateElement) stateElement.textContent = student.state || 'Not provided';
        
        const countryElement = modal.querySelector('#view-student-country');
        if (countryElement) countryElement.textContent = student.country || 'Not provided';
        
        const zipElement = modal.querySelector('#view-student-zip');
        if (zipElement) zipElement.textContent = student.zip || 'Not provided';
        
        // Status Information
        const statusElement = modal.querySelector('#view-student-status');
        if (statusElement) {
            statusElement.textContent = student.status || 'active';
            statusElement.className = `detail-value badge ${getStatusClass(student.status)}`;
        }
        
        const feeStatusElement = modal.querySelector('#view-student-fee-status');
        if (feeStatusElement) {
            feeStatusElement.textContent = student.feeStatus || 'Not provided';
            feeStatusElement.className = `detail-value badge ${student.feeStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`;
        }
        
        // Show modal
        modal.classList.add('show');
        
    } catch (error) {
        console.error('Error viewing student:', error);
        showToast('Error loading student details', 'error');
    }
};

// Function to edit student
window.editStudent = async function(studentId) {
    try {
        console.log('Editing student with ID:', studentId);
        
        // Find student in the all students array
        const student = allStudents.find(s => s.id === studentId);
        
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }
        
        // Get the edit modal and form
        const modal = document.getElementById('edit-student-modal');
        const form = document.getElementById('edit-student-form');
        
        if (!modal || !form) {
            showToast('Edit modal not found', 'error');
            return;
        }
        
        // Reset form first
        form.reset();
        
        // Store the student ID for later use
        form.dataset.studentId = studentId;
        
        // Populate form fields with current student data
        await populateEditForm(form, student);
        
        // Show modal using the same method as add student
        modal.classList.add('show');
        
        console.log('Edit modal opened successfully for student:', student.name);
        
    } catch (error) {
        console.error('Error preparing edit form:', error);
        showToast('Error loading student for editing: ' + error.message, 'error');
    }
};

// Function to delete student
window.deleteStudent = async function(studentId) {
    try {
        console.log('Preparing to delete student with ID:', studentId);
        
        // Find student in the all students array
        const student = allStudents.find(s => s.id === studentId);
        
        if (!student) {
            showToast('Student not found', 'error');
            return;
        }
        
        // Get the delete modal
        const modal = document.getElementById('delete-student-modal');
        
        if (!modal) {
            showToast('Delete modal not found', 'error');
            return;
        }
        
        // Update modal content with student info
        const studentNameElement = modal.querySelector('#delete-student-name');
        if (studentNameElement) {
            studentNameElement.textContent = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        }
        
        // Store student ID and additional info for actual deletion
        modal.dataset.studentId = studentId;
        
        // Show modal with confirmation
        modal.classList.add('show');
        
        console.log(`Delete confirmation modal opened for student: ${student.name}`);
        
    } catch (error) {
        console.error('Error preparing delete modal:', error);
        showToast('Error preparing student deletion', 'error');
    }
};

// Helper function to get status badge class
function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'active':
            return 'status-active';
        case 'inactive':
            return 'status-inactive';
        case 'graduated':
            return 'status-graduated';
        case 'suspended':
            return 'status-suspended';
        default:
            return 'status-pending';
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'Not provided';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Function to populate edit form with student data
async function populateEditForm(form, student) {
    console.log('Populating edit form with student data:', student);
    
    // Personal Information
    const studentNameField = document.getElementById('edit-student-name');
    const emailField = document.getElementById('edit-email');
    const phoneField = document.getElementById('edit-phone');
    const genderField = document.getElementById('edit-gender');
    const dobField = document.getElementById('edit-dob');
    const ageField = document.getElementById('edit-age');
    const addressField = document.getElementById('edit-address');
    const districtField = document.getElementById('edit-district');
    const stateField = document.getElementById('edit-state');
    const countryField = document.getElementById('edit-country');
    const zipField = document.getElementById('edit-zip');
    
    // Academic Information
    const divisionField = document.getElementById('edit-division-select');
    const courseField = document.getElementById('edit-course-select');
    const statusField = document.getElementById('edit-status');
    const admissionDateField = document.getElementById('edit-admission-date');
    const admissionFeeField = document.getElementById('edit-admission-fee');
    const batchTimeField = document.getElementById('edit-batch-time');
    const feeStatusField = document.getElementById('edit-fee-status');
    
    // Guardian Information
    const guardianNameField = document.getElementById('edit-guardian-name');
    const guardianOccupationField = document.getElementById('edit-guardian-occupation');
    
    // Populate fields if they exist
    if (studentNameField) studentNameField.value = student.name || '';
    if (emailField) emailField.value = student.email || '';
    if (phoneField) phoneField.value = student.phone || '';
    if (genderField) genderField.value = student.gender || '';
    
    // Handle date of birth formatting
    if (dobField) {
        let dobValue = '';
        if (student.dob) {
            if (typeof student.dob === 'string') {
                dobValue = student.dob.split('T')[0]; // Remove time part if present
            } else if (student.dob.seconds) {
                dobValue = new Date(student.dob.seconds * 1000).toISOString().split('T')[0];
            } else if (student.dob instanceof Date) {
                dobValue = student.dob.toISOString().split('T')[0];
            }
        }
        dobField.value = dobValue;
        
        // Calculate and set age
        if (dobValue && ageField) {
            const birth = new Date(dobValue);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            ageField.value = age > 0 ? age : '';
        }
    }
    
    if (ageField && !dobField.value) ageField.value = student.age || '';
    if (addressField) addressField.value = student.address || '';
    if (districtField) districtField.value = student.district || '';
    if (stateField) stateField.value = student.state || '';
    if (countryField) countryField.value = student.country || '';
    if (zipField) zipField.value = student.zip || '';
    
    // Academic Information
    if (divisionField) divisionField.value = student.division || '';
    
    // Update course options based on division (this will show/hide fields)
    await updateEditCourseOptions(student.division);
    
    // Set course value after updating options (courses are now loaded from Firebase)
    if (courseField) courseField.value = student.course || '';
    
    if (statusField) statusField.value = student.status || 'active';
    
    // Handle admission date formatting
    if (admissionDateField) {
        let dateValue = '';
        if (student.admissionDate) {
            if (student.admissionDate.seconds) {
                // Firestore Timestamp
                dateValue = new Date(student.admissionDate.seconds * 1000).toISOString().split('T')[0];
            } else if (student.admissionDate instanceof Date) {
                dateValue = student.admissionDate.toISOString().split('T')[0];
            } else if (typeof student.admissionDate === 'string') {
                dateValue = new Date(student.admissionDate).toISOString().split('T')[0];
            }
        }
        admissionDateField.value = dateValue;
    }
    
    if (admissionFeeField) admissionFeeField.value = student.admissionFee || '';
    
    // Total Fees
    const totalFeesField = document.getElementById('edit-total-fees');
    if (totalFeesField) totalFeesField.value = student.totalFees || '';
    
    // Payment Type
    const paymentTypeField = document.getElementById('edit-payment-type');
    if (paymentTypeField) paymentTypeField.value = student.paymentType || '';
    
    if (batchTimeField) batchTimeField.value = student.batchTime || '';
    if (feeStatusField) feeStatusField.value = student.feeStatus || 'Pending';
    
    // Guardian Information
    if (guardianNameField) guardianNameField.value = student.guardianName || '';
    if (guardianOccupationField) guardianOccupationField.value = student.guardianOccupation || '';
    
    console.log('Edit form populated successfully');
}

// Function to update course options for edit form
// Function to load courses from Firebase (similar to add student form)
async function loadCoursesForEdit() {
    try {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        return snapshot.docs.map(doc => doc.data().name).filter(Boolean);
    } catch (e) {
        console.error('Error loading courses for edit:', e);
        return ['Computer Programming', 'Web Development', 'Data Entry'];
    }
}

async function updateEditCourseOptions(division) {
    const courseSelect = document.getElementById('edit-course-select');
    const courseGroup = document.getElementById('edit-course-group');
    const feeStatusGroup = document.getElementById('edit-fee-status-group');
    const totalFeesGroup = document.getElementById('edit-total-fees-group');
    const totalFeesInput = document.getElementById('edit-total-fees');
    const paymentTypeGroup = document.getElementById('edit-payment-type-group');
    const paymentTypeInput = document.getElementById('edit-payment-type');
    
    if (!courseSelect) return;
    
    // Clear existing options
    courseSelect.innerHTML = '<option value="">Select Course</option>';
    
    // Show/hide groups based on division
    if (division === 'CAPT' || division === 'LBS') {
        // Show course, fee status, total fees, and payment type groups
        if (courseGroup) courseGroup.style.display = 'block';
        if (feeStatusGroup) feeStatusGroup.style.display = 'block';
        
        // Load and populate courses from Firebase (similar to add student form)
        const courses = await loadCoursesForEdit();
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.textContent = course;
            courseSelect.appendChild(option);
        });
        
        courseSelect.required = true;
        const feeStatusSelect = document.getElementById('edit-fee-status');
        if (feeStatusSelect) feeStatusSelect.required = true;
        if (totalFeesGroup) totalFeesGroup.style.display = 'block';
        if (totalFeesInput) totalFeesInput.required = true;
        if (paymentTypeGroup) paymentTypeGroup.style.display = 'block';
        if (paymentTypeInput) paymentTypeInput.required = true;
        
    } else {
        // Hide course, fee status, total fees, and payment type for Gama Abacus
        if (courseGroup) courseGroup.style.display = 'none';
        if (feeStatusGroup) feeStatusGroup.style.display = 'none';
        if (totalFeesGroup) totalFeesGroup.style.display = 'none';
        if (paymentTypeGroup) paymentTypeGroup.style.display = 'none';
        
        courseSelect.required = false;
        const feeStatusSelect = document.getElementById('edit-fee-status');
        if (feeStatusSelect) feeStatusSelect.required = false;
        if (totalFeesInput) {
            totalFeesInput.required = false;
            totalFeesInput.value = ''; // Clear value for Gama
        }
        if (paymentTypeInput) {
            paymentTypeInput.required = false;
            paymentTypeInput.value = ''; // Clear value for Gama
        }
    }
}

// Event handlers for edit form (initialized when DOM is ready)
document.addEventListener('DOMContentLoaded', function() {
    // Edit division change handler
    const editDivisionSelect = document.getElementById('edit-division-select');
    if (editDivisionSelect) {
        editDivisionSelect.addEventListener('change', async function() {
            await updateEditCourseOptions(this.value);
        });
    }
    
    // Edit DOB change handler for age calculation
    const editDobInput = document.getElementById('edit-dob');
    const editAgeInput = document.getElementById('edit-age');
    if (editDobInput && editAgeInput) {
        editDobInput.addEventListener('change', () => {
            const dob = editDobInput.value;
            if (dob) {
                const birth = new Date(dob);
                const today = new Date();
                let age = today.getFullYear() - birth.getFullYear();
                const monthDiff = today.getMonth() - birth.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
                editAgeInput.value = age > 0 ? age : '';
            }
        });
    }
    
    // Edit form submission
    const editForm = document.getElementById('edit-student-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmission);
    }
    
    // Edit form cancel button
    const editCancelBtn = document.getElementById('edit-cancel-btn');
    if (editCancelBtn) {
        editCancelBtn.addEventListener('click', () => {
            const modal = document.getElementById('edit-student-modal');
            const form = document.getElementById('edit-student-form');
            modal.classList.remove('show');
            form.reset();
            // Reset visibility
            const courseGroup = document.getElementById('edit-course-group');
            const feeStatusGroup = document.getElementById('edit-fee-status-group');
            const totalFeesGroup = document.getElementById('edit-total-fees-group');
            const paymentTypeGroup = document.getElementById('edit-payment-type-group');
            if (courseGroup) courseGroup.style.display = 'none';
            if (feeStatusGroup) feeStatusGroup.style.display = 'none';
            if (totalFeesGroup) totalFeesGroup.style.display = 'none';
            if (paymentTypeGroup) paymentTypeGroup.style.display = 'none';
        });
    }
    
    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('delete-confirm-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleStudentDeletion);
    }
    
    // Delete cancel button
    const deleteCancelBtn = document.getElementById('delete-cancel-btn');
    if (deleteCancelBtn) {
        deleteCancelBtn.addEventListener('click', () => {
            const modal = document.getElementById('delete-student-modal');
            modal.classList.remove('show');
            console.log('Delete operation cancelled by user');
        });
    }
    
    // Modal close handlers
    setupModalCloseHandlers();
});

// Handle edit form submission
async function handleEditFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const studentId = form.dataset.studentId;
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!studentId) {
        showToast('Error: No student ID found', 'error');
        return;
    }
    
    try {
        // Show loading state
        submitButton.textContent = 'Updating Student...';
        submitButton.disabled = true;
        
        // Get form data using FormData
        const formData = new FormData(form);
        const studentData = Object.fromEntries(formData.entries());
        
        // Convert admission fee, total fees and age to numbers
        if (studentData.admissionFee) {
            studentData.admissionFee = parseFloat(studentData.admissionFee);
        }
        if (studentData.totalFees) {
            studentData.totalFees = parseFloat(studentData.totalFees);
        }
        if (studentData.age) {
            studentData.age = parseInt(studentData.age, 10);
        }
        
        // Convert admission date to proper format
        if (studentData.admissionDate) {
            studentData.admissionDate = new Date(studentData.admissionDate);
        }

        // Convert DOB to proper format if provided
        if (studentData.dob) {
            studentData.dob = new Date(studentData.dob);
        }

        // Add metadata
        studentData.lastUpdated = new Date().toISOString();
        studentData.photoURL = 'https://i.pinimg.com/736x/38/41/97/384197530d32338dd6caafaf1c6a26c4.jpg';        // Handle division-specific data
        if (studentData.division === 'Gama Abacus') {
            studentData.course = 'Gama Abacus';
            studentData.feeStatus = 'Paid';
        }
        
        // Validate required fields
        const requiredFields = ['name', 'email', 'phone', 'division', 'guardianName', 'address', 'district', 'state', 'country', 'zip', 'admissionDate', 'admissionFee', 'batchTime', 'status'];
        for (const field of requiredFields) {
            if (!studentData[field] || studentData[field].toString().trim() === '') {
                showToast(`Error: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`, 'error');
                return;
            }
        }

        // Additional validation for CAPT/LBS divisions
        if ((studentData.division === 'CAPT' || studentData.division === 'LBS') && !studentData.course) {
            showToast('Error: Course is required for CAPT and LBS divisions', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(studentData.email)) {
            showToast('Error: Please enter a valid email address', 'error');
            return;
        }

        // Phone validation
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(studentData.phone)) {
            showToast('Error: Please enter a valid phone number', 'error');
            return;
        }
        
        // Update in Firestore
        console.log('Updating student in Firestore with ID:', studentId);
        await updateDoc(doc(db, 'users', studentId), studentData);
        console.log('Student updated successfully in Firestore');

        // Update local data
        const studentIndex = allStudents.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
            allStudents[studentIndex] = { id: studentId, ...allStudents[studentIndex], ...studentData };
            console.log('Updated student in allStudents array');
        }

        // Update filtered students as well
        const filteredIndex = filteredStudents.findIndex(s => s.id === studentId);
        if (filteredIndex !== -1) {
            filteredStudents[filteredIndex] = { id: studentId, ...filteredStudents[filteredIndex], ...studentData };
            console.log('Updated student in filteredStudents array');
        }

        // Refresh the display
        renderStudentTable(filteredStudents.slice((currentPage - 1) * STUDENTS_PER_PAGE, currentPage * STUDENTS_PER_PAGE));
        
        // Update analytics
        await updateAnalytics();
        
        // Reset form and close modal
        form.reset();
        const modal = document.getElementById('edit-student-modal');
        modal.classList.remove('show');
        
        // Show success message
        showToast(`Student "${studentData.name}" updated successfully!`, 'success');
        
        // Add notification
        if (notificationManager) {
            notificationManager.notifyStudentUpdated(studentData.name);
        }
        
        console.log('Edit process completed successfully');    } catch (error) {
        console.error('Error updating student:', error);
        showToast('Error updating student: ' + error.message, 'error');
    } finally {
        // Reset button state
        submitButton.textContent = 'Update Student';
        submitButton.disabled = false;
    }
}

// Function to update analytics after student data changes
async function updateAnalytics() {
    try {
        console.log('Updating analytics...');
        await loadStudentAnalytics();
    } catch (error) {
        console.error('Error updating analytics:', error);
    }
}

// Handle student deletion
async function handleStudentDeletion() {
    const modal = document.getElementById('delete-student-modal');
    const studentId = modal.dataset.studentId;
    const deleteButton = document.getElementById('delete-confirm-btn');
    
    if (!studentId) {
        showToast('Error: No student ID found', 'error');
        return;
    }
    
    try {
        // Find student data for confirmation
        const student = allStudents.find(s => s.id === studentId);
        const studentName = student ? student.name : 'Unknown Student';
        
        // Show loading state
        deleteButton.textContent = 'Deleting...';
        deleteButton.disabled = true;
        
        console.log(`Deleting student: ${studentName} (ID: ${studentId})`);
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'users', studentId));
        console.log('Student deleted from Firestore successfully');
        
        // Remove from local data arrays
        const studentIndex = allStudents.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
            allStudents.splice(studentIndex, 1);
            console.log('Removed student from allStudents array');
        }
        
        // Remove from filtered students as well
        const filteredIndex = filteredStudents.findIndex(s => s.id === studentId);
        if (filteredIndex !== -1) {
            filteredStudents.splice(filteredIndex, 1);
            console.log('Removed student from filteredStudents array');
        }
        
        // Refresh the display and analytics
        filterStudents(); // Re-apply current filters and refresh table
        
        // Check if we need to go to previous page (if current page is empty)
        const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
            filterStudents(); // Re-render with correct page
        }
        
        await updateAnalytics();
        
        // Close modal and show success
        modal.classList.remove('show');
        showToast(`Student "${studentName}" deleted successfully!`, 'success');
        
        // Add notification
        if (notificationManager) {
            notificationManager.notifyStudentDeleted(studentName);
        }
        
        console.log('Delete process completed successfully');
        
    } catch (error) {
        console.error('Error deleting student:', error);
        showToast('Error deleting student: ' + error.message, 'error');
    } finally {
        // Reset button state
        deleteButton.textContent = 'Yes, Delete';
        deleteButton.disabled = false;
    }
}

// Setup modal close handlers
function setupModalCloseHandlers() {
    // Close modals when clicking close button or outside modal
    const modals = ['view-student-modal', 'edit-student-modal', 'delete-student-modal'];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Close button
            const closeBtn = modal.querySelector('.modal-close, .close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('show');
                    
                    // Reset edit form when closing edit modal
                    if (modalId === 'edit-student-modal') {
                        const form = document.getElementById('edit-student-form');
                        if (form) {
                            form.reset();
                            // Hide course and fee status groups
                            const courseGroup = document.getElementById('edit-course-group');
                            const feeStatusGroup = document.getElementById('edit-fee-status-group');
                            if (courseGroup) courseGroup.style.display = 'none';
                            if (feeStatusGroup) feeStatusGroup.style.display = 'none';
                        }
                    }
                });
            }
            
            // Cancel button for delete modal
            const cancelBtn = modal.querySelector('#delete-cancel-btn, .btn-secondary');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    modal.classList.remove('show');
                });
            }
            
            // Click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    
                    // Reset edit form when closing edit modal
                    if (modalId === 'edit-student-modal') {
                        const form = document.getElementById('edit-student-form');
                        if (form) {
                            form.reset();
                            // Hide course and fee status groups
                            const courseGroup = document.getElementById('edit-course-group');
                            const feeStatusGroup = document.getElementById('edit-fee-status-group');
                            if (courseGroup) courseGroup.style.display = 'none';
                            if (feeStatusGroup) feeStatusGroup.style.display = 'none';
                        }
                    }
                }
            });
        }
    });
}

// =============================================================================
// EXPORT AND BULK UPLOAD NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * Handle PDF export functionality
 */
async function handleExportPDF() {
    try {
        showToast('Preparing PDF export...', 'info');
        
        // Check if we have students to export
        if (!filteredStudents || filteredStudents.length === 0) {
            showToast('No students available to export', 'error');
            return;
        }

        // Show progress indicator
        const button = document.getElementById('export-pdf-btn');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        button.disabled = true;

        try {
            // Create new jsPDF instance
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape'); // Use landscape for better table layout
            
            // Set document title
            doc.setFontSize(18);
            doc.text('MicroTech Center - Student Report', 20, 20);
            
            // Add generation date and filters info
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
            doc.text(`Total Students: ${filteredStudents.length}`, 20, 36);
            
            // Add filter information if any filters are applied
            let filterText = '';
            if (currentFilters.search) filterText += `Search: "${currentFilters.search}" `;
            if (currentFilters.division && currentFilters.division !== 'all') filterText += `Division: ${currentFilters.division} `;
            if (currentFilters.status && currentFilters.status !== 'all') filterText += `Status: ${currentFilters.status} `;
            
            if (filterText) {
                doc.text(`Filters Applied: ${filterText}`, 20, 42);
            }
            
            // Prepare table data
            const columns = [
                'Name', 
                'Division', 
                'Course', 
                'Guardian', 
                'Email', 
                'Phone', 
                'Admission Date', 
                'Fee Status', 
                'Status'
            ];
            
            const rows = filteredStudents.map(student => [
                student.name || 'N/A',
                student.division || 'N/A',
                student.course || 'N/A',
                student.guardianName || 'N/A',
                student.email || 'N/A',
                student.phone || student.mobile || 'N/A',
                formatDate(student.admissionDate) || 'N/A',
                student.feeStatus || 'N/A',
                student.status || 'N/A'
            ]);
            
            // Generate table using autoTable plugin
            doc.autoTable({
                head: [columns],
                body: rows,
                startY: filterText ? 50 : 45,
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [59, 130, 246], // Blue color
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: filterText ? 50 : 45, left: 10, right: 10 },
                didDrawPage: function (data) {
                    // Add page footer
                    doc.setFontSize(8);
                    doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                    doc.text('MicroTech Center Student Management System', doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
                }
            });
            
            // Save the PDF
            const fileName = `microtech_students_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '')}.pdf`;
            doc.save(fileName);
            
            showToast(`PDF export completed! ${filteredStudents.length} students exported as "${fileName}"`, 'success');
            
            // Add notification
            if (notificationManager) {
                notificationManager.notifyExportComplete('PDF', filteredStudents.length);
            }
            
        } finally {
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
        }
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('Failed to export PDF: ' + error.message, 'error');
        
        if (notificationManager) {
            notificationManager.notifyError('PDF Export Failed', error.message);
        }
        
        // Restore button state in case of error
        const button = document.getElementById('export-pdf-btn');
        if (button) {
            button.innerHTML = '<i class="fas fa-file-pdf"></i> Export PDF';
            button.disabled = false;
        }
    }
}

/**
 * Handle Excel export functionality
 */
async function handleExportExcel() {
    try {
        showToast('Preparing Excel export...', 'info');
        
        // Check if we have students to export
        if (!filteredStudents || filteredStudents.length === 0) {
            showToast('No students available to export', 'error');
            return;
        }

        // Show progress indicator
        const button = document.getElementById('export-excel-btn');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Excel...';
        button.disabled = true;

        try {
            // Prepare workbook data
            const workbook = XLSX.utils.book_new();
            
            // Prepare student data with all fields
            const studentData = filteredStudents.map((student, index) => ({
                'S.No.': index + 1,
                'Student Name': student.name || '',
                'Email': student.email || '',
                'Phone': student.phone || student.mobile || '',
                'Gender': student.gender || '',
                'Date of Birth': formatDate(student.dob) || '',
                'Age': student.age || '',
                'Address': student.address || '',
                'District': student.district || '',
                'State': student.state || '',
                'Country': student.country || '',
                'ZIP Code': student.zip || '',
                'Division': student.division || '',
                'Course': student.course || '',
                'Status': student.status || '',
                'Admission Date': formatDate(student.admissionDate) || '',
                'Admission Fee': student.admissionFee || '',
                'Batch Time': student.batchTime || '',
                'Fee Status': student.feeStatus || '',
                'Guardian Name': student.guardianName || '',
                'Guardian Occupation': student.guardianOccupation || '',
                'Created Date': formatDate(student.createdAt) || '',
                'Last Updated': formatDate(student.updatedAt) || ''
            }));
            
            // Create worksheet from student data
            const worksheet = XLSX.utils.json_to_sheet(studentData);
            
            // Set column widths for better readability
            const columnWidths = [
                { wch: 8 },  // S.No.
                { wch: 20 }, // Student Name
                { wch: 25 }, // Email
                { wch: 15 }, // Phone
                { wch: 10 }, // Gender
                { wch: 12 }, // Date of Birth
                { wch: 8 },  // Age
                { wch: 30 }, // Address
                { wch: 15 }, // District
                { wch: 15 }, // State
                { wch: 15 }, // Country
                { wch: 10 }, // ZIP Code
                { wch: 12 }, // Division
                { wch: 20 }, // Course
                { wch: 10 }, // Status
                { wch: 15 }, // Admission Date
                { wch: 12 }, // Admission Fee
                { wch: 15 }, // Batch Time
                { wch: 12 }, // Fee Status
                { wch: 20 }, // Guardian Name
                { wch: 20 }, // Guardian Occupation
                { wch: 15 }, // Created Date
                { wch: 15 }  // Last Updated
            ];
            
            worksheet['!cols'] = columnWidths;
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
            
            // Create summary worksheet with enhanced statistics
            const today = new Date();
            const summaryData = [
                { 'Report Information': 'Export Date', 'Value': today.toLocaleDateString() },
                { 'Report Information': 'Export Time', 'Value': today.toLocaleTimeString() },
                { 'Report Information': 'Generated By', 'Value': 'MicroTech Center Student Management System' },
                { 'Report Information': '', 'Value': '' },
                { 'Report Information': 'STUDENT STATISTICS', 'Value': '' },
                { 'Report Information': 'Total Students', 'Value': filteredStudents.length },
                { 'Report Information': 'CAPT Students', 'Value': filteredStudents.filter(s => s.division === 'CAPT').length },
                { 'Report Information': 'LBS Students', 'Value': filteredStudents.filter(s => s.division === 'LBS').length },
                { 'Report Information': 'Gama Abacus Students', 'Value': filteredStudents.filter(s => s.division === 'Gama Abacus').length },
                { 'Report Information': '', 'Value': '' },
                { 'Report Information': 'STATUS BREAKDOWN', 'Value': '' },
                { 'Report Information': 'Active Students', 'Value': filteredStudents.filter(s => s.status === 'active').length },
                { 'Report Information': 'Inactive Students', 'Value': filteredStudents.filter(s => s.status === 'inactive').length },
                { 'Report Information': '', 'Value': '' },
                { 'Report Information': 'FEE STATUS', 'Value': '' },
                { 'Report Information': 'Paid Fee Status', 'Value': filteredStudents.filter(s => s.feeStatus === 'Paid').length },
                { 'Report Information': 'Pending Fee Status', 'Value': filteredStudents.filter(s => s.feeStatus === 'Pending').length },
                { 'Report Information': '', 'Value': '' },
                { 'Report Information': 'FILTERS APPLIED', 'Value': '' }
            ];
            
            // Add filter information to summary
            if (currentFilters.search) {
                summaryData.push({ 'Report Information': 'Search Filter', 'Value': currentFilters.search });
            }
            if (currentFilters.division && currentFilters.division !== 'all') {
                summaryData.push({ 'Report Information': 'Division Filter', 'Value': currentFilters.division });
            }
            if (currentFilters.status && currentFilters.status !== 'all') {
                summaryData.push({ 'Report Information': 'Status Filter', 'Value': currentFilters.status });
            }
            if (!currentFilters.search && (!currentFilters.division || currentFilters.division === 'all') && (!currentFilters.status || currentFilters.status === 'all')) {
                summaryData.push({ 'Report Information': 'No Filters Applied', 'Value': 'Showing all students' });
            }
            
            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
            summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
            
            // Create a detailed breakdown by division
            const divisionStats = ['CAPT', 'LBS', 'Gama Abacus'].map(division => {
                const divisionStudents = filteredStudents.filter(s => s.division === division);
                return {
                    'Division': division,
                    'Total': divisionStudents.length,
                    'Active': divisionStudents.filter(s => s.status === 'active').length,
                    'Inactive': divisionStudents.filter(s => s.status === 'inactive').length,
                    'Fee Paid': divisionStudents.filter(s => s.feeStatus === 'Paid').length,
                    'Fee Pending': divisionStudents.filter(s => s.feeStatus === 'Pending').length,
                    'Male': divisionStudents.filter(s => s.gender === 'Male').length,
                    'Female': divisionStudents.filter(s => s.gender === 'Female').length
                };
            });
            
            const divisionWorksheet = XLSX.utils.json_to_sheet(divisionStats);
            divisionWorksheet['!cols'] = [
                { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, 
                { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }
            ];
            XLSX.utils.book_append_sheet(workbook, divisionWorksheet, 'Division Stats');
            
            // Generate filename with current date and time
            const fileName = `microtech_students_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '')}.xlsx`;
            
            // Write and download the Excel file
            XLSX.writeFile(workbook, fileName);
            
            showToast(`Excel export completed! ${filteredStudents.length} students exported as "${fileName}"`, 'success');
            
            // Add notification
            if (notificationManager) {
                notificationManager.notifyExportComplete('Excel', filteredStudents.length);
            }
            
        } finally {
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
        }
        
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showToast('Failed to export Excel: ' + error.message, 'error');
        
        if (notificationManager) {
            notificationManager.notifyError('Excel Export Failed', error.message);
        }
        
        // Restore button state in case of error
        const button = document.getElementById('export-excel-btn');
        if (button) {
            button.innerHTML = '<i class="fas fa-file-excel"></i> Export Excel';
            button.disabled = false;
        }
    }
}

/**
 * Handle bulk upload functionality with modal interface
 */
async function handleBulkUpload() {
    try {
        // Show the bulk upload modal
        const modal = document.getElementById('bulk-upload-modal');
        if (!modal) {
            showToast('Bulk upload modal not found', 'error');
            return;
        }
        
        // Reset modal to initial state
        resetBulkUploadModal();
        
        // Show modal
        modal.classList.add('show');
        
        console.log('Bulk upload modal opened');
        
    } catch (error) {
        console.error('Error opening bulk upload modal:', error);
        showToast('Failed to open bulk upload: ' + error.message, 'error');
    }
}

/**
 * Reset bulk upload modal to initial state
 */
function resetBulkUploadModal() {
    // Reset steps
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index === 0) step.classList.add('active');
    });
    
    // Reset step content
    document.querySelectorAll('.upload-step').forEach((step, index) => {
        step.classList.remove('active');
        if (index === 0) step.classList.add('active');
    });
    
    // Reset buttons
    document.getElementById('bulk-upload-back').style.display = 'none';
    document.getElementById('bulk-upload-next').style.display = 'inline-block';
    document.getElementById('bulk-upload-import').style.display = 'none';
    document.getElementById('bulk-upload-finish').style.display = 'none';
    
    // Clear file info
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('bulk-file-input').value = '';
    
    // Reset global state
    window.bulkUploadData = {
        file: null,
        parsedData: [],
        validatedData: [],
        currentStep: 1
    };
}

/**
 * Initialize bulk upload modal functionality
 */
function initializeBulkUploadModal() {
    const modal = document.getElementById('bulk-upload-modal');
    if (!modal) return;
    
    // File input and drag/drop handlers
    const fileInput = document.getElementById('bulk-file-input');
    const fileUploadArea = document.getElementById('file-upload-area');
    const browseFiles = document.getElementById('browse-files');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const downloadTemplateLink = document.getElementById('download-template-link');
    
    // Navigation buttons
    const cancelBtn = document.getElementById('bulk-upload-cancel');
    const backBtn = document.getElementById('bulk-upload-back');
    const nextBtn = document.getElementById('bulk-upload-next');
    const importBtn = document.getElementById('bulk-upload-import');
    const finishBtn = document.getElementById('bulk-upload-finish');
    
    // Modal close
    const closeBtn = document.getElementById('bulk-upload-modal-close');
    
    // File upload handlers
    if (browseFiles) {
        browseFiles.addEventListener('click', () => fileInput.click());
    }
    
    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', () => fileInput.click());
        
        // Drag and drop handlers
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });
        
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });
        
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelection(files[0]);
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }
    
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            clearSelectedFile();
        });
    }
    
    if (downloadTemplateLink) {
        downloadTemplateLink.addEventListener('click', (e) => {
            e.preventDefault();
            downloadSampleTemplate();
        });
    }
    
    // Navigation handlers
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            goToPreviousStep();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToNextStep();
        });
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            startImportProcess();
        });
    }
    
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            // Refresh data
            refreshStudentData();
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

/**
 * Handle file selection
 */
function handleFileSelection(file) {
    // Validate file type
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(xlsx|xls|csv)$/)) {
        showToast('Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files only.', 'error');
        return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showToast('File size too large. Maximum allowed size is 10MB.', 'error');
        return;
    }
    
    // Store file and show info
    window.bulkUploadData.file = file;
    showFileInfo(file);
    
    // Enable next button
    document.getElementById('bulk-upload-next').disabled = false;
}

/**
 * Show file information
 */
function showFileInfo(file) {
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const fileIcon = fileInfo.querySelector('.file-icon i');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    // Set appropriate icon
    if (file.name.toLowerCase().endsWith('.csv')) {
        fileIcon.className = 'fas fa-file-csv';
    } else {
        fileIcon.className = 'fas fa-file-excel';
    }
    
    fileInfo.style.display = 'block';
}

/**
 * Clear selected file
 */
function clearSelectedFile() {
    window.bulkUploadData.file = null;
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('bulk-file-input').value = '';
    document.getElementById('bulk-upload-next').disabled = true;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Navigate to previous step
 */
function goToPreviousStep() {
    const currentStep = window.bulkUploadData.currentStep;
    if (currentStep > 1) {
        window.bulkUploadData.currentStep = currentStep - 1;
        updateStepDisplay();
    }
}

/**
 * Navigate to next step
 */
async function goToNextStep() {
    const currentStep = window.bulkUploadData.currentStep;
    
    if (currentStep === 1) {
        // Validate file selection
        if (!window.bulkUploadData.file) {
            showToast('Please select a file first', 'error');
            return;
        }
        
        // Parse and validate file
        try {
            await parseAndValidateFile();
            window.bulkUploadData.currentStep = 2;
            updateStepDisplay();
        } catch (error) {
            showToast('Error parsing file: ' + error.message, 'error');
        }
    } else if (currentStep === 2) {
        // Move to import step
        window.bulkUploadData.currentStep = 3;
        updateStepDisplay();
    }
}

/**
 * Update step display
 */
function updateStepDisplay() {
    const currentStep = window.bulkUploadData.currentStep;
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
    
    // Update step content
    document.querySelectorAll('.upload-step').forEach((step, index) => {
        step.classList.remove('active');
        if (index === currentStep - 1) {
            step.classList.add('active');
        }
    });
    
    // Update buttons
    const backBtn = document.getElementById('bulk-upload-back');
    const nextBtn = document.getElementById('bulk-upload-next');
    const importBtn = document.getElementById('bulk-upload-import');
    const finishBtn = document.getElementById('bulk-upload-finish');
    
    backBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
    nextBtn.style.display = currentStep < 3 ? 'inline-block' : 'none';
    importBtn.style.display = currentStep === 3 ? 'inline-block' : 'none';
    finishBtn.style.display = 'none';
}

/**
 * Parse and validate file
 */
async function parseAndValidateFile() {
    const file = window.bulkUploadData.file;
    
    showToast('Parsing file...', 'info');
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                let studentsData = [];
                
                if (file.name.toLowerCase().endsWith('.csv')) {
                    // Handle CSV file
                    const csvText = e.target.result;
                    studentsData = parseCSV(csvText);
                } else {
                    // Handle Excel file
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        reject(new Error('No sheets found in the Excel file'));
                        return;
                    }
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    studentsData = XLSX.utils.sheet_to_json(worksheet);
                }
                
                if (!studentsData || !Array.isArray(studentsData)) {
                    reject(new Error('Failed to parse file data'));
                    return;
                }
                
                if (studentsData.length === 0) {
                    reject(new Error('No data found in the file'));
                    return;
                }
                
                window.bulkUploadData.parsedData = studentsData;
                
                // Validate data
                const validationResult = validateBulkStudentData(studentsData);
                
                if (!validationResult || typeof validationResult !== 'object') {
                    reject(new Error('Validation failed - invalid result'));
                    return;
                }
                
                window.bulkUploadData.validatedData = validationResult.validStudents || [];
                
                // Display validation results
                displayValidationResults(
                    studentsData.length, 
                    validationResult.validStudents || [], 
                    validationResult.validationErrors || []
                );
                
                resolve();
                
            } catch (error) {
                console.error('Error parsing file:', error);
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        // Read file based on type
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

/**
 * Display validation results
 */
function displayValidationResults(totalRecords, validStudents, validationErrors) {
    const validationSummary = document.getElementById('validation-summary');
    const validationDetails = document.getElementById('validation-details');
    
    // Summary
    validationSummary.innerHTML = `
        <div class="validation-stat">
            <span class="validation-stat-label">Total Records</span>
            <span class="validation-stat-value total">${totalRecords}</span>
        </div>
        <div class="validation-stat">
            <span class="validation-stat-label">Valid Records</span>
            <span class="validation-stat-value success">${validStudents.length}</span>
        </div>
        <div class="validation-stat">
            <span class="validation-stat-label">Invalid Records</span>
            <span class="validation-stat-value error">${validationErrors.length}</span>
        </div>
    `;
    
    // Details
    if (validationErrors.length > 0) {
        let detailsHTML = '<h4 style="color: #EF4444; margin-bottom: 16px;">Validation Errors:</h4>';
        detailsHTML += '<div class="validation-error-list">';
        
        validationErrors.slice(0, 10).forEach(error => {
            detailsHTML += `
                <div class="validation-error-item">
                    <div class="validation-error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="validation-error-content">
                        <div class="validation-error-row">Row ${error.row}: ${error.name}</div>
                        <div class="validation-error-message">${error.errors.join(', ')}</div>
                    </div>
                </div>
            `;
        });
        
        if (validationErrors.length > 10) {
            detailsHTML += `
                <div class="validation-error-item">
                    <div class="validation-error-icon">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                    <div class="validation-error-content">
                        <div class="validation-error-message">... and ${validationErrors.length - 10} more errors</div>
                    </div>
                </div>
            `;
        }
        
        detailsHTML += '</div>';
        validationDetails.innerHTML = detailsHTML;
    } else {
        validationDetails.innerHTML = '<p style="color: #10B981; text-align: center; padding: 20px;">✓ All records are valid and ready for import!</p>';
    }
}

/**
 * Start import process
 */
async function startImportProcess() {
    const validStudents = window.bulkUploadData.validatedData;
    
    if (validStudents.length === 0) {
        showToast('No valid students to import', 'error');
        return;
    }
    
    // Update UI for import step
    document.getElementById('bulk-upload-import').style.display = 'none';
    document.getElementById('bulk-upload-back').style.display = 'none';
    
    // Initialize progress
    const progressCurrent = document.getElementById('progress-current');
    const progressTotal = document.getElementById('progress-total');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressFill = document.getElementById('progress-fill');
    const successCount = document.getElementById('success-count');
    const errorCount = document.getElementById('error-count');
    
    progressTotal.textContent = validStudents.length;
    progressCurrent.textContent = '0';
    progressPercentage.textContent = '0%';
    progressFill.style.width = '0%';
    successCount.textContent = '0 successful';
    errorCount.textContent = '0 errors';
    
    let successful = 0;
    let errors = 0;
    
    // Process students in batches
    const batchSize = 3;
    
    for (let i = 0; i < validStudents.length; i += batchSize) {
        const batch = validStudents.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (studentData) => {
            try {
                // Generate unique student ID for each student
                const studentId = await generateUniqueStudentId(studentData.division);
                
                await addDoc(collection(db, "users"), {
                    ...studentData,
                    studentId: studentId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                return { success: true, student: studentData, studentId: studentId };
            } catch (error) {
                console.error('Error adding student:', studentData.name, error);
                return { success: false, student: studentData, error: error.message };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Update counters
        batchResults.forEach(result => {
            if (result.success) {
                successful++;
            } else {
                errors++;
            }
        });
        
        // Update progress
        const processed = successful + errors;
        const percentage = Math.round((processed / validStudents.length) * 100);
        
        progressCurrent.textContent = processed;
        progressPercentage.textContent = percentage + '%';
        progressFill.style.width = percentage + '%';
        successCount.textContent = `${successful} successful`;
        errorCount.textContent = `${errors} errors`;
        
        // Small delay between batches
        if (i + batchSize < validStudents.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Show final results
    showImportResults(successful, errors, validStudents.length);
    
    // Update analytics
    await loadStudentAnalytics();
    
    // Add notification
    if (notificationManager) {
        notificationManager.notifyBulkUploadComplete(successful);
        
        if (errors > 0) {
            notificationManager.notifyError('Bulk Import Partial Failure', `${errors} students failed to import.`);
        }
    }
}

/**
 * Show import results
 */
function showImportResults(successful, errors, total) {
    const importResults = document.getElementById('import-results');
    const finalResults = document.getElementById('final-results');
    
    finalResults.innerHTML = `
        <div class="result-summary">
            <div class="result-item">
                <div class="result-number total">${total}</div>
                <div class="result-label">Total Records</div>
            </div>
            <div class="result-item">
                <div class="result-number success">${successful}</div>
                <div class="result-label">Successfully Imported</div>
            </div>
            <div class="result-item">
                <div class="result-number error">${errors}</div>
                <div class="result-label">Failed to Import</div>
            </div>
        </div>
    `;
    
    importResults.style.display = 'block';
    
    // Show finish button
    document.getElementById('bulk-upload-finish').style.display = 'inline-block';
}

/**
 * Parse CSV file content
 */
function parseCSV(csvText) {
    try {
        if (!csvText || typeof csvText !== 'string') {
            console.warn('Invalid CSV text provided');
            return [];
        }
        
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            console.warn('CSV file must have at least header and one data row');
            return [];
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines
            
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length === headers.length || values.length > 0) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return data;
    } catch (error) {
        console.error('Error parsing CSV:', error);
        return [];
    }
}

/**
 * Validate and normalize bulk student data
 */
function validateBulkStudentData(rawData) {
    const validStudents = [];
    const validationErrors = [];
    
    // Check if rawData is valid
    if (!rawData || !Array.isArray(rawData)) {
        console.error('Invalid raw data provided to validateBulkStudentData');
        return {
            validStudents: [],
            validationErrors: [{
                row: 1,
                name: 'Unknown',
                errors: ['Invalid data format provided']
            }]
        };
    }
    
    if (rawData.length === 0) {
        return {
            validStudents: [],
            validationErrors: []
        };
    }
    
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Phone validation regex (allows digits, spaces, hyphens, parentheses, plus)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    
    for (let index = 0; index < rawData.length; index++) {
        const row = rawData[index];
        const rowNumber = index + 2; // +2 because index starts at 0 and we skip header row
        const errors = [];
        
        // Map common column names to our field names (ensuring consistent field names)
        const student = {
            name: row['Student Name'] || row['Name'] || row['name'] || '',
            email: row['Email'] || row['email'] || '',
            phone: row['Phone'] || row['Phone Number'] || row['phone'] || row['mobile'] || '',
            gender: row['Gender'] || row['gender'] || 'Male',
            dob: row['Date of Birth'] || row['DOB'] || row['dob'] || '',
            age: row['Age'] || row['age'] || '',
            address: row['Address'] || row['address'] || '',
            district: row['District'] || row['district'] || '',
            state: row['State'] || row['state'] || '',
            country: row['Country'] || row['country'] || 'India',
            zip: row['ZIP Code'] || row['Zip'] || row['zip'] || '',
            division: row['Division'] || row['division'] || '',
            course: row['Course'] || row['course'] || '',
            status: row['Status'] || row['status'] || 'active',
            admissionDate: row['Admission Date'] || row['admissionDate'] || '',
            admissionFee: row['Admission Fee'] || row['admissionFee'] || '',
            batchTime: row['Batch Time'] || row['batchTime'] || '',
            feeStatus: row['Fee Status'] || row['feeStatus'] || 'Pending',
            guardianName: row['Guardian Name'] || row['guardianName'] || '',
            guardianOccupation: row['Guardian Occupation'] || row['guardianOccupation'] || ''
        };
        
        // Required field validation
        if (!student.name || student.name.trim() === '') {
            errors.push('Student name is required');
        }
        
        if (!student.email || student.email.trim() === '') {
            errors.push('Email is required');
        } else if (!emailRegex.test(student.email.trim())) {
            errors.push('Invalid email format');
        }
        
        if (!student.phone || student.phone.trim() === '') {
            errors.push('Phone number is required');
        } else if (!phoneRegex.test(student.phone.trim())) {
            errors.push('Invalid phone number format');
        }
        
        if (!student.division || student.division.trim() === '') {
            errors.push('Division is required');
        } else {
            // Validate division values
            const validDivisions = ['CAPT', 'LBS', 'Gama Abacus'];
            if (!validDivisions.includes(student.division)) {
                errors.push('Division must be one of: CAPT, LBS, Gama Abacus');
            }
        }
        
        if (!student.guardianName || student.guardianName.trim() === '') {
            errors.push('Guardian name is required');
        }
        
        // Data type conversion and validation
        if (student.age && student.age !== '') {
            const ageNum = parseInt(student.age, 10);
            if (isNaN(ageNum) || ageNum < 5 || ageNum > 100) {
                errors.push('Age must be a valid number between 5 and 100');
            } else {
                student.age = ageNum;
            }
        }
        
        if (student.admissionFee && student.admissionFee !== '') {
            const feeNum = parseFloat(student.admissionFee);
            if (isNaN(feeNum) || feeNum < 0) {
                errors.push('Admission fee must be a valid positive number');
            } else {
                student.admissionFee = feeNum;
            }
        } else {
            student.admissionFee = 1000; // Default fee
        }
        
        // Date validation and conversion
        if (student.dob && student.dob !== '') {
            try {
                const dobDate = new Date(student.dob);
                if (isNaN(dobDate.getTime())) {
                    errors.push('Invalid date of birth format (use YYYY-MM-DD)');
                } else {
                    student.dob = dobDate.toISOString().split('T')[0]; // Store as YYYY-MM-DD string
                    
                    // Calculate age from DOB if age not provided
                    if (!student.age) {
                        const today = new Date();
                        let calculatedAge = today.getFullYear() - dobDate.getFullYear();
                        const monthDiff = today.getMonth() - dobDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
                            calculatedAge--;
                        }
                        student.age = calculatedAge > 0 ? calculatedAge : 18;
                    }
                }
            } catch (error) {
                errors.push('Invalid date of birth format (use YYYY-MM-DD)');
            }
        }
        
        if (student.admissionDate && student.admissionDate !== '') {
            try {
                const admissionDate = new Date(student.admissionDate);
                if (isNaN(admissionDate.getTime())) {
                    errors.push('Invalid admission date format (use YYYY-MM-DD)');
                } else {
                    student.admissionDate = admissionDate; // Store as Date object for Firestore
                }
            } catch (error) {
                errors.push('Invalid admission date format (use YYYY-MM-DD)');
            }
        } else {
            student.admissionDate = new Date(); // Default to today
        }
        
        // Division-specific validation and defaults
        if (student.division === 'Gama Abacus') {
            student.course = 'Gama Abacus';
            student.feeStatus = 'Paid';
        } else if (student.division === 'CAPT' || student.division === 'LBS') {
            if (!student.course || student.course.trim() === '') {
                student.course = 'General'; // Default course
            }
            if (!student.feeStatus || student.feeStatus.trim() === '') {
                student.feeStatus = 'Pending'; // Default fee status
            }
        }
        
        // Set default values for all required fields
        student.photoURL = student.photoURL || 'https://i.pinimg.com/736x/38/41/97/384197530d32338dd6caafaf1c6a26c4.jpg';
        student.role = 'student';
        student.status = student.status || 'active';
        student.batchTime = student.batchTime || '09:00';
        student.address = student.address || 'Address not provided';
        student.district = student.district || 'District not provided';
        student.state = student.state || 'State not provided';
        student.zip = student.zip || '000000';
        student.age = student.age || 18;
        
        // Clean up string fields
        Object.keys(student).forEach(key => {
            if (typeof student[key] === 'string') {
                student[key] = student[key].trim();
            }
        });
        
        // If no validation errors, add to valid students
        if (errors.length === 0) {
            validStudents.push(student);
        } else {
            validationErrors.push({
                row: rowNumber,
                name: student.name || 'Unknown',
                errors: errors
            });
        }
    }
    
    // Show validation summary
    if (validationErrors.length > 0) {
        console.warn('Validation errors found:', validationErrors);
        
        // Create detailed error message
        let errorMessage = `Found ${validationErrors.length} invalid records:\n\n`;
        validationErrors.slice(0, 5).forEach(error => {
            errorMessage += `Row ${error.row} (${error.name}): ${error.errors.join(', ')}\n`;
        });
        
        if (validationErrors.length > 5) {
            errorMessage += `\n... and ${validationErrors.length - 5} more errors.`;
        }
        
        errorMessage += `\n\nValid records: ${validStudents.length}`;
        
        // Show detailed error message
        alert(errorMessage);
        
        // Also show toast notification
        showToast(`Validation completed: ${validStudents.length} valid records, ${validationErrors.length} errors`, 'warning');
    }
    
    return {
        validStudents: validStudents,
        validationErrors: validationErrors
    };
}

/**
 * Download sample template for bulk upload
 */
function downloadSampleTemplate() {
    try {
        // Create sample data with more comprehensive examples
        const sampleData = [
            {
                'Student Name': 'John Doe',
                'Email': 'john.doe@email.com',
                'Phone': '+1234567890',
                'Gender': 'Male',
                'Date of Birth': '2000-01-15',
                'Age': '24',
                'Address': '123 Main Street, Apartment 5B',
                'District': 'Central District',
                'State': 'California',
                'Country': 'USA',
                'ZIP Code': '12345',
                'Division': 'CAPT',
                'Course': 'Basic Computer Course',
                'Status': 'active',
                'Admission Date': '2024-01-15',
                'Admission Fee': '5000',
                'Batch Time': '10:00 AM - 12:00 PM',
                'Fee Status': 'Paid',
                'Guardian Name': 'Jane Doe',
                'Guardian Occupation': 'Software Engineer'
            },
            {
                'Student Name': 'Sarah Smith',
                'Email': 'sarah.smith@email.com',
                'Phone': '+1234567891',
                'Gender': 'Female',
                'Date of Birth': '1999-05-20',
                'Age': '25',
                'Address': '456 Oak Avenue, Unit 12',
                'District': 'North District',
                'State': 'California',
                'Country': 'USA',
                'ZIP Code': '12346',
                'Division': 'LBS',
                'Course': 'Advanced Mathematics',
                'Status': 'active',
                'Admission Date': '2024-01-20',
                'Admission Fee': '4000',
                'Batch Time': '2:00 PM - 4:00 PM',
                'Fee Status': 'Pending',
                'Guardian Name': 'Robert Smith',
                'Guardian Occupation': 'Medical Doctor'
            },
            {
                'Student Name': 'Mike Johnson',
                'Email': 'mike.johnson@email.com',
                'Phone': '+1234567892',
                'Gender': 'Male',
                'Date of Birth': '2001-12-10',
                'Age': '23',
                'Address': '789 Pine Road, House 8',
                'District': 'South District',
                'State': 'California',
                'Country': 'USA',
                'ZIP Code': '12347',
                'Division': 'Gama Abacus',
                'Course': 'Mental Mathematics',
                'Status': 'active',
                'Admission Date': '2024-02-01',
                'Admission Fee': '3500',
                'Batch Time': '9:00 AM - 11:00 AM',
                'Fee Status': 'Paid',
                'Guardian Name': 'Lisa Johnson',
                'Guardian Occupation': 'High School Teacher'
            },
            {
                'Student Name': 'Emily Davis',
                'Email': 'emily.davis@email.com',
                'Phone': '+1234567893',
                'Gender': 'Female',
                'Date of Birth': '2002-03-25',
                'Age': '22',
                'Address': '321 Elm Street, Building A',
                'District': 'East District',
                'State': 'California',
                'Country': 'USA',
                'ZIP Code': '12348',
                'Division': 'CAPT',
                'Course': 'Web Development',
                'Status': 'active',
                'Admission Date': '2024-02-15',
                'Admission Fee': '6000',
                'Batch Time': '4:00 PM - 6:00 PM',
                'Fee Status': 'Paid',
                'Guardian Name': 'Michael Davis',
                'Guardian Occupation': 'Business Owner'
            },
            {
                'Student Name': 'Alex Rodriguez',
                'Email': 'alex.rodriguez@email.com',
                'Phone': '+1234567894',
                'Gender': 'Male',
                'Date of Birth': '1998-11-08',
                'Age': '26',
                'Address': '654 Maple Avenue, Floor 3',
                'District': 'West District',
                'State': 'California',
                'Country': 'USA',
                'ZIP Code': '12349',
                'Division': 'LBS',
                'Course': 'Data Analysis',
                'Status': 'active',
                'Admission Date': '2024-03-01',
                'Admission Fee': '5500',
                'Batch Time': '11:00 AM - 1:00 PM',
                'Fee Status': 'Pending',
                'Guardian Name': 'Maria Rodriguez',
                'Guardian Occupation': 'Nurse'
            }
        ];
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        
        // Set column widths
        const columnWidths = [
            { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
            { wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 15 },
            { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
        ];
        worksheet['!cols'] = columnWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Students');
        
        // Create comprehensive instructions worksheet
        const instructions = [
            { 'Field': 'Student Name', 'Required': 'YES', 'Description': 'Full name of the student (First and Last name)', 'Example': 'John Doe', 'Notes': 'Cannot be empty. Used as primary identifier.' },
            { 'Field': 'Email', 'Required': 'YES', 'Description': 'Valid email address for the student', 'Example': 'john@email.com', 'Notes': 'Must be in valid email format (user@domain.com)' },
            { 'Field': 'Phone', 'Required': 'YES', 'Description': 'Contact phone number with country code', 'Example': '+1234567890', 'Notes': 'Can include +, -, spaces, parentheses' },
            { 'Field': 'Gender', 'Required': 'NO', 'Description': 'Gender of the student', 'Example': 'Male', 'Notes': 'Options: Male, Female, Other. Default: Male' },
            { 'Field': 'Date of Birth', 'Required': 'NO', 'Description': 'Date of birth in YYYY-MM-DD format', 'Example': '2000-01-15', 'Notes': 'Used to calculate age if age field is empty' },
            { 'Field': 'Age', 'Required': 'NO', 'Description': 'Student age in years (5-100)', 'Example': '24', 'Notes': 'Auto-calculated from DOB if provided. Default: 18' },
            { 'Field': 'Address', 'Required': 'NO', 'Description': 'Complete residential address', 'Example': '123 Main Street, Apt 5B', 'Notes': 'Default: "Address not provided"' },
            { 'Field': 'District', 'Required': 'NO', 'Description': 'District or area name', 'Example': 'Central District', 'Notes': 'Default: "District not provided"' },
            { 'Field': 'State', 'Required': 'NO', 'Description': 'State or province name', 'Example': 'California', 'Notes': 'Default: "State not provided"' },
            { 'Field': 'Country', 'Required': 'NO', 'Description': 'Country name', 'Example': 'USA', 'Notes': 'Default: "India"' },
            { 'Field': 'ZIP Code', 'Required': 'NO', 'Description': 'Postal/ZIP code', 'Example': '12345', 'Notes': 'Default: "000000"' },
            { 'Field': 'Division', 'Required': 'YES', 'Description': 'Student division - EXACTLY as shown', 'Example': 'CAPT', 'Notes': 'MUST be one of: CAPT, LBS, Gama Abacus' },
            { 'Field': 'Course', 'Required': 'CONDITIONAL', 'Description': 'Course name (required for CAPT/LBS)', 'Example': 'Basic Computer Course', 'Notes': 'Required for CAPT/LBS. Auto-set for Gama Abacus' },
            { 'Field': 'Status', 'Required': 'NO', 'Description': 'Student enrollment status', 'Example': 'active', 'Notes': 'Options: active, inactive. Default: active' },
            { 'Field': 'Admission Date', 'Required': 'NO', 'Description': 'Date of admission in YYYY-MM-DD format', 'Example': '2024-01-15', 'Notes': 'Default: current date' },
            { 'Field': 'Admission Fee', 'Required': 'NO', 'Description': 'Fee amount in numbers only', 'Example': '5000', 'Notes': 'Must be positive number. Default: 1000' },
            { 'Field': 'Batch Time', 'Required': 'NO', 'Description': 'Class timing or schedule', 'Example': '10:00 AM - 12:00 PM', 'Notes': 'Default: "09:00"' },
            { 'Field': 'Fee Status', 'Required': 'CONDITIONAL', 'Description': 'Payment status (required for CAPT/LBS)', 'Example': 'Paid', 'Notes': 'Options: Paid, Pending. Auto-set for Gama Abacus' },
            { 'Field': 'Guardian Name', 'Required': 'YES', 'Description': 'Parent or guardian full name', 'Example': 'Jane Doe', 'Notes': 'Cannot be empty' },
            { 'Field': 'Guardian Occupation', 'Required': 'NO', 'Description': 'Guardian profession or job', 'Example': 'Software Engineer', 'Notes': 'Optional field' },
            { 'Field': '', 'Required': '', 'Description': '', 'Example': '', 'Notes': '' },
            { 'Field': 'IMPORTANT NOTES:', 'Required': '', 'Description': '', 'Example': '', 'Notes': '' },
            { 'Field': '1. Division Rules', 'Required': '', 'Description': 'Gama Abacus: Course auto-set to "Gama Abacus", Fee Status auto-set to "Paid"', 'Example': '', 'Notes': '' },
            { 'Field': '2. Date Format', 'Required': '', 'Description': 'All dates must be in YYYY-MM-DD format (e.g., 2024-01-15)', 'Example': '', 'Notes': '' },
            { 'Field': '3. Required Fields', 'Required': '', 'Description': 'Student Name, Email, Phone, Division, Guardian Name are mandatory', 'Example': '', 'Notes': '' },
            { 'Field': '4. Data Validation', 'Required': '', 'Description': 'Invalid records will be skipped with detailed error messages', 'Example': '', 'Notes': '' },
            { 'Field': '5. File Support', 'Required': '', 'Description': 'Supports .xlsx, .xls, and .csv file formats', 'Example': '', 'Notes': '' }
        ];
        
        const instructionsWorksheet = XLSX.utils.json_to_sheet(instructions);
        instructionsWorksheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 35 }, { wch: 25 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions');
        
        // Download the template
        const fileName = `student_upload_template_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        showToast('Sample template downloaded successfully!', 'success');
        
        if (notificationManager) {
            notificationManager.addNotification({
                type: 'info',
                title: 'Template Downloaded',
                message: 'Sample upload template has been downloaded. Fill it with your student data and upload it back.'
            });
        }
        
    } catch (error) {
        console.error('Error creating sample template:', error);
        showToast('Failed to create sample template: ' + error.message, 'error');
    }
}

/**
 * Show notification when filter is applied
 */
function showFilterNotification() {
    let activeFilters = [];
    
    if (currentFilters.search) activeFilters.push('search');
    if (currentFilters.division && currentFilters.division !== 'all') activeFilters.push('division');
    if (currentFilters.course && currentFilters.course !== 'all') activeFilters.push('course');
    if (currentFilters.status && currentFilters.status !== 'all') activeFilters.push('status');
    
    if (activeFilters.length > 0) {
        showToast(`Filters applied: ${activeFilters.join(', ')}. Showing ${filteredStudents.length} students.`, 'info');
    } else {
        showToast(`All filters cleared. Showing ${filteredStudents.length} students.`, 'info');
    }
}

/**
 * Show notification when student data is refreshed
 */
function showRefreshNotification() {
    showToast('Student data refreshed successfully!', 'success');
}

/**
 * Show notification for pagination changes
 */
function showPaginationNotification(page, totalPages) {
    if (totalPages > 1) {
        showToast(`Page ${page} of ${totalPages}`, 'info');
    }
}