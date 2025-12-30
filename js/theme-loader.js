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

        // Apply font family
        const fontFamilies = {
            'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'inter': '"Inter", sans-serif',
            'roboto': '"Roboto", sans-serif',
            'poppins': '"Poppins", sans-serif',
            'outfit': '"Outfit", sans-serif',
            'space-grotesk': '"Space Grotesk", sans-serif',
            'dm-sans': '"DM Sans", sans-serif',
            'jetbrains-mono': '"JetBrains Mono", monospace'
        };
        if (theme.fontFamily && fontFamilies[theme.fontFamily]) {
            root.style.setProperty('--font-family', fontFamilies[theme.fontFamily]);
            document.body.style.fontFamily = fontFamilies[theme.fontFamily];
        }

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

        // Apply gradient background
        if (theme.gradientEnabled) {
            const angle = theme.gradientAngle || 135;
            const start = theme.gradientStart || '#1a1a2e';
            const end = theme.gradientEnd || '#16213e';
            const gradient = `linear-gradient(${angle}deg, ${start}, ${end})`;
            root.style.setProperty('--bg-gradient', gradient);
            document.body.style.background = gradient;
        }

        // Apply animation speed
        const speeds = {
            slow: '0.5s',
            normal: '0.3s',
            fast: '0.15s'
        };
        if (theme.animations === false) {
            root.style.setProperty('--transition-fast', '0s');
            root.style.setProperty('--transition-base', '0s');
            root.style.setProperty('--transition-slow', '0s');
            root.style.setProperty('--transition-speed', '0s');
        } else if (theme.animationSpeed && speeds[theme.animationSpeed]) {
            root.style.setProperty('--transition-speed', speeds[theme.animationSpeed]);
        }

        // Apply glow intensity
        if (typeof theme.glowIntensity === 'number') {
            const glow = theme.glowIntensity / 100;
            root.style.setProperty('--glow-intensity', glow);
            root.style.setProperty('--glow-shadow', `0 0 ${20 * glow}px rgba(99, 102, 241, ${0.4 * glow})`);
        }

        // Apply card spacing
        const spacings = {
            compact: '0.75rem',
            normal: '1rem',
            spacious: '1.5rem'
        };
        if (theme.cardSpacing && spacings[theme.cardSpacing]) {
            root.style.setProperty('--card-spacing', spacings[theme.cardSpacing]);
        }

        // Apply glass effect
        if (theme.glass === true) {
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
        } else if (theme.glass === false) {
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
            root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
        }

        // Apply custom CSS
        if (theme.customCSS) {
            let styleEl = document.getElementById('custom-user-styles');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'custom-user-styles';
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = theme.customCSS;
        }

        console.log('Theme loaded successfully');
    } catch (e) {
        console.log('Error loading theme:', e);
    }
})();
