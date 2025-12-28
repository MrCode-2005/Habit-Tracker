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
            this.isInitialized = true;
            return;
        }

        // Listen for auth changes
        client.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session?.user?.email);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session) {
                    this.currentUser = session.user;
                    this.showAuthenticatedUI();
                    // Load data in background, don't block
                    this.loadUserData().catch(err => console.error('Error loading user data:', err));
                }
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.showLoginUI();
            }
        });

        // Explicitly check for existing session with timeout
        try {
            const sessionPromise = client.auth.getSession();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session check timed out')), 5000)
            );

            const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
            console.log('getSession result:', session?.user?.email, error);

            if (session) {
                this.currentUser = session.user;
                this.showAuthenticatedUI();
                // Load data in background, don't block UI
                this.loadUserData().catch(err => console.error('Error loading user data:', err));
            } else {
                this.showLoginUI();
            }
        } catch (error) {
            console.error('Error getting session:', error);
            this.showLoginUI();
        }

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

        // Logout button is now handled by user-menu.js with confirmation
        // Just set up the confirm button to call this.logout()

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

        // Google Sign-In buttons
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', async () => {
                await this.signInWithGoogle();
            });
        }

        const googleSignupBtn = document.getElementById('googleSignupBtn');
        if (googleSignupBtn) {
            googleSignupBtn.addEventListener('click', async () => {
                await this.signInWithGoogle();
            });
        }
    },

    async signInWithGoogle() {
        const client = getSupabase();
        if (!client) {
            Toast.error('Authentication service unavailable');
            return;
        }

        try {
            const { data, error } = await client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) {
                console.error('Google sign-in error:', error);
                Toast.error('Google sign-in failed: ' + error.message);
            }
            // User will be redirected to Google, then back to the app
        } catch (error) {
            console.error('Google sign-in error:', error);
            Toast.error('An error occurred during Google sign-in');
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
            // Ignore "Auth session missing" error - user is already logged out
            if (error && !error.message.includes('session missing')) {
                throw error;
            }

            // Clear local data and localStorage to prevent data leakage
            this.currentUser = null;
            this.clearLocalData();

            // Re-render views to show cleared state
            if (typeof Tasks !== 'undefined') Tasks.render();
            if (typeof Habits !== 'undefined') Habits.render();
            if (typeof Goals !== 'undefined') Goals.render();
            if (typeof Events !== 'undefined') Events.render();

            this.showMessage('Logged out successfully', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    },

    showLoginUI() {
        // Show login modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.add('active');

        // Hide user menu
        const userMenu = document.getElementById('userMenu');
        if (userMenu) userMenu.style.display = 'none';
    },

    showAuthenticatedUI() {
        // Hide login modals
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        if (loginModal) loginModal.classList.remove('active');
        if (signupModal) signupModal.classList.remove('active');

        // Show user menu
        const userMenu = document.getElementById('userMenu');
        const userEmail = document.getElementById('userEmail');
        const dropdownEmail = document.getElementById('dropdownEmail');

        if (userMenu && this.currentUser) {
            userMenu.style.display = 'flex';
            if (userEmail) userEmail.textContent = this.currentUser.email;
            if (dropdownEmail) dropdownEmail.textContent = this.currentUser.email;

            // Update UserMenu if available
            if (typeof UserMenu !== 'undefined') {
                UserMenu.updateUserDisplay(this.currentUser.email);
            }
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
            // IMPORTANT: Clear old user data before loading new user's data
            // This prevents data leakage between different user accounts
            this.clearLocalData();

            // Sync data from Supabase to local state
            const userId = this.currentUser.id;

            // Load tasks (convert snake_case to camelCase)
            const tasks = await SupabaseDB.getTasks(userId);
            State.tasks = (tasks || []).map(t => ({
                ...t,
                completedAt: t.completed_at,
                createdAt: t.created_at
            }));
            State.saveTasks();

            // Load habits
            const habits = await SupabaseDB.getHabits(userId);
            State.habits = habits || [];
            State.saveHabits();

            // Load goals (convert snake_case to camelCase)
            const goals = await SupabaseDB.getGoals(userId);
            State.goals = (goals || []).map(g => ({
                id: g.id,
                title: g.title,
                type: g.type,
                duration: g.duration,
                startDate: g.start_date,
                endDate: g.end_date,
                completed: g.completed
            }));
            State.saveGoals();

            // Load events (convert snake_case to camelCase)
            const events = await SupabaseDB.getEvents(userId);
            State.events = (events || []).map(e => ({
                id: e.id,
                name: e.name,
                dateTime: e.date_time
            }));
            State.saveEvents();

            // Re-render all views
            if (typeof Tasks !== 'undefined') Tasks.render();
            if (typeof Habits !== 'undefined') Habits.render();
            if (typeof Goals !== 'undefined') Goals.render();
            if (typeof Events !== 'undefined') Events.render();
            if (typeof Analytics !== 'undefined') Analytics.refresh();

            // Sync playlists - push local to cloud, then load cloud
            // Wrapped in try-catch to prevent sync errors from crashing the app
            if (typeof FocusMode !== 'undefined') {
                try {
                    // First, push any existing local playlists to cloud
                    const localPlaylists = localStorage.getItem('focusPlaylists');
                    if (localPlaylists) {
                        const playlists = JSON.parse(localPlaylists);
                        for (const [playlistId, playlist] of Object.entries(playlists)) {
                            try {
                                await SupabaseDB.upsertPlaylist(userId, {
                                    id: playlistId,
                                    name: playlist.name,
                                    url: playlist.url || '',
                                    tracks: playlist.tracks || []
                                });
                            } catch (playlistError) {
                                console.warn('Skipping playlist sync (RLS error):', playlistId, playlistError.message);
                            }
                        }
                    }

                    // Push local video playlists to cloud
                    const localVideoPlaylists = localStorage.getItem('focusVideoPlaylists');
                    if (localVideoPlaylists) {
                        const videoPlaylists = JSON.parse(localVideoPlaylists);
                        for (const [playlistId, playlist] of Object.entries(videoPlaylists)) {
                            try {
                                await SupabaseDB.upsertVideoPlaylist(userId, {
                                    id: playlistId,
                                    name: playlist.name,
                                    videos: playlist.videos || []
                                });
                            } catch (videoPlaylistError) {
                                console.warn('Skipping video playlist sync (RLS error):', playlistId, videoPlaylistError.message);
                            }
                        }
                    }

                    // Now reload playlists (will merge cloud with local)
                    FocusMode.loadPlaylists();
                    FocusMode.loadVideoPlaylists();
                } catch (focusModeError) {
                    console.warn('Focus mode sync skipped:', focusModeError.message);
                }
            }

            // Sync calendar events - push local to cloud, then reload
            if (typeof Calendar !== 'undefined') {
                try {
                    const localCalendarEvents = localStorage.getItem('calendarEvents');
                    console.log('Calendar sync: Local events found:', localCalendarEvents ? 'yes' : 'no');

                    if (localCalendarEvents) {
                        const events = JSON.parse(localCalendarEvents);
                        console.log('Calendar sync: Pushing', Object.keys(events).length, 'dates to cloud');

                        for (const [date, dateEvents] of Object.entries(events)) {
                            for (const event of dateEvents) {
                                try {
                                    await SupabaseDB.upsertCalendarEvent(userId, date, event);
                                } catch (eventError) {
                                    console.warn('Skipping calendar event sync (RLS error):', event.name, eventError.message);
                                }
                            }
                        }
                        console.log('Calendar sync: Push complete');
                    }

                    // Reload calendar events from cloud
                    await Calendar.loadEvents();
                    Calendar.render();
                    Calendar.renderUpcomingEvents();
                    console.log('Calendar sync: Reload complete');
                } catch (calendarError) {
                    console.warn('Calendar sync skipped:', calendarError.message);
                }
            }

            console.log('Data synced from Supabase for user:', userId);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    },

    // Clear all local data - used when switching users or logging out
    clearLocalData() {
        State.tasks = [];
        State.habits = [];
        State.events = [];
        State.goals = [];
        Storage.remove('tasks');
        Storage.remove('habits');
        Storage.remove('events');
        Storage.remove('goals');
    },

    showMessage(message, type = 'info') {
        if (typeof Toast !== 'undefined') {
            if (type === 'error') {
                Toast.error(message);
            } else if (type === 'success') {
                Toast.success(message);
            } else {
                Toast.info(message);
            }
        } else {
            console.log(`[${type}] ${message}`);
        }
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    getUserId() {
        return this.currentUser?.id;
    }
};
