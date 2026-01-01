// ============================================
// ADVANCED FEE MANAGEMENT FEATURES
// Installments, Discounts, Late Fees, Advance Payments, Fee Breakdown
// ============================================

import { db } from '../firebase.js';
import {
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
    Timestamp,
    getDoc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================
// 1. INSTALLMENT MANAGEMENT
// ============================================

export class InstallmentManager {
    constructor() {
        this.installmentsCollection = 'installmentPlans';
    }

    /**
     * Create a custom installment plan
     * @param {Object} plan - Installment plan details
     * @returns {Promise<string>} - Plan ID
     */
    async createInstallmentPlan(plan) {
        try {
            const installmentPlan = {
                studentId: plan.studentId,
                studentName: plan.studentName,
                course: plan.course,
                totalFee: plan.totalFee,
                numberOfInstallments: plan.numberOfInstallments,
                installments: plan.installments, // Array of installment details
                createdAt: Timestamp.now(),
                createdBy: plan.createdBy || 'admin',
                status: 'active'
            };

            const docRef = await addDoc(collection(db, this.installmentsCollection), installmentPlan);
            console.log('✅ Installment plan created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating installment plan:', error);
            throw error;
        }
    }

    /**
     * Generate automatic installment breakdown
     * @param {number} totalFee - Total course fee
     * @param {number} numberOfInstallments - Number of parts
     * @param {Date} startDate - First installment due date
     * @param {number} intervalDays - Days between installments (default 30)
     * @returns {Array} - Array of installment objects
     */
    generateInstallments(totalFee, numberOfInstallments, startDate, intervalDays = 30) {
        const installmentAmount = Math.ceil(totalFee / numberOfInstallments);
        const installments = [];
        
        for (let i = 0; i < numberOfInstallments; i++) {
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + (i * intervalDays));
            
            // Last installment gets the remaining amount to handle rounding
            const amount = (i === numberOfInstallments - 1) 
                ? totalFee - (installmentAmount * (numberOfInstallments - 1))
                : installmentAmount;
            
            installments.push({
                installmentNumber: i + 1,
                amount: amount,
                dueDate: dueDate.toISOString().split('T')[0],
                status: 'pending',
                paidAmount: 0,
                paidDate: null,
                receiptNo: null
            });
        }
        
        return installments;
    }

    /**
     * Record installment payment
     * @param {string} planId - Installment plan ID
     * @param {number} installmentNumber - Which installment is being paid
     * @param {Object} payment - Payment details
     */
    async recordInstallmentPayment(planId, installmentNumber, payment) {
        try {
            const planRef = doc(db, this.installmentsCollection, planId);
            const planDoc = await getDoc(planRef);
            
            if (!planDoc.exists()) {
                throw new Error('Installment plan not found');
            }
            
            const planData = planDoc.data();
            const installments = planData.installments;
            
            // Update the specific installment
            const installmentIndex = installments.findIndex(
                inst => inst.installmentNumber === installmentNumber
            );
            
            if (installmentIndex === -1) {
                throw new Error('Installment not found');
            }
            
            installments[installmentIndex] = {
                ...installments[installmentIndex],
                status: payment.paidAmount >= installments[installmentIndex].amount ? 'paid' : 'partial',
                paidAmount: (installments[installmentIndex].paidAmount || 0) + payment.paidAmount,
                paidDate: payment.paidDate,
                receiptNo: payment.receiptNo,
                paymentMode: payment.paymentMode
            };
            
            await updateDoc(planRef, {
                installments: installments,
                lastPaymentDate: Timestamp.now()
            });
            
            console.log('✅ Installment payment recorded');
            return true;
        } catch (error) {
            console.error('❌ Error recording installment payment:', error);
            throw error;
        }
    }

    /**
     * Get installment plan for a student
     * @param {string} studentId - Student ID
     * @returns {Promise<Array>} - Array of installment plans
     */
    async getStudentInstallments(studentId) {
        try {
            const q = query(
                collection(db, this.installmentsCollection),
                where('studentId', '==', studentId),
                orderBy('createdAt', 'desc')
            );
            
            const snapshot = await getDocs(q);
            const plans = [];
            snapshot.forEach(doc => {
                plans.push({ id: doc.id, ...doc.data() });
            });
            
            return plans;
        } catch (error) {
            console.error('❌ Error fetching installment plans:', error);
            throw error;
        }
    }
}

// ============================================
// 2. DISCOUNTS & SCHOLARSHIPS
// ============================================

export class DiscountManager {
    constructor() {
        this.discountsCollection = 'discounts';
    }

    /**
     * Apply discount to fee
     * @param {Object} discount - Discount details
     * @returns {Promise<Object>} - Calculated discount
     */
    async applyDiscount(discount) {
        try {
            let discountAmount = 0;
            
            if (discount.type === 'percentage') {
                discountAmount = (discount.baseFee * discount.value) / 100;
            } else if (discount.type === 'flat') {
                discountAmount = discount.value;
            }
            
            const finalFee = discount.baseFee - discountAmount;
            
            // Record discount in database
            const discountRecord = {
                studentId: discount.studentId,
                studentName: discount.studentName,
                discountType: discount.type,
                discountCategory: discount.category, // 'scholarship', 'referral', 'early-bird', 'sibling', 'custom'
                discountValue: discount.value,
                discountAmount: discountAmount,
                baseFee: discount.baseFee,
                finalFee: finalFee,
                reason: discount.reason || '',
                appliedBy: discount.appliedBy || 'admin',
                appliedDate: Timestamp.now(),
                course: discount.course,
                status: 'active'
            };
            
            const docRef = await addDoc(collection(db, this.discountsCollection), discountRecord);
            
            console.log('✅ Discount applied:', discountAmount);
            return {
                id: docRef.id,
                discountAmount,
                finalFee,
                ...discountRecord
            };
        } catch (error) {
            console.error('❌ Error applying discount:', error);
            throw error;
        }
    }

    /**
     * Create scholarship program
     * @param {Object} scholarship - Scholarship details
     */
    async createScholarship(scholarship) {
        try {
            const scholarshipData = {
                name: scholarship.name,
                type: scholarship.type, // 'merit', 'need-based', 'sports', 'special'
                discountType: scholarship.discountType, // 'percentage' or 'flat'
                discountValue: scholarship.discountValue,
                eligibilityCriteria: scholarship.eligibilityCriteria,
                maxBeneficiaries: scholarship.maxBeneficiaries || null,
                currentBeneficiaries: 0,
                validFrom: scholarship.validFrom,
                validUntil: scholarship.validUntil,
                courses: scholarship.courses || [], // Applicable courses
                status: 'active',
                createdAt: Timestamp.now()
            };
            
            const docRef = await addDoc(collection(db, 'scholarships'), scholarshipData);
            console.log('✅ Scholarship created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating scholarship:', error);
            throw error;
        }
    }

    /**
     * Get student's discounts
     * @param {string} studentId - Student ID
     */
    async getStudentDiscounts(studentId) {
        try {
            const q = query(
                collection(db, this.discountsCollection),
                where('studentId', '==', studentId),
                where('status', '==', 'active')
            );
            
            const snapshot = await getDocs(q);
            const discounts = [];
            snapshot.forEach(doc => {
                discounts.push({ id: doc.id, ...doc.data() });
            });
            
            return discounts;
        } catch (error) {
            console.error('❌ Error fetching discounts:', error);
            throw error;
        }
    }
}

// ============================================
// 3. LATE FEE SYSTEM
// ============================================

export class LateFeeCalculator {
    constructor() {
        this.lateFeesCollection = 'lateFees';
    }

    /**
     * Calculate late fee based on rules
     * @param {Object} feeDetails - Fee and due date details
     * @param {Object} rules - Late fee rules
     * @returns {Object} - Late fee calculation
     */
    calculateLateFee(feeDetails, rules) {
        const dueDate = new Date(feeDetails.dueDate);
        const currentDate = new Date();
        const daysLate = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
        
        if (daysLate <= 0) {
            return {
                daysLate: 0,
                lateFeeAmount: 0,
                totalAmount: feeDetails.amount
            };
        }
        
        let lateFeeAmount = 0;
        
        // Calculate based on rule type
        if (rules.type === 'fixed-per-day') {
            lateFeeAmount = daysLate * rules.amountPerDay;
        } else if (rules.type === 'percentage-per-day') {
            lateFeeAmount = (feeDetails.amount * rules.percentagePerDay * daysLate) / 100;
        } else if (rules.type === 'tiered') {
            // Tiered late fees (e.g., 0-7 days: ₹10/day, 8-30 days: ₹20/day, >30 days: ₹50/day)
            if (daysLate <= 7) {
                lateFeeAmount = daysLate * (rules.tier1 || 10);
            } else if (daysLate <= 30) {
                lateFeeAmount = (7 * (rules.tier1 || 10)) + ((daysLate - 7) * (rules.tier2 || 20));
            } else {
                lateFeeAmount = (7 * (rules.tier1 || 10)) + (23 * (rules.tier2 || 20)) + 
                               ((daysLate - 30) * (rules.tier3 || 50));
            }
        } else if (rules.type === 'fixed-one-time') {
            lateFeeAmount = rules.fixedAmount;
        }
        
        // Apply maximum cap if specified
        if (rules.maxLateFee && lateFeeAmount > rules.maxLateFee) {
            lateFeeAmount = rules.maxLateFee;
        }
        
        return {
            daysLate,
            lateFeeAmount: Math.round(lateFeeAmount),
            totalAmount: feeDetails.amount + Math.round(lateFeeAmount),
            calculationMethod: rules.type
        };
    }

    /**
     * Record late fee in database
     * @param {Object} lateFeeData - Late fee details
     */
    async recordLateFee(lateFeeData) {
        try {
            const record = {
                studentId: lateFeeData.studentId,
                studentName: lateFeeData.studentName,
                originalFee: lateFeeData.originalFee,
                dueDate: lateFeeData.dueDate,
                paidDate: lateFeeData.paidDate || new Date().toISOString().split('T')[0],
                daysLate: lateFeeData.daysLate,
                lateFeeAmount: lateFeeData.lateFeeAmount,
                totalAmount: lateFeeData.totalAmount,
                receiptNo: lateFeeData.receiptNo,
                status: 'applied',
                createdAt: Timestamp.now()
            };
            
            const docRef = await addDoc(collection(db, this.lateFeesCollection), record);
            console.log('✅ Late fee recorded:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error recording late fee:', error);
            throw error;
        }
    }

    /**
     * Get default late fee rules for a division
     * @param {string} division - Division name
     * @returns {Object} - Late fee rules
     */
    getDefaultRules(division) {
        const defaultRules = {
            'gama': {
                type: 'fixed-per-day',
                amountPerDay: 10,
                maxLateFee: 500
            },
            'lbs': {
                type: 'tiered',
                tier1: 15, // 0-7 days
                tier2: 30, // 8-30 days
                tier3: 50, // >30 days
                maxLateFee: 2000
            },
            'capt': {
                type: 'percentage-per-day',
                percentagePerDay: 0.5, // 0.5% per day
                maxLateFee: 1500
            }
        };
        
        return defaultRules[division] || defaultRules['gama'];
    }
}

// ============================================
// 4. ADVANCE PAYMENT SUPPORT
// ============================================

export class AdvancePaymentManager {
    constructor() {
        this.advanceCollection = 'advancePayments';
    }

    /**
     * Record advance payment
     * @param {Object} payment - Payment details
     */
    async recordAdvancePayment(payment) {
        try {
            const advanceRecord = {
                studentId: payment.studentId,
                studentName: payment.studentName,
                amount: payment.amount,
                paymentDate: payment.paymentDate,
                paymentMode: payment.paymentMode,
                receiptNo: payment.receiptNo,
                remainingBalance: payment.amount,
                usedAmount: 0,
                status: 'available',
                adjustments: [], // Track where advance is used
                notes: payment.notes || '',
                createdAt: Timestamp.now(),
                createdBy: payment.createdBy || 'admin'
            };
            
            const docRef = await addDoc(collection(db, this.advanceCollection), advanceRecord);
            console.log('✅ Advance payment recorded:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error recording advance payment:', error);
            throw error;
        }
    }

    /**
     * Adjust advance payment against a due
     * @param {string} advanceId - Advance payment ID
     * @param {Object} adjustment - Adjustment details
     */
    async adjustAdvancePayment(advanceId, adjustment) {
        try {
            const advanceRef = doc(db, this.advanceCollection, advanceId);
            const advanceDoc = await getDoc(advanceRef);
            
            if (!advanceDoc.exists()) {
                throw new Error('Advance payment not found');
            }
            
            const advanceData = advanceDoc.data();
            
            if (adjustment.amount > advanceData.remainingBalance) {
                throw new Error('Adjustment amount exceeds available advance balance');
            }
            
            const newAdjustment = {
                adjustmentId: `ADJ-${Date.now()}`,
                amount: adjustment.amount,
                adjustedAgainst: adjustment.adjustedAgainst, // Fee record ID
                adjustedDate: new Date().toISOString().split('T')[0],
                description: adjustment.description
            };
            
            const updatedAdjustments = [...(advanceData.adjustments || []), newAdjustment];
            const newRemainingBalance = advanceData.remainingBalance - adjustment.amount;
            const newUsedAmount = advanceData.usedAmount + adjustment.amount;
            
            await updateDoc(advanceRef, {
                adjustments: updatedAdjustments,
                remainingBalance: newRemainingBalance,
                usedAmount: newUsedAmount,
                status: newRemainingBalance === 0 ? 'fully-used' : 'available',
                lastAdjustmentDate: Timestamp.now()
            });
            
            console.log('✅ Advance payment adjusted');
            return {
                success: true,
                remainingBalance: newRemainingBalance,
                adjustmentId: newAdjustment.adjustmentId
            };
        } catch (error) {
            console.error('❌ Error adjusting advance payment:', error);
            throw error;
        }
    }

    /**
     * Get student's advance payments
     * @param {string} studentId - Student ID
     */
    async getStudentAdvancePayments(studentId) {
        try {
            const q = query(
                collection(db, this.advanceCollection),
                where('studentId', '==', studentId),
                orderBy('createdAt', 'desc')
            );
            
            const snapshot = await getDocs(q);
            const advances = [];
            snapshot.forEach(doc => {
                advances.push({ id: doc.id, ...doc.data() });
            });
            
            return advances;
        } catch (error) {
            console.error('❌ Error fetching advance payments:', error);
            throw error;
        }
    }

    /**
     * Get total available advance balance for student
     * @param {string} studentId - Student ID
     */
    async getAvailableAdvanceBalance(studentId) {
        try {
            const advances = await this.getStudentAdvancePayments(studentId);
            const availableAdvances = advances.filter(adv => adv.status === 'available');
            const totalBalance = availableAdvances.reduce((sum, adv) => sum + adv.remainingBalance, 0);
            
            return totalBalance;
        } catch (error) {
            console.error('❌ Error calculating advance balance:', error);
            throw error;
        }
    }
}

// ============================================
// 5. FEE BREAKDOWN PER COURSE
// ============================================

export class FeeBreakdownManager {
    constructor() {
        this.breakdownCollection = 'feeBreakdowns';
    }

    /**
     * Create fee breakdown for a course
     * @param {Object} breakdown - Fee breakdown details
     */
    async createFeeBreakdown(breakdown) {
        try {
            const feeBreakdown = {
                courseId: breakdown.courseId,
                courseName: breakdown.courseName,
                division: breakdown.division,
                totalFee: breakdown.totalFee,
                components: {
                    admissionFee: breakdown.admissionFee || 0,
                    courseFee: breakdown.courseFee || 0,
                    examFee: breakdown.examFee || 0,
                    materialFee: breakdown.materialFee || 0,
                    labFee: breakdown.labFee || 0,
                    certificateFee: breakdown.certificateFee || 0,
                    otherFees: breakdown.otherFees || []
                },
                customCategories: breakdown.customCategories || [],
                isActive: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            
            // Validate that components sum to total
            const componentSum = this.calculateTotalFromComponents(feeBreakdown.components);
            if (Math.abs(componentSum - breakdown.totalFee) > 0.01) {
                console.warn('⚠️ Fee components do not sum to total fee');
            }
            
            const docRef = await addDoc(collection(db, this.breakdownCollection), feeBreakdown);
            console.log('✅ Fee breakdown created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating fee breakdown:', error);
            throw error;
        }
    }

    /**
     * Calculate total from components
     * @param {Object} components - Fee components
     */
    calculateTotalFromComponents(components) {
        let total = 0;
        total += components.admissionFee || 0;
        total += components.courseFee || 0;
        total += components.examFee || 0;
        total += components.materialFee || 0;
        total += components.labFee || 0;
        total += components.certificateFee || 0;
        
        if (components.otherFees && Array.isArray(components.otherFees)) {
            components.otherFees.forEach(fee => {
                total += fee.amount || 0;
            });
        }
        
        return total;
    }

    /**
     * Get fee breakdown for a course
     * @param {string} courseId - Course ID
     */
    async getCourseBreakdown(courseId) {
        try {
            const q = query(
                collection(db, this.breakdownCollection),
                where('courseId', '==', courseId),
                where('isActive', '==', true)
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                return null;
            }
            
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('❌ Error fetching fee breakdown:', error);
            throw error;
        }
    }

    /**
     * Apply fee breakdown to student
     * @param {string} studentId - Student ID
     * @param {string} breakdownId - Breakdown ID
     */
    async applyBreakdownToStudent(studentId, breakdownId) {
        try {
            const breakdownRef = doc(db, this.breakdownCollection, breakdownId);
            const breakdownDoc = await getDoc(breakdownRef);
            
            if (!breakdownDoc.exists()) {
                throw new Error('Fee breakdown not found');
            }
            
            const breakdown = breakdownDoc.data();
            
            // Create student-specific fee record with breakdown
            const studentFeeBreakdown = {
                studentId: studentId,
                breakdownId: breakdownId,
                courseId: breakdown.courseId,
                courseName: breakdown.courseName,
                totalFee: breakdown.totalFee,
                components: breakdown.components,
                paidComponents: {
                    admissionFee: 0,
                    courseFee: 0,
                    examFee: 0,
                    materialFee: 0,
                    labFee: 0,
                    certificateFee: 0
                },
                appliedDate: Timestamp.now()
            };
            
            const docRef = await addDoc(collection(db, 'studentFeeBreakdowns'), studentFeeBreakdown);
            console.log('✅ Fee breakdown applied to student');
            return docRef.id;
        } catch (error) {
            console.error('❌ Error applying fee breakdown:', error);
            throw error;
        }
    }
}

// ============================================
// 6. FEE CATEGORY MANAGER
// ============================================

export class FeeCategoryManager {
    constructor() {
        this.categoriesCollection = 'feeCategories';
    }

    /**
     * Create new fee category
     * @param {Object} category - Category details
     */
    async createCategory(category) {
        try {
            const categoryData = {
                name: category.name,
                code: category.code || category.name.toUpperCase().replace(/\s/g, '_'),
                description: category.description || '',
                defaultAmount: category.defaultAmount || 0,
                isOptional: category.isOptional || false,
                applicableDivisions: category.applicableDivisions || ['all'],
                applicableCourses: category.applicableCourses || [],
                isActive: true,
                displayOrder: category.displayOrder || 999,
                icon: category.icon || 'fa-money-bill',
                color: category.color || '#3b82f6',
                createdAt: Timestamp.now(),
                createdBy: category.createdBy || 'admin'
            };
            
            const docRef = await addDoc(collection(db, this.categoriesCollection), categoryData);
            console.log('✅ Fee category created:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating fee category:', error);
            throw error;
        }
    }

    /**
     * Get all active fee categories
     * @param {string} division - Filter by division (optional)
     */
    async getCategories(division = null) {
        try {
            let q;
            if (division) {
                q = query(
                    collection(db, this.categoriesCollection),
                    where('isActive', '==', true),
                    where('applicableDivisions', 'array-contains', division),
                    orderBy('displayOrder')
                );
            } else {
                q = query(
                    collection(db, this.categoriesCollection),
                    where('isActive', '==', true),
                    orderBy('displayOrder')
                );
            }
            
            const snapshot = await getDocs(q);
            const categories = [];
            snapshot.forEach(doc => {
                categories.push({ id: doc.id, ...doc.data() });
            });
            
            return categories;
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            throw error;
        }
    }

    /**
     * Update fee category
     * @param {string} categoryId - Category ID
     * @param {Object} updates - Updated fields
     */
    async updateCategory(categoryId, updates) {
        try {
            const categoryRef = doc(db, this.categoriesCollection, categoryId);
            await updateDoc(categoryRef, {
                ...updates,
                updatedAt: Timestamp.now()
            });
            
            console.log('✅ Fee category updated');
            return true;
        } catch (error) {
            console.error('❌ Error updating category:', error);
            throw error;
        }
    }

    /**
     * Delete (deactivate) fee category
     * @param {string} categoryId - Category ID
     */
    async deleteCategory(categoryId) {
        try {
            const categoryRef = doc(db, this.categoriesCollection, categoryId);
            await updateDoc(categoryRef, {
                isActive: false,
                deletedAt: Timestamp.now()
            });
            
            console.log('✅ Fee category deleted');
            return true;
        } catch (error) {
            console.error('❌ Error deleting category:', error);
            throw error;
        }
    }

    /**
     * Get predefined category templates
     */
    getCategoryTemplates() {
        return [
            {
                name: 'Uniform Fee',
                code: 'UNIFORM_FEE',
                description: 'Fee for student uniform',
                icon: 'fa-tshirt',
                color: '#10b981'
            },
            {
                name: 'Lab Fee',
                code: 'LAB_FEE',
                description: 'Laboratory usage and equipment fee',
                icon: 'fa-flask',
                color: '#8b5cf6'
            },
            {
                name: 'Library Fee',
                code: 'LIBRARY_FEE',
                description: 'Library access and book rental fee',
                icon: 'fa-book',
                color: '#f59e0b'
            },
            {
                name: 'Transport Fee',
                code: 'TRANSPORT_FEE',
                description: 'Transportation service fee',
                icon: 'fa-bus',
                color: '#ef4444'
            },
            {
                name: 'Sports Fee',
                code: 'SPORTS_FEE',
                description: 'Sports and physical education fee',
                icon: 'fa-futbol',
                color: '#06b6d4'
            },
            {
                name: 'Hostel Fee',
                code: 'HOSTEL_FEE',
                description: 'Accommodation fee',
                icon: 'fa-bed',
                color: '#ec4899'
            },
            {
                name: 'Internet Fee',
                code: 'INTERNET_FEE',
                description: 'Internet and Wi-Fi access fee',
                icon: 'fa-wifi',
                color: '#6366f1'
            },
            {
                name: 'ID Card Fee',
                code: 'ID_CARD_FEE',
                description: 'Student ID card issuance fee',
                icon: 'fa-id-card',
                color: '#14b8a6'
            },
            {
                name: 'Event Fee',
                code: 'EVENT_FEE',
                description: 'Special events and activities fee',
                icon: 'fa-calendar-star',
                color: '#f97316'
            },
            {
                name: 'Practical Fee',
                code: 'PRACTICAL_FEE',
                description: 'Hands-on practical training fee',
                icon: 'fa-laptop-code',
                color: '#3b82f6'
            }
        ];
    }
}

// ============================================
// EXPORT ALL MANAGERS
// ============================================

export default {
    InstallmentManager,
    DiscountManager,
    LateFeeCalculator,
    AdvancePaymentManager,
    FeeBreakdownManager,
    FeeCategoryManager
};
