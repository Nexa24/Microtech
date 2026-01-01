/**
 * ============================================
 * MICROTECH ANALYTICS - REPORTS & EXPORT MODULE
 * ============================================
 * 
 * This module handles:
 * - PDF export using jsPDF and html2canvas
 * - CSV export using PapaParse
 * - Excel export
 * - Custom report builder
 * - Pre-built report templates
 */

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    attachReportEventListeners();
    initializeReportBuilder();
});

function attachReportEventListeners() {
    // Pre-built report buttons
    document.querySelectorAll('.report-item').forEach(item => {
        const btn = item.querySelector('.btn-report');
        if (btn) {
            btn.addEventListener('click', () => {
                const reportType = item.dataset.report;
                generatePrebuiltReport(reportType);
            });
        }
    });

    // Custom report builder actions
    document.getElementById('previewReportBtn')?.addEventListener('click', previewCustomReport);
    document.getElementById('exportCustomPDFBtn')?.addEventListener('click', () => exportCustomReport('pdf'));
    document.getElementById('exportCustomCSVBtn')?.addEventListener('click', () => exportCustomReport('csv'));
    document.getElementById('resetReportBuilder')?.addEventListener('click', resetReportBuilder);
}

function initializeReportBuilder() {
    // Set default selections
    const defaultFields = ['studentID', 'studentName', 'division', 'course'];
    defaultFields.forEach(field => {
        const checkbox = document.querySelector(`input[name="field"][value="${field}"]`);
        if (checkbox) checkbox.checked = true;
    });
}

// ============================================
// PRE-BUILT REPORTS
// ============================================

async function generatePrebuiltReport(reportType) {
    const toast = showToast('Generating report...', 'info');
    
    try {
        let reportData;
        let reportTitle;
        
        switch (reportType) {
            case 'daily-collection':
                reportData = await generateDailyCollectionReport();
                reportTitle = 'Daily Collection Summary';
                break;
            case 'monthly-revenue':
                reportData = await generateMonthlyRevenueReport();
                reportTitle = 'Monthly Revenue by Division';
                break;
            case 'overdue-fees':
                reportData = await generateOverdueFeesReport();
                reportTitle = 'Overdue Fee Report';
                break;
            case 'course-enrollment':
                reportData = await generateCourseEnrollmentReport();
                reportTitle = 'Course Enrollment Report';
                break;
            case 'refunds-adjustments':
                reportData = await generateRefundsReport();
                reportTitle = 'Refunds & Adjustments Report';
                break;
            case 'expense-analysis':
                reportData = await generateExpenseAnalysisReport();
                reportTitle = 'Expense Analysis Report';
                break;
            default:
                throw new Error('Unknown report type');
        }

        // Show export options
        showExportOptionsModal(reportTitle, reportData);
        
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Error generating report', 'error');
    }
}

async function generateDailyCollectionReport() {
    const state = window.analyticsState;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = state.transactions.filter(txn => {
        const txnDate = new Date(txn.paymentDate);
        txnDate.setHours(0, 0, 0, 0);
        return txnDate.getTime() === today.getTime();
    });

    // Group by division
    const divisionSummary = {};
    todayTransactions.forEach(txn => {
        const div = txn.division || 'Others';
        if (!divisionSummary[div]) {
            divisionSummary[div] = {
                count: 0,
                cash: 0,
                upi: 0,
                card: 0,
                bank: 0,
                total: 0
            };
        }
        divisionSummary[div].count++;
        divisionSummary[div].total += txn.paidAmount || 0;
        
        const method = txn.paymentMethod?.toLowerCase() || 'cash';
        if (divisionSummary[div][method] !== undefined) {
            divisionSummary[div][method] += txn.paidAmount || 0;
        }
    });

    return {
        date: today.toLocaleDateString('en-IN'),
        totalTransactions: todayTransactions.length,
        totalAmount: todayTransactions.reduce((sum, txn) => sum + (txn.paidAmount || 0), 0),
        divisions: divisionSummary,
        transactions: todayTransactions
    };
}

async function generateMonthlyRevenueReport() {
    const state = window.analyticsState;
    
    // Group transactions by month and division
    const monthlyData = {};
    
    state.transactions.forEach(txn => {
        const date = new Date(txn.paymentDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const division = txn.division || 'Others';
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { GAMA: 0, CAPT: 0, LBS: 0, Others: 0, total: 0 };
        }
        
        monthlyData[monthKey][division] = (monthlyData[monthKey][division] || 0) + (txn.paidAmount || 0);
        monthlyData[monthKey].total += txn.paidAmount || 0;
    });

    return {
        months: Object.keys(monthlyData).sort(),
        data: monthlyData
    };
}

async function generateOverdueFeesReport() {
    const state = window.analyticsState;
    
    const overdueStudents = state.pendingFees
        .filter(fee => fee.daysOverdue > 0)
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

    const summary = {
        totalOverdue: overdueStudents.length,
        totalAmount: overdueStudents.reduce((sum, fee) => sum + (fee.balance || 0), 0),
        by30Days: overdueStudents.filter(f => f.daysOverdue <= 30).length,
        by60Days: overdueStudents.filter(f => f.daysOverdue > 30 && f.daysOverdue <= 60).length,
        by90Days: overdueStudents.filter(f => f.daysOverdue > 60).length
    };

    return {
        summary,
        students: overdueStudents
    };
}

async function generateCourseEnrollmentReport() {
    const state = window.analyticsState;
    
    const courseData = {};
    
    state.students.forEach(student => {
        const course = student.course || 'Unassigned';
        if (!courseData[course]) {
            courseData[course] = {
                enrollments: 0,
                division: student.division || '-',
                newThisMonth: 0,
                revenue: 0
            };
        }
        courseData[course].enrollments++;
        
        // Check if enrolled this month
        const enrollDate = new Date(student.enrollmentDate);
        const thisMonth = new Date();
        if (enrollDate.getMonth() === thisMonth.getMonth() && 
            enrollDate.getFullYear() === thisMonth.getFullYear()) {
            courseData[course].newThisMonth++;
        }
    });

    // Add revenue data
    state.transactions.forEach(txn => {
        const course = txn.course || 'Unassigned';
        if (courseData[course]) {
            courseData[course].revenue += txn.paidAmount || 0;
        }
    });

    return {
        courses: courseData,
        totalCourses: Object.keys(courseData).length,
        totalEnrollments: state.students.length
    };
}

async function generateRefundsReport() {
    const state = window.analyticsState;
    
    // Filter for refund transactions
    const refunds = state.transactions.filter(txn => 
        txn.status === 'Refunded' || txn.type === 'refund' || txn.paidAmount < 0
    );

    const adjustments = state.transactions.filter(txn => 
        txn.type === 'adjustment' || txn.notes?.toLowerCase().includes('discount')
    );

    return {
        refunds: {
            count: refunds.length,
            totalAmount: refunds.reduce((sum, txn) => sum + Math.abs(txn.paidAmount || 0), 0),
            transactions: refunds
        },
        adjustments: {
            count: adjustments.length,
            totalAmount: adjustments.reduce((sum, txn) => sum + Math.abs(txn.discount || 0), 0),
            transactions: adjustments
        }
    };
}

async function generateExpenseAnalysisReport() {
    const state = window.analyticsState;
    
    const categoryTotals = {};
    state.expenses.forEach(exp => {
        const category = exp.category || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + (exp.amount || 0);
    });

    const totalExpenses = state.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalRevenue = state.transactions.reduce((sum, txn) => sum + (txn.paidAmount || 0), 0);

    return {
        totalExpenses,
        totalRevenue,
        netProfit: totalRevenue - totalExpenses,
        categories: categoryTotals,
        expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue * 100).toFixed(2) : 0,
        expenses: state.expenses
    };
}

// ============================================
// CUSTOM REPORT BUILDER
// ============================================

function getCustomReportConfig() {
    const selectedFields = Array.from(document.querySelectorAll('input[name="field"]:checked'))
        .map(cb => cb.value);
    
    const config = {
        fields: selectedFields,
        filters: {
            division: document.getElementById('builderDivision')?.value || '',
            status: document.getElementById('builderStatus')?.value || ''
        },
        groupBy: document.getElementById('builderGroupBy')?.value || '',
        sortBy: document.getElementById('builderSortBy')?.value || 'paymentDate',
        sortOrder: document.getElementById('builderSortOrder')?.value || 'desc'
    };

    return config;
}

function applyCustomReportFilters(data, config) {
    let filtered = [...data];

    // Apply filters
    if (config.filters.division) {
        filtered = filtered.filter(item => item.division === config.filters.division);
    }
    if (config.filters.status) {
        filtered = filtered.filter(item => item.status === config.filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
        const aVal = a[config.sortBy];
        const bVal = b[config.sortBy];
        
        if (config.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Select only requested fields
    filtered = filtered.map(item => {
        const newItem = {};
        config.fields.forEach(field => {
            newItem[field] = item[field];
        });
        return newItem;
    });

    return filtered;
}

function previewCustomReport() {
    const config = getCustomReportConfig();
    const state = window.analyticsState;
    
    if (!state || !state.transactions) {
        showToast('No data available', 'warning');
        return;
    }

    const data = applyCustomReportFilters(state.transactions, config);
    
    // Create preview modal or table
    console.log('Preview data:', data);
    showToast(`Preview: ${data.length} records`, 'info');
    
    // Could open a modal with table preview here
}

async function exportCustomReport(format) {
    const config = getCustomReportConfig();
    const state = window.analyticsState;
    
    if (!config.fields || config.fields.length === 0) {
        showToast('Please select at least one field', 'warning');
        return;
    }

    if (!state || !state.transactions) {
        showToast('No data available', 'error');
        return;
    }

    const data = applyCustomReportFilters(state.transactions, config);
    
    if (format === 'csv') {
        exportToCSV(data, 'custom_report');
    } else if (format === 'pdf') {
        exportToPDF('Custom Report', data, config.fields);
    }
}

function resetReportBuilder() {
    // Reset all checkboxes
    document.querySelectorAll('input[name="field"]').forEach(cb => {
        cb.checked = ['studentID', 'studentName', 'division', 'course'].includes(cb.value);
    });

    // Reset dropdowns
    document.getElementById('builderDivision').value = '';
    document.getElementById('builderStatus').value = '';
    document.getElementById('builderGroupBy').value = '';
    document.getElementById('builderSortBy').value = 'paymentDate';
    document.getElementById('builderSortOrder').value = 'desc';

    showToast('Report builder reset', 'info');
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

async function exportToCSV(data, filename) {
    try {
        showToast('Preparing CSV export...', 'info');

        // Convert data to CSV using PapaParse
        const csv = Papa.unparse(data, {
            header: true,
            quotes: true
        });

        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('CSV exported successfully', 'success');
        logExport('CSV', filename);
        
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        showToast('Error exporting CSV', 'error');
    }
}

async function exportToPDF(title, data, fields) {
    try {
        showToast('Preparing PDF export...', 'info');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

        // Add title
        doc.setFontSize(18);
        doc.setTextColor(59, 130, 246); // Primary blue
        doc.text(title, 14, 20);

        // Add metadata
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 28);
        doc.text(`Total Records: ${data.length}`, 14, 33);

        // Prepare table data
        const headers = fields || Object.keys(data[0] || {});
        const rows = data.map(item => 
            headers.map(field => {
                const value = item[field];
                if (value instanceof Date) {
                    return value.toLocaleDateString('en-IN');
                }
                return value?.toString() || '-';
            })
        );

        // Add table using autoTable plugin
        if (doc.autoTable) {
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: 40,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                }
            });
        }

        // Save PDF
        doc.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);

        showToast('PDF exported successfully', 'success');
        logExport('PDF', title);
        
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showToast('Error exporting PDF', 'error');
    }
}

async function exportToExcel(data, filename) {
    // For Excel export, we'll use CSV format with .xls extension
    // For true Excel format, would need library like SheetJS
    try {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${Date.now()}.xls`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Excel file exported successfully', 'success');
        logExport('Excel', filename);
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showToast('Error exporting Excel file', 'error');
    }
}

async function exportDashboardToPDF() {
    try {
        showToast('Capturing dashboard...', 'info');

        const element = document.querySelector('.analytics-wrapper');
        if (!element) return;

        // Use html2canvas to capture the dashboard
        const canvas = await html2canvas(element, {
            backgroundColor: '#0f172a',
            scale: 2
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4');
        
        const imgWidth = 297; // A4 landscape width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`MicroTech_Analytics_${Date.now()}.pdf`);

        showToast('Dashboard exported as PDF', 'success');
        logExport('PDF', 'Dashboard');
        
    } catch (error) {
        console.error('Error exporting dashboard:', error);
        showToast('Error exporting dashboard', 'error');
    }
}

// ============================================
// EXPORT LOGGING
// ============================================

async function logExport(format, reportType) {
    try {
        const db = window.analyticsDB;
        if (!db) return;

        const exportLog = {
            user: window.analyticsState?.currentUser?.email || 'unknown',
            action: 'Export',
            format,
            reportType,
            timestamp: new Date(),
            fileSize: 'N/A' // Would calculate actual size
        };

        // Save to Firestore audit log
        // await addDoc(collection(db, 'audit_logs'), exportLog);

        // Update UI
        const tbody = document.getElementById('auditLogBody');
        if (tbody) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${exportLog.timestamp.toLocaleString('en-IN')}</td>
                <td>${exportLog.user}</td>
                <td>${exportLog.action}</td>
                <td>${exportLog.reportType}</td>
                <td>${exportLog.fileSize}</td>
                <td><span class="badge badge-success">Success</span></td>
            `;
            tbody.insertBefore(row, tbody.firstChild);
        }

        // Update export count
        const exportsToday = document.getElementById('exportsToday');
        if (exportsToday) {
            const current = parseInt(exportsToday.textContent) || 0;
            exportsToday.textContent = current + 1;
        }
        
    } catch (error) {
        console.error('Error logging export:', error);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showExportOptionsModal(title, data) {
    // Could create a custom modal for advanced export options
    const confirm = window.confirm(`Export "${title}"?\n\nFormat: CSV or PDF?`);
    if (confirm) {
        exportToCSV(data.transactions || data, title.replace(/\s+/g, '_').toLowerCase());
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.log(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in`;
    toast.style.cssText = `
        background: ${getToastColor(type)};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;
    
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.exportToCSV = exportToCSV;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.exportDashboardToPDF = exportDashboardToPDF;
window.exportData = async (format, options) => {
    const state = window.analyticsState;
    if (!state) return;

    if (format === 'csv') {
        await exportToCSV(state.transactions, 'analytics_export');
    } else if (format === 'pdf') {
        await exportToPDF('Analytics Export', state.transactions);
    } else if (format === 'excel') {
        await exportToExcel(state.transactions, 'analytics_export');
    }
};
