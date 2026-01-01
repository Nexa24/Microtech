# Advanced Fee Management System - Documentation

## Overview
This advanced fee management system provides comprehensive tools for managing complex fee scenarios including installments, discounts, late fees, advance payments, fee breakdowns, and custom categories.

---

## 1. 📅 Installment Management

### Purpose
Create flexible payment schedules for students who cannot pay the full fee upfront.

### Features
- **Custom Installment Plans**: Define any number of installments per student
- **Automatic Generation**: Auto-generate equal installments with custom intervals
- **Payment Tracking**: Track which installments are paid, partial, or pending
- **Flexible Scheduling**: Set custom due dates for each installment

### Usage Example

```javascript
// Generate 5 equal installments for ₹50,000 course
const installments = installmentManager.generateInstallments(
    50000,           // Total fee
    5,               // Number of installments
    new Date(),      // Start date
    30               // 30 days between each
);

// Create plan for student
await installmentManager.createInstallmentPlan({
    studentId: 'STU001',
    studentName: 'John Doe',
    course: 'Web Development',
    totalFee: 50000,
    numberOfInstallments: 5,
    installments: installments,
    createdBy: 'admin'
});

// Record payment for installment #2
await installmentManager.recordInstallmentPayment(
    'PLAN_ID',
    2,
    {
        paidAmount: 10000,
        paidDate: '2025-02-15',
        receiptNo: 'RCP-001',
        paymentMode: 'UPI'
    }
);
```

### Database Structure
**Collection**: `installmentPlans`

```json
{
    "studentId": "STU001",
    "studentName": "John Doe",
    "course": "Web Development",
    "totalFee": 50000,
    "numberOfInstallments": 5,
    "installments": [
        {
            "installmentNumber": 1,
            "amount": 10000,
            "dueDate": "2025-01-15",
            "status": "paid",
            "paidAmount": 10000,
            "paidDate": "2025-01-10",
            "receiptNo": "RCP-001"
        }
    ],
    "createdAt": "2025-01-01T00:00:00Z",
    "status": "active"
}
```

---

## 2. 💰 Discounts & Scholarships

### Purpose
Apply financial aid, promotional offers, and scholarships to reduce student fees.

### Discount Types
1. **Percentage-based**: e.g., 10% off on total fee
2. **Flat amount**: e.g., ₹5,000 discount

### Discount Categories
- **Early Bird**: Discounts for early enrollment
- **Referral**: Rewards for student referrals
- **Sibling**: Discounts for multiple siblings
- **Merit-based**: Academic performance scholarships
- **Need-based**: Financial assistance
- **Custom**: Any other category

### Usage Example

```javascript
// Apply 10% early bird discount
const discount = await discountManager.applyDiscount({
    studentId: 'STU001',
    studentName: 'Jane Smith',
    type: 'percentage',
    value: 10,
    baseFee: 50000,
    category: 'early-bird',
    reason: 'Enrolled 2 weeks before course start',
    course: 'Digital Marketing',
    appliedBy: 'admin'
});

// Result:
// - Base Fee: ₹50,000
// - Discount: ₹5,000 (10%)
// - Final Fee: ₹45,000

// Create scholarship program
await discountManager.createScholarship({
    name: 'Merit Scholarship 2025',
    type: 'merit',
    discountType: 'percentage',
    discountValue: 25,
    eligibilityCriteria: 'Minimum 80% in previous qualification',
    maxBeneficiaries: 10,
    validFrom: '2025-01-01',
    validUntil: '2025-12-31',
    courses: ['Web Development', 'Data Science']
});
```

### Database Structure
**Collection**: `discounts`

```json
{
    "studentId": "STU001",
    "studentName": "Jane Smith",
    "discountType": "percentage",
    "discountCategory": "early-bird",
    "discountValue": 10,
    "discountAmount": 5000,
    "baseFee": 50000,
    "finalFee": 45000,
    "reason": "Enrolled 2 weeks early",
    "appliedDate": "2025-01-15T00:00:00Z",
    "status": "active"
}
```

**Collection**: `scholarships`

```json
{
    "name": "Merit Scholarship 2025",
    "type": "merit",
    "discountType": "percentage",
    "discountValue": 25,
    "eligibilityCriteria": "Min 80% marks",
    "maxBeneficiaries": 10,
    "currentBeneficiaries": 3,
    "validFrom": "2025-01-01",
    "validUntil": "2025-12-31",
    "courses": ["Web Development"],
    "status": "active"
}
```

---

## 3. ⚠️ Late Fee System

### Purpose
Automatically calculate and apply penalties for delayed payments.

### Calculation Methods

#### 1. Fixed Per Day
**₹X per day late**
```javascript
// Example: ₹10 per day, max ₹500
{
    type: 'fixed-per-day',
    amountPerDay: 10,
    maxLateFee: 500
}
// 15 days late: ₹150 late fee
// 60 days late: ₹500 late fee (capped)
```

#### 2. Percentage Per Day
**X% of fee per day**
```javascript
// Example: 0.5% per day, max ₹1,500
{
    type: 'percentage-per-day',
    percentagePerDay: 0.5,
    maxLateFee: 1500
}
// ₹10,000 fee, 10 days late: ₹500 (0.5% × 10 × 10,000)
```

#### 3. Tiered System
**Different rates for different periods**
```javascript
{
    type: 'tiered',
    tier1: 10,    // 0-7 days: ₹10/day
    tier2: 20,    // 8-30 days: ₹20/day
    tier3: 50,    // >30 days: ₹50/day
    maxLateFee: 2000
}
// 45 days late:
// - Days 1-7: 7 × ₹10 = ₹70
// - Days 8-30: 23 × ₹20 = ₹460
// - Days 31-45: 15 × ₹50 = ₹750
// Total: ₹1,280
```

#### 4. Fixed One-Time
**Single penalty regardless of days**
```javascript
{
    type: 'fixed-one-time',
    fixedAmount: 100
}
// Any delay: ₹100 late fee
```

### Usage Example

```javascript
// Calculate late fee
const result = lateFeeCalculator.calculateLateFee(
    {
        amount: 10000,
        dueDate: '2025-01-01'
    },
    {
        type: 'tiered',
        tier1: 10,
        tier2: 20,
        tier3: 50,
        maxLateFee: 2000
    }
);

// Record late fee
await lateFeeCalculator.recordLateFee({
    studentId: 'STU001',
    studentName: 'Mike Johnson',
    originalFee: 10000,
    dueDate: '2025-01-01',
    paidDate: '2025-02-15',
    daysLate: result.daysLate,
    lateFeeAmount: result.lateFeeAmount,
    totalAmount: result.totalAmount,
    receiptNo: 'RCP-002'
});
```

### Division-Specific Rules

**Recommended Settings:**

| Division | Method | Configuration |
|----------|--------|---------------|
| **Gama Abacus** | Fixed Per Day | ₹10/day, max ₹500 |
| **LBS Skill Centre** | Tiered | ₹15/₹30/₹50, max ₹2,000 |
| **CAPT** | Percentage | 0.5%/day, max ₹1,500 |

---

## 4. 💸 Advance Payment Support

### Purpose
Record prepayments and adjust them against future dues.

### Features
- **Record Advance**: Store prepayments with receipt tracking
- **Adjust Against Dues**: Apply advance to specific fee records
- **Balance Tracking**: Monitor remaining advance balance
- **Adjustment History**: Complete audit trail

### Usage Example

```javascript
// Record ₹20,000 advance payment
const advanceId = await advanceManager.recordAdvancePayment({
    studentId: 'STU001',
    studentName: 'Sarah Williams',
    amount: 20000,
    paymentDate: '2025-01-10',
    paymentMode: 'Bank Transfer',
    receiptNo: 'ADV-001',
    notes: 'Full course fee paid in advance',
    createdBy: 'admin'
});

// Adjust ₹5,000 against January fee
await advanceManager.adjustAdvancePayment(advanceId, {
    amount: 5000,
    adjustedAgainst: 'FEE_RECORD_ID',
    description: 'January 2025 monthly fee'
});

// Check remaining balance
const balance = await advanceManager.getAvailableAdvanceBalance('STU001');
// Returns: ₹15,000
```

### Database Structure
**Collection**: `advancePayments`

```json
{
    "studentId": "STU001",
    "studentName": "Sarah Williams",
    "amount": 20000,
    "paymentDate": "2025-01-10",
    "paymentMode": "Bank Transfer",
    "receiptNo": "ADV-001",
    "remainingBalance": 15000,
    "usedAmount": 5000,
    "status": "available",
    "adjustments": [
        {
            "adjustmentId": "ADJ-1234567890",
            "amount": 5000,
            "adjustedAgainst": "FEE_RECORD_ID",
            "adjustedDate": "2025-01-15",
            "description": "January monthly fee"
        }
    ],
    "createdAt": "2025-01-10T00:00:00Z"
}
```

---

## 5. 📋 Fee Breakdown per Course

### Purpose
Split course fees into specific components for transparent billing.

### Standard Components
1. **Admission Fee**: One-time enrollment charge
2. **Course Fee**: Main tuition fee
3. **Exam Fee**: Assessment and examination charges
4. **Material Fee**: Books, notes, and study materials
5. **Lab Fee**: Laboratory usage (for technical courses)
6. **Certificate Fee**: Certification and documentation

### Usage Example

```javascript
// Create fee breakdown for Web Development course
await breakdownManager.createFeeBreakdown({
    courseId: 'COURSE_001',
    courseName: 'Full Stack Web Development',
    division: 'lbs',
    totalFee: 50000,
    admissionFee: 5000,
    courseFee: 35000,
    examFee: 3000,
    materialFee: 5000,
    labFee: 0,
    certificateFee: 2000,
    otherFees: []
});

// Apply breakdown to student
await breakdownManager.applyBreakdownToStudent(
    'STU001',
    'BREAKDOWN_ID'
);
```

### Sample Breakdowns

**LBS - Web Development (₹50,000)**
- Admission Fee: ₹5,000
- Course Fee: ₹35,000
- Exam Fee: ₹3,000
- Material Fee: ₹5,000
- Certificate Fee: ₹2,000

**CAPT - Business Skills (₹30,000)**
- Admission Fee: ₹3,000
- Course Fee: ₹22,000
- Exam Fee: ₹2,000
- Material Fee: ₹2,000
- Certificate Fee: ₹1,000

**Gama - Abacus Basic (Pay-as-you-go)**
- Per Session: ₹200
- Books: ₹500 (one-time)
- No fixed total

---

## 6. 🏷️ Fee Category Manager

### Purpose
Define custom fee types beyond standard categories for organizational flexibility.

### Predefined Templates

| Category | Description | Typical Amount |
|----------|-------------|----------------|
| **Uniform Fee** | Student uniform | ₹2,000 |
| **Lab Fee** | Laboratory usage | ₹5,000 |
| **Library Fee** | Library access | ₹1,000 |
| **Transport Fee** | Bus service | ₹3,000/month |
| **Sports Fee** | Sports facilities | ₹1,500 |
| **Hostel Fee** | Accommodation | ₹8,000/month |
| **Internet Fee** | Wi-Fi access | ₹500 |
| **ID Card Fee** | Student ID | ₹200 |
| **Event Fee** | Special events | Varies |
| **Practical Fee** | Hands-on training | ₹4,000 |

### Usage Example

```javascript
// Create custom category
await categoryManager.createCategory({
    name: 'Equipment Rental',
    code: 'EQUIPMENT_RENTAL',
    description: 'Monthly equipment rental fee',
    defaultAmount: 1500,
    isOptional: true,
    applicableDivisions: ['lbs', 'capt'],
    applicableCourses: ['Photography', 'Video Editing'],
    icon: 'fa-camera',
    color: '#8b5cf6'
});

// Get categories for LBS division
const lbsCategories = await categoryManager.getCategories('lbs');

// Add from template
await categoryManager.createCategory({
    ...categoryManager.getCategoryTemplates()[0], // Uniform Fee
    applicableDivisions: ['all'],
    defaultAmount: 2500
});
```

---

## Integration with Main Fee System

### Workflow Example: Complete Fee Collection

```javascript
// 1. Student enrolls in course
const student = { id: 'STU001', name: 'Alex Brown', division: 'lbs' };
const course = { id: 'COURSE_001', totalFee: 50000 };

// 2. Apply breakdown
const breakdown = await breakdownManager.getCourseBreakdown(course.id);

// 3. Apply discount (if eligible)
const discount = await discountManager.applyDiscount({
    studentId: student.id,
    studentName: student.name,
    type: 'percentage',
    value: 10,
    baseFee: course.totalFee,
    category: 'early-bird'
});
// Final fee: ₹45,000

// 4. Create installment plan
const installments = installmentManager.generateInstallments(
    discount.finalFee,
    5,
    new Date(),
    30
);

await installmentManager.createInstallmentPlan({
    studentId: student.id,
    studentName: student.name,
    course: course.name,
    totalFee: discount.finalFee,
    numberOfInstallments: 5,
    installments: installments
});

// 5. Record advance payment (if any)
await advanceManager.recordAdvancePayment({
    studentId: student.id,
    studentName: student.name,
    amount: 15000,
    paymentDate: '2025-01-15',
    paymentMode: 'UPI',
    receiptNo: 'ADV-001'
});

// 6. Adjust advance against first installment
await advanceManager.adjustAdvancePayment('ADVANCE_ID', {
    amount: 9000,
    adjustedAgainst: 'INSTALLMENT_1',
    description: 'First installment'
});

// 7. Calculate late fee (if payment delayed)
const lateFee = lateFeeCalculator.calculateLateFee(
    { amount: 9000, dueDate: '2025-02-15' },
    lateFeeCalculator.getDefaultRules('lbs')
);
```

---

## API Reference

### Quick Reference

```javascript
// Installments
await installmentManager.createInstallmentPlan(plan)
await installmentManager.recordInstallmentPayment(planId, number, payment)
await installmentManager.getStudentInstallments(studentId)

// Discounts
await discountManager.applyDiscount(discount)
await discountManager.createScholarship(scholarship)
await discountManager.getStudentDiscounts(studentId)

// Late Fees
lateFeeCalculator.calculateLateFee(feeDetails, rules)
await lateFeeCalculator.recordLateFee(lateFeeData)
lateFeeCalculator.getDefaultRules(division)

// Advance Payments
await advanceManager.recordAdvancePayment(payment)
await advanceManager.adjustAdvancePayment(advanceId, adjustment)
await advanceManager.getAvailableAdvanceBalance(studentId)

// Fee Breakdown
await breakdownManager.createFeeBreakdown(breakdown)
await breakdownManager.getCourseBreakdown(courseId)
await breakdownManager.applyBreakdownToStudent(studentId, breakdownId)

// Categories
await categoryManager.createCategory(category)
await categoryManager.getCategories(division)
await categoryManager.updateCategory(categoryId, updates)
categoryManager.getCategoryTemplates()
```

---

## Best Practices

1. **Always validate amounts** before recording payments
2. **Keep audit trails** of all fee adjustments
3. **Set appropriate late fee caps** to avoid excessive penalties
4. **Document discount reasons** for transparency
5. **Reconcile advance balances** regularly
6. **Review installment plans** monthly for defaults
7. **Update fee breakdowns** when course fees change
8. **Archive old categories** instead of deleting

---

## Support & Troubleshooting

### Common Issues

**Q: Advance payment not adjusting?**
A: Check if `remainingBalance >= adjustmentAmount`

**Q: Late fee seems incorrect?**
A: Verify the calculation method and max cap settings

**Q: Installment not saving?**
A: Ensure all required fields are provided and installment amounts sum to total

**Q: Discount not applying?**
A: Check if student is eligible and discount is still active

---

## Version History

- **v1.0.0** (2025-10-15): Initial release with all 6 features
  - Installment Management
  - Discounts & Scholarships
  - Late Fee System
  - Advance Payment Support
  - Fee Breakdown per Course
  - Fee Category Manager

---

**Developed for MicroTech Admin Panel**
*Complete Fee Management Solution*
