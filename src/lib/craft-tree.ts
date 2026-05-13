/**
 * Shared crafting-tree utilities — reused by /craft/[id] and by list aggregations.
 */
import type { Item } from '$lib/types';

export interface Ing { id: string; qty: number }

const COST_IDS = new Set(['cols']);
export function isCost(id: string): boolean { return COST_IDS.has(id); }

/** Detect the NPC-vendor craft form: `[{npcSection|name, items: [...]}]` */
export function isNpcCraft(craft: unknown): boolean {
  return (
    Array.isArray(craft) &&
    craft.length > 0 &&
    typeof craft[0] === 'object' &&
    craft[0] !== null &&
    'items' in (craft[0] as object)
  );
}

export function flatIngredients(craft: unknown): Ing[] {
  if (!Array.isArray(craft)) return [];
  if (!craft.length) return [];
  // Nested NPC form
  if (isNpcCraft(craft)) {
    const all: Ing[] = [];
    for (const g of craft as { items: Ing[] }[]) all.push(...(g.items ?? []));
    return all;
  }
  return (craft as any[]).flatMap((x) =>
    x?.ingredients ? (x.ingredients as Ing[]) : x?.id ? [x as Ing] : []
  );
}

/**
 * Aggregate the raw materials and cols cost required to craft `qty` units of `rootId`.
 * Items that have no `craft` field are treated as raw (leaves).
 */
export interface AggregateResult {
  raw: Map<string, number>;
  cols: number;
}

export function aggregateForItem(
  rootId: string,
  qty: number,
  itemById: Map<string, Item>,
  acc: AggregateResult = { raw: new Map(), cols: 0 },
  visited: Set<string> = new Set()
): AggregateResult {
  const it = itemById.get(rootId);
  if (!it || !it.craft || visited.has(rootId)) {
    acc.raw.set(rootId, (acc.raw.get(rootId) ?? 0) + qty);
    return acc;
  }
  // NPC-purchased items: treat as raw (the player buys them) and only tally
  // their cols cost. Don't recurse — the player won't be "crafting" them.
  if (isNpcCraft(it.craft)) {
    acc.raw.set(rootId, (acc.raw.get(rootId) ?? 0) + qty);
    for (const ing of flatIngredients(it.craft)) {
      if (isCost(ing.id)) acc.cols += ing.qty * qty;
    }
    return acc;
  }
  const ings = flatIngredients(it.craft);
  // Items whose entire craft is just cols (purchasable tools etc.): treat as a
  // buyable leaf — keep the item visible in raw + tally cols on the side.
  if (ings.length > 0 && ings.every((ing) => isCost(ing.id))) {
    acc.raw.set(rootId, (acc.raw.get(rootId) ?? 0) + qty);
    for (const ing of ings) acc.cols += ing.qty * qty;
    return acc;
  }
  const next = new Set(visited).add(rootId);
  for (const ing of ings) {
    const needed = ing.qty * qty;
    if (isCost(ing.id)) {
      acc.cols += needed;
    } else {
      aggregateForItem(ing.id, needed, itemById, acc, next);
    }
  }
  return acc;
}

/** Aggregate multiple items into one combined result. */
export function aggregateList(
  entries: { id: string; qty: number }[],
  itemById: Map<string, Item>
): AggregateResult {
  const acc: AggregateResult = { raw: new Map(), cols: 0 };
  for (const e of entries) aggregateForItem(e.id, e.qty, itemById, acc);
  return acc;
}
