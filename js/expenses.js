// ===================================
// Expense & Financial Habit Tracking
// ===================================

const Expenses = {
    // Category definitions with professional names and colors
    categories: {
        food_outing: {
            name: 'Food While Outing',
            color: '#f59e0b',
            icon: 'fa-utensils',
            parent: 'food'
        },
        food_online: {
            name: 'Online Food Orders',
            color: '#ef4444',
            icon: 'fa-motorcycle',
            parent: 'food'
        },
        clothing: {
            name: 'Clothing & Personal Shopping',
            color: '#8b5cf6',
            icon: 'fa-shirt',
            parent: null
        },
        transportation: {
            name: 'Transportation',
            color: '#3b82f6',
            icon: 'fa-car',
            parent: null
        },
        essentials: {
            name: 'Daily Essentials',
            color: '#10b981',
            icon: 'fa-basket-shopping',
            parent: null
        }
    },

    // Chart instances
    charts: {
        food: null,
        clothing: null,
        transportation: null,
        essentials: null,
        overall: null
    },

    // Current state
    currentTab: 'all',
    currentTimeFilter: 'month',
    initialized: false,

    // ===================================
    // Initialization
    // ===================================
    init() {
        if (this.initialized) return;

        this.bindEvents();
        this.initialized = true;
        console.log('Expenses module initialized');
    },

    bindEvents() {
        // Add expense button
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.openAddModal());
        }

        // Expense form submission
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Time filter change
        const timeFilter = document.getElementById('expenseTimeFilter');
        if (timeFilter) {
            timeFilter.addEventListener('change', (e) => {
                this.currentTimeFilter = e.target.value;
                this.renderCharts();
                this.renderExpenses();
            });
        }

        // Category tabs
        document.querySelectorAll('.expense-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.expense-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.dataset.category;
                this.showCategorySection(this.currentTab);
            });
        });

        // Clear expense history button
        const clearExpenseHistoryBtn = document.getElementById('clearExpenseHistoryBtn');
        if (clearExpenseHistoryBtn) {
            clearExpenseHistoryBtn.addEventListener('click', () => this.showClearHistoryConfirm());
        }

        // Modal close buttons
        document.querySelectorAll('#expenseModal .close-modal, #expenseDetailsModal .close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Close modals on outside click
        ['expenseModal', 'expenseDetailsModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.closeModals();
                });
            }
        });
    },

    // ===================================
    // Rendering
    // ===================================
    async render() {
        await this.renderSummaryCards();
        this.renderExpenses();
        this.renderCharts();
        this.renderEducationFees();
    },

    async renderSummaryCards() {
        const summary = document.getElementById('expenseSummary');
        if (!summary) return;

        const expenses = State.getExpenses();
        const dateRange = this.getDateRange();

        // Calculate totals by category group
        const totals = {
            food: 0,
            clothing: 0,
            transportation: 0,
            essentials: 0
        };

        expenses.forEach(exp => {
            if (exp.is_deleted) return;
            if (!this.isInDateRange(exp.expense_date, dateRange)) return;

            const amount = parseFloat(exp.amount) || 0;
            if (exp.category === 'food_outing' || exp.category === 'food_online') {
                totals.food += amount;
            } else {
                totals[exp.category] = (totals[exp.category] || 0) + amount;
            }
        });

        const grandTotal = totals.food + totals.clothing + totals.transportation + totals.essentials;

        summary.innerHTML = `
            <div class="summary-card summary-food">
                <div class="summary-icon"><i class="fa-solid fa-utensils"></i></div>
                <div class="summary-content">
                    <span class="summary-label">Food</span>
                    <span class="summary-value">₹${this.formatAmount(totals.food)}</span>
                </div>
            </div>
            <div class="summary-card summary-clothing">
                <div class="summary-icon"><i class="fa-solid fa-shirt"></i></div>
                <div class="summary-content">
                    <span class="summary-label">Shopping</span>
                    <span class="summary-value">₹${this.formatAmount(totals.clothing)}</span>
                </div>
            </div>
            <div class="summary-card summary-transport">
                <div class="summary-icon"><i class="fa-solid fa-car"></i></div>
                <div class="summary-content">
                    <span class="summary-label">Transport</span>
                    <span class="summary-value">₹${this.formatAmount(totals.transportation)}</span>
                </div>
            </div>
            <div class="summary-card summary-essentials">
                <div class="summary-icon"><i class="fa-solid fa-basket-shopping"></i></div>
                <div class="summary-content">
                    <span class="summary-label">Essentials</span>
                    <span class="summary-value">₹${this.formatAmount(totals.essentials)}</span>
                </div>
            </div>
            <div class="summary-card summary-total">
                <div class="summary-icon"><i class="fa-solid fa-wallet"></i></div>
                <div class="summary-content">
                    <span class="summary-label">Total</span>
                    <span class="summary-value">₹${this.formatAmount(grandTotal)}</span>
                </div>
            </div>
        `;
    },

    renderExpenses() {
        const container = document.getElementById('expenseList');
        if (!container) return;

        const expenses = State.getExpenses().filter(e => !e.is_deleted);
        const dateRange = this.getDateRange();

        // Filter by date range and category
        let filtered = expenses.filter(e => this.isInDateRange(e.expense_date, dateRange));

        if (this.currentTab !== 'all' && this.currentTab !== 'education') {
            if (this.currentTab === 'food') {
                filtered = filtered.filter(e => e.category === 'food_outing' || e.category === 'food_online');
            } else {
                filtered = filtered.filter(e => e.category === this.currentTab);
            }
        }

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="expense-empty">
                    <i class="fa-solid fa-receipt"></i>
                    <p>No expenses recorded yet</p>
                    <button class="btn btn-primary" onclick="Expenses.openAddModal()">
                        <i class="fa-solid fa-plus"></i> Add First Expense
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(exp => this.renderExpenseCard(exp)).join('');
    },

    renderExpenseCard(expense) {
        const cat = this.categories[expense.category];
        const date = new Date(expense.expense_date);
        const dateStr = date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        return `
            <div class="expense-card" data-id="${expense.id}">
                <div class="expense-card-icon" style="background: ${cat.color}20; color: ${cat.color}">
                    <i class="fa-solid ${cat.icon}"></i>
                </div>
                <div class="expense-card-content">
                    <div class="expense-card-header">
                        <span class="expense-category">${cat.name}</span>
                        <span class="expense-amount">₹${this.formatAmount(expense.amount)}</span>
                    </div>
                    <div class="expense-card-meta">
                        <span class="expense-date"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                        ${expense.note ? `<span class="expense-note">${expense.note}</span>` : ''}
                    </div>
                </div>
                <div class="expense-card-actions">
                    <button class="expense-action-btn" onclick="Expenses.editExpense('${expense.id}')" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="expense-action-btn expense-action-delete" onclick="Expenses.deleteExpense('${expense.id}')" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },

    renderExpenseHistory() {
        const container = document.getElementById('expenseHistoryList');
        if (!container) return;

        const deletedExpenses = State.getExpenses().filter(e => e.is_deleted);

        if (deletedExpenses.length === 0) {
            container.innerHTML = '<p class="history-empty">No deleted expenses</p>';
            return;
        }

        // Sort by date descending
        deletedExpenses.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

        container.innerHTML = deletedExpenses.map(exp => {
            const cat = this.categories[exp.category];
            const date = new Date(exp.expense_date);
            const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

            return `
                <div class="history-item">
                    <div class="history-icon" style="color: ${cat.color}">
                        <i class="fa-solid ${cat.icon}"></i>
                    </div>
                    <div class="history-content">
                        <span class="history-amount">₹${this.formatAmount(exp.amount)}</span>
                        <span class="history-date">${dateStr}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    showCategorySection(category) {
        const chartsSection = document.getElementById('expenseChartsSection');
        const listSection = document.querySelector('.expense-list-section');
        const educationSection = document.getElementById('educationFeesSection');
        const historyPanel = document.getElementById('expenseHistoryPanel');

        if (category === 'education') {
            if (chartsSection) chartsSection.style.display = 'none';
            if (listSection) listSection.style.display = 'none';
            if (educationSection) educationSection.style.display = 'block';
            if (historyPanel) historyPanel.style.display = 'none';
        } else {
            if (chartsSection) chartsSection.style.display = 'grid';
            if (listSection) listSection.style.display = 'block';
            if (educationSection) educationSection.style.display = 'none';
            if (historyPanel) historyPanel.style.display = 'block';
            this.renderExpenses();
            this.renderExpenseHistory();
        }
    },

    // ===================================
    // Charts
    // ===================================
    renderCharts() {
        this.renderFoodChart();
        this.renderClothingChart();
        this.renderTransportChart();
        this.renderEssentialsChart();
        this.renderOverallChart();
    },

    getChartData(categories, includeDeleted = true) {
        const expenses = State.getExpenses();
        const dateRange = this.getDateRange();
        const labels = this.getDateLabels();

        // Initialize data structure
        const data = {};
        categories.forEach(cat => {
            data[cat] = new Array(labels.length).fill(0);
        });

        expenses.forEach(exp => {
            // Include deleted expenses for graph stability
            if (!includeDeleted && exp.is_deleted) return;
            if (!categories.includes(exp.category)) return;
            if (!this.isInDateRange(exp.expense_date, dateRange)) return;

            const labelIndex = this.getDateLabelIndex(exp.expense_date, labels);
            if (labelIndex >= 0) {
                data[exp.category][labelIndex] += parseFloat(exp.amount) || 0;
            }
        });

        return { labels, data };
    },

    renderFoodChart() {
        const canvas = document.getElementById('foodExpenseChart');
        if (!canvas) return;

        if (this.charts.food) {
            this.charts.food.destroy();
        }

        const { labels, data } = this.getChartData(['food_outing', 'food_online']);

        this.charts.food = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Food While Outing',
                        data: data.food_outing,
                        backgroundColor: this.categories.food_outing.color + 'cc',
                        borderColor: this.categories.food_outing.color,
                        borderWidth: 1
                    },
                    {
                        label: 'Online Food Orders',
                        data: data.food_online,
                        backgroundColor: this.categories.food_online.color + 'cc',
                        borderColor: this.categories.food_online.color,
                        borderWidth: 1
                    }
                ]
            },
            options: this.getChartOptions('Food Expenses', true)
        });
    },

    renderClothingChart() {
        const canvas = document.getElementById('clothingExpenseChart');
        if (!canvas) return;

        if (this.charts.clothing) {
            this.charts.clothing.destroy();
        }

        const { labels, data } = this.getChartData(['clothing']);

        this.charts.clothing = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Clothing & Shopping',
                    data: data.clothing,
                    borderColor: this.categories.clothing.color,
                    backgroundColor: this.categories.clothing.color + '33',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: this.getChartOptions('Clothing & Personal Shopping')
        });
    },

    renderTransportChart() {
        const canvas = document.getElementById('transportExpenseChart');
        if (!canvas) return;

        if (this.charts.transportation) {
            this.charts.transportation.destroy();
        }

        const { labels, data } = this.getChartData(['transportation']);

        this.charts.transportation = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Transportation',
                    data: data.transportation,
                    borderColor: this.categories.transportation.color,
                    backgroundColor: this.categories.transportation.color + '33',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: this.getChartOptions('Transportation')
        });
    },

    renderEssentialsChart() {
        const canvas = document.getElementById('essentialsExpenseChart');
        if (!canvas) return;

        if (this.charts.essentials) {
            this.charts.essentials.destroy();
        }

        const { labels, data } = this.getChartData(['essentials']);

        this.charts.essentials = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Essentials',
                    data: data.essentials,
                    borderColor: this.categories.essentials.color,
                    backgroundColor: this.categories.essentials.color + '33',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: this.getChartOptions('Daily Essentials')
        });
    },

    renderOverallChart() {
        const canvas = document.getElementById('overallExpenseChart');
        if (!canvas) return;

        if (this.charts.overall) {
            this.charts.overall.destroy();
        }

        const { labels, data } = this.getChartData(['food_outing', 'food_online', 'clothing', 'transportation', 'essentials']);

        // Combine all data for overall totals
        const overallData = labels.map((_, i) => {
            return (data.food_outing[i] || 0) +
                (data.food_online[i] || 0) +
                (data.clothing[i] || 0) +
                (data.transportation[i] || 0) +
                (data.essentials[i] || 0);
        });

        // Calculate category totals for doughnut
        const categoryTotals = {
            food: (data.food_outing.reduce((a, b) => a + b, 0) + data.food_online.reduce((a, b) => a + b, 0)),
            clothing: data.clothing.reduce((a, b) => a + b, 0),
            transportation: data.transportation.reduce((a, b) => a + b, 0),
            essentials: data.essentials.reduce((a, b) => a + b, 0)
        };

        this.charts.overall = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Food',
                        data: labels.map((_, i) => (data.food_outing[i] || 0) + (data.food_online[i] || 0)),
                        backgroundColor: '#f59e0b' + 'cc',
                        borderColor: '#f59e0b',
                        borderWidth: 1
                    },
                    {
                        label: 'Shopping',
                        data: data.clothing,
                        backgroundColor: this.categories.clothing.color + 'cc',
                        borderColor: this.categories.clothing.color,
                        borderWidth: 1
                    },
                    {
                        label: 'Transport',
                        data: data.transportation,
                        backgroundColor: this.categories.transportation.color + 'cc',
                        borderColor: this.categories.transportation.color,
                        borderWidth: 1
                    },
                    {
                        label: 'Essentials',
                        data: data.essentials,
                        backgroundColor: this.categories.essentials.color + 'cc',
                        borderColor: this.categories.essentials.color,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...this.getChartOptions('Overall Expenses', true),
                scales: {
                    x: { stacked: true },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '₹' + this.formatAmount(value)
                        }
                    }
                }
            }
        });
    },

    getChartOptions(title, stacked = false) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return context.dataset.label + ': ₹' + this.formatAmount(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: stacked,
                    grid: { display: false }
                },
                y: {
                    stacked: stacked,
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => '₹' + this.formatAmount(value)
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const labels = this.getDateLabels();
                    this.showExpenseDetails(labels[index]);
                }
            }
        };
    },

    showExpenseDetails(dateLabel) {
        const modal = document.getElementById('expenseDetailsModal');
        const title = document.getElementById('expenseDetailsTitle');
        const content = document.getElementById('expenseDetailsContent');

        if (!modal || !content) return;

        const expenses = State.getExpenses();
        const dateRange = this.parseDateLabel(dateLabel);

        // Filter expenses for this date/period
        const filtered = expenses.filter(exp => {
            const expDate = new Date(exp.expense_date);
            return expDate >= dateRange.start && expDate <= dateRange.end;
        });

        if (title) {
            title.textContent = `Expenses: ${dateLabel}`;
        }

        if (filtered.length === 0) {
            content.innerHTML = '<p class="no-details">No expenses for this period</p>';
        } else {
            const byCategory = {};
            filtered.forEach(exp => {
                const cat = this.categories[exp.category];
                if (!byCategory[exp.category]) {
                    byCategory[exp.category] = { name: cat.name, color: cat.color, icon: cat.icon, items: [], total: 0 };
                }
                byCategory[exp.category].items.push(exp);
                byCategory[exp.category].total += parseFloat(exp.amount) || 0;
            });

            content.innerHTML = Object.entries(byCategory).map(([key, cat]) => `
                <div class="details-category">
                    <div class="details-category-header" style="border-left: 3px solid ${cat.color}">
                        <i class="fa-solid ${cat.icon}" style="color: ${cat.color}"></i>
                        <span>${cat.name}</span>
                        <span class="details-total">₹${this.formatAmount(cat.total)}</span>
                    </div>
                    <div class="details-items">
                        ${cat.items.map(item => `
                            <div class="details-item">
                                <span class="details-amount">₹${this.formatAmount(item.amount)}</span>
                                ${item.note ? `<span class="details-note">${item.note}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        modal.classList.add('active');
    },

    // ===================================
    // Education Fees
    // ===================================
    renderEducationFees() {
        const container = document.getElementById('semesterGrid');
        if (!container) return;

        const fees = State.getEducationFees();

        // Create cards for all 8 semesters
        let html = '';
        for (let sem = 1; sem <= 8; sem++) {
            const semData = fees.find(f => f.semester === sem) || {
                semester: sem,
                tuition_fee: 0,
                hostel_fee: 0,
                tuition_paid: false,
                hostel_paid: false
            };

            const tuitionStatus = semData.tuition_paid ? 'paid' : 'unpaid';
            const hostelStatus = semData.hostel_paid ? 'paid' : 'unpaid';

            html += `
                <div class="semester-card" data-semester="${sem}">
                    <div class="semester-header">
                        <h3>Semester ${sem}</h3>
                        <span class="semester-badge ${this.getSemesterStatus(semData)}">${this.getSemesterStatusText(semData)}</span>
                    </div>
                    <div class="semester-content">
                        <div class="fee-row">
                            <label>
                                <span class="fee-label">Tuition Fee</span>
                                <div class="fee-input-group">
                                    <span class="currency">₹</span>
                                    <input type="number" 
                                           class="fee-input" 
                                           value="${semData.tuition_fee || ''}" 
                                           placeholder="0"
                                           data-semester="${sem}"
                                           data-type="tuition"
                                           onchange="Expenses.updateEducationFee(${sem}, 'tuition_fee', this.value)">
                                </div>
                            </label>
                            <label class="fee-checkbox ${tuitionStatus}">
                                <input type="checkbox" 
                                       ${semData.tuition_paid ? 'checked' : ''}
                                       onchange="Expenses.toggleFeePaymentStatus(${sem}, 'tuition_paid', this.checked)">
                                <span class="checkmark"></span>
                                <span class="checkbox-label">${semData.tuition_paid ? 'Paid' : 'Unpaid'}</span>
                            </label>
                        </div>
                        <div class="fee-row">
                            <label>
                                <span class="fee-label">Hostel Fee</span>
                                <div class="fee-input-group">
                                    <span class="currency">₹</span>
                                    <input type="number" 
                                           class="fee-input" 
                                           value="${semData.hostel_fee || ''}" 
                                           placeholder="0"
                                           data-semester="${sem}"
                                           data-type="hostel"
                                           onchange="Expenses.updateEducationFee(${sem}, 'hostel_fee', this.value)">
                                </div>
                            </label>
                            <label class="fee-checkbox ${hostelStatus}">
                                <input type="checkbox" 
                                       ${semData.hostel_paid ? 'checked' : ''}
                                       onchange="Expenses.toggleFeePaymentStatus(${sem}, 'hostel_paid', this.checked)">
                                <span class="checkmark"></span>
                                <span class="checkbox-label">${semData.hostel_paid ? 'Paid' : 'Unpaid'}</span>
                            </label>
                        </div>
                    </div>
                    <div class="semester-footer">
                        <span class="semester-total">Total: ₹${this.formatAmount((parseFloat(semData.tuition_fee) || 0) + (parseFloat(semData.hostel_fee) || 0))}</span>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    getSemesterStatus(semData) {
        const hasFees = (semData.tuition_fee > 0 || semData.hostel_fee > 0);
        if (!hasFees) return 'pending';
        if (semData.tuition_paid && semData.hostel_paid) return 'complete';
        if (semData.tuition_paid || semData.hostel_paid) return 'partial';
        return 'pending';
    },

    getSemesterStatusText(semData) {
        const status = this.getSemesterStatus(semData);
        switch (status) {
            case 'complete': return 'Fully Paid';
            case 'partial': return 'Partially Paid';
            case 'pending': return 'Pending';
            default: return 'Pending';
        }
    },

    async updateEducationFee(semester, field, value) {
        const numValue = parseFloat(value) || 0;
        await State.updateEducationFee(semester, { [field]: numValue });
        this.renderEducationFees();

        if (typeof Toast !== 'undefined') {
            Toast.show('Fee updated', 'success');
        }
    },

    async toggleFeePaymentStatus(semester, field, checked) {
        await State.updateEducationFee(semester, { [field]: checked });
        this.renderEducationFees();

        if (typeof Toast !== 'undefined') {
            Toast.show(checked ? 'Marked as paid' : 'Marked as unpaid', 'success');
        }
    },

    // ===================================
    // CRUD Operations
    // ===================================
    openAddModal(expenseId = null) {
        const modal = document.getElementById('expenseModal');
        const form = document.getElementById('expenseForm');
        const modalTitle = modal.querySelector('.modal-header h2');

        if (!modal || !form) return;

        // Reset form
        form.reset();
        form.dataset.editId = '';

        if (expenseId) {
            // Edit mode
            const expense = State.getExpenses().find(e => e.id === expenseId);
            if (expense) {
                modalTitle.textContent = 'Edit Expense';
                form.dataset.editId = expenseId;
                document.getElementById('expenseAmount').value = expense.amount;
                document.getElementById('expenseCategory').value = expense.category;
                document.getElementById('expenseDate').value = expense.expense_date;
                document.getElementById('expenseNote').value = expense.note || '';
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add Expense';
            // Set default date to today
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        }

        modal.classList.add('active');
    },

    editExpense(expenseId) {
        this.openAddModal(expenseId);
    },

    async handleFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const editId = form.dataset.editId;

        const expense = {
            id: editId || this.generateId(),
            amount: parseFloat(document.getElementById('expenseAmount').value),
            category: document.getElementById('expenseCategory').value,
            expense_date: document.getElementById('expenseDate').value,
            note: document.getElementById('expenseNote').value.trim() || null,
            is_deleted: false
        };

        if (editId) {
            await State.updateExpense(expense.id, expense);
            if (typeof Toast !== 'undefined') {
                Toast.show('Expense updated', 'success');
            }
        } else {
            await State.addExpense(expense);
            if (typeof Toast !== 'undefined') {
                Toast.show('Expense added', 'success');
            }
        }

        this.closeModals();
        this.render();
    },

    async deleteExpense(expenseId) {
        // Soft delete - mark as deleted but keep for graph calculations
        await State.softDeleteExpense(expenseId);

        if (typeof Toast !== 'undefined') {
            Toast.show('Expense moved to history', 'info');
        }

        this.render();
    },

    closeModals() {
        document.querySelectorAll('#expenseModal, #expenseDetailsModal').forEach(modal => {
            modal.classList.remove('active');
        });
    },

    // ===================================
    // Clear History
    // ===================================
    showClearHistoryConfirm() {
        const deletedCount = State.getExpenses().filter(e => e.is_deleted).length;

        if (deletedCount === 0) {
            if (typeof Toast !== 'undefined') {
                Toast.show('No expense history to clear', 'info');
            }
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to permanently delete ${deletedCount} expense(s) from history?\n\n` +
            `This action cannot be undone and will recalculate all expense graphs.`
        );

        if (confirmed) {
            this.clearHistory();
        }
    },

    async clearHistory() {
        await State.clearExpenseHistory();

        if (typeof Toast !== 'undefined') {
            Toast.show('Expense history cleared', 'success');
        }

        this.render();
    },

    // ===================================
    // Utility Functions
    // ===================================
    generateId() {
        return 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    formatAmount(amount) {
        if (amount >= 10000000) {
            return (amount / 10000000).toFixed(2) + ' Cr';
        } else if (amount >= 100000) {
            return (amount / 100000).toFixed(2) + ' L';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(1) + 'K';
        }
        return amount.toFixed(2);
    },

    getDateRange() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (this.currentTimeFilter) {
            case 'today':
                return { start: today, end: today };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - 7);
                return { start: weekStart, end: today };
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return { start: monthStart, end: today };
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                return { start: yearStart, end: today };
            default:
                return { start: new Date(0), end: today };
        }
    },

    getDateLabels() {
        const { start, end } = this.getDateRange();
        const labels = [];
        const current = new Date(start);

        switch (this.currentTimeFilter) {
            case 'today':
                labels.push('Today');
                break;
            case 'week':
                while (current <= end) {
                    labels.push(current.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
                    current.setDate(current.getDate() + 1);
                }
                break;
            case 'month':
                // Group by week
                let weekNum = 1;
                while (current <= end) {
                    const weekEnd = new Date(current);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    labels.push(`Week ${weekNum}`);
                    current.setDate(current.getDate() + 7);
                    weekNum++;
                }
                break;
            case 'year':
                // Group by month
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                for (let m = 0; m <= end.getMonth(); m++) {
                    labels.push(months[m]);
                }
                break;
        }

        return labels;
    },

    getDateLabelIndex(dateStr, labels) {
        const date = new Date(dateStr);
        const { start } = this.getDateRange();

        switch (this.currentTimeFilter) {
            case 'today':
                return 0;
            case 'week':
                const daysDiff = Math.floor((date - start) / (1000 * 60 * 60 * 24));
                return daysDiff >= 0 && daysDiff < labels.length ? daysDiff : -1;
            case 'month':
                const weeksDiff = Math.floor((date - start) / (1000 * 60 * 60 * 24 * 7));
                return weeksDiff >= 0 && weeksDiff < labels.length ? weeksDiff : -1;
            case 'year':
                return date.getMonth();
            default:
                return -1;
        }
    },

    parseDateLabel(label) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (label === 'Today') {
            return { start: today, end: today };
        }

        // For week view - parse "Mon 6" format
        if (this.currentTimeFilter === 'week') {
            // Find the date from the label
            const { start } = this.getDateRange();
            const labels = this.getDateLabels();
            const index = labels.indexOf(label);
            if (index >= 0) {
                const date = new Date(start);
                date.setDate(date.getDate() + index);
                return { start: date, end: date };
            }
        }

        // For month view - parse "Week X" format
        if (this.currentTimeFilter === 'month') {
            const weekNum = parseInt(label.replace('Week ', ''));
            const { start } = this.getDateRange();
            const weekStart = new Date(start);
            weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return { start: weekStart, end: weekEnd };
        }

        // For year view - parse month name
        if (this.currentTimeFilter === 'year') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = months.indexOf(label);
            if (monthIndex >= 0) {
                const monthStart = new Date(now.getFullYear(), monthIndex, 1);
                const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0);
                return { start: monthStart, end: monthEnd };
            }
        }

        return { start: today, end: today };
    },

    isInDateRange(dateStr, range) {
        const date = new Date(dateStr);
        // Normalize to start of day for comparison
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedStart = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
        const normalizedEnd = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate());

        return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
    },

    // Refresh charts and data
    refresh() {
        if (this.initialized) {
            this.render();
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Expenses;
}
