// ============================================
// FIREBASE COLLECTIONS SETUP FOR ADVANCED FEE MANAGEMENT
// Initialize all collections with proper structure
// ============================================

import { db } from './firebase.js';
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs,
    addDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// COLLECTION NAMES
// ============================================

export const COLLECTIONS = {
    INSTALLMENT_PLANS: 'installmentPlans',
    DISCOUNTS: 'discounts',
    SCHOLARSHIPS: 'scholarships',
    LATE_FEES: 'lateFees',
    LATE_FEE_RULES: 'lateFeeRules',
    ADVANCE_PAYMENTS: 'advancePayments',
    FEE_BREAKDOWNS: 'feeBreakdowns',
    STUDENT_FEE_BREAKDOWNS: 'studentFeeBreakdowns',
    FEE_CATEGORIES: 'feeCategories'
};

// ============================================
// COLLECTION STRUCTURES (SCHEMAS)
// ============================================

const SCHEMAS = {
    
    // Installment Plans Collection
    installmentPlans: {
        planId: 'string (auto-generated)',
        studentId: 'string (user doc ID)',
        studentName: 'string',
        course: 'string',
        division: 'string',
        totalFee: 'number',
        numberOfInstallments: 'number',
        interval: 'string (weekly/monthly/custom)',
        startDate: 'date',
        installments: 'array of objects',
        // installments[]: { 
        //   installmentNumber, 
        //   amount, 
        //   dueDate, 
        //   status (pending/paid/overdue),
        //   paidDate, 
        //   paidAmount, 
        //   paymentMode, 
        //   receiptNo 
        // }
        totalPaid: 'number',
        remainingBalance: 'number',
        status: 'string (active/completed/cancelled)',
        createdAt: 'timestamp',
        createdBy: 'string',
        lastModified: 'timestamp'
    },

    // Discounts Collection
    discounts: {
        discountId: 'string (auto-generated)',
        studentId: 'string',
        studentName: 'string',
        discountType: 'string (percentage/flat)',
        discountValue: 'number',
        discountAmount: 'number (calculated)',
        category: 'string (early_bird/merit/group/referral/custom)',
        baseFee: 'number',
        finalFee: 'number',
        reason: 'string',
        appliedDate: 'date',
        appliedBy: 'string',
        status: 'string (active/expired/removed)',
        validUntil: 'date (optional)',
        createdAt: 'timestamp'
    },

    // Scholarships Collection
    scholarships: {
        scholarshipId: 'string (auto-generated)',
        name: 'string',
        type: 'string (merit/need/sports/arts/other)',
        discountType: 'string (percentage/flat)',
        discountValue: 'number',
        eligibilityCriteria: 'string',
        maxBeneficiaries: 'number (optional)',
        currentBeneficiaries: 'number',
        beneficiaries: 'array of studentIds',
        validFrom: 'date',
        validUntil: 'date',
        courses: 'array of course names',
        divisions: 'array of division names',
        status: 'string (active/inactive/expired)',
        createdAt: 'timestamp',
        createdBy: 'string'
    },

    // Late Fees Collection
    lateFees: {
        lateFeeId: 'string (auto-generated)',
        studentId: 'string',
        studentName: 'string',
        feeId: 'string (reference to fees collection)',
        originalAmount: 'number',
        daysOverdue: 'number',
        lateFeeAmount: 'number',
        totalAmount: 'number',
        calculationMethod: 'string (fixed/percentage/tiered/one_time)',
        dueDate: 'date',
        calculatedDate: 'date',
        status: 'string (pending/paid/waived)',
        paidDate: 'date (optional)',
        waivedBy: 'string (optional)',
        waivedReason: 'string (optional)',
        createdAt: 'timestamp'
    },

    // Late Fee Rules Collection
    lateFeeRules: {
        ruleId: 'string',
        division: 'string (gama/lbs/capt/all)',
        method: 'string (fixed/percentage/tiered/one_time)',
        fixedAmount: 'number (optional)',
        percentageRate: 'number (optional)',
        gracePeriod: 'number (days)',
        tiers: 'array (optional)',
        // tiers[]: { minDays, maxDays, amount/percentage }
        status: 'string (active/inactive)',
        createdAt: 'timestamp',
        updatedAt: 'timestamp'
    },

    // Advance Payments Collection
    advancePayments: {
        advanceId: 'string (auto-generated)',
        studentId: 'string',
        studentName: 'string',
        division: 'string',
        amountPaid: 'number',
        usedAmount: 'number',
        remainingBalance: 'number',
        paymentDate: 'date',
        paymentMode: 'string (cash/upi/card/cheque/bank_transfer)',
        receiptNo: 'string',
        notes: 'string',
        adjustments: 'array of objects',
        // adjustments[]: { 
        //   date, 
        //   amount, 
        //   description, 
        //   feeId (optional), 
        //   adjustedBy 
        // }
        status: 'string (available/fully_used/partially_used)',
        createdAt: 'timestamp',
        createdBy: 'string',
        lastAdjusted: 'timestamp (optional)'
    },

    // Fee Breakdowns Collection (Course Templates)
    feeBreakdowns: {
        breakdownId: 'string (auto-generated)',
        courseId: 'string',
        courseName: 'string',
        division: 'string',
        totalFee: 'number',
        admissionFee: 'number',
        courseFee: 'number',
        examFee: 'number',
        materialFee: 'number',
        labFee: 'number',
        certificateFee: 'number',
        otherFees: 'array of objects',
        // otherFees[]: { name, amount, description }
        createdAt: 'timestamp',
        createdBy: 'string',
        lastModified: 'timestamp'
    },

    // Student Fee Breakdowns Collection (Applied to Students)
    studentFeeBreakdowns: {
        id: 'string (auto-generated)',
        studentId: 'string',
        studentName: 'string',
        breakdownId: 'string (reference)',
        courseName: 'string',
        totalFee: 'number',
        components: 'object',
        // components: { 
        //   admission: {amount, paid, pending, status},
        //   course: {amount, paid, pending, status},
        //   exam: {amount, paid, pending, status},
        //   material: {amount, paid, pending, status},
        //   lab: {amount, paid, pending, status},
        //   certificate: {amount, paid, pending, status}
        // }
        totalPaid: 'number',
        totalPending: 'number',
        appliedDate: 'date',
        appliedBy: 'string',
        createdAt: 'timestamp'
    },

    // Fee Categories Collection
    feeCategories: {
        categoryId: 'string (auto-generated)',
        name: 'string',
        code: 'string (unique)',
        description: 'string',
        defaultAmount: 'number',
        isOptional: 'boolean',
        applicableDivisions: 'array of strings',
        icon: 'string (font-awesome class)',
        color: 'string (hex color)',
        status: 'string (active/inactive)',
        createdAt: 'timestamp',
        createdBy: 'string'
    }
};

// ============================================
// SAMPLE DATA FOR INITIALIZATION
// ============================================

const SAMPLE_DATA = {
    
    // Sample Late Fee Rules (Default for each division)
    lateFeeRules: [
        {
            ruleId: 'gama-default',
            division: 'gama',
            method: 'percentage',
            percentageRate: 2,
            gracePeriod: 7,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            ruleId: 'lbs-default',
            division: 'lbs',
            method: 'tiered',
            gracePeriod: 5,
            tiers: [
                { minDays: 1, maxDays: 7, amount: 100 },
                { minDays: 8, maxDays: 15, amount: 200 },
                { minDays: 16, maxDays: 30, amount: 500 },
                { minDays: 31, maxDays: 999, amount: 1000 }
            ],
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            ruleId: 'capt-default',
            division: 'capt',
            method: 'fixed',
            fixedAmount: 500,
            gracePeriod: 10,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ],

    // Sample Fee Categories (10 Pre-built Templates)
    feeCategories: [
        {
            name: 'Admission Fee',
            code: 'ADMISSION',
            description: 'One-time admission fee for new students',
            defaultAmount: 5000,
            isOptional: false,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-door-open',
            color: '#3B82F6',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Exam Fee',
            code: 'EXAM',
            description: 'Examination and assessment fee',
            defaultAmount: 2000,
            isOptional: false,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-file-alt',
            color: '#10B981',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Lab Fee',
            code: 'LAB',
            description: 'Laboratory and practical session fee',
            defaultAmount: 3000,
            isOptional: false,
            applicableDivisions: ['lbs', 'capt'],
            icon: 'fa-flask',
            color: '#F59E0B',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Library Fee',
            code: 'LIBRARY',
            description: 'Annual library subscription and book access',
            defaultAmount: 1500,
            isOptional: true,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-book',
            color: '#8B5CF6',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Transport Fee',
            code: 'TRANSPORT',
            description: 'Monthly transportation service fee',
            defaultAmount: 2000,
            isOptional: true,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-bus',
            color: '#EC4899',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Uniform Fee',
            code: 'UNIFORM',
            description: 'Uniform and dress code items',
            defaultAmount: 1000,
            isOptional: true,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-tshirt',
            color: '#06B6D4',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Material Fee',
            code: 'MATERIAL',
            description: 'Study materials and course resources',
            defaultAmount: 1500,
            isOptional: false,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-books',
            color: '#14B8A6',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Certificate Fee',
            code: 'CERTIFICATE',
            description: 'Course completion certificate fee',
            defaultAmount: 500,
            isOptional: false,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-certificate',
            color: '#F97316',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Sports Fee',
            code: 'SPORTS',
            description: 'Sports and extracurricular activities',
            defaultAmount: 1000,
            isOptional: true,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-running',
            color: '#EF4444',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        },
        {
            name: 'Event Fee',
            code: 'EVENT',
            description: 'Annual events and cultural activities',
            defaultAmount: 800,
            isOptional: true,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: 'fa-calendar-star',
            color: '#A855F7',
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system'
        }
    ]
};

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

/**
 * Initialize all collections with sample data
 */
export async function initializeAllCollections() {
    console.log('🚀 Starting Advanced Fee Collections Initialization...');
    
    try {
        // Initialize Late Fee Rules
        await initializeLateFeeRules();
        
        // Initialize Fee Categories
        await initializeFeeCategories();
        
        console.log('✅ All Advanced Fee Collections Initialized Successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error initializing collections:', error);
        return false;
    }
}

/**
 * Initialize Late Fee Rules Collection
 */
async function initializeLateFeeRules() {
    console.log('📋 Initializing Late Fee Rules...');
    
    const rulesRef = collection(db, COLLECTIONS.LATE_FEE_RULES);
    
    // Check if rules already exist
    const existingRules = await getDocs(rulesRef);
    if (!existingRules.empty) {
        console.log('⚠️ Late Fee Rules already exist. Skipping...');
        return;
    }
    
    // Add sample rules
    for (const rule of SAMPLE_DATA.lateFeeRules) {
        await setDoc(doc(db, COLLECTIONS.LATE_FEE_RULES, rule.ruleId), rule);
        console.log(`   ✓ Added ${rule.division.toUpperCase()} late fee rule`);
    }
    
    console.log('✅ Late Fee Rules initialized');
}

/**
 * Initialize Fee Categories Collection
 */
async function initializeFeeCategories() {
    console.log('📋 Initializing Fee Categories...');
    
    const categoriesRef = collection(db, COLLECTIONS.FEE_CATEGORIES);
    
    // Check if categories already exist
    const existingCategories = await getDocs(categoriesRef);
    if (!existingCategories.empty) {
        console.log('⚠️ Fee Categories already exist. Skipping...');
        return;
    }
    
    // Add sample categories
    for (const category of SAMPLE_DATA.feeCategories) {
        const docRef = await addDoc(categoriesRef, category);
        console.log(`   ✓ Added ${category.name} (${category.code})`);
    }
    
    console.log('✅ Fee Categories initialized');
}

/**
 * Check if collections exist
 */
export async function checkCollectionsExist() {
    console.log('🔍 Checking Advanced Fee Collections...');
    
    const results = {};
    
    for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
        const snapshot = await getDocs(collection(db, collectionName));
        results[collectionName] = {
            exists: !snapshot.empty,
            count: snapshot.size
        };
        console.log(`   ${results[collectionName].exists ? '✓' : '✗'} ${collectionName}: ${snapshot.size} documents`);
    }
    
    return results;
}

/**
 * Get collection statistics
 */
export async function getCollectionStats() {
    console.log('📊 Getting Collection Statistics...');
    
    const stats = {};
    
    for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            stats[collectionName] = {
                totalDocuments: snapshot.size,
                collectionName: collectionName
            };
        } catch (error) {
            stats[collectionName] = {
                totalDocuments: 0,
                error: error.message
            };
        }
    }
    
    return stats;
}

/**
 * Print collection schemas (for documentation)
 */
export function printSchemas() {
    console.log('📚 Advanced Fee Management Collection Schemas:');
    console.log('='.repeat(60));
    
    for (const [collectionName, schema] of Object.entries(SCHEMAS)) {
        console.log(`\n📁 Collection: ${collectionName}`);
        console.log('-'.repeat(60));
        for (const [field, type] of Object.entries(schema)) {
            console.log(`   ${field}: ${type}`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
}

// ============================================
// EXPORT COLLECTION NAMES FOR USE IN OTHER FILES
// ============================================

export default COLLECTIONS;

console.log('✅ Fee Advanced Collections Setup Module Loaded');
