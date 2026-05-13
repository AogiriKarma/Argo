<script lang="ts">
  import { goto } from '$app/navigation';
  import { items, mobs, pnj, quetes } from '$lib/data/store';
  import { searchEntries, type SearchableEntry } from '$lib/data/search';

  let open = $state(false);
  let query = $state('');
  let activeIdx = $state(0);
  let inputEl = $state<HTMLInputElement | null>(null);

  const allEntries = $derived<SearchableEntry[]>([
    ...$items.map((x) => ({ id: x.id, name: x.name, kind: 'item' as const, rarity: x.rarity, palier: x.palier })),
    ...$mobs.map((x) => ({ id: x.id, name: x.name, kind: 'mob' as const, palier: x.palier })),
    ...$pnj.map((x) => ({ id: x.id, name: x.name, kind: 'pnj' as const, palier: x.palier })),
    ...$quetes.map((x) => ({ id: x.id, name: x.titre || x.name || x.id, kind: 'quest' as const, palier: x.palier }))
  ]);

  const results = $derived(searchEntries(allEntries, query, 12));

  function hrefFor(e: SearchableEntry): string {
    return ({ item: `/items/${e.id}`, mob: `/mobs/${e.id}`, pnj: `/pnj/${e.id}`, quest: `/quetes/${e.id}` } as Record<string, string>)[e.kind] ?? '/';
  }
  const kindLabel: Record<string, string> = { item: 'Item', mob: 'Mob', pnj: 'PNJ', quest: 'Quête' };

  function handleKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open = true;
      setTimeout(() => inputEl?.focus(), 10);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') { open = false; query = ''; return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, results.length - 1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); }
    if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      goto(hrefFor(results[activeIdx]));
      open = false; query = '';
    }
  }

  $effect(() => { void query; activeIdx = 0; });
</script>

<svelte:window onkeydown={handleKey} />

<button
  type="button"
  onclick={() => { open = true; setTimeout(() => inputEl?.focus(), 10); }}
  class="flex items-center justify-center md:justify-start gap-2.5 px-2 md:px-3 h-9 w-9 md:w-auto md:min-w-[260px] rounded-md bg-surface hover:bg-surface-2 text-text-dim transition-colors"
  aria-label="Rechercher"
>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </svg>
  <span class="hidden md:inline text-sm flex-1 text-left">Rechercher…</span>
  <kbd class="hidden md:inline font-mono text-[11px] text-text-faint">⌘K</kbd>
</button>

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-start justify-center pt-[14vh] px-4"
    onclick={() => (open = false)}
    onkeydown={(e) => e.key === 'Escape' && (open = false)}
  >
    <div
      role="dialog"
      aria-label="Recherche"
      class="w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="flex items-center gap-3 px-4 h-12 border-b border-border">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-dim" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Item, mob, PNJ, région, quête…"
          class="flex-1 bg-transparent outline-none text-text placeholder:text-text-faint text-[15px]"
          autocomplete="off"
        />
        <kbd class="font-mono text-[10px] text-text-faint px-1.5 py-0.5 bg-bg rounded">ESC</kbd>
      </div>

      {#if query && results.length === 0}
        <div class="px-4 py-8 text-center text-text-dim text-sm">Aucun résultat</div>
      {/if}

      <ul class="max-h-[55vh] overflow-y-auto py-1">
        {#each results as r, i (r.kind + r.id)}
          <li>
            <a
              href={hrefFor(r)}
              onclick={() => { open = false; query = ''; }}
              class="flex items-center gap-3 px-4 py-2 text-sm {i === activeIdx ? 'bg-surface-2 text-text' : 'text-text-dim hover:bg-surface-2/60'}"
              onmouseenter={() => (activeIdx = i)}
            >
              <span class="text-[11px] uppercase tracking-wide text-text-faint w-14">{kindLabel[r.kind]}</span>
              <span class="flex-1 truncate {r.kind === 'item' && r.rarity ? 'text-rarity-' + r.rarity : ''}">{r.name}</span>
              {#if r.palier}<span class="text-text-faint text-xs">P{r.palier}</span>{/if}
            </a>
          </li>
        {/each}
      </ul>

      {#if results.length}
        <div class="border-t border-border px-4 h-9 flex items-center justify-between text-[11px] text-text-faint">
          <span>↑↓ naviguer · ↵ ouvrir</span>
          <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
        </div>
      {/if}
    </div>
  </div>
{/if}
