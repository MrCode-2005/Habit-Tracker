// ===================================
// Theme Loader - Apply saved theme on page load
// ===================================

(function () {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('userTheme');
    if (!savedTheme) return;

    try {
        const theme = JSON.parse(savedTheme);
        const root = document.documentElement;

        // Apply colors
        if (theme.primary) root.style.setProperty('--primary', theme.primary);
        if (theme.secondary) root.style.setProperty('--secondary', theme.secondary);
        if (theme.success) root.style.setProperty('--success', theme.success);
        if (theme.background) root.style.setProperty('--bg-primary', theme.background);

        // Apply font size
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        if (theme.fontSize && fontSizes[theme.fontSize]) {
            root.style.setProperty('--base-font-size', fontSizes[theme.fontSize]);
            document.body.style.fontSize = fontSizes[theme.fontSize];
        }

        // Apply border radius
        const radiuses = {
            sharp: '4px',
            rounded: '8px',
            pill: '20px'
        };
        if (theme.borderRadius && radiuses[theme.borderRadius]) {
            root.style.setProperty('--radius-md', radiuses[theme.borderRadius]);
            root.style.setProperty('--radius-lg', theme.borderRadius === 'pill' ? '25px' :
                theme.borderRadius === 'rounded' ? '12px' : '6px');
        }

        // Apply animations
        if (theme.animations === false) {
            root.style.setProperty('--transition-fast', '0s');
            root.style.setProperty('--transition-base', '0s');
            root.style.setProperty('--transition-slow', '0s');
        }

        console.log('Theme loaded successfully');
    } catch (e) {
        console.log('Error loading theme:', e);
    }
})();
