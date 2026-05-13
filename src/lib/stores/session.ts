import { writable, derived } from 'svelte/store';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseEnabled } from '$lib/supabase';
import { browser } from '$app/environment';

export const session = writable<Session | null>(null);
export const sessionUser = derived(session, ($s) => $s?.user ?? null);
export const isAuthed = derived(session, ($s) => !!$s);

if (browser && supabase) {
  supabase.auth.getSession().then(({ data }) => session.set(data.session));
  supabase.auth.onAuthStateChange((_event, s) => session.set(s));
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error('Auth indisponible');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUpWithPassword(email: string, password: string) {
  if (!supabase) throw new Error('Auth indisponible');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signInWithOAuth(provider: 'google' | 'discord') {
  if (!supabase) throw new Error('Auth indisponible');
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: browser ? window.location.origin + '/me' : undefined
    }
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export { supabaseEnabled };
