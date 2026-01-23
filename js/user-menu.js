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

    // Save current account to list (with session tokens for instant switching)
    async saveCurrentAccount(email) {
        const savedAccounts = Storage.get('savedAccounts') || [];
        const client = getSupabase();

        // Get current session to store tokens
        let sessionData = null;
        if (client) {
            try {
                const { data: { session } } = await client.auth.getSession();
                if (session) {
                    sessionData = {
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                        provider: session.user?.app_metadata?.provider || 'email'
                    };
                }
            } catch (err) {
                console.log('Could not get session for storage:', err);
            }
        }

        // Check if already exists - update tokens if so
        const existingIndex = savedAccounts.findIndex(a => a.email === email);
        if (existingIndex >= 0) {
            // Update existing account with fresh tokens
            savedAccounts[existingIndex] = {
                ...savedAccounts[existingIndex],
                ...sessionData,
                lastUsed: new Date().toISOString()
            };
        } else {
            // Add new account
            savedAccounts.push({
                email,
                ...sessionData,
                addedAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            });
        }
        Storage.set('savedAccounts', savedAccounts);
    },

    // Switch to different account
    async switchAccount(account) {
        // Close dropdown
        document.getElementById('userDropdown')?.classList.remove('active');
        document.getElementById('userMenuBtn')?.classList.remove('active');

        const switchingEmail = account.email;
        const client = getSupabase();

        // Check if we have stored tokens for this account
        if (account.access_token && account.refresh_token && client) {
            console.log('Attempting instant switch using stored tokens...');

            // Try to restore the session using stored tokens
            try {
                const { data, error } = await client.auth.setSession({
                    access_token: account.access_token,
                    refresh_token: account.refresh_token
                });

                if (!error && data?.session) {
                    console.log('Session restored successfully:', data.session.user?.email);

                    // Update Auth module
                    if (typeof Auth !== 'undefined') {
                        Auth.currentUser = data.session.user;
                        Auth.showAuthenticatedUI();
                        Auth.loadUserData().catch(err => console.error('Error loading user data:', err));
                    }

                    // Update the stored tokens with fresh ones
                    this.updateStoredTokens(switchingEmail, data.session);

                    // Reload the accounts list
                    this.loadSavedAccounts();
                    return; // Success - instant switch complete!
                } else {
                    console.log('Token restoration failed:', error?.message);
                    // Clear expired tokens
                    this.clearStoredTokens(switchingEmail);
                }
            } catch (err) {
                console.error('Error restoring session:', err);
                // Clear invalid tokens
                this.clearStoredTokens(switchingEmail);
            }
        }

        // Fallback: Need to re-authenticate
        console.log('No valid stored tokens, falling back to authentication...');

        // Check if this is a Google account
        const isGoogleAccount = switchingEmail.includes('@gmail.com') || account.provider === 'google';

        if (isGoogleAccount && client) {
            // Set OAuth flag to prevent login modal flash
            if (typeof Auth !== 'undefined') {
                Auth.isProcessingOAuth = true;
            }

            try {
                await client.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin,
                        skipBrowserRedirect: false,
                        queryParams: {
                            login_hint: switchingEmail,
                            prompt: 'none'  // Try to skip account picker
                        }
                    }
                });
                return;
            } catch (error) {
                console.error('Google switch error:', error);
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

    // Update stored tokens for an account
    updateStoredTokens(email, session) {
        const savedAccounts = Storage.get('savedAccounts') || [];
        const index = savedAccounts.findIndex(a => a.email === email);
        if (index >= 0 && session) {
            savedAccounts[index].access_token = session.access_token;
            savedAccounts[index].refresh_token = session.refresh_token;
            savedAccounts[index].lastUsed = new Date().toISOString();
            Storage.set('savedAccounts', savedAccounts);
        }
    },

    // Clear stored tokens for an account (when they expire)
    clearStoredTokens(email) {
        const savedAccounts = Storage.get('savedAccounts') || [];
        const index = savedAccounts.findIndex(a => a.email === email);
        if (index >= 0) {
            delete savedAccounts[index].access_token;
            delete savedAccounts[index].refresh_token;
            Storage.set('savedAccounts', savedAccounts);
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

    async clearData() {
        const days = this.getDaysFromRange();

        if (!days || days <= 0) {
            Toast.warning('Please enter a valid number of days');
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffKey = cutoffDate.toISOString().split('T')[0];

        const confirmed = await Toast.confirm(
            `Are you sure you want to clear all ${this.currentType} data from the last ${days} days? This cannot be undone.`,
            'Clear History'
        );

        if (!confirmed) {
            return;
        }

        switch (this.currentType) {
            case 'tasks':
                await this.clearTaskHistory(cutoffKey);
                break;
            case 'habits':
                await this.clearHabitHistory(cutoffKey);
                break;
            case 'goals':
                await this.clearGoalHistory(cutoffKey);
                break;
        }

        // Close modal
        document.getElementById('clearHistoryModal')?.classList.remove('active');

        // Refresh analytics
        if (typeof Analytics !== 'undefined') {
            Analytics.refresh();
        }

        Toast.success(`${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)} history cleared successfully!`);
    },

    async clearTaskHistory(cutoffKey) {
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

        // Also delete from Supabase
        if (typeof SupabaseDB !== 'undefined' && typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            const userId = Auth.getUserId();
            if (userId) {
                await SupabaseDB.deleteTaskHistoryByDateRange(userId, cutoffKey);
            }
        }
    },

    async clearHabitHistory(cutoffKey) {
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

        // Also delete from Supabase
        if (typeof SupabaseDB !== 'undefined' && typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            const userId = Auth.getUserId();
            if (userId) {
                await SupabaseDB.deleteHabitHistoryByDateRange(userId, cutoffKey);
            }
        }
    },

    async clearGoalHistory(cutoffKey) {
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

        // Also delete from Supabase
        if (typeof SupabaseDB !== 'undefined' && typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            const userId = Auth.getUserId();
            if (userId) {
                await SupabaseDB.deleteGoalHistoryByDateRange(userId, cutoffKey);
            }
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    UserMenu.init();
});
