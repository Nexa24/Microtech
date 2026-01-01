/**
 * ============================================
 * RECEIPT TEMPLATE MODULE - MICROTECH CENTER
 * ============================================
 * Shared module for generating professional fee receipts
 * Compatible with Fee Management and Receipt Management systems
 */

/**
 * Generate Receipt HTML
 * @param {Object} data - Receipt data object
 * @returns {string} - Complete HTML string for the receipt
 */
export function generateReceiptHTML(data) {
    const {
        receiptNo,
        receiptDate,
        studentName,
        studentId,
        division,
        course,
        totalFee,
        amountPaid,
        balance,
        paymentMode,
        paymentDate,
        counselor,
        feeType,
        notes,
        transactionID
    } = data;

    // Format currency
    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Payment mode display names
    const paymentModes = {
        'cash': 'Cash',
        'upi': 'UPI',
        'card': 'Card / Debit Card / Credit Card',
        'bank': 'Bank Transfer',
        'cheque': 'Cheque',
        'dd': 'Demand Draft'
    };

    // Division display names
    const divisionNames = {
        'gama': 'Gama Abacus',
        'lbs': 'LBS Skill Centre',
        'capt': 'CAPT',
        'other': 'Other'
    };

    // Fee type display names
    const feeTypes = {
        'admission': 'Admission Fee',
        'monthly': 'Monthly Fee',
        'installment': 'Installment',
        'exam': 'Exam Fee',
        'certificate': 'Certificate Fee',
        'other': 'Other'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Receipt - ${receiptNo}</title>
    <style>
        ${getReceiptStyles()}
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- Header Section -->
        <div class="receipt-header">
            <div class="logo-section">
                <div class="logo-icon">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="60" height="60" rx="12" fill="#667eea"/>
                        <path d="M30 15L45 25V40L30 50L15 40V25L30 15Z" fill="white"/>
                        <path d="M30 20L40 27V38L30 45L20 38V27L30 20Z" fill="#667eea"/>
                    </svg>
                </div>
                <div class="logo-text">
                    <h1>MicroTech Center</h1>
                    <p class="tagline">Excellence in Technical Education</p>
                </div>
            </div>
            <div class="contact-info">
                <p><strong>Address:</strong> 123 Main Street, Mumbai, Maharashtra 400001</p>
                <p><strong>Phone:</strong> +91 1234567890 | <strong>Email:</strong> info@microtech.com</p>
                <p><strong>Website:</strong> www.microtech.com</p>
            </div>
        </div>

        <!-- Receipt Title -->
        <div class="receipt-title">
            <h2>OFFICIAL FEE RECEIPT</h2>
            <div class="receipt-number">Receipt No: <strong>${receiptNo || 'N/A'}</strong></div>
        </div>

        <!-- Student & Payment Details Grid -->
        <div class="details-grid">
            <!-- Student Details -->
            <div class="details-section">
                <h3>Student Details</h3>
                <table class="info-table">
                    <tr>
                        <td class="label">Student Name:</td>
                        <td class="value"><strong>${studentName || 'N/A'}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Student ID:</td>
                        <td class="value">${studentId || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Division:</td>
                        <td class="value">${divisionNames[division] || division || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Course:</td>
                        <td class="value">${course || 'N/A'}</td>
                    </tr>
                </table>
            </div>

            <!-- Payment Details -->
            <div class="details-section">
                <h3>Payment Details</h3>
                <table class="info-table">
                    <tr>
                        <td class="label">Receipt Date:</td>
                        <td class="value">${formatDate(receiptDate || paymentDate)}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment Mode:</td>
                        <td class="value">${paymentModes[paymentMode] || paymentMode || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Fee Type:</td>
                        <td class="value">${feeTypes[feeType] || feeType || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Processed By:</td>
                        <td class="value">${counselor || 'Admin'}</td>
                    </tr>
                    ${transactionID ? `
                    <tr>
                        <td class="label">Transaction ID:</td>
                        <td class="value">${transactionID}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
        </div>

        <!-- Payment Breakdown Table -->
        <div class="payment-breakdown">
            <h3>Payment Breakdown</h3>
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total Course Fee</td>
                        <td class="text-right">${formatCurrency(totalFee)}</td>
                    </tr>
                    <tr class="highlight-row">
                        <td><strong>Amount Paid (This Transaction)</strong></td>
                        <td class="text-right"><strong>${formatCurrency(amountPaid)}</strong></td>
                    </tr>
                    <tr class="balance-row">
                        <td><strong>Balance Remaining</strong></td>
                        <td class="text-right"><strong>${formatCurrency(balance)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        ${notes ? `
        <!-- Notes Section -->
        <div class="notes-section">
            <h3>Notes / Remarks</h3>
            <p>${notes}</p>
        </div>
        ` : ''}

        <!-- QR Code Placeholder -->
        <div class="qr-section">
            <div class="qr-placeholder">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="#f3f4f6"/>
                    <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#6b7280">QR Code</text>
                    <text x="50" y="65" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#9ca3af">Scan to Verify</text>
                </svg>
            </div>
            <p class="qr-text">Scan to verify receipt authenticity</p>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line"></div>
                <p>Student / Parent Signature</p>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <p>Authorized Signature - MicroTech Center</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="receipt-footer">
            <p class="footer-note"><strong>This is a computer-generated receipt and does not require a physical signature.</strong></p>
            <p class="footer-info">For any queries, please contact us at info@microtech.com or call +91 1234567890</p>
            <p class="footer-thank">Thank you for choosing MicroTech Center!</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Get Receipt Styles
 * @returns {string} - CSS styles for the receipt (print-optimized)
 */
export function getReceiptStyles() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f9fafb;
            padding: 20px;
            color: #000000;
        }

        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Header Section */
        .receipt-header {
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 15px;
        }

        .logo-icon {
            flex-shrink: 0;
        }

        .logo-text h1 {
            font-size: 28px;
            color: #667eea;
            font-weight: 800;
            margin-bottom: 5px;
        }

        .tagline {
            font-size: 14px;
            color: #000000;
            font-style: italic;
        }

        .contact-info {
            font-size: 12px;
            color: #000000;
            line-height: 1.6;
        }

        .contact-info p {
            margin: 3px 0;
        }

        /* Receipt Title */
        .receipt-title {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            color: white;
        }

        .receipt-title h2 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }

        .receipt-number {
            font-size: 16px;
            opacity: 0.95;
        }

        /* Details Grid */
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .details-section {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            background: #f9fafb;
        }

        .details-section h3 {
            font-size: 16px;
            color: #667eea;
            margin-bottom: 15px;
            font-weight: 700;
            border-bottom: 2px solid #667eea;
            padding-bottom: 8px;
        }

        .info-table {
            width: 100%;
            font-size: 14px;
        }

        .info-table tr {
            border-bottom: 1px solid #e5e7eb;
        }

        .info-table tr:last-child {
            border-bottom: none;
        }

        .info-table td {
            padding: 8px 0;
        }

        .info-table .label {
            color: #000000;
            width: 40%;
        }

        .info-table .value {
            color: #000000;
            font-weight: 500;
        }

        /* Payment Breakdown */
        .payment-breakdown {
            margin-bottom: 30px;
        }

        .payment-breakdown h3 {
            font-size: 18px;
            color: #000000;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        .breakdown-table thead {
            background: #667eea;
            color: white;
        }

        .breakdown-table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }

        .breakdown-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #000000;
        }

        .breakdown-table .text-right {
            text-align: right;
        }

        .breakdown-table .highlight-row {
            background: #fef3c7;
        }

        .breakdown-table .balance-row {
            background: #dbeafe;
            font-size: 16px;
        }

        /* Notes Section */
        .notes-section {
            margin-bottom: 30px;
            padding: 15px;
            background: #f9fafb;
            border-left: 4px solid #667eea;
            border-radius: 4px;
        }

        .notes-section h3 {
            font-size: 14px;
            color: #667eea;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .notes-section p {
            font-size: 13px;
            color: #000000;
            line-height: 1.6;
        }

        /* QR Section */
        .qr-section {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }

        .qr-placeholder {
            display: inline-block;
            margin-bottom: 10px;
        }

        .qr-text {
            font-size: 12px;
            color: #000000;
        }

        /* Signature Section */
        .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
            padding-top: 40px;
        }

        .signature-box {
            text-align: center;
        }

        .signature-line {
            border-top: 2px solid #1f2937;
            margin-bottom: 8px;
        }

        .signature-box p {
            font-size: 12px;
            color: #000000;
            font-weight: 500;
        }

        /* Footer */
        .receipt-footer {
            text-align: center;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
        }

        .footer-note {
            font-size: 12px;
            color: #667eea;
            margin-bottom: 8px;
        }

        .footer-info {
            font-size: 11px;
            color: #000000;
            margin-bottom: 8px;
        }

        .footer-thank {
            font-size: 13px;
            color: #000000;
            font-weight: 600;
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
                padding: 0;
            }

            .receipt-container {
                box-shadow: none;
                border-radius: 0;
                padding: 20px;
            }

            .receipt-title {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .breakdown-table thead {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .highlight-row {
                background: #fef3c7 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .balance-row {
                background: #dbeafe !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .receipt-container {
                padding: 20px;
            }

            .details-grid {
                grid-template-columns: 1fr;
            }

            .signature-section {
                grid-template-columns: 1fr;
                gap: 30px;
            }

            .logo-section {
                flex-direction: column;
                text-align: center;
            }
        }
    `;
}

/**
 * Generate a simple receipt HTML for modal preview (lighter version)
 * @param {Object} data - Receipt data
 * @returns {string} - HTML string
 */
export function generateReceiptPreviewHTML(data) {
    // Use the same function but can be customized for modal display
    return generateReceiptHTML(data);
}
