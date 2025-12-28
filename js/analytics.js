const Analytics = {
    weeklyChart: null,
    monthlyChart: null,
    goalsChart: null,
    habitWeeklyChart: null,
    habitMonthlyChart: null,
    timeSlotChart: null,
    blockChart: null,
    habitCharts: [], // Store all habit chart instances
    initialized: false,

    init() {
        // Delay initial render to ensure DOM and data are ready
        setTimeout(() => {
            this.renderCharts();
            this.initialized = true;
        }, 200);
    },

    renderCharts() {
        this.renderWeeklyChart();
        this.renderMonthlyChart();
        this.renderGoalsChart();
        this.renderHabitWeeklyChart();
        this.renderHabitMonthlyChart();
        this.renderProductivityStats();
        this.renderTimeSlotChart();
        this.renderBlockChart();
    },

    getWeeklyData() {
        const days = [];
        const completionRates = [];

        // Get completion history
        const completionHistory = State.getCompletionHistory ? State.getCompletionHistory() : [];
        // Get IDs of active tasks to avoid double counting
        const activeTaskIds = new Set(State.tasks.map(t => t.id));

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            // Count completions from active tasks on this day
            const activeCompletionsOnDay = State.tasks.filter(task => {
                if (!task.completed || !task.completedAt) return false;
                try {
                    const taskDate = new Date(task.completedAt);
                    if (isNaN(taskDate.getTime())) return false;
                    return taskDate.toISOString().split('T')[0] === dateKey;
                } catch (e) {
                    return false;
                }
            }).length;

            // Count completions from history (for DELETED tasks only)
            const deletedCompletionsOnDay = completionHistory.filter(h => {
                return h.dateKey === dateKey && !activeTaskIds.has(h.taskId);
            }).length;

            // Total = active + deleted
            const totalCompletions = activeCompletionsOnDay + deletedCompletionsOnDay;

            // Each task completed = 20% on the chart (scaled representation)
            completionRates.push(Math.min(100, totalCompletions * 20));
        }

        return { days, completionRates };
    },

    getMonthlyData() {
        const weeks = [];
        const completionRates = [];

        // Get completion history
        const completionHistory = State.getCompletionHistory ? State.getCompletionHistory() : [];
        // Get IDs of active tasks to avoid double counting
        const activeTaskIds = new Set(State.tasks.map(t => t.id));

        for (let i = 3; i >= 0; i--) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 7));
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            const startKey = startDate.toISOString().split('T')[0];
            const endKey = endDate.toISOString().split('T')[0];

            weeks.push(`Week ${4 - i}`);

            // Count completions from active tasks in this week
            const activeCompletionsInWeek = State.tasks.filter(task => {
                if (!task.completed || !task.completedAt) return false;
                try {
                    const taskDate = new Date(task.completedAt);
                    if (isNaN(taskDate.getTime())) return false;
                    return taskDate >= startDate && taskDate <= endDate;
                } catch (e) {
                    return false;
                }
            }).length;

            // Count completions from history (for DELETED tasks only)
            const deletedCompletionsInWeek = completionHistory.filter(h => {
                return h.dateKey >= startKey && h.dateKey <= endKey && !activeTaskIds.has(h.taskId);
            }).length;

            // Total = active + deleted
            const totalCompletions = activeCompletionsInWeek + deletedCompletionsInWeek;

            // Each task = 20% on chart
            completionRates.push(Math.min(100, totalCompletions * 20));
        }

        return { weeks, completionRates };
    },

    // Check if a habit was completed on a given date
    isHabitCompletedOnDate(habit, dateKey) {
        // Support both completions object and completedDays array
        if (habit.completions && habit.completions[dateKey]) {
            return true;
        }
        if (habit.completedDays && Array.isArray(habit.completedDays)) {
            return habit.completedDays.includes(dateKey);
        }
        return false;
    },

    // Get habit completion count from history for a given date (includes deleted habits)
    getHabitCompletionsFromHistory(dateKey) {
        const history = State.habitCompletionHistory || [];
        const activeHabitIds = new Set(State.habits.map(h => h.id));

        // Count completions from deleted habits only (active habits are counted separately)
        return history.filter(h => {
            return h.dateKey === dateKey && !activeHabitIds.has(h.habitId);
        }).length;
    },

    // Get goal completion count from history for a given date (includes deleted goals)
    getGoalCompletionsFromHistory(dateKey) {
        const history = State.goalCompletionHistory || [];
        const activeGoalIds = new Set(State.goals.map(g => g.id));

        // Count completions from deleted goals only
        return history.filter(g => {
            return g.dateKey === dateKey && !activeGoalIds.has(g.goalId);
        }).length;
    },

    // Get weekly completion data for a specific habit
    getHabitWeeklyData(habit) {
        const days = [];
        const completions = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            completions.push(this.isHabitCompletedOnDate(habit, dateKey) ? 1 : 0);
        }

        return { days, completions };
    },

    // Get monthly completion data for a specific habit (last 4 weeks)
    getHabitMonthlyData(habit) {
        const weeks = [];
        const completionRates = [];

        for (let i = 3; i >= 0; i--) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 7));
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            weeks.push(`Week ${4 - i}`);

            // Count completions in this week
            let completed = 0;
            let totalDays = 0;

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                totalDays++;
                if (this.isHabitCompletedOnDate(habit, dateKey)) {
                    completed++;
                }
            }

            completionRates.push(totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0);
        }

        return { weeks, completionRates };
    },

    renderWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        const { days, completionRates } = this.getWeeklyData();
        const theme = Theme.getCurrentTheme();
        const isDark = theme === 'dark';

        if (this.weeklyChart) {
            this.weeklyChart.destroy();
        }

        this.weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: completionRates,
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057',
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: isDark ? '#334155' : '#dee2e6'
                        }
                    },
                    x: {
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const { weeks, completionRates } = this.getMonthlyData();
        const theme = Theme.getCurrentTheme();
        const isDark = theme === 'dark';

        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: completionRates,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057',
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: isDark ? '#334155' : '#dee2e6'
                        }
                    },
                    x: {
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    getGoalsData() {
        const goals = State.getGoals();
        const now = new Date();

        let completed = 0;
        let failed = 0;
        let active = 0;

        // Count from active goals
        goals.forEach(goal => {
            const endDate = new Date(goal.endDate);

            if (goal.completed) {
                completed++;
            } else if (endDate < now) {
                failed++;
            } else {
                active++;
            }
        });

        // Add completed goals from history (deleted goals)
        const goalHistory = State.goalCompletionHistory || [];
        const activeGoalIds = new Set(goals.map(g => g.id));
        const deletedCompleted = goalHistory.filter(g => !activeGoalIds.has(g.goalId)).length;
        completed += deletedCompleted;

        const total = goals.length + deletedCompleted;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            labels: ['Completed', 'Failed', 'Active'],
            data: [completed, failed, active],
            total,
            completionRate
        };
    },

    renderGoalsChart() {
        const ctx = document.getElementById('goalsChart');
        if (!ctx) return;

        const { labels, data, total, completionRate } = this.getGoalsData();
        const theme = Theme.getCurrentTheme();
        const isDark = theme === 'dark';

        if (this.goalsChart) {
            this.goalsChart.destroy();
        }

        this.goalsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',  // Completed - green
                        'rgba(239, 68, 68, 0.8)',    // Failed - red
                        'rgba(245, 158, 11, 0.8)'    // Active - orange
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: isDark ? '#cbd5e1' : '#495057',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function (chart) {
                    const width = chart.width;
                    const height = chart.height;
                    const ctx = chart.ctx;
                    ctx.restore();

                    const fontSize = (height / 114).toFixed(2);
                    ctx.font = `bold ${fontSize}em sans-serif`;
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = isDark ? '#cbd5e1' : '#495057';

                    const text = `${completionRate}%`;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2;

                    ctx.fillText(text, textX, textY);

                    // Add label
                    ctx.font = `${fontSize / 2}em sans-serif`;
                    ctx.fillStyle = isDark ? '#94a3b8' : '#6c757d';
                    const labelText = 'Success Rate';
                    const labelX = Math.round((width - ctx.measureText(labelText).width) / 2);
                    const labelY = textY + (height / 10);
                    ctx.fillText(labelText, labelX, labelY);

                    ctx.save();
                }
            }]
        });
    },

    // Get aggregate weekly habit completion rate (includes deleted habits from history)
    getAggregateHabitWeeklyData() {
        const habits = State.getHabits();
        const days = [];
        const completionRates = [];

        // Get habit history for deleted habits
        const habitHistory = State.habitCompletionHistory || [];
        const activeHabitIds = new Set(habits.map(h => h.id));

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            // Count active habit completions
            let activeCompleted = 0;
            habits.forEach(habit => {
                if (this.isHabitCompletedOnDate(habit, dateKey)) {
                    activeCompleted++;
                }
            });

            // Count deleted habit completions from history
            const deletedCompleted = habitHistory.filter(h => {
                return h.dateKey === dateKey && !activeHabitIds.has(h.habitId);
            }).length;

            const totalCompleted = activeCompleted + deletedCompleted;
            const totalHabits = habits.length + deletedCompleted; // approximate total

            if (totalHabits === 0) {
                completionRates.push(0);
            } else {
                // Scale: each completion = 20%
                completionRates.push(Math.min(100, totalCompleted * 20));
            }
        }

        return { days, completionRates };
    },

    // Get aggregate monthly habit completion rate (includes deleted habits from history)
    getAggregateHabitMonthlyData() {
        const habits = State.getHabits();
        const weeks = [];
        const completionRates = [];

        // Get habit history for deleted habits
        const habitHistory = State.habitCompletionHistory || [];
        const activeHabitIds = new Set(habits.map(h => h.id));

        for (let i = 3; i >= 0; i--) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 7));
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            weeks.push(`Week ${4 - i}`);

            let totalCompletions = 0;
            let totalPossible = 0;

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];

                // Count active habit completions
                habits.forEach(habit => {
                    totalPossible++;
                    if (this.isHabitCompletedOnDate(habit, dateKey)) {
                        totalCompletions++;
                    }
                });

                // Count deleted habit completions from history
                const deletedOnDay = habitHistory.filter(h => {
                    return h.dateKey === dateKey && !activeHabitIds.has(h.habitId);
                }).length;

                totalCompletions += deletedOnDay;
                totalPossible += deletedOnDay; // They were completed so add to possible
            }

            completionRates.push(totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0);
        }

        return { weeks, completionRates };
    },

    renderHabitWeeklyChart() {
        const ctx = document.getElementById('habitWeeklyChart');
        if (!ctx) return;

        const { days, completionRates } = this.getAggregateHabitWeeklyData();
        const theme = Theme.getCurrentTheme();
        const isDark = theme === 'dark';

        if (this.habitWeeklyChart) {
            this.habitWeeklyChart.destroy();
        }

        this.habitWeeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Habit Completion (%)',
                    data: completionRates,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057',
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: isDark ? '#334155' : '#dee2e6'
                        }
                    },
                    x: {
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    renderHabitMonthlyChart() {
        const ctx = document.getElementById('habitMonthlyChart');
        if (!ctx) return;

        const { weeks, completionRates } = this.getAggregateHabitMonthlyData();
        const theme = Theme.getCurrentTheme();
        const isDark = theme === 'dark';

        if (this.habitMonthlyChart) {
            this.habitMonthlyChart.destroy();
        }

        this.habitMonthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [{
                    label: 'Habit Completion (%)',
                    data: completionRates,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: 'rgba(245, 158, 11, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057',
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: isDark ? '#334155' : '#dee2e6'
                        }
                    },
                    x: {
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    renderHabitCharts() {
        const container = document.getElementById('habitChartsContainer');
        if (!container) return;

        // Destroy existing charts
        this.habitCharts.forEach(chart => chart.destroy());
        this.habitCharts = [];

        // Clear container
        container.innerHTML = '';

        const habits = State.getHabits();

        if (habits.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No habits to display. Create a habit to see completion patterns!</p>';
            return;
        }

        const theme = Theme.getCurrentTheme();
        const isDark = theme === 'dark';

        habits.forEach(habit => {
            // Create habit card
            const habitCard = document.createElement('div');
            habitCard.className = 'habit-analytics-card';
            const habitName = habit.name || habit.title || 'Unnamed Habit';
            habitCard.innerHTML = `
                <h3>${habitName}</h3>
                <div class="habit-charts-grid">
                    <div class="chart-card">
                        <h4>Last 7 Days</h4>
                        <canvas id="habitWeekly_${habit.id}"></canvas>
                    </div>
                    <div class="chart-card">
                        <h4>Last 4 Weeks</h4>
                        <canvas id="habitMonthly_${habit.id}"></canvas>
                    </div>
                </div>
            `;
            container.appendChild(habitCard);

            // Render weekly chart
            const weeklyCtx = document.getElementById(`habitWeekly_${habit.id}`);
            const { days, completions } = this.getHabitWeeklyData(habit);

            const weeklyChart = new Chart(weeklyCtx, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Completed',
                        data: completions,
                        backgroundColor: completions.map(c => c === 1 ?
                            (isDark ? 'rgba(16, 185, 129, 0.7)' : 'rgba(16, 185, 129, 0.8)') :
                            (isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.5)')
                        ),
                        borderColor: completions.map(c => c === 1 ?
                            'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'
                        ),
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1,
                            ticks: {
                                color: isDark ? '#cbd5e1' : '#495057',
                                stepSize: 1,
                                callback: function (value) {
                                    return value === 1 ? '✓' : '✗';
                                }
                            },
                            grid: {
                                color: isDark ? '#334155' : '#dee2e6'
                            }
                        },
                        x: {
                            ticks: {
                                color: isDark ? '#cbd5e1' : '#495057'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            this.habitCharts.push(weeklyChart);

            // Render monthly chart
            const monthlyCtx = document.getElementById(`habitMonthly_${habit.id}`);
            const { weeks, completionRates } = this.getHabitMonthlyData(habit);

            const monthlyChart = new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: weeks,
                    datasets: [{
                        label: 'Completion Rate (%)',
                        data: completionRates,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: isDark ? '#cbd5e1' : '#495057',
                                callback: function (value) {
                                    return value + '%';
                                }
                            },
                            grid: {
                                color: isDark ? '#334155' : '#dee2e6'
                            }
                        },
                        x: {
                            ticks: {
                                color: isDark ? '#cbd5e1' : '#495057'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            this.habitCharts.push(monthlyChart);
        });
    },

    // ===================================
    // Productivity Insights
    // ===================================

    getTimeSlotData() {
        const slots = {
            'Morning': { count: 0, hours: [6, 7, 8, 9, 10, 11, 12, 13] },
            'Evening': { count: 0, hours: [14, 15, 16, 17, 18, 19, 20, 21] },
            'Night': { count: 0, hours: [22, 23, 0, 1, 2, 3, 4, 5] }
        };

        // Get completion history
        const completionHistory = State.getCompletionHistory ? State.getCompletionHistory() : [];

        // Count from active tasks
        State.tasks.filter(t => t.completed && t.completedAt).forEach(task => {
            try {
                const hour = new Date(task.completedAt).getHours();
                for (const [slot, data] of Object.entries(slots)) {
                    if (data.hours.includes(hour)) {
                        data.count++;
                        break;
                    }
                }
            } catch (e) { }
        });

        // Also count tasks by their block if no completedAt
        State.tasks.filter(t => t.completed && !t.completedAt && t.block).forEach(task => {
            if (task.block === 'morning') slots['Morning'].count++;
            else if (task.block === 'evening') slots['Evening'].count++;
            else if (task.block === 'night') slots['Night'].count++;
        });

        // Also count from history (for deleted tasks)
        const activeTaskIds = new Set(State.tasks.map(t => t.id));
        completionHistory.filter(h => !activeTaskIds.has(h.taskId)).forEach(h => {
            if (h.block === 'morning') slots['Morning'].count++;
            else if (h.block === 'evening') slots['Evening'].count++;
            else if (h.block === 'night') slots['Night'].count++;
        });

        return {
            labels: Object.keys(slots),
            data: Object.values(slots).map(s => s.count)
        };
    },

    getBlockData() {
        const blocks = { 'Morning': 0, 'Evening': 0, 'Night': 0 };

        // Get completion history
        const completionHistory = State.getCompletionHistory ? State.getCompletionHistory() : [];

        // Count from active tasks
        State.tasks.filter(t => t.completed).forEach(task => {
            if (task.block === 'morning') blocks['Morning']++;
            else if (task.block === 'evening') blocks['Evening']++;
            else if (task.block === 'night') blocks['Night']++;
        });

        // Also count from history (for deleted tasks)
        const activeTaskIds = new Set(State.tasks.map(t => t.id));
        completionHistory.filter(h => !activeTaskIds.has(h.taskId)).forEach(h => {
            if (h.block === 'morning') blocks['Morning']++;
            else if (h.block === 'evening') blocks['Evening']++;
            else if (h.block === 'night') blocks['Night']++;
        });

        return {
            labels: Object.keys(blocks),
            data: Object.values(blocks)
        };
    },

    getMostProductiveDay() {
        const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        State.tasks.filter(t => t.completed).forEach(task => {
            const dateStr = task.completedAt || task.createdAt;
            if (dateStr) {
                try {
                    const day = new Date(dateStr).getDay();
                    dayCounts[day]++;
                } catch (e) { }
            }
        });

        const maxCount = Math.max(...dayCounts);
        if (maxCount === 0) return '-';
        return dayNames[dayCounts.indexOf(maxCount)];
    },

    getMostProductiveWeek() {
        const weekCounts = [0, 0, 0, 0];

        State.tasks.filter(t => t.completed).forEach(task => {
            const dateStr = task.completedAt || task.createdAt;
            if (dateStr) {
                try {
                    const taskDate = new Date(dateStr);
                    const now = new Date();
                    const diffDays = Math.floor((now - taskDate) / (1000 * 60 * 60 * 24));
                    const weekIndex = Math.min(3, Math.floor(diffDays / 7));
                    weekCounts[3 - weekIndex]++;
                } catch (e) { }
            }
        });

        const maxCount = Math.max(...weekCounts);
        if (maxCount === 0) return '-';
        return `Week ${weekCounts.indexOf(maxCount) + 1}`;
    },

    getTaskStreak() {
        // Get unique dates when tasks were completed
        const completionDates = new Set();

        // Get completion history
        const completionHistory = State.getCompletionHistory ? State.getCompletionHistory() : [];

        // Add dates from active tasks
        State.tasks.filter(t => t.completed).forEach(task => {
            const dateStr = task.completedAt || task.createdAt;
            if (dateStr) {
                try {
                    const dateKey = new Date(dateStr).toISOString().split('T')[0];
                    completionDates.add(dateKey);
                } catch (e) { }
            }
        });

        // Add dates from completion history (for deleted tasks)
        completionHistory.forEach(h => {
            if (h.dateKey) {
                completionDates.add(h.dateKey);
            }
        });

        if (completionDates.size === 0) return 0;

        // Sort dates descending
        const sortedDates = Array.from(completionDates).sort().reverse();

        // Check if streak is active (today or yesterday has completion)
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split('T')[0];

        if (!sortedDates.includes(todayKey) && !sortedDates.includes(yesterdayKey)) {
            return 0; // Streak broken
        }

        // Count consecutive days
        let streak = 0;
        let checkDate = sortedDates.includes(todayKey) ? new Date(today) : new Date(yesterday);

        while (true) {
            const checkKey = checkDate.toISOString().split('T')[0];
            if (completionDates.has(checkKey)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    },

    renderProductivityStats() {
        const timeSlotData = this.getTimeSlotData();
        const mostProductiveSlot = timeSlotData.labels[timeSlotData.data.indexOf(Math.max(...timeSlotData.data))];

        // Count from both active tasks and history
        const completionHistory = State.getCompletionHistory ? State.getCompletionHistory() : [];
        const activeCompletedCount = State.tasks.filter(t => t.completed).length;
        const activeTaskIds = new Set(State.tasks.map(t => t.id));
        const deletedCompletedCount = completionHistory.filter(h => !activeTaskIds.has(h.taskId)).length;
        const completedTaskCount = activeCompletedCount + deletedCompletedCount;

        // Count habits completed today (including history)
        const today = new Date().toISOString().split('T')[0];
        const activeHabitsCompletedToday = State.habits.filter(h => h.completions && h.completions[today]).length;
        const deletedHabitsCompletedToday = this.getHabitCompletionsFromHistory(today);
        const totalHabitCompletionsToday = activeHabitsCompletedToday + deletedHabitsCompletedToday;

        // Count goals completed (including history)
        const activeGoalsCompleted = State.goals.filter(g => g.completed).length;
        const goalHistory = State.goalCompletionHistory || [];
        const activeGoalIds = new Set(State.goals.map(g => g.id));
        const deletedGoalsCompleted = goalHistory.filter(h => !activeGoalIds.has(h.goalId)).length;
        const totalGoalsCompleted = activeGoalsCompleted + deletedGoalsCompleted;

        const streak = this.getTaskStreak();

        const timeEl = document.getElementById('mostProductiveTime');
        const dayEl = document.getElementById('mostProductiveDay');
        const totalEl = document.getElementById('totalCompleted');
        const streakEl = document.getElementById('taskStreak');

        if (timeEl) timeEl.textContent = Math.max(...timeSlotData.data) > 0 ? mostProductiveSlot : '-';
        if (dayEl) dayEl.textContent = this.getMostProductiveDay();
        if (totalEl) totalEl.textContent = completedTaskCount;
        if (streakEl) streakEl.textContent = streak + (streak === 1 ? ' day' : ' days');

        // Update habit/goal stats if elements exist
        const habitsTodayEl = document.getElementById('habitsCompletedToday');
        const goalsCompletedEl = document.getElementById('goalsCompleted');
        if (habitsTodayEl) habitsTodayEl.textContent = totalHabitCompletionsToday;
        if (goalsCompletedEl) goalsCompletedEl.textContent = totalGoalsCompleted;
    },

    renderTimeSlotChart() {
        const ctx = document.getElementById('timeSlotChart');
        if (!ctx) return;

        const { labels, data } = this.getTimeSlotData();
        const theme = Theme.getCurrentTheme();
        const isDark = theme === 'dark';

        if (this.timeSlotChart) {
            this.timeSlotChart.destroy();
        }

        this.timeSlotChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(251, 191, 36, 0.8)',  // Morning - Yellow
                        'rgba(139, 92, 246, 0.8)', // Evening - Purple
                        'rgba(59, 130, 246, 0.8)'  // Night - Blue
                    ],
                    borderColor: isDark ? '#1e293b' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDark ? '#cbd5e1' : '#495057',
                            padding: 15
                        }
                    }
                }
            }
        });
    },

    renderBlockChart() {
        const ctx = document.getElementById('blockChart');
        if (!ctx) return;

        const { labels, data } = this.getBlockData();
        const theme = Theme.getCurrentTheme();
        const isDark = theme === 'dark';

        if (this.blockChart) {
            this.blockChart.destroy();
        }

        this.blockChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: data,
                    backgroundColor: [
                        'rgba(251, 191, 36, 0.7)',  // Morning
                        'rgba(139, 92, 246, 0.7)', // Evening
                        'rgba(59, 130, 246, 0.7)'  // Night
                    ],
                    borderColor: [
                        'rgba(251, 191, 36, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(59, 130, 246, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057',
                            stepSize: 1
                        },
                        grid: {
                            color: isDark ? '#334155' : '#dee2e6'
                        }
                    },
                    x: {
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#495057'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    refresh() {
        this.renderCharts();
    }
};
