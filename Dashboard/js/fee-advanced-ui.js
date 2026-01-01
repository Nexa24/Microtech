// ============================================
// ADVANCED FEE MANAGEMENT UI CONTROLLER
// Handles UI interactions for advanced features
// ============================================

import {
    InstallmentManager,
    DiscountManager,
    LateFeeCalculator,
    AdvancePaymentManager,
    FeeBreakdownManager,
    FeeCategoryManager
} from './fee-advanced-features.js';

import studentLoader from './fee-student-loader.js';

// Initialize managers
const installmentManager = new InstallmentManager();
const discountManager = new DiscountManager();
const lateFeeCalculator = new LateFeeCalculator();
const advanceManager = new AdvancePaymentManager();
const breakdownManager = new FeeBreakdownManager();
const categoryManager = new FeeCategoryManager();

// Make managers globally accessible
window.installmentManager = installmentManager;
window.discountManager = discountManager;
window.lateFeeCalculator = lateFeeCalculator;
window.advanceManager = advanceManager;
window.breakdownManager = breakdownManager;
window.categoryManager = categoryManager;

// ============================================
// MODAL UTILITIES
// ============================================

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
};

// ============================================
// FEATURE NAVIGATION
// ============================================

window.openFeature = function(featureName) {
    // Hide all sections
    document.querySelectorAll('.feature-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const section = document.getElementById(`${featureName}-section`);
    if (section) {
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Load data for the section
        loadSectionData(featureName);
    }
};

function loadSectionData(featureName) {
    switch(featureName) {
        case 'installments':
            loadInstallments();
            break;
        case 'discounts':
            loadDiscounts();
            break;
        case 'latefees':
            loadLateFeeConfig();
            break;
        case 'advance':
            loadAdvancePayments();
            break;
        case 'breakdown':
            loadFeeBreakdowns();
            break;
        case 'categories':
            loadFeeCategories();
            break;
    }
}

// ============================================
// INSTALLMENT MANAGEMENT
// ============================================

window.openInstallmentModal = function() {
    document.getElementById('installment-modal').style.display = 'block';
    document.getElementById('inst-start-date').valueAsDate = new Date();
    setupStudentSearch('inst-student-id', 'inst-student-name', 'inst-student-suggestions');
};

// Generate installment preview
window.generateInstallmentPreview = function() {
    const totalFee = parseFloat(document.getElementById('inst-total-fee').value);
    const numberOfInstallments = parseInt(document.getElementById('inst-number').value);
    const startDate = new Date(document.getElementById('inst-start-date').value);
    const interval = parseInt(document.getElementById('inst-interval').value);
    
    if (!totalFee || !numberOfInstallments || !startDate || !interval) {
        showToast('Please fill all required fields', 'warning');
        return;
    }
    
    const installments = installmentManager.generateInstallments(
        totalFee,
        numberOfInstallments,
        startDate,
        interval
    );
    
    const previewBody = document.getElementById('installment-preview-body');
    previewBody.innerHTML = installments.map(inst => `
        <tr>
            <td>${inst.installmentNumber}</td>
            <td>₹${inst.amount.toLocaleString()}</td>
            <td>${formatDate(inst.dueDate)}</td>
            <td><span class="status-badge status-pending">Pending</span></td>
        </tr>
    `).join('');
    
    document.getElementById('installment-preview').style.display = 'block';
    showToast('Schedule generated successfully!', 'success');
};

// Handle installment form submission
document.addEventListener('DOMContentLoaded', () => {
    const installmentForm = document.getElementById('installment-form');
    if (installmentForm) {
        installmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const totalFee = parseFloat(document.getElementById('inst-total-fee').value);
            const numberOfInstallments = parseInt(document.getElementById('inst-number').value);
            const startDate = new Date(document.getElementById('inst-start-date').value);
            const interval = parseInt(document.getElementById('inst-interval').value);
            
            const installments = installmentManager.generateInstallments(
                totalFee,
                numberOfInstallments,
                startDate,
                interval
            );
            
            try {
                const planId = await installmentManager.createInstallmentPlan({
                    studentId: document.getElementById('inst-student-id').value,
                    studentName: document.getElementById('inst-student-name').value,
                    course: document.getElementById('inst-course').value,
                    totalFee: totalFee,
                    numberOfInstallments: numberOfInstallments,
                    installments: installments,
                    createdBy: 'admin'
                });
                
                showToast('Installment plan created successfully!', 'success');
                closeModal('installment-modal');
                installmentForm.reset();
                loadInstallments();
            } catch (error) {
                console.error('Error creating installment plan:', error);
                showToast('Error creating installment plan', 'error');
            }
        });
    }
});

// View installment plan details
window.viewInstallmentDetails = async function(planId) {
    try {
        const modal = document.getElementById('view-installment-modal');
        modal.style.display = 'block';
        
        // Populate with plan details
        document.getElementById('view-inst-student').textContent = 'Loading...';
        document.getElementById('view-inst-course').textContent = 'Loading...';
        document.getElementById('view-inst-total').textContent = 'Loading...';
        document.getElementById('view-inst-paid').textContent = 'Loading...';
        document.getElementById('view-inst-remaining').textContent = 'Loading...';
        
        const scheduleBody = document.getElementById('view-inst-schedule-body');
        scheduleBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
        
        // In a real implementation, fetch from Firebase
        // For now, show sample data
        setTimeout(() => {
            document.getElementById('view-inst-student').textContent = 'John Doe';
            document.getElementById('view-inst-course').textContent = 'Web Development';
            document.getElementById('view-inst-total').textContent = '₹50,000';
            document.getElementById('view-inst-paid').textContent = '₹20,000';
            document.getElementById('view-inst-remaining').textContent = '₹30,000';
            
            scheduleBody.innerHTML = `
                <tr>
                    <td>1</td><td>₹10,000</td><td>2025-01-15</td><td><span class="status-badge status-paid">Paid</span></td>
                </tr>
                <tr>
                    <td>2</td><td>₹10,000</td><td>2025-02-15</td><td><span class="status-badge status-paid">Paid</span></td>
                </tr>
                <tr>
                    <td>3</td><td>₹10,000</td><td>2025-03-15</td><td><span class="status-badge status-pending">Pending</span></td>
                </tr>
                <tr>
                    <td>4</td><td>₹10,000</td><td>2025-04-15</td><td><span class="status-badge status-pending">Pending</span></td>
                </tr>
                <tr>
                    <td>5</td><td>₹10,000</td><td>2025-05-15</td><td><span class="status-badge status-pending">Pending</span></td>
                </tr>
            `;
        }, 500);
    } catch (error) {
        console.error('Error viewing installment details:', error);
        showToast('Error loading installment details', 'error');
    }
};

// Open record installment payment modal
window.openRecordPaymentModal = function(planId) {
    document.getElementById('record-payment-modal').style.display = 'block';
    document.getElementById('record-plan-id').value = planId;
    document.getElementById('record-payment-date').valueAsDate = new Date();
};

// Handle record installment payment form
document.addEventListener('DOMContentLoaded', () => {
    const recordPaymentForm = document.getElementById('record-payment-form');
    if (recordPaymentForm) {
        recordPaymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const planId = document.getElementById('record-plan-id').value;
            const installmentNumber = parseInt(document.getElementById('record-installment-number').value);
            const amountPaid = parseFloat(document.getElementById('record-amount').value);
            const paymentDate = document.getElementById('record-payment-date').value;
            const paymentMode = document.getElementById('record-payment-mode').value;
            const receiptNo = document.getElementById('record-receipt').value;
            const notes = document.getElementById('record-notes').value;
            
            try {
                await installmentManager.recordInstallmentPayment(planId, installmentNumber, {
                    amountPaid,
                    paymentDate,
                    paymentMode,
                    receiptNo,
                    notes,
                    recordedBy: 'admin'
                });
                
                showToast(`Installment #${installmentNumber} payment recorded!`, 'success');
                closeModal('record-payment-modal');
                recordPaymentForm.reset();
                loadInstallments();
            } catch (error) {
                console.error('Error recording payment:', error);
                showToast('Error recording installment payment', 'error');
            }
        });
    }
});

async function loadInstallments() {
    const tbody = document.getElementById('installments-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Loading installment plans...</td></tr>';
    
    try {
        // Import Firebase functions
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        // Fetch all installment plans (without orderBy to avoid index requirement)
        const snapshot = await getDocs(collection(db, 'installmentPlans'));
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No installment plans found. Create your first plan!</td></tr>';
            return;
        }
        
        const plans = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            plans.push({ id: doc.id, ...data });
        });
        
        tbody.innerHTML = plans.map(plan => {
            // Calculate paid installments
            const paidCount = plan.installments?.filter(i => i.status === 'paid').length || 0;
            
            // Calculate remaining amount
            const totalPaid = plan.installments?.reduce((sum, inst) => {
                if (inst.status === 'paid') return sum + inst.amount;
                if (inst.status === 'partial') return sum + (inst.paidAmount || 0);
                return sum;
            }, 0) || 0;
            
            const remaining = plan.totalFee - totalPaid;
            
            return `
                <tr>
                    <td>${plan.studentName || 'N/A'}</td>
                    <td>${plan.course || 'N/A'}</td>
                    <td>₹${(plan.totalFee || 0).toLocaleString()}</td>
                    <td>${plan.numberOfInstallments || 0}</td>
                    <td>${paidCount}</td>
                    <td>₹${remaining.toLocaleString()}</td>
                    <td><span class="status-badge status-${plan.status || 'pending'}">${plan.status || 'pending'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="viewInstallmentDetails('${plan.id}')" title="View Details"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="openRecordPaymentModal('${plan.id}')" title="Record Payment"><i class="fas fa-money-bill"></i></button>
                        <button class="btn-icon" onclick="downloadInstallmentSchedule('${plan.id}')" title="Download"><i class="fas fa-download"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading installments:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error loading data. Please check console.</td></tr>';
    }
}

// ============================================
// DISCOUNT MANAGEMENT
// ============================================

window.openDiscountModal = function() {
    document.getElementById('discount-modal').style.display = 'block';
    setupStudentSearch('disc-student-id', 'disc-student-name', 'disc-student-suggestions');
    updateDiscountPreview();
};

window.openScholarshipModal = function() {
    document.getElementById('scholarship-modal').style.display = 'block';
    document.getElementById('schol-valid-from').valueAsDate = new Date();
};

// Update discount preview calculation
window.updateDiscountPreview = function() {
    const baseFee = parseFloat(document.getElementById('disc-base-fee')?.value || 0);
    const type = document.getElementById('disc-type')?.value;
    const value = parseFloat(document.getElementById('disc-value')?.value || 0);
    
    let discountAmount = 0;
    if (type === 'percentage') {
        discountAmount = (baseFee * value) / 100;
    } else {
        discountAmount = value;
    }
    
    const finalFee = baseFee - discountAmount;
    
    document.getElementById('disc-preview-base').textContent = `₹${baseFee.toLocaleString()}`;
    document.getElementById('disc-preview-discount').textContent = `-₹${discountAmount.toLocaleString()}`;
    document.getElementById('disc-preview-final').textContent = `₹${finalFee.toLocaleString()}`;
};

// Handle discount form submission
document.addEventListener('DOMContentLoaded', () => {
    const discountForm = document.getElementById('discount-form');
    if (discountForm) {
        discountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const discount = await discountManager.applyDiscount({
                    studentId: document.getElementById('disc-student-id').value,
                    studentName: document.getElementById('disc-student-name').value,
                    type: document.getElementById('disc-type').value,
                    value: parseFloat(document.getElementById('disc-value').value),
                    baseFee: parseFloat(document.getElementById('disc-base-fee').value),
                    category: document.getElementById('disc-category').value,
                    reason: document.getElementById('disc-reason').value,
                    course: document.getElementById('disc-course').value,
                    appliedBy: 'admin'
                });
                
                showToast(`Discount of ₹${discount.discountAmount.toLocaleString()} applied successfully!`, 'success');
                closeModal('discount-modal');
                discountForm.reset();
                loadDiscounts();
            } catch (error) {
                console.error('Error applying discount:', error);
                showToast('Error applying discount', 'error');
            }
        });
    }
    
    // Handle scholarship form submission
    const scholarshipForm = document.getElementById('scholarship-form');
    if (scholarshipForm) {
        scholarshipForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const coursesInput = document.getElementById('schol-courses').value;
            const courses = coursesInput ? coursesInput.split(',').map(c => c.trim()) : [];
            
            const divisionsSelect = document.getElementById('schol-divisions');
            const selectedDivisions = Array.from(divisionsSelect.selectedOptions).map(opt => opt.value);
            
            try {
                const scholarshipId = await discountManager.createScholarship({
                    name: document.getElementById('schol-name').value,
                    type: document.getElementById('schol-type').value,
                    discountType: document.getElementById('schol-disc-type').value,
                    discountValue: parseFloat(document.getElementById('schol-disc-value').value),
                    eligibilityCriteria: document.getElementById('schol-criteria').value,
                    maxBeneficiaries: parseInt(document.getElementById('schol-max-beneficiaries').value) || null,
                    validFrom: document.getElementById('schol-valid-from').value,
                    validUntil: document.getElementById('schol-valid-until').value,
                    courses: courses
                });
                
                showToast('Scholarship program created successfully!', 'success');
                closeModal('scholarship-modal');
                scholarshipForm.reset();
                loadDiscounts();
            } catch (error) {
                console.error('Error creating scholarship:', error);
                showToast('Error creating scholarship', 'error');
            }
        });
    }
});

async function loadDiscounts() {
    const tbody = document.getElementById('discounts-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading discounts...</td></tr>';
    
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        // Fetch all discounts (try with status filter first, fallback to all)
        let snapshot;
        try {
            const q = query(collection(db, 'discounts'), where('status', '==', 'active'));
            snapshot = await getDocs(q);
        } catch (error) {
            console.log('Status filter failed, loading all discounts:', error.message);
            // Fallback: load all discounts
            snapshot = await getDocs(collection(db, 'discounts'));
        }
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No discounts found. Click "Apply Discount" to create your first discount!</td></tr>';
            return;
        }
        
        const discounts = [];
        snapshot.forEach(doc => {
            discounts.push({ id: doc.id, ...doc.data() });
        });
        
        tbody.innerHTML = discounts.map(discount => {
            const typeLabel = discount.discountType === 'percentage' ? 'Percentage' : 'Flat Amount';
            const valueDisplay = discount.discountType === 'percentage' 
                ? `${discount.discountValue}%` 
                : `₹${discount.discountValue}`;
            
            // Format date
            let dateStr = 'N/A';
            if (discount.appliedDate) {
                const date = discount.appliedDate.toDate ? discount.appliedDate.toDate() : new Date(discount.appliedDate);
                dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            }
            
            return `
                <tr>
                    <td>${discount.studentName || 'N/A'}</td>
                    <td>${typeLabel}</td>
                    <td>${discount.discountCategory || 'N/A'}</td>
                    <td>${valueDisplay}</td>
                    <td>₹${(discount.discountAmount || 0).toLocaleString()}</td>
                    <td>${dateStr}</td>
                    <td>
                        <button class="btn-icon" onclick="viewDiscountDetails('${discount.id}')" title="View Details"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="removeDiscount('${discount.id}')" title="Remove"><i class="fas fa-trash"></i></button>
                        <button class="btn-icon" onclick="printDiscountCertificate('${discount.id}')" title="Print"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading discounts:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading discounts</td></tr>';
    }
}

// View discount details
window.viewDiscountDetails = async function(discountId) {
    try {
        const modal = document.getElementById('view-discount-modal');
        modal.style.display = 'block';
        
        // Populate with discount details
        document.getElementById('view-disc-student').textContent = 'Loading...';
        document.getElementById('view-disc-type').textContent = 'Loading...';
        document.getElementById('view-disc-category').textContent = 'Loading...';
        document.getElementById('view-disc-value').textContent = 'Loading...';
        document.getElementById('view-disc-amount').textContent = 'Loading...';
        document.getElementById('view-disc-date').textContent = 'Loading...';
        document.getElementById('view-disc-reason').textContent = 'Loading...';
        
        // In a real implementation, fetch from Firebase
        // For now, show sample data
        setTimeout(() => {
            document.getElementById('view-disc-student').textContent = 'Jane Smith';
            document.getElementById('view-disc-type').textContent = 'Percentage';
            document.getElementById('view-disc-category').textContent = 'Early Bird';
            document.getElementById('view-disc-value').textContent = '10%';
            document.getElementById('view-disc-amount').textContent = '₹5,000';
            document.getElementById('view-disc-date').textContent = '2025-01-15';
            document.getElementById('view-disc-reason').textContent = 'Student enrolled within first week of batch opening';
        }, 500);
    } catch (error) {
        console.error('Error viewing discount details:', error);
        showToast('Error loading discount details', 'error');
    }
};

// Remove discount
window.removeDiscount = async function(discountId) {
    if (!confirm('Are you sure you want to remove this discount?')) {
        return;
    }
    
    try {
        // In a real implementation, update Firebase
        showToast('Discount removed successfully!', 'success');
        loadDiscounts();
    } catch (error) {
        console.error('Error removing discount:', error);
        showToast('Error removing discount', 'error');
    }
};

// ============================================
// LATE FEE SYSTEM
// ============================================

function loadLateFeeConfig() {
    // Load saved rules from localStorage or use defaults
    const divisions = ['gama', 'lbs', 'capt'];
    
    divisions.forEach(division => {
        const ruleType = document.getElementById(`${division}-rule-type`);
        const ruleDetails = document.getElementById(`${division}-rule-details`);
        
        if (ruleType) {
            ruleType.addEventListener('change', () => {
                updateRuleDetails(division, ruleType.value);
            });
            
            // Initialize with default
            updateRuleDetails(division, ruleType.value);
        }
    });
}

function updateRuleDetails(division, ruleType) {
    const detailsContainer = document.getElementById(`${division}-rule-details`);
    if (!detailsContainer) return;
    
    let html = '';
    
    switch(ruleType) {
        case 'fixed-per-day':
            html = `
                <div class="form-group">
                    <label>Amount Per Day (₹)</label>
                    <input type="number" id="${division}-per-day-amount" placeholder="10" value="10">
                </div>
                <div class="form-group">
                    <label>Maximum Late Fee (₹)</label>
                    <input type="number" id="${division}-max-late-fee" placeholder="500" value="500">
                </div>
            `;
            break;
            
        case 'percentage-per-day':
            html = `
                <div class="form-group">
                    <label>Percentage Per Day (%)</label>
                    <input type="number" step="0.1" id="${division}-percentage" placeholder="0.5" value="0.5">
                </div>
                <div class="form-group">
                    <label>Maximum Late Fee (₹)</label>
                    <input type="number" id="${division}-max-late-fee" placeholder="1500" value="1500">
                </div>
            `;
            break;
            
        case 'tiered':
            html = `
                <div class="form-group">
                    <label>Tier 1 (0-7 days) - ₹ per day</label>
                    <input type="number" id="${division}-tier1" placeholder="10" value="10">
                </div>
                <div class="form-group">
                    <label>Tier 2 (8-30 days) - ₹ per day</label>
                    <input type="number" id="${division}-tier2" placeholder="20" value="20">
                </div>
                <div class="form-group">
                    <label>Tier 3 (>30 days) - ₹ per day</label>
                    <input type="number" id="${division}-tier3" placeholder="50" value="50">
                </div>
                <div class="form-group">
                    <label>Maximum Late Fee (₹)</label>
                    <input type="number" id="${division}-max-late-fee" placeholder="2000" value="2000">
                </div>
            `;
            break;
            
        case 'fixed-one-time':
            html = `
                <div class="form-group">
                    <label>Fixed Late Fee Amount (₹)</label>
                    <input type="number" id="${division}-fixed-amount" placeholder="100" value="100">
                </div>
            `;
            break;
    }
    
    detailsContainer.innerHTML = html;
}

window.saveLateFeeRules = function() {
    const divisions = ['gama', 'lbs', 'capt'];
    const rules = {};
    
    divisions.forEach(division => {
        const ruleType = document.getElementById(`${division}-rule-type`).value;
        rules[division] = {
            type: ruleType
        };
        
        // Collect rule-specific values
        if (ruleType === 'fixed-per-day') {
            rules[division].amountPerDay = parseFloat(document.getElementById(`${division}-per-day-amount`)?.value || 10);
            rules[division].maxLateFee = parseFloat(document.getElementById(`${division}-max-late-fee`)?.value || 500);
        } else if (ruleType === 'percentage-per-day') {
            rules[division].percentagePerDay = parseFloat(document.getElementById(`${division}-percentage`)?.value || 0.5);
            rules[division].maxLateFee = parseFloat(document.getElementById(`${division}-max-late-fee`)?.value || 1500);
        } else if (ruleType === 'tiered') {
            rules[division].tier1 = parseFloat(document.getElementById(`${division}-tier1`)?.value || 10);
            rules[division].tier2 = parseFloat(document.getElementById(`${division}-tier2`)?.value || 20);
            rules[division].tier3 = parseFloat(document.getElementById(`${division}-tier3`)?.value || 50);
            rules[division].maxLateFee = parseFloat(document.getElementById(`${division}-max-late-fee`)?.value || 2000);
        } else if (ruleType === 'fixed-one-time') {
            rules[division].fixedAmount = parseFloat(document.getElementById(`${division}-fixed-amount`)?.value || 100);
        }
    });
    
    // Save to localStorage
    localStorage.setItem('lateFeeRules', JSON.stringify(rules));
    showToast('Late fee rules saved successfully!', 'success');
};

window.calculateLateFee = function() {
    const division = document.getElementById('calc-division').value;
    const amount = parseFloat(document.getElementById('calc-amount').value);
    const dueDate = document.getElementById('calc-due-date').value;
    
    if (!amount || !dueDate) {
        showToast('Please enter amount and due date', 'warning');
        return;
    }
    
    // Get rules for division
    const savedRules = JSON.parse(localStorage.getItem('lateFeeRules') || '{}');
    const rules = savedRules[division] || lateFeeCalculator.getDefaultRules(division);
    
    // Calculate late fee
    const result = lateFeeCalculator.calculateLateFee({
        amount: amount,
        dueDate: dueDate
    }, rules);
    
    // Display result
    const resultDiv = document.getElementById('calc-result');
    resultDiv.innerHTML = `
        <h4><i class="fas fa-check-circle"></i> Late Fee Calculation Result</h4>
        <div class="result-grid">
            <div class="result-item">
                <div class="result-label">Days Late</div>
                <div class="result-value">${result.daysLate}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Original Fee</div>
                <div class="result-value">₹${amount.toLocaleString()}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Late Fee</div>
                <div class="result-value text-warning">₹${result.lateFeeAmount.toLocaleString()}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Total Amount</div>
                <div class="result-value">₹${result.totalAmount.toLocaleString()}</div>
            </div>
        </div>
        <p style="margin-top: 16px; font-size: 14px; opacity: 0.9;">
            <i class="fas fa-info-circle"></i> Method: ${result.calculationMethod}
        </p>
    `;
    resultDiv.classList.add('show');
};

// ============================================
// ADVANCE PAYMENTS
// ============================================

window.openAdvancePaymentModal = function() {
    document.getElementById('advance-modal').style.display = 'block';
    document.getElementById('adv-date').valueAsDate = new Date();
    setupStudentSearch('adv-student-id', 'adv-student-name', 'adv-student-suggestions');
};

// Handle advance payment form submission
document.addEventListener('DOMContentLoaded', () => {
    const advanceForm = document.getElementById('advance-form');
    if (advanceForm) {
        advanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const receiptNo = document.getElementById('adv-receipt').value || 
                            `ADV-${Date.now().toString().slice(-8)}`;
            
            try {
                const advanceId = await advanceManager.recordAdvancePayment({
                    studentId: document.getElementById('adv-student-id').value,
                    studentName: document.getElementById('adv-student-name').value,
                    amount: parseFloat(document.getElementById('adv-amount').value),
                    paymentDate: document.getElementById('adv-date').value,
                    paymentMode: document.getElementById('adv-mode').value,
                    receiptNo: receiptNo,
                    notes: document.getElementById('adv-notes').value,
                    createdBy: 'admin'
                });
                
                showToast(`Advance payment of ₹${document.getElementById('adv-amount').value} recorded!`, 'success');
                closeModal('advance-modal');
                advanceForm.reset();
                loadAdvancePayments();
            } catch (error) {
                console.error('Error recording advance payment:', error);
                showToast('Error recording advance payment', 'error');
            }
        });
    }
});

async function loadAdvancePayments() {
    const tbody = document.getElementById('advance-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading advance payments...</td></tr>';
    
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        // Load all advance payments (without orderBy to avoid index requirement)
        const snapshot = await getDocs(collection(db, 'advancePayments'));
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No advance payments found. Click "Record Advance" to add your first payment!</td></tr>';
            return;
        }
        
        const advances = [];
        snapshot.forEach(doc => {
            advances.push({ id: doc.id, ...doc.data() });
        });
        
        tbody.innerHTML = advances.map(adv => {
            let dateStr = 'N/A';
            if (adv.paymentDate) {
                const date = typeof adv.paymentDate === 'string' ? new Date(adv.paymentDate) : adv.paymentDate.toDate();
                dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            }
            
            const statusClass = adv.remainingBalance > 0 ? 'available' : 'fully-used';
            const statusText = adv.status || statusClass;
            
            return `
                <tr>
                    <td>${adv.studentName || 'N/A'}</td>
                    <td>₹${(adv.amount || 0).toLocaleString()}</td>
                    <td>₹${(adv.usedAmount || 0).toLocaleString()}</td>
                    <td class="text-success">₹${(adv.remainingBalance || 0).toLocaleString()}</td>
                    <td>${dateStr}</td>
                    <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn-icon" onclick="openAdjustAdvanceModal('${adv.id}', '${adv.studentName}', ${adv.remainingBalance})" title="Adjust"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="viewAdvanceHistory('${adv.id}')" title="View History"><i class="fas fa-history"></i></button>
                        <button class="btn-icon" onclick="printAdvanceReceipt('${adv.id}')" title="Print Receipt"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading advance payments:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading data</td></tr>';
    }
}

// Open adjust advance modal
window.openAdjustAdvanceModal = function(studentId, studentName, availableBalance) {
    document.getElementById('adjust-modal').style.display = 'block';
    document.getElementById('adjust-student-name-display').textContent = studentName;
    document.getElementById('adjust-available-balance').textContent = `₹${availableBalance.toLocaleString()}`;
    document.getElementById('adjust-student-id').value = studentId;
    document.getElementById('adjust-max-amount').value = availableBalance;
};

// Handle adjust advance form
document.addEventListener('DOMContentLoaded', () => {
    const adjustForm = document.getElementById('adjust-advance-form');
    if (adjustForm) {
        adjustForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentId = document.getElementById('adjust-student-id').value;
            const adjustAmount = parseFloat(document.getElementById('adjust-amount').value);
            const description = document.getElementById('adjust-description').value;
            
            try {
                await advanceManager.adjustAdvancePayment(studentId, adjustAmount, description);
                showToast(`Advance payment of ₹${adjustAmount.toLocaleString()} adjusted successfully!`, 'success');
                closeModal('adjust-modal');
                loadAdvancePayments();
            } catch (error) {
                console.error('Error adjusting advance:', error);
                showToast('Error adjusting advance payment', 'error');
            }
        });
    }
});

// View advance payment history
window.viewAdvanceHistory = async function(advanceId) {
    try {
        const modal = document.getElementById('view-advance-modal');
        modal.style.display = 'block';
        
        // Populate with advance details
        document.getElementById('view-adv-student').textContent = 'Loading...';
        document.getElementById('view-adv-amount').textContent = 'Loading...';
        document.getElementById('view-adv-date').textContent = 'Loading...';
        document.getElementById('view-adv-mode').textContent = 'Loading...';
        document.getElementById('view-adv-receipt').textContent = 'Loading...';
        document.getElementById('view-adv-balance').textContent = 'Loading...';
        
        // In a real implementation, fetch from Firebase
        // For now, show sample data
        setTimeout(() => {
            document.getElementById('view-adv-student').textContent = 'Mike Johnson';
            document.getElementById('view-adv-amount').textContent = '₹20,000';
            document.getElementById('view-adv-date').textContent = '2025-01-10';
            document.getElementById('view-adv-mode').textContent = 'UPI';
            document.getElementById('view-adv-receipt').textContent = 'ADV-12345678';
            document.getElementById('view-adv-balance').textContent = '₹15,000';
        }, 500);
    } catch (error) {
        console.error('Error viewing advance history:', error);
        showToast('Error loading advance details', 'error');
    }
}

// ============================================
// FEE BREAKDOWN
// ============================================

window.openBreakdownModal = function() {
    document.getElementById('breakdown-modal').style.display = 'block';
    calculateBreakdownTotal();
};

// Calculate breakdown total
window.calculateBreakdownTotal = function() {
    const admission = parseFloat(document.getElementById('breakdown-admission')?.value || 0);
    const courseFee = parseFloat(document.getElementById('breakdown-course-fee')?.value || 0);
    const exam = parseFloat(document.getElementById('breakdown-exam')?.value || 0);
    const material = parseFloat(document.getElementById('breakdown-material')?.value || 0);
    const lab = parseFloat(document.getElementById('breakdown-lab')?.value || 0);
    const certificate = parseFloat(document.getElementById('breakdown-certificate')?.value || 0);
    
    const total = admission + courseFee + exam + material + lab + certificate;
    document.getElementById('breakdown-total-display').textContent = `₹${total.toLocaleString()}`;
};

// Handle breakdown form submission
document.addEventListener('DOMContentLoaded', () => {
    const breakdownForm = document.getElementById('breakdown-form');
    if (breakdownForm) {
        breakdownForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const admission = parseFloat(document.getElementById('breakdown-admission').value || 0);
            const courseFee = parseFloat(document.getElementById('breakdown-course-fee').value || 0);
            const exam = parseFloat(document.getElementById('breakdown-exam').value || 0);
            const material = parseFloat(document.getElementById('breakdown-material').value || 0);
            const lab = parseFloat(document.getElementById('breakdown-lab').value || 0);
            const certificate = parseFloat(document.getElementById('breakdown-certificate').value || 0);
            
            const totalFee = admission + courseFee + exam + material + lab + certificate;
            
            try {
                const breakdownId = await breakdownManager.createFeeBreakdown({
                    courseId: `COURSE_${Date.now()}`,
                    courseName: document.getElementById('breakdown-course').value,
                    division: document.getElementById('breakdown-division').value,
                    totalFee: totalFee,
                    admissionFee: admission,
                    courseFee: courseFee,
                    examFee: exam,
                    materialFee: material,
                    labFee: lab,
                    certificateFee: certificate,
                    otherFees: []
                });
                
                showToast('Fee breakdown created successfully!', 'success');
                closeModal('breakdown-modal');
                breakdownForm.reset();
                loadFeeBreakdowns();
            } catch (error) {
                console.error('Error creating breakdown:', error);
                showToast('Error creating fee breakdown', 'error');
            }
        });
    }
});

async function loadFeeBreakdowns() {
    const container = document.querySelector('.breakdown-grid');
    if (!container) return;
    
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading fee breakdowns...</div>';
    
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        const q = query(collection(db, 'feeBreakdowns'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No fee breakdowns found. Create your first breakdown!</div>';
            return;
        }
        
        const breakdowns = [];
        snapshot.forEach(doc => {
            breakdowns.push({ id: doc.id, ...doc.data() });
        });
        
        container.innerHTML = breakdowns.map(breakdown => {
            const components = breakdown.components || {};
            
            return `
                <div class="breakdown-card">
                    <h4>
                        ${breakdown.courseName || 'Unnamed Course'}
                        <span style="font-size: 14px; color: #94a3b8;">${(breakdown.division || 'N/A').toUpperCase()}</span>
                    </h4>
                    <ul class="breakdown-components">
                        ${components.admissionFee ? `<li><span>Admission Fee</span><span>₹${components.admissionFee.toLocaleString()}</span></li>` : ''}
                        ${components.courseFee ? `<li><span>Course Fee</span><span>₹${components.courseFee.toLocaleString()}</span></li>` : ''}
                        ${components.examFee ? `<li><span>Exam Fee</span><span>₹${components.examFee.toLocaleString()}</span></li>` : ''}
                        ${components.materialFee ? `<li><span>Material Fee</span><span>₹${components.materialFee.toLocaleString()}</span></li>` : ''}
                        ${components.labFee ? `<li><span>Lab Fee</span><span>₹${components.labFee.toLocaleString()}</span></li>` : ''}
                        ${components.certificateFee ? `<li><span>Certificate Fee</span><span>₹${components.certificateFee.toLocaleString()}</span></li>` : ''}
                        <li style="border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 8px;">
                            <span><strong>Total Fee</strong></span>
                            <span><strong>₹${(breakdown.totalFee || 0).toLocaleString()}</strong></span>
                        </li>
                    </ul>
                    <div style="margin-top: 16px; display: flex; gap: 8px;">
                        <button class="btn-icon" onclick="editBreakdown('${breakdown.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="deleteBreakdown('${breakdown.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        <button class="btn-icon" onclick="duplicateBreakdown('${breakdown.id}')" title="Duplicate"><i class="fas fa-copy"></i></button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading fee breakdowns:', error);
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #dc3545;">Error loading fee breakdowns</div>';
    }
}

// ============================================
// FEE CATEGORIES
// ============================================

window.openCategoryModal = function() {
    document.getElementById('category-modal').style.display = 'block';
};

// Add category from template
window.addCategoryFromTemplate = async function(templateCode) {
    try {
        const templates = categoryManager.getCategoryTemplates();
        const template = templates.find(t => t.code === templateCode);
        
        if (!template) {
            showToast('Template not found', 'error');
            return;
        }
        
        const categoryId = await categoryManager.createCategory({
            name: template.name,
            description: template.description,
            defaultAmount: template.suggestedAmount,
            isOptional: template.isOptional,
            applicableDivisions: ['gama', 'lbs', 'capt'],
            icon: template.icon,
            color: '#4F46E5'
        });
        
        showToast(`${template.name} category added from template!`, 'success');
        loadFeeCategories();
    } catch (error) {
        console.error('Error adding category from template:', error);
        showToast('Error adding category', 'error');
    }
};

// Handle category form submission
document.addEventListener('DOMContentLoaded', () => {
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('cat-name').value;
            const description = document.getElementById('cat-description').value;
            const defaultAmount = parseFloat(document.getElementById('cat-amount').value || 0);
            const isOptional = document.getElementById('cat-optional').checked;
            const icon = document.getElementById('cat-icon').value || 'fa-tag';
            const color = document.getElementById('cat-color').value || '#4F46E5';
            
            // Get selected divisions
            const divisionsSelect = document.getElementById('cat-divisions');
            const selectedDivisions = Array.from(divisionsSelect.selectedOptions).map(opt => opt.value);
            
            try {
                const categoryId = await categoryManager.createCategory({
                    name,
                    description,
                    defaultAmount,
                    isOptional,
                    applicableDivisions: selectedDivisions,
                    icon,
                    color
                });
                
                showToast('Category created successfully!', 'success');
                closeModal('category-modal');
                categoryForm.reset();
                loadFeeCategories();
            } catch (error) {
                console.error('Error creating category:', error);
                showToast('Error creating category', 'error');
            }
        });
    }
});

async function loadFeeCategories() {
    const container = document.getElementById('categories-grid');
    const templatesContainer = document.getElementById('template-buttons');
    
    if (!container || !templatesContainer) return;
    
    // Sample categories
    const sampleCategories = [
        {
            name: 'Admission Fee',
            description: 'One-time enrollment fee',
            icon: 'fa-door-open',
            color: '#3b82f6',
            defaultAmount: 5000
        },
        {
            name: 'Monthly Fee',
            description: 'Recurring monthly payment',
            icon: 'fa-calendar',
            color: '#10b981',
            defaultAmount: 3000
        }
    ];
    
    container.innerHTML = sampleCategories.map(cat => `
        <div class="category-card">
            <div class="category-icon-wrapper" style="background: ${cat.color};">
                <i class="fas ${cat.icon}"></i>
            </div>
            <div class="category-info">
                <h4>${cat.name}</h4>
                <p>${cat.description}</p>
                <small style="color: #667eea; font-weight: 600;">Default: ₹${cat.defaultAmount.toLocaleString()}</small>
            </div>
            <div class="category-actions">
                <button class="btn-icon" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
    
    // Load templates
    const templates = categoryManager.getCategoryTemplates();
    templatesContainer.innerHTML = templates.map(template => `
        <button class="template-btn" onclick="addCategoryFromTemplate('${template.code}')">
            <i class="fas ${template.icon}"></i>
            ${template.name}
        </button>
    `).join('');
}

window.addCategoryFromTemplate = async function(code) {
    const templates = categoryManager.getCategoryTemplates();
    const template = templates.find(t => t.code === code);
    
    if (!template) return;
    
    try {
        await categoryManager.createCategory({
            ...template,
            applicableDivisions: ['all']
        });
        
        showToast(`${template.name} added successfully!`, 'success');
        loadFeeCategories();
    } catch (error) {
        console.error('Error adding category:', error);
        showToast('Error adding category', 'error');
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#fbbf24' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Student search autocomplete
async function setupStudentSearch(studentIdInput, studentNameInput, suggestionsId) {
    const studentIdField = document.getElementById(studentIdInput);
    const studentNameField = document.getElementById(studentNameInput);
    const suggestionsList = document.getElementById(suggestionsId);
    
    if (!studentIdField || !studentNameField || !suggestionsList) {
        console.warn('Student search fields not found');
        return;
    }
    
    // Auto-load students using the student loader
    let allStudents = [];
    try {
        allStudents = await studentLoader.autoLoadStudents();
        console.log(`📚 Loaded ${allStudents.length} students for search`);
    } catch (error) {
        console.error('Error loading students:', error);
    }
    
    // Search on name field input
    studentNameField.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
            return;
        }
        
        const matches = allStudents.filter(student => 
            student.name?.toLowerCase().includes(query) ||
            student.studentId?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query)
        ).slice(0, 10); // Limit to 10 results
        
        if (matches.length === 0) {
            suggestionsList.innerHTML = '<div class="suggestion-item">No students found</div>';
            suggestionsList.style.display = 'block';
            return;
        }
        
        suggestionsList.innerHTML = matches.map(student => `
            <div class="suggestion-item" data-student-id="${student.id}" data-student-name="${student.name || 'Unknown'}">
                <strong>${student.name || 'Unknown'}</strong>
                <small>${student.studentId || ''} - ${student.division || ''}</small>
            </div>
        `).join('');
        suggestionsList.style.display = 'block';
        
        // Handle suggestion click
        suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                studentIdField.value = item.dataset.studentId;
                studentNameField.value = item.dataset.studentName;
                suggestionsList.innerHTML = '';
                suggestionsList.style.display = 'none';
            });
        });
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.student-search')) {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
        }
    });
}

// Tab switching
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-link')) {
        const tabId = e.target.dataset.tab;
        
        // Update tab links
        e.target.parentElement.querySelectorAll('.tab-link').forEach(link => {
            link.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Update tab content
        const parent = e.target.closest('.feature-section');
        parent.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        parent.querySelector(`#${tabId}`).classList.add('active');
    }
});

// ============================================
// ADDITIONAL HELPER FUNCTIONS
// ============================================

// Download installment schedule
window.downloadInstallmentSchedule = async function(planId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        const planDoc = await getDoc(doc(db, 'installmentPlans', planId));
        if (!planDoc.exists()) {
            showToast('Plan not found', 'error');
            return;
        }
        
        const plan = planDoc.data();
        
        // Generate CSV
        let csv = 'Installment Number,Amount,Due Date,Status,Paid Amount,Paid Date\n';
        plan.installments.forEach(inst => {
            csv += `${inst.installmentNumber},${inst.amount},${inst.dueDate},${inst.status},${inst.paidAmount || 0},${inst.paidDate || ''}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `installment_schedule_${plan.studentName}_${Date.now()}.csv`;
        a.click();
        
        showToast('Schedule downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading schedule:', error);
        showToast('Error downloading schedule', 'error');
    }
};

// Print discount certificate
window.printDiscountCertificate = async function(discountId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        const discountDoc = await getDoc(doc(db, 'discounts', discountId));
        if (!discountDoc.exists()) {
            showToast('Discount not found', 'error');
            return;
        }
        
        const discount = discountDoc.data();
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Discount Certificate</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .certificate { max-width: 800px; margin: 0 auto; border: 3px solid #667eea; padding: 40px; text-align: center; }
                    h1 { color: #667eea; margin-bottom: 30px; }
                    .amount { font-size: 36px; font-weight: bold; color: #28a745; margin: 30px 0; }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <h1>Discount Certificate</h1>
                    <p>This certifies that</p>
                    <h2>${discount.studentName}</h2>
                    <p>has been granted a discount of</p>
                    <div class="amount">₹${discount.discountAmount.toLocaleString()}</div>
                    <p>Category: ${discount.discountCategory}</p>
                    <p>Applied on: ${new Date(discount.appliedDate?.toDate?.() || discount.appliedDate).toLocaleDateString()}</p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        console.error('Error printing certificate:', error);
        showToast('Error printing certificate', 'error');
    }
};

// Print advance receipt
window.printAdvanceReceipt = async function(advanceId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        const advanceDoc = await getDoc(doc(db, 'advancePayments', advanceId));
        if (!advanceDoc.exists()) {
            showToast('Advance payment not found', 'error');
            return;
        }
        
        const advance = advanceDoc.data();
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Advance Payment Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                    h1 { color: #667eea; margin: 0; }
                    table { width: 100%; margin: 20px 0; }
                    td { padding: 8px 0; }
                    td:first-child { font-weight: bold; width: 150px; }
                    .amount { font-size: 24px; text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h1>Micro Tech Center</h1>
                        <p>Advance Payment Receipt</p>
                    </div>
                    <table>
                        <tr><td>Receipt No:</td><td>${advance.receiptNo}</td></tr>
                        <tr><td>Student Name:</td><td>${advance.studentName}</td></tr>
                        <tr><td>Payment Date:</td><td>${new Date(advance.paymentDate).toLocaleDateString()}</td></tr>
                        <tr><td>Payment Mode:</td><td>${advance.paymentMode}</td></tr>
                    </table>
                    <div class="amount">
                        <strong>Amount Paid:</strong><br>
                        ₹${advance.amount.toLocaleString()}
                    </div>
                    <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #666;">
                        This is a computer-generated receipt
                    </p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        console.error('Error printing receipt:', error);
        showToast('Error printing receipt', 'error');
    }
};

// Edit breakdown
window.editBreakdown = async function(breakdownId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        const breakdownDoc = await getDoc(doc(db, 'feeBreakdowns', breakdownId));
        if (!breakdownDoc.exists()) {
            showToast('Breakdown not found', 'error');
            return;
        }
        
        const breakdown = breakdownDoc.data();
        
        // Populate form
        document.getElementById('breakdown-course').value = breakdown.courseName;
        document.getElementById('breakdown-division').value = breakdown.division;
        document.getElementById('breakdown-admission').value = breakdown.components?.admissionFee || 0;
        document.getElementById('breakdown-course-fee').value = breakdown.components?.courseFee || 0;
        document.getElementById('breakdown-exam').value = breakdown.components?.examFee || 0;
        document.getElementById('breakdown-material').value = breakdown.components?.materialFee || 0;
        document.getElementById('breakdown-lab').value = breakdown.components?.labFee || 0;
        document.getElementById('breakdown-certificate').value = breakdown.components?.certificateFee || 0;
        
        // Store breakdown ID for update
        document.getElementById('breakdown-form').dataset.editId = breakdownId;
        
        calculateBreakdownTotal();
        document.getElementById('breakdown-modal').style.display = 'block';
    } catch (error) {
        console.error('Error editing breakdown:', error);
        showToast('Error loading breakdown', 'error');
    }
};

// Delete breakdown
window.deleteBreakdown = async function(breakdownId) {
    if (!confirm('Are you sure you want to delete this fee breakdown?')) return;
    
    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        await updateDoc(doc(db, 'feeBreakdowns', breakdownId), {
            isActive: false,
            deletedAt: new Date()
        });
        
        showToast('Fee breakdown deleted successfully!', 'success');
        loadFeeBreakdowns();
    } catch (error) {
        console.error('Error deleting breakdown:', error);
        showToast('Error deleting breakdown', 'error');
    }
};

// Duplicate breakdown
window.duplicateBreakdown = async function(breakdownId) {
    try {
        const { doc, getDoc, addDoc, collection, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { db } = await import('../firebase.js');
        
        const breakdownDoc = await getDoc(doc(db, 'feeBreakdowns', breakdownId));
        if (!breakdownDoc.exists()) {
            showToast('Breakdown not found', 'error');
            return;
        }
        
        const breakdown = breakdownDoc.data();
        const newBreakdown = {
            ...breakdown,
            courseName: breakdown.courseName + ' (Copy)',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        
        await addDoc(collection(db, 'feeBreakdowns'), newBreakdown);
        
        showToast('Fee breakdown duplicated successfully!', 'success');
        loadFeeBreakdowns();
    } catch (error) {
        console.error('Error duplicating breakdown:', error);
        showToast('Error duplicating breakdown', 'error');
    }
};

console.log('✅ Advanced Fee Management UI loaded');
