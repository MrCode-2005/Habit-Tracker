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

        // Convert camelCase to snake_case for database
        const dbTask = {
            id: task.id,
            user_id: userId,
            title: task.title,
            block: task.block,
            hours: task.hours || 0,
            minutes: task.minutes || 0,
            priority: task.priority,
            notes: task.notes || '',
            subtasks: task.subtasks || [],
            completed: task.completed || false
        };

        const { data, error } = await client
            .from('tasks')
            .upsert([dbTask])
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

        // Convert camelCase to snake_case for database
        const dbHabit = {
            id: habit.id,
            user_id: userId,
            name: habit.name,
            completions: habit.completions || {},
            current_streak: habit.currentStreak || 0,
            best_streak: habit.bestStreak || 0
        };

        const { data, error } = await client
            .from('habits')
            .upsert([dbHabit])
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
    },

    // Playlists (Focus Mode)
    async getPlaylists(userId) {
        const client = getSupabase();
        if (!client) return [];
        const { data, error } = await client
            .from('playlists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) { console.error('Error fetching playlists:', error); return []; }
        return data || [];
    },

    async upsertPlaylist(userId, playlist) {
        const client = getSupabase();
        if (!client) return null;

        const dbPlaylist = {
            id: playlist.id || `playlist_${Date.now()}`,
            user_id: userId,
            name: playlist.name,
            url: playlist.url || '',
            tracks: playlist.tracks || []
        };

        const { data, error } = await client
            .from('playlists')
            .upsert([dbPlaylist])
            .select()
            .single();

        if (error) console.error('Error upserting playlist:', error);
        return data;
    },

    async deletePlaylist(playlistId) {
        const client = getSupabase();
        if (!client) return;
        const { error } = await client
            .from('playlists')
            .delete()
            .eq('id', playlistId);

        if (error) console.error('Error deleting playlist:', error);
    },

    // Video Playlists (Focus Mode Video Backgrounds)
    async getVideoPlaylists(userId) {
        const client = getSupabase();
        if (!client) return [];
        const { data, error } = await client
            .from('video_playlists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) { console.error('Error fetching video playlists:', error); return []; }
        return data || [];
    },

    async upsertVideoPlaylist(userId, playlist) {
        const client = getSupabase();
        if (!client) return null;

        const dbPlaylist = {
            id: playlist.id || `vpl_${Date.now()}`,
            user_id: userId,
            name: playlist.name,
            videos: playlist.videos || []
        };

        const { data, error } = await client
            .from('video_playlists')
            .upsert([dbPlaylist])
            .select()
            .single();

        if (error) console.error('Error upserting video playlist:', error);
        return data;
    },

    async deleteVideoPlaylist(playlistId) {
        const client = getSupabase();
        if (!client) return;
        const { error } = await client
            .from('video_playlists')
            .delete()
            .eq('id', playlistId);

        if (error) console.error('Error deleting video playlist:', error);
    }
};
