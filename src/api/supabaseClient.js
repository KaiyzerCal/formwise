import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth helpers ──────────────────────────────────────────────────────────────
export const auth = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  },
  signIn:              (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signInWithMagicLink: (email)           => supabase.auth.signInWithOtp({ email }),
  signInWithOAuth:     (provider)        => supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } }),
  signUp:              (email, password) => supabase.auth.signUp({ email, password }),
  logout: async () => { await supabase.auth.signOut(); window.location.href = '/'; },
  redirectToLogin: () => {},
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
};

// ── Entity factory ────────────────────────────────────────────────────────────
function makeEntity(table) {
  return {
    list: async (orderBy, limit) => {
      let q = supabase.from(table).select('*');
      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const col  = orderBy.replace(/^-/, '').replace('created_date', 'created_at');
        q = q.order(col, { ascending: !desc });
      }
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    filter: async (conditions = {}, orderBy, limit) => {
      let q = supabase.from(table).select('*');
      Object.entries(conditions).forEach(([k, v]) => {
        if (k === 'created_by') return; // RLS handles user scoping
        q = q.eq(k, v);
      });
      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const col  = orderBy.replace(/^-/, '').replace('created_date', 'created_at');
        q = q.order(col, { ascending: !desc });
      }
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    get: async (id) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    create: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser();
      const row = { ...payload, user_id: user?.id };
      delete row.created_by;
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (error) throw error;
      return data;
    },

    update: async (id, patch) => {
      const clean = { ...patch };
      delete clean.created_by;
      delete clean.user_id;
      const { data, error } = await supabase.from(table).update(clean).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// ── Entities ──────────────────────────────────────────────────────────────────
export const entities = {
  FormSession:          makeEntity('form_sessions'),
  UserProfile:          makeEntity('user_profiles'),
  WorkoutPlan:          makeEntity('workout_plans'),
  ExerciseFaultHistory: makeEntity('exercise_fault_history'),
  ExerciseTracking:     makeEntity('exercise_tracking'),
  UserAchievement:      makeEntity('user_achievements'),
  ReferenceVideo:       makeEntity('reference_videos'),

  User: {
    list: async (orderBy, limit) => {
      let q = supabase.from('user_profiles').select('*');
      if (orderBy) {
        const desc = orderBy.startsWith('-');
        q = q.order(orderBy.replace(/^-/, '').replace('created_date','created_at'), { ascending: !desc });
      }
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(p => ({
        id: p.user_id, email: p.email ?? `user-${p.user_id?.slice(0,8)}`,
        role: p.role ?? 'user', created_date: p.created_at,
        xp_total: p.xp_total, level: p.level, total_sessions: p.total_sessions,
      }));
    },
  },
};

// ── Functions (Supabase Edge Functions) ───────────────────────────────────────
export const functions = {
  invoke: async (name, { body } = {}) => {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    return data;
  },
};

// ── Drop-in export matching base44 shape ──────────────────────────────────────
export const base44 = { auth, entities, functions };
