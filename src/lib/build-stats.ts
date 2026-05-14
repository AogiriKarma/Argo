import type { Item } from '$lib/types';

type StatValue = number | [number, number];
export type StatTotals = Record<string, StatValue>;

function readStat(v: any): StatValue | null {
  if (typeof v === 'number') return v;
  if (Array.isArray(v) && v.length === 2) return [Number(v[0]), Number(v[1])];
  if (v && typeof v === 'object' && 'min' in v && 'max' in v) return [Number(v.min), Number(v.max)];
  return null;
}

function add(a: StatValue, b: StatValue): StatValue {
  const aRange = Array.isArray(a);
  const bRange = Array.isArray(b);
  if (!aRange && !bRange) return (a as number) + (b as number);
  const aMin = aRange ? (a as [number, number])[0] : (a as number);
  const aMax = aRange ? (a as [number, number])[1] : (a as number);
  const bMin = bRange ? (b as [number, number])[0] : (b as number);
  const bMax = bRange ? (b as [number, number])[1] : (b as number);
  return [aMin + bMin, aMax + bMax];
}

export function aggregateBuildStats(items: (Item | undefined | null)[]): StatTotals {
  const totals: StatTotals = {};
  for (const it of items) {
    const stats = (it as any)?.stats as Record<string, unknown> | undefined;
    if (!stats) continue;
    for (const [k, raw] of Object.entries(stats)) {
      const v = readStat(raw);
      if (v == null) continue;
      totals[k] = totals[k] == null ? v : add(totals[k], v);
    }
  }
  return totals;
}
