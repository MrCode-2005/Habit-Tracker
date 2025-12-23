// ===================================
// Theme Management
// ===================================

const Theme = {
    init() {
        // Load saved theme or default to light
        const savedTheme = Storage.get('theme') || 'light';
        this.setTheme(savedTheme);

        // Setup theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.set('theme', theme);

        // Update icon
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
};
