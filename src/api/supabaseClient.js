import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY secrets — Supabase features will not work.');
}

export const supabase = url && key ? createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
}) : null;

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}