// ===================================
// State Management
// ===================================

const State = {
    tasks: [],
    habits: [],
    events: [],
    goals: [],
    currentFilter: 'all',

    init() {
        // Load data from localStorage
        this.tasks = Storage.get('tasks') || [];
        this.habits = Storage.get('habits') || [];
        this.events = Storage.get('events') || [];
        this.goals = Storage.get('goals') || [];

        // Clean up old data (tasks older than 7 days)
        this.cleanupOldTasks();
    },

    // Tasks
    getTasks() {
        return this.tasks;
    },

    getTasksByBlock(block) {
        return this.tasks.filter(task => task.block === block);
    },

    addTask(task) {
        task.id = Date.now().toString();
        task.createdAt = new Date().toISOString();
        task.completed = false;
        task.subtasks = task.subtasks || [];
        this.tasks.push(task);
        this.saveTasks();
        return task;
    },

    updateTask(taskId, updates) {
        taskId = String(taskId); // Ensure string comparison
        const index = this.tasks.findIndex(t => String(t.id) === taskId);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            this.saveTasks();
            return this.tasks[index];
        }
        return null;
    },

    deleteTask(taskId) {
        taskId = String(taskId); // Ensure string comparison
        this.tasks = this.tasks.filter(t => String(t.id) !== taskId);
        this.saveTasks();
    },

    toggleTaskComplete(taskId) {
        taskId = String(taskId); // Ensure string comparison
        const task = this.tasks.find(t => String(t.id) === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            return task;
        }
        return null;
    },

    toggleSubtaskComplete(taskId, subtaskIndex) {
        taskId = String(taskId); // Ensure string comparison
        const task = this.tasks.find(t => String(t.id) === taskId);
        if (task && task.subtasks[subtaskIndex]) {
            task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
            this.saveTasks();
            return task;
        }
        return null;
    },

    saveTasks() {
        Storage.set('tasks', this.tasks);
    },

    cleanupOldTasks() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.tasks = this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= weekAgo;
        });
        this.saveTasks();
    },

    // Habits
    getHabits() {
        return this.habits;
    },

    addHabit(habit) {
        habit.id = Date.now().toString();
        habit.createdAt = new Date().toISOString();
        habit.completions = {}; // { 'YYYY-MM-DD': true }
        this.habits.push(habit);
        this.saveHabits();
        return habit;
    },

    updateHabit(habitId, updates) {
        habitId = String(habitId); // Ensure string comparison
        const index = this.habits.findIndex(h => String(h.id) === habitId);
        if (index !== -1) {
            this.habits[index] = { ...this.habits[index], ...updates };
            this.saveHabits();
            return this.habits[index];
        }
        return null;
    },

    deleteHabit(habitId) {
        habitId = String(habitId); // Ensure string comparison
        this.habits = this.habits.filter(h => String(h.id) !== habitId);
        this.saveHabits();
    },

    toggleHabitToday(habitId) {
        habitId = String(habitId); // Ensure string comparison
        const habit = this.habits.find(h => String(h.id) === habitId);
        if (habit) {
            const today = this.getTodayKey();
            if (habit.completions[today]) {
                delete habit.completions[today];
            } else {
                habit.completions[today] = true;
            }
            this.saveHabits();
            return habit;
        }
        return null;
    },

    saveHabits() {
        Storage.set('habits', this.habits);
    },

    // Events
    getEvents() {
        return this.events.sort((a, b) => {
            return new Date(a.dateTime) - new Date(b.dateTime);
        });
    },

    addEvent(event) {
        event.id = Date.now().toString();
        this.events.push(event);
        this.saveEvents();
        return event;
    },

    deleteEvent(eventId) {
        eventId = String(eventId); // Ensure string comparison
        this.events = this.events.filter(e => String(e.id) !== eventId);
        this.saveEvents();
    },

    saveEvents() {
        Storage.set('events', this.events);
    },

    // Goals
    getGoals() {
        return this.goals;
    },

    getActiveGoals() {
        const now = new Date();
        return this.goals.filter(goal => new Date(goal.endDate) > now || !goal.completed);
    },

    addGoal(goal) {
        goal.id = Date.now().toString();
        goal.createdAt = new Date().toISOString();
        this.goals.push(goal);
        this.saveGoals();
        return goal;
    },

    updateGoal(goalId, updates) {
        goalId = String(goalId);
        const index = this.goals.findIndex(g => String(g.id) === goalId);
        if (index !== -1) {
            this.goals[index] = { ...this.goals[index], ...updates };
            this.saveGoals();
            return this.goals[index];
        }
        return null;
    },

    deleteGoal(goalId) {
        goalId = String(goalId);
        this.goals = this.goals.filter(g => String(g.id) !== goalId);
        this.saveGoals();
    },

    toggleGoalComplete(goalId) {
        goalId = String(goalId);
        const goal = this.goals.find(g => String(g.id) === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            goal.completedAt = goal.completed ? new Date().toISOString() : null;
            this.saveGoals();
            return goal;
        }
        return null;
    },

    cleanupExpiredGoals() {
        const now = new Date();
        // Remove goals that are both completed and expired
        this.goals = this.goals.filter(goal => {
            const endDate = new Date(goal.endDate);
            return !(goal.completed && endDate < now);
        });
        this.saveGoals();
    },

    saveGoals() {
        Storage.set('goals', this.goals);
    },

    // Helpers
    getTodayKey() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    },

    // Calculate habit streak
    calculateStreak(habitId) {
        habitId = String(habitId); // Ensure string comparison
        const habit = this.habits.find(h => String(h.id) === habitId);
        if (!habit) return { current: 0, longest: 0 };

        const completions = Object.keys(habit.completions).sort().reverse();
        if (completions.length === 0) return { current: 0, longest: 0 };

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if completed today or yesterday for current streak
        const todayKey = this.getTodayKey();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split('T')[0];

        if (habit.completions[todayKey] || habit.completions[yesterdayKey]) {
            let checkDate = habit.completions[todayKey] ? new Date(today) : new Date(yesterday);

            while (true) {
                const checkKey = checkDate.toISOString().split('T')[0];
                if (habit.completions[checkKey]) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        let lastDate = null;
        for (const dateKey of completions) {
            const date = new Date(dateKey);

            if (!lastDate) {
                tempStreak = 1;
            } else {
                const diffDays = Math.floor((lastDate - date) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }

            lastDate = date;
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
            current: currentStreak,
            longest: longestStreak
        };
    }
};
