const Analytics = {
    weeklyChart: null,
    monthlyChart: null,
    goalsChart: null,
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
        this.renderHabitCharts();
    },

    getWeeklyData() {
        const days = [];
        const completionRates = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            // Get tasks for this day
            const dayTasks = State.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate.toISOString().split('T')[0] === dateKey;
            });

            if (dayTasks.length === 0) {
                completionRates.push(0);
            } else {
                const completed = dayTasks.filter(t => t.completed).length;
                completionRates.push(Math.round((completed / dayTasks.length) * 100));
            }
        }

        return { days, completionRates };
    },

    getMonthlyData() {
        const weeks = [];
        const completionRates = [];

        for (let i = 3; i >= 0; i--) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 7));
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            weeks.push(`Week ${4 - i}`);

            // Get tasks for this week
            const weekTasks = State.tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                return taskDate >= startDate && taskDate <= endDate;
            });

            if (weekTasks.length === 0) {
                completionRates.push(0);
            } else {
                const completed = weekTasks.filter(t => t.completed).length;
                completionRates.push(Math.round((completed / weekTasks.length) * 100));
            }
        }

        return { weeks, completionRates };
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
            completions.push(habit.completions[dateKey] ? 1 : 0);
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
                if (habit.completions[dateKey]) {
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

        const total = goals.length;
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
            habitCard.innerHTML = `
                <h3>${habit.name}</h3>
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

    refresh() {
        this.renderCharts();
    }
};
