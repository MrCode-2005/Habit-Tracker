// Supabase Client Configuration
// Uses CDN import for browser compatibility

const SUPABASE_URL = 'https://plgwxcegcnowqxoggujk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TlSPeqIQP7ilpp3mLbmE7A_Qw7A0BDt';

// Supabase client will be initialized when loaded
let supabaseClient = null;

// Initialize Supabase
async function initSupabase() {
    // Wait for Supabase library to load
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        return supabaseClient;
    }
    return null;
}

// Get Supabase client
function getSupabase() {
    return supabaseClient;
}

// Database helper functions
const SupabaseDB = {
    // Get current user
    async getCurrentUser() {
        const client = getSupabase();
        if (!client) return null;
        const { data: { user } } = await client.auth.getUser();
        return user;
    },

    // Tasks
    async getTasks(userId) {
        const client = getSupabase();
        if (!client) return [];
        const { data, error } = await client
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) { console.error('Error fetching tasks:', error); return []; }
        return data || [];
    },

    async upsertTask(userId, task) {
        const client = getSupabase();
        if (!client) {
            console.error('Supabase client not available for task upsert');
            return null;
        }

        console.log('Upserting task to Supabase:', { userId, taskId: task.id, title: task.title });

        const { data, error } = await client
            .from('tasks')
            .upsert([{ ...task, user_id: userId }])
            .select()
            .single();

        if (error) {
            console.error('Error upserting task:', error);
        } else {
            console.log('Task upserted successfully:', data);
        }
        return data;
    },

    async deleteTask(taskId) {
        const client = getSupabase();
        if (!client) return;
        const { error } = await client
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) console.error('Error deleting task:', error);
    },

    // Habits
    async getHabits(userId) {
        const client = getSupabase();
        if (!client) return [];
        const { data, error } = await client
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) { console.error('Error fetching habits:', error); return []; }
        return data || [];
    },

    async upsertHabit(userId, habit) {
        const client = getSupabase();
        if (!client) {
            console.error('Supabase client not available for habit upsert');
            return null;
        }

        console.log('Upserting habit to Supabase:', { userId, habitId: habit.id, name: habit.name });

        const { data, error } = await client
            .from('habits')
            .upsert([{ ...habit, user_id: userId }])
            .select()
            .single();

        if (error) {
            console.error('Error upserting habit:', error);
        } else {
            console.log('Habit upserted successfully:', data);
        }
        return data;
    },

    async deleteHabit(habitId) {
        const client = getSupabase();
        if (!client) return;
        const { error } = await client
            .from('habits')
            .delete()
            .eq('id', habitId);

        if (error) console.error('Error deleting habit:', error);
    },

    // Goals
    async getGoals(userId) {
        const client = getSupabase();
        if (!client) return [];
        const { data, error } = await client
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) { console.error('Error fetching goals:', error); return []; }
        return data || [];
    },

    async upsertGoal(userId, goal) {
        const client = getSupabase();
        if (!client) return null;

        // Convert camelCase to snake_case for database
        const dbGoal = {
            id: goal.id,
            user_id: userId,
            title: goal.title,
            type: goal.type,
            duration: goal.duration,
            start_date: goal.startDate,
            end_date: goal.endDate,
            completed: goal.completed
        };

        const { data, error } = await client
            .from('goals')
            .upsert([dbGoal])
            .select()
            .single();

        if (error) console.error('Error upserting goal:', error);
        return data;
    },

    async deleteGoal(goalId) {
        const client = getSupabase();
        if (!client) return;
        const { error } = await client
            .from('goals')
            .delete()
            .eq('id', goalId);

        if (error) console.error('Error deleting goal:', error);
    },

    // Events
    async getEvents(userId) {
        const client = getSupabase();
        if (!client) return [];
        const { data, error } = await client
            .from('events')
            .select('*')
            .eq('user_id', userId)
            .order('date_time', { ascending: true });

        if (error) { console.error('Error fetching events:', error); return []; }
        return data || [];
    },

    async upsertEvent(userId, event) {
        const client = getSupabase();
        if (!client) return null;

        const dbEvent = {
            id: event.id,
            user_id: userId,
            name: event.name,
            date_time: event.dateTime
        };

        const { data, error } = await client
            .from('events')
            .upsert([dbEvent])
            .select()
            .single();

        if (error) console.error('Error upserting event:', error);
        return data;
    },

    async deleteEvent(eventId) {
        const client = getSupabase();
        if (!client) return;
        const { error } = await client
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) console.error('Error deleting event:', error);
    }
};
