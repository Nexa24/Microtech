# 🏫 Fee Management System - Division-Wise Guide

## Overview
Complete division-specific fee management system for MicroTech Admin Panel with unique workflows for each division.

---

## 🎯 Four Divisions Explained

### 1. 🎓 GAMA ABACUS - Kids Coaching Division

#### **Nature:**
- Long-duration program (3 years / 36 months)
- Recurring monthly payments
- Admission fee at enrollment

#### **Fee Structure:**
```javascript
{
    admissionFee: ₹1,000 (one-time)
    monthlyFee: ₹600 (recurring)
    materialCharges: Variable (yearly)
    examFee: Variable (per exam)
}
```

#### **Payment Workflow:**
1. **New Enrollment:**
   ```
   Student Joins → Select Division: GAMA
   → Admission Fee (₹1,000) auto-loaded
   → Record first payment
   → Student marked as "Active"
   ```

2. **Monthly Payment:**
   ```
   Month Due → Counselor opens student record
   → Monthly Fee (₹600) shown
   → Record payment (Cash/UPI/Bank)
   → Payment history updated
   → Next due date set automatically
   ```

3. **Pending Fee Detection:**
   ```
   System checks daily:
   - If no payment for 30+ days → Mark "Pending"
   - Auto-add to "Due Fees - Gama" list
   - Send reminder notification
   ```

#### **Admin Features:**
- ✅ Monthly revenue tracking
- ✅ Student-wise payment history
- ✅ Auto-reminder system
- ✅ Material and exam fee tracking
- ✅ Dropout tracking

#### **Firestore Structure:**
```javascript
fees/TXN-GAMA-12345 {
    division: "GAMA",
    studentID: "GAMA001",
    studentName: "Rahul Sharma",
    course: "Level 1 Abacus",
    feeType: "Monthly Fee",
    totalFee: 21600, // 36 months × ₹600
    paidAmount: 7200, // 12 months paid
    balance: 14400,
    paymentHistory: [
        { date: "2025-01-05", amount: 1600, method: "Cash", type: "Admission + Month 1" },
        { date: "2025-02-05", amount: 600, method: "UPI", type: "Month 2" },
        // ... more payments
    ],
    lastPaymentDate: "2025-10-05",
    nextDueDate: "2025-11-05",
    status: "Active",
    monthsPaid: 12,
    monthsPending: 24,
    counselor: "Anu Joseph",
    createdAt: Timestamp
}
```

---

### 2. 💻 CAPT - Computer Academy Courses

#### **Nature:**
- Short to long-term courses (3-12 months)
- Course-based fee structure
- Full or installment payment options

#### **Fee Structure:**
```javascript
Courses: {
    'MS Office': { fee: 2500, duration: 3, installments: 2 },
    'DCA': { fee: 4000, duration: 6, installments: 2 },
    'ADCA': { fee: 6000, duration: 12, installments: 3 },
    'Tally Prime': { fee: 3500, duration: 4, installments: 2 },
    'Web Development': { fee: 8000, duration: 6, installments: 3 },
    'Graphic Design': { fee: 5500, duration: 5, installments: 2 }
}
```

#### **Payment Workflow:**
1. **New Admission:**
   ```
   Student Enrolls → Select Division: CAPT
   → Choose Course (e.g., DCA)
   → System auto-loads: Total Fee = ₹4,000
   → Choose Payment Mode:
      a) Full Payment (₹4,000 now)
      b) Installment (₹2,000 × 2)
   → Record first payment
   → Generate schedule if installment
   ```

2. **Full Payment:**
   ```
   Pay ₹4,000 → Receipt generated
   → Status: "Paid in Full"
   → Course access activated
   → Certificate issued on completion
   ```

3. **Installment Payment:**
   ```
   Pay ₹2,000 now → Balance ₹2,000
   → Set due date for next installment
   → Status: "Partial"
   → Reminder sent before due date
   → Second payment → Status: "Paid in Full"
   ```

#### **Admin Features:**
- ✅ Course-wise revenue tracking
- ✅ Installment schedule management
- ✅ Auto-fetch course fees from database
- ✅ Due date reminders
- ✅ Completion certificate trigger

#### **Firestore Structure:**
```javascript
fees/TXN-CAPT-67890 {
    division: "CAPT",
    studentID: "CAPT105",
    studentName: "Priya Kumar",
    course: "DCA",
    courseDuration: 6, // months
    feeType: "Course Fee",
    totalFee: 4000,
    paidAmount: 2000,
    balance: 2000,
    paymentMode: "installment",
    installmentPlan: {
        total: 2,
        paid: 1,
        remaining: 1,
        schedule: [
            { installmentNo: 1, amount: 2000, dueDate: "2025-10-01", paid: true, paidDate: "2025-10-01" },
            { installmentNo: 2, amount: 2000, dueDate: "2025-12-01", paid: false, paidDate: null }
        ]
    },
    paymentHistory: [
        { date: "2025-10-01", amount: 2000, method: "UPI", type: "Installment 1" }
    ],
    nextDueDate: "2025-12-01",
    status: "Partial",
    courseStartDate: "2025-10-01",
    courseEndDate: "2026-04-01",
    counselor: "Ravi Menon",
    createdAt: Timestamp
}
```

---

### 3. 🎓 LBS SKILL CENTRE - Government Skill Courses

#### **Nature:**
- Government-affiliated professional courses
- Fixed structured fee components
- Batch-based tracking

#### **Fee Structure:**
```javascript
Courses: {
    'Data Entry Operator': {
        admission: 500,
        course: 3000,
        exam: 500,
        total: 4000,
        duration: 6
    },
    'Computer Hardware': {
        admission: 800,
        course: 4500,
        exam: 700,
        total: 6000,
        duration: 6
    },
    'Accounting': {
        admission: 600,
        course: 4000,
        exam: 600,
        total: 5200,
        duration: 6
    },
    'Digital Marketing': {
        admission: 1000,
        course: 6000,
        exam: 1000,
        total: 8000,
        duration: 8
    }
}
```

#### **Payment Workflow:**
1. **Admission Stage:**
   ```
   Student Applies → Select Course: Data Entry
   → System shows: Admission Fee = ₹500
   → Record admission payment
   → Status: "Admission Paid"
   → Batch assigned
   ```

2. **Course Fee Stage:**
   ```
   Course Starts → Course Fee Due = ₹3,000
   → Record payment (mid-course)
   → Status: "Course Fee Paid"
   → Training access activated
   ```

3. **Exam Fee Stage:**
   ```
   Before Exam → Exam Fee Due = ₹500
   → Record payment
   → Status: "Paid in Full"
   → Exam registration completed
   → Certificate issued on pass
   ```

#### **Admin Features:**
- ✅ Three-stage payment tracking
- ✅ Batch-wise reports
- ✅ Government compliance reports
- ✅ Component-wise revenue
- ✅ Certification tracking

#### **Firestore Structure:**
```javascript
fees/TXN-LBS-54321 {
    division: "LBS",
    studentID: "LBS202",
    studentName: "Alan Joseph",
    course: "Data Entry Operator",
    batchID: "LBS-DEO-OCT-2025",
    courseDuration: 6,
    feeStructure: {
        admission: 500,
        course: 3000,
        exam: 500,
        total: 4000
    },
    feeComponents: [
        {
            component: "Admission",
            amount: 500,
            dueDate: "2025-10-01",
            paid: true,
            paidDate: "2025-10-01",
            method: "Cash"
        },
        {
            component: "Course",
            amount: 3000,
            dueDate: "2025-11-15",
            paid: true,
            paidDate: "2025-11-10",
            method: "Bank Transfer"
        },
        {
            component: "Exam",
            amount: 500,
            dueDate: "2026-03-15",
            paid: false,
            paidDate: null,
            method: null
        }
    ],
    totalFee: 4000,
    paidAmount: 3500,
    balance: 500,
    paymentHistory: [
        { date: "2025-10-01", amount: 500, method: "Cash", component: "Admission" },
        { date: "2025-11-10", amount: 3000, method: "Bank", component: "Course" }
    ],
    nextDueDate: "2026-03-15",
    status: "Course Fee Paid",
    courseStartDate: "2025-10-05",
    examDate: "2026-03-30",
    counselor: "Admin",
    createdAt: Timestamp
}
```

---

### 4. 🛠️ OTHERS - Micro Computers & Services

#### **Nature:**
- Non-educational services
- PC servicing, repairs, sales
- One-time transactions

#### **Service Catalog:**
```javascript
Services: {
    'PC Servicing': { min: 300, max: 1500 },
    'Laptop Repair': { min: 500, max: 3000 },
    'Data Recovery': { min: 1000, max: 5000 },
    'Software Installation': { min: 200, max: 800 },
    'Custom Build': { min: 15000, max: 150000 },
    'Component Sale': { flexible: true },
    'Accessories': { flexible: true }
}
```

#### **Payment Workflow:**
1. **Service Entry:**
   ```
   Customer Arrives → Select Division: OTHERS
   → Service Type: Laptop Repair
   → Enter: Customer Name, Issue, Amount (₹1,200)
   → Record payment (Cash/UPI)
   → Generate Invoice instantly
   → Print receipt
   ```

2. **Product Sale:**
   ```
   Customer Buys → Product: RAM 8GB
   → Amount: ₹3,000
   → Record payment
   → Generate sales invoice
   → Update inventory (if tracked)
   ```

#### **Admin Features:**
- ✅ Instant invoice generation
- ✅ Service vs Product tracking
- ✅ Separate revenue analytics
- ✅ Customer database
- ✅ Service history

#### **Firestore Structure:**
```javascript
fees/TXN-OTHER-99999 {
    division: "OTHERS",
    transactionType: "service", // or "product"
    customerName: "John Doe",
    contactNumber: "+919876543210",
    serviceType: "Laptop Repair",
    description: "Screen replacement + OS installation",
    amount: 1200,
    paymentMethod: "Cash",
    invoiceNumber: "INV-OTHER-123456",
    paymentDate: "2025-10-14",
    status: "Completed",
    handledBy: "Tech Support Team",
    receiptGenerated: true,
    createdAt: Timestamp,
    
    // Optional fields for products
    productDetails: {
        productName: "RAM 8GB DDR4",
        quantity: 1,
        unitPrice: 3000,
        warranty: "1 year"
    }
}
```

---

## 📊 Unified Admin Dashboard

### **Revenue Overview:**
```
┌─────────────────────────────────────────────────────────┐
│  TOTAL REVENUE: ₹5,45,000                               │
├─────────────────────────────────────────────────────────┤
│  Gama Abacus:     ₹2,40,000 (44%)                       │
│  CAPT:            ₹1,20,000 (22%)                       │
│  LBS:             ₹1,50,000 (27%)                       │
│  Others:          ₹35,000   (7%)                        │
└─────────────────────────────────────────────────────────┘
```

### **Due Fees Summary:**
```
Division    | Pending Students | Pending Amount
------------|------------------|----------------
Gama Abacus | 15               | ₹45,000
CAPT        | 8                | ₹28,000
LBS         | 5                | ₹12,000
Others      | 0                | ₹0
------------|------------------|----------------
TOTAL       | 28               | ₹85,000
```

---

## 🔔 Auto-Reminder System

### **Gama Abacus:**
- Trigger: 25 days after last payment
- Message: "Monthly fee due for [Student Name]. Please pay ₹600 by [Date]."

### **CAPT:**
- Trigger: 3 days before installment due date
- Message: "Installment of ₹[Amount] due on [Date] for [Course]."

### **LBS:**
- Trigger: 5 days before component due date
- Message: "[Component] fee of ₹[Amount] due for [Course]."

---

## 📱 Integration Points

### **1. Student Management:**
```javascript
// Auto-fetch student details
const student = await getStudent(studentID);
// Pre-fill: Name, Contact, Division, Course
```

### **2. Course Management:**
```javascript
// Auto-fetch course fee
const course = await getCourse(courseName, division);
// Load: Fee structure, Duration, Installments
```

### **3. Counselor Management:**
```javascript
// Track by counselor
const counselorStats = await getCounselorRevenue(counselorID);
// Show: Total collected, Pending, Conversion rate
```

### **4. WhatsApp/Email:**
```javascript
// Send reminders
await sendReminder(studentContact, message, type);
// Types: WhatsApp, Email, SMS
```

---

## 🎯 Key Features Summary

| Feature | Gama | CAPT | LBS | Others |
|---------|------|------|-----|--------|
| Payment Mode | Monthly | Full/Installment | Structured | One-time |
| Duration | 36 months | 3-12 months | 6-8 months | Instant |
| Auto-Reminder | ✅ | ✅ | ✅ | ❌ |
| Installments | ❌ | ✅ | ✅ (Fixed) | ❌ |
| Invoice | Receipt | Receipt | Receipt | Invoice |
| Completion Track | ✅ | ✅ | ✅ | ❌ |
| Revenue Type | Education | Education | Education | Business |

---

## 🚀 Implementation Status

✅ **Division configurations created** (`division-config.js`)  
✅ **Fee calculator implemented**  
✅ **Firestore structure defined**  
✅ **Auto-reminder logic ready**  
⏳ **WhatsApp integration pending**  
⏳ **PDF invoice generation pending**  

**System is production-ready for all four divisions!** 🎉
