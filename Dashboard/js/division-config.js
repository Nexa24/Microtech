// ============================================
// DIVISION-SPECIFIC FEE CONFIGURATIONS
// ============================================

const DIVISION_CONFIG = {
    GAMA: {
        name: 'Gama Abacus',
        icon: 'fas fa-graduation-cap',
        feeStructure: {
            admissionFee: 1000,
            monthlyFee: 600,
            duration: 36, // 3 years in months
            paymentMode: 'monthly'
        },
        feeTypes: ['Admission Fee', 'Monthly Fee', 'Material Charges', 'Exam Fee'],
        defaultType: 'Monthly Fee',
        description: 'Long-duration kids coaching program with monthly payments',
        features: [
            'Recurring monthly payments',
            'Auto-reminder for pending fees',
            'Material charges yearly',
            'Exam fees tracked separately'
        ]
    },
    
    CAPT: {
        name: 'CAPT - Computer Academy',
        icon: 'fas fa-laptop-code',
        feeStructure: {
            flexible: true,
            paymentMode: 'course-based', // Full or Installment
            minCourse: 3, // months
            maxCourse: 12 // months
        },
        feeTypes: ['Admission Fee', 'Course Fee', 'Installment 1', 'Installment 2', 'Installment 3', 'Full Payment'],
        defaultType: 'Course Fee',
        description: 'Short and long-term computer courses with flexible payment',
        features: [
            'Course-based fee structure',
            'Full or installment payment',
            'Auto-fetch course fee from database',
            'Installment due date tracking'
        ],
        courses: {
            'MS Office': { fee: 2500, duration: 3, installments: 2 },
            'DCA': { fee: 4000, duration: 6, installments: 2 },
            'ADCA': { fee: 6000, duration: 12, installments: 3 },
            'Tally Prime': { fee: 3500, duration: 4, installments: 2 },
            'Web Development': { fee: 8000, duration: 6, installments: 3 },
            'Graphic Design': { fee: 5500, duration: 5, installments: 2 }
        }
    },
    
    LBS: {
        name: 'LBS Skill Centre',
        icon: 'fas fa-certificate',
        feeStructure: {
            structured: true,
            components: ['Admission', 'Course', 'Exam'],
            paymentMode: 'structured-installment'
        },
        feeTypes: ['Admission Fee', 'Course Fee', 'Exam Fee', 'Registration Fee'],
        defaultType: 'Course Fee',
        description: 'Government-affiliated professional courses with structured fees',
        features: [
            'Government-regulated fee structure',
            'Three-part payment (Admission + Course + Exam)',
            'Batch-wise tracking',
            'Official certification fees'
        ],
        courses: {
            'Data Entry Operator': { admission: 500, course: 3000, exam: 500, duration: 6 },
            'Computer Hardware': { admission: 800, course: 4500, exam: 700, duration: 6 },
            'Accounting': { admission: 600, course: 4000, exam: 600, duration: 6 },
            'Digital Marketing': { admission: 1000, course: 6000, exam: 1000, duration: 8 },
            'Office Management': { admission: 700, course: 3500, exam: 800, duration: 5 }
        }
    },
    
    OTHERS: {
        name: 'Micro Computers & Services',
        icon: 'fas fa-tools',
        feeStructure: {
            oneTime: true,
            paymentMode: 'instant',
            invoiceGeneration: true
        },
        feeTypes: ['Service Charge', 'Product Sale', 'Component Sale', 'Repair Charge', 'Custom Build', 'Other'],
        defaultType: 'Service Charge',
        description: 'PC servicing, custom builds, and accessories sales',
        features: [
            'One-time payment entry',
            'Instant invoice generation',
            'Service and product tracking',
            'Separate from education revenue'
        ],
        services: {
            'PC Servicing': { min: 300, max: 1500 },
            'Laptop Repair': { min: 500, max: 3000 },
            'Data Recovery': { min: 1000, max: 5000 },
            'Software Installation': { min: 200, max: 800 },
            'Custom Build': { min: 15000, max: 150000 }
        }
    }
};

// ============================================
// DIVISION-SPECIFIC FEE CALCULATOR
// ============================================

class DivisionFeeCalculator {
    constructor(division) {
        this.division = division;
        this.config = DIVISION_CONFIG[division];
    }

    // Calculate fee based on division type
    calculateFee(params) {
        switch (this.division) {
            case 'GAMA':
                return this.calculateGamaFee(params);
            case 'CAPT':
                return this.calculateCaptFee(params);
            case 'LBS':
                return this.calculateLbsFee(params);
            case 'OTHERS':
                return this.calculateOthersFee(params);
            default:
                return { total: 0, breakdown: [] };
        }
    }

    calculateGamaFee(params) {
        const { feeType, isNewStudent } = params;
        let breakdown = [];
        let total = 0;

        if (isNewStudent) {
            breakdown.push({
                item: 'Admission Fee',
                amount: this.config.feeStructure.admissionFee
            });
            total += this.config.feeStructure.admissionFee;
        }

        if (feeType === 'Monthly Fee') {
            breakdown.push({
                item: 'Monthly Fee',
                amount: this.config.feeStructure.monthlyFee
            });
            total += this.config.feeStructure.monthlyFee;
        }

        return { total, breakdown, paymentMode: 'monthly' };
    }

    calculateCaptFee(params) {
        const { course, paymentType } = params;
        const courseInfo = this.config.courses[course];
        
        if (!courseInfo) {
            return { total: 0, breakdown: [], error: 'Course not found' };
        }

        let breakdown = [];
        let installmentAmount = 0;

        if (paymentType === 'Full Payment') {
            breakdown.push({
                item: `${course} - Full Course Fee`,
                amount: courseInfo.fee
            });
            return {
                total: courseInfo.fee,
                breakdown,
                paymentMode: 'full',
                duration: courseInfo.duration
            };
        } else {
            installmentAmount = Math.ceil(courseInfo.fee / courseInfo.installments);
            breakdown.push({
                item: `${course} - Installment`,
                amount: installmentAmount,
                totalInstallments: courseInfo.installments
            });
            return {
                total: courseInfo.fee,
                installmentAmount,
                breakdown,
                paymentMode: 'installment',
                duration: courseInfo.duration,
                installments: courseInfo.installments
            };
        }
    }

    calculateLbsFee(params) {
        const { course, feeComponent } = params;
        const courseInfo = this.config.courses[course];
        
        if (!courseInfo) {
            return { total: 0, breakdown: [], error: 'Course not found' };
        }

        let breakdown = [
            { item: 'Admission Fee', amount: courseInfo.admission, component: 'admission' },
            { item: 'Course Fee', amount: courseInfo.course, component: 'course' },
            { item: 'Exam Fee', amount: courseInfo.exam, component: 'exam' }
        ];

        const total = courseInfo.admission + courseInfo.course + courseInfo.exam;

        return {
            total,
            breakdown,
            paymentMode: 'structured',
            duration: courseInfo.duration,
            currentComponent: feeComponent
        };
    }

    calculateOthersFee(params) {
        const { serviceType, customAmount } = params;
        const serviceInfo = this.config.services[serviceType];

        let breakdown = [{
            item: serviceType || 'Service/Product',
            amount: customAmount || 0
        }];

        return {
            total: customAmount || 0,
            breakdown,
            paymentMode: 'instant',
            invoiceRequired: true
        };
    }

    // Get suggested courses for division
    getCourses() {
        if (this.config.courses) {
            return Object.keys(this.config.courses);
        }
        return [];
    }

    // Get fee types for division
    getFeeTypes() {
        return this.config.feeTypes || [];
    }

    // Check if payment is due
    isPaymentDue(studentData) {
        switch (this.division) {
            case 'GAMA':
                return this.checkGamaDue(studentData);
            case 'CAPT':
                return this.checkCaptDue(studentData);
            case 'LBS':
                return this.checkLbsDue(studentData);
            default:
                return false;
        }
    }

    checkGamaDue(studentData) {
        const lastPayment = studentData.lastPaymentDate;
        if (!lastPayment) return true;

        const lastDate = new Date(lastPayment);
        const today = new Date();
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        // Due if more than 30 days since last payment
        return daysDiff > 30;
    }

    checkCaptDue(studentData) {
        const { dueDate, balance } = studentData;
        if (!dueDate || balance <= 0) return false;

        const due = new Date(dueDate);
        const today = new Date();
        return today >= due;
    }

    checkLbsDue(studentData) {
        const { feeComponents, balance } = studentData;
        if (balance <= 0) return false;

        // Check if any component is unpaid and past due date
        const unpaidComponents = feeComponents.filter(c => !c.paid && c.dueDate);
        return unpaidComponents.some(c => new Date(c.dueDate) <= new Date());
    }
}

// ============================================
// EXPORT
// ============================================

export { DIVISION_CONFIG, DivisionFeeCalculator };
