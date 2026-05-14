/**
 * User-local persistent state (localStorage).
 * No auth, single-device. Migrates older formats forward on load.
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type QuestStatus = 'todo' | 'wip' | 'done';

export interface ListItemEntry { kind: 'item'; id: string; qty: number }
export interface ListQuestEntry { kind: 'quest'; id: string }
export type ListEntry = ListItemEntry | ListQuestEntry;
export interface ListGroup { id: string; name: string; entries: ListEntry[] }
/** `ignoredRewards`: item ids whose quest-reward credit should NOT be deducted
 *  from required materials (e.g., the user wants to fetch the item anyway).
 *  `progress`: per-material qty already owned for this list (id → qty). */
export interface List {
  id: string;
  name: string;
  groups: ListGroup[];
  ignoredRewards?: string[];
  progress?: Record<string, number>;
}

export const BUILD_SLOTS = [
  'casque', 'plastron', 'jambieres', 'bottes', 'gants',
  'arme_p', 'arme_s',
  'amulette', 'bracelet',
  'anneau1', 'anneau2',
  'artefact'
] as const;
export type BuildSlot = typeof BUILD_SLOTS[number];

/** Catégorie d'item compatible avec un slot donné. */
export const SLOT_CATEGORY: Record<BuildSlot, string> = {
  casque: 'casque', plastron: 'plastron', jambieres: 'jambières', bottes: 'bottes', gants: 'gants',
  arme_p: 'arme_p', arme_s: 'arme_s',
  amulette: 'amulette', bracelet: 'bracelet',
  anneau1: 'anneau', anneau2: 'anneau',
  artefact: 'artefact'
};

export type PlayerClass = 'archer' | 'assassin' | 'guerrier' | 'mage' | 'shaman' | null;
export const PLAYER_CLASSES: { id: Exclude<PlayerClass, null>; label: string }[] = [
  { id: 'guerrier',  label: 'Guerrier' },
  { id: 'archer',    label: 'Archer' },
  { id: 'assassin',  label: 'Assassin' },
  { id: 'mage',      label: 'Mage' },
  { id: 'shaman',    label: 'Shaman' }
];

export interface BuildData {
  name: string;
  class: PlayerClass;
  /** Niveau du personnage (0 = non défini). Filtre les items > level dans le picker. */
  level: number;
  slots: Partial<Record<BuildSlot, string>>;
}

interface UserData {
  lists: List[];
  favorites: string[];
  craftedItems: string[];
  questStatus: Record<string, Exclude<QuestStatus, 'todo'>>;
  questObjectives: Record<string, number[]>;
  notes: Record<string, string>;
  build: BuildData;
}

const EMPTY: UserData = {
  lists: [],
  favorites: [],
  craftedItems: [],
  questStatus: {},
  questObjectives: {},
  notes: {},
  build: { name: 'Build', class: null, level: 0, slots: {} }
};

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const KEY = 'vcl_user_v1';

/** Bring any older list shape forward into `{ name, groups: [...] }`. */
function normalizeList(raw: any): List {
  if (Array.isArray(raw?.groups)) {
    return {
      id: raw.id ?? makeId(),
      name: raw.name ?? 'Liste',
      ignoredRewards: Array.isArray(raw.ignoredRewards) ? raw.ignoredRewards : [],
      progress: (raw.progress && typeof raw.progress === 'object') ? raw.progress : {},
      groups: raw.groups.map((g: any) => ({
        id: g.id ?? makeId(),
        name: g.name ?? '',
        entries: Array.isArray(g.entries)
          ? g.entries.map((e: any) => {
              // Strip the obsolete per-quest `ignoreRewards` flag.
              if (e?.kind === 'quest') return { kind: 'quest', id: e.id };
              return e;
            })
          : []
      }))
    };
  }
  const legacy = Array.isArray(raw?.entries) ? raw.entries : [];
  return {
    id: raw?.id ?? makeId(),
    name: raw?.name ?? 'Liste',
    ignoredRewards: [],
    groups: [{
      id: makeId(),
      name: '',
      entries: legacy.map((e: any) => ({ kind: 'item', id: e.id, qty: e.qty ?? 1 } as ListItemEntry))
    }]
  };
}

function load(): UserData {
  if (!browser) return { ...EMPTY };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.completedQuests) && !parsed.questStatus) {
      parsed.questStatus = Object.fromEntries(parsed.completedQuests.map((id: string) => [id, 'done']));
    }
    delete parsed.completedQuests;
    if (Array.isArray(parsed.wishlist) && parsed.wishlist.length && !Array.isArray(parsed.lists)) {
      parsed.lists = [{
        id: makeId(),
        name: 'Wishlist',
        entries: parsed.wishlist.map((id: string) => ({ id, qty: 1 }))
      }];
    }
    delete parsed.wishlist;
    if (!Array.isArray(parsed.lists)) parsed.lists = [];
    parsed.lists = parsed.lists.map(normalizeList);
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

function save(d: UserData) {
  if (!browser) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
}

export const user = writable<UserData>(load());

// Suppress save when we're applying an update that just came in from another tab
let applyingExternal = false;
user.subscribe((v) => {
  if (applyingExternal) return;
  save(v);
});

if (browser) {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || e.newValue === null) return;
    try {
      const parsed = JSON.parse(e.newValue) as UserData;
      applyingExternal = true;
      user.set({ ...EMPTY, ...parsed });
      applyingExternal = false;
    } catch {
      applyingExternal = false;
    }
  });
}

function toggleInList(list: string[], id: string): string[] {
  const i = list.indexOf(id);
  if (i === -1) return [...list, id];
  return list.filter((x) => x !== id);
}

export function toggleFavorite(id: string)  { user.update((u) => ({ ...u, favorites:    toggleInList(u.favorites,    id) })); }
export function toggleCrafted(id: string)   { user.update((u) => ({ ...u, craftedItems: toggleInList(u.craftedItems, id) })); }

// ── Lists ─────────────────────────────────────────────
export function createList(name: string): string {
  const trimmed = name.trim() || 'Liste sans nom';
  const id = makeId();
  user.update((u) => ({
    ...u,
    lists: [...u.lists, { id, name: trimmed, groups: [{ id: makeId(), name: '', entries: [] }] }]
  }));
  return id;
}
export function renameList(listId: string, name: string) {
  user.update((u) => ({
    ...u,
    lists: u.lists.map((l) => (l.id === listId ? { ...l, name: name.trim() || l.name } : l))
  }));
}
export function deleteList(listId: string) {
  user.update((u) => ({ ...u, lists: u.lists.filter((l) => l.id !== listId) }));
}

/** Map a list through a function, returning a new lists array. */
function mapList(u: UserData, listId: string, fn: (l: List) => List): UserData {
  return { ...u, lists: u.lists.map((l) => (l.id === listId ? fn(l) : l)) };
}

/** Ensure list has at least one group (returns its id). */
function defaultGroupId(l: List): string {
  if (!l.groups.length) {
    return ''; // will be created on demand
  }
  return l.groups[0].id;
}

// ── Groups ────────────────────────────────────────────
export function addGroup(listId: string, name: string): string {
  const gid = makeId();
  user.update((u) =>
    mapList(u, listId, (l) => {
      // If the only existing group is the empty unnamed default, replace it
      // instead of leaving a "Sans groupe" stub above the first real group.
      const onlyDefaultEmpty =
        l.groups.length === 1 && !l.groups[0].name && l.groups[0].entries.length === 0;
      const existing = onlyDefaultEmpty ? [] : l.groups;
      return {
        ...l,
        groups: [...existing, { id: gid, name: name.trim(), entries: [] }]
      };
    })
  );
  return gid;
}
export function renameGroup(listId: string, groupId: string, name: string) {
  user.update((u) =>
    mapList(u, listId, (l) => ({
      ...l,
      groups: l.groups.map((g) => (g.id === groupId ? { ...g, name: name.trim() } : g))
    }))
  );
}
export function deleteGroup(listId: string, groupId: string) {
  user.update((u) =>
    mapList(u, listId, (l) => {
      if (l.groups.length <= 1) return l; // keep at least one group
      return { ...l, groups: l.groups.filter((g) => g.id !== groupId) };
    })
  );
}

// ── Item entries ──────────────────────────────────────
/** Find which group currently holds an item entry, if any. */
function findItemGroup(l: List, itemId: string): { gIdx: number; eIdx: number } | null {
  for (let g = 0; g < l.groups.length; g++) {
    const idx = l.groups[g].entries.findIndex((e) => e.kind === 'item' && e.id === itemId);
    if (idx !== -1) return { gIdx: g, eIdx: idx };
  }
  return null;
}
function findQuestGroup(l: List, questId: string): { gIdx: number; eIdx: number } | null {
  for (let g = 0; g < l.groups.length; g++) {
    const idx = l.groups[g].entries.findIndex((e) => e.kind === 'quest' && e.id === questId);
    if (idx !== -1) return { gIdx: g, eIdx: idx };
  }
  return null;
}

export function setListItemQty(listId: string, itemId: string, qty: number, groupId?: string) {
  user.update((u) =>
    mapList(u, listId, (l) => {
      const existing = findItemGroup(l, itemId);
      const groups = l.groups.map((g) => ({ ...g, entries: [...g.entries] }));
      if (existing) {
        if (qty <= 0) {
          groups[existing.gIdx].entries.splice(existing.eIdx, 1);
        } else {
          groups[existing.gIdx].entries[existing.eIdx] = { kind: 'item', id: itemId, qty };
        }
      } else if (qty > 0) {
        const targetIdx = groupId ? groups.findIndex((g) => g.id === groupId) : 0;
        const idx = targetIdx === -1 ? 0 : targetIdx;
        groups[idx].entries.push({ kind: 'item', id: itemId, qty });
      }
      return { ...l, groups };
    })
  );
}

export function toggleInListById(listId: string, itemId: string) {
  user.update((u) =>
    mapList(u, listId, (l) => {
      const existing = findItemGroup(l, itemId);
      const groups = l.groups.map((g) => ({ ...g, entries: [...g.entries] }));
      if (existing) {
        groups[existing.gIdx].entries.splice(existing.eIdx, 1);
      } else {
        if (!groups.length) groups.push({ id: makeId(), name: '', entries: [] });
        groups[0].entries.push({ kind: 'item', id: itemId, qty: 1 });
      }
      return { ...l, groups };
    })
  );
}

export function addItemsToList(listId: string, items: { id: string; qty: number }[], groupId?: string) {
  if (!items.length) return;
  user.update((u) =>
    mapList(u, listId, (l) => {
      const groups = l.groups.map((g) => ({ ...g, entries: [...g.entries] }));
      const targetIdx = groupId ? groups.findIndex((g) => g.id === groupId) : 0;
      const tIdx = targetIdx === -1 ? 0 : targetIdx;
      for (const it of items) {
        const existing = findItemGroup({ ...l, groups }, it.id);
        if (existing) {
          const cur = groups[existing.gIdx].entries[existing.eIdx] as ListItemEntry;
          groups[existing.gIdx].entries[existing.eIdx] = { ...cur, qty: cur.qty + it.qty };
        } else {
          groups[tIdx].entries.push({ kind: 'item', id: it.id, qty: it.qty });
        }
      }
      return { ...l, groups };
    })
  );
}

// ── Quest entries ─────────────────────────────────────
export function addQuestToList(listId: string, questId: string, groupId?: string) {
  user.update((u) =>
    mapList(u, listId, (l) => {
      if (findQuestGroup(l, questId)) return l; // already in
      const groups = l.groups.map((g) => ({ ...g, entries: [...g.entries] }));
      if (!groups.length) groups.push({ id: makeId(), name: '', entries: [] });
      const targetIdx = groupId ? groups.findIndex((g) => g.id === groupId) : 0;
      const tIdx = targetIdx === -1 ? 0 : targetIdx;
      groups[tIdx].entries.push({ kind: 'quest', id: questId });
      return { ...l, groups };
    })
  );
}
export function addQuestsToList(listId: string, questIds: string[], groupId?: string) {
  if (!questIds.length) return;
  user.update((u) =>
    mapList(u, listId, (l) => {
      const groups = l.groups.map((g) => ({ ...g, entries: [...g.entries] }));
      if (!groups.length) groups.push({ id: makeId(), name: '', entries: [] });
      const targetIdx = groupId ? groups.findIndex((g) => g.id === groupId) : 0;
      const tIdx = targetIdx === -1 ? 0 : targetIdx;
      const already = new Set<string>();
      for (const g of groups) for (const e of g.entries) if (e.kind === 'quest') already.add(e.id);
      for (const qid of questIds) {
        if (already.has(qid)) continue;
        groups[tIdx].entries.push({ kind: 'quest', id: qid });
        already.add(qid);
      }
      return { ...l, groups };
    })
  );
}
/** Set the qty already owned for an item in a list (clamps to >= 0). */
export function setListProgress(listId: string, itemId: string, qty: number) {
  user.update((u) =>
    mapList(u, listId, (l) => {
      const progress = { ...(l.progress ?? {}) };
      const n = Math.max(0, Math.floor(qty));
      if (n === 0) delete progress[itemId];
      else progress[itemId] = n;
      return { ...l, progress };
    })
  );
}

/** Toggle whether quest rewards for `itemId` count as covering material needs in this list. */
export function toggleIgnoredReward(listId: string, itemId: string) {
  user.update((u) =>
    mapList(u, listId, (l) => {
      const cur = l.ignoredRewards ?? [];
      const next = cur.includes(itemId) ? cur.filter((x) => x !== itemId) : [...cur, itemId];
      return { ...l, ignoredRewards: next };
    })
  );
}

/** Move an item or quest entry to a different group inside the same list. */
export function moveEntry(listId: string, kind: 'item' | 'quest', entryId: string, toGroupId: string) {
  user.update((u) =>
    mapList(u, listId, (l) => {
      const groups = l.groups.map((g) => ({ ...g, entries: [...g.entries] }));
      let moved: ListEntry | null = null;
      for (const g of groups) {
        const idx = g.entries.findIndex((e) => e.kind === kind && e.id === entryId);
        if (idx !== -1) {
          moved = g.entries.splice(idx, 1)[0];
          break;
        }
      }
      if (!moved) return l;
      const target = groups.find((g) => g.id === toGroupId);
      if (!target) return l;
      target.entries.push(moved);
      return { ...l, groups };
    })
  );
}
export function removeQuestFromList(listId: string, questId: string) {
  user.update((u) =>
    mapList(u, listId, (l) => ({
      ...l,
      groups: l.groups.map((g) => ({
        ...g,
        entries: g.entries.filter((e) => !(e.kind === 'quest' && e.id === questId))
      }))
    }))
  );
}
export function removeItemFromList(listId: string, itemId: string) {
  user.update((u) =>
    mapList(u, listId, (l) => ({
      ...l,
      groups: l.groups.map((g) => ({
        ...g,
        entries: g.entries.filter((e) => !(e.kind === 'item' && e.id === itemId))
      }))
    }))
  );
}

// ── Queries ───────────────────────────────────────────
export function isInList(u: UserData, listId: string, itemId: string): boolean {
  const l = u.lists.find((x) => x.id === listId);
  if (!l) return false;
  return l.groups.some((g) => g.entries.some((e) => e.kind === 'item' && e.id === itemId));
}
export function listsContaining(u: UserData, itemId: string): List[] {
  return u.lists.filter((l) =>
    l.groups.some((g) => g.entries.some((e) => e.kind === 'item' && e.id === itemId))
  );
}
export function listsContainingQuest(u: UserData, questId: string): List[] {
  return u.lists.filter((l) =>
    l.groups.some((g) => g.entries.some((e) => e.kind === 'quest' && e.id === questId))
  );
}

/** Cycles todo → wip → done → todo */
export function cycleQuestStatus(id: string) {
  user.update((u) => {
    const cur = u.questStatus[id] ?? 'todo';
    const next: QuestStatus = cur === 'todo' ? 'wip' : cur === 'wip' ? 'done' : 'todo';
    const qs = { ...u.questStatus };
    if (next === 'todo') delete qs[id];
    else qs[id] = next;
    return { ...u, questStatus: qs };
  });
}
export function setQuestStatus(id: string, status: QuestStatus) {
  user.update((u) => {
    const qs = { ...u.questStatus };
    const objs = { ...u.questObjectives };
    if (status === 'todo') {
      delete qs[id];
      delete objs[id];
    } else {
      qs[id] = status;
    }
    return { ...u, questStatus: qs, questObjectives: objs };
  });
}

/**
 * Toggle an objective with **ordered cascade**:
 * - Clicking on step i while unchecked → marks 0..i as done (catches up prior steps).
 * - Clicking on step i while checked   → unchecks i and everything after (back to 0..i-1).
 * Also drops any explicit "done" flag, so editing steps puts the quest back into "wip" tracking.
 */
export function toggleObjective(questId: string, index: number) {
  user.update((u) => {
    const current = u.questObjectives[questId] ?? [];
    const wasDone = current.includes(index);
    const nextDoneIndices = wasDone
      ? Array.from({ length: index }, (_, i) => i)
      : Array.from({ length: index + 1 }, (_, i) => i);

    const objs = { ...u.questObjectives };
    if (nextDoneIndices.length === 0) delete objs[questId];
    else objs[questId] = nextDoneIndices;

    const qs = { ...u.questStatus };
    if (qs[questId] === 'done') delete qs[questId];

    return { ...u, questObjectives: objs, questStatus: qs };
  });
}

export function isObjectiveDone(u: UserData, questId: string, index: number): boolean {
  if (u.questStatus[questId] === 'done') return true;
  return (u.questObjectives[questId] ?? []).includes(index);
}

export function getQuestStatus(u: UserData, id: string, totalObjectives = 0): QuestStatus {
  const explicit = u.questStatus[id];
  if (explicit === 'done') return 'done';
  const doneCount = (u.questObjectives[id] ?? []).length;
  if (totalObjectives > 0 && doneCount >= totalObjectives) return 'done';
  if (doneCount > 0) return 'wip';
  return explicit ?? 'todo';
}
export function setNote(id: string, text: string) {
  user.update((u) => {
    const notes = { ...u.notes };
    if (text.trim()) notes[id] = text;
    else delete notes[id];
    return { ...u, notes };
  });
}
export function clearAll() { user.set({ ...EMPTY }); }

// ── Build / Stuff ─────────────────────────────────────
export function setBuildSlot(slot: BuildSlot, itemId: string | null) {
  user.update((u) => {
    const slots = { ...u.build.slots };
    if (itemId) slots[slot] = itemId;
    else delete slots[slot];
    return { ...u, build: { ...u.build, slots } };
  });
}
export function clearBuild() {
  user.update((u) => ({ ...u, build: { ...u.build, slots: {} } }));
}
export function renameBuild(name: string) {
  user.update((u) => ({ ...u, build: { ...u.build, name: name.trim() || u.build.name } }));
}
export function setBuildClass(c: PlayerClass) {
  user.update((u) => ({ ...u, build: { ...u.build, class: c } }));
}
export function setBuildLevel(lvl: number) {
  const n = Math.max(0, Math.min(99, Math.floor(lvl)));
  user.update((u) => ({ ...u, build: { ...u.build, level: n } }));
}
