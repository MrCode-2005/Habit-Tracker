// ===================================
// Main App Initialization
// ===================================

// Initialize all modules when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize core modules first
    State.init();
    Theme.init();
    Timer.init();

    // Initialize features
    Tasks.init();
    Habits.init();
    Events.init();
    Goals.init();
    Quotes.init();
    Analytics.init();
    Expenses.init();

    // Expose modules globally for onclick handlers
    window.Tasks = Tasks;
    window.Habits = Habits;
    window.Events = Events;
    window.Goals = Goals;
    window.Timer = Timer;
    window.Analytics = Analytics;
    window.Expenses = Expenses;

    // Setup navigation and modals FIRST (before Auth which may be slow)
    setupNavigation();
    setupModals();

    console.log('Habit & Task Tracker UI initialized!');

    // Initialize Supabase Auth AFTER UI is ready (non-blocking for UI)
    if (typeof Auth !== 'undefined') {
        try {
            await Auth.init();
            console.log('Auth initialized successfully!');
        } catch (error) {
            console.error('Auth initialization failed:', error);
            // App still works with localStorage even if Auth fails
        }
    }

    console.log('Habit & Task Tracker fully initialized!');
});

// Navigation between views
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    // Mobile menu toggle
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Restore last viewed section
    const savedView = localStorage.getItem('currentView');
    if (savedView) {
        // Find the button for this view
        const savedBtn = document.querySelector(`.nav-btn[data-view="${savedView}"]`);
        if (savedBtn) {
            navButtons.forEach(b => b.classList.remove('active'));
            savedBtn.classList.add('active');
            views.forEach(view => view.classList.remove('active'));
            const viewEl = document.getElementById(savedView);
            if (viewEl) viewEl.classList.add('active');

            // Refresh analytics if that was the saved view
            if (savedView === 'analytics') {
                setTimeout(() => Analytics.refresh(), 100);
            }
        }
    }

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

            // Save current view to localStorage
            localStorage.setItem('currentView', viewId);

            // Close mobile menu after navigation
            if (mobileMenuBtn && navLinks) {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            }

            // Refresh analytics charts when switching to analytics view
            if (viewId === 'analytics') {
                Analytics.refresh();
            }

            // Render expenses when switching to expenses view
            if (viewId === 'expenses') {
                Expenses.render();
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
