/**
 * ============================================
 * MICROTECH ANALYTICS - CLOUD FUNCTIONS
 * ============================================
 * 
 * Firebase Cloud Functions for:
 * - Scheduled report execution
 * - Aggregated data calculations
 * - Email delivery (SendGrid integration)
 * - Large data exports
 * 
 * Deploy with: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { jsPDF } = require('jspdf');
const Papa = require('papaparse');
const sgMail = require('@sendgrid/mail');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize SendGrid
sgMail.setApiKey(functions.config().sendgrid.key);

// ============================================
// SCHEDULED REPORTS EXECUTION
// ============================================

/**
 * Cloud Scheduler trigger (runs every hour to check for due reports)
 * Set up Cloud Scheduler job to trigger this function
 */
exports.checkScheduledReports = functions.pubsub
    .schedule('every 1 hours')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        console.log('Checking for scheduled reports...');

        try {
            const now = admin.firestore.Timestamp.now();
            
            // Get all active schedules that are due
            const schedulesSnapshot = await db.collection('scheduled_reports')
                .where('active', '==', true)
                .where('nextRun', '<=', now)
                .get();

            console.log(`Found ${schedulesSnapshot.size} reports to execute`);

            const promises = schedulesSnapshot.docs.map(async (doc) => {
                const schedule = { id: doc.id, ...doc.data() };
                try {
                    await executeScheduledReport(schedule);
                    
                    // Update schedule with next run time
                    await doc.ref.update({
                        lastRun: now,
                        nextRun: calculateNextRun(schedule.frequency, schedule.time),
                        runCount: admin.firestore.FieldValue.increment(1)
                    });
                    
                } catch (error) {
                    console.error(`Error executing schedule ${doc.id}:`, error);
                    await doc.ref.update({
                        lastError: error.message,
                        lastErrorTime: now
                    });
                }
            });

            await Promise.all(promises);
            console.log('Scheduled reports check complete');
            
        } catch (error) {
            console.error('Error in checkScheduledReports:', error);
        }

        return null;
    });

/**
 * Execute a scheduled report
 */
async function executeScheduledReport(schedule) {
    console.log(`Executing report: ${schedule.name}`);

    // 1. Generate report data
    const reportData = await generateReportData(schedule.reportType, schedule.filters);

    // 2. Create file(s) based on format
    const attachments = [];

    if (schedule.format === 'pdf' || schedule.format === 'both') {
        const pdfBuffer = await generatePDFReport(schedule.name, reportData);
        attachments.push({
            content: pdfBuffer.toString('base64'),
            filename: `${schedule.name.replace(/\s/g, '_')}_${Date.now()}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
        });
    }

    if (schedule.format === 'csv' || schedule.format === 'both') {
        const csvContent = generateCSVReport(reportData);
        attachments.push({
            content: Buffer.from(csvContent).toString('base64'),
            filename: `${schedule.name.replace(/\s/g, '_')}_${Date.now()}.csv`,
            type: 'text/csv',
            disposition: 'attachment'
        });
    }

    // 3. Send email to recipients
    await sendReportEmail(schedule.recipients, schedule.name, attachments);

    console.log(`Report executed successfully: ${schedule.name}`);
}

/**
 * Generate report data based on type
 */
async function generateReportData(reportType, filters = {}) {
    const { startDate, endDate, division } = filters;

    switch (reportType) {
        case 'daily-collection':
            return await getDailyCollectionData();
        
        case 'monthly-revenue':
            return await getMonthlyRevenueData();
        
        case 'overdue-fees':
            return await getOverdueFeesData();
        
        case 'course-enrollment':
            return await getCourseEnrollmentData();
        
        default:
            throw new Error(`Unknown report type: ${reportType}`);
    }
}

async function getDailyCollectionData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const snapshot = await db.collection('fees')
        .where('paymentDate', '>=', admin.firestore.Timestamp.fromDate(today))
        .where('paymentDate', '<', admin.firestore.Timestamp.fromDate(tomorrow))
        .get();

    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Group by division
    const summary = {};
    let totalAmount = 0;

    transactions.forEach(txn => {
        const div = txn.division || 'Others';
        if (!summary[div]) {
            summary[div] = { count: 0, amount: 0 };
        }
        summary[div].count++;
        summary[div].amount += txn.paidAmount || 0;
        totalAmount += txn.paidAmount || 0;
    });

    return {
        date: today.toLocaleDateString('en-IN'),
        totalTransactions: transactions.length,
        totalAmount,
        divisions: summary,
        transactions
    };
}

async function getMonthlyRevenueData() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const snapshot = await db.collection('fees')
        .where('paymentDate', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
        .get();

    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const divisionRevenue = {};
    transactions.forEach(txn => {
        const div = txn.division || 'Others';
        divisionRevenue[div] = (divisionRevenue[div] || 0) + (txn.paidAmount || 0);
    });

    return {
        month: startOfMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        divisions: divisionRevenue,
        total: transactions.reduce((sum, txn) => sum + (txn.paidAmount || 0), 0)
    };
}

async function getOverdueFeesData() {
    const snapshot = await db.collection('fees')
        .where('balance', '>', 0)
        .get();

    const overdueStudents = [];
    const today = new Date();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.dueDate && data.dueDate.toDate() < today) {
            const daysOverdue = Math.ceil((today - data.dueDate.toDate()) / (1000 * 60 * 60 * 24));
            overdueStudents.push({
                id: doc.id,
                ...data,
                daysOverdue
            });
        }
    });

    overdueStudents.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return {
        totalOverdue: overdueStudents.length,
        totalAmount: overdueStudents.reduce((sum, s) => sum + (s.balance || 0), 0),
        students: overdueStudents
    };
}

async function getCourseEnrollmentData() {
    const snapshot = await db.collection('students').get();
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const courseStats = {};
    students.forEach(student => {
        const course = student.course || 'Unassigned';
        if (!courseStats[course]) {
            courseStats[course] = {
                enrollments: 0,
                division: student.division || '-'
            };
        }
        courseStats[course].enrollments++;
    });

    return {
        totalStudents: students.length,
        courses: courseStats
    };
}

// ============================================
// FILE GENERATION
// ============================================

async function generatePDFReport(title, data) {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 28);

    // Add data (simplified - would need to format based on report type)
    doc.setFontSize(12);
    let y = 40;
    doc.text(JSON.stringify(data, null, 2), 14, y);

    return Buffer.from(doc.output('arraybuffer'));
}

function generateCSVReport(data) {
    // Convert data to CSV format
    if (data.transactions && Array.isArray(data.transactions)) {
        return Papa.unparse(data.transactions);
    }
    
    // For summary reports, create a simple format
    const rows = Object.entries(data).map(([key, value]) => ({
        Field: key,
        Value: typeof value === 'object' ? JSON.stringify(value) : value
    }));
    
    return Papa.unparse(rows);
}

// ============================================
// EMAIL DELIVERY
// ============================================

async function sendReportEmail(recipients, reportName, attachments) {
    const msg = {
        to: recipients,
        from: 'reports@microtech.com', // Verified sender
        subject: `MicroTech Report: ${reportName}`,
        text: `Please find attached the ${reportName} report.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #3b82f6;">MicroTech Admin Panel</h2>
                <p>Your scheduled report <strong>${reportName}</strong> has been generated.</p>
                <p>Please find the report attached to this email.</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">
                    This is an automated email from MicroTech Admin Panel.<br>
                    Generated on ${new Date().toLocaleString('en-IN')}
                </p>
            </div>
        `,
        attachments
    };

    try {
        await sgMail.sendMultiple(msg);
        console.log(`Email sent to: ${recipients.join(', ')}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// ============================================
// AGGREGATION FUNCTIONS
// ============================================

/**
 * Daily aggregation to speed up dashboard loads
 * Runs at 1 AM every day
 */
exports.aggregateDailyRevenue = functions.pubsub
    .schedule('0 1 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        console.log('Running daily revenue aggregation...');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const today = new Date(yesterday);
        today.setDate(today.getDate() + 1);

        try {
            const snapshot = await db.collection('fees')
                .where('paymentDate', '>=', admin.firestore.Timestamp.fromDate(yesterday))
                .where('paymentDate', '<', admin.firestore.Timestamp.fromDate(today))
                .get();

            const divisionTotals = {};
            let totalRevenue = 0;
            let totalTransactions = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const division = data.division || 'Others';
                
                divisionTotals[division] = (divisionTotals[division] || 0) + (data.paidAmount || 0);
                totalRevenue += data.paidAmount || 0;
                totalTransactions++;
            });

            // Save aggregated data
            const dateKey = yesterday.toISOString().split('T')[0];
            await db.collection('daily_revenue').doc(dateKey).set({
                date: admin.firestore.Timestamp.fromDate(yesterday),
                totalRevenue,
                totalTransactions,
                divisions: divisionTotals,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Daily aggregation complete for ${dateKey}`);
            
        } catch (error) {
            console.error('Error in daily aggregation:', error);
        }

        return null;
    });

/**
 * Monthly aggregation
 * Runs on the 1st of every month at 2 AM
 */
exports.aggregateMonthlyRevenue = functions.pubsub
    .schedule('0 2 1 * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        console.log('Running monthly revenue aggregation...');

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1);
        lastMonth.setHours(0, 0, 0, 0);
        
        const thisMonth = new Date(lastMonth);
        thisMonth.setMonth(thisMonth.getMonth() + 1);

        try {
            const snapshot = await db.collection('fees')
                .where('paymentDate', '>=', admin.firestore.Timestamp.fromDate(lastMonth))
                .where('paymentDate', '<', admin.firestore.Timestamp.fromDate(thisMonth))
                .get();

            const courseRevenue = {};
            const divisionRevenue = {};
            let totalRevenue = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const amount = data.paidAmount || 0;
                
                const division = data.division || 'Others';
                const course = data.course || 'Unknown';
                
                divisionRevenue[division] = (divisionRevenue[division] || 0) + amount;
                courseRevenue[course] = (courseRevenue[course] || 0) + amount;
                totalRevenue += amount;
            });

            // Save aggregated data
            const monthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
            await db.collection('monthly_revenue').doc(monthKey).set({
                month: admin.firestore.Timestamp.fromDate(lastMonth),
                totalRevenue,
                divisions: divisionRevenue,
                courses: courseRevenue,
                transactionCount: snapshot.size,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Monthly aggregation complete for ${monthKey}`);
            
        } catch (error) {
            console.error('Error in monthly aggregation:', error);
        }

        return null;
    });

// ============================================
// LARGE EXPORT HANDLER
// ============================================

/**
 * Handle large data exports (called from client)
 * Stores file in Cloud Storage and sends download link
 */
exports.handleLargeExport = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { format, filters, email } = data;

    try {
        // Fetch data based on filters
        let query = db.collection('fees');
        
        if (filters.division) {
            query = query.where('division', '==', filters.division);
        }
        if (filters.startDate) {
            query = query.where('paymentDate', '>=', admin.firestore.Timestamp.fromDate(new Date(filters.startDate)));
        }
        if (filters.endDate) {
            query = query.where('paymentDate', '<=', admin.firestore.Timestamp.fromDate(new Date(filters.endDate)));
        }

        const snapshot = await query.get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Generate file
        let fileBuffer;
        let contentType;
        let filename;

        if (format === 'csv') {
            fileBuffer = Buffer.from(Papa.unparse(data));
            contentType = 'text/csv';
            filename = `export_${Date.now()}.csv`;
        } else if (format === 'pdf') {
            fileBuffer = await generatePDFReport('Data Export', { transactions: data });
            contentType = 'application/pdf';
            filename = `export_${Date.now()}.pdf`;
        }

        // Upload to Cloud Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(`exports/${filename}`);
        
        await file.save(fileBuffer, {
            contentType,
            metadata: {
                exportedBy: context.auth.uid,
                exportedAt: new Date().toISOString()
            }
        });

        // Get signed URL (valid for 1 hour)
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000 // 1 hour
        });

        // Send email with download link if requested
        if (email) {
            await sgMail.send({
                to: email,
                from: 'reports@microtech.com',
                subject: 'Your MicroTech Export is Ready',
                html: `
                    <p>Your export is ready for download.</p>
                    <p><a href="${url}">Click here to download</a></p>
                    <p>This link will expire in 1 hour.</p>
                `
            });
        }

        return {
            success: true,
            downloadUrl: url,
            filename,
            recordCount: data.length
        };
        
    } catch (error) {
        console.error('Error in large export:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateNextRun(frequency, time) {
    const [hours, minutes] = time.split(':').map(Number);
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
        if (nextRun <= new Date()) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
    } else if (frequency === 'weekly') {
        const daysUntilMonday = (8 - nextRun.getDay()) % 7;
        nextRun.setDate(nextRun.getDate() + daysUntilMonday);
        if (nextRun <= new Date()) {
            nextRun.setDate(nextRun.getDate() + 7);
        }
    } else if (frequency === 'monthly') {
        nextRun.setMonth(nextRun.getMonth() + 1, 1);
    }

    return admin.firestore.Timestamp.fromDate(nextRun);
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    checkScheduledReports: exports.checkScheduledReports,
    aggregateDailyRevenue: exports.aggregateDailyRevenue,
    aggregateMonthlyRevenue: exports.aggregateMonthlyRevenue,
    handleLargeExport: exports.handleLargeExport
};
