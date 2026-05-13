<script lang="ts">
  import { user, createList, addItemsToList, addQuestsToList, addGroup } from '$lib/data/user';
  import Icon from './Icon.svelte';

  type ItemPayload = { kind: 'items'; items: { id: string; qty: number }[] };
  type QuestPayload = { kind: 'quests'; questIds: string[] };
  type Payload = ItemPayload | QuestPayload;

  interface Props {
    payload: Payload;
    label?: string;
    disabled?: boolean;
  }
  let { payload, label = 'Ajouter à une liste', disabled = false }: Props = $props();

  let open = $state(false);
  let newName = $state('');
  let flash = $state<string | null>(null);
  // When non-null, we're in "pick a group inside this list" mode
  let pickingListId = $state<string | null>(null);
  let newGroupName = $state('');

  const count = $derived(payload.kind === 'items' ? payload.items.length : payload.questIds.length);
  const kindLabel = $derived(payload.kind === 'items'
    ? `${count} item${count > 1 ? 's' : ''}`
    : `${count} quête${count > 1 ? 's' : ''}`);

  const pickingList = $derived(pickingListId ? $user.lists.find((l) => l.id === pickingListId) : null);

  function apply(listId: string, groupId?: string) {
    if (payload.kind === 'items') addItemsToList(listId, payload.items, groupId);
    else addQuestsToList(listId, payload.questIds, groupId);
  }

  function closeWithFlash(msg: string) {
    flash = msg;
    setTimeout(() => {
      flash = null;
      open = false;
      pickingListId = null;
    }, 900);
  }

  function pickList(l: { id: string; name: string; groups: { id: string }[] }) {
    if (l.groups.length <= 1) {
      apply(l.id);
      closeWithFlash(`Ajouté à ${l.name}`);
    } else {
      pickingListId = l.id;
    }
  }

  function pickGroup(groupId: string, groupName: string, listName: string) {
    apply(pickingListId!, groupId);
    closeWithFlash(`Ajouté à ${listName} › ${groupName || 'Sans groupe'}`);
  }

  function submitNewList(e: SubmitEvent) {
    e.preventDefault();
    const id = createList(newName || 'Nouvelle liste');
    apply(id);
    newName = '';
    closeWithFlash('Liste créée');
  }

  function submitNewGroup(e: SubmitEvent) {
    e.preventDefault();
    if (!pickingListId) return;
    const gid = addGroup(pickingListId, newGroupName || 'Nouveau groupe');
    apply(pickingListId, gid);
    newGroupName = '';
    closeWithFlash('Groupe créé');
  }
</script>

<div class="relative">
  <button
    type="button"
    onclick={() => (open = !open)}
    disabled={disabled || count === 0}
    class="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface text-text-dim hover:text-text hover:border-border-strong text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    aria-haspopup="true"
    aria-expanded={open}
  >
    <Icon name="bookmark_outline" size={15} />
    {label}
    {#if count > 0}
      <span class="text-text-faint font-mono num text-xs">· {kindLabel}</span>
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
      class="absolute right-0 z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      role="dialog"
    >
      <div class="px-4 py-3 border-b border-border flex items-center gap-2">
        {#if pickingListId && pickingList}
          <button type="button" onclick={() => (pickingListId = null)} class="text-text-faint hover:text-text" title="Retour">
            <Icon name="chevron_right" size={14} class="rotate-180" />
          </button>
          <span class="text-[11px] uppercase tracking-wider text-text-faint truncate">{pickingList.name} › sous-groupe</span>
        {:else}
          <span class="text-[11px] uppercase tracking-wider text-text-faint">Ajouter {kindLabel} à…</span>
        {/if}
      </div>

      {#if flash}
        <div class="px-4 py-3 text-sm text-success">{flash}</div>
      {:else if pickingListId && pickingList}
        <!-- Group picker -->
        <ul class="max-h-[40vh] overflow-y-auto py-1">
          {#each pickingList.groups as g (g.id)}
            <li>
              <button
                type="button"
                onclick={() => pickGroup(g.id, g.name, pickingList.name)}
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
        <!-- List picker -->
        {#if $user.lists.length === 0}
          <p class="px-4 py-3 text-sm text-text-faint italic">Aucune liste. Crée-en une ci-dessous.</p>
        {:else}
          <ul class="max-h-[40vh] overflow-y-auto py-1">
            {#each $user.lists as l (l.id)}
              {@const n = l.groups.reduce((s, g) => s + g.entries.length, 0)}
              {@const hasGroups = l.groups.length > 1}
              <li>
                <button
                  type="button"
                  onclick={() => pickList(l)}
                  class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 text-left"
                >
                  <Icon name="plus" size={13} class="text-text-faint" />
                  <span class="flex-1 truncate text-text-dim">{l.name}</span>
                  {#if hasGroups}
                    <span class="text-[10px] uppercase tracking-wider text-text-faint">{l.groups.length} ss-gr.</span>
                    <Icon name="chevron_right" size={12} class="text-text-faint" />
                  {/if}
                  <span class="text-xs text-text-faint num">{n}</span>
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
