// ============================================
// AUTOMATIC STUDENT LOADING & FIREBASE STORAGE
// Provides auto-loading, caching, and Firebase operations
// ============================================

import { db } from '../firebase.js';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    updateDoc,
    setDoc,
    deleteDoc,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================
// STUDENT CACHE & STATE MANAGEMENT
// ============================================

class StudentLoader {
    constructor() {
        this.students = [];
        this.studentsById = new Map();
        this.studentsByDivision = new Map();
        this.isLoaded = false;
        this.isLoading = false;
        this.lastUpdated = null;
        this.listeners = [];
        this.unsubscribe = null;
    }

    // ============================================
    // AUTOMATIC LOADING
    // ============================================

    /**
     * Auto-load all students from Firebase
     * Can be called multiple times - uses cache after first load
     */
    async autoLoadStudents(forceRefresh = false) {
        if (this.isLoading) {
            console.log('Already loading students...');
            return this.students;
        }

        if (this.isLoaded && !forceRefresh) {
            console.log('Using cached students data');
            return this.students;
        }

        this.isLoading = true;

        try {
            console.log('🔄 Auto-loading students from Firebase...');
            
            // Load from 'users' collection with role filter (primary method)
            let snapshot;
            try {
                console.log('📚 Loading from users collection...');
                const usersQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'student')
                );
                snapshot = await getDocs(usersQuery);
                console.log(`✅ Loaded from 'users' collection: ${snapshot.docs.length} students`);
            } catch (error) {
                console.log('⚠️ Could not load from users collection, trying students collection...');
                // Fallback to 'students' collection
                snapshot = await getDocs(collection(db, 'students'));
                console.log(`📚 Loaded from 'students' collection: ${snapshot.docs.length} students`);
            }
            
            this.students = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                _loadedAt: new Date()
            }));

            // Build indexes for fast lookups
            this.buildIndexes();

            this.isLoaded = true;
            this.lastUpdated = new Date();
            this.isLoading = false;

            console.log(`✅ Loaded ${this.students.length} students successfully`);
            
            // Notify listeners
            this.notifyListeners('loaded', this.students);

            return this.students;

        } catch (error) {
            this.isLoading = false;
            console.error('❌ Error auto-loading students:', error);
            throw error;
        }
    }

    /**
     * Enable real-time student updates
     */
    enableRealTimeSync() {
        if (this.unsubscribe) {
            console.log('Real-time sync already enabled');
            return;
        }

        console.log('🔴 Enabling real-time student sync...');

        // Listen to 'users' collection with role filter
        const studentsQuery = query(
            collection(db, 'users'),
            where('role', '==', 'student')
        );

        this.unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
            console.log('📡 Real-time update received');
            
            snapshot.docChanges().forEach((change) => {
                const student = { id: change.doc.id, ...change.doc.data() };

                if (change.type === 'added') {
                    this.handleStudentAdded(student);
                }
                if (change.type === 'modified') {
                    this.handleStudentModified(student);
                }
                if (change.type === 'removed') {
                    this.handleStudentRemoved(student);
                }
            });

            this.buildIndexes();
            this.notifyListeners('updated', this.students);
        }, (error) => {
            console.error('❌ Real-time sync error:', error);
        });
    }

    /**
     * Disable real-time updates
     */
    disableRealTimeSync() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
            console.log('🔴 Real-time sync disabled');
        }
    }

    // ============================================
    // INDEX MANAGEMENT
    // ============================================

    buildIndexes() {
        // Clear existing indexes
        this.studentsById.clear();
        this.studentsByDivision.clear();

        // Build ID index
        this.students.forEach(student => {
            this.studentsById.set(student.id, student);
            this.studentsById.set(student.studentID || student.studentId, student);

            // Build division index
            const division = student.division || 'Other';
            if (!this.studentsByDivision.has(division)) {
                this.studentsByDivision.set(division, []);
            }
            this.studentsByDivision.get(division).push(student);
        });

        console.log(`📊 Indexes built: ${this.studentsById.size} IDs, ${this.studentsByDivision.size} divisions`);
    }

    // ============================================
    // REAL-TIME EVENT HANDLERS
    // ============================================

    handleStudentAdded(student) {
        const exists = this.students.find(s => s.id === student.id);
        if (!exists) {
            this.students.push(student);
            console.log(`➕ Student added: ${student.name}`);
        }
    }

    handleStudentModified(student) {
        const index = this.students.findIndex(s => s.id === student.id);
        if (index !== -1) {
            this.students[index] = student;
            console.log(`✏️ Student updated: ${student.name}`);
        }
    }

    handleStudentRemoved(student) {
        const index = this.students.findIndex(s => s.id === student.id);
        if (index !== -1) {
            this.students.splice(index, 1);
            console.log(`🗑️ Student removed: ${student.name}`);
        }
    }

    // ============================================
    // SEARCH & FILTER
    // ============================================

    /**
     * Search students by multiple criteria
     */
    searchStudents(searchTerm, options = {}) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) return this.students;

        const {
            searchFields = ['name', 'studentID', 'studentId', 'email', 'mobile'],
            division = null,
            status = null,
            maxResults = 50
        } = options;

        let results = this.students.filter(student => {
            // Division filter
            if (division && student.division !== division) return false;
            
            // Status filter
            if (status && student.registrationStatus !== status) return false;

            // Text search
            return searchFields.some(field => {
                const value = student[field];
                return value && value.toString().toLowerCase().includes(term);
            });
        });

        return results.slice(0, maxResults);
    }

    /**
     * Get student by ID (fast lookup)
     */
    getStudentById(id) {
        return this.studentsById.get(id);
    }

    /**
     * Get students by division (fast lookup)
     */
    getStudentsByDivision(division) {
        return this.studentsByDivision.get(division) || [];
    }

    /**
     * Filter students by multiple criteria
     */
    filterStudents(filters = {}) {
        let filtered = [...this.students];

        if (filters.division) {
            filtered = filtered.filter(s => s.division === filters.division);
        }

        if (filters.status) {
            filtered = filtered.filter(s => s.registrationStatus === filters.status);
        }

        if (filters.paymentStatus) {
            filtered = filtered.filter(s => s.paymentStatus === filters.paymentStatus);
        }

        if (filters.course) {
            filtered = filtered.filter(s => s.course === filters.course);
        }

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filtered = filtered.filter(s => {
                const admissionDate = s.admissionDate?.toDate ? s.admissionDate.toDate() : new Date(s.admissionDate);
                return admissionDate >= fromDate;
            });
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            filtered = filtered.filter(s => {
                const admissionDate = s.admissionDate?.toDate ? s.admissionDate.toDate() : new Date(s.admissionDate);
                return admissionDate <= toDate;
            });
        }

        return filtered;
    }

    // ============================================
    // FIREBASE STORAGE OPERATIONS
    // ============================================

    /**
     * Store/Update student fee record
     */
    async storeStudentFee(studentId, feeData) {
        try {
            const feeRef = doc(db, 'studentFees', studentId);
            
            const feeRecord = {
                studentId,
                ...feeData,
                updatedAt: Timestamp.now(),
                updatedBy: 'system'
            };

            await setDoc(feeRef, feeRecord, { merge: true });
            
            console.log(`💾 Fee record stored for student: ${studentId}`);
            return { success: true, id: studentId };

        } catch (error) {
            console.error('❌ Error storing fee record:', error);
            throw error;
        }
    }

    /**
     * Get student fee record
     */
    async getStudentFee(studentId) {
        try {
            const feeRef = doc(db, 'studentFees', studentId);
            const feeDoc = await getDoc(feeRef);

            if (feeDoc.exists()) {
                return { id: feeDoc.id, ...feeDoc.data() };
            }

            return null;

        } catch (error) {
            console.error('❌ Error getting fee record:', error);
            throw error;
        }
    }

    /**
     * Store payment transaction
     */
    async storePayment(paymentData) {
        try {
            const paymentRef = doc(collection(db, 'payments'));
            
            const payment = {
                ...paymentData,
                timestamp: Timestamp.now(),
                status: 'completed',
                createdBy: 'system'
            };

            await setDoc(paymentRef, payment);
            
            console.log(`💰 Payment stored: ${paymentRef.id}`);
            return { success: true, id: paymentRef.id };

        } catch (error) {
            console.error('❌ Error storing payment:', error);
            throw error;
        }
    }

    /**
     * Get student payment history
     */
    async getStudentPayments(studentId) {
        try {
            const paymentsQuery = query(
                collection(db, 'payments'),
                where('studentId', '==', studentId),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(paymentsQuery);
            const payments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return payments;

        } catch (error) {
            console.error('❌ Error getting payments:', error);
            throw error;
        }
    }

    /**
     * Update student fee status
     */
    async updateStudentFeeStatus(studentId, status, amount = null) {
        try {
            const studentRef = doc(db, 'users', studentId);
            
            const updates = {
                paymentStatus: status,
                lastUpdated: Timestamp.now()
            };

            if (amount !== null) {
                updates.paidAmount = amount;
            }

            await updateDoc(studentRef, updates);
            
            console.log(`✅ Fee status updated for student: ${studentId}`);
            
            // Update cache
            const student = this.studentsById.get(studentId);
            if (student) {
                Object.assign(student, updates);
            }

            return { success: true };

        } catch (error) {
            console.error('❌ Error updating fee status:', error);
            throw error;
        }
    }

    /**
     * Bulk store fee records
     */
    async bulkStoreFees(feeRecords) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const record of feeRecords) {
            try {
                await this.storeStudentFee(record.studentId, record.feeData);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    studentId: record.studentId,
                    error: error.message
                });
            }
        }

        console.log(`📊 Bulk operation: ${results.success} success, ${results.failed} failed`);
        return results;
    }

    // ============================================
    // STATISTICS & ANALYTICS
    // ============================================

    getStatistics() {
        const stats = {
            total: this.students.length,
            byDivision: {},
            byStatus: {},
            byPaymentStatus: {},
            lastUpdated: this.lastUpdated
        };

        this.students.forEach(student => {
            // Division stats
            const div = student.division || 'Other';
            stats.byDivision[div] = (stats.byDivision[div] || 0) + 1;

            // Registration status stats
            const regStatus = student.registrationStatus || 'Unknown';
            stats.byStatus[regStatus] = (stats.byStatus[regStatus] || 0) + 1;

            // Payment status stats
            const payStatus = student.paymentStatus || 'Unknown';
            stats.byPaymentStatus[payStatus] = (stats.byPaymentStatus[payStatus] || 0) + 1;
        });

        return stats;
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    /**
     * Register callback for student data changes
     */
    onChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('❌ Listener error:', error);
            }
        });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check if students are loaded
     */
    isStudentsLoaded() {
        return this.isLoaded && this.students.length > 0;
    }

    /**
     * Get all students (returns copy)
     */
    getAllStudents() {
        return [...this.students];
    }

    /**
     * Clear cache and reload
     */
    async refresh() {
        this.students = [];
        this.studentsById.clear();
        this.studentsByDivision.clear();
        this.isLoaded = false;
        
        return await this.autoLoadStudents(true);
    }

    /**
     * Export students data
     */
    exportData(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.students, null, 2);
        }
        
        if (format === 'csv') {
            if (this.students.length === 0) return '';
            
            const headers = Object.keys(this.students[0]);
            const csv = [
                headers.join(','),
                ...this.students.map(student => 
                    headers.map(header => 
                        JSON.stringify(student[header] || '')
                    ).join(',')
                )
            ].join('\n');
            
            return csv;
        }

        return null;
    }
}

// ============================================
// SINGLETON INSTANCE & GLOBAL ACCESS
// ============================================

const studentLoader = new StudentLoader();

// Auto-load on initialization
studentLoader.autoLoadStudents().catch(error => {
    console.error('Failed to auto-load students on initialization:', error);
});

// ============================================
// CONVENIENCE FUNCTIONS (Global)
// ============================================

/**
 * Quick access to students (auto-loads if needed)
 */
window.getStudents = async function(forceRefresh = false) {
    return await studentLoader.autoLoadStudents(forceRefresh);
};

/**
 * Search students globally
 */
window.searchStudents = function(searchTerm, options = {}) {
    return studentLoader.searchStudents(searchTerm, options);
};

/**
 * Get student by ID globally
 */
window.getStudentById = function(id) {
    return studentLoader.getStudentById(id);
};

/**
 * Store fee record globally
 */
window.storeStudentFee = async function(studentId, feeData) {
    return await studentLoader.storeStudentFee(studentId, feeData);
};

/**
 * Get fee record globally
 */
window.getStudentFee = async function(studentId) {
    return await studentLoader.getStudentFee(studentId);
};

/**
 * Store payment globally
 */
window.storePayment = async function(paymentData) {
    return await studentLoader.storePayment(paymentData);
};

/**
 * Get student statistics globally
 */
window.getStudentStats = function() {
    return studentLoader.getStatistics();
};

/**
 * Enable real-time sync globally
 */
window.enableStudentSync = function() {
    return studentLoader.enableRealTimeSync();
};

/**
 * Disable real-time sync globally
 */
window.disableStudentSync = function() {
    return studentLoader.disableRealTimeSync();
};

/**
 * Refresh students globally
 */
window.refreshStudents = async function() {
    return await studentLoader.refresh();
};

// ============================================
// EXPORT
// ============================================

export default studentLoader;
export {
    studentLoader,
    StudentLoader
};

console.log('✅ Student Loader Module Initialized');
console.log('💡 Use: await getStudents() to load all students');
console.log('💡 Use: searchStudents("term") to search');
console.log('💡 Use: await storeStudentFee(id, data) to save fees');
