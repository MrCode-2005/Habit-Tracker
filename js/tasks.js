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

            // Load subtasks (including nested children)
            const subtasksList = document.getElementById('subtasksList');
            subtasksList.innerHTML = '';
            task.subtasks?.forEach(subtask => {
                this.addSubtaskEntry(subtask.title, subtask.duration, subtask.comment || '', subtask.link || '', subtask.children || []);
            });
        } else {
            // Add mode
            document.getElementById('taskModalTitle').textContent = 'Add New Task';
            document.getElementById('taskForm').reset();
            document.getElementById('subtasksList').innerHTML = '';
        }

        modal.classList.add('active');
    },

    addSubtaskEntry(title = '', duration = 15, comment = '', link = '', children = [], parentElement = null) {
        const container = parentElement || document.getElementById('subtasksList');
        const entry = document.createElement('div');
        entry.className = 'subtask-entry';
        const hasChildren = children && children.length > 0;
        const uniqueId = 'subtask-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        entry.dataset.subtaskId = uniqueId;

        entry.innerHTML = `
            <div class="subtask-entry-row">
                <button type="button" class="subtask-toggle-btn ${hasChildren ? '' : 'hidden'}" onclick="Tasks.toggleSubtaskChildren(this)">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <input type="text" class="subtask-title-input" placeholder="Subtask title" value="${this.escapeHtml(title)}" required>
                <input type="number" class="subtask-duration-input ${hasChildren ? 'auto-calculated' : ''}" placeholder="Min" value="${duration}" min="1" style="width: 80px;" ${hasChildren ? 'readonly title="Auto-calculated from child subtasks"' : ''}>
                <button type="button" class="btn btn-small btn-secondary add-child-btn" onclick="Tasks.addNestedSubtask(this)" title="Add child subtask">
                    <i class="fa-solid fa-plus"></i>
                </button>
                <button type="button" class="btn btn-small btn-danger" onclick="Tasks.removeSubtaskEntry(this)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="subtask-extra-row">
                <input type="url" class="subtask-link-input" placeholder="Link (optional)" value="${this.escapeHtml(link)}" style="flex: 1;">
                <input type="text" class="subtask-comment-input" placeholder="Comment (optional)" value="${this.escapeHtml(comment)}" style="flex: 2;">
            </div>
            <div class="subtask-children ${hasChildren ? 'expanded' : ''}" style="${hasChildren ? '' : 'display: none;'}">
                <!-- Nested subtasks will be inserted here -->
            </div>
        `;
        container.appendChild(entry);

        // Recursively add children if they exist
        if (children && children.length > 0) {
            const childrenContainer = entry.querySelector('.subtask-children');
            children.forEach(child => {
                this.addSubtaskEntry(
                    child.title || '',
                    child.duration || 15,
                    child.comment || '',
                    child.link || '',
                    child.children || [],
                    childrenContainer
                );
            });
        }

        return entry;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    addNestedSubtask(button) {
        const parentEntry = button.closest('.subtask-entry');
        const childrenContainer = parentEntry.querySelector('.subtask-children');
        const toggleBtn = parentEntry.querySelector('.subtask-toggle-btn');

        // Show children container and toggle button
        childrenContainer.style.display = '';
        childrenContainer.classList.add('expanded');
        toggleBtn.classList.remove('hidden');
        toggleBtn.querySelector('i').classList.add('rotated');

        // Add a new child subtask
        this.addSubtaskEntry('', 15, '', '', [], childrenContainer);

        // Mark parent duration as auto-calculated
        const parentDuration = parentEntry.querySelector(':scope > .subtask-entry-row .subtask-duration-input');
        parentDuration.classList.add('auto-calculated');
        parentDuration.readOnly = true;
        parentDuration.title = 'Auto-calculated from child subtasks';

        // Recalculate parent duration
        this.recalculateParentDuration(parentEntry);
    },

    toggleSubtaskChildren(button) {
        const entry = button.closest('.subtask-entry');
        const childrenContainer = entry.querySelector('.subtask-children');
        const icon = button.querySelector('i');

        if (childrenContainer.classList.contains('expanded')) {
            childrenContainer.classList.remove('expanded');
            childrenContainer.style.display = 'none';
            icon.classList.remove('rotated');
        } else {
            childrenContainer.classList.add('expanded');
            childrenContainer.style.display = '';
            icon.classList.add('rotated');
        }
    },

    removeSubtaskEntry(button) {
        const entry = button.closest('.subtask-entry');
        const parentEntry = entry.parentElement.closest('.subtask-entry');
        entry.remove();

        // If this was inside a parent, recalculate parent duration
        if (parentEntry) {
            this.recalculateParentDuration(parentEntry);

            // Hide toggle if no more children
            const childrenContainer = parentEntry.querySelector('.subtask-children');
            if (childrenContainer.querySelectorAll(':scope > .subtask-entry').length === 0) {
                const toggleBtn = parentEntry.querySelector('.subtask-toggle-btn');
                toggleBtn.classList.add('hidden');
                const parentDuration = parentEntry.querySelector(':scope > .subtask-entry-row .subtask-duration-input');
                parentDuration.classList.remove('auto-calculated');
                parentDuration.readOnly = false;
                parentDuration.title = '';
            }
        }
    },

    recalculateParentDuration(parentEntry) {
        const childrenContainer = parentEntry.querySelector('.subtask-children');
        const childEntries = childrenContainer.querySelectorAll(':scope > .subtask-entry');

        let totalMinutes = 0;
        childEntries.forEach(child => {
            const durationInput = child.querySelector(':scope > .subtask-entry-row .subtask-duration-input');
            totalMinutes += parseInt(durationInput.value) || 0;
        });

        const parentDuration = parentEntry.querySelector(':scope > .subtask-entry-row .subtask-duration-input');
        parentDuration.value = totalMinutes || 15;

        // Propagate up if there's a grandparent
        const grandparentEntry = parentEntry.parentElement.closest('.subtask-entry');
        if (grandparentEntry) {
            this.recalculateParentDuration(grandparentEntry);
        }
    },


    calculateTotalTime(subtasks) {
        if (!subtasks || subtasks.length === 0) return { hours: 0, minutes: 0 };

        // Recursively calculate total time including nested children
        const calculateSubtaskDuration = (subtask) => {
            if (subtask.children && subtask.children.length > 0) {
                return subtask.children.reduce((sum, child) => sum + calculateSubtaskDuration(child), 0);
            }
            return subtask.duration || 0;
        };

        const totalMinutes = subtasks.reduce((sum, subtask) => sum + calculateSubtaskDuration(subtask), 0);
        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60
        };
    },

    // Recursively collect subtasks from DOM entries
    collectSubtasksFromEntry(container) {
        const entries = container.querySelectorAll(':scope > .subtask-entry');
        return Array.from(entries).map(entry => {
            const childrenContainer = entry.querySelector('.subtask-children');
            const children = childrenContainer ? this.collectSubtasksFromEntry(childrenContainer) : [];

            return {
                title: entry.querySelector(':scope > .subtask-entry-row .subtask-title-input').value,
                duration: parseInt(entry.querySelector(':scope > .subtask-entry-row .subtask-duration-input').value) || 0,
                comment: entry.querySelector(':scope > .subtask-extra-row .subtask-comment-input')?.value || '',
                link: entry.querySelector(':scope > .subtask-extra-row .subtask-link-input')?.value || '',
                completed: false,
                children: children
            };
        });
    },

    async saveTask() {
        const title = document.getElementById('taskTitle').value;
        const block = document.getElementById('taskBlock').value;
        let hours = parseInt(document.getElementById('taskHours').value) || 0;
        let minutes = parseInt(document.getElementById('taskMinutes').value) || 0;
        const priority = document.getElementById('taskPriority').value;
        const notes = document.getElementById('taskNotes').value;

        // Get subtasks recursively
        const subtasksList = document.getElementById('subtasksList');
        const subtasks = this.collectSubtasksFromEntry(subtasksList);

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

        // Recursive function to render nested subtasks
        const renderSubtasksRecursive = (subtasks, taskData, path = []) => {
            return subtasks.map((subtask, index) => {
                const currentPath = [...path, index];
                const pathStr = currentPath.join('-');
                const hasChildren = subtask.children && subtask.children.length > 0;
                const isParent = hasChildren;
                const duration = isParent ? this.getSubtaskTotalDuration(subtask) : subtask.duration;

                const childrenHTML = hasChildren ?
                    `<div class="nested-subtasks" style="margin-left: 1.25rem; padding-left: 0.5rem; border-left: 2px solid var(--border-color);">
                        ${renderSubtasksRecursive(subtask.children, taskData, currentPath)}
                    </div>` : '';

                return `
                    <div class="subtask-item ${subtask.completed ? 'completed' : ''} ${isParent ? 'has-children' : ''}" data-path="${pathStr}">
                        <div class="subtask-main" onclick="event.stopPropagation(); Tasks.toggleSubtaskByPath('${taskData.id}', '${pathStr}')">
                            ${isParent ? `<i class="fa-solid fa-chevron-down subtask-nest-icon"></i>` : ''}
                            <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} onclick="event.stopPropagation(); Tasks.toggleSubtaskByPath('${taskData.id}', '${pathStr}')">
                            <span class="subtask-title">${subtask.title}</span>
                            ${subtask.link ? `<a href="${subtask.link}" target="_blank" class="subtask-link-btn" onclick="event.stopPropagation();" title="${subtask.link}"><i class="fa-solid fa-link"></i></a>` : ''}
                            ${subtask.comment ? `<span class="subtask-comment-icon" title="${subtask.comment}"><i class="fa-solid fa-comment"></i></span>` : ''}
                            <span class="task-time"><i class="fa-solid fa-clock"></i> ${duration}m${isParent ? ' (total)' : ''}</span>
                            <button class="task-action-btn" onclick="event.stopPropagation(); FocusMode.open(${JSON.stringify(taskData).replace(/"/g, '&quot;')}, { title: '${subtask.title.replace(/'/g, "\\'")}', hours: 0, minutes: ${duration}, link: '${(subtask.link || '').replace(/'/g, "\\'")}', comment: '${(subtask.comment || '').replace(/'/g, "\\'")}' })">
                                <i class="fa-solid fa-play"></i>
                            </button>
                        </div>
                        ${childrenHTML}
                    </div>
                `;
            }).join('');
        };

        let subtasksHTML = '';
        if (task.subtasks && task.subtasks.length > 0) {
            subtasksHTML = `
                <div class="task-subtasks">
                    ${renderSubtasksRecursive(task.subtasks, task)}
                </div>
            `;
        }

        const totalTimeLabel = '';

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
                <button class="task-action-btn" onclick="FocusMode.open(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                    <i class="fa-solid fa-play"></i> Start Focus
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

    // Get total duration of a subtask including all nested children
    getSubtaskTotalDuration(subtask) {
        if (!subtask.children || subtask.children.length === 0) {
            return subtask.duration || 0;
        }
        return subtask.children.reduce((sum, child) => sum + this.getSubtaskTotalDuration(child), 0);
    },

    // Get subtask by path (e.g., "0-1-2" means subtasks[0].children[1].children[2])
    getSubtaskByPath(subtasks, pathStr) {
        const path = pathStr.split('-').map(Number);
        let current = subtasks[path[0]];
        for (let i = 1; i < path.length && current; i++) {
            current = current.children?.[path[i]];
        }
        return current;
    },

    // Toggle subtask completion by path
    async toggleSubtaskByPath(taskId, pathStr) {
        const task = State.tasks.find(t => t.id === taskId);
        if (!task || !task.subtasks) return;

        const path = pathStr.split('-').map(Number);
        let current = task.subtasks[path[0]];
        for (let i = 1; i < path.length && current; i++) {
            current = current.children?.[path[i]];
        }

        if (current) {
            current.completed = !current.completed;
            State.saveTasks();

            // Sync to Supabase
            await State.syncTaskToSupabase(task);
            this.render();
        }
    },

    async deleteTask(taskId) {
        const confirmed = await Toast.confirm('Are you sure you want to delete this task?', 'Delete Task');
        if (confirmed) {
            State.deleteTask(taskId);
            // Delete from Supabase
            await State.deleteTaskFromSupabase(taskId);
            Toast.success('Task deleted');
            this.render();
        }
    }
};
