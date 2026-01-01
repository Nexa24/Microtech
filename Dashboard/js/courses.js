// ============================================
// COURSE MANAGEMENT MODULE - MICROTECH ADMIN PANEL
// Tech Stack: Firebase Firestore, Chart.js, HTML5, CSS3, JavaScript ES6+
// Features: CRUD Operations, Real-time Sync, Analytics, Export (CSV/PDF), Role-based Access
// ============================================

// ============================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================
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

console.log('✅ Firebase initialized successfully');

// ============================================
// GLOBAL VARIABLES & STATE MANAGEMENT
// ============================================
let currentUser = null;
let userRole = 'admin'; // Default role, will be fetched from auth
let allCourses = [];
let currentView = 'card'; // 'card' or 'table'
let editingCourseId = null;
let divisionChart = null;
let enrollmentChart = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================
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
        max-width: 300px;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function generateCourseID() {
    return 'CRS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// ============================================
// COURSE MANAGER CLASS - MAIN CONTROLLER
// ============================================
class CourseManager {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.providerCount = 1;
    }

    // ==================== INITIALIZATION ====================
    async init() {
        try {
            console.log('⚙️ Initializing Course Management System...');
            
            // Setup event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup complete');
            
            // Load courses from Firestore
            await this.loadCourses();
            console.log('✅ Courses loaded');
            
            // Setup real-time listeners
            this.setupRealtimeListeners();
            console.log('✅ Real-time listeners active');
            
            // Initialize charts
            this.initializeCharts();
            console.log('✅ Charts initialized');
            
            showToast('Course Management System ready!', 'success');
        } catch (error) {
            console.error('❌ Error initializing Course Manager:', error);
            showToast('Error loading courses: ' + error.message, 'error');
            
            // Try to at least setup the UI
            this.displayCourses();
            this.updateStatistics();
        }
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterCourses());
        }

        // Division filter
        const divisionFilter = document.getElementById('divisionFilter');
        if (divisionFilter) {
            divisionFilter.addEventListener('change', () => this.filterCourses());
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterCourses());
        }
    }

    // ==================== REAL-TIME FIRESTORE LISTENERS ====================
    setupRealtimeListeners() {
        try {
            const coursesRef = collection(db, 'courses');
            
            // Listen for real-time updates
            const unsubscribe = onSnapshot(coursesRef, (snapshot) => {
                let hasChanges = false;
                
                snapshot.docChanges().forEach((change) => {
                    hasChanges = true;
                    if (change.type === 'added') {
                        console.log('🆕 New course added:', change.doc.data().name);
                    }
                    if (change.type === 'modified') {
                        console.log('📝 Course modified:', change.doc.data().name);
                        showToast('Course updated', 'info');
                    }
                    if (change.type === 'removed') {
                        console.log('🗑️ Course removed');
                        showToast('Course removed', 'warning');
                    }
                });
                
                // Only reload if there were actual changes (not initial load)
                if (hasChanges && this.courses.length > 0) {
                    this.loadCourses();
                }
            }, (error) => {
                console.error('❌ Error in real-time listener:', error);
            });
            
            // Store unsubscribe function if needed later
            this.unsubscribeListener = unsubscribe;
        } catch (error) {
            console.error('❌ Failed to setup real-time listeners:', error);
        }
    }

    // ==================== LOAD COURSES FROM FIRESTORE ====================
    async loadCourses() {
        try {
            console.log('📥 Loading courses from Firestore...');
            console.log('🔗 Database reference:', db);
            console.log('📚 Collection: courses');
            
            const coursesRef = collection(db, 'courses');
            
            // Try with orderBy first, if fails, try without
            let querySnapshot;
            try {
                const q = query(coursesRef, orderBy('createdAt', 'desc'));
                querySnapshot = await getDocs(q);
                console.log('✅ Query with orderBy succeeded');
            } catch (orderError) {
                console.warn('⚠️ OrderBy failed, loading without ordering:', orderError.message);
                querySnapshot = await getDocs(coursesRef);
                console.log('✅ Query without orderBy succeeded');
            }
            
            console.log('📊 Query snapshot size:', querySnapshot.size);
            console.log('📊 Query snapshot empty:', querySnapshot.empty);
            
            this.courses = [];
            let courseCount = 0;
            
            querySnapshot.forEach((docSnap) => {
                courseCount++;
                const data = docSnap.data();
                console.log(`📄 Course ${courseCount}:`, {
                    id: docSnap.id,
                    name: data.name,
                    division: data.division,
                    status: data.status
                });
                
                this.courses.push({
                    id: docSnap.id,
                    ...data
                });
            });

            allCourses = this.courses;
            this.filteredCourses = [...this.courses];
            
            console.log(`✅ Loaded ${this.courses.length} courses from Firestore`);
            console.log('📋 Full courses array:', this.courses);
            
            // Update UI
            console.log('🎨 Updating display...');
            this.displayCourses();
            console.log('📊 Updating statistics...');
            this.updateStatistics();
            console.log('📈 Updating charts...');
            this.updateCharts();
            
            if (this.courses.length === 0) {
                showToast('No courses found. Add your first course!', 'info');
            } else {
                showToast(`Loaded ${this.courses.length} courses successfully`, 'success');
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            console.error('❌ Error details:', error.message);
            console.error('❌ Error stack:', error.stack);
            showToast('Error loading courses: ' + error.message, 'error');
            
            // Still update UI with empty state
            this.courses = [];
            this.filteredCourses = [];
            this.displayCourses();
            this.updateStatistics();
        }
    }

    // ==================== FILTER & SEARCH ====================
    filterCourses() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const divisionFilter = document.getElementById('divisionFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        this.filteredCourses = this.courses.filter(course => {
            const matchesSearch = course.name?.toLowerCase().includes(searchTerm) || 
                                 course.description?.toLowerCase().includes(searchTerm);
            const matchesDivision = !divisionFilter || course.division === divisionFilter;
            const matchesStatus = !statusFilter || course.status === statusFilter;

            return matchesSearch && matchesDivision && matchesStatus;
        });

        this.displayCourses();
    }

    // ==================== DISPLAY COURSES ====================
    displayCourses() {
        console.log('🎨 displayCourses called, view:', currentView);
        console.log('📋 Courses to display:', this.filteredCourses.length);
        
        if (currentView === 'card') {
            this.displayCoursesGrid();
        } else {
            this.displayCoursesTable();
        }
    }

    displayCoursesGrid() {
        console.log('🗂️ displayCoursesGrid called');
        const grid = document.getElementById('coursesGrid');
        if (!grid) {
            console.error('❌ coursesGrid element not found!');
            return;
        }
        console.log('✅ coursesGrid element found');
        console.log('📊 Filtered courses count:', this.filteredCourses.length);

        if (this.filteredCourses.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon"><i class="fas fa-book-open"></i></div>
                    <h3 style="color: #e5e7eb; margin: 10px 0;">No courses found</h3>
                    <p>Start by adding your first course</p>
                    <button class="btn-export" style="margin-top: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;" onclick="courseManager.openAddCourseModal()">
                        <i class="fas fa-plus"></i> Add Course
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredCourses.map(course => `
            <div class="course-card">
                <div class="course-image" style="${course.imageURL ? `background-image: url(${course.imageURL}); background-size: cover; background-position: center;` : ''}">
                    ${!course.imageURL ? '<i class="fas fa-book-open"></i>' : ''}
                </div>
                <div class="course-content">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <h3 class="course-title">${course.name || 'Untitled Course'}</h3>
                        <span class="course-badge badge-${(course.division || '').toLowerCase()}">${course.division || 'N/A'}</span>
                    </div>
                    <div class="course-meta">
                        <span><i class="fas fa-clock"></i> ${course.duration || 0} months</span>
                        <span><i class="fas fa-dollar-sign"></i> ₹${course.totalFee?.toLocaleString() || '0'}</span>
                        <span><i class="fas fa-users"></i> ${course.studentsEnrolled?.length || 0}</span>
                    </div>
                    <p class="course-description">${course.description?.substring(0, 100) || 'No description available'}${course.description?.length > 100 ? '...' : ''}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <span style="color: ${course.status === 'Active' ? '#10b981' : '#ef4444'}; font-weight: 500;">
                            <i class="fas fa-circle" style="font-size: 0.5rem;"></i> ${course.status || 'N/A'}
                        </span>
                        <div class="course-actions">
                            <button class="btn-action btn-view" onclick="courseManager.viewCourse('${course.id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action btn-edit" onclick="courseManager.editCourse('${course.id}')" title="Edit Course">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="courseManager.deleteCourse('${course.id}')" title="Delete Course">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayCoursesTable() {
        const tableContainer = document.getElementById('coursesTable');
        if (!tableContainer) return;

        if (this.filteredCourses.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-book-open"></i></div>
                    <h3 style="color: #e5e7eb; margin: 10px 0;">No courses found</h3>
                </div>
            `;
            return;
        }

        tableContainer.innerHTML = `
            <div style="background: rgba(30, 30, 40, 0.95); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <tr>
                            <th style="padding: 15px; text-align: left;">Course Name</th>
                            <th style="padding: 15px; text-align: left;">Division</th>
                            <th style="padding: 15px; text-align: left;">Duration</th>
                            <th style="padding: 15px; text-align: left;">Fee</th>
                            <th style="padding: 15px; text-align: left;">Enrolled</th>
                            <th style="padding: 15px; text-align: left;">Status</th>
                            <th style="padding: 15px; text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredCourses.map(course => `
                            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                                <td style="padding: 15px; color: #e5e7eb;">${course.name || 'N/A'}</td>
                                <td style="padding: 15px;">
                                    <span class="course-badge badge-${(course.division || '').toLowerCase()}">${course.division || 'N/A'}</span>
                                </td>
                                <td style="padding: 15px; color: #d1d5db;">${course.duration || 0} months</td>
                                <td style="padding: 15px; color: #d1d5db;">₹${course.totalFee?.toLocaleString() || '0'}</td>
                                <td style="padding: 15px; color: #d1d5db;">${course.studentsEnrolled?.length || 0}</td>
                                <td style="padding: 15px;">
                                    <span style="color: ${course.status === 'Active' ? '#10b981' : '#ef4444'};">
                                        ${course.status || 'N/A'}
                                    </span>
                                </td>
                                <td style="padding: 15px; text-align: center;">
                                    <div style="display: flex; gap: 5px; justify-content: center;">
                                        <button class="btn-action btn-view" onclick="courseManager.viewCourse('${course.id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn-action btn-edit" onclick="courseManager.editCourse('${course.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" onclick="courseManager.deleteCourse('${course.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ==================== SWITCH VIEW ====================
    switchView(view) {
        currentView = view;
        
        const cardViewBtn = document.getElementById('cardViewBtn');
        const tableViewBtn = document.getElementById('tableViewBtn');
        const coursesGrid = document.getElementById('coursesGrid');
        const coursesTable = document.getElementById('coursesTable');

        if (view === 'card') {
            cardViewBtn?.classList.add('active');
            tableViewBtn?.classList.remove('active');
            coursesGrid.style.display = 'grid';
            coursesTable.style.display = 'none';
        } else {
            tableViewBtn?.classList.add('active');
            cardViewBtn?.classList.remove('active');
            coursesGrid.style.display = 'none';
            coursesTable.style.display = 'block';
        }

        this.displayCourses();
    }

    // ==================== UPDATE STATISTICS ====================
    updateStatistics() {
        const totalCourses = this.courses.length;
        const activeCourses = this.courses.filter(c => c.status === 'Active').length;
        const totalEnrollments = this.courses.reduce((sum, c) => sum + (c.studentsEnrolled?.length || 0), 0);
        const totalProviders = new Set(this.courses.flatMap(c => c.providers || [])).size;

        document.getElementById('totalCoursesCount').textContent = totalCourses;
        document.getElementById('activeCoursesCount').textContent = activeCourses;
        document.getElementById('totalEnrollmentsCount').textContent = totalEnrollments;
        document.getElementById('totalProvidersCount').textContent = totalProviders;
    }

    // ==================== CHARTS INITIALIZATION ====================
    initializeCharts() {
        this.initializeDivisionChart();
        this.initializeEnrollmentChart();
    }

    initializeDivisionChart() {
        const ctx = document.getElementById('divisionChart');
        if (!ctx) {
            console.warn('Division chart canvas not found');
            return;
        }

        const divisionCounts = {
            'CAPT': 0,
            'LBS': 0,
            'Gama': 0
        };

        this.courses.forEach(course => {
            if (divisionCounts.hasOwnProperty(course.division)) {
                divisionCounts[course.division]++;
            }
        });

        // Show "No data" if all are 0
        const hasData = divisionCounts.CAPT + divisionCounts.LBS + divisionCounts.Gama > 0;
        
        if (divisionChart) {
            divisionChart.destroy();
        }

        divisionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: hasData ? ['CAPT', 'LBS', 'Gama'] : ['No Data'],
                datasets: [{
                    data: hasData ? [divisionCounts.CAPT, divisionCounts.LBS, divisionCounts.Gama] : [1],
                    backgroundColor: hasData ? [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(245, 87, 108, 0.8)',
                        'rgba(67, 233, 123, 0.8)'
                    ] : ['rgba(100, 100, 100, 0.3)'],
                    borderColor: hasData ? [
                        'rgba(102, 126, 234, 1)',
                        'rgba(245, 87, 108, 1)',
                        'rgba(67, 233, 123, 1)'
                    ] : ['rgba(100, 100, 100, 0.5)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        enabled: hasData
                    }
                }
            }
        });
        
        console.log('📊 Division chart updated:', divisionCounts);
    }

    initializeEnrollmentChart() {
        const ctx = document.getElementById('enrollmentChart');
        if (!ctx) {
            console.warn('Enrollment chart canvas not found');
            return;
        }

        const hasData = this.courses.length > 0;
        const courseNames = hasData ? this.courses.slice(0, 5).map(c => c.name?.substring(0, 20) || 'Untitled') : ['No Courses'];
        const enrollmentCounts = hasData ? this.courses.slice(0, 5).map(c => c.studentsEnrolled?.length || 0) : [0];

        if (enrollmentChart) {
            enrollmentChart.destroy();
        }

        enrollmentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: courseNames,
                datasets: [{
                    label: 'Enrolled Students',
                    data: enrollmentCounts,
                    backgroundColor: hasData ? 'rgba(102, 126, 234, 0.8)' : 'rgba(100, 100, 100, 0.3)',
                    borderColor: hasData ? 'rgba(102, 126, 234, 1)' : 'rgba(100, 100, 100, 0.5)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e5e7eb',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#e5e7eb',
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        enabled: hasData
                    }
                }
            }
        });
        
        console.log('📊 Enrollment chart updated');
    }

    updateCharts() {
        this.initializeDivisionChart();
        this.initializeEnrollmentChart();
    }

    // ==================== MODAL MANAGEMENT ====================
    openAddCourseModal() {
        editingCourseId = null;
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Course';
        document.getElementById('courseForm').reset();
        
        // Clear providers container and add one empty row
        const providersContainer = document.getElementById('providersContainer');
        providersContainer.innerHTML = '';
        this.providerCount = 0;
        this.addProviderRow();
        
        document.getElementById('courseModal').classList.add('show');
    }

    closeCourseModal() {
        document.getElementById('courseModal').classList.remove('show');
        editingCourseId = null;
    }

    // ==================== PROVIDER MANAGEMENT ====================
    addProviderRow() {
        const providersContainer = document.getElementById('providersContainer');
        const rowId = `provider-${this.providerCount++}`;
        
        const row = document.createElement('div');
        row.className = 'provider-row';
        row.id = rowId;
        row.innerHTML = `
            <input type="text" class="provider-input" placeholder="Enter provider name">
            <button type="button" class="btn-remove-provider" onclick="courseManager.removeProviderRow('${rowId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        providersContainer.appendChild(row);
    }

    removeProviderRow(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
        }
    }

    getProviders() {
        const providerInputs = document.querySelectorAll('.provider-input');
        const providers = [];
        providerInputs.forEach(input => {
            if (input.value.trim()) {
                providers.push(input.value.trim());
            }
        });
        return providers;
    }

    // ==================== SAVE COURSE (CREATE/UPDATE) ====================
    async saveCourse() {
        try {
            console.log('💾 Saving course...');
            
            // Get form values
            const courseName = document.getElementById('courseName')?.value.trim();
            const division = document.getElementById('division')?.value;
            const duration = parseInt(document.getElementById('duration')?.value);
            const totalFee = parseFloat(document.getElementById('totalFee')?.value);
            const admissionFee = parseFloat(document.getElementById('admissionFee')?.value);
            const status = document.getElementById('status')?.value;
            const startDate = document.getElementById('startDate')?.value || '';
            const endDate = document.getElementById('endDate')?.value || '';
            const description = document.getElementById('description')?.value.trim() || '';
            const imageURL = document.getElementById('imageURL')?.value.trim() || '';
            const providers = this.getProviders();

            // Validation
            if (!courseName || !division || !duration || !totalFee || !admissionFee || !status) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            if (isNaN(duration) || isNaN(totalFee) || isNaN(admissionFee)) {
                showToast('Please enter valid numbers for duration and fees', 'error');
                return;
            }

            // Prepare course data
            const courseData = {
                name: courseName,
                division: division,
                duration: duration,
                totalFee: totalFee,
                admissionFee: admissionFee,
                status: status,
                startDate: startDate,
                endDate: endDate,
                description: description,
                imageURL: imageURL,
                providers: providers,
                studentsEnrolled: editingCourseId ? (this.courses.find(c => c.id === editingCourseId)?.studentsEnrolled || []) : [],
                updatedAt: Timestamp.now()
            };

            if (editingCourseId) {
                // Update existing course
                console.log('📝 Updating course:', editingCourseId);
                const courseRef = doc(db, 'courses', editingCourseId);
                await updateDoc(courseRef, courseData);
                showToast('✅ Course updated successfully', 'success');
            } else {
                // Create new course
                courseData.createdAt = Timestamp.now();
                courseData.courseID = generateCourseID();
                
                console.log('➕ Creating new course');
                await addDoc(collection(db, 'courses'), courseData);
                showToast('✅ Course created successfully', 'success');
            }

            this.closeCourseModal();
            await this.loadCourses();
        } catch (error) {
            console.error('❌ Error saving course:', error);
            showToast('Error saving course: ' + error.message, 'error');
        }
    }

    // ==================== EDIT COURSE ====================
    async editCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) {
            showToast('Course not found', 'error');
            return;
        }

        editingCourseId = courseId;
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Course';

        // Populate form
        document.getElementById('courseName').value = course.name || '';
        document.getElementById('division').value = course.division || '';
        document.getElementById('duration').value = course.duration || '';
        document.getElementById('totalFee').value = course.totalFee || '';
        document.getElementById('admissionFee').value = course.admissionFee || '';
        document.getElementById('status').value = course.status || 'Active';
        document.getElementById('startDate').value = course.startDate || '';
        document.getElementById('endDate').value = course.endDate || '';
        document.getElementById('description').value = course.description || '';
        document.getElementById('imageURL').value = course.imageURL || '';

        // Populate providers
        const providersContainer = document.getElementById('providersContainer');
        providersContainer.innerHTML = '';
        this.providerCount = 0;
        
        if (course.providers && course.providers.length > 0) {
            course.providers.forEach(provider => {
                const rowId = `provider-${this.providerCount++}`;
                const row = document.createElement('div');
                row.className = 'provider-row';
                row.id = rowId;
                row.innerHTML = `
                    <input type="text" class="provider-input" value="${provider}" placeholder="Enter provider name">
                    <button type="button" class="btn-remove-provider" onclick="courseManager.removeProviderRow('${rowId}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                providersContainer.appendChild(row);
            });
        } else {
            this.addProviderRow();
        }

        document.getElementById('courseModal').classList.add('show');
    }

    // ==================== DELETE COURSE ====================
    async deleteCourse(courseId) {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }

        try {
            const course = this.courses.find(c => c.id === courseId);
            await deleteDoc(doc(db, 'courses', courseId));
            showToast('Course deleted successfully', 'success');
            
            if (notificationManager && course) {
                notificationManager.addNotification({
                    title: 'Course Deleted',
                    message: `${course.name} has been removed from the system`,
                    type: 'warning',
                    priority: 'medium'
                });
            }
            
            await this.loadCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast('Error deleting course: ' + error.message, 'error');
        }
    }

    // ==================== VIEW COURSE DETAILS ====================
    viewCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) {
            showToast('Course not found', 'error');
            return;
        }

        const detailsContent = document.getElementById('courseDetailsContent');
        detailsContent.innerHTML = `
            <div style="display: grid; gap: 20px;">
                ${course.imageURL ? `
                    <div style="width: 100%; height: 300px; background-image: url(${course.imageURL}); background-size: cover; background-position: center; border-radius: 10px;"></div>
                ` : ''}
                
                <div class="form-section">
                    <h3><i class="fas fa-info-circle"></i> Basic Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                        <div>
                            <p style="color: #9ca3af; margin-bottom: 5px;">Course Name</p>
                            <p style="color: #e5e7eb; font-weight: 500;">${course.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p style="color: #9ca3af; margin-bottom: 5px;">Division</p>
                            <span class="course-badge badge-${(course.division || '').toLowerCase()}">${course.division || 'N/A'}</span>
                        </div>
                        <div>
                            <p style="color: #9ca3af; margin-bottom: 5px;">Duration</p>
                            <p style="color: #e5e7eb; font-weight: 500;">${course.duration || 0} months</p>
                        </div>
                        <div>
                            <p style="color: #9ca3af; margin-bottom: 5px;">Status</p>
                            <p style="color: ${course.status === 'Active' ? '#10b981' : '#ef4444'}; font-weight: 500;">${course.status || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3><i class="fas fa-dollar-sign"></i> Fee Structure</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                        <div>
                            <p style="color: #9ca3af; margin-bottom: 5px;">Total Fee</p>
                            <p style="color: #e5e7eb; font-weight: 500; font-size: 1.2rem;">₹${course.totalFee?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                            <p style="color: #9ca3af; margin-bottom: 5px;">Admission Fee</p>
                            <p style="color: #e5e7eb; font-weight: 500; font-size: 1.2rem;">₹${course.admissionFee?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                </div>

                ${course.startDate || course.endDate ? `
                    <div class="form-section">
                        <h3><i class="fas fa-calendar-alt"></i> Schedule</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                            ${course.startDate ? `
                                <div>
                                    <p style="color: #9ca3af; margin-bottom: 5px;">Start Date</p>
                                    <p style="color: #e5e7eb; font-weight: 500;">${new Date(course.startDate).toLocaleDateString()}</p>
                                </div>
                            ` : ''}
                            ${course.endDate ? `
                                <div>
                                    <p style="color: #9ca3af; margin-bottom: 5px;">End Date</p>
                                    <p style="color: #e5e7eb; font-weight: 500;">${new Date(course.endDate).toLocaleDateString()}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${course.providers && course.providers.length > 0 ? `
                    <div class="form-section">
                        <h3><i class="fas fa-chalkboard-teacher"></i> Course Providers</h3>
                        <div style="margin-top: 15px;">
                            ${course.providers.map(provider => `
                                <span style="display: inline-block; padding: 8px 16px; background: rgba(102, 126, 234, 0.2); color: #667eea; border-radius: 20px; margin: 5px;">${provider}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${course.description ? `
                    <div class="form-section">
                        <h3><i class="fas fa-align-left"></i> Description</h3>
                        <p style="color: #d1d5db; line-height: 1.6; margin-top: 15px;">${course.description}</p>
                    </div>
                ` : ''}

                <div class="form-section">
                    <h3><i class="fas fa-users"></i> Enrollment Information</h3>
                    <div style="margin-top: 15px;">
                        <p style="color: #9ca3af; margin-bottom: 5px;">Students Enrolled</p>
                        <p style="color: #e5e7eb; font-weight: 500; font-size: 1.5rem;">${course.studentsEnrolled?.length || 0}</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('viewCourseModal').classList.add('show');
    }

    closeViewModal() {
        document.getElementById('viewCourseModal').classList.remove('show');
    }

    printCourseDetails() {
        window.print();
    }

    // ==================== EXPORT FUNCTIONS ====================
    exportToCSV() {
        if (this.courses.length === 0) {
            showToast('No courses to export', 'warning');
            return;
        }

        const headers = ['Course ID', 'Name', 'Division', 'Duration (months)', 'Total Fee', 'Admission Fee', 'Status', 'Enrolled Students', 'Providers'];
        const rows = this.courses.map(course => [
            course.courseID || course.id,
            course.name || '',
            course.division || '',
            course.duration || 0,
            course.totalFee || 0,
            course.admissionFee || 0,
            course.status || '',
            course.studentsEnrolled?.length || 0,
            course.providers?.join('; ') || ''
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `courses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        showToast('Courses exported to CSV successfully', 'success');
    }

    exportToPDF() {
        showToast('PDF export feature - Use browser print (Ctrl+P) and save as PDF', 'info');
        window.print();
    }

}

// ============================================
// INITIALIZE APPLICATION
// ============================================
let courseManager = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Course Management Module - Initializing...');
    
    try {
        // Check authentication (optional - allow demo mode)
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                console.log('✅ User authenticated:', user.email);
            } else {
                console.log('ℹ️ No user authenticated - running in demo mode');
            }
        });
        
        // Initialize Course Manager
        courseManager = new CourseManager();
        await courseManager.init();
        
        // Make courseManager globally accessible for onclick handlers
        window.courseManager = courseManager;
        console.log('✅ Course Manager initialized and available globally');
        console.log('💡 Test with: window.courseManager');
        
    } catch (error) {
        console.error('❌ Error initializing Course Management:', error);
        showToast('Error initializing system: ' + error.message, 'error');
    }
});