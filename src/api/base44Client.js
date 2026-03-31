/**
 * base44Client.js — compatibility shim
 * Every file imports from '@/api/base44Client'. This re-exports
 * the Supabase client under the same shape so nothing else needs changing.
 */
export { base44, supabase, auth, entities, functions } from '@/api/supabaseClient';
