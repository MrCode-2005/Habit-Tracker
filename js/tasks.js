// ===================================
// Tasks Management
// ===================================

const Tasks = {
    currentEditId: null,

    init() {
        // Setup add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showTaskModal();
        });

        // Setup task form
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Setup subtask button
        document.getElementById('addSubtaskBtn').addEventListener('click', () => {
            this.addSubtaskEntry();
        });

        // Setup filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                State.currentFilter = e.currentTarget.dataset.filter;
                this.render();
            });
        });

        // Initial render
        this.render();
    },

    showTaskModal(taskId = null) {
        this.currentEditId = taskId;
        const modal = document.getElementById('taskModal');

        if (taskId) {
            // Edit mode
            const task = State.tasks.find(t => t.id === taskId);
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskBlock').value = task.block;
            document.getElementById('taskHours').value = task.hours;
            document.getElementById('taskMinutes').value = task.minutes;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskNotes').value = task.notes || '';

            // Load subtasks
            const subtasksList = document.getElementById('subtasksList');
            subtasksList.innerHTML = '';
            task.subtasks?.forEach(subtask => {
                this.addSubtaskEntry(subtask.title, subtask.duration);
            });
        } else {
            // Add mode
            document.getElementById('taskModalTitle').textContent = 'Add New Task';
            document.getElementById('taskForm').reset();
            document.getElementById('subtasksList').innerHTML = '';
        }

        modal.classList.add('active');
    },

    addSubtaskEntry(title = '', duration = 15) {
        const subtasksList = document.getElementById('subtasksList');
        const entry = document.createElement('div');
        entry.className = 'subtask-entry';
        entry.innerHTML = `
            <input type="text" placeholder="Subtask title" value="${title}" required>
            <input type="number" placeholder="Minutes" value="${duration}" min="1" style="width: 100px;" required>
            <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        subtasksList.appendChild(entry);
    },

    calculateTotalTime(subtasks) {
        if (!subtasks || subtasks.length === 0) return { hours: 0, minutes: 0 };

        const totalMinutes = subtasks.reduce((sum, subtask) => sum + subtask.duration, 0);
        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60
        };
    },

    async saveTask() {
        const title = document.getElementById('taskTitle').value;
        const block = document.getElementById('taskBlock').value;
        let hours = parseInt(document.getElementById('taskHours').value) || 0;
        let minutes = parseInt(document.getElementById('taskMinutes').value) || 0;
        const priority = document.getElementById('taskPriority').value;
        const notes = document.getElementById('taskNotes').value;

        // Get subtasks
        const subtaskEntries = document.querySelectorAll('#subtasksList .subtask-entry');
        const subtasks = Array.from(subtaskEntries).map(entry => ({
            title: entry.querySelector('input[type="text"]').value,
            duration: parseInt(entry.querySelector('input[type="number"]').value),
            completed: false
        }));

        // Auto-calculate total time from subtasks if subtasks exist
        if (subtasks.length > 0) {
            const calculated = this.calculateTotalTime(subtasks);
            hours = calculated.hours;
            minutes = calculated.minutes;
        }

        const taskData = {
            title,
            block,
            hours,
            minutes,
            priority,
            notes,
            subtasks
        };

        let task;
        if (this.currentEditId) {
            task = State.updateTask(this.currentEditId, taskData);
        } else {
            task = State.addTask(taskData);
        }

        // Sync to Supabase
        if (task) {
            await State.syncTaskToSupabase(task);
        }

        document.getElementById('taskModal').classList.remove('active');
        this.render();
    },

    render() {
        // Clear all task lists
        ['morning', 'evening', 'night'].forEach(block => {
            document.getElementById(`${block}Tasks`).innerHTML = '';
        });

        // Get tasks and filter
        let tasks = State.getTasks();
        if (State.currentFilter !== 'all') {
            tasks = tasks.filter(t => t.priority === State.currentFilter);
        }

        // Render tasks in their blocks
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            document.getElementById(`${task.block}Tasks`).appendChild(taskElement);
        });
    },

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-card ${task.completed ? 'completed' : ''}`;

        const priorityColors = {
            'IAP': 'priority-iap',
            'IBNU': 'priority-ibnu',
            'NIBU': 'priority-nibu',
            'NINU': 'priority-ninu'
        };

        const priorityLabels = {
            'IAP': 'Important & Urgent',
            'IBNU': 'Important Not Urgent',
            'NIBU': 'Not Important Urgent',
            'NINU': 'Not Important Not Urgent'
        };

        let subtasksHTML = '';
        if (task.subtasks && task.subtasks.length > 0) {
            subtasksHTML = `
                <div class="task-subtasks">
                    ${task.subtasks.map((subtask, index) => `
                        <div class="subtask-item ${subtask.completed ? 'completed' : ''}" onclick="event.stopPropagation(); Tasks.toggleSubtask('${task.id}', ${index})">
                            <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} onclick="event.stopPropagation(); Tasks.toggleSubtask('${task.id}', ${index})">
                            <span class="subtask-title">${subtask.title}</span>
                            <span class="task-time"><i class="fa-solid fa-clock"></i> ${subtask.duration}m</span>
                            <button class="task-action-btn" onclick="event.stopPropagation(); Timer.openPanel(${JSON.stringify(task).replace(/"/g, '&quot;')}, ${JSON.stringify(subtask).replace(/"/g, '&quot;')})">
                                <i class="fa-solid fa-play"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const totalTimeLabel = task.subtasks && task.subtasks.length > 0 ? '(Total from subtasks)' : '';

        div.innerHTML = `
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                    onclick="event.stopPropagation(); Tasks.toggleComplete('${task.id}')">
                <div class="task-title">${task.title}</div>
            </div>
            <div class="task-meta">
                <span class="priority-badge ${priorityColors[task.priority]}"></span>
                <span>${priorityLabels[task.priority]}</span>
                <span class="task-time">
                    <i class="fa-solid fa-clock"></i>
                    ${task.hours}h ${task.minutes}m ${totalTimeLabel}
                </span>
            </div>
            ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
            ${subtasksHTML}
            <div class="task-actions">
                <button class="task-action-btn" onclick="Timer.openPanel(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                    <i class="fa-solid fa-play"></i> Start Timer
                </button>
                <button class="task-action-btn" onclick="Tasks.showTaskModal('${task.id}')">
                    <i class="fa-solid fa-edit"></i> Edit
                </button>
                <button class="task-action-btn" onclick="Tasks.deleteTask('${task.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        `;

        return div;
    },

    async toggleComplete(taskId) {
        const task = State.toggleTaskComplete(taskId);
        // Sync to Supabase
        if (task) {
            await State.syncTaskToSupabase(task);
        }
        this.render();
    },

    async toggleSubtask(taskId, subtaskIndex) {
        const task = State.toggleSubtaskComplete(taskId, subtaskIndex);
        // Sync to Supabase
        if (task) {
            await State.syncTaskToSupabase(task);
        }
        this.render();
    },

    async deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            State.deleteTask(taskId);
            // Delete from Supabase
            await State.deleteTaskFromSupabase(taskId);
            this.render();
        }
    }
};
