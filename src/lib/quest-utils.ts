import type { Quest } from '$lib/types';

export interface Reward {
  type: 'exp' | 'cols' | 'items';
  xp?: number;
  cols?: number;
  label?: string;
  itemId?: string;
  qty?: number;
  id?: string;
}

export function questRewards(q: Quest): Reward[] {
  return ((q.recompenses ?? []) as Reward[]).filter(Boolean);
}

export function totalXP(q: Quest): number {
  return questRewards(q).reduce((s, r) => s + (r.type === 'exp' ? r.xp ?? 0 : 0), 0);
}

export function totalCols(q: Quest): number {
  return questRewards(q).reduce((s, r) => s + (r.type === 'cols' ? r.cols ?? 0 : 0), 0);
}

export function itemRewards(q: Quest): Reward[] {
  return questRewards(q).filter((r) => r.type === 'items');
}

/** Normalized item rewards as `{ id, qty }`. */
export function itemRewardPairs(q: Quest): { id: string; qty: number }[] {
  const out: { id: string; qty: number }[] = [];
  for (const r of itemRewards(q)) {
    const id = r.itemId ?? r.id;
    if (!id) continue;
    out.push({ id, qty: Number(r.qty ?? 1) || 1 });
  }
  return out;
}

/** Sum of items required across all objectifs */
export function requiredItems(q: Quest): { id: string; qty: number }[] {
  const out = new Map<string, number>();
  for (const obj of q.objectifs ?? []) {
    const items = (obj as any).items as { id: string; qte: number }[] | undefined;
    if (items) {
      for (const it of items) out.set(it.id, (out.get(it.id) ?? 0) + (it.qte ?? 0));
    }
  }
  return [...out.entries()].map(([id, qty]) => ({ id, qty }));
}

/** Rentability metric — XP only. Cols are displayed separately, never aggregated. */
export function profitScore(q: Quest): number {
  return totalXP(q);
}
