/**
 * base44Client.js — Supabase compatibility shim.
 *
 * Provides the same API surface components expect from the old Base44 SDK
 * (base44.auth, base44.entities, base44.functions, base44.integrations)
 * but backed by Supabase. Importing components don't need to change.
 */
import { supabase, getCurrentUser, isAuthenticated as _isAuthenticated } from './supabaseClient';

// ── Table registry ────────────────────────────────────────────────────────────
const TABLES = {
  FormSession:          'form_sessions',
  UserProfile:          'user_profiles',
  UserAchievement:      'user_achievements',
  WorkoutPlan:          'workout_plans',
  ReferenceVideo:       'reference_videos',
  ExerciseFaultHistory: 'exercise_fault_history',
  ExerciseTracking:     'exercise_tracking',
};

async function getUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

function parseOrder(orderBy) {
  if (!orderBy) return { column: 'created_at', ascending: false };
  const desc = orderBy.startsWith('-');
  return { column: desc ? orderBy.slice(1) : orderBy, ascending: !desc };
}

function makeEntity(entityName) {
  const table = TABLES[entityName];
  if (!table) throw new Error(`[base44 shim] Unknown entity: ${entityName}`);

  return {
    async list(orderBy, limit) {
      const { column, ascending } = parseOrder(orderBy);
      let q = supabase.from(table).select('*').order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async create(data) {
      const userId = await getUserId();
      const payload = userId ? { ...data, user_id: userId } : data;
      const { data: created, error } = await supabase
        .from(table).insert(payload).select().single();
      if (error) throw error;
      return created;
    },

    async update(id, patch) {
      const { data: updated, error } = await supabase
        .from(table).update(patch).eq('id', id).select().single();
      if (error) throw error;
      return updated;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// ── Auth shim ─────────────────────────────────────────────────────────────────
const auth = {
  async isAuthenticated() {
    return _isAuthenticated();
  },

  async me() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    return {
      id:    user.id,
      email: user.email,
      name:  user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
      ...user.user_metadata,
    };
  },

  async logout(redirectTo) {
    await supabase.auth.signOut();
    if (redirectTo) window.location.href = redirectTo;
  },

  redirectToLogin() {
    window.location.href = '/';
  },
};

// ── Functions shim (Supabase Edge Functions) ──────────────────────────────────
const functions = {
  async invoke(name, body) {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    return { data };
  },
};

// ── Storage / integrations shim ───────────────────────────────────────────────
const integrations = {
  Core: {
    async UploadFile({ file }) {
      const userId = await getUserId();
      const ext  = file.name.split('.').pop() || 'webm';
      const path = `${userId ?? 'anon'}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('session-videos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('session-videos').getPublicUrl(data.path);
      return { file_url: publicUrl };
    },
  },
};

// ── Build entities namespace ──────────────────────────────────────────────────
const entities = Object.fromEntries(
  Object.keys(TABLES).map(name => [name, makeEntity(name)])
);

export const base44 = { auth, entities, functions, integrations };
