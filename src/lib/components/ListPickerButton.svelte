<script lang="ts">
  import {
    user, createList, addItemsToList, removeItemFromList,
    listsContaining, addGroup
  } from '$lib/data/user';
  import Icon from './Icon.svelte';

  interface Props { itemId: string }
  let { itemId }: Props = $props();

  let open = $state(false);
  let newName = $state('');
  let pickingListId = $state<string | null>(null);
  let newGroupName = $state('');

  const inLists = $derived(listsContaining($user, itemId));
  const inCount = $derived(inLists.length);
  const pickingList = $derived(pickingListId ? $user.lists.find((l) => l.id === pickingListId) : null);

  /** Find which group of a list holds the item (if any). */
  function inGroupOf(list: { groups: any[] }): string | null {
    for (const g of list.groups) {
      if (g.entries.some((e: any) => e.kind === 'item' && e.id === itemId)) return g.id;
    }
    return null;
  }

  function pickList(list: { id: string; groups: any[]; name: string }) {
    const already = inGroupOf(list);
    if (already) {
      // Already in this list → remove it (toggle off)
      removeItemFromList(list.id, itemId);
      return;
    }
    if (list.groups.length <= 1) {
      addItemsToList(list.id, [{ id: itemId, qty: 1 }]);
    } else {
      pickingListId = list.id;
    }
  }

  function pickGroup(groupId: string) {
    if (!pickingListId) return;
    addItemsToList(pickingListId, [{ id: itemId, qty: 1 }], groupId);
    pickingListId = null;
    open = false;
  }

  function submitNewList(e: SubmitEvent) {
    e.preventDefault();
    const id = createList(newName || 'Nouvelle liste');
    addItemsToList(id, [{ id: itemId, qty: 1 }]);
    newName = '';
  }

  function submitNewGroup(e: SubmitEvent) {
    e.preventDefault();
    if (!pickingListId) return;
    const gid = addGroup(pickingListId, newGroupName || 'Nouveau sous-groupe');
    addItemsToList(pickingListId, [{ id: itemId, qty: 1 }], gid);
    newGroupName = '';
    pickingListId = null;
    open = false;
  }
</script>

<div class="relative">
  <button
    type="button"
    onclick={() => (open = !open)}
    class="inline-flex items-center gap-2 px-3 h-9 rounded-md border text-sm transition-colors {inCount > 0
      ? 'bg-accent/15 text-accent border-accent/40'
      : 'bg-surface text-text-dim border-border hover:border-border-strong hover:text-text'}"
    aria-haspopup="true"
    aria-expanded={open}
  >
    <Icon name={inCount > 0 ? 'bookmark_filled' : 'bookmark_outline'} size={15} />
    {#if inCount === 0}
      Ajouter à une liste
    {:else if inCount === 1}
      Dans {inLists[0].name}
    {:else}
      Dans {inCount} listes
    {/if}
  </button>

  {#if open}
    <div
      role="presentation"
      class="fixed inset-0 z-40"
      onclick={() => { open = false; pickingListId = null; }}
      onkeydown={(e) => e.key === 'Escape' && (open = false)}
    ></div>
    <div
      class="absolute z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      role="dialog"
    >
      <div class="px-4 py-3 border-b border-border flex items-center gap-2">
        {#if pickingListId && pickingList}
          <button type="button" onclick={() => (pickingListId = null)} class="text-text-faint hover:text-text" title="Retour">
            <Icon name="chevron_right" size={14} class="rotate-180" />
          </button>
          <span class="text-[11px] uppercase tracking-wider text-text-faint truncate">{pickingList.name} › sous-groupe</span>
        {:else}
          <span class="text-[11px] uppercase tracking-wider text-text-faint">Ajouter à…</span>
        {/if}
      </div>

      {#if pickingListId && pickingList}
        <!-- Group picker -->
        <ul class="max-h-[40vh] overflow-y-auto py-1">
          {#each pickingList.groups as g (g.id)}
            <li>
              <button
                type="button"
                onclick={() => pickGroup(g.id)}
                class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 text-left"
              >
                <Icon name="plus" size={13} class="text-text-faint" />
                <span class="flex-1 truncate text-text-dim">{g.name || 'Sans groupe'}</span>
                <span class="text-xs text-text-faint num">{g.entries.length}</span>
              </button>
            </li>
          {/each}
        </ul>
        <form onsubmit={submitNewGroup} class="flex items-center gap-2 px-4 py-3 border-t border-border bg-bg/40">
          <Icon name="plus" size={14} class="text-text-faint" />
          <input
            bind:value={newGroupName}
            type="text"
            placeholder="Nouveau sous-groupe…"
            class="flex-1 bg-transparent outline-none text-sm placeholder:text-text-faint"
          />
          <button type="submit" class="text-xs text-accent hover:underline">Créer</button>
        </form>
      {:else}
        {#if $user.lists.length === 0}
          <p class="px-4 py-3 text-sm text-text-faint italic">Aucune liste. Crée-en une ci-dessous.</p>
        {:else}
          <ul class="max-h-[40vh] overflow-y-auto py-1">
            {#each $user.lists as l (l.id)}
              {@const inIt = !!inGroupOf(l)}
              {@const count = l.groups.reduce((s, g) => s + g.entries.length, 0)}
              {@const hasGroups = l.groups.length > 1}
              <li>
                <button
                  type="button"
                  onclick={() => pickList(l)}
                  class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 text-left"
                >
                  <span class="w-4 h-4 rounded border flex items-center justify-center shrink-0 {inIt ? 'bg-accent border-accent text-bg' : 'border-text-faint'}">
                    {#if inIt}<Icon name="check" size={12} />{/if}
                  </span>
                  <span class="flex-1 truncate {inIt ? 'text-text' : 'text-text-dim'}">{l.name}</span>
                  {#if hasGroups && !inIt}
                    <span class="text-[10px] uppercase tracking-wider text-text-faint">{l.groups.length} ss-gr.</span>
                    <Icon name="chevron_right" size={12} class="text-text-faint" />
                  {/if}
                  <span class="text-xs text-text-faint num">{count}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}

        <form onsubmit={submitNewList} class="flex items-center gap-2 px-4 py-3 border-t border-border bg-bg/40">
          <Icon name="plus" size={14} class="text-text-faint" />
          <input
            bind:value={newName}
            type="text"
            placeholder="Nouvelle liste…"
            class="flex-1 bg-transparent outline-none text-sm placeholder:text-text-faint"
          />
          <button type="submit" class="text-xs text-accent hover:underline">Créer</button>
        </form>
      {/if}
    </div>
  {/if}
</div>
