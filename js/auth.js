// Authentication Module for Supabase
const Auth = {
    currentUser: null,
    isInitialized: false,

    async init() {
        // Initialize Supabase client
        await initSupabase();

        const client = getSupabase();
        if (!client) {
            console.log('Supabase not available, using local storage only');
            this.showMainApp();
            return;
        }

        // Check for existing session
        const { data: { session } } = await client.auth.getSession();

        if (session) {
            this.currentUser = session.user;
            this.showAuthenticatedUI();
            await this.loadUserData();
        } else {
            this.showLoginUI();
        }

        // Listen for auth changes
        client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.showAuthenticatedUI();
                this.loadUserData();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.showLoginUI();
            }
        });

        // Setup auth modal handlers
        this.setupAuthModals();
        this.isInitialized = true;
    },

    setupAuthModals() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.login();
            });
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.signup();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.logout();
            });
        }

        // Show signup/login modals
        const showSignupBtn = document.getElementById('showSignupBtn');
        if (showSignupBtn) {
            showSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('loginModal').classList.remove('active');
                document.getElementById('signupModal').classList.add('active');
            });
        }

        const showLoginBtn = document.getElementById('showLoginBtn');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('signupModal').classList.remove('active');
                document.getElementById('loginModal').classList.add('active');
            });
        }
    },

    async login() {
        const client = getSupabase();
        if (!client) return;

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const { data, error } = await client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.currentUser = data.user;
            document.getElementById('loginModal').classList.remove('active');
            this.showAuthenticatedUI();

            // Load user data and refresh views
            await this.loadUserData();

            this.showMessage('Login successful!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    },

    async signup() {
        const client = getSupabase();
        if (!client) return;

        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        try {
            const { data, error } = await client.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            document.getElementById('signupModal').classList.remove('active');
            this.showMessage('Account created! You can now login.', 'success');
            document.getElementById('loginModal').classList.add('active');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    },

    async logout() {
        const client = getSupabase();
        if (!client) return;

        try {
            const { error } = await client.auth.signOut();
            if (error) throw error;

            // Clear local data
            this.currentUser = null;
            this.showMessage('Logged out successfully', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    },

    showLoginUI() {
        // Show login modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.add('active');

        // Hide user profile
        const userProfile = document.getElementById('userProfile');
        if (userProfile) userProfile.style.display = 'none';
    },

    showAuthenticatedUI() {
        // Hide login modals
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        if (loginModal) loginModal.classList.remove('active');
        if (signupModal) signupModal.classList.remove('active');

        // Show user profile
        const userProfile = document.getElementById('userProfile');
        const userEmail = document.getElementById('userEmail');
        if (userProfile && this.currentUser) {
            userProfile.style.display = 'flex';
            if (userEmail) userEmail.textContent = this.currentUser.email;
        }
    },

    showMainApp() {
        // For offline mode - just show the app without auth
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        if (loginModal) loginModal.classList.remove('active');
        if (signupModal) signupModal.classList.remove('active');
    },

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            // Sync data from Supabase to local state
            const userId = this.currentUser.id;

            // Load tasks
            const tasks = await SupabaseDB.getTasks(userId);
            if (tasks.length > 0) {
                State.tasks = tasks;
                State.saveTasks();
            }

            // Load habits
            const habits = await SupabaseDB.getHabits(userId);
            if (habits.length > 0) {
                State.habits = habits;
                State.saveHabits();
            }

            // Load goals (convert snake_case to camelCase)
            const goals = await SupabaseDB.getGoals(userId);
            if (goals.length > 0) {
                State.goals = goals.map(g => ({
                    id: g.id,
                    title: g.title,
                    type: g.type,
                    duration: g.duration,
                    startDate: g.start_date,
                    endDate: g.end_date,
                    completed: g.completed
                }));
                State.saveGoals();
            }

            // Load events (convert snake_case to camelCase)
            const events = await SupabaseDB.getEvents(userId);
            if (events.length > 0) {
                State.events = events.map(e => ({
                    id: e.id,
                    name: e.name,
                    dateTime: e.date_time
                }));
                State.saveEvents();
            }

            // Re-render all views
            if (typeof Tasks !== 'undefined') Tasks.render();
            if (typeof Habits !== 'undefined') Habits.render();
            if (typeof Goals !== 'undefined') Goals.render();
            if (typeof Events !== 'undefined') Events.render();
            if (typeof Analytics !== 'undefined') Analytics.refresh();

            console.log('Data synced from Supabase');
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    },

    showMessage(message, type = 'info') {
        alert(message);
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    getUserId() {
        return this.currentUser?.id;
    }
};
