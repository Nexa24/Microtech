# 📚 Advanced Fee Management System - Complete Documentation

## 🎯 Overview

The Advanced Fee Management System provides 6 powerful features to manage complex fee scenarios at Micro Tech Center.

---

## ✨ Features

### 1. **Installment Plans** 💳
Split course fees into multiple scheduled payments.

**Use Cases:**
- Allow students to pay in monthly installments
- Set custom payment schedules
- Track payment progress
- Send automated reminders

**How to Use:**
1. Click "Installment Plans" card
2. Click "Create Plan"
3. Fill in student details, total fee, number of installments
4. Click "Preview Schedule" to see payment dates
5. Click "Create Plan" to save

**Functions:**
- `createInstallmentPlan()` - Create new plan
- `generateInstallments()` - Auto-generate schedule
- `recordInstallmentPayment()` - Record payment
- `getStudentInstallments()` - View all plans for a student

---

### 2. **Discounts & Scholarships** 🎁
Apply discounts and manage scholarship programs.

**Discount Types:**
- **Percentage Discount** - e.g., 10% off
- **Flat Amount** - e.g., ₹5000 off

**Categories:**
- Early Bird - For early enrollments
- Referral - Student referral discounts
- Sibling - Family member discounts
- Scholarship - Merit/need-based
- Custom - Any other discount

**How to Apply Discount:**
1. Click "Discounts & Scholarships" card
2. Click "Apply Discount"
3. Select student and enter discount details
4. See live preview of final fee
5. Click "Apply Discount"

**How to Create Scholarship:**
1. Click "Create Scholarship"
2. Enter scholarship details and criteria
3. Set validity period
4. Set max beneficiaries (optional)
5. Click "Create Scholarship"

**Functions:**
- `applyDiscount()` - Apply discount to student
- `createScholarship()` - Create scholarship program
- `getStudentDiscounts()` - View all discounts for student

---

### 3. **Late Fee System** ⏰
Automatically calculate penalties for late payments.

**Rule Types:**
- **Fixed Per Day** - ₹X per day late
- **Percentage Per Day** - Y% per day late
- **Tiered System** - Different rates for different periods
- **Fixed One-Time** - Single penalty amount

**Configuration:**
1. Click "Late Fee System" card
2. Select rule type for each division (Gama, LBS, CAPT)
3. Enter penalty amounts
4. Set maximum cap
5. Click "Save Rules"

**Calculator:**
- Enter fee amount and due date
- Get instant calculation of late fee
- See breakdown of calculation method

**Functions:**
- `calculateLateFee()` - Calculate penalty
- `recordLateFee()` - Record late fee applied
- `getDefaultRules()` - Get division-specific rules

---

### 4. **Advance Payments** 💰
Track prepayments and adjust against future dues.

**Use Cases:**
- Student pays full year in advance
- Partial advance for upcoming fees
- Refundable deposits
- Credit balance management

**How to Record:**
1. Click "Advance Payments" card
2. Click "Record Advance"
3. Enter student details and amount
4. Select payment mode
5. Click "Record Payment"

**How to Adjust:**
1. Find advance payment in table
2. Click "Adjust" button
3. Enter adjustment amount
4. Describe what it's for
5. Click "Apply Adjustment"

**Functions:**
- `recordAdvancePayment()` - Record new advance
- `adjustAdvancePayment()` - Use advance for payment
- `getStudentAdvancePayments()` - View balance
- `getAvailableAdvanceBalance()` - Check available amount

---

### 5. **Fee Breakdown** 📊
Split course fees into detailed components.

**Components:**
- Admission Fee
- Course Fee
- Exam Fee
- Material Fee
- Lab Fee
- Certificate Fee
- Custom Categories

**How to Create:**
1. Click "Fee Breakdown" card
2. Click "Create Breakdown"
3. Select course and division
4. Enter amount for each component
5. See auto-calculated total
6. Click "Create Breakdown"

**Functions:**
- `createFeeBreakdown()` - Create new breakdown
- `getCourseBreakdown()` - Get breakdown for course
- `applyBreakdownToStudent()` - Apply to student
- `calculateTotalFromComponents()` - Sum components

---

### 6. **Fee Categories** 🏷️
Define custom fee types beyond standard categories.

**Built-in Templates:**
- Uniform Fee
- Lab Fee
- Library Fee
- Transport Fee
- Sports Fee
- Hostel Fee
- Internet Fee
- ID Card Fee
- Event Fee
- Practical Fee

**How to Add:**
1. Click "Fee Categories" card
2. Click "Add Category" or use template
3. Enter category details
4. Set default amount
5. Choose applicable divisions
6. Click "Add Category"

**Functions:**
- `createCategory()` - Create new category
- `getCategories()` - List all categories
- `updateCategory()` - Modify existing
- `deleteCategory()` - Remove category

---

## 🛠️ Utility Functions

### **Validators** ✓
```javascript
Validators.isValidEmail(email)
Validators.isValidPhone(phone)
Validators.isValidAmount(amount)
Validators.isValidDate(date)
Validators.validateInstallmentPlan(plan)
Validators.validateDiscount(discount)
```

### **Formatters** 🎨
```javascript
Formatters.currency(amount)        // ₹10,000
Formatters.date(date, 'short')     // 15 Jan 2025
Formatters.percentage(value)       // 10.50%
Formatters.phone(phone)            // +91 98765 43210
```

### **Calculators** 🧮
```javascript
Calculators.installmentTotal(installments)
Calculators.installmentPaid(installments)
Calculators.installmentRemaining(installments)
Calculators.nextDueInstallment(installments)
Calculators.overdueInstallments(installments)
Calculators.discountAmount(baseFee, type, value)
```

### **Reports** 📈
```javascript
await Reports.generateInstallmentReport(division)
await Reports.generateDiscountReport(startDate, endDate)
await Reports.generateLateFeeReport(month, year)
```

### **Exporters** 📥
```javascript
Exporters.exportToCSV(data, filename, columns)
Exporters.exportInstallmentPlans(plans)
Exporters.exportDiscounts(discounts)
Exporters.printReceipt(payment)
```

### **Filters** 🔍
```javascript
Filters.searchStudents(students, searchTerm)
Filters.filterByDateRange(items, field, start, end)
Filters.filterByStatus(items, status)
Filters.filterByDivision(items, division)
```

---

## 🔥 Firebase Collections

### **installmentPlans**
```javascript
{
  studentId: string,
  studentName: string,
  course: string,
  totalFee: number,
  numberOfInstallments: number,
  installments: [
    {
      installmentNumber: number,
      amount: number,
      dueDate: string,
      status: 'pending' | 'paid' | 'partial',
      paidAmount: number,
      paidDate: string,
      receiptNo: string
    }
  ],
  createdAt: Timestamp,
  status: 'active' | 'completed'
}
```

### **discounts**
```javascript
{
  studentId: string,
  studentName: string,
  discountType: 'percentage' | 'flat',
  discountCategory: string,
  discountValue: number,
  discountAmount: number,
  baseFee: number,
  finalFee: number,
  reason: string,
  appliedBy: string,
  appliedDate: Timestamp,
  course: string,
  status: 'active' | 'expired'
}
```

### **scholarships**
```javascript
{
  name: string,
  type: 'merit' | 'need-based' | 'sports' | 'special',
  discountType: 'percentage' | 'flat',
  discountValue: number,
  eligibilityCriteria: string,
  maxBeneficiaries: number,
  currentBeneficiaries: number,
  validFrom: string,
  validUntil: string,
  courses: [string],
  status: 'active' | 'inactive',
  createdAt: Timestamp
}
```

### **lateFees**
```javascript
{
  studentId: string,
  studentName: string,
  originalFee: number,
  dueDate: string,
  paidDate: string,
  daysLate: number,
  lateFeeAmount: number,
  totalAmount: number,
  receiptNo: string,
  status: 'applied',
  createdAt: Timestamp
}
```

### **advancePayments**
```javascript
{
  studentId: string,
  studentName: string,
  amount: number,
  paymentDate: string,
  paymentMode: string,
  receiptNo: string,
  remainingBalance: number,
  usedAmount: number,
  status: 'available' | 'fully-used',
  adjustments: [
    {
      adjustmentId: string,
      amount: number,
      adjustedAgainst: string,
      adjustedDate: string,
      description: string
    }
  ],
  notes: string,
  createdAt: Timestamp
}
```

### **feeBreakdowns**
```javascript
{
  courseId: string,
  courseName: string,
  division: string,
  totalFee: number,
  components: {
    admissionFee: number,
    courseFee: number,
    examFee: number,
    materialFee: number,
    labFee: number,
    certificateFee: number
  },
  customCategories: [object],
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **feeCategories**
```javascript
{
  name: string,
  code: string,
  description: string,
  defaultAmount: number,
  isOptional: boolean,
  applicableDivisions: [string],
  applicableCourses: [string],
  isActive: boolean,
  displayOrder: number,
  icon: string,
  color: string,
  createdAt: Timestamp
}
```

---

## 🚀 Quick Start

### **1. Initialize System**
```bash
# Open setup page
open setup-fee-advanced.html

# Click "Initialize System" button
# Wait for collections to be created
```

### **2. Configure Late Fee Rules**
```javascript
// Open fee-advanced.html
// Click "Late Fee System"
// Set rules for each division
// Click "Save Rules"
```

### **3. Create First Installment Plan**
```javascript
// Click "Installment Plans"
// Click "Create Plan"
// Fill details and click "Create"
```

### **4. Start Using!**
- Apply discounts to students
- Record advance payments
- Create fee breakdowns for courses
- Track late fees automatically

---

## 📊 Reports & Analytics

### **Generate Reports**
```javascript
// Installment Summary
const report = await Reports.generateInstallmentReport('lbs');
console.log(report.summary);

// Discount Report
const discounts = await Reports.generateDiscountReport('2025-01-01', '2025-12-31');
console.log('Total Discounts:', discounts.summary.totalDiscountAmount);

// Late Fee Report
const lateFees = await Reports.generateLateFeeReport(10, 2025);
console.log('Average Days Late:', lateFees.summary.averageDaysLate);
```

### **Export Data**
```javascript
// Export to CSV
Exporters.exportInstallmentPlans(plans);
Exporters.exportDiscounts(discounts);

// Print Receipt
Exporters.printReceipt(payment);
```

---

## 🔐 Security & Permissions

### **Firestore Rules Required**
```javascript
match /installmentPlans/{plan} {
  allow read: if request.auth != null;
  allow write: if isAdminOrCounselor();
}

match /discounts/{discount} {
  allow read: if request.auth != null;
  allow write: if isAdminOrCounselor();
}

// Similar rules for all collections
```

---

## 🎓 Best Practices

1. **Always validate input** before creating records
2. **Use formatters** for consistent display
3. **Generate reports regularly** for insights
4. **Export data** for backups
5. **Set appropriate late fee rules** per division
6. **Document custom categories** clearly
7. **Review advance payments** monthly
8. **Archive old installment plans** annually

---

## 🆘 Troubleshooting

### **Data Not Saving?**
- Check Firebase rules
- Verify internet connection
- Check browser console for errors
- Ensure authentication is working

### **Functions Not Working?**
- Open browser console (F12)
- Check for import errors
- Verify Firebase version (10.8.0)
- Clear cache and reload

### **Reports Empty?**
- Ensure data exists in collections
- Check date filters
- Verify division filters
- Check status filters

---

## 📞 Support

**Files:**
- `fee-advanced-features.js` - Core managers
- `fee-advanced-ui.js` - UI controllers
- `fee-advanced-utils.js` - Utilities
- `fee-advanced-modals.js` - Modal dialogs
- `fee-advanced.html` - Main interface

**Setup:**
- `setup-fee-advanced.html` - One-click setup
- `test-firebase-write.html` - Test Firebase
- `fix-firebase-rules.html` - Rules guide

**Documentation:**
- This file - Complete guide
- Inline comments in code
- Firebase console logs

---

**Version:** 1.0.0  
**Last Updated:** October 18, 2025  
**System:** Micro Tech Center Advanced Fee Management
