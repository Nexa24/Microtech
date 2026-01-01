// ============================================
// ADVANCED FEE MANAGEMENT MODALS
// Dynamically create all modal dialogs
// ============================================

export function initializeModals() {
    const modalsContainer = document.getElementById('modals-container');
    if (!modalsContainer) {
        console.error('Modals container not found');
        return;
    }

    modalsContainer.innerHTML = `
        <!-- Installment Plan Modal -->
        <div id="installment-modal" class="modal" style="display: none;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2><i class="fas fa-calendar-alt"></i> Create Installment Plan</h2>
                    <button class="modal-close" onclick="closeModal('installment-modal')">&times;</button>
                </div>
                <form id="installment-form">
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group student-search">
                                <label>Student ID *</label>
                                <input type="text" id="inst-student-id" required>
                            </div>
                            <div class="form-group student-search">
                                <label>Student Name *</label>
                                <input type="text" id="inst-student-name" required>
                                <div id="inst-student-suggestions" class="suggestions-list"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Course *</label>
                                <input type="text" id="inst-course" required>
                            </div>
                            <div class="form-group">
                                <label>Total Fee Amount *</label>
                                <input type="number" id="inst-total-fee" required min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Number of Installments *</label>
                                <input type="number" id="inst-number" required min="2" max="12" value="3">
                            </div>
                            <div class="form-group">
                                <label>Interval (Days) *</label>
                                <input type="number" id="inst-interval" required value="30" min="1">
                            </div>
                            <div class="form-group">
                                <label>Start Date *</label>
                                <input type="date" id="inst-start-date" required>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="generateInstallmentPreview()">
                            <i class="fas fa-eye"></i> Preview Schedule
                        </button>
                        <div id="installment-preview" style="display: none; margin-top: 20px;">
                            <h4>Installment Schedule Preview</h4>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Installment</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="installment-preview-body"></tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('installment-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Plan</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Record Installment Payment Modal -->
        <div id="record-payment-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-money-bill"></i> Record Installment Payment</h2>
                    <button class="modal-close" onclick="closeModal('record-payment-modal')">&times;</button>
                </div>
                <form id="record-payment-form">
                    <div class="modal-body">
                        <input type="hidden" id="record-plan-id">
                        <div class="form-group">
                            <label>Installment Number *</label>
                            <input type="number" id="record-installment-number" required min="1">
                        </div>
                        <div class="form-group">
                            <label>Amount Paid *</label>
                            <input type="number" id="record-amount" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Payment Date *</label>
                            <input type="date" id="record-payment-date" required>
                        </div>
                        <div class="form-group">
                            <label>Payment Mode *</label>
                            <select id="record-payment-mode" required>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Receipt Number</label>
                            <input type="text" id="record-receipt">
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="record-notes" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('record-payment-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Record Payment</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- View Installment Details Modal -->
        <div id="view-installment-modal" class="modal" style="display: none;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2><i class="fas fa-info-circle"></i> Installment Plan Details</h2>
                    <button class="modal-close" onclick="closeModal('view-installment-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Student:</label>
                            <span id="view-inst-student">-</span>
                        </div>
                        <div class="info-item">
                            <label>Course:</label>
                            <span id="view-inst-course">-</span>
                        </div>
                        <div class="info-item">
                            <label>Total Fee:</label>
                            <span id="view-inst-total">-</span>
                        </div>
                        <div class="info-item">
                            <label>Amount Paid:</label>
                            <span id="view-inst-paid" class="text-success">-</span>
                        </div>
                        <div class="info-item">
                            <label>Remaining:</label>
                            <span id="view-inst-remaining" class="text-warning">-</span>
                        </div>
                    </div>
                    <h4 style="margin-top: 20px;">Payment Schedule</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Installment</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="view-inst-schedule-body"></tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="closeModal('view-installment-modal')">Close</button>
                </div>
            </div>
        </div>

        <!-- Discount Modal -->
        <div id="discount-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-percent"></i> Apply Discount</h2>
                    <button class="modal-close" onclick="closeModal('discount-modal')">&times;</button>
                </div>
                <form id="discount-form">
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group student-search">
                                <label>Student ID *</label>
                                <input type="text" id="disc-student-id" required>
                            </div>
                            <div class="form-group student-search">
                                <label>Student Name *</label>
                                <input type="text" id="disc-student-name" required>
                                <div id="disc-student-suggestions" class="suggestions-list"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Course *</label>
                            <input type="text" id="disc-course" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Base Fee Amount *</label>
                                <input type="number" id="disc-base-fee" required min="0" step="0.01" oninput="updateDiscountPreview()">
                            </div>
                            <div class="form-group">
                                <label>Discount Type *</label>
                                <select id="disc-type" required onchange="updateDiscountPreview()">
                                    <option value="percentage">Percentage</option>
                                    <option value="flat">Flat Amount</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Discount Value *</label>
                                <input type="number" id="disc-value" required min="0" step="0.01" oninput="updateDiscountPreview()">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Discount Category *</label>
                            <select id="disc-category" required>
                                <option value="scholarship">Scholarship</option>
                                <option value="referral">Referral Discount</option>
                                <option value="early-bird">Early Bird</option>
                                <option value="sibling">Sibling Discount</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Reason</label>
                            <textarea id="disc-reason" rows="3"></textarea>
                        </div>
                        <div class="discount-preview">
                            <h4>Discount Preview</h4>
                            <div class="preview-row">
                                <span>Base Fee:</span>
                                <span id="disc-preview-base">₹0</span>
                            </div>
                            <div class="preview-row">
                                <span>Discount:</span>
                                <span id="disc-preview-discount" class="text-success">-₹0</span>
                            </div>
                            <div class="preview-row preview-total">
                                <span><strong>Final Fee:</strong></span>
                                <span id="disc-preview-final"><strong>₹0</strong></span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('discount-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Apply Discount</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Scholarship Modal -->
        <div id="scholarship-modal" class="modal" style="display: none;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2><i class="fas fa-graduation-cap"></i> Create Scholarship Program</h2>
                    <button class="modal-close" onclick="closeModal('scholarship-modal')">&times;</button>
                </div>
                <form id="scholarship-form">
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Scholarship Name *</label>
                            <input type="text" id="schol-name" required placeholder="e.g., Merit Scholarship 2025">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Type *</label>
                                <select id="schol-type" required>
                                    <option value="merit">Merit Based</option>
                                    <option value="need-based">Need Based</option>
                                    <option value="sports">Sports Excellence</option>
                                    <option value="special">Special Category</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Discount Type *</label>
                                <select id="schol-disc-type" required>
                                    <option value="percentage">Percentage</option>
                                    <option value="flat">Flat Amount</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Discount Value *</label>
                                <input type="number" id="schol-disc-value" required min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Eligibility Criteria *</label>
                            <textarea id="schol-criteria" required rows="3" placeholder="Describe eligibility requirements..."></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Max Beneficiaries</label>
                                <input type="number" id="schol-max-beneficiaries" min="1" placeholder="Leave empty for unlimited">
                            </div>
                            <div class="form-group">
                                <label>Valid From *</label>
                                <input type="date" id="schol-valid-from" required>
                            </div>
                            <div class="form-group">
                                <label>Valid Until *</label>
                                <input type="date" id="schol-valid-until" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Applicable Divisions</label>
                            <select id="schol-divisions" multiple>
                                <option value="gama">Gama Abacus</option>
                                <option value="lbs">LBS Skill Centre</option>
                                <option value="capt">CAPT</option>
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                        </div>
                        <div class="form-group">
                            <label>Applicable Courses (comma separated)</label>
                            <input type="text" id="schol-courses" placeholder="Web Development, Digital Marketing">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('scholarship-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Scholarship</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- View Discount Details Modal -->
        <div id="view-discount-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-info-circle"></i> Discount Details</h2>
                    <button class="modal-close" onclick="closeModal('view-discount-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Student:</label>
                            <span id="view-disc-student">-</span>
                        </div>
                        <div class="info-item">
                            <label>Type:</label>
                            <span id="view-disc-type">-</span>
                        </div>
                        <div class="info-item">
                            <label>Category:</label>
                            <span id="view-disc-category">-</span>
                        </div>
                        <div class="info-item">
                            <label>Value:</label>
                            <span id="view-disc-value">-</span>
                        </div>
                        <div class="info-item">
                            <label>Discount Amount:</label>
                            <span id="view-disc-amount" class="text-success">-</span>
                        </div>
                        <div class="info-item">
                            <label>Applied Date:</label>
                            <span id="view-disc-date">-</span>
                        </div>
                    </div>
                    <div class="form-group" style="margin-top: 20px;">
                        <label>Reason:</label>
                        <p id="view-disc-reason" style="margin-top: 8px;">-</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="closeModal('view-discount-modal')">Close</button>
                </div>
            </div>
        </div>

        <!-- Advance Payment Modal -->
        <div id="advance-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-arrow-circle-up"></i> Record Advance Payment</h2>
                    <button class="modal-close" onclick="closeModal('advance-modal')">&times;</button>
                </div>
                <form id="advance-form">
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group student-search">
                                <label>Student ID *</label>
                                <input type="text" id="adv-student-id" required>
                            </div>
                            <div class="form-group student-search">
                                <label>Student Name *</label>
                                <input type="text" id="adv-student-name" required>
                                <div id="adv-student-suggestions" class="suggestions-list"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Amount *</label>
                                <input type="number" id="adv-amount" required min="0" step="0.01">
                            </div>
                            <div class="form-group">
                                <label>Payment Date *</label>
                                <input type="date" id="adv-date" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Payment Mode *</label>
                                <select id="adv-mode" required>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Receipt Number</label>
                                <input type="text" id="adv-receipt" placeholder="Auto-generated if empty">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="adv-notes" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('advance-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Record Payment</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Adjust Advance Modal -->
        <div id="adjust-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-adjust"></i> Adjust Advance Payment</h2>
                    <button class="modal-close" onclick="closeModal('adjust-modal')">&times;</button>
                </div>
                <form id="adjust-advance-form">
                    <div class="modal-body">
                        <input type="hidden" id="adjust-student-id">
                        <input type="hidden" id="adjust-max-amount">
                        <div class="info-alert">
                            <i class="fas fa-info-circle"></i>
                            <div>
                                <strong>Student: <span id="adjust-student-name-display"></span></strong>
                                <p>Available Balance: <span id="adjust-available-balance"></span></p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Adjustment Amount *</label>
                            <input type="number" id="adjust-amount" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Description *</label>
                            <textarea id="adjust-description" required rows="3" placeholder="What is this adjustment for?"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('adjust-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Apply Adjustment</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- View Advance History Modal -->
        <div id="view-advance-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-history"></i> Advance Payment Details</h2>
                    <button class="modal-close" onclick="closeModal('view-advance-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Student:</label>
                            <span id="view-adv-student">-</span>
                        </div>
                        <div class="info-item">
                            <label>Amount Paid:</label>
                            <span id="view-adv-amount">-</span>
                        </div>
                        <div class="info-item">
                            <label>Payment Date:</label>
                            <span id="view-adv-date">-</span>
                        </div>
                        <div class="info-item">
                            <label>Payment Mode:</label>
                            <span id="view-adv-mode">-</span>
                        </div>
                        <div class="info-item">
                            <label>Receipt Number:</label>
                            <span id="view-adv-receipt">-</span>
                        </div>
                        <div class="info-item">
                            <label>Remaining Balance:</label>
                            <span id="view-adv-balance" class="text-success">-</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="closeModal('view-advance-modal')">Close</button>
                </div>
            </div>
        </div>

        <!-- Fee Breakdown Modal -->
        <div id="breakdown-modal" class="modal" style="display: none;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2><i class="fas fa-list-alt"></i> Create Fee Breakdown</h2>
                    <button class="modal-close" onclick="closeModal('breakdown-modal')">&times;</button>
                </div>
                <form id="breakdown-form">
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Course Name *</label>
                                <input type="text" id="breakdown-course" required>
                            </div>
                            <div class="form-group">
                                <label>Division *</label>
                                <select id="breakdown-division" required>
                                    <option value="gama">Gama Abacus</option>
                                    <option value="lbs">LBS Skill Centre</option>
                                    <option value="capt">CAPT</option>
                                </select>
                            </div>
                        </div>
                        <h4 style="margin-top: 20px; margin-bottom: 16px;">Fee Components</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Admission Fee</label>
                                <input type="number" id="breakdown-admission" min="0" step="0.01" value="0" oninput="calculateBreakdownTotal()">
                            </div>
                            <div class="form-group">
                                <label>Course Fee</label>
                                <input type="number" id="breakdown-course-fee" min="0" step="0.01" value="0" oninput="calculateBreakdownTotal()">
                            </div>
                            <div class="form-group">
                                <label>Exam Fee</label>
                                <input type="number" id="breakdown-exam" min="0" step="0.01" value="0" oninput="calculateBreakdownTotal()">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Material Fee</label>
                                <input type="number" id="breakdown-material" min="0" step="0.01" value="0" oninput="calculateBreakdownTotal()">
                            </div>
                            <div class="form-group">
                                <label>Lab Fee</label>
                                <input type="number" id="breakdown-lab" min="0" step="0.01" value="0" oninput="calculateBreakdownTotal()">
                            </div>
                            <div class="form-group">
                                <label>Certificate Fee</label>
                                <input type="number" id="breakdown-certificate" min="0" step="0.01" value="0" oninput="calculateBreakdownTotal()">
                            </div>
                        </div>
                        <div class="total-preview">
                            <strong>Total Fee:</strong>
                            <span id="breakdown-total-display">₹0</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('breakdown-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Breakdown</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Fee Category Modal -->
        <div id="category-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-tags"></i> Add Fee Category</h2>
                    <button class="modal-close" onclick="closeModal('category-modal')">&times;</button>
                </div>
                <form id="category-form">
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Category Name *</label>
                            <input type="text" id="cat-name" required placeholder="e.g., Lab Fee">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="cat-description" rows="2" placeholder="Brief description of this fee category"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Default Amount</label>
                                <input type="number" id="cat-amount" min="0" step="0.01" value="0">
                            </div>
                            <div class="form-group">
                                <label>Icon</label>
                                <input type="text" id="cat-icon" placeholder="fa-tag" value="fa-tag">
                            </div>
                            <div class="form-group">
                                <label>Color</label>
                                <input type="color" id="cat-color" value="#4F46E5">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="cat-optional"> This is an optional fee
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Applicable Divisions</label>
                            <select id="cat-divisions" multiple>
                                <option value="gama" selected>Gama Abacus</option>
                                <option value="lbs" selected>LBS Skill Centre</option>
                                <option value="capt" selected>CAPT</option>
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('category-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add Category</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// Helper function to format dates
window.formatDate = function(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

// Initialize modals when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeModals();
    console.log('✅ Modals initialized');
});
