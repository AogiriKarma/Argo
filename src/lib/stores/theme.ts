import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface ThemeDef {
  id: string;
  label: string;
  /** Tiny preview swatch palette: [bg, surface, accent] */
  swatch: [string, string, string];
}

export const themes: ThemeDef[] = [
  { id: 'default',     label: 'Aincrad',         swatch: ['#0c0f15', '#161a23', '#5fb4ff'] },
  { id: 'nord',        label: 'Nord',            swatch: ['#2e3440', '#3b4252', '#88c0d0'] },
  { id: 'catppuccin',  label: 'Catppuccin',      swatch: ['#1e1e2e', '#313244', '#cba6f7'] },
  { id: 'tokyo-night', label: 'Tokyo Night',     swatch: ['#1a1b26', '#24283b', '#7aa2f7'] },
  { id: 'everblush',   label: 'Everblush',       swatch: ['#141b1e', '#1a2326', '#67b0e8'] },
  { id: 'gruvbox',     label: 'Gruvbox',         swatch: ['#282828', '#3c3836', '#fabd2f'] },
  { id: 'rose-pine',   label: 'Rosé Pine',       swatch: ['#191724', '#1f1d2e', '#c4a7e7'] }
];

const KEY = 'vcl_theme';

function initial(): string {
  if (!browser) return 'default';
  try { return localStorage.getItem(KEY) || 'default'; } catch { return 'default'; }
}

export const theme = writable<string>(initial());

if (browser) {
  theme.subscribe((id) => {
    try { localStorage.setItem(KEY, id); } catch {}
    const root = document.documentElement;
    if (id === 'default') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', id);
  });

  // Sync across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) theme.set(e.newValue);
  });
}
