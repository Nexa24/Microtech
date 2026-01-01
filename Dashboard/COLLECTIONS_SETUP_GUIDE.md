# 🗄️ Firebase Collections Setup - Advanced Fee Management

## Overview

This guide explains the Firebase Firestore collections structure for the Advanced Fee Management System.

---

## 📦 Collections List

The system uses **9 Firebase collections**:

### 1. **installmentPlans**
Stores student installment payment schedules.

**Structure**:
```javascript
{
  planId: "PLAN_001",
  studentId: "S123",
  studentName: "John Doe",
  course: "Web Development",
  division: "lbs",
  totalFee: 50000,
  numberOfInstallments: 5,
  interval: "monthly",
  startDate: "2025-02-01",
  installments: [
    {
      installmentNumber: 1,
      amount: 10000,
      dueDate: "2025-02-01",
      status: "paid",
      paidDate: "2025-02-01",
      paidAmount: 10000,
      paymentMode: "upi",
      receiptNo: "RCP001"
    },
    // ... more installments
  ],
  totalPaid: 20000,
  remainingBalance: 30000,
  status: "active",
  createdAt: Timestamp,
  createdBy: "admin",
  lastModified: Timestamp
}
```

---

### 2. **discounts**
Records individual student discounts.

**Structure**:
```javascript
{
  discountId: "DISC_001",
  studentId: "S123",
  studentName: "John Doe",
  discountType: "percentage", // or "flat"
  discountValue: 10,
  discountAmount: 5000,
  category: "early_bird", // early_bird, merit, group, referral, custom
  baseFee: 50000,
  finalFee: 45000,
  reason: "Enrolled within first week",
  appliedDate: "2025-01-15",
  appliedBy: "admin",
  status: "active",
  validUntil: "2025-12-31",
  createdAt: Timestamp
}
```

---

### 3. **scholarships**
Defines scholarship programs with eligibility criteria.

**Structure**:
```javascript
{
  scholarshipId: "SCHOL_001",
  name: "Merit Scholarship 2025",
  type: "merit", // merit, need, sports, arts, other
  discountType: "percentage",
  discountValue: 50,
  eligibilityCriteria: "90% or above in previous exams",
  maxBeneficiaries: 10,
  currentBeneficiaries: 3,
  beneficiaries: ["S123", "S124", "S125"],
  validFrom: "2025-01-01",
  validUntil: "2025-12-31",
  courses: ["Web Development", "Python Programming"],
  divisions: ["lbs", "capt"],
  status: "active",
  createdAt: Timestamp,
  createdBy: "admin"
}
```

---

### 4. **lateFees**
Records calculated late fees for overdue payments.

**Structure**:
```javascript
{
  lateFeeId: "LATE_001",
  studentId: "S123",
  studentName: "John Doe",
  feeId: "FEE_001",
  originalAmount: 10000,
  daysOverdue: 15,
  lateFeeAmount: 500,
  totalAmount: 10500,
  calculationMethod: "tiered", // fixed, percentage, tiered, one_time
  dueDate: "2025-01-15",
  calculatedDate: "2025-01-30",
  status: "pending", // pending, paid, waived
  paidDate: null,
  waivedBy: null,
  waivedReason: null,
  createdAt: Timestamp
}
```

---

### 5. **lateFeeRules**
Division-specific late fee calculation rules.

**Structure**:
```javascript
{
  ruleId: "lbs-default",
  division: "lbs",
  method: "tiered", // fixed, percentage, tiered, one_time
  fixedAmount: null,
  percentageRate: null,
  gracePeriod: 5,
  tiers: [
    { minDays: 1, maxDays: 7, amount: 100 },
    { minDays: 8, maxDays: 15, amount: 200 },
    { minDays: 16, maxDays: 30, amount: 500 },
    { minDays: 31, maxDays: 999, amount: 1000 }
  ],
  status: "active",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Default Rules**:
- **GAMA**: 2% percentage per day after 7-day grace period
- **LBS**: Tiered system (₹100-₹1000) after 5-day grace period
- **CAPT**: Fixed ₹500 after 10-day grace period

---

### 6. **advancePayments**
Tracks prepayments and their usage.

**Structure**:
```javascript
{
  advanceId: "ADV_001",
  studentId: "S123",
  studentName: "John Doe",
  division: "lbs",
  amountPaid: 20000,
  usedAmount: 5000,
  remainingBalance: 15000,
  paymentDate: "2025-01-10",
  paymentMode: "upi",
  receiptNo: "ADV-12345678",
  notes: "Advance for next semester",
  adjustments: [
    {
      date: "2025-01-20",
      amount: 5000,
      description: "Applied to January fee",
      feeId: "FEE_123",
      adjustedBy: "admin"
    }
  ],
  status: "partially_used", // available, partially_used, fully_used
  createdAt: Timestamp,
  createdBy: "admin",
  lastAdjusted: Timestamp
}
```

---

### 7. **feeBreakdowns**
Course fee breakdown templates.

**Structure**:
```javascript
{
  breakdownId: "BRK_001",
  courseId: "COURSE_WD",
  courseName: "Web Development",
  division: "lbs",
  totalFee: 50000,
  admissionFee: 5000,
  courseFee: 30000,
  examFee: 5000,
  materialFee: 3000,
  labFee: 5000,
  certificateFee: 2000,
  otherFees: [
    { name: "Library Fee", amount: 1000, description: "Annual subscription" }
  ],
  createdAt: Timestamp,
  createdBy: "admin",
  lastModified: Timestamp
}
```

---

### 8. **studentFeeBreakdowns**
Applied breakdowns per student.

**Structure**:
```javascript
{
  id: "SFB_001",
  studentId: "S123",
  studentName: "John Doe",
  breakdownId: "BRK_001",
  courseName: "Web Development",
  totalFee: 50000,
  components: {
    admission: {
      amount: 5000,
      paid: 5000,
      pending: 0,
      status: "paid"
    },
    course: {
      amount: 30000,
      paid: 10000,
      pending: 20000,
      status: "partial"
    },
    // ... other components
  },
  totalPaid: 20000,
  totalPending: 30000,
  appliedDate: "2025-01-15",
  appliedBy: "admin",
  createdAt: Timestamp
}
```

---

### 9. **feeCategories**
Custom fee category definitions.

**Structure**:
```javascript
{
  categoryId: "CAT_001",
  name: "Library Fee",
  code: "LIBRARY",
  description: "Annual library subscription and book access",
  defaultAmount: 1500,
  isOptional: true,
  applicableDivisions: ["gama", "lbs", "capt"],
  icon: "fa-book",
  color: "#8B5CF6",
  status: "active",
  createdAt: Timestamp,
  createdBy: "admin"
}
```

**Pre-built Categories** (10):
1. Admission Fee - ₹5,000
2. Exam Fee - ₹2,000
3. Lab Fee - ₹3,000
4. Library Fee - ₹1,500
5. Transport Fee - ₹2,000
6. Uniform Fee - ₹1,000
7. Material Fee - ₹1,500
8. Certificate Fee - ₹500
9. Sports Fee - ₹1,000
10. Event Fee - ₹800

---

## 🚀 Quick Setup

### Step 1: Open Initialization Page
```
Navigate to: initialize-collections.html
```

### Step 2: Initialize Collections
1. Click **"Initialize Collections"** button
2. Wait for confirmation (3-5 seconds)
3. Check status to verify

### Step 3: Verify Setup
- Green badges = Collection exists with data
- Yellow badges = Collection exists but empty
- All collections should show "Exists" status

---

## 📝 Manual Initialization (Alternative)

If you prefer to initialize via console:

```javascript
import { initializeAllCollections } from './js/fee-advanced-collections-setup.js';

// Initialize all collections
await initializeAllCollections();

// Or check status
import { checkCollectionsExist } from './js/fee-advanced-collections-setup.js';
const status = await checkCollectionsExist();
console.log(status);
```

---

## 🔧 Collection Operations

### Reading Data

```javascript
import { db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import COLLECTIONS from './fee-advanced-collections-setup.js';

// Get all installment plans
const plansSnapshot = await getDocs(collection(db, COLLECTIONS.INSTALLMENT_PLANS));
const plans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Get all categories
const categoriesSnapshot = await getDocs(collection(db, COLLECTIONS.FEE_CATEGORIES));
const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Adding Data

```javascript
import { addDoc, collection } from 'firebase/firestore';

// Add a discount
await addDoc(collection(db, COLLECTIONS.DISCOUNTS), {
  studentId: "S123",
  discountType: "percentage",
  discountValue: 10,
  // ... other fields
  createdAt: new Date()
});
```

### Updating Data

```javascript
import { doc, updateDoc } from 'firebase/firestore';

// Update installment status
await updateDoc(doc(db, COLLECTIONS.INSTALLMENT_PLANS, planId), {
  status: "completed",
  lastModified: new Date()
});
```

---

## 🎯 Best Practices

### 1. **Always Use Collection Constants**
```javascript
// ✅ Good
collection(db, COLLECTIONS.INSTALLMENT_PLANS)

// ❌ Bad
collection(db, 'installmentPlans')
```

### 2. **Include Timestamps**
```javascript
{
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 3. **Use Status Fields**
```javascript
status: "active" // active, inactive, completed, cancelled
```

### 4. **Track Who Made Changes**
```javascript
{
  createdBy: "admin",
  modifiedBy: "admin"
}
```

### 5. **Validate Before Writing**
```javascript
if (!studentId || !amount) {
  throw new Error('Required fields missing');
}
```

---

## 📊 Collection Relationships

```
users (students)
    ↓
installmentPlans → tracks student payment schedules
discounts → individual discount records
advancePayments → prepayment tracking
studentFeeBreakdowns → applied course breakdowns
    ↓
fees (main collection) → payment records
    ↓
lateFees → calculated late fees

scholarships → program definitions (many-to-many with students)
feeBreakdowns → course templates (one-to-many with students)
feeCategories → category definitions (used across system)
lateFeeRules → division rules (one-to-one with divisions)
```

---

## 🔍 Querying Examples

### Get Active Installment Plans
```javascript
const q = query(
  collection(db, COLLECTIONS.INSTALLMENT_PLANS),
  where('status', '==', 'active')
);
const snapshot = await getDocs(q);
```

### Get Student's Advance Balance
```javascript
const q = query(
  collection(db, COLLECTIONS.ADVANCE_PAYMENTS),
  where('studentId', '==', studentId),
  where('status', 'in', ['available', 'partially_used'])
);
const snapshot = await getDocs(q);
```

### Get Active Scholarships
```javascript
const q = query(
  collection(db, COLLECTIONS.SCHOLARSHIPS),
  where('status', '==', 'active'),
  where('validUntil', '>=', new Date())
);
const snapshot = await getDocs(q);
```

---

## 🛡️ Security Rules (Firebase Console)

Add these rules to Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Installment Plans
    match /installmentPlans/{planId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Discounts
    match /discounts/{discountId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // All other collections (similar pattern)
    match /{collection}/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🧪 Testing Collections

### Test Data Script
```javascript
// Add test installment plan
await addDoc(collection(db, COLLECTIONS.INSTALLMENT_PLANS), {
  studentId: "TEST_S001",
  studentName: "Test Student",
  course: "Test Course",
  totalFee: 10000,
  numberOfInstallments: 2,
  installments: [
    { installmentNumber: 1, amount: 5000, dueDate: "2025-11-01", status: "pending" },
    { installmentNumber: 2, amount: 5000, dueDate: "2025-12-01", status: "pending" }
  ],
  status: "active",
  createdAt: new Date()
});

console.log('✅ Test data added');
```

---

## 📞 Support

**Issues?**
- Check Firebase Console for collection status
- Verify firebaseConfig is correct
- Ensure user has admin role for write operations
- Check browser console for errors

**Documentation:**
- Main: `ADVANCED_FEE_DOCUMENTATION.md`
- Quick Start: `QUICK_START_GUIDE.md`
- Visual Guide: `VISUAL_GUIDE.md`

---

**Last Updated**: October 15, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
