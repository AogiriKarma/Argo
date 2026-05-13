/**
 * Tiny fuzzy match — score by character order coverage. Good enough for
 * 1500 entries. Anything more sophisticated is overkill for ⌘K UX.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function fuzzyScore(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = normalize(haystack);
  const n = normalize(needle);
  if (h === n) return 1000;
  if (h.startsWith(n)) return 800;
  if (h.includes(n)) return 600;
  // Char-by-char order match
  let i = 0;
  let score = 0;
  let lastIdx = -1;
  for (const c of n) {
    const idx = h.indexOf(c, i);
    if (idx < 0) return -1;
    score += idx - lastIdx === 1 ? 4 : 1;
    lastIdx = idx;
    i = idx + 1;
  }
  return score;
}

export interface SearchableEntry {
  id: string;
  name: string;
  kind: 'item' | 'mob' | 'pnj' | 'region' | 'quest';
  rarity?: string;
  palier?: number;
}

export function searchEntries(
  entries: SearchableEntry[],
  query: string,
  limit = 12
): SearchableEntry[] {
  if (!query.trim()) return [];
  return entries
    .map((e) => ({ e, s: fuzzyScore(e.name, query) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ e }) => e);
}
