// ===================================
// UI Customization Manager
// ===================================

const ThemeManager = {
    // Default theme
    defaultTheme: {
        primary: '#7c3aed',
        secondary: '#06b6d4',
        success: '#10b981',
        background: '#0f0f23',
        darkMode: true,
        glass: true,
        animations: true,
        fontSize: 'medium',
        borderRadius: 'rounded'
    },

    // Preset themes
    presets: {
        default: {
            primary: '#7c3aed',
            secondary: '#06b6d4',
            success: '#10b981',
            background: '#0f0f23'
        },
        ocean: {
            primary: '#0ea5e9',
            secondary: '#14b8a6',
            success: '#22d3ee',
            background: '#0c1929'
        },
        sunset: {
            primary: '#f97316',
            secondary: '#ec4899',
            success: '#f59e0b',
            background: '#1a0f1f'
        },
        forest: {
            primary: '#22c55e',
            secondary: '#16a34a',
            success: '#4ade80',
            background: '#0a1a0f'
        },
        midnight: {
            primary: '#3b82f6',
            secondary: '#1e40af',
            success: '#60a5fa',
            background: '#0a0f1a'
        },
        lavender: {
            primary: '#a855f7',
            secondary: '#d946ef',
            success: '#c084fc',
            background: '#150a1f'
        },
        rose: {
            primary: '#f43f5e',
            secondary: '#fb923c',
            success: '#fb7185',
            background: '#1a0a0f'
        },
        neon: {
            primary: '#22d3ee',
            secondary: '#a855f7',
            success: '#34d399',
            background: '#0a0a15'
        }
    },

    currentTheme: null,

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.updatePreview();
    },

    loadTheme() {
        const saved = localStorage.getItem('userTheme');
        this.currentTheme = saved ? JSON.parse(saved) : { ...this.defaultTheme };
        this.applyTheme();
        this.updateUI();
    },

    saveTheme() {
        localStorage.setItem('userTheme', JSON.stringify(this.currentTheme));
        this.applyTheme();
        this.updatePreview();
    },

    applyTheme() {
        const root = document.documentElement;

        // Apply colors
        root.style.setProperty('--primary', this.currentTheme.primary);
        root.style.setProperty('--secondary', this.currentTheme.secondary);
        root.style.setProperty('--success', this.currentTheme.success);
        root.style.setProperty('--bg-dark', this.currentTheme.background);

        // Apply font size
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        root.style.setProperty('--base-font-size', fontSizes[this.currentTheme.fontSize] || '16px');

        // Apply border radius
        const radiuses = {
            sharp: '4px',
            rounded: '12px',
            pill: '24px'
        };
        root.style.setProperty('--border-radius', radiuses[this.currentTheme.borderRadius] || '12px');

        // Apply glass effect
        if (this.currentTheme.glass) {
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
        } else {
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
            root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
        }

        // Apply animations
        if (!this.currentTheme.animations) {
            root.style.setProperty('--transition-speed', '0s');
        } else {
            root.style.setProperty('--transition-speed', '0.3s');
        }
    },

    updateUI() {
        // Update color inputs
        document.getElementById('primaryColor').value = this.currentTheme.primary;
        document.getElementById('secondaryColor').value = this.currentTheme.secondary;
        document.getElementById('successColor').value = this.currentTheme.success;
        document.getElementById('bgColor').value = this.currentTheme.background;

        // Update color value displays
        document.getElementById('primaryColorValue').textContent = this.currentTheme.primary;
        document.getElementById('secondaryColorValue').textContent = this.currentTheme.secondary;
        document.getElementById('successColorValue').textContent = this.currentTheme.success;
        document.getElementById('bgColorValue').textContent = this.currentTheme.background;

        // Update toggles
        document.getElementById('darkModeToggle').checked = this.currentTheme.darkMode;
        document.getElementById('glassToggle').checked = this.currentTheme.glass;
        document.getElementById('animationsToggle').checked = this.currentTheme.animations;

        // Update size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === this.currentTheme.fontSize);
        });

        // Update radius buttons
        document.querySelectorAll('.radius-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.radius === this.currentTheme.borderRadius);
        });

        // Update preset selection
        this.updatePresetSelection();
    },

    updatePresetSelection() {
        // Check if current theme matches any preset
        document.querySelectorAll('.preset-btn').forEach(btn => {
            const presetName = btn.dataset.preset;
            const preset = this.presets[presetName];
            const isMatch = preset &&
                preset.primary === this.currentTheme.primary &&
                preset.secondary === this.currentTheme.secondary;
            btn.classList.toggle('active', isMatch);
        });
    },

    updatePreview() {
        const preview = document.getElementById('previewContainer');
        if (!preview) return;

        // Update preview styles
        preview.style.setProperty('--primary', this.currentTheme.primary);
        preview.style.setProperty('--secondary', this.currentTheme.secondary);
        preview.style.setProperty('--success', this.currentTheme.success);
        preview.style.setProperty('--bg-dark', this.currentTheme.background);
    },

    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        this.currentTheme.primary = preset.primary;
        this.currentTheme.secondary = preset.secondary;
        this.currentTheme.success = preset.success;
        this.currentTheme.background = preset.background;

        this.saveTheme();
        this.updateUI();
    },

    resetToDefault() {
        this.currentTheme = { ...this.defaultTheme };
        this.saveTheme();
        this.updateUI();
    },

    exportTheme() {
        const dataStr = JSON.stringify(this.currentTheme, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'habit-tracker-theme.json';
        a.click();

        URL.revokeObjectURL(url);
    },

    importTheme(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                // Merge with defaults to ensure all properties exist
                this.currentTheme = { ...this.defaultTheme, ...imported };
                this.saveTheme();
                this.updateUI();
                alert('Theme imported successfully!');
            } catch (err) {
                alert('Invalid theme file');
            }
        };
        reader.readAsText(file);
    },

    setupEventListeners() {
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyPreset(btn.dataset.preset);
            });
        });

        // Color inputs
        ['primary', 'secondary', 'success', 'bg'].forEach(colorName => {
            const input = document.getElementById(`${colorName}Color`);
            const valueDisplay = document.getElementById(`${colorName}ColorValue`);

            if (input) {
                input.addEventListener('input', (e) => {
                    const propName = colorName === 'bg' ? 'background' : colorName;
                    this.currentTheme[propName] = e.target.value;
                    if (valueDisplay) valueDisplay.textContent = e.target.value;
                    this.saveTheme();
                    this.updatePresetSelection();
                });
            }
        });

        // Toggle switches
        document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
            this.currentTheme.darkMode = e.target.checked;
            this.saveTheme();
        });

        document.getElementById('glassToggle')?.addEventListener('change', (e) => {
            this.currentTheme.glass = e.target.checked;
            this.saveTheme();
        });

        document.getElementById('animationsToggle')?.addEventListener('change', (e) => {
            this.currentTheme.animations = e.target.checked;
            this.saveTheme();
        });

        // Font size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTheme.fontSize = btn.dataset.size;
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.saveTheme();
            });
        });

        // Border radius buttons
        document.querySelectorAll('.radius-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTheme.borderRadius = btn.dataset.radius;
                document.querySelectorAll('.radius-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.saveTheme();
            });
        });

        // Reset button
        document.getElementById('resetThemeBtn')?.addEventListener('click', () => {
            if (confirm('Reset all customizations to default?')) {
                this.resetToDefault();
            }
        });

        // Export button
        document.getElementById('exportThemeBtn')?.addEventListener('click', () => {
            this.exportTheme();
        });

        // Import input
        document.getElementById('importThemeInput')?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importTheme(e.target.files[0]);
            }
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

// Export for use in main app
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
}
