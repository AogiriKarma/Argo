import { writable, derived, get } from 'svelte/store';
import type { DumpFile, Item, Mob, PNJ, Region, Quest, Panoplie } from '$lib/types';

export const loaded = writable(false);
export const dump = writable<DumpFile | null>(null);

export const items = derived(dump, ($d) => $d?.collections.items ?? []);
export const itemsHidden = derived(dump, ($d) => $d?.collections.items_hidden ?? []);
export const mobs = derived(dump, ($d) => $d?.collections.mobs ?? []);
export const pnj = derived(dump, ($d) => $d?.collections.personnages ?? []);
export const regions = derived(dump, ($d) => $d?.collections.regions ?? []);
export const quetes = derived(dump, ($d) => $d?.collections.quetes ?? []);
export const panoplies = derived(dump, ($d) => $d?.collections.panoplies ?? []);

// Index by id for cross-references in lore text
export const itemById = derived(items, ($i) => {
  const m = new Map<string, Item>();
  for (const x of $i) m.set(x.id, x);
  return m;
});
export const mobById = derived(mobs, ($m) => {
  const map = new Map<string, Mob>();
  for (const x of $m) map.set(x.id, x);
  return map;
});
export const pnjById = derived(pnj, ($p) => {
  const m = new Map<string, PNJ>();
  for (const x of $p) m.set(x.id, x);
  return m;
});
export const regionById = derived(regions, ($r) => {
  const m = new Map<string, Region>();
  for (const x of $r) m.set(x.id, x);
  return m;
});
export const questById = derived(quetes, ($q) => {
  const m = new Map<string, Quest>();
  for (const x of $q) m.set(x.id, x);
  return m;
});
export const panoplieById = derived(panoplies, ($p) => {
  const m = new Map<string, Panoplie>();
  for (const x of $p) m.set(x.id, x);
  return m;
});

let loadingPromise: Promise<DumpFile> | null = null;
let imgManifest: Set<string> | null = null;

export async function ensureDump(fetcher: typeof fetch = fetch): Promise<DumpFile> {
  if (get(loaded)) return get(dump) as DumpFile;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const [dumpRes, manifestRes] = await Promise.all([
      fetcher('/data/dump.json'),
      fetcher('/data/img-manifest.json').catch(() => null)
    ]);
    if (!dumpRes.ok) throw new Error(`dump fetch failed: ${dumpRes.status}`);
    const data = (await dumpRes.json()) as DumpFile;
    if (manifestRes && manifestRes.ok) {
      const list = (await manifestRes.json()) as string[];
      imgManifest = new Set(list);
    }
    dump.set(data);
    loaded.set(true);
    return data;
  })();
  return loadingPromise;
}

/**
 * Normalize image path from dump format (../img/…) to v2 (/img/…).
 * Returns null if the target file is known not to exist (per manifest),
 * so consumers can short-circuit to a fallback without triggering 404s.
 */
export function resolveImg(p: string | undefined | null): string | null {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  const normalized = '/' + p.replace(/^(?:\.\.\/)+/, '').replace(/^\/+/, '');
  if (imgManifest && !imgManifest.has(normalized)) return null;
  return normalized;
}
