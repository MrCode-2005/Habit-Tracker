// ===================================
// Main App Initialization
// ===================================

// Initialize all modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core modules
    State.init();
    Theme.init();
    Timer.init();

    // Initialize features
    Tasks.init();
    Habits.init();
    Events.init();
    Analytics.init();

    // Expose modules globally for onclick handlers
    window.Tasks = Tasks;
    window.Habits = Habits;
    window.Events = Events;
    window.Timer = Timer;
    window.Analytics = Analytics;

    // Setup navigation
    setupNavigation();

    // Setup modal close handlers
    setupModals();

    console.log('Habit & Task Tracker initialized successfully!');
});

// Navigation between views
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding view
            const viewId = btn.dataset.view;
            views.forEach(view => {
                view.classList.remove('active');
            });
            document.getElementById(viewId).classList.add('active');

            // Refresh analytics charts when switching to analytics view
            if (viewId === 'analytics') {
                Analytics.refresh();
            }
        });
    });
}

// Modal management
function setupModals() {
    // Close modal when clicking close button or outside modal
    document.querySelectorAll('.modal').forEach(modal => {
        // Close button
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        });

        // Click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });

            // Also close timer panel
            if (document.getElementById('timerPanel').classList.contains('active')) {
                Timer.closePanel();
            }
        }
    });
}

// Utility: Format time duration
function formatDuration(hours, minutes) {
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(' ') || '0m';
}

// Utility: Get today's date key
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}
