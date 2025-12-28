// ===================================
// Toast Notification System
// Professional in-app notifications
// ===================================

const Toast = {
    container: null,
    queue: [],
    maxVisible: 3,

    init() {
        // Create toast container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    // Show a toast notification
    // type: 'success' | 'error' | 'warning' | 'info'
    show(message, type = 'info', duration = 4000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid ${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" onclick="Toast.dismiss(this.parentElement)">
                <i class="fa-solid fa-times"></i>
            </button>
            <div class="toast-progress">
                <div class="toast-progress-bar" style="animation-duration: ${duration}ms"></div>
            </div>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }

        return toast;
    },

    dismiss(toast) {
        if (!toast || toast.classList.contains('toast-hiding')) return;

        toast.classList.add('toast-hiding');
        toast.classList.remove('toast-show');

        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    },

    // Convenience methods
    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    },

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration = 4500) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    },

    // Confirmation dialog (replaces confirm())
    async confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            this.init();

            const overlay = document.createElement('div');
            overlay.className = 'toast-confirm-overlay';

            overlay.innerHTML = `
                <div class="toast-confirm-dialog">
                    <div class="toast-confirm-header">
                        <i class="fa-solid fa-question-circle"></i>
                        <h3>${title}</h3>
                    </div>
                    <p class="toast-confirm-message">${message}</p>
                    <div class="toast-confirm-actions">
                        <button class="btn btn-secondary toast-confirm-cancel">Cancel</button>
                        <button class="btn btn-primary toast-confirm-ok">Confirm</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Trigger animation
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });

            const closeDialog = (result) => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
                resolve(result);
            };

            overlay.querySelector('.toast-confirm-cancel').onclick = () => closeDialog(false);
            overlay.querySelector('.toast-confirm-ok').onclick = () => closeDialog(true);
            overlay.onclick = (e) => {
                if (e.target === overlay) closeDialog(false);
            };
        });
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => Toast.init());
