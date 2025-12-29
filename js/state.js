// ===================================
// State Management
// ===================================

const State = {
    tasks: [],
    habits: [],
    events: [],
    goals: [],
    taskCompletionHistory: [], // Persists even after task deletion
    habitCompletionHistory: [], // Persists habit completions after deletion
    goalCompletionHistory: [], // Persists goal completions after deletion
    currentFilter: 'all',

    init() {
        // Load data from localStorage
        this.tasks = Storage.get('tasks') || [];
        this.habits = Storage.get('habits') || [];
        this.events = Storage.get('events') || [];
        this.goals = Storage.get('goals') || [];
        this.taskCompletionHistory = Storage.get('taskCompletionHistory') || [];
        this.habitCompletionHistory = Storage.get('habitCompletionHistory') || [];
        this.goalCompletionHistory = Storage.get('goalCompletionHistory') || [];

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
            // Track when task was completed for analytics
            const completedAt = task.completed ? new Date().toISOString() : null;
            task.completedAt = completedAt;

            // Record completion in history (persists after deletion)
            if (task.completed) {
                this.recordTaskCompletion(task, completedAt);
            } else {
                // Remove from history if uncompleted
                this.removeTaskCompletion(taskId);
            }

            this.saveTasks();
            return task;
        }
        return null;
    },

    // Record task completion in persistent history
    recordTaskCompletion(task, completedAt) {
        // Check if already recorded
        const existingIndex = this.taskCompletionHistory.findIndex(
            h => h.taskId === task.id && h.completedAt === completedAt
        );

        if (existingIndex === -1) {
            this.taskCompletionHistory.push({
                taskId: task.id,
                title: task.title,
                block: task.block,
                priority: task.priority,
                completedAt: completedAt,
                dateKey: completedAt.split('T')[0]
            });
            this.saveCompletionHistory();
        }
    },

    // Remove task completion from history (when uncompleted)
    removeTaskCompletion(taskId) {
        taskId = String(taskId);
        this.taskCompletionHistory = this.taskCompletionHistory.filter(
            h => String(h.taskId) !== taskId
        );
        this.saveCompletionHistory();
    },

    // Save completion history to localStorage and Supabase
    async saveCompletionHistory() {
        Storage.set('taskCompletionHistory', this.taskCompletionHistory);

        // Sync to Supabase if logged in
        if (typeof SupabaseDB !== 'undefined') {
            try {
                const user = await SupabaseDB.getCurrentUser();
                if (user) {
                    await SupabaseDB.syncTaskHistory(user.id, this.taskCompletionHistory);
                }
            } catch (e) {
                console.error('Error syncing task history to Supabase:', e);
            }
        }
    },

    // Get completion history (for analytics)
    getCompletionHistory() {
        return this.taskCompletionHistory;
    },

    toggleSubtaskComplete(taskId, subtaskIndex) {
        taskId = String(taskId); // Ensure string comparison
        const task = this.tasks.find(t => String(t.id) === taskId);
        if (task && task.subtasks[subtaskIndex]) {
            task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;

            // Auto-complete parent task if all subtasks are completed
            if (task.subtasks && task.subtasks.length > 0) {
                const allSubtasksComplete = task.subtasks.every(s => s.completed);
                if (allSubtasksComplete && !task.completed) {
                    task.completed = true;
                    const completedAt = new Date().toISOString();
                    task.completedAt = completedAt;
                    // Record in history
                    this.recordTaskCompletion(task, completedAt);
                } else if (!allSubtasksComplete && task.completed) {
                    // Uncheck parent if a subtask is unchecked
                    task.completed = false;
                    task.completedAt = null;
                    // Remove from history
                    this.removeTaskCompletion(taskId);
                }
            }

            this.saveTasks();
            return task;
        }
        return null;
    },

    saveTasks() {
        Storage.set('tasks', this.tasks);
    },

    // Sync a single task to Supabase
    async syncTaskToSupabase(task) {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            await SupabaseDB.upsertTask(Auth.getUserId(), task);
        }
    },

    // Delete task from Supabase
    async deleteTaskFromSupabase(taskId) {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            await SupabaseDB.deleteTask(taskId);
        }
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
        // Note: Habit completion history is already recorded on each toggle
        // So deleting the habit still preserves the completion history
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
                // Remove from history
                this.removeHabitCompletion(habitId, today);
            } else {
                habit.completions[today] = true;
                // Record in history
                this.recordHabitCompletion(habit, today);
            }
            this.saveHabits();
            return habit;
        }
        return null;
    },

    // Record habit completion in persistent history
    recordHabitCompletion(habit, dateKey) {
        const existingIndex = this.habitCompletionHistory.findIndex(
            h => h.habitId === habit.id && h.dateKey === dateKey
        );

        if (existingIndex === -1) {
            this.habitCompletionHistory.push({
                habitId: habit.id,
                name: habit.name,
                dateKey: dateKey,
                completedAt: new Date().toISOString()
            });
            this.saveHabitCompletionHistory();
        }
    },

    // Remove habit completion from history
    removeHabitCompletion(habitId, dateKey) {
        habitId = String(habitId);
        this.habitCompletionHistory = this.habitCompletionHistory.filter(
            h => !(String(h.habitId) === habitId && h.dateKey === dateKey)
        );
        this.saveHabitCompletionHistory();
    },

    // Save habit completion history to localStorage and Supabase
    async saveHabitCompletionHistory() {
        Storage.set('habitCompletionHistory', this.habitCompletionHistory);

        // Sync to Supabase if logged in
        if (typeof SupabaseDB !== 'undefined') {
            try {
                const user = await SupabaseDB.getCurrentUser();
                if (user) {
                    await SupabaseDB.syncHabitHistory(user.id, this.habitCompletionHistory);
                }
            } catch (e) {
                console.error('Error syncing habit history to Supabase:', e);
            }
        }
    },

    // Get habit completion history
    getHabitCompletionHistory() {
        return this.habitCompletionHistory;
    },

    saveHabits() {
        Storage.set('habits', this.habits);
    },

    // Sync a single habit to Supabase
    async syncHabitToSupabase(habit) {
        console.log('syncHabitToSupabase called:', habit?.name);
        console.log('Auth available:', typeof Auth !== 'undefined');
        console.log('Auth.isAuthenticated():', typeof Auth !== 'undefined' ? Auth.isAuthenticated() : 'N/A');
        console.log('User ID:', typeof Auth !== 'undefined' ? Auth.getUserId() : 'N/A');

        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            console.log('Calling SupabaseDB.upsertHabit...');
            await SupabaseDB.upsertHabit(Auth.getUserId(), habit);
        } else {
            console.warn('Skipping Supabase sync - user not authenticated');
        }
    },

    // Delete habit from Supabase
    async deleteHabitFromSupabase(habitId) {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            await SupabaseDB.deleteHabit(habitId);
        }
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

    updateEvent(eventId, updates) {
        eventId = String(eventId); // Ensure string comparison
        const index = this.events.findIndex(e => String(e.id) === eventId);
        if (index !== -1) {
            this.events[index] = { ...this.events[index], ...updates };
            this.saveEvents();
            return this.events[index];
        }
        return null;
    },

    deleteEvent(eventId) {
        eventId = String(eventId); // Ensure string comparison
        this.events = this.events.filter(e => String(e.id) !== eventId);
        this.saveEvents();
    },

    saveEvents() {
        Storage.set('events', this.events);
    },

    // Sync a single event to Supabase
    async syncEventToSupabase(event) {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            await SupabaseDB.upsertEvent(Auth.getUserId(), event);
        }
    },

    // Delete event from Supabase
    async deleteEventFromSupabase(eventId) {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            await SupabaseDB.deleteEvent(eventId);
        }
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
        // Note: Goal completion history is already recorded on toggle
        // So deleting the goal still preserves the completion history
        this.goals = this.goals.filter(g => String(g.id) !== goalId);
        this.saveGoals();
    },

    toggleGoalComplete(goalId) {
        goalId = String(goalId);
        const goal = this.goals.find(g => String(g.id) === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            const completedAt = goal.completed ? new Date().toISOString() : null;
            goal.completedAt = completedAt;

            // Record/remove from history
            if (goal.completed) {
                this.recordGoalCompletion(goal, completedAt);
            } else {
                this.removeGoalCompletion(goalId);
            }

            this.saveGoals();
            return goal;
        }
        return null;
    },

    // Record goal completion in persistent history
    recordGoalCompletion(goal, completedAt) {
        const dateKey = completedAt.split('T')[0];
        const existingIndex = this.goalCompletionHistory.findIndex(
            h => h.goalId === goal.id
        );

        if (existingIndex === -1) {
            this.goalCompletionHistory.push({
                goalId: goal.id,
                title: goal.title,
                dateKey: dateKey,
                completedAt: completedAt
            });
            this.saveGoalCompletionHistory();
        }
    },

    // Remove goal completion from history
    removeGoalCompletion(goalId) {
        goalId = String(goalId);
        this.goalCompletionHistory = this.goalCompletionHistory.filter(
            h => String(h.goalId) !== goalId
        );
        this.saveGoalCompletionHistory();
    },

    // Save goal completion history to localStorage and Supabase
    async saveGoalCompletionHistory() {
        Storage.set('goalCompletionHistory', this.goalCompletionHistory);

        // Sync to Supabase if logged in
        if (typeof SupabaseDB !== 'undefined') {
            try {
                const user = await SupabaseDB.getCurrentUser();
                if (user) {
                    await SupabaseDB.syncGoalHistory(user.id, this.goalCompletionHistory);
                }
            } catch (e) {
                console.error('Error syncing goal history to Supabase:', e);
            }
        }
    },

    // Get goal completion history
    getGoalCompletionHistory() {
        return this.goalCompletionHistory;
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

    // Sync a single goal to Supabase
    async syncGoalToSupabase(goal) {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            await SupabaseDB.upsertGoal(Auth.getUserId(), goal);
        }
    },

    // Delete goal from Supabase
    async deleteGoalFromSupabase(goalId) {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            await SupabaseDB.deleteGoal(goalId);
        }
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
