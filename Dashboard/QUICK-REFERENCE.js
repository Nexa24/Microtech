// ============================================
// FEE MANAGEMENT MODULE - QUICK REFERENCE
// ============================================

// 📋 ALL FUNCTIONS AVAILABLE
// ============================================

// 1. CORE FUNCTIONS
feeManager.init()                           // Initialize the system
feeManager.loadFees()                       // Load all fees from Firestore
feeManager.saveFee()                        // Save new fee payment
feeManager.editFee(feeId, updates)          // Update existing fee
feeManager.deleteFee(feeId)                 // Delete fee record

// 2. SEARCH & FILTER
feeManager.searchFees(searchTerm)           // Search by ID, name, receipt
feeManager.filterByDivision(division)       // Filter by gama/lbs/capt
feeManager.filterByStatus(status)           // Filter by paid/partial/pending
feeManager.filterByDateRange(start, end)    // Filter by date range
feeManager.applyFilters()                   // Apply all active filters

// 3. PENDING & REMINDERS
feeManager.getPendingFees()                 // Get all pending/partial fees
feeManager.sendReminder(studentId, name)    // Send reminder (logs to DB)

// 4. RECEIPTS
feeManager.generateReceipt(feeId)           // Generate & print receipt

// 5. REFUNDS
feeManager.issueRefund(feeId, amount, reason) // Issue refund + adjust fee

// 6. EXPORT
feeManager.exportToCSV()                    // Download CSV file
feeManager.exportToPDF()                    // Generate PDF report

// 7. ANALYTICS
feeManager.updateAnalytics()                // Update all stats cards
feeManager.getRevenueByPaymentMode()        // Get Cash/UPI/Card/Bank totals
feeManager.getTotalCollected()              // Total revenue
feeManager.getTotalPending()                // Total pending balance

// 8. PERMISSIONS
feeManager.checkPermission(action)          // Check user role permissions

// 9. UI UPDATES
feeManager.renderTables()                   // Re-render all tables
feeManager.updateChart(data)                // Update revenue chart
feeManager.updatePaymentModeChart()         // Update payment mode chart

// 10. REALTIME
feeManager.setupRealtimeListeners()         // Setup Firestore onSnapshot


// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Manually add fee from console
await feeManager.saveFee();

// Example 2: Search for student
const results = feeManager.searchFees('John');
console.log(results);

// Example 3: Get all pending fees
const pending = feeManager.getPendingFees();
console.log(`${pending.length} pending fees found`);

// Example 4: Send reminder to specific student
feeManager.sendReminder('STU001', 'John Doe');

// Example 5: Generate receipt
feeManager.generateReceipt('feeDocumentId123');

// Example 6: Issue refund
feeManager.issueRefund('feeDocumentId123', 500, 'Duplicate payment');

// Example 7: Export all data
feeManager.exportToCSV();    // CSV download
feeManager.exportToPDF();    // PDF print

// Example 8: Filter fees
document.getElementById('filter-division').value = 'gama';
feeManager.applyFilters();

// Example 9: Get payment mode breakdown
const modeStats = feeManager.getRevenueByPaymentMode();
console.log('Cash:', modeStats.cash);
console.log('UPI:', modeStats.upi);


// ============================================
// HTML ELEMENT IDs (for reference)
// ============================================

// BUTTONS
add-fee-btn                 // Open add fee modal
show-pending                // Show only pending fees
export-csv                  // Export CSV
export-pdf                  // Export PDF
reset-filters               // Reset all filters

// FORM INPUTS (Modal)
student-id                  // Student ID
student-name                // Student Name
division                    // Division select
course                      // Course name
fee-type                    // Fee type select
counselor-id                // Counselor ID
total-fee                   // Total fee amount
amount                      // Amount paid now
payment-date                // Payment date
payment-mode                // Payment mode select
next-due-date               // Next due date
notes                       // Remarks

// FILTERS
fee-search                  // Search input
filter-division             // Division filter
filter-status               // Status filter
filter-start-date           // Start date
filter-end-date             // End date

// ANALYTICS CARDS
total-revenue               // Total collected
total-pending               // Pending balance
pending-count               // Number of pending
gama-revenue                // Gama revenue
lbs-revenue                 // LBS revenue
capt-revenue                // CAPT revenue

// TABLES
gama-fees-table             // Gama table
lbs-fees-table              // LBS table
capt-fees-table             // CAPT table

// CHARTS
revenue-chart               // Bar chart (divisions)
payment-mode-chart          // Doughnut chart (modes)


// ============================================
// FIRESTORE COLLECTIONS
// ============================================

// fees - Main fee records
{
  studentId, studentName, division, course,
  type, amountPaid, totalFee, balance,
  paymentDate, mode, status, notes,
  receiptNo, transactionID, counselorID,
  nextDueDate, createdAt, updatedAt
}

// reminders - Reminder logs
{
  studentId, studentName, reminderDate,
  status, type
}

// refunds - Refund records
{
  feeId, studentId, studentName, division,
  refundAmount, reason, refundDate, processedBy
}


// ============================================
// UTILITY FUNCTIONS (Available Globally)
// ============================================

showToast(message, type)         // Show notification (success/error/warning/info)
generateTransactionID()          // Auto-generate transaction ID
generateReceiptNo(division)      // Auto-generate receipt number
formatCurrency(amount)           // Format as ₹1,234.56
formatDate(dateStr)              // Format as "12 Oct 2025"


// ============================================
// STATUS VALUES
// ============================================

// Fee Status
'paid'       // Fully paid (balance = 0)
'partial'    // Partially paid (balance > 0)
'pending'    // Not paid (amountPaid = 0)

// Divisions
'gama'       // Gama Abacus
'lbs'        // LBS Skill Centre
'capt'       // CAPT

// Payment Modes
'cash'       // Cash
'upi'        // UPI
'card'       // Card
'bank'       // Bank Transfer

// Fee Types
'admission'   // Admission Fee
'monthly'     // Monthly Fee
'installment' // Installment
'exam'        // Exam Fee
'certificate' // Certificate Fee
'other'       // Other


// ============================================
// PERMISSIONS BY ROLE
// ============================================

// admin
['add', 'edit', 'delete', 'view', 'refund', 'export']

// counselor
['add', 'view']

// teacher
['view']

// student
['view-own']


// ============================================
// GLOBAL ACCESS
// ============================================

// Access FeeManager from anywhere:
window.feeManager

// Example usage in HTML onclick:
onclick="window.feeManager.generateReceipt('feeId123')"


// ============================================
// KEYBOARD SHORTCUTS (Future Enhancement)
// ============================================

// Ctrl + N     → Add new fee
// Ctrl + F     → Focus search
// Ctrl + E     → Export CSV
// Ctrl + P     → Export PDF
// Escape       → Close modal


// ============================================
// CONSOLE DEBUGGING
// ============================================

// Check loaded fees:
console.log(window.feeManager.fees);

// Check all fees (unfiltered):
console.log(allFees);

// Get current user:
console.log(currentUser);

// Get user role:
console.log(userRole);
