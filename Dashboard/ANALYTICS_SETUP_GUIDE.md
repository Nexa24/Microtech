# MicroTech Analytics & Reports System - Complete Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [File Structure](#file-structure)
5. [Installation](#installation)
6. [Firebase Configuration](#firebase-configuration)
7. [Firestore Schema](#firestore-schema)
8. [Security Rules](#security-rules)
9. [Firestore Indexes](#firestore-indexes)
10. [Cloud Functions Setup](#cloud-functions-setup)
11. [SendGrid Email Configuration](#sendgrid-email-configuration)
12. [Usage Guide](#usage-guide)
13. [Troubleshooting](#troubleshooting)
14. [Performance Optimization](#performance-optimization)

---

## Overview

The MicroTech Analytics & Reports system is a comprehensive data analytics and reporting dashboard built for educational institutions. It provides real-time insights into revenue, enrollments, fee collections, and performance metrics across multiple divisions (GAMA, CAPT, LBS).

**Key Capabilities:**
- Real-time KPI dashboard with 7 key metrics
- Interactive charts and drill-down analytics
- Advanced filtering and custom report building
- PDF/CSV/Excel exports
- Scheduled automated reports via email
- Counselor and course performance tracking
- Overdue fee management with bulk reminders

---

## Features

### 1. KPI Cards
- **Total Revenue** (MTD/YTD with % change)
- **Collected Today** (transaction count)
- **Pending Fees** (student count and amount)
- **New Enrollments** (last 30 days)
- **Conversion Rate** (inquiries to admissions)
- **Net Profit** (revenue - expenses)
- **Active Courses** (total student count)

### 2. Interactive Charts
- **Revenue Trend**: Line chart with daily/weekly/monthly granularity
- **Division Revenue Share**: Donut chart with drill-down to filter
- **Enrollments vs Dropoffs**: Stacked bar chart
- **Payment Methods**: Pie chart distribution
- **Top Courses**: Horizontal bar chart by revenue/enrollments

### 3. Data Tables
- **Recent Transactions**: Paginated, searchable, sortable
- **Pending Fees**: Bulk reminder actions
- **Top Courses**: Performance metrics
- **Counselor Performance**: Conversion tracking

### 4. Reports & Exports
- **Pre-built Reports:**
  - Daily Collection Summary
  - Monthly Revenue by Division
  - Overdue Fee Report
  - Course Enrollment Report
  - Refunds & Adjustments
  - Expense Analysis

- **Custom Report Builder:** Select fields, filters, grouping, sorting
- **Export Formats:** CSV, PDF, Excel
- **Scheduled Reports:** Daily/weekly/monthly automation

### 5. Analytics Widgets
- Anomaly detection (revenue spikes/drops)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value estimate)
- Churn Rate tracking

### 6. Audit Trail
- Export logs with timestamps
- User activity tracking
- Backup status monitoring

---

## Tech Stack

### Frontend
- **HTML5** with semantic structure
- **CSS3** with CSS Variables for theming
- **JavaScript** (ES6 modules)
- **Chart.js 4.4.0** for data visualization
- **Flatpickr 4.6.13** for date range picker

### Libraries
- **jsPDF 2.5.1** - PDF generation
- **html2canvas 1.4.1** - Dashboard screenshots
- **PapaParse 5.4.1** - CSV parsing/generation
- **Font Awesome 6.4.0** - Icons

### Backend
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User auth
- **Firebase Cloud Functions** - Serverless backend
- **Firebase Cloud Storage** - Large file storage

### Email
- **SendGrid** - Transactional emails

---

## File Structure

```
Dashboard/
├── analytics.html              # Main HTML page
├── analytics.css               # Dark-themed stylesheet
├── analytics.js                # Core JavaScript + Firebase integration
├── analytics-charts.js         # Chart.js visualizations
├── analytics-reports.js        # Export and report generation
├── analytics-scheduled.js      # Scheduled reports management
├── cloud-functions-analytics.js # Cloud Functions (deploy separately)
└── ANALYTICS_SETUP_GUIDE.md    # This file
```

---

## Installation

### 1. Clone/Copy Files
Copy all analytics files to your `Dashboard/` folder:
```bash
analytics.html
analytics.css
analytics.js
analytics-charts.js
analytics-reports.js
analytics-scheduled.js
```

### 2. Update Firebase Configuration

Edit `analytics.js` and replace Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Link in Navigation

Add analytics link to `admin-dashboard.html`:

```html
<a href="analytics.html" class="nav-item">
    <i class="fas fa-chart-bar nav-icon"></i>
    <span class="nav-text">Analytics & Reports</span>
</a>
```

---

## Firebase Configuration

### 1. Enable Services

In Firebase Console:

1. **Authentication**
   - Enable Email/Password provider
   - Add authorized domains

2. **Firestore Database**
   - Create database in production mode
   - Set location to `asia-south1` (Mumbai)

3. **Cloud Functions**
   - Upgrade to Blaze (pay-as-you-go) plan
   - Enable Cloud Scheduler API

4. **Cloud Storage**
   - Create default bucket
   - Configure CORS if needed

### 2. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Storage

---

## Firestore Schema

### Collections

#### 1. `fees` (Fee Transactions)
```javascript
{
  studentID: "MT2024001",
  studentName: "John Doe",
  division: "GAMA",
  course: "Full Stack Development",
  totalFee: 50000,
  paidAmount: 15000,
  balance: 35000,
  paymentDate: Timestamp,
  dueDate: Timestamp,
  paymentMethod: "UPI",
  counselor: "Priya Sharma",
  receiptNo: "RCP-2024-001",
  status: "Partial", // Paid, Partial, Pending, Refunded
  notes: "First installment"
}
```

#### 2. `students` (Student Records)
```javascript
{
  studentID: "MT2024001",
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  division: "GAMA",
  course: "Full Stack Development",
  enrollmentDate: Timestamp,
  status: "active", // active, completed, dropped
  totalFee: 50000,
  counselor: "Priya Sharma"
}
```

#### 3. `courses` (Course Catalog)
```javascript
{
  name: "Full Stack Development",
  division: "GAMA",
  duration: "6 months",
  fee: 50000,
  status: "active",
  capacity: 30,
  currentEnrollment: 25
}
```

#### 4. `counselors` (Counselor Records)
```javascript
{
  name: "Priya Sharma",
  email: "priya@microtech.com",
  division: "GAMA",
  status: "active",
  inquiries: 150,
  conversions: 45
}
```

#### 5. `expenses` (Expense Tracking)
```javascript
{
  category: "Salaries",
  amount: 45000,
  date: Timestamp,
  description: "Monthly staff salaries",
  approvedBy: "admin@microtech.com"
}
```

#### 6. `scheduled_reports` (Report Schedules)
```javascript
{
  name: "Weekly Revenue Report",
  reportType: "monthly-revenue",
  frequency: "weekly", // daily, weekly, monthly
  time: "09:00",
  recipients: ["admin@microtech.com", "manager@microtech.com"],
  format: "pdf", // pdf, csv, both
  active: true,
  createdBy: "admin@microtech.com",
  createdAt: Timestamp,
  lastRun: Timestamp,
  nextRun: Timestamp,
  runCount: 15
}
```

#### 7. `daily_revenue` (Aggregated Daily Data)
```javascript
{
  date: Timestamp,
  totalRevenue: 125000,
  totalTransactions: 45,
  divisions: {
    GAMA: 50000,
    CAPT: 35000,
    LBS: 30000,
    Others: 10000
  }
}
```

#### 8. `monthly_revenue` (Aggregated Monthly Data)
```javascript
{
  month: Timestamp,
  totalRevenue: 3500000,
  divisions: { ... },
  courses: { ... },
  transactionCount: 450
}
```

#### 9. `audit_logs` (Activity Tracking)
```javascript
{
  user: "admin@microtech.com",
  action: "Export",
  reportType: "Daily Collection",
  format: "CSV",
  timestamp: Timestamp,
  ipAddress: "192.168.1.1"
}
```

---

## Security Rules

Add to `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isCounselor() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'counselor';
    }
    
    // Fees collection - Admin full access, Counselor read own
    match /fees/{feeId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Students collection
    match /students/{studentId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Counselors collection
    match /counselors/{counselorId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Expenses collection - Admin only
    match /expenses/{expenseId} {
      allow read, write: if isAdmin();
    }
    
    // Scheduled reports - Admin only
    match /scheduled_reports/{reportId} {
      allow read, write: if isAdmin();
    }
    
    // Aggregated data - Read only
    match /daily_revenue/{dateId} {
      allow read: if isSignedIn();
      allow write: if false; // Only Cloud Functions
    }
    
    match /monthly_revenue/{monthId} {
      allow read: if isSignedIn();
      allow write: if false; // Only Cloud Functions
    }
    
    // Audit logs - Read for admin, write by system
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isSignedIn();
      allow update, delete: if false;
    }
  }
}
```

---

## Firestore Indexes

Create composite indexes for efficient queries:

### 1. Fees Queries
```javascript
// Filter by date range and division
Collection: fees
Fields: paymentDate (Ascending), division (Ascending)

// Filter by balance for pending fees
Collection: fees
Fields: balance (Ascending), paymentDate (Descending)

// Filter by status and date
Collection: fees
Fields: status (Ascending), paymentDate (Descending)
```

### 2. Students Queries
```javascript
// Filter by enrollment date
Collection: students
Fields: enrollmentDate (Descending), status (Ascending)

// Filter by division and course
Collection: students
Fields: division (Ascending), course (Ascending)
```

### 3. Scheduled Reports
```javascript
// Find active schedules due to run
Collection: scheduled_reports
Fields: active (Ascending), nextRun (Ascending)
```

**Create indexes via Firebase Console:**
1. Go to Firestore → Indexes
2. Click "Create Index"
3. Add fields as listed above
4. Select "Ascending" or "Descending" for each field
5. Click "Create"

Or use Firebase CLI:
```bash
firebase deploy --only firestore:indexes
```

---

## Cloud Functions Setup

### 1. Install Dependencies

In `functions/` directory:

```bash
cd functions
npm install firebase-functions firebase-admin jspdf papaparse @sendgrid/mail
```

### 2. Create `functions/index.js`

Copy content from `cloud-functions-analytics.js` to `functions/index.js`

### 3. Configure SendGrid API Key

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

### 4. Deploy Functions

```bash
firebase deploy --only functions
```

### 5. Set Up Cloud Scheduler

In Google Cloud Console:

1. Go to Cloud Scheduler
2. Create jobs for:
   - `checkScheduledReports` - Every 1 hour
   - `aggregateDailyRevenue` - Daily at 1 AM
   - `aggregateMonthlyRevenue` - 1st of month at 2 AM

Example PubSub topic: `firebase-schedule-checkScheduledReports`

---

## SendGrid Email Configuration

### 1. Create SendGrid Account
- Sign up at [sendgrid.com](https://sendgrid.com)
- Verify your domain or use Single Sender Verification

### 2. Create API Key
1. Settings → API Keys
2. Create API Key with "Full Access"
3. Copy the key (shown only once)

### 3. Verify Sender Email
- Settings → Sender Authentication
- Verify `reports@microtech.com` (or your domain)

### 4. Configure in Firebase
```bash
firebase functions:config:set sendgrid.key="SG.xxxxxxxxxxxxxxxxxxxxx"
```

### 5. Test Email
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'test@example.com',
  from: 'reports@microtech.com',
  subject: 'Test Email',
  text: 'Test successful!'
};

sgMail.send(msg);
```

---

## Usage Guide

### Accessing the Dashboard

1. Navigate to `analytics.html` from admin dashboard
2. Ensure you're logged in with admin credentials
3. Wait for initial data load

### Using Filters

1. **Date Range:**
   - Click preset buttons (Today, 7d, 30d, MTD, YTD)
   - Or select "Custom" for custom range

2. **Division/Course/Counselor:**
   - Select from dropdowns
   - Multiple filters work together (AND logic)

3. **Apply:**
   - Click "Apply Filters" to refresh data
   - Click "Reset" to clear all filters

### Exporting Data

**Quick Export:**
1. Click "Export" button in filter bar
2. Select format (CSV/PDF/Excel)
3. Check options (KPI, Charts, Details)
4. Optionally enter email for delivery
5. Click "Export Now"

**Custom Report:**
1. Scroll to "Custom Report Builder"
2. Select fields to include
3. Apply filters, grouping, sorting
4. Click "Preview" to verify
5. Click "Export CSV" or "Export PDF"

### Scheduling Reports

1. Click "Schedule Report" button
2. Fill in form:
   - Report Name
   - Report Type (or Custom)
   - Frequency (Daily/Weekly/Monthly)
   - Time (24-hour format)
   - Recipients (comma-separated emails)
   - Format (PDF/CSV/Both)
3. Click "Create Schedule"
4. Report appears in "Scheduled Reports" list

**Managing Schedules:**
- ▶️ Pause/Resume
- ✏️ Edit
- ▶ Run Now
- 🗑️ Delete

### Drill-Down Actions

**Chart Clicks:**
- Click division in pie chart → filters to that division
- Click month in line chart → shows transactions for that month

**Table Actions:**
- Click row → view transaction details
- Click receipt icon → open receipt PDF
- Checkbox + "Send Reminders" → bulk email/SMS

---

## Troubleshooting

### Issue: Charts not loading

**Solution:**
- Check browser console for errors
- Verify Chart.js is loaded: `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>`
- Check `window.analyticsState` is populated with data

### Issue: Firebase permission denied

**Solution:**
- Check Firestore rules allow read for your role
- Verify user is authenticated: `firebase.auth().currentUser`
- Check indexes are created for complex queries

### Issue: Exports not working

**Solution:**
- **CSV:** Check PapaParse is loaded
- **PDF:** Check jsPDF is loaded
- **Large exports:** Use Cloud Function for >10,000 records
- Check browser allows file downloads

### Issue: Scheduled reports not sending

**Solution:**
- Verify Cloud Scheduler jobs are enabled
- Check SendGrid API key is configured
- Check function logs: `firebase functions:log`
- Verify email addresses are valid
- Check SendGrid sender is verified

### Issue: Slow performance

**Solution:**
- Create Firestore indexes for queries
- Use aggregated collections (`daily_revenue`, `monthly_revenue`)
- Limit date ranges for large datasets
- Enable Firestore caching
- Paginate large tables

---

## Performance Optimization

### 1. Use Aggregated Data

Instead of querying all transactions for KPIs, use pre-aggregated collections updated by Cloud Functions:

```javascript
// Bad: Query all transactions
const snapshot = await db.collection('fees').get();
const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().paidAmount, 0);

// Good: Use aggregated data
const todayDoc = await db.collection('daily_revenue').doc('2024-11-23').get();
const total = todayDoc.data().totalRevenue;
```

### 2. Implement Pagination

For large tables:

```javascript
const LIMIT = 50;
let lastVisible = null;

// First page
let query = db.collection('fees')
    .orderBy('paymentDate', 'desc')
    .limit(LIMIT);

// Next page
query = query.startAfter(lastVisible);
```

### 3. Use Firestore Cache

Enable persistence:

```javascript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db)
  .catch((err) => {
    console.error('Persistence failed:', err);
  });
```

### 4. Lazy Load Charts

Only initialize charts when scrolled into view:

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !charts.revenueTrend) {
      initRevenueTrendChart();
    }
  });
});

observer.observe(document.getElementById('revenueTrendChart'));
```

### 5. Debounce Filter Changes

Prevent excessive queries:

```javascript
let filterTimeout;

function handleFilterChange() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    applyFilters();
  }, 500);
}
```

### 6. Cloud Function Optimization

- Use batch writes for aggregations
- Set proper memory allocation (512MB+)
- Use Cloud Tasks for large operations
- Cache frequently accessed data in Firestore or Redis

---

## Support & Maintenance

**For Issues:**
- Check Firebase Console → Firestore → Errors
- Check Browser DevTools → Console
- Check Cloud Functions logs: `firebase functions:log`

**Regular Tasks:**
- Monitor Firestore usage (free tier: 50K reads/day)
- Review Cloud Function execution times
- Check SendGrid email delivery rates
- Backup Firestore data monthly

**Backup Firestore:**
```bash
gcloud firestore export gs://YOUR_BUCKET/backups/$(date +%Y%m%d)
```

---

## Credits

**Developed for MicroTech Admin Panel**  
Version: 1.0.0  
Last Updated: November 23, 2025

**Technologies:**
- Firebase (Google Cloud)
- Chart.js by Chart.js Team
- jsPDF by Parallax
- PapaParse by Matt Holt

---

## License

© 2025 MicroTech. All rights reserved.
