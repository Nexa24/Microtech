/**
 * ============================================
 * MICROTECH ANALYTICS - SCHEDULED REPORTS MODULE
 * ============================================
 * 
 * This module handles:
 * - Creating scheduled report configurations
 * - Displaying scheduled reports list
 * - Managing (edit/delete) scheduled reports
 * - Integration with Cloud Functions for execution
 */

import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadScheduledReports();
    attachScheduledReportListeners();
});

function attachScheduledReportListeners() {
    document.getElementById('createScheduleBtn')?.addEventListener('click', () => {
        showScheduleModal();
    });
}

// ============================================
// LOAD SCHEDULED REPORTS
// ============================================

async function loadScheduledReports() {
    try {
        const db = window.analyticsDB;
        if (!db) {
            console.error('Firestore not initialized');
            return;
        }

        const schedulesRef = collection(db, 'scheduled_reports');
        const q = query(schedulesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const schedules = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderScheduledReports(schedules);
        updateScheduledReportsCount(schedules.filter(s => s.active).length);
        
    } catch (error) {
        console.error('Error loading scheduled reports:', error);
    }
}

function renderScheduledReports(schedules) {
    const container = document.getElementById('scheduledReportsList');
    if (!container) return;

    if (schedules.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <p>No scheduled reports yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = schedules.map(schedule => `
        <div class="scheduled-report-item ${!schedule.active ? 'inactive' : ''}" data-id="${schedule.id}">
            <div class="scheduled-report-info">
                <h4>
                    ${schedule.name}
                    ${schedule.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>'}
                </h4>
                <p>
                    <i class="fas fa-file-alt"></i> ${getReportTypeName(schedule.reportType)} · 
                    <i class="fas fa-clock"></i> ${schedule.frequency} at ${schedule.time} ·
                    <i class="fas fa-envelope"></i> ${schedule.recipients.length} recipient(s)
                </p>
                <p class="text-muted">
                    Created ${formatDate(schedule.createdAt)} by ${schedule.createdBy}
                    ${schedule.lastRun ? ` · Last run: ${formatDate(schedule.lastRun)}` : ''}
                </p>
            </div>
            <div class="scheduled-report-actions">
                <button class="btn-icon" onclick="toggleSchedule('${schedule.id}', ${!schedule.active})" title="${schedule.active ? 'Pause' : 'Activate'}">
                    <i class="fas fa-${schedule.active ? 'pause' : 'play'}"></i>
                </button>
                <button class="btn-icon" onclick="editSchedule('${schedule.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="runScheduleNow('${schedule.id}')" title="Run Now">
                    <i class="fas fa-play-circle"></i>
                </button>
                <button class="btn-icon" onclick="deleteSchedule('${schedule.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getReportTypeName(type) {
    const names = {
        'daily-collection': 'Daily Collection',
        'monthly-revenue': 'Monthly Revenue',
        'overdue-fees': 'Overdue Fees',
        'course-enrollment': 'Course Enrollment',
        'custom': 'Custom Report'
    };
    return names[type] || type;
}

function updateScheduledReportsCount(count) {
    const element = document.getElementById('activeSchedules');
    if (element) {
        element.textContent = count;
    }
}

// ============================================
// CREATE SCHEDULED REPORT
// ============================================

async function createScheduledReport(scheduleData) {
    try {
        const db = window.analyticsDB;
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        // Validate schedule data
        if (!scheduleData.name || !scheduleData.recipients || scheduleData.recipients.length === 0) {
            throw new Error('Missing required fields');
        }

        // Add to Firestore
        const schedulesRef = collection(db, 'scheduled_reports');
        const docRef = await addDoc(schedulesRef, {
            ...scheduleData,
            createdAt: new Date(),
            lastRun: null,
            nextRun: calculateNextRun(scheduleData.frequency, scheduleData.time),
            runCount: 0,
            status: 'active'
        });

        console.log('Scheduled report created:', docRef.id);
        
        // Reload the list
        await loadScheduledReports();
        
        return docRef.id;
        
    } catch (error) {
        console.error('Error creating scheduled report:', error);
        throw error;
    }
}

function calculateNextRun(frequency, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
        if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
    } else if (frequency === 'weekly') {
        // Run on Mondays
        const daysUntilMonday = (8 - nextRun.getDay()) % 7;
        nextRun.setDate(nextRun.getDate() + daysUntilMonday);
        if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 7);
        }
    } else if (frequency === 'monthly') {
        // Run on the 1st of next month
        nextRun.setMonth(nextRun.getMonth() + 1, 1);
    }

    return nextRun;
}

// ============================================
// UPDATE SCHEDULED REPORT
// ============================================

async function editSchedule(scheduleId) {
    try {
        const db = window.analyticsDB;
        if (!db) return;

        // Get schedule data
        const scheduleDoc = await doc(db, 'scheduled_reports', scheduleId);
        // Would need to fetch the document and populate the modal form
        
        console.log('Edit schedule:', scheduleId);
        showToast('Edit functionality to be implemented', 'info');
        
    } catch (error) {
        console.error('Error editing schedule:', error);
        showToast('Error loading schedule', 'error');
    }
}

async function toggleSchedule(scheduleId, active) {
    try {
        const db = window.analyticsDB;
        if (!db) return;

        const scheduleRef = doc(db, 'scheduled_reports', scheduleId);
        await updateDoc(scheduleRef, {
            active,
            updatedAt: new Date()
        });

        showToast(`Schedule ${active ? 'activated' : 'paused'}`, 'success');
        await loadScheduledReports();
        
    } catch (error) {
        console.error('Error toggling schedule:', error);
        showToast('Error updating schedule', 'error');
    }
}

// ============================================
// RUN SCHEDULED REPORT
// ============================================

async function runScheduleNow(scheduleId) {
    try {
        showToast('Executing scheduled report...', 'info');

        const db = window.analyticsDB;
        if (!db) return;

        // Get schedule configuration
        const scheduleDoc = await doc(db, 'scheduled_reports', scheduleId);
        // Would fetch the document and execute the report

        // In production, this would call a Cloud Function
        // For now, simulate the execution
        
        setTimeout(async () => {
            // Update last run time
            const scheduleRef = doc(db, 'scheduled_reports', scheduleId);
            await updateDoc(scheduleRef, {
                lastRun: new Date(),
                runCount: (await scheduleRef.get())?.data()?.runCount + 1 || 1
            });

            showToast('Report executed and sent', 'success');
            await loadScheduledReports();
        }, 2000);
        
    } catch (error) {
        console.error('Error running schedule:', error);
        showToast('Error executing report', 'error');
    }
}

// ============================================
// DELETE SCHEDULED REPORT
// ============================================

async function deleteSchedule(scheduleId) {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
        return;
    }

    try {
        const db = window.analyticsDB;
        if (!db) return;

        const scheduleRef = doc(db, 'scheduled_reports', scheduleId);
        await deleteDoc(scheduleRef);

        showToast('Scheduled report deleted', 'success');
        await loadScheduledReports();
        
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Error deleting schedule', 'error');
    }
}

// ============================================
// CLOUD FUNCTION INTEGRATION
// ============================================

/**
 * This would be called by Cloud Functions on schedule
 * to execute the report and send emails
 */
async function executeScheduledReport(scheduleConfig) {
    try {
        // 1. Generate the report based on type
        let reportData;
        switch (scheduleConfig.reportType) {
            case 'daily-collection':
                reportData = await generateDailyCollectionReport();
                break;
            case 'monthly-revenue':
                reportData = await generateMonthlyRevenueReport();
                break;
            // ... other report types
        }

        // 2. Format the report (PDF or CSV)
        let fileBuffer;
        if (scheduleConfig.format === 'pdf' || scheduleConfig.format === 'both') {
            fileBuffer = await generatePDFBuffer(reportData);
        }

        // 3. Send email with attachment
        await sendReportEmail(scheduleConfig.recipients, {
            reportType: scheduleConfig.reportType,
            format: scheduleConfig.format,
            attachment: fileBuffer
        });

        return { success: true };
        
    } catch (error) {
        console.error('Error executing scheduled report:', error);
        return { success: false, error: error.message };
    }
}

async function sendReportEmail(recipients, reportInfo) {
    // This would use SendGrid, Nodemailer, or Firebase Email Extension
    console.log('Sending email to:', recipients);
    console.log('Report info:', reportInfo);
    
    // In Cloud Function, would use:
    // - SendGrid API
    // - Firebase Email Extension
    // - Nodemailer with SMTP
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(date) {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

window.loadScheduledReports = loadScheduledReports;
window.createScheduledReport = createScheduledReport;
window.editSchedule = editSchedule;
window.toggleSchedule = toggleSchedule;
window.runScheduleNow = runScheduleNow;
window.deleteSchedule = deleteSchedule;
