/**
 * base44Client.js
 * 
 * Uses the real Base44 SDK for authentication.
 * Uses Supabase shim for entity data operations (session store, etc.).
 * Components import { base44 } from here — auth comes from the platform SDK,
 * entities/integrations fall through to Supabase when available.
 */
import { createClient as createBase44Client } from '@base44/sdk';
import { supabase, getCurrentUser, isAuthenticated as _isSupabaseAuthenticated } from './supabaseClient';

// Real Base44 SDK — handles auth, login redirects, etc.
const _base44 = createBase44Client();

// ── Table registry for Supabase entity shim ───────────────────────────────────
const TABLES = {
  FormSession:          'form_sessions',
  UserProfile:          'user_profiles',
  UserAchievement:      'user_achievements',
  WorkoutPlan:          'workout_plans',
  ReferenceVideo:       'reference_videos',
  ExerciseFaultHistory: 'exercise_fault_history',
  ExerciseTracking:     'exercise_tracking',
};

function parseOrder(orderBy) {
  if (!orderBy) return { column: 'created_at', ascending: false };
  const desc = orderBy.startsWith('-');
  return { column: desc ? orderBy.slice(1) : orderBy, ascending: !desc };
}

async function getUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

function makeEntity(entityName) {
  const table = TABLES[entityName];
  if (!table) {
    // Fall back to real Base44 SDK for unknown entities
    return _base44.entities?.[entityName] ?? null;
  }

  // If supabase client is null (secrets missing), fall through to Base44 SDK
  if (!supabase) {
    return _base44.entities?.[entityName] ?? {
      async list() { return []; },
      async create() { return {}; },
      async update() { return {}; },
      async delete() {},
    };
  }

  return {
    async list(orderBy, limit) {
      const { column, ascending } = parseOrder(orderBy);
      let q = supabase.from(table).select('*').order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async filter(filters, orderBy, limit) {
      const { column, ascending } = parseOrder(orderBy);
      let q = supabase.from(table).select('*');
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          q = q.eq(key, value);
        });
      }
      q = q.order(column, { ascending });
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

// ── Build entities namespace ──────────────────────────────────────────────────
const entities = new Proxy({}, {
  get(_, name) {
    return makeEntity(name);
  }
});

// ── Storage / integrations shim ───────────────────────────────────────────────
const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (!supabase) {
        // Fall back to Base44 SDK
        return _base44.integrations.Core.UploadFile({ file });
      }
      const userId = await getUserId();
      const ext  = file.name?.split('.').pop() || 'webm';
      const path = `${userId ?? 'anon'}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('session-videos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('session-videos').getPublicUrl(data.path);
      return { file_url: publicUrl };
    },
    // Proxy other Core methods to real Base44 SDK
    async InvokeLLM(params) {
      return _base44.integrations.Core.InvokeLLM(params);
    },
    async SendEmail(params) {
      return _base44.integrations.Core.SendEmail(params);
    },
  },
};

// ── Compose final export ──────────────────────────────────────────────────────
export const base44 = {
  // Auth always from real Base44 SDK
  auth: _base44.auth,
  // Entities from Supabase shim (with fallback)
  entities,
  // Functions
  functions: _base44.functions ?? {
    async invoke(name, body) {
      if (!supabase) return { data: null };
      const { data, error } = await supabase.functions.invoke(name, { body });
      if (error) throw error;
      return { data };
    },
  },
  // Integrations hybrid
  integrations,
  // Analytics from real SDK
  analytics: _base44.analytics,
  // Users from real SDK
  users: _base44.users,
};