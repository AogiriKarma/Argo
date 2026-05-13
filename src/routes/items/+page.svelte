<script lang="ts">
  import { items, resolveImg } from '$lib/data/store';
  import { RARITY_ORDER, RARITY_LABEL, CATEGORY_LABEL } from '$lib/types';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const q = $derived(($page.url.searchParams.get('q') ?? '').toLowerCase());
  const palier = $derived($page.url.searchParams.get('palier') ?? '');
  const rarity = $derived($page.url.searchParams.get('rarity') ?? '');
  const cat = $derived($page.url.searchParams.get('cat') ?? '');
  const sortBy = $derived($page.url.searchParams.get('sort') ?? 'name');
  const sortDir = $derived($page.url.searchParams.get('dir') ?? 'asc');

  const allCats = $derived.by(() => {
    const s = new Set<string>();
    for (const i of $items) { const c = i.cat || i.category; if (c) s.add(c); }
    return Array.from(s).sort();
  });

  const filtered = $derived.by(() => {
    let arr = $items.filter((i) => {
      if (palier && String(i.palier ?? '') !== palier) return false;
      if (rarity && i.rarity !== rarity) return false;
      if (cat && (i.cat || i.category) !== cat) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name, 'fr');
      else if (sortBy === 'palier') cmp = (a.palier ?? 99) - (b.palier ?? 99);
      else if (sortBy === 'rarity') cmp = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      else if (sortBy === 'lvl') {
        const al = a.lvl ?? Number.POSITIVE_INFINITY;
        const bl = b.lvl ?? Number.POSITIVE_INFINITY;
        cmp = al - bl;
      }
      else if (sortBy === 'cat') cmp = (a.cat || a.category || '').localeCompare(b.cat || b.category || '', 'fr');
      if (cmp === 0) cmp = a.name.localeCompare(b.name, 'fr');
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  });

  function setParam(key: string, value: string) {
    const u = new URL($page.url);
    if (value) u.searchParams.set(key, value);
    else u.searchParams.delete(key);
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: true });
  }
  function toggleSort(col: string) {
    const u = new URL($page.url);
    if (sortBy === col) {
      u.searchParams.set('dir', sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      u.searchParams.set('sort', col);
      u.searchParams.set('dir', 'asc');
    }
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: true });
  }
  function reset() { goto('/items', { replaceState: true, keepFocus: true, noScroll: true }); }

  function sortIcon(col: string) {
    if (sortBy !== col) return '';
    return sortDir === 'asc' ? '↑' : '↓';
  }
</script>

<div class="max-w-[1480px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <SectionHeader title="Items" subtitle="Tous les objets référencés du serveur" count="{filtered.length.toLocaleString('fr-FR')} / {$items.length.toLocaleString('fr-FR')}">
    {#snippet children()}
      {#if q || palier || rarity || cat}
        <button onclick={reset} class="text-sm text-text-dim hover:text-text">Réinitialiser</button>
      {/if}
    {/snippet}
  </SectionHeader>

  <!-- Filter bar -->
  <div class="mb-4 flex flex-wrap items-center gap-2 sticky top-14 z-10 py-3 -mx-4 md:-mx-6 px-4 md:px-6 bg-bg/95 backdrop-blur-sm border-b border-border">
    <div class="relative flex-1 min-w-[220px] max-w-md">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={q}
        oninput={(e) => setParam('q', e.currentTarget.value)}
        placeholder="Rechercher par nom"
        class="w-full h-9 pl-9 pr-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md"
      />
    </div>

    <select
      value={palier}
      onchange={(e) => setParam('palier', e.currentTarget.value)}
      class="h-9 px-3 bg-surface border border-border hover:border-border-strong focus:border-border-strong outline-none text-sm rounded-md"
    >
      <option value="">Tous paliers</option>
      <option value="1">Palier 1</option>
      <option value="2">Palier 2</option>
      <option value="3">Palier 3</option>
    </select>

    <select
      value={rarity}
      onchange={(e) => setParam('rarity', e.currentTarget.value)}
      class="h-9 px-3 bg-surface border border-border hover:border-border-strong focus:border-border-strong outline-none text-sm rounded-md"
    >
      <option value="">Toute rareté</option>
      {#each RARITY_ORDER as r}<option value={r}>{RARITY_LABEL[r]}</option>{/each}
    </select>

    <select
      value={cat}
      onchange={(e) => setParam('cat', e.currentTarget.value)}
      class="h-9 px-3 bg-surface border border-border hover:border-border-strong focus:border-border-strong outline-none text-sm rounded-md"
    >
      <option value="">Toute catégorie</option>
      {#each allCats as c}<option value={c}>{CATEGORY_LABEL[c] ?? c}</option>{/each}
    </select>
  </div>

  {#if filtered.length === 0}
    <div class="py-20 text-center text-text-dim">Aucun item ne correspond aux filtres.</div>
  {:else}
    <!-- Mobile : list of cards -->
    <ul class="md:hidden space-y-1.5">
      {#each filtered.slice(0, 200) as item (item._id)}
        {@const itemCat = item.cat || item.category || ''}
        {@const img = resolveImg(item.images?.[0] ?? item.image)}
        <li>
          <a href="/items/{item.id}" class="flex items-center gap-3 p-2 bg-surface active:bg-surface-2 rounded-md border border-border">
            <ItemImage src={img} cat={itemCat} size={40} />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate text-rarity-{item.rarity}">{item.name}</div>
              <div class="text-[11px] text-text-faint flex items-center gap-1.5 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full dot-rarity-{item.rarity}"></span>
                <span>{RARITY_LABEL[item.rarity]}</span>
                <span>·</span>
                <span class="truncate">{CATEGORY_LABEL[itemCat] ?? itemCat}</span>
              </div>
            </div>
            <div class="text-right shrink-0 text-[11px] text-text-faint font-mono">
              {#if item.lvl}<div>lvl {item.lvl}</div>{/if}
              {#if item.palier}<div>P{item.palier}</div>{/if}
            </div>
          </a>
        </li>
      {/each}
    </ul>

    <!-- Desktop : table -->
    <div class="hidden md:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-[11px] uppercase tracking-wider text-text-faint">
            <th class="font-medium py-2 px-2 w-12"></th>
            <th class="font-medium py-2 px-2">
              <button onclick={() => toggleSort('name')} class="hover:text-text">Nom {sortIcon('name')}</button>
            </th>
            <th class="font-medium py-2 px-2">
              <button onclick={() => toggleSort('rarity')} class="hover:text-text">Rareté {sortIcon('rarity')}</button>
            </th>
            <th class="font-medium py-2 px-2">
              <button onclick={() => toggleSort('cat')} class="hover:text-text">Catégorie {sortIcon('cat')}</button>
            </th>
            <th class="font-medium py-2 px-2 text-center w-20">
              <button onclick={() => toggleSort('palier')} class="hover:text-text">Palier {sortIcon('palier')}</button>
            </th>
            <th class="font-medium py-2 px-2 text-right w-20">
              <button onclick={() => toggleSort('lvl')} class="hover:text-text">Niveau {sortIcon('lvl')}</button>
            </th>
            <th class="font-medium py-2 px-2 hidden lg:table-cell">Set</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered.slice(0, 200) as item (item._id)}
            {@const itemCat = item.cat || item.category || ''}
            {@const img = resolveImg(item.images?.[0] ?? item.image)}
            <tr class="border-t border-border hover:bg-surface/60 group">
              <td class="py-2 px-2">
                <ItemImage src={img} cat={itemCat} size={36} />
              </td>
              <td class="py-2 px-2">
                <a href="/items/{item.id}" class="text-rarity-{item.rarity} font-medium hover:underline decoration-1 underline-offset-2">{item.name}</a>
              </td>
              <td class="py-2 px-2">
                <span class="inline-flex items-center gap-1.5 text-text-dim text-[13px]">
                  <span class="w-1.5 h-1.5 rounded-full dot-rarity-{item.rarity}"></span>
                  {RARITY_LABEL[item.rarity]}
                </span>
              </td>
              <td class="py-2 px-2 text-text-dim text-[13px]">{CATEGORY_LABEL[itemCat] ?? itemCat}</td>
              <td class="py-2 px-2 text-center text-text-dim font-mono text-[13px]">{item.palier ?? '—'}</td>
              <td class="py-2 px-2 text-right text-text-dim font-mono text-[13px]">{item.lvl ?? '—'}</td>
              <td class="py-2 px-2 text-text-faint text-[13px] hidden lg:table-cell truncate max-w-[200px]">{item.set ?? ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if filtered.length > 200}
      <div class="mt-6 text-center text-sm text-text-faint">
        Affichage de 200 résultats sur {filtered.length}. Affinez les filtres pour voir le reste.
      </div>
    {/if}
  {/if}
</div>
