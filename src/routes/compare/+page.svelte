<script lang="ts">
  import { itemById, items, resolveImg } from '$lib/data/store';
  import { STAT_LABEL, STAT_UNIT, RARITY_LABEL, CATEGORY_LABEL, PALIER_ROMAN } from '$lib/types';
  import { searchEntries } from '$lib/data/search';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const idsRaw = $derived($page.url.searchParams.get('ids') ?? '');
  const ids = $derived(idsRaw ? idsRaw.split(',').filter(Boolean) : []);
  const selected = $derived(ids.map((id) => $itemById.get(id)).filter((x): x is NonNullable<typeof x> => Boolean(x)));

  // Build union of all stats across selected items, preserve a stable order
  const allStats = $derived.by(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const it of selected) {
      for (const k of Object.keys(it.stats ?? {})) {
        if (!seen.has(k)) { seen.add(k); order.push(k); }
      }
    }
    return order;
  });

  function getStat(it: typeof selected[number], key: string): number | null {
    const v = it.stats?.[key];
    if (v == null) return null;
    if (Array.isArray(v)) return (v[0] + v[1]) / 2;
    return v;
  }
  function fmtStat(v: typeof selected[number]['stats'] extends Record<string, infer V> ? V : never): string {
    if (v == null) return '—';
    if (Array.isArray(v)) return `${v[0]}–${v[1]}`;
    const sign = v > 0 ? '+' : '';
    return `${sign}${v}`;
  }

  function bestPerStat(stat: string): Set<number> {
    const values = selected.map((it) => getStat(it, stat));
    const max = Math.max(...values.filter((x): x is number => x != null));
    const idx = new Set<number>();
    values.forEach((v, i) => { if (v === max && v != null) idx.add(i); });
    return idx;
  }

  // Add-item picker
  let pickerOpen = $state(false);
  let pickerQuery = $state('');
  const pickerResults = $derived(
    searchEntries(
      $items.map((x) => ({ id: x.id, name: x.name, kind: 'item' as const })),
      pickerQuery,
      10
    )
  );

  function updateIds(next: string[]) {
    const u = new URL($page.url);
    if (next.length) u.searchParams.set('ids', next.join(','));
    else u.searchParams.delete('ids');
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: true });
  }
  function addItem(id: string) {
    if (ids.includes(id) || selected.length >= 4) return;
    updateIds([...ids, id]);
    pickerOpen = false;
    pickerQuery = '';
  }
  function removeAt(i: number) {
    updateIds(ids.filter((_, idx) => idx !== i));
  }
</script>

<div class="max-w-[1480px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <SectionHeader title="Comparateur" subtitle="Jusqu'à 4 items côte à côte. Le meilleur de chaque stat est mis en avant." />

  {#if selected.length === 0}
    <div class="p-12 text-center bg-surface rounded-lg border border-border max-w-xl mx-auto">
      <p class="text-text-dim mb-4">Aucun item sélectionné. Ajoute-en pour commencer.</p>
      <button type="button" onclick={() => (pickerOpen = true)} class="inline-flex items-center gap-2 px-4 h-10 bg-accent text-bg rounded-md text-sm font-medium">
        <Icon name="plus" size={16} /> Ajouter un item
      </button>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th class="w-48 align-bottom text-left"></th>
            {#each selected as it, i (it._id)}
              {@const img = resolveImg(it.images?.[0] ?? it.image)}
              <th class="align-bottom px-4 pb-4 min-w-[180px] text-left">
                <div class="flex flex-col gap-3">
                  <div class="flex items-start justify-between gap-2">
                    <ItemImage src={img} cat={it.cat || it.category || ''} size={56} alt={it.name} />
                    <button type="button" onclick={() => removeAt(i)} class="text-text-faint hover:text-danger" title="Retirer">
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                  <a href="/items/{it.id}" class="text-rarity-{it.rarity} font-medium leading-tight hover:underline">{it.name}</a>
                  <div class="flex items-center gap-2 text-[11px] text-text-faint">
                    <span class="w-1.5 h-1.5 rounded-full dot-rarity-{it.rarity}"></span>
                    <span>{RARITY_LABEL[it.rarity]}</span>
                    {#if it.palier}<span>· P{it.palier}</span>{/if}
                  </div>
                </div>
              </th>
            {/each}
            {#if selected.length < 4}
              <th class="align-bottom px-4 pb-4 min-w-[160px]">
                <button type="button" onclick={() => (pickerOpen = true)} class="w-full h-[110px] border border-dashed border-border hover:border-accent rounded-md text-text-faint hover:text-accent transition-colors flex items-center justify-center gap-2 text-sm">
                  <Icon name="plus" size={16} /> Ajouter
                </button>
              </th>
            {/if}
          </tr>
        </thead>
        <tbody>
          <tr class="border-t border-border">
            <td class="py-2 text-text-dim text-xs uppercase tracking-wider">Catégorie</td>
            {#each selected as it (it._id)}
              <td class="py-2 px-4 text-text">{CATEGORY_LABEL[it.cat || it.category || ''] ?? (it.cat || it.category)}</td>
            {/each}
          </tr>
          <tr class="border-t border-border">
            <td class="py-2 text-text-dim text-xs uppercase tracking-wider">Niveau requis</td>
            {#each selected as it (it._id)}
              <td class="py-2 px-4 font-mono num text-text">{it.lvl ?? '—'}</td>
            {/each}
          </tr>

          {#each allStats as stat (stat)}
            {@const best = bestPerStat(stat)}
            <tr class="border-t border-border">
              <td class="py-2 text-text-dim text-sm">{STAT_LABEL[stat] ?? stat}</td>
              {#each selected as it, i (it._id)}
                {@const v = it.stats?.[stat]}
                {@const unit = STAT_UNIT[stat] ?? '%'}
                <td class="py-2 px-4 font-mono num {best.has(i) && selected.length > 1 ? 'text-success font-medium' : 'text-text'}">
                  {fmtStat(v)}{v != null ? unit : ''}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if pickerOpen}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-start justify-center pt-[14vh] px-4"
    onclick={() => (pickerOpen = false)}
    onkeydown={(e) => e.key === 'Escape' && (pickerOpen = false)}
  >
    <div
      role="dialog"
      class="w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="flex items-center gap-3 px-4 h-12 border-b border-border">
        <Icon name="search" size={16} class="text-text-dim" />
        <!-- svelte-ignore a11y_autofocus -->
        <input
          bind:value={pickerQuery}
          type="text"
          autofocus
          placeholder="Rechercher un item à ajouter…"
          class="flex-1 bg-transparent outline-none text-text placeholder:text-text-faint text-[15px]"
        />
      </div>
      <ul class="max-h-[55vh] overflow-y-auto py-1">
        {#each pickerResults as r (r.id)}
          {@const it = $itemById.get(r.id)}
          <li>
            <button type="button" onclick={() => addItem(r.id)} class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 text-left">
              <ItemImage src={it ? resolveImg(it.images?.[0] ?? it.image) : null} cat={it?.cat || it?.category || ''} size={32} />
              <span class="flex-1 truncate text-rarity-{it?.rarity ?? 'commun'}">{r.name}</span>
              {#if it?.palier}<span class="text-xs text-text-faint">P{it.palier}</span>{/if}
            </button>
          </li>
        {/each}
        {#if !pickerQuery}
          <li class="px-4 py-6 text-center text-text-faint text-sm">Tape pour rechercher.</li>
        {:else if pickerResults.length === 0}
          <li class="px-4 py-6 text-center text-text-dim text-sm">Aucun résultat.</li>
        {/if}
      </ul>
    </div>
  </div>
{/if}
