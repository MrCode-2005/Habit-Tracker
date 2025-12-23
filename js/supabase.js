// Supabase Client Configuration
// This file initializes the Supabase client for database operations

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase credentials
const SUPABASE_URL = 'https://plgwxcegcnowqxoggujk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TlSPeqIQP7ilpp3mLbmE7A_Qw7A0BDt';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Check if user is authenticated
export async function isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
}

// Get current user
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Database helper functions
export const db = {
    // Tasks
    async getTasks(userId) {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addTask(userId, task) {
        const { data, error } = await supabase
            .from('tasks')
            .insert([{ ...task, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateTask(taskId, updates) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteTask(taskId) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
    },

    // Habits
    async getHabits(userId) {
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addHabit(userId, habit) {
        const { data, error } = await supabase
            .from('habits')
            .insert([{ ...habit, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateHabit(habitId, updates) {
        const { data, error } = await supabase
            .from('habits')
            .update(updates)
            .eq('id', habitId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteHabit(habitId) {
        const { error } = await supabase
            .from('habits')
            .delete()
            .eq('id', habitId);

        if (error) throw error;
    },

    // Goals
    async getGoals(userId) {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addGoal(userId, goal) {
        const { data, error } = await supabase
            .from('goals')
            .insert([{ ...goal, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateGoal(goalId, updates) {
        const { data, error } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', goalId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteGoal(goalId) {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', goalId);

        if (error) throw error;
    },

    // Events
    async getEvents(userId) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', userId)
            .order('date_time', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async addEvent(userId, event) {
        const { data, error } = await supabase
            .from('events')
            .insert([{ ...event, user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateEvent(eventId, updates) {
        const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', eventId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteEvent(eventId) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) throw error;
    }
};
