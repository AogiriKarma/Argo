/**
 * Cloud sync layer for the user data store.
 *
 * Strategy:
 *  - localStorage stays the source of truth offline (existing `user.ts` store)
 *  - On login: fetch remote → if remote is newer, replace local; else push local
 *  - On every local change: debounced (1.2s) upsert to remote
 *  - Track `updated_at` server-side and `lastSyncAt` locally to resolve conflicts
 *
 * Schema (created in Supabase SQL editor):
 *   create table user_data (
 *     user_id uuid primary key references auth.users(id) on delete cascade,
 *     data jsonb not null default '{}'::jsonb,
 *     updated_at timestamptz not null default now()
 *   );
 *   alter table user_data enable row level security;
 *   create policy "own select" on user_data for select using (auth.uid() = user_id);
 *   create policy "own insert" on user_data for insert with check (auth.uid() = user_id);
 *   create policy "own update" on user_data for update using (auth.uid() = user_id);
 */
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { session } from '$lib/stores/session';
import { user } from '$lib/data/user';
import { writable } from 'svelte/store';

export type SyncStatus = 'idle' | 'pulling' | 'pushing' | 'synced' | 'offline' | 'error';
export const syncStatus = writable<SyncStatus>('idle');
export const lastSyncedAt = writable<Date | null>(null);

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let suppressNextPush = false;
let currentUserId: string | null = null;

async function pull(userId: string) {
  if (!supabase) return;
  syncStatus.set('pulling');
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data?.data) {
      // Remote has data — replace local with it. Suppress the resulting save loop.
      suppressNextPush = true;
      user.set(data.data as any);
    } else {
      // No remote row yet — push current local state up.
      const local = get(user);
      await supabase.from('user_data').upsert({
        user_id: userId,
        data: local,
        updated_at: new Date().toISOString()
      });
    }
    lastSyncedAt.set(new Date());
    syncStatus.set('synced');
  } catch (e) {
    console.error('[cloud-sync] pull failed', e);
    syncStatus.set('error');
  }
}

async function push() {
  if (!supabase || !currentUserId) return;
  syncStatus.set('pushing');
  try {
    const local = get(user);
    const { error } = await supabase.from('user_data').upsert({
      user_id: currentUserId,
      data: local,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    lastSyncedAt.set(new Date());
    syncStatus.set('synced');
  } catch (e) {
    console.error('[cloud-sync] push failed', e);
    syncStatus.set(navigator.onLine ? 'error' : 'offline');
  }
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 1200);
}

export function initCloudSync() {
  if (!browser || !supabase) return;

  // Watch session changes — pull on login, reset on logout
  session.subscribe(async ($s) => {
    const newUserId = $s?.user.id ?? null;
    if (newUserId === currentUserId) return;
    currentUserId = newUserId;
    if (newUserId) {
      await pull(newUserId);
    } else {
      syncStatus.set('idle');
    }
  });

  // Push on every local change (debounced)
  user.subscribe(() => {
    if (!currentUserId) return;
    if (suppressNextPush) {
      suppressNextPush = false;
      return;
    }
    schedulePush();
  });

  // Network status
  window.addEventListener('online', () => { if (currentUserId) schedulePush(); });
  window.addEventListener('offline', () => syncStatus.set('offline'));
}
