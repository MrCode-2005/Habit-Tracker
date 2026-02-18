// ===================================
// Habit Progress View
// Individual habit progress visualization
// ===================================

const HabitProgress = {
    currentHabitId: null,
    currentYear: new Date().getFullYear(),
    activeFilter: 'thisYear', // 'thisYear', 'lastYear', 'month'
    activeMonth: new Date().getMonth(),

    /**
     * Initialize the module
     */
    init() {
        // Nothing to init globally yet, handled via navigation
    },

    /**
     * Show the progress view for a specific habit
     */
    show(habitId) {
        this.currentHabitId = habitId;

        // Default to this year
        this.currentYear = new Date().getFullYear();
        this.activeFilter = 'thisYear';
        this.activeMonth = new Date().getMonth();

        // Switch view
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('habitProgress').classList.add('active');

        // Render
        this.render();
    },

    /**
     * Refresh the current view (e.g. after data change)
     */
    refresh() {
        if (this.currentHabitId && document.getElementById('habitProgress').classList.contains('active')) {
            this.render();
        }
    },

    /**
     * Go back to habits list
     */
    goBack() {
        document.getElementById('habitProgress').classList.remove('active');
        document.getElementById('habits').classList.add('active');
        this.currentHabitId = null;
    },

    /**
     * Render the progress view main content
     */
    render() {
        const container = document.getElementById('habitProgressContent');
        if (!container) return;

        const habit = State.habits.find(h => h.id === this.currentHabitId);
        if (!habit) {
            this.goBack(); // Habit might have been deleted
            return;
        }

        container.innerHTML = '';

        // layout wrapper (from heatmap.css)
        const page = document.createElement('div');
        page.className = 'habit-progress-page';

        // Header with Back Button
        const header = document.createElement('div');
        header.className = 'habit-progress-header';

        const backBtn = document.createElement('button');
        backBtn.className = 'habit-progress-back-btn';
        backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
        backBtn.onclick = () => this.goBack();
        backBtn.ariaLabel = 'Back to habits';

        const titleDiv = document.createElement('div');

        const title = document.createElement('div');
        title.className = 'habit-progress-title';
        title.textContent = habit.name;

        const subtitle = document.createElement('div');
        subtitle.className = 'habit-progress-subtitle';
        subtitle.textContent = 'Progress Visualization';

        titleDiv.appendChild(title);
        titleDiv.appendChild(subtitle);
        header.appendChild(backBtn);
        header.appendChild(titleDiv);
        page.appendChild(header);

        // Stats Row
        const streak = State.calculateStreak(habit.id);
        const statsRow = document.createElement('div');
        statsRow.className = 'habit-progress-stats';

        statsRow.appendChild(this.createStatCard('Current Streak', `${streak.current} days`));
        statsRow.appendChild(this.createStatCard('Longest Streak', `${streak.longest} days`));

        // Calculate total completions (approximate based on active + history if needed, 
        // but for now simple active count from heatmap data is fine)
        const totalCompletions = this.calculateTotalCompletions(habit);
        statsRow.appendChild(this.createStatCard('Total Completions', totalCompletions));

        page.appendChild(statsRow);

        // Heatmap Container
        const heatmapContainer = document.createElement('div');
        heatmapContainer.id = 'habitHeatmap';
        page.appendChild(heatmapContainer);

        container.appendChild(page);

        // Render the actual heatmap
        this.renderHeatmap(heatmapContainer, habit);
    },

    createStatCard(label, value) {
        const card = document.createElement('div');
        card.className = 'heatmap-stat-card';
        card.innerHTML = `
            <div class="heatmap-stat-value">${value}</div>
            <div class="heatmap-stat-label">${label}</div>
        `;
        return card;
    },

    calculateTotalCompletions(habit) {
        // Count from completions object
        return Object.keys(habit.completions || {}).length;
    },

    renderHeatmap(container, habit) {
        // Prepare completion data map: 'YYYY-MM-DD' => 1
        const data = {};
        if (habit.completions) {
            Object.keys(habit.completions).forEach(key => {
                if (habit.completions[key]) {
                    data[key] = 1;
                }
            });
        }

        // Determine year based on filter
        // If filter is 'lastYear', subtract 1
        let displayYear = new Date().getFullYear();
        if (this.activeFilter === 'lastYear') {
            displayYear -= 1;
        }

        Heatmap.render(container, {
            data: data,
            year: displayYear,
            mode: 'individual',
            filter: this.activeFilter,
            month: this.activeMonth,
            activeFilter: this.activeFilter,
            title: '',
            onFilterChange: (newFilter, newMonth) => {
                this.activeFilter = newFilter;
                if (newMonth !== undefined) this.activeMonth = newMonth;
                this.render(); // Re-render with new filter
            }
        });
    }
};
