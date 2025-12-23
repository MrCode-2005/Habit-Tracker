// Authentication Module for Supabase
import { supabase, getCurrentUser } from './supabase.js';

const Auth = {
    currentUser: null,

    async init() {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            this.currentUser = session.user;
            this.showAuthenticatedUI();
            await this.loadUserData();
        } else {
            this.showLoginUI();
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.showAuthenticatedUI();
                this.loadUserData();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.showLoginUI();
                this.clearLocalData();
            }
        });

        // Setup auth modal handlers
        this.setupAuthModals();
    },

    setupAuthModals() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });

        // Signup form
        document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.signup();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await this.logout();
        });

        // Show signup/login modals
        document.getElementById('showSignupBtn')?.addEventListener('click', () => {
            document.getElementById('loginModal').classList.remove('active');
            document.getElementById('signupModal').classList.add('active');
        });

        document.getElementById('showLoginBtn')?.addEventListener('click', () => {
            document.getElementById('signupModal').classList.remove('active');
            document.getElementById('loginModal').classList.add('active');
        });
    },

    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            document.getElementById('loginModal').classList.remove('active');
            this.showMessage('Login successful!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    },

    async signup() {
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            document.getElementById('signupModal').classList.remove('active');
            this.showMessage('Account created! Please check your email to verify.', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    },

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            this.showMessage('Logged out successfully', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    },

    showLoginUI() {
        // Hide main app, show login modal
        document.getElementById('loginModal')?.classList.add('active');
        document.querySelector('.main-container')?.style.setProperty('display', 'none');
        document.querySelector('.side-panel')?.style.setProperty('display', 'none');

        // Hide user profile
        document.getElementById('userProfile')?.style.setProperty('display', 'none');
    },

    showAuthenticatedUI() {
        // Show main app, hide login
        document.getElementById('loginModal')?.classList.remove('active');
        document.getElementById('signupModal')?.classList.remove('active');
        document.querySelector('.main-container')?.style.removeProperty('display');
        document.querySelector('.side-panel')?.style.removeProperty('display');

        // Show user profile
        const userProfile = document.getElementById('userProfile');
        if (userProfile && this.currentUser) {
            userProfile.style.removeProperty('display');
            document.getElementById('userEmail').textContent = this.currentUser.email;
        }
    },

    async loadUserData() {
        // Trigger data sync from Supabase
        if (typeof State !== 'undefined') {
            await State.syncFromSupabase();
        }
    },

    clearLocalData() {
        // Clear localStorage on logout
        if (typeof State !== 'undefined') {
            State.tasks = [];
            State.habits = [];
            State.goals = [];
            State.events = [];
            Storage.clear();
        }
    },

    showMessage(message, type = 'info') {
        // Simple alert for now (can be improved with toast notifications)
        if (type === 'error') {
            alert('Error: ' + message);
        } else {
            alert(message);
        }
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    getUserId() {
        return this.currentUser?.id;
    }
};

export default Auth;
