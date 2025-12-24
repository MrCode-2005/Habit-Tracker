// ===================================
// Goals Management Module
// ===================================

const Goals = {
    currentEditId: null,
    countdownIntervals: {},

    init() {
        // Setup add goal button
        document.getElementById('addGoalBtn').addEventListener('click', () => {
            this.showGoalModal();
        });

        // Setup goal form
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        // Setup goal type change handler
        document.getElementById('goalType').addEventListener('change', (e) => {
            this.handleTypeChange(e.target.value);
        });

        // Setup modal close buttons
        document.querySelectorAll('#goalModal .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('goalModal').classList.remove('active');
            });
        });

        // Initial render
        this.render();

        // Cleanup expired goals every hour
        setInterval(() => this.cleanupExpiredGoals(), 60 * 60 * 1000);
    },

    handleTypeChange(type) {
        const customDaysGroup = document.getElementById('customDaysGroup');
        if (type === 'custom') {
            customDaysGroup.style.display = 'block';
        } else {
            customDaysGroup.style.display = 'none';
        }
    },

    showGoalModal(goalId = null) {
        const modal = document.getElementById('goalModal');
        const form = document.getElementById('goalForm');

        this.currentEditId = goalId;

        if (goalId) {
            // Edit mode
            const goal = State.goals.find(g => g.id === goalId);
            if (goal) {
                document.getElementById('goalModalTitle').textContent = 'Edit Goal';
                document.getElementById('goalTitle').value = goal.title;
                document.getElementById('goalType').value = goal.type;
                document.getElementById('goalCustomDays').value = goal.customDays || 7;
                this.handleTypeChange(goal.type);
            }
        } else {
            // Add mode
            document.getElementById('goalModalTitle').textContent = 'Add New Goal';
            form.reset();
            document.getElementById('goalType').value = 'weekly';
            this.handleTypeChange('weekly');
        }

        modal.classList.add('active');
    },

    async saveGoal() {
        const title = document.getElementById('goalTitle').value.trim();
        const type = document.getElementById('goalType').value;
        const customDays = parseInt(document.getElementById('goalCustomDays').value) || 7;

        if (!title) return;

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        let endDate = new Date(startDate);

        // Calculate end date based on type
        if (type === 'weekly') {
            endDate.setDate(endDate.getDate() + 7);
        } else if (type === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (type === 'custom') {
            endDate.setDate(endDate.getDate() + customDays);
        }

        const goalData = {
            title,
            type,
            duration: type === 'weekly' ? 7 : type === 'monthly' ? 30 : customDays,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            completed: false,
            completedAt: null
        };

        let goal;
        if (this.currentEditId) {
            goal = State.updateGoal(this.currentEditId, goalData);
        } else {
            goal = State.addGoal(goalData);
        }

        // Sync to Supabase
        if (goal) {
            await State.syncGoalToSupabase(goal);
        }

        document.getElementById('goalModal').classList.remove('active');
        this.render();
    },

    render() {
        const container = document.getElementById('goalsList');
        const goals = State.getActiveGoals();

        // Clear existing intervals
        Object.values(this.countdownIntervals).forEach(interval => clearInterval(interval));
        this.countdownIntervals = {};

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-bullseye"></i>
                    <p>No goals yet. Create your first goal to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.map(goal => this.createGoalElement(goal)).join('');

        // Setup countdown intervals for each goal
        goals.forEach(goal => {
            this.startCountdown(goal.id);
        });
    },

    createGoalElement(goal) {
        const startDate = new Date(goal.startDate);
        const endDate = new Date(goal.endDate);
        const typeLabels = {
            weekly: 'Weekly Goal',
            monthly: 'Monthly Goal',
            custom: `${goal.customDays}-Day Goal`
        };

        return `
            <div class="goal-card ${goal.completed ? 'completed' : ''}" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <div class="goal-info">
                        <h3>${goal.title}</h3>
                        <span class="goal-type-badge">${typeLabels[goal.type]}</span>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-icon" onclick="Goals.toggleComplete('${goal.id}')" title="${goal.completed ? 'Mark incomplete' : 'Mark complete'}">
                            <i class="fa-solid fa-${goal.completed ? 'check-circle' : 'circle'}"></i>
                        </button>
                        <button class="btn-icon" onclick="Goals.deleteGoal('${goal.id}')" title="Delete goal">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="goal-dates">
                    <div class="date-item">
                        <i class="fa-solid fa-calendar-plus"></i>
                        <span>Start: ${startDate.toLocaleDateString()}</span>
                    </div>
                    <div class="date-item">
                        <i class="fa-solid fa-calendar-check"></i>
                        <span>End: ${endDate.toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="goal-countdown" id="countdown-${goal.id}">
                    <div class="countdown-timer">
                        <div class="countdown-item">
                            <span class="countdown-value">--</span>
                            <span class="countdown-label">Days</span>
                        </div>
                        <div class="countdown-item">
                            <span class="countdown-value">--</span>
                            <span class="countdown-label">Hours</span>
                        </div>
                        <div class="countdown-item">
                            <span class="countdown-value">--</span>
                            <span class="countdown-label">Minutes</span>
                        </div>
                        <div class="countdown-item">
                            <span class="countdown-value">--</span>
                            <span class="countdown-label">Seconds</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    startCountdown(goalId) {
        const updateCountdown = () => {
            const goal = State.goals.find(g => g.id === goalId);
            if (!goal) return;

            const now = new Date();
            const endDate = new Date(goal.endDate);
            const diff = endDate - now;

            const countdownElement = document.getElementById(`countdown-${goalId}`);
            if (!countdownElement) return;

            if (diff <= 0) {
                // Goal time is up
                countdownElement.innerHTML = `
                    <div class="countdown-expired">
                        <i class="fa-solid fa-clock"></i>
                        <span>Time's Up!</span>
                    </div>
                `;
                clearInterval(this.countdownIntervals[goalId]);

                // Auto-remove if completed
                if (goal.completed) {
                    setTimeout(() => {
                        State.deleteGoal(goalId);
                        this.render();
                    }, 5000); // Remove after 5 seconds
                }
                return;
            }

            // Calculate time remaining
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Update display
            const items = countdownElement.querySelectorAll('.countdown-value');
            if (items.length === 4) {
                items[0].textContent = days.toString().padStart(2, '0');
                items[1].textContent = hours.toString().padStart(2, '0');
                items[2].textContent = minutes.toString().padStart(2, '0');
                items[3].textContent = seconds.toString().padStart(2, '0');
            }
        };

        // Update immediately
        updateCountdown();

        // Update every second
        this.countdownIntervals[goalId] = setInterval(updateCountdown, 1000);
    },

    async toggleComplete(goalId) {
        const goal = State.toggleGoalComplete(goalId);
        if (goal) {
            // Sync to Supabase
            await State.syncGoalToSupabase(goal);
            this.render();
        }
    },

    async deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            State.deleteGoal(goalId);
            // Delete from Supabase
            await State.deleteGoalFromSupabase(goalId);
            this.render();
        }
    },

    cleanupExpiredGoals() {
        State.cleanupExpiredGoals();
        this.render();
    }
};
