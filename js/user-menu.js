// ===================================
// User Menu & Clear History Module
// ===================================

const UserMenu = {
    init() {
        this.setupUserMenuToggle();
        this.setupLogoutConfirmation();
        this.setupClearHistory();
        this.setupAccountSwitcher();
        this.loadSavedAccounts();
    },

    // Toggle user dropdown menu
    setupUserMenuToggle() {
        const menuBtn = document.getElementById('userMenuBtn');
        const dropdown = document.getElementById('userDropdown');

        if (menuBtn && dropdown) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menuBtn.classList.toggle('active');
                dropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.user-menu')) {
                    menuBtn?.classList.remove('active');
                    dropdown?.classList.remove('active');
                }
            });
        }
    },

    // Logout with confirmation
    setupLogoutConfirmation() {
        const logoutBtn = document.getElementById('logoutBtn');
        const confirmModal = document.getElementById('logoutConfirmModal');
        const confirmBtn = document.getElementById('confirmLogoutBtn');

        if (logoutBtn && confirmModal) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Close dropdown
                document.getElementById('userDropdown')?.classList.remove('active');
                document.getElementById('userMenuBtn')?.classList.remove('active');
                // Show confirmation
                confirmModal.classList.add('active');
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                confirmModal.classList.remove('active');
                // Actually perform logout
                if (typeof Auth !== 'undefined') {
                    await Auth.logout();
                }
            });
        }
    },

    // Clear history modal
    setupClearHistory() {
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        const modal = document.getElementById('clearHistoryModal');

        if (clearHistoryBtn && modal) {
            clearHistoryBtn.addEventListener('click', () => {
                // Close dropdown
                document.getElementById('userDropdown')?.classList.remove('active');
                document.getElementById('userMenuBtn')?.classList.remove('active');
                // Show modal
                modal.classList.add('active');
                ClearHistory.init();
            });
        }

        // Setup time range radio buttons
        document.querySelectorAll('input[name="timeRange"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const customGroup = document.getElementById('customRangeGroup');
                if (radio.value === 'custom') {
                    customGroup.style.display = 'block';
                } else {
                    customGroup.style.display = 'none';
                }
                ClearHistory.updatePreview();
            });
        });

        // Custom days input
        const customDaysInput = document.getElementById('customDays');
        if (customDaysInput) {
            customDaysInput.addEventListener('input', () => ClearHistory.updatePreview());
        }
    },

    // Account switcher
    setupAccountSwitcher() {
        const addAccountBtn = document.getElementById('addAccountBtn');

        if (addAccountBtn) {
            addAccountBtn.addEventListener('click', () => {
                // Close dropdown
                document.getElementById('userDropdown')?.classList.remove('active');
                document.getElementById('userMenuBtn')?.classList.remove('active');
                // Show login modal for adding new account
                document.getElementById('loginModal')?.classList.add('active');
            });
        }
    },

    // Load and display saved accounts
    loadSavedAccounts() {
        const accountList = document.getElementById('accountList');
        if (!accountList) return;

        const savedAccounts = Storage.get('savedAccounts') || [];
        const currentEmail = document.getElementById('userEmail')?.textContent;

        accountList.innerHTML = '';

        savedAccounts.forEach(account => {
            if (account.email !== currentEmail) {
                const accountItem = document.createElement('button');
                accountItem.className = 'account-item';
                accountItem.innerHTML = `
                    <div class="account-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <span class="account-email">${account.email}</span>
                `;
                accountItem.onclick = () => this.switchAccount(account);
                accountList.appendChild(accountItem);
            }
        });

        if (savedAccounts.length === 0 || (savedAccounts.length === 1 && savedAccounts[0].email === currentEmail)) {
            accountList.innerHTML = '<p style="padding: 0.5rem 0.75rem; color: var(--text-tertiary); font-size: 0.813rem;">No other accounts</p>';
        }
    },

    // Save current account to list
    saveCurrentAccount(email) {
        const savedAccounts = Storage.get('savedAccounts') || [];

        // Check if already exists
        const exists = savedAccounts.find(a => a.email === email);
        if (!exists) {
            savedAccounts.push({ email, addedAt: new Date().toISOString() });
            Storage.set('savedAccounts', savedAccounts);
        }
    },

    // Switch to different account
    async switchAccount(account) {
        // Close dropdown
        document.getElementById('userDropdown')?.classList.remove('active');
        document.getElementById('userMenuBtn')?.classList.remove('active');

        const switchingEmail = account.email;

        // Log out current user first
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            const client = getSupabase();
            if (client) {
                try {
                    await client.auth.signOut();
                } catch (error) {
                    console.log('Logout during switch:', error);
                }
            }
            Auth.currentUser = null;
        }

        // Hide user menu
        const userMenu = document.getElementById('userMenu');
        if (userMenu) userMenu.style.display = 'none';

        // Check if this is a Google account (Gmail address)
        const isGoogleAccount = switchingEmail.includes('@gmail.com') || account.provider === 'google';

        if (isGoogleAccount) {
            // Use Google OAuth with login_hint for seamless switch
            const client = getSupabase();
            if (client) {
                try {
                    await client.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: window.location.origin,
                            queryParams: {
                                login_hint: switchingEmail  // Auto-select this account in Google
                            }
                        }
                    });
                    // User will be redirected to Google, then back
                    return;
                } catch (error) {
                    console.error('Google switch error:', error);
                }
            }
        }

        // For non-Google accounts, show login modal with email pre-filled
        const loginModal = document.getElementById('loginModal');
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');

        if (loginModal) {
            loginModal.classList.add('active');
            if (loginEmail) {
                loginEmail.value = switchingEmail;
                if (loginPassword) {
                    loginPassword.value = '';
                    setTimeout(() => loginPassword.focus(), 100);
                }
            }
        }
    },

    // Update user display
    updateUserDisplay(email) {
        const userEmailEl = document.getElementById('userEmail');
        const dropdownEmailEl = document.getElementById('dropdownEmail');

        if (userEmailEl) userEmailEl.textContent = email;
        if (dropdownEmailEl) dropdownEmailEl.textContent = email;

        // Save to account list
        this.saveCurrentAccount(email);
        this.loadSavedAccounts();
    }
};

// ===================================
// Clear History Module
// ===================================

const ClearHistory = {
    currentType: 'tasks',

    init() {
        this.currentType = 'tasks';
        this.updatePreview();
    },

    selectTab(type) {
        this.currentType = type;

        // Update tab UI
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        this.updatePreview();
    },

    getDaysFromRange() {
        const selectedRadio = document.querySelector('input[name="timeRange"]:checked');
        if (!selectedRadio) return 3;

        if (selectedRadio.value === 'custom') {
            return parseInt(document.getElementById('customDays')?.value) || 0;
        }

        return parseInt(selectedRadio.value);
    },

    updatePreview() {
        const days = this.getDaysFromRange();
        const countEl = document.getElementById('previewCount');
        const textEl = document.getElementById('previewText');

        if (!days || days <= 0) {
            if (countEl) countEl.textContent = '0 items';
            if (textEl) textEl.textContent = 'Enter a valid number of days';
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffKey = cutoffDate.toISOString().split('T')[0];

        let count = 0;
        let typeLabel = '';

        switch (this.currentType) {
            case 'tasks':
                typeLabel = 'task completions';
                // Count active tasks
                count += State.tasks.filter(t => {
                    if (!t.completedAt) return false;
                    return t.completedAt.split('T')[0] >= cutoffKey;
                }).length;
                // Count history
                const taskHistory = State.getCompletionHistory ? State.getCompletionHistory() : [];
                count += taskHistory.filter(h => h.dateKey >= cutoffKey).length;
                break;

            case 'habits':
                typeLabel = 'habit completions';
                const habitHistory = State.getHabitCompletionHistory ? State.getHabitCompletionHistory() : [];
                count += habitHistory.filter(h => h.dateKey >= cutoffKey).length;
                // Also count from active habits
                State.habits.forEach(habit => {
                    if (habit.completedDays) {
                        count += habit.completedDays.filter(d => d >= cutoffKey).length;
                    }
                    if (habit.completions) {
                        count += Object.keys(habit.completions).filter(d => d >= cutoffKey).length;
                    }
                });
                break;

            case 'goals':
                typeLabel = 'goal completions';
                const goalHistory = State.getGoalCompletionHistory ? State.getGoalCompletionHistory() : [];
                count += goalHistory.filter(h => h.dateKey >= cutoffKey).length;
                // Count active completed goals
                count += State.goals.filter(g => {
                    if (!g.completed || !g.completedAt) return false;
                    return g.completedAt.split('T')[0] >= cutoffKey;
                }).length;
                break;
        }

        if (countEl) countEl.textContent = `${count} ${typeLabel}`;
        if (textEl) textEl.textContent = `From ${cutoffDate.toLocaleDateString()} to today`;
    },

    clearData() {
        const days = this.getDaysFromRange();

        if (!days || days <= 0) {
            alert('Please enter a valid number of days');
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffKey = cutoffDate.toISOString().split('T')[0];

        if (!confirm(`Are you sure you want to clear all ${this.currentType} data from the last ${days} days? This cannot be undone.`)) {
            return;
        }

        switch (this.currentType) {
            case 'tasks':
                this.clearTaskHistory(cutoffKey);
                break;
            case 'habits':
                this.clearHabitHistory(cutoffKey);
                break;
            case 'goals':
                this.clearGoalHistory(cutoffKey);
                break;
        }

        // Close modal
        document.getElementById('clearHistoryModal')?.classList.remove('active');

        // Refresh analytics
        if (typeof Analytics !== 'undefined') {
            Analytics.refresh();
        }

        alert(`${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)} history cleared successfully!`);
    },

    clearTaskHistory(cutoffKey) {
        // Clear from completion history
        if (State.taskCompletionHistory) {
            State.taskCompletionHistory = State.taskCompletionHistory.filter(h => h.dateKey < cutoffKey);
            State.saveCompletionHistory();
        }

        // Clear completedAt from active tasks in range
        State.tasks.forEach(task => {
            if (task.completedAt && task.completedAt.split('T')[0] >= cutoffKey) {
                task.completed = false;
                task.completedAt = null;
            }
        });
        State.saveTasks();
    },

    clearHabitHistory(cutoffKey) {
        // Clear from habit completion history
        if (State.habitCompletionHistory) {
            State.habitCompletionHistory = State.habitCompletionHistory.filter(h => h.dateKey < cutoffKey);
            State.saveHabitCompletionHistory();
        }

        // Clear from active habits
        State.habits.forEach(habit => {
            if (habit.completedDays) {
                habit.completedDays = habit.completedDays.filter(d => d < cutoffKey);
            }
            if (habit.completions) {
                Object.keys(habit.completions).forEach(key => {
                    if (key >= cutoffKey) {
                        delete habit.completions[key];
                    }
                });
            }
        });
        State.saveHabits();
    },

    clearGoalHistory(cutoffKey) {
        // Clear from goal completion history
        if (State.goalCompletionHistory) {
            State.goalCompletionHistory = State.goalCompletionHistory.filter(h => h.dateKey < cutoffKey);
            State.saveGoalCompletionHistory();
        }

        // Clear from active goals
        State.goals.forEach(goal => {
            if (goal.completedAt && goal.completedAt.split('T')[0] >= cutoffKey) {
                goal.completed = false;
                goal.completedAt = null;
            }
        });
        State.saveGoals();
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    UserMenu.init();
});
