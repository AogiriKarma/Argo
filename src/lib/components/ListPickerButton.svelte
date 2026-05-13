<script lang="ts">
  import { user, createList, toggleInListById, listsContaining } from '$lib/data/user';
  import Icon from './Icon.svelte';

  interface Props {
    itemId: string;
  }
  let { itemId }: Props = $props();

  let open = $state(false);
  let newName = $state('');
  const inLists = $derived(listsContaining($user, itemId));
  const inCount = $derived(inLists.length);

  function submitNew(e: SubmitEvent) {
    e.preventDefault();
    const id = createList(newName || 'Nouvelle liste');
    toggleInListById(id, itemId);
    newName = '';
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
      onclick={() => (open = false)}
      onkeydown={(e) => e.key === 'Escape' && (open = false)}
    ></div>
    <div
      class="absolute z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      role="dialog"
    >
      <div class="px-4 py-3 border-b border-border text-[11px] uppercase tracking-wider text-text-faint">
        Ajouter à…
      </div>

      {#if $user.lists.length === 0}
        <p class="px-4 py-3 text-sm text-text-faint italic">Aucune liste. Crée-en une ci-dessous.</p>
      {:else}
        <ul class="max-h-[40vh] overflow-y-auto py-1">
          {#each $user.lists as l (l.id)}
            {@const inIt = l.groups.some((g) => g.entries.some((e) => e.kind === 'item' && e.id === itemId))}
            {@const count = l.groups.reduce((s, g) => s + g.entries.length, 0)}
            <li>
              <button
                type="button"
                onclick={() => toggleInListById(l.id, itemId)}
                class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 text-left"
              >
                <span class="w-4 h-4 rounded border flex items-center justify-center shrink-0 {inIt ? 'bg-accent border-accent text-bg' : 'border-text-faint'}">
                  {#if inIt}<Icon name="check" size={12} />{/if}
                </span>
                <span class="flex-1 truncate {inIt ? 'text-text' : 'text-text-dim'}">{l.name}</span>
                <span class="text-xs text-text-faint num">{count}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      <form onsubmit={submitNew} class="flex items-center gap-2 px-4 py-3 border-t border-border bg-bg/40">
        <Icon name="plus" size={14} class="text-text-faint" />
        <input
          bind:value={newName}
          type="text"
          placeholder="Nouvelle liste…"
          class="flex-1 bg-transparent outline-none text-sm placeholder:text-text-faint"
        />
        <button type="submit" class="text-xs text-accent hover:underline">Créer</button>
      </form>
    </div>
  {/if}
</div>
