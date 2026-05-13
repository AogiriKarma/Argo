/**
 * Aggregate items required by a list, taking quest rewards into account.
 *
 * Walks every group → entry:
 *  - `item` entries contribute their qty directly.
 *  - `quest` entries contribute their required objective items.
 * Then subtracts any reward items from quests that are themselves in the list
 * (since the user will get those rewards by doing the quests).
 *
 * The resulting per-item shopping list is then run through `aggregateForItem`
 * to expand into raw materials (with cols isolated).
 */
import type { Item, Quest } from '$lib/types';
import type { List } from '$lib/data/user';
import { aggregateForItem, type AggregateResult } from '$lib/craft-tree';
import { requiredItems, itemRewards } from '$lib/quest-utils';

export interface FullListAggregate {
  /** Net per-item shopping list before raw-material expansion (id → qty). */
  net: Map<string, number>;
  /** Sum of qty taken off by quest rewards (id → qty subtracted). */
  rewards: Map<string, number>;
  /** Items the user opted out from being deducted (id → would-be qty). */
  ignored: Map<string, number>;
  /** Quests included in the list. */
  questIds: string[];
  /** Final raw-material aggregation (after expanding `net` via craft tree). */
  materials: AggregateResult;
}

export function aggregateListFull(
  list: List,
  itemById: Map<string, Item>,
  questById: Map<string, Quest>
): FullListAggregate {
  const wanted = new Map<string, number>();
  const rewards = new Map<string, number>();
  const ignoredMap = new Map<string, number>();
  const questIds: string[] = [];
  const ignoredSet = new Set(list.ignoredRewards ?? []);

  for (const g of list.groups) {
    for (const e of g.entries) {
      if (e.kind === 'item') {
        wanted.set(e.id, (wanted.get(e.id) ?? 0) + e.qty);
      } else if (e.kind === 'quest') {
        questIds.push(e.id);
        const q = questById.get(e.id);
        if (!q) continue;
        for (const r of requiredItems(q)) {
          wanted.set(r.id, (wanted.get(r.id) ?? 0) + r.qty);
        }
        for (const r of itemRewards(q)) {
          const id = r.itemId ?? r.id;
          if (!id) continue;
          const qty = Number(r.qty ?? 1) || 1;
          if (ignoredSet.has(id)) {
            // "À fetch" : user a opté pour récupérer l'item — on l'ajoute aux besoins.
            ignoredMap.set(id, (ignoredMap.get(id) ?? 0) + qty);
            wanted.set(id, (wanted.get(id) ?? 0) + qty);
          } else {
            rewards.set(id, (rewards.get(id) ?? 0) + qty);
          }
        }
      }
    }
  }

  // Net = wanted - rewards (clamped to zero)
  const net = new Map<string, number>();
  for (const [id, qty] of wanted) {
    const give = rewards.get(id) ?? 0;
    const remaining = qty - give;
    if (remaining > 0) net.set(id, remaining);
  }

  const materials: AggregateResult = { raw: new Map(), cols: 0 };
  for (const [id, qty] of net) {
    aggregateForItem(id, qty, itemById, materials);
  }

  return { net, rewards, ignored: ignoredMap, questIds, materials };
}
