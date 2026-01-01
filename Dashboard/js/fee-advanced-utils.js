// ============================================
// ADVANCED FEE UTILITIES & HELPER FUNCTIONS
// Complete implementation with validation, reports, and exports
// ============================================

import { db } from '../firebase.js';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export const Validators = {
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone number (Indian format)
     */
    isValidPhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    },

    /**
     * Validate amount (positive number)
     */
    isValidAmount(amount) {
        return !isNaN(amount) && parseFloat(amount) > 0;
    },

    /**
     * Validate date format
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },

    /**
     * Validate percentage (0-100)
     */
    isValidPercentage(percentage) {
        const num = parseFloat(percentage);
        return !isNaN(num) && num >= 0 && num <= 100;
    },

    /**
     * Validate installment plan
     */
    validateInstallmentPlan(plan) {
        const errors = [];
        
        if (!plan.studentId) errors.push('Student ID is required');
        if (!plan.studentName) errors.push('Student name is required');
        if (!plan.course) errors.push('Course is required');
        if (!this.isValidAmount(plan.totalFee)) errors.push('Valid total fee is required');
        if (!plan.numberOfInstallments || plan.numberOfInstallments < 2) {
            errors.push('At least 2 installments required');
        }
        if (!this.isValidDate(plan.startDate)) errors.push('Valid start date is required');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate discount
     */
    validateDiscount(discount) {
        const errors = [];
        
        if (!discount.studentId) errors.push('Student ID is required');
        if (!this.isValidAmount(discount.baseFee)) errors.push('Valid base fee is required');
        if (discount.type === 'percentage' && !this.isValidPercentage(discount.value)) {
            errors.push('Valid percentage (0-100) is required');
        }
        if (discount.type === 'flat' && !this.isValidAmount(discount.value)) {
            errors.push('Valid discount amount is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

// ============================================
// FORMATTING FUNCTIONS
// ============================================

export const Formatters = {
    /**
     * Format currency (Indian Rupees)
     */
    currency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Format date
     */
    date(dateString, format = 'short') {
        const date = new Date(dateString);
        
        if (format === 'short') {
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } else if (format === 'long') {
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } else if (format === 'full') {
            return date.toLocaleString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return date.toLocaleDateString('en-IN');
    },

    /**
     * Format timestamp
     */
    timestamp(timestamp) {
        if (timestamp && timestamp.toDate) {
            return this.date(timestamp.toDate(), 'full');
        }
        return this.date(timestamp, 'full');
    },

    /**
     * Format percentage
     */
    percentage(value) {
        return `${parseFloat(value).toFixed(2)}%`;
    },

    /**
     * Format phone number
     */
    phone(phoneNumber) {
        const cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
        }
        return phoneNumber;
    }
};

// ============================================
// CALCULATION FUNCTIONS
// ============================================

export const Calculators = {
    /**
     * Calculate total from installments
     */
    installmentTotal(installments) {
        return installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
    },

    /**
     * Calculate paid amount from installments
     */
    installmentPaid(installments) {
        return installments.reduce((sum, inst) => {
            if (inst.status === 'paid') {
                return sum + (inst.amount || 0);
            } else if (inst.status === 'partial') {
                return sum + (inst.paidAmount || 0);
            }
            return sum;
        }, 0);
    },

    /**
     * Calculate remaining balance
     */
    installmentRemaining(installments) {
        const total = this.installmentTotal(installments);
        const paid = this.installmentPaid(installments);
        return total - paid;
    },

    /**
     * Calculate next due installment
     */
    nextDueInstallment(installments) {
        const pending = installments.filter(inst => inst.status === 'pending' || inst.status === 'partial');
        if (pending.length === 0) return null;
        
        pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        return pending[0];
    },

    /**
     * Calculate overdue installments
     */
    overdueInstallments(installments) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return installments.filter(inst => {
            if (inst.status === 'paid') return false;
            const dueDate = new Date(inst.dueDate);
            return dueDate < today;
        });
    },

    /**
     * Calculate discount amount
     */
    discountAmount(baseFee, type, value) {
        if (type === 'percentage') {
            return (baseFee * value) / 100;
        } else if (type === 'flat') {
            return Math.min(value, baseFee); // Can't discount more than base fee
        }
        return 0;
    },

    /**
     * Calculate late fee with grace period
     */
    lateFeeWithGrace(originalFee, dueDate, graceDays, rules) {
        const today = new Date();
        const due = new Date(dueDate);
        const graceEnd = new Date(due);
        graceEnd.setDate(graceEnd.getDate() + graceDays);
        
        if (today <= graceEnd) {
            return 0; // Within grace period
        }
        
        const daysLate = Math.floor((today - graceEnd) / (1000 * 60 * 60 * 24));
        
        let lateFee = 0;
        if (rules.type === 'fixed-per-day') {
            lateFee = daysLate * rules.amountPerDay;
        } else if (rules.type === 'percentage-per-day') {
            lateFee = (originalFee * rules.percentagePerDay * daysLate) / 100;
        }
        
        if (rules.maxLateFee && lateFee > rules.maxLateFee) {
            lateFee = rules.maxLateFee;
        }
        
        return Math.round(lateFee);
    }
};

// ============================================
// REPORT GENERATION
// ============================================

export const Reports = {
    /**
     * Generate installment summary report
     */
    async generateInstallmentReport(divisionFilter = null) {
        try {
            let q = collection(db, 'installmentPlans');
            if (divisionFilter) {
                q = query(q, where('division', '==', divisionFilter));
            }
            
            const snapshot = await getDocs(q);
            const plans = [];
            
            snapshot.forEach(doc => {
                plans.push({ id: doc.id, ...doc.data() });
            });
            
            const summary = {
                totalPlans: plans.length,
                activePlans: plans.filter(p => p.status === 'active').length,
                completedPlans: plans.filter(p => p.status === 'completed').length,
                totalAmount: 0,
                paidAmount: 0,
                remainingAmount: 0,
                overdueAmount: 0
            };
            
            plans.forEach(plan => {
                summary.totalAmount += plan.totalFee || 0;
                const paid = Calculators.installmentPaid(plan.installments || []);
                summary.paidAmount += paid;
                summary.remainingAmount += (plan.totalFee || 0) - paid;
                
                const overdue = Calculators.overdueInstallments(plan.installments || []);
                overdue.forEach(inst => {
                    summary.overdueAmount += inst.amount - (inst.paidAmount || 0);
                });
            });
            
            return {
                summary,
                plans,
                generatedAt: new Date()
            };
        } catch (error) {
            console.error('Error generating installment report:', error);
            throw error;
        }
    },

    /**
     * Generate discount summary report
     */
    async generateDiscountReport(startDate = null, endDate = null) {
        try {
            let q = query(collection(db, 'discounts'), where('status', '==', 'active'));
            
            const snapshot = await getDocs(q);
            const discounts = [];
            
            snapshot.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                
                // Filter by date if provided
                if (startDate || endDate) {
                    const appliedDate = data.appliedDate?.toDate?.() || new Date(data.appliedDate);
                    if (startDate && appliedDate < new Date(startDate)) return;
                    if (endDate && appliedDate > new Date(endDate)) return;
                }
                
                discounts.push(data);
            });
            
            const summary = {
                totalDiscounts: discounts.length,
                totalDiscountAmount: discounts.reduce((sum, d) => sum + (d.discountAmount || 0), 0),
                byCategory: {},
                byType: {
                    percentage: 0,
                    flat: 0
                }
            };
            
            discounts.forEach(discount => {
                // By category
                const category = discount.discountCategory || 'other';
                summary.byCategory[category] = (summary.byCategory[category] || 0) + discount.discountAmount;
                
                // By type
                if (discount.discountType === 'percentage') {
                    summary.byType.percentage += discount.discountAmount;
                } else {
                    summary.byType.flat += discount.discountAmount;
                }
            });
            
            return {
                summary,
                discounts,
                generatedAt: new Date()
            };
        } catch (error) {
            console.error('Error generating discount report:', error);
            throw error;
        }
    },

    /**
     * Generate late fee report
     */
    async generateLateFeeReport(month = null, year = null) {
        try {
            const q = collection(db, 'lateFees');
            const snapshot = await getDocs(q);
            const lateFees = [];
            
            snapshot.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                
                // Filter by month/year if provided
                if (month || year) {
                    const paidDate = new Date(data.paidDate);
                    if (month && paidDate.getMonth() + 1 !== month) return;
                    if (year && paidDate.getFullYear() !== year) return;
                }
                
                lateFees.push(data);
            });
            
            const summary = {
                totalLateFees: lateFees.length,
                totalAmount: lateFees.reduce((sum, f) => sum + (f.lateFeeAmount || 0), 0),
                averageDaysLate: 0,
                byDivision: {}
            };
            
            if (lateFees.length > 0) {
                const totalDays = lateFees.reduce((sum, f) => sum + (f.daysLate || 0), 0);
                summary.averageDaysLate = Math.round(totalDays / lateFees.length);
            }
            
            return {
                summary,
                lateFees,
                generatedAt: new Date()
            };
        } catch (error) {
            console.error('Error generating late fee report:', error);
            throw error;
        }
    }
};

// ============================================
// EXPORT FUNCTIONS
// ============================================

export const Exporters = {
    /**
     * Export data to CSV
     */
    exportToCSV(data, filename, columns) {
        const headers = columns.map(col => col.label).join(',');
        const rows = data.map(item => {
            return columns.map(col => {
                let value = item[col.field];
                if (col.format) {
                    value = col.format(value);
                }
                // Escape commas and quotes in CSV
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        }).join('\n');
        
        const csv = headers + '\n' + rows;
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().getTime()}.csv`;
        link.click();
    },

    /**
     * Export installment plans to CSV
     */
    exportInstallmentPlans(plans) {
        const columns = [
            { field: 'studentName', label: 'Student Name' },
            { field: 'studentId', label: 'Student ID' },
            { field: 'course', label: 'Course' },
            { field: 'totalFee', label: 'Total Fee', format: Formatters.currency },
            { field: 'numberOfInstallments', label: 'Installments' },
            { field: 'status', label: 'Status' },
            { field: 'createdAt', label: 'Created', format: Formatters.timestamp }
        ];
        
        this.exportToCSV(plans, 'installment_plans', columns);
    },

    /**
     * Export discounts to CSV
     */
    exportDiscounts(discounts) {
        const columns = [
            { field: 'studentName', label: 'Student Name' },
            { field: 'discountCategory', label: 'Category' },
            { field: 'discountType', label: 'Type' },
            { field: 'discountValue', label: 'Value' },
            { field: 'discountAmount', label: 'Amount', format: Formatters.currency },
            { field: 'baseFee', label: 'Base Fee', format: Formatters.currency },
            { field: 'finalFee', label: 'Final Fee', format: Formatters.currency },
            { field: 'appliedDate', label: 'Applied Date', format: Formatters.timestamp }
        ];
        
        this.exportToCSV(discounts, 'discounts', columns);
    },

    /**
     * Generate receipt HTML
     */
    generateReceiptHTML(payment, type = 'installment') {
        const today = Formatters.date(new Date(), 'long');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Payment Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .header h1 { margin: 0; color: #667eea; }
                    .details { margin: 20px 0; }
                    .details table { width: 100%; }
                    .details td { padding: 8px 0; }
                    .details td:first-child { font-weight: bold; width: 150px; }
                    .amount { font-size: 24px; text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h1>Micro Tech Center</h1>
                        <p>Payment Receipt</p>
                    </div>
                    <div class="details">
                        <table>
                            <tr><td>Receipt No:</td><td>${payment.receiptNo}</td></tr>
                            <tr><td>Date:</td><td>${today}</td></tr>
                            <tr><td>Student Name:</td><td>${payment.studentName}</td></tr>
                            <tr><td>Student ID:</td><td>${payment.studentId}</td></tr>
                            <tr><td>Payment Mode:</td><td>${payment.paymentMode}</td></tr>
                        </table>
                    </div>
                    <div class="amount">
                        <strong>Amount Paid:</strong><br>
                        ${Formatters.currency(payment.amount)}
                    </div>
                    <div class="footer">
                        <p>This is a computer-generated receipt</p>
                        <p>Micro Tech Center | Advanced Fee Management System</p>
                    </div>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;
    },

    /**
     * Print receipt
     */
    printReceipt(payment, type = 'installment') {
        const html = this.generateReceiptHTML(payment, type);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
    }
};

// ============================================
// SEARCH & FILTER FUNCTIONS
// ============================================

export const Filters = {
    /**
     * Search students by name or ID
     */
    searchStudents(students, searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return students;
        
        return students.filter(student => {
            return (
                student.name?.toLowerCase().includes(term) ||
                student.studentId?.toLowerCase().includes(term) ||
                student.email?.toLowerCase().includes(term) ||
                student.phone?.includes(term)
            );
        });
    },

    /**
     * Filter by date range
     */
    filterByDateRange(items, dateField, startDate, endDate) {
        return items.filter(item => {
            const itemDate = item[dateField]?.toDate?.() || new Date(item[dateField]);
            if (startDate && itemDate < new Date(startDate)) return false;
            if (endDate && itemDate > new Date(endDate)) return false;
            return true;
        });
    },

    /**
     * Filter by status
     */
    filterByStatus(items, status) {
        if (!status || status === 'all') return items;
        return items.filter(item => item.status === status);
    },

    /**
     * Filter by division
     */
    filterByDivision(items, division) {
        if (!division || division === 'all') return items;
        return items.filter(item => item.division === division);
    }
};

// ============================================
// NOTIFICATION HELPERS
// ============================================

export const Notifications = {
    /**
     * Generate installment reminder
     */
    generateInstallmentReminder(installment, plan) {
        const daysUntilDue = Math.ceil((new Date(installment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        return {
            title: `Installment Payment Due ${daysUntilDue > 0 ? 'in ' + daysUntilDue + ' days' : 'today'}`,
            message: `Dear ${plan.studentName}, your installment #${installment.installmentNumber} of ${Formatters.currency(installment.amount)} is due on ${Formatters.date(installment.dueDate)}.`,
            type: daysUntilDue < 3 ? 'urgent' : 'reminder',
            studentId: plan.studentId,
            dueDate: installment.dueDate
        };
    },

    /**
     * Generate overdue notification
     */
    generateOverdueNotification(installment, plan) {
        const daysOverdue = Math.floor((new Date() - new Date(installment.dueDate)) / (1000 * 60 * 60 * 24));
        
        return {
            title: `Overdue Payment - ${daysOverdue} days`,
            message: `Dear ${plan.studentName}, your installment #${installment.installmentNumber} of ${Formatters.currency(installment.amount)} was due on ${Formatters.date(installment.dueDate)}. Please make payment to avoid late fees.`,
            type: 'overdue',
            studentId: plan.studentId,
            daysOverdue: daysOverdue
        };
    }
};

// ============================================
// EXPORT ALL UTILITIES
// ============================================

export default {
    Validators,
    Formatters,
    Calculators,
    Reports,
    Exporters,
    Filters,
    Notifications
};
