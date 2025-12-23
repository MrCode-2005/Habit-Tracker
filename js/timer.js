// ===================================
// Timer Module
// ===================================

const Timer = {
    interval: null,
    remainingSeconds: 0,
    isRunning: false,
    currentTask: null,
    currentSubtask: null,
    currentSubtaskIndex: null,
    isBreak: false,

    init() {
        // Setup timer panel close
        document.getElementById('closePanelBtn').addEventListener('click', () => {
            this.closePanel();
        });

        // Setup timer controls
        document.getElementById('startTimerBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseTimerBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetTimerBtn').addEventListener('click', () => this.reset());
        document.getElementById('breakTimerBtn').addEventListener('click', () => this.showBreakModal());

        // Setup break modal
        document.getElementById('breakForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const minutes = parseInt(document.getElementById('breakMinutes').value);
            this.startBreak(minutes);
            document.getElementById('breakModal').classList.remove('active');
        });
    },

    openPanel(task, subtask = null, subtaskIndex = null) {
        this.stop();
        this.currentTask = task;
        this.currentSubtask = subtask;
        this.currentSubtaskIndex = subtaskIndex;
        this.isBreak = false;

        // Set timer duration
        if (subtask) {
            this.remainingSeconds = subtask.duration * 60;
            document.getElementById('timerTaskInfo').innerHTML = `
                <h3>${task.title}</h3>
                <p>Sub-task: ${subtask.title}</p>
            `;
        } else {
            this.remainingSeconds = (task.hours * 3600) + (task.minutes * 60);
            document.getElementById('timerTaskInfo').innerHTML = `
                <h3>${task.title}</h3>
            `;
        }

        this.updateDisplay();
        document.getElementById('timerPanel').classList.add('active');
    },

    closePanel() {
        this.stop();
        document.getElementById('timerPanel').classList.remove('active');
    },

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            document.getElementById('startTimerBtn').style.display = 'none';
            document.getElementById('pauseTimerBtn').style.display = 'flex';

            this.interval = setInterval(() => {
                if (this.remainingSeconds > 0) {
                    this.remainingSeconds--;
                    this.updateDisplay();
                } else {
                    this.complete();
                }
            }, 1000);
        }
    },

    pause() {
        this.stop();
        document.getElementById('startTimerBtn').style.display = 'flex';
        document.getElementById('pauseTimerBtn').style.display = 'none';
    },

    stop() {
        this.isRunning = false;
        clearInterval(this.interval);
    },

    reset() {
        this.stop();
        document.getElementById('startTimerBtn').style.display = 'flex';
        document.getElementById('pauseTimerBtn').style.display = 'none';

        if (this.currentTask) {
            this.remainingSeconds = (this.currentTask.hours * 3600) + (this.currentTask.minutes * 60);
        }
        this.updateDisplay();
    },

    complete() {
        this.stop();
        document.getElementById('startTimerBtn').style.display = 'flex';
        document.getElementById('pauseTimerBtn').style.display = 'none';

        // Auto-complete subtask if this was a subtask timer
        if (this.currentSubtask && this.currentSubtaskIndex !== null && this.currentTask) {
            State.toggleSubtaskComplete(this.currentTask.id, this.currentSubtaskIndex);
            // Refresh the task display
            if (typeof Tasks !== 'undefined') {
                Tasks.render();
            }
        }

        // Play notification sound (optional)
        this.playNotificationSound();

        // Show notification
        if (this.isBreak) {
            alert('Break time is over! Time to get back to work.');
        } else {
            if (this.currentSubtask) {
                alert(`Subtask "${this.currentSubtask.title}" completed! Great job!`);
            } else {
                alert('Task completed! Great job!');
            }
        }
    },

    showBreakModal() {
        document.getElementById('breakModal').classList.add('active');
    },

    startBreak(minutes) {
        this.stop();
        this.isBreak = true;
        this.remainingSeconds = minutes * 60;

        document.getElementById('timerTaskInfo').innerHTML = `
            <h3>Break Time</h3>
            <p>Take a rest and recharge!</p>
        `;

        this.updateDisplay();
        this.start();
    },

    updateDisplay() {
        const hours = Math.floor(this.remainingSeconds / 3600);
        const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
        const seconds = this.remainingSeconds % 60;

        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = display;
    },

    playNotificationSound() {
        // Optional: Add audio notification
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi68OScTgwNUKfk77RgGwU7k9n0yXgpBSh+zPLaizsKElyx6OytWhELTKXh8bhhGAU2jdTywn0vBSZ6yvDdrEYKD1y06+mwXBMKSKHe8sFuJAUsgs/z2og1CBZpvPDmnE4LDVGo5O+yYBoFPJPY88p3KgUngM3y2Ys6ChJctOvrrVkWC0yj4PO6YRsFNo/W88d8LgUleMnzzbhJCg5asuznrlwTCkal4O6+cSMGLoLP89iINQgWa730qJxOCw1RqOTvsV8dBT2T2PPLeCkFJ37N8dmLOgoRXLXq66xaFQtNpOHyu18bBTOR1/PJeCwGIHnJ+LdsETQSXrPe6axZFQpKoN7uu3AeFSyD0fLWiD4HEGq98qKhPQwMT6fq77JfGgY8ltrzxnYoBSd+zfPaizoJEluy6+2sWhYKTKPi8Lpf');
            audio.play();
        } catch (error) {
            // Silently fail if audio doesn't work
        }
    }
};
