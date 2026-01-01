# 🚀 Quick Start Guide - Advanced Fee Management

## Get Started in 5 Minutes!

### Step 1: Open the Advanced Features Page
```
Navigate to: fee-advanced.html
or
Click "Advanced Features" button on the main fees page
```

---

## 🎯 Common Tasks

### ✅ Task 1: Create an Installment Plan

**Scenario**: A student wants to pay ₹50,000 course fee in 5 monthly installments

1. Click **"Installment Management"** feature card
2. Click **"+ Create Installment Plan"** button
3. Fill in the form:
   - **Student Name**: Start typing to search (e.g., "John")
   - **Course**: Web Development
   - **Total Fee**: 50000
   - **Number of Installments**: 5
   - **Interval**: Monthly
   - **Start Date**: 2025-02-01
4. Click **"Generate Preview"** to see the schedule
5. Review the installment breakdown
6. Click **"Create Installment Plan"**
7. ✅ Done! You'll see a success message

**What happens next?**
- Plan is saved to Firebase
- Student can now pay installments
- Schedule appears in the installments table

---

### ✅ Task 2: Apply a Discount

**Scenario**: Give a 10% early bird discount to a student

1. Click **"Discounts & Scholarships"** feature card
2. Click **"Apply Discount"** button
3. Fill in the form:
   - **Student Name**: Start typing to search (e.g., "Jane")
   - **Discount Type**: Percentage
   - **Discount Value**: 10
   - **Base Fee**: 50000 (student's total fee)
   - **Category**: Early Bird
   - **Reason**: Enrolled in first week
4. Watch the **live preview** update:
   - Base Fee: ₹50,000
   - Discount (10%): ₹5,000
   - Final Fee: ₹45,000
5. Click **"Apply Discount"**
6. ✅ Done! Discount of ₹5,000 applied

**What happens next?**
- Discount is recorded in database
- Student's fee is automatically reduced
- Discount appears in discounts table

---

### ✅ Task 3: Record an Advance Payment

**Scenario**: A parent pays ₹20,000 in advance for future dues

1. Click **"Advance Payments"** feature card
2. Click **"+ Record Advance"** button
3. Fill in the form:
   - **Student Name**: Start typing to search
   - **Amount**: 20000
   - **Payment Mode**: UPI
   - **Payment Date**: Auto-filled to today
   - **Receipt No**: Auto-generated (or enter custom)
   - **Notes**: Advance for next semester
4. Click **"Record Advance Payment"**
5. ✅ Done! Advance of ₹20,000 recorded

**What happens next?**
- Advance balance is stored
- Can be adjusted against future dues
- Receipt number is generated
- Appears in advance payments table

---

### ✅ Task 4: Create a Fee Breakdown

**Scenario**: Break down a ₹50,000 course fee into components

1. Click **"Fee Breakdown per Course"** feature card
2. Click **"+ Create Breakdown"** button
3. Fill in the form:
   - **Course Name**: Web Development
   - **Division**: LBS
   - **Admission Fee**: 5000
   - **Course Fee**: 30000
   - **Exam Fee**: 5000
   - **Material Fee**: 3000
   - **Lab Fee**: 5000
   - **Certificate Fee**: 2000
4. Watch the **total update**: ₹50,000
5. Click **"Create Fee Breakdown"**
6. ✅ Done! Breakdown created

**What happens next?**
- Breakdown is saved to database
- Can be applied to multiple students
- Appears in breakdowns table
- Can be used for detailed receipts

---

### ✅ Task 5: Add a Custom Fee Category

**Scenario**: Add a new "Library Fee" category

**Method 1: Quick Add from Template**
1. Click **"Fee Category Manager"** feature card
2. Scroll to "Category Templates" section
3. Click **"+ Add"** on the "Library Fee" template
4. ✅ Done! Template added instantly

**Method 2: Create Custom**
1. Click **"+ Add Category"** button
2. Fill in the form:
   - **Category Name**: Library Fee
   - **Description**: Annual library subscription
   - **Default Amount**: 2000
   - **Optional**: ☑️ Yes
   - **Applicable Divisions**: Select GAMA, LBS, CAPT
   - **Icon**: fa-book
   - **Color**: Choose from picker
3. Click **"Create Category"**
4. ✅ Done! Custom category created

**What happens next?**
- Category is available for fee collection
- Can be applied to students
- Appears in fee records

---

## 🎨 Feature Overview

### 1️⃣ Installment Management
**What it does**: Create payment schedules, record installment payments
**Best for**: Students who can't pay full fee upfront
**Key Features**:
- Auto-generate schedule (weekly/monthly/custom)
- Track paid/pending installments
- Record individual payments
- View complete payment history

### 2️⃣ Discounts & Scholarships
**What it does**: Apply percentage/flat discounts, create scholarship programs
**Best for**: Early bird offers, merit-based discounts, group discounts
**Key Features**:
- Live discount calculation
- Percentage or flat amount
- Multiple discount categories
- Scholarship eligibility criteria

### 3️⃣ Late Fee System
**What it does**: Calculate and apply late fees automatically
**Best for**: Managing overdue payments
**Key Features**:
- 4 calculation methods (fixed, percentage, tiered, one-time)
- Division-specific rules
- Grace period support
- Automatic calculation

### 4️⃣ Advance Payments
**What it does**: Record prepayments, adjust against future dues
**Best for**: Parents paying in advance
**Key Features**:
- Track available balance
- Adjust against dues
- Payment history
- Auto-receipt generation

### 5️⃣ Fee Breakdown
**What it does**: Break down course fees into 6 components
**Best for**: Detailed fee structure, transparent pricing
**Key Features**:
- 6 standard components (admission, course, exam, material, lab, certificate)
- Live total calculation
- Apply to multiple students
- Course-specific breakdowns

### 6️⃣ Fee Category Manager
**What it does**: Create custom fee categories
**Best for**: Additional fees (uniform, transport, events)
**Key Features**:
- 10 pre-built templates
- Custom categories
- Optional/mandatory flag
- Division-specific

---

## 💡 Pro Tips

### Tip 1: Use Student Search
- Start typing in any student field
- Search by name, student ID, or email
- Click on suggestion to auto-fill

### Tip 2: Preview Before Submitting
- Installment plans show complete schedule
- Discounts show live calculation
- Breakdowns show total amount
- Always review before clicking submit

### Tip 3: View Details Anytime
- Click the 👁️ eye icon on any record
- See complete details in read-only modal
- View payment history
- Check status and dates

### Tip 4: Use Templates
- Category templates save time
- Pre-configured with suggested amounts
- One-click to add
- Customize after adding

### Tip 5: Check Status Badges
- **Green (Paid/Active)**: All good ✅
- **Yellow (Pending)**: Action needed ⚠️
- **Orange (Partially Paid)**: In progress 🔄
- **Red (Overdue)**: Urgent ❗

---

## 🔧 Troubleshooting

### Issue: Student not found in search
**Solution**: 
- Ensure student exists in Firebase `users` collection
- Check that `role` is set to "student"
- Verify spelling

### Issue: Modal not closing
**Solution**: 
- Click the ❌ close button
- Or press Escape key
- Or click outside the modal

### Issue: Form not submitting
**Solution**: 
- Check all required fields (marked with *)
- Ensure amounts are numbers
- Check date format
- Look for validation errors

### Issue: Calculations not updating
**Solution**: 
- Ensure JavaScript is enabled
- Refresh the page
- Check browser console for errors

---

## 📱 Mobile Usage

The system is **fully responsive**! Works on:
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667+)

**Mobile Tips**:
- Swipe tables horizontally
- Tap feature cards to expand
- Use native keyboard for inputs
- Double-tap to zoom modals

---

## 🎓 Training Checklist

### For Fee Clerks
- [ ] Navigate to advanced features
- [ ] Create an installment plan
- [ ] Apply a discount
- [ ] Record an advance payment
- [ ] View student payment history

### For Administrators
- [ ] Create scholarship programs
- [ ] Set up late fee rules
- [ ] Create fee breakdowns
- [ ] Add custom categories
- [ ] Generate reports

### For Counselors
- [ ] Search for students
- [ ] View installment schedules
- [ ] Check available discounts
- [ ] Review advance balances

---

## 📊 Reporting & Analytics

### Available Reports
1. **Outstanding Installments**
   - Filter by division
   - Sort by due date
   - Export to CSV

2. **Discount Summary**
   - Total discounts given
   - Category breakdown
   - Student-wise report

3. **Advance Balances**
   - Available balances
   - Usage history
   - Adjustment log

4. **Late Fee Analysis**
   - Total late fees collected
   - Division-wise breakdown
   - Trend analysis

---

## 🚀 What's Next?

Now that you're set up, explore:

1. **Documentation**
   - Read `ADVANCED_FEE_DOCUMENTATION.md` for detailed guide
   - Check `IMPLEMENTATION_SUMMARY.md` for technical details
   - View `VISUAL_GUIDE.md` for diagrams

2. **Advanced Usage**
   - Create scholarship programs with eligibility
   - Set up tiered late fee structures
   - Apply breakdowns to multiple students
   - Generate custom reports

3. **Integration**
   - Connect to payment gateway
   - Set up email notifications
   - Enable SMS reminders
   - Generate PDF receipts

---

## ✨ You're Ready!

You now know how to:
- ✅ Create installment plans
- ✅ Apply discounts
- ✅ Record advance payments
- ✅ Create fee breakdowns
- ✅ Add custom categories

**Happy Fee Managing! 🎉**

---

**Questions?** Refer to the documentation or contact support.

**Last Updated**: January 27, 2025
