// ===================================
// Habits Management
// ===================================

const Habits = {
    currentEditId: null,

    init() {
        // Setup add habit button
        document.getElementById('addHabitBtn').addEventListener('click', () => {
            this.showHabitModal();
        });

        // Setup habit form
        document.getElementById('habitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveHabit();
        });

        // Initial render
        this.render();
    },

    showHabitModal(habitId = null) {
        this.currentEditId = habitId;
        const modal = document.getElementById('habitModal');

        if (habitId) {
            const habit = State.habits.find(h => h.id === habitId);
            document.getElementById('habitModalTitle').textContent = 'Edit Habit';
            document.getElementById('habitName').value = habit.name;
        } else {
            document.getElementById('habitModalTitle').textContent = 'Add New Habit';
            document.getElementById('habitForm').reset();
        }

        modal.classList.add('active');
    },

    async saveHabit() {
        const name = document.getElementById('habitName').value;

        let habit;
        if (this.currentEditId) {
            habit = State.updateHabit(this.currentEditId, { name });
        } else {
            habit = State.addHabit({ name });
        }

        // Sync to Supabase
        if (habit) {
            await State.syncHabitToSupabase(habit);
        }

        document.getElementById('habitModal').classList.remove('active');
        this.render();
    },

    render() {
        const grid = document.getElementById('habitsGrid');
        grid.innerHTML = '';

        const habits = State.getHabits();

        if (habits.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); grid-column: 1/-1;">No habits yet. Create your first habit!</p>';
            return;
        }

        habits.forEach(habit => {
            const card = this.createHabitCard(habit);
            grid.appendChild(card);
        });
    },

    createHabitCard(habit) {
        const div = document.createElement('div');
        div.className = 'habit-card';

        const today = State.getTodayKey();
        const isCompletedToday = habit.completions[today] || false;
        const streak = State.calculateStreak(habit.id);

        div.innerHTML = `
            <div class="habit-header">
                <div class="habit-name">${habit.name}</div>
                <input type="checkbox" class="habit-check" ${isCompletedToday ? 'checked' : ''} 
                    onchange="Habits.toggleToday('${habit.id}')">
            </div>
            <div class="habit-stats">
                <div class="habit-stat">
                    <div class="habit-stat-value">${streak.current}</div>
                    <div class="habit-stat-label">Current Streak</div>
                </div>
                <div class="habit-stat">
                    <div class="habit-stat-value">${streak.longest}</div>
                    <div class="habit-stat-label">Longest Streak</div>
                </div>
            </div>
            <div class="habit-actions">
                <button class="task-action-btn" onclick="Habits.showHabitModal('${habit.id}')">
                    <i class="fa-solid fa-edit"></i> Edit
                </button>
                <button class="task-action-btn" onclick="Habits.deleteHabit('${habit.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        `;

        return div;
    },

    async toggleToday(habitId) {
        const habit = State.toggleHabitToday(habitId);
        // Sync to Supabase
        if (habit) {
            await State.syncHabitToSupabase(habit);
        }
        this.render();
    },

    async deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            State.deleteHabit(habitId);
            // Delete from Supabase
            await State.deleteHabitFromSupabase(habitId);
            this.render();
        }
    }
};
