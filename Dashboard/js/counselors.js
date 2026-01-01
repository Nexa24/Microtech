/**
 * ============================================
 * MICROTECH COUNSELOR MANAGEMENT SYSTEM
 * ============================================
 * Complete counselor inquiry and admission management
 * Features: Inquiry tracking, follow-ups, conversion, analytics
 */

import { initializeUserProfile, addProfileStyles } from './profile-utils.js';
import { showToast } from './toast.js';
import { initializeNotifications } from './notification-manager.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc,
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const DEMO_MODE = false; // Set to false to use Firebase

const firebaseConfig = {
    apiKey: "AIzaSyD5pgNOjCXdkopJW_mtqTpnaa-8MyUZzHc",
    authDomain: "microtech-88235.firebaseapp.com",
    databaseURL: "https://microtech-88235-default-rtdb.firebaseio.com",
    projectId: "microtech-88235",
    storageBucket: "microtech-88235.appspot.com",
    messagingSenderId: "177325108755",
    appId: "1:177325108755:web:37d5a44e9a721a501359e6",
    measurementId: "G-0NXTJF6L49"
};

// Initialize Firebase
let app, db, auth;
if (!DEMO_MODE) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
}

// ============================================
// GLOBAL STATE
// ============================================
let allInquiries = [];
let allCourses = [];
let currentEditingId = null;
let currentUser = { uid: 'demo-user', displayName: 'Demo User', email: 'demo@microtech.com' };

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Counselor Management System Initializing...');
    
    // Initialize profile functionality
    try {
        addProfileStyles();
        initializeUserProfile();
    } catch (error) {
        console.log('Profile utils not loaded, continuing without them');
    }

    // Initialize notification system
    window.notificationManager = initializeNotifications();
    console.log('✅ Notification system initialized');
    
    if (DEMO_MODE) {
        // Demo mode - load with sample data
        console.log('Running in DEMO MODE');
        await initializeSystem();
    } else {
        // Production mode - check authentication and role
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                await checkUserRole(user.uid);
                await initializeSystem();
            } else {
                window.location.href = '../login.html';
            }
        });
    }
});

/**
 * Check user role and permissions
 */
async function checkUserRole(uid) {
    if (DEMO_MODE) {
        console.log('Demo mode - skipping role check');
        return;
    }
    
    try {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            const allowedRoles = ['admin', 'counselor'];
            
            if (!allowedRoles.includes(userData.role)) {
                showToast('Access Denied: You do not have permission to access this page', 'error');
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error checking role:', error);
    }
}

/**
 * Initialize the entire system
 */
async function initializeSystem() {
    try {
        console.log('Initializing system - DEMO_MODE:', DEMO_MODE);
        
        if (DEMO_MODE) {
            loadDemoData();
        } else {
            await loadCourses();
            await loadInquiries();
        }
        updateAnalytics();
        setupEventListeners();
        checkUpcomingFollowups();
        
        const message = DEMO_MODE ? 'Counselor Management System Loaded (DEMO MODE)' : 'Counselor Management System Loaded';
        console.log(message + ' - Total inquiries:', allInquiries.length);
        try {
            showToast(message, 'success');
        } catch (e) {
            console.log(message);
        }
    } catch (error) {
        console.error('System initialization error:', error);
        try {
            showToast('Error loading system. Please refresh the page.', 'error');
        } catch (e) {
            console.error('Error loading system. Please refresh the page.');
        }
    }
}

// ============================================
// DATA LOADING FUNCTIONS
// ============================================

/**
 * Load demo data for testing without Firebase
 */
function loadDemoData() {
    // Demo courses
    allCourses = [
        { id: 'course1', courseName: 'Basic Computer Course', duration: '3 months', fee: 5000, provider: 'MicroTech Center', status: 'Active' },
        { id: 'course2', courseName: 'Advanced Excel & Tally', duration: '2 months', fee: 7000, provider: 'MicroTech Center', status: 'Active' },
        { id: 'course3', courseName: 'Graphic Design (Photoshop + CorelDRAW)', duration: '4 months', fee: 12000, provider: 'MicroTech Center', status: 'Active' },
        { id: 'course4', courseName: 'Full Stack Web Development', duration: '6 months', fee: 25000, provider: 'MicroTech Center', status: 'Active' },
        { id: 'course5', courseName: 'Digital Marketing', duration: '3 months', fee: 8000, provider: 'MicroTech Center', status: 'Active' }
    ];
    
    // Demo inquiries - empty array (no demo data)
    allInquiries = [];
    
    populateCoursesCheckbox();
    displayInquiries(allInquiries);
    console.log('Demo data loaded successfully');
}

/**
 * Load all courses from Firestore
 */
async function loadCourses() {
    if (DEMO_MODE) {
        loadDemoData();
        return;
    }
    
    try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        allCourses = coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        populateCoursesCheckbox();
    } catch (error) {
        console.error('Error loading courses:', error);
        try {
            showToast('Error loading courses', 'error');
        } catch (e) {
            console.error('Error loading courses');
        }
    }
}

/**
 * Load all inquiries from Firestore
 */
async function loadInquiries() {
    if (DEMO_MODE) {
        // Demo mode - display current inquiries
        console.log('Demo mode - displaying inquiries:', allInquiries.length);
        displayInquiries(allInquiries);
        return;
    }
    
    try {
        console.log('Loading inquiries from Firebase...');
        const inquiriesSnapshot = await getDocs(
            query(collection(db, 'counselor_inquiries'), orderBy('createdAt', 'desc'))
        );
        
        allInquiries = inquiriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('Loaded inquiries:', allInquiries.length);
        displayInquiries(allInquiries);
    } catch (error) {
        console.error('Error loading inquiries:', error);
        try {
            showToast('Error loading inquiries', 'error');
        } catch (e) {
            console.error('Error loading inquiries');
        }
        document.getElementById('inquiries-table-body').innerHTML = 
            '<tr><td colspan="9" class="no-data">Error loading data</td></tr>';
    }
}

/**
 * Populate courses checkbox list in modal
 */
function populateCoursesCheckbox() {
    const container = document.getElementById('courses-checkbox-list');
    container.innerHTML = '';
    
    if (allCourses.length === 0) {
        container.innerHTML = '<p style="color: #9CA3AF;">No courses available</p>';
        return;
    }
    
    allCourses.forEach(course => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        checkboxItem.innerHTML = `
            <input type="checkbox" id="course-${course.id}" value="${course.id}">
            <label for="course-${course.id}">${course.courseName || course.name}</label>
        `;
        container.appendChild(checkboxItem);
    });
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

/**
 * Display inquiries in table
 */
function displayInquiries(inquiries) {
    const tbody = document.getElementById('inquiries-table-body');
    console.log('Displaying inquiries:', inquiries.length);
    
    if (inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No inquiries found. Click "Add New Inquiry" to get started.</td></tr>';
        return;
    }
    
    tbody.innerHTML = inquiries.map(inquiry => {
        const createdDate = inquiry.createdAt?.toDate ? inquiry.createdAt.toDate() : (inquiry.createdAt instanceof Date ? inquiry.createdAt : new Date());
        const followupDate = inquiry.nextFollowUp?.toDate ? inquiry.nextFollowUp.toDate() : (inquiry.nextFollowUp instanceof Date ? inquiry.nextFollowUp : null);
        
        // Get course names instead of IDs
        let courses = 'N/A';
        if (Array.isArray(inquiry.interestedCourses)) {
            const courseNames = inquiry.interestedCourses.map(courseId => {
                const course = allCourses.find(c => c.id === courseId);
                return course ? course.courseName || course.name : courseId;
            });
            courses = courseNames.join(', ');
        } else if (inquiry.interestedCourses) {
            courses = inquiry.interestedCourses;
        }
        
        return `
            <tr>
                <td>#${inquiry.id.substring(0, 6)}</td>
                <td>
                    <strong>${inquiry.name}</strong>
                </td>
                <td>
                    <div>${inquiry.phone}</div>
                    ${inquiry.email ? `<small style="color: #9CA3AF;">${inquiry.email}</small>` : ''}
                </td>
                <td>${courses}</td>
                <td>${inquiry.source || 'N/A'}</td>
                <td>
                    <span class="status-badge status-${inquiry.status.toLowerCase().replace(' ', '-').replace('-', '')}">${inquiry.status}</span>
                </td>
                <td>${followupDate ? formatDate(followupDate) : 'Not Set'}</td>
                <td>${inquiry.counselorName || 'Unassigned'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-btn-view" onclick="viewInquiry('${inquiry.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn action-btn-edit" onclick="editInquiry('${inquiry.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${inquiry.status !== 'Converted' ? `
                            <button class="action-btn action-btn-followup" onclick="openFollowupModal('${inquiry.id}')" title="Add Follow-up">
                                <i class="fas fa-calendar-plus"></i>
                            </button>
                            <button class="action-btn action-btn-convert" onclick="openConvertModal('${inquiry.id}')" title="Convert to Student">
                                <i class="fas fa-user-graduate"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn action-btn-whatsapp" onclick="sendWhatsApp('${inquiry.phone}')" title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button class="action-btn action-btn-email" onclick="sendEmail('${inquiry.email}')" title="Email">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <button class="action-btn action-btn-delete" onclick="deleteInquiry('${inquiry.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update analytics cards
 */
function updateAnalytics() {
    const total = allInquiries.length;
    const converted = allInquiries.filter(i => i.status === 'Converted').length;
    const pending = allInquiries.filter(i => {
        if (!i.nextFollowUp) return false;
        const followupDate = i.nextFollowUp.toDate ? i.nextFollowUp.toDate() : new Date(i.nextFollowUp);
        return followupDate >= new Date() && i.status === 'Follow-up';
    }).length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;
    
    document.getElementById('total-inquiries').textContent = total;
    document.getElementById('converted-count').textContent = converted;
    document.getElementById('pending-followups').textContent = pending;
    document.getElementById('conversion-rate').textContent = `${conversionRate}%`;
}

// ============================================
// MODAL FUNCTIONS
// ============================================

/**
 * Open Add Inquiry Modal
 */
window.openAddInquiryModal = function() {
    currentEditingId = null;
    document.getElementById('inquiry-modal-title').textContent = 'Add New Inquiry';
    document.getElementById('inquiry-form').reset();
    document.getElementById('inquiry-id').value = '';
    document.getElementById('inquiry-modal').style.display = 'block';
};

/**
 * Close Inquiry Modal
 */
window.closeInquiryModal = function() {
    document.getElementById('inquiry-modal').style.display = 'none';
    document.getElementById('inquiry-form').reset();
    currentEditingId = null;
};

/**
 * Edit Inquiry
 */
window.editInquiry = function(id) {
    const inquiry = allInquiries.find(i => i.id === id);
    if (!inquiry) return;
    
    currentEditingId = id;
    document.getElementById('inquiry-modal-title').textContent = 'Edit Inquiry';
    document.getElementById('inquiry-id').value = id;
    document.getElementById('inquiry-name').value = inquiry.name;
    document.getElementById('inquiry-phone').value = inquiry.phone;
    document.getElementById('inquiry-email').value = inquiry.email || '';
    document.getElementById('inquiry-source').value = inquiry.source;
    document.getElementById('inquiry-address').value = inquiry.address || '';
    document.getElementById('inquiry-status').value = inquiry.status;
    document.getElementById('inquiry-remarks').value = inquiry.remarks || '';
    
    // Set follow-up date
    if (inquiry.nextFollowUp) {
        const date = inquiry.nextFollowUp.toDate ? inquiry.nextFollowUp.toDate() : new Date(inquiry.nextFollowUp);
        document.getElementById('inquiry-followup-date').value = formatDateTimeLocal(date);
    }
    
    // Check interested courses
    if (Array.isArray(inquiry.interestedCourses)) {
        inquiry.interestedCourses.forEach(courseId => {
            const checkbox = document.getElementById(`course-${courseId}`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    document.getElementById('inquiry-modal').style.display = 'block';
};

/**
 * View Inquiry Details
 */
window.viewInquiry = function(id) {
    const inquiry = allInquiries.find(i => i.id === id);
    if (!inquiry) return;
    
    const createdDate = inquiry.createdAt?.toDate ? inquiry.createdAt.toDate() : new Date();
    const updatedDate = inquiry.updatedAt?.toDate ? inquiry.updatedAt.toDate() : null;
    const followupDate = inquiry.nextFollowUp?.toDate ? inquiry.nextFollowUp.toDate() : null;
    
    // Get course names
    let courseNames = 'N/A';
    if (Array.isArray(inquiry.interestedCourses)) {
        const names = inquiry.interestedCourses.map(courseId => {
            const course = allCourses.find(c => c.id === courseId);
            return course ? course.courseName || course.name : courseId;
        });
        courseNames = names.join(', ');
    }
    
    const modalBody = document.getElementById('details-modal-body');
    modalBody.innerHTML = `
        <div class="details-grid">
            <div class="detail-item">
                <div class="detail-label">Name</div>
                <div class="detail-value">${inquiry.name}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">${inquiry.phone}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${inquiry.email || 'Not provided'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Source</div>
                <div class="detail-value">${inquiry.source}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">
                    <span class="status-badge status-${inquiry.status.toLowerCase().replace(' ', '-').replace('-', '')}">${inquiry.status}</span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Counselor</div>
                <div class="detail-value">${inquiry.counselorName || 'Unassigned'}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Address</h3>
            <div class="detail-value">${inquiry.address || 'Not provided'}</div>
        </div>
        
        <div class="detail-section">
            <h3>Interested Courses</h3>
            <div class="detail-value">${courseNames}</div>
        </div>
        
        <div class="detail-section">
            <h3>Next Follow-up</h3>
            <div class="detail-value">${followupDate ? formatDateTime(followupDate) : 'Not scheduled'}</div>
        </div>
        
        <div class="detail-section">
            <h3>Remarks</h3>
            <div class="detail-value">${inquiry.remarks || 'No remarks'}</div>
        </div>
        
        <div class="details-grid">
            <div class="detail-item">
                <div class="detail-label">Created At</div>
                <div class="detail-value">${formatDateTime(createdDate)}</div>
            </div>
            ${updatedDate ? `
                <div class="detail-item">
                    <div class="detail-label">Last Updated</div>
                    <div class="detail-value">${formatDateTime(updatedDate)}</div>
                </div>
            ` : ''}
        </div>
        
        ${inquiry.followUpHistory && inquiry.followUpHistory.length > 0 ? `
            <div class="followup-history">
                <h3>Follow-up History</h3>
                ${inquiry.followUpHistory.map(fu => `
                    <div class="followup-item">
                        <div class="followup-date">${formatDateTime(fu.date.toDate())}</div>
                        <div class="followup-text">${fu.remarks}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="modal-footer">
            <button class="btn btn-primary" onclick="closeDetailsModal()">Close</button>
        </div>
    `;
    
    document.getElementById('details-modal').style.display = 'block';
};

/**
 * Close Details Modal
 */
window.closeDetailsModal = function() {
    document.getElementById('details-modal').style.display = 'none';
};

/**
 * Open Follow-up Modal
 */
window.openFollowupModal = function(id) {
    document.getElementById('followup-inquiry-id').value = id;
    document.getElementById('followup-form').reset();
    document.getElementById('followup-modal').style.display = 'block';
};

/**
 * Close Follow-up Modal
 */
window.closeFollowupModal = function() {
    document.getElementById('followup-modal').style.display = 'none';
    document.getElementById('followup-form').reset();
};

/**
 * Open Convert to Admission Modal
 */
window.openConvertModal = function(id) {
    const inquiry = allInquiries.find(i => i.id === id);
    if (!inquiry) return;
    
    document.getElementById('convert-inquiry-id').value = id;
    
    // Display selected courses
    let coursesList = 'No courses selected';
    if (Array.isArray(inquiry.interestedCourses)) {
        const names = inquiry.interestedCourses.map(courseId => {
            const course = allCourses.find(c => c.id === courseId);
            return course ? course.courseName || course.name : courseId;
        });
        coursesList = `<ul style="margin: 0; padding-left: 20px;">${names.map(n => `<li>${n}</li>`).join('')}</ul>`;
    }
    
    document.getElementById('convert-courses-list').innerHTML = coursesList;
    document.getElementById('convert-modal').style.display = 'block';
};

/**
 * Close Convert Modal
 */
window.closeConvertModal = function() {
    document.getElementById('convert-modal').style.display = 'none';
    document.getElementById('convert-form').reset();
};

// ============================================
// FORM SUBMISSION HANDLERS
// ============================================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Inquiry Form
    document.getElementById('inquiry-form').addEventListener('submit', handleInquirySubmit);
    
    // Follow-up Form
    document.getElementById('followup-form').addEventListener('submit', handleFollowupSubmit);
    
    // Convert Form
    document.getElementById('convert-form').addEventListener('submit', handleConvertSubmit);
    
    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

/**
 * Handle inquiry form submission
 */
async function handleInquirySubmit(e) {
    e.preventDefault();
    
    try {
        // Get selected courses
        const selectedCourses = [];
        document.querySelectorAll('#courses-checkbox-list input[type="checkbox"]:checked').forEach(cb => {
            selectedCourses.push(cb.value);
        });
        
        if (selectedCourses.length === 0) {
            showToast('Please select at least one course', 'warning');
            await showCustomAlert('⚠️ Please select at least one course the student is interested in.', 'warning', 'Missing Information');
            return;
        }
        
        const inquiryData = {
            name: document.getElementById('inquiry-name').value,
            phone: document.getElementById('inquiry-phone').value,
            email: document.getElementById('inquiry-email').value,
            source: document.getElementById('inquiry-source').value,
            address: document.getElementById('inquiry-address').value,
            interestedCourses: selectedCourses,
            status: document.getElementById('inquiry-status').value,
            remarks: document.getElementById('inquiry-remarks').value,
            counselorID: currentUser.uid,
            counselorName: currentUser.displayName || currentUser.email,
            updatedAt: new Date()
        };
        
        // Add follow-up date if provided
        const followupDate = document.getElementById('inquiry-followup-date').value;
        if (followupDate) {
            inquiryData.nextFollowUp = new Date(followupDate);
        }
        
        if (DEMO_MODE) {
            // Demo mode - update local data
            if (currentEditingId) {
                const index = allInquiries.findIndex(i => i.id === currentEditingId);
                if (index !== -1) {
                    allInquiries[index] = { ...allInquiries[index], ...inquiryData };
                }
                showToast('Inquiry updated successfully (Demo Mode)', 'success');
                await showCustomAlert(`✅ Inquiry for ${inquiryData.name} has been updated successfully!`, 'success', 'Update Successful')
                
                // Add notification for update
                if (window.notificationManager) {
                    window.notificationManager.addNotification({
                        type: 'success',
                        title: 'Inquiry Updated',
                        message: `${inquiryData.name}'s inquiry has been updated successfully.`,
                        category: 'Counselors'
                    });
                }
            } else {
                inquiryData.id = 'inq' + Date.now();
                inquiryData.createdAt = new Date();
                inquiryData.followUpHistory = [];
                allInquiries.unshift(inquiryData);
                showToast('Inquiry added successfully (Demo Mode)', 'success');
                await showCustomAlert(`✅ New inquiry for ${inquiryData.name} has been added successfully!\n\nID: ${inquiryData.id}`, 'success', 'Inquiry Added')
                
                // Add notification for new inquiry
                if (window.notificationManager) {
                    window.notificationManager.addNotification({
                        type: 'success',
                        title: 'New Inquiry Added',
                        message: `${inquiryData.name} has been added as a new inquiry.`,
                        category: 'Counselors'
                    });
                }
            }
            displayInquiries(allInquiries);
        } else {
            // Firebase mode
            if (currentEditingId) {
                inquiryData.updatedAt = serverTimestamp();
                await updateDoc(doc(db, 'counselor_inquiries', currentEditingId), inquiryData);
                showToast('Inquiry updated successfully', 'success');
                await showCustomAlert(`✅ Inquiry for ${inquiryData.name} has been updated successfully!`, 'success', 'Update Successful');
                
                // Add notification
                if (window.notificationManager) {
                    window.notificationManager.addNotification({
                        type: 'success',
                        title: 'Inquiry Updated',
                        message: `${inquiryData.name}'s inquiry has been updated successfully.`,
                        category: 'Counselors'
                    });
                }
            } else {
                inquiryData.createdAt = serverTimestamp();
                inquiryData.updatedAt = serverTimestamp();
                inquiryData.followUpHistory = [];
                if (followupDate) {
                    inquiryData.nextFollowUp = Timestamp.fromDate(new Date(followupDate));
                }
                const docRef = await addDoc(collection(db, 'counselor_inquiries'), inquiryData);
                showToast('Inquiry added successfully', 'success');
                await showCustomAlert(`✅ New inquiry for ${inquiryData.name} has been added successfully!\n\nID: ${docRef.id}`, 'success', 'Inquiry Added');
                
                // Add notification
                if (window.notificationManager) {
                    window.notificationManager.addNotification({
                        type: 'success',
                        title: 'New Inquiry Added',
                        message: `${inquiryData.name} has been added as a new inquiry.`,
                        category: 'Counselors'
                    });
                }
            }
            await loadInquiries();
        }
        
        closeInquiryModal();
        updateAnalytics();
        
    } catch (error) {
        console.error('Error saving inquiry:', error);
        showToast('Error saving inquiry. Please try again.', 'error');
        await showCustomAlert('❌ Failed to save inquiry. Please check all fields and try again.\n\nError: ' + error.message, 'error', 'Save Failed');
    }
}

/**
 * Handle follow-up form submission
 */
async function handleFollowupSubmit(e) {
    e.preventDefault();
    
    try {
        const inquiryId = document.getElementById('followup-inquiry-id').value;
        const followupDate = new Date(document.getElementById('followup-date').value);
        const followupRemarks = document.getElementById('followup-remarks').value;
        const newStatus = document.getElementById('followup-status').value;
        
        const inquiry = allInquiries.find(i => i.id === inquiryId);
        if (!inquiry) throw new Error('Inquiry not found');
        
        // Update follow-up history
        const followUpHistory = inquiry.followUpHistory || [];
        followUpHistory.push({
            date: Timestamp.fromDate(new Date()),
            remarks: followupRemarks,
            by: currentUser.displayName || currentUser.email
        });
        
        await updateDoc(doc(db, 'counselor_inquiries', inquiryId), {
            nextFollowUp: Timestamp.fromDate(followupDate),
            status: newStatus,
            followUpHistory: followUpHistory,
            updatedAt: serverTimestamp()
        });
        
        showToast('Follow-up added successfully', 'success');
        await showCustomAlert(`📅 Follow-up scheduled for ${inquiry.name}\n\nDate: ${followupDate.toLocaleDateString()}\nStatus: ${newStatus}`, 'info', 'Follow-up Scheduled');
        
        // Add notification
        if (window.notificationManager) {
            window.notificationManager.addNotification({
                type: 'info',
                title: 'Follow-up Scheduled',
                message: `Follow-up scheduled for ${inquiry.name} on ${followupDate.toLocaleDateString()}.`,
                category: 'Counselors'
            });
        }
        
        closeFollowupModal();
        await loadInquiries();
        updateAnalytics();
        
    } catch (error) {
        console.error('Error adding follow-up:', error);
        showToast('Error adding follow-up. Please try again.', 'error');
        await showCustomAlert('❌ Failed to add follow-up. Please try again.\n\nIf the problem persists, contact support.', 'error', 'Error');
    }
}

/**
 * Handle convert to admission submission
 */
async function handleConvertSubmit(e) {
    e.preventDefault();
    
    try {
        const inquiryId = document.getElementById('convert-inquiry-id').value;
        const initialPayment = document.getElementById('convert-initial-payment').value;
        const paymentMode = document.getElementById('convert-payment-mode').value;
        const notes = document.getElementById('convert-notes').value;
        
        const inquiry = allInquiries.find(i => i.id === inquiryId);
        if (!inquiry) throw new Error('Inquiry not found');
        
        // Generate student ID
        const studentId = 'STU' + Date.now().toString().slice(-8);
        
        // Create student record
        const studentData = {
            studentId: studentId,
            name: inquiry.name,
            phone: inquiry.phone,
            email: inquiry.email || '',
            address: inquiry.address || '',
            enrolledCourses: inquiry.interestedCourses,
            admissionDate: serverTimestamp(),
            source: inquiry.source,
            referredBy: inquiry.counselorName,
            notes: notes,
            status: 'Active',
            createdAt: serverTimestamp()
        };
        
        // Add to students collection
        await addDoc(collection(db, 'students'), studentData);
        
        // Record payment if provided
        if (initialPayment && parseFloat(initialPayment) > 0) {
            const paymentData = {
                studentId: studentId,
                studentName: inquiry.name,
                amount: parseFloat(initialPayment),
                paymentMode: paymentMode,
                paymentType: 'Initial Fee',
                receiptId: 'REC' + Date.now().toString().slice(-8),
                createdAt: serverTimestamp(),
                createdBy: currentUser.displayName || currentUser.email
            };
            await addDoc(collection(db, 'payments'), paymentData);
        }
        
        // Update inquiry status to Converted
        await updateDoc(doc(db, 'counselor_inquiries', inquiryId), {
            status: 'Converted',
            convertedToStudentId: studentId,
            conversionDate: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        showToast(`Successfully converted to student! Student ID: ${studentId}`, 'success');
        await showCustomAlert(`🎓 Congratulations! ${inquiry.name} has been successfully enrolled as a student.\n\nStudent ID: ${studentId}\n\nCourse: ${inquiry.interestedCourses.join(', ')}`, 'success', 'Conversion Successful');
        
        // Add notification
        if (window.notificationManager) {
            window.notificationManager.addNotification({
                type: 'success',
                title: 'Inquiry Converted to Student',
                message: `${inquiry.name} has been successfully enrolled. Student ID: ${studentId}`,
                category: 'Counselors'
            });
        }
        
        closeConvertModal();
        await loadInquiries();
        updateAnalytics();
        
    } catch (error) {
        console.error('Error converting to student:', error);
        showToast('Error converting to student. Please try again.', 'error');
        await showCustomAlert('❌ Failed to convert inquiry to student.\n\nError: ' + error.message, 'error', 'Conversion Failed');
    }
}

// ============================================
// SEARCH AND FILTER FUNCTIONS
// ============================================

/**
 * Search inquiries
 */
window.searchInquiries = function() {
    const searchTerm = document.getElementById('search-inquiry').value.toLowerCase();
    const filtered = allInquiries.filter(inquiry => 
        inquiry.name.toLowerCase().includes(searchTerm) ||
        inquiry.phone.includes(searchTerm) ||
        (inquiry.email && inquiry.email.toLowerCase().includes(searchTerm))
    );
    displayInquiries(filtered);
};

/**
 * Filter inquiries by status and source
 */
window.filterInquiries = function() {
    const statusFilter = document.getElementById('filter-status').value;
    const sourceFilter = document.getElementById('filter-source').value;
    
    let filtered = allInquiries;
    
    if (statusFilter) {
        filtered = filtered.filter(i => i.status === statusFilter);
    }
    
    if (sourceFilter) {
        filtered = filtered.filter(i => i.source === sourceFilter);
    }
    
    displayInquiries(filtered);
};

// ============================================
// COMMUNICATION FUNCTIONS
// ============================================

/**
 * Send WhatsApp message
 */
window.sendWhatsApp = function(phone) {
    if (!phone) {
        showToast('Phone number not available', 'warning');
        return;
    }
    
    const message = encodeURIComponent('Hello! This is MicroTech Center. We would like to follow up on your inquiry.');
    const url = `https://wa.me/91${phone}?text=${message}`;
    window.open(url, '_blank');
};

/**
 * Send Email
 */
window.sendEmail = function(email) {
    if (!email) {
        showToast('Email not available', 'warning');
        return;
    }
    
    const subject = encodeURIComponent('Follow-up on Your Inquiry - MicroTech Center');
    const body = encodeURIComponent('Dear Student,\n\nThank you for your interest in MicroTech Center.\n\nBest regards,\nMicroTech Center Team');
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
};

// ============================================
// DELETE FUNCTION
// ============================================

/**
 * Delete inquiry
 */
window.deleteInquiry = async function(id) {
    const confirmed = await showCustomConfirm(
        'Are you sure you want to delete this inquiry? This action cannot be undone.',
        'Delete Inquiry',
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        if (DEMO_MODE) {
            const index = allInquiries.findIndex(i => i.id === id);
            if (index !== -1) {
                const deletedInquiry = allInquiries[index];
                allInquiries.splice(index, 1);
                displayInquiries(allInquiries);
                showToast('Inquiry deleted successfully (Demo Mode)', 'success');
                await showCustomAlert(`🗑️ Inquiry for ${deletedInquiry.name} has been permanently deleted.`, 'warning', 'Deleted Successfully')
                
                // Add notification
                if (window.notificationManager) {
                    window.notificationManager.addNotification({
                        type: 'warning',
                        title: 'Inquiry Deleted',
                        message: `${deletedInquiry.name}'s inquiry has been permanently deleted.`,
                        category: 'Counselors'
                    });
                }
                
                updateAnalytics();
            }
        } else {
            const inquiryDoc = await getDoc(doc(db, 'counselor_inquiries', id));
            const deletedName = inquiryDoc.exists() ? inquiryDoc.data().name : 'Unknown';
            
            await deleteDoc(doc(db, 'counselor_inquiries', id));
            showToast('Inquiry deleted successfully', 'success');
            await showCustomAlert(`🗑️ Inquiry for ${deletedName} has been permanently deleted.`, 'warning', 'Deleted Successfully');
            
            // Add notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'warning',
                    title: 'Inquiry Deleted',
                    message: `${deletedName}'s inquiry has been permanently deleted.`,
                    category: 'Counselors'
                });
            }
            await loadInquiries();
            updateAnalytics();
        }
    } catch (error) {
        console.error('Error deleting inquiry:', error);
        showToast('Error deleting inquiry', 'error');
        await showCustomAlert('❌ Failed to delete inquiry.\n\nError: ' + error.message, 'error', 'Delete Failed');
    }
};

// ============================================
// EXPORT FUNCTION
// ============================================

/**
 * Export inquiries to CSV
 */
window.exportToCSV = async function() {
    if (allInquiries.length === 0) {
        showToast('No data to export', 'warning');
        await showCustomAlert('⚠️ No data available to export.\n\nAdd some inquiries first to export data.', 'warning', 'No Data');
        return;
    }
    
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Source', 'Status', 'Interested Courses', 'Next Follow-up', 'Counselor', 'Created At'];
    const rows = allInquiries.map(inquiry => [
        inquiry.id,
        inquiry.name,
        inquiry.phone,
        inquiry.email || '',
        inquiry.source,
        inquiry.status,
        Array.isArray(inquiry.interestedCourses) ? inquiry.interestedCourses.join('; ') : '',
        inquiry.nextFollowUp ? formatDate(inquiry.nextFollowUp.toDate()) : '',
        inquiry.counselorName || '',
        inquiry.createdAt ? formatDate(inquiry.createdAt.toDate()) : ''
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inquiries_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully', 'success');
    
    // Add notification
    if (window.notificationManager) {
        window.notificationManager.addNotification({
            type: 'success',
            title: 'Data Exported',
            message: `Successfully exported ${allInquiries.length} inquiries to CSV format.`,
            category: 'Counselors'
        });
    }
    
    await showCustomAlert(`📊 Successfully exported ${allInquiries.length} inquiries to CSV format.\n\nFile: counselor_inquiries.csv`, 'success', 'Export Complete');
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check upcoming follow-ups and show reminders
 */
async function checkUpcomingFollowups() {
    const today = new Date();
    const upcoming = allInquiries.filter(inquiry => {
        if (!inquiry.nextFollowUp || inquiry.status === 'Converted') return false;
        const followupDate = inquiry.nextFollowUp.toDate ? inquiry.nextFollowUp.toDate() : new Date(inquiry.nextFollowUp);
        const diffDays = Math.ceil((followupDate - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 2;
    });
    
    if (upcoming.length > 0) {
        showToast(`You have ${upcoming.length} follow-up(s) due in the next 2 days!`, 'warning');
        
        // Create detailed list of upcoming follow-ups
        const followupList = upcoming.map(inquiry => {
            const followupDate = inquiry.nextFollowUp.toDate ? inquiry.nextFollowUp.toDate() : new Date(inquiry.nextFollowUp);
            const diffDays = Math.ceil((followupDate - today) / (1000 * 60 * 60 * 24));
            const urgency = diffDays === 0 ? '🔴 TODAY' : diffDays === 1 ? '🟡 TOMORROW' : `🟢 In ${diffDays} days`;
            return `${urgency}: ${inquiry.name} - ${followupDate.toLocaleDateString()}`;
        }).join('\n');
        
        await showCustomAlert(`⏰ You have ${upcoming.length} follow-up(s) due in the next 2 days!\n\n${followupList}`, 'warning', 'Upcoming Follow-ups');
    }
}

/**
 * Format date
 */
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format date and time
 */
function formatDateTime(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// CUSTOM ALERT SYSTEM
// ============================================

/**
 * Show custom alert dialog
 * @param {string} message - Alert message
 * @param {string} type - Alert type: 'success', 'error', 'warning', 'info'
 * @param {string} title - Optional title
 */
function showCustomAlert(message, type = 'success', title = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-alert-modal');
        const icon = document.getElementById('alert-icon');
        const titleEl = document.getElementById('alert-title');
        const messageEl = document.getElementById('alert-message');
        const okBtn = document.getElementById('alert-ok-btn');
        
        // Set icon and title based on type
        icon.className = `custom-alert-icon ${type}`;
        
        let iconClass = 'fa-check-circle';
        let defaultTitle = 'Success';
        
        switch(type) {
            case 'error':
                iconClass = 'fa-times-circle';
                defaultTitle = 'Error';
                break;
            case 'warning':
                iconClass = 'fa-exclamation-triangle';
                defaultTitle = 'Warning';
                break;
            case 'info':
                iconClass = 'fa-info-circle';
                defaultTitle = 'Information';
                break;
        }
        
        icon.innerHTML = `<i class="fas ${iconClass}"></i>`;
        titleEl.textContent = title || defaultTitle;
        messageEl.textContent = message;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Handle OK button
        const handleOk = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            resolve(true);
        };
        
        okBtn.addEventListener('click', handleOk);
        
        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
                document.removeEventListener('keydown', handleEsc);
                resolve(true);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

/**
 * Show custom confirm dialog
 * @param {string} message - Confirm message
 * @param {string} title - Optional title
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 */
function showCustomConfirm(message, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        okBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Handle confirm
        const handleConfirm = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };
        
        // Handle cancel
        const handleCancel = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };
        
        okBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        
        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
                document.removeEventListener('keydown', handleEsc);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                resolve(false);
            }
        });
    });
}

/**
 * Format date for datetime-local input
 */
function formatDateTimeLocal(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ============================================
// PAGE VISIBILITY HANDLER
// ============================================

/**
 * Reload data when user returns to the page
 */
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
        console.log('Page became visible - reloading data...');
        try {
            if (DEMO_MODE) {
                // In demo mode, just refresh the display
                displayInquiries(allInquiries);
                updateAnalytics();
            } else {
                // In Firebase mode, reload data from database
                await loadInquiries();
                updateAnalytics();
            }
        } catch (error) {
            console.error('Error reloading data:', error);
        }
    }
});

/**
 * Also reload when page is shown (browser back/forward)
 */
window.addEventListener('pageshow', async (event) => {
    // If page was loaded from cache (back/forward button)
    if (event.persisted) {
        console.log('Page restored from cache - reloading data...');
        try {
            if (DEMO_MODE) {
                displayInquiries(allInquiries);
                updateAnalytics();
            } else {
                await loadInquiries();
                updateAnalytics();
            }
        } catch (error) {
            console.error('Error reloading data:', error);
        }
    }
});

console.log('Counselor Management System Loaded Successfully');