<script lang="ts">
  import { page } from '$app/stores';
  import { panoplieById, items, resolveImg } from '$lib/data/store';
  import { STAT_LABEL, STAT_UNIT } from '$lib/types';
  import ItemImage from '$lib/components/ItemImage.svelte';

  const id = $derived($page.params.id);
  const p = $derived($panoplieById.get(id));
  const setItems = $derived($items.filter((i) => i.set === id).sort((a, b) => (a.lvl ?? 0) - (b.lvl ?? 0)));
  const accent = $derived(p?.color || '#5fb4ff');

  function fmtStat(v: number, unit: string): string {
    const sign = v > 0 ? '+' : '';
    return `${sign}${v}${unit}`;
  }
</script>

{#if !p}
  <div class="max-w-2xl mx-auto py-24 text-center">
    <h1 class="text-2xl font-semibold mb-2">Panoplie introuvable</h1>
    <p class="text-text-dim text-sm font-mono">{id}</p>
    <a href="/panoplies" class="mt-6 inline-block text-accent hover:underline text-sm">← Panoplies</a>
  </div>
{:else}
  <div class="max-w-[1100px] mx-auto px-6 py-10">
    <nav class="mb-8 text-sm text-text-dim">
      <a href="/panoplies" class="hover:text-text">Panoplies</a>
    </nav>

    <header class="mb-10 pb-8 border-b border-border" style="border-left:3px solid {accent}; padding-left:1.25rem;">
      <div class="text-sm text-text-dim mb-2">Panoplie · {setItems.length} pièces</div>
      <h1 class="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]" style="color:{accent}">{p.label}</h1>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <section>
        <h2 class="text-sm uppercase tracking-wider text-text-faint mb-4">Pièces</h2>
        {#if setItems.length}
          <div class="space-y-2">
            {#each setItems as it (it._id)}
              <a
                href="/items/{it.id}"
                class="flex items-center gap-3 p-2 bg-surface hover:bg-surface-2 rounded-md transition-colors"
              >
                <ItemImage src={resolveImg(it.images?.[0] ?? it.image)} cat={it.cat || it.category || ''} size={44} alt={it.name} />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate text-rarity-{it.rarity}">{it.name}</div>
                  <div class="text-[12px] text-text-dim mt-0.5 capitalize">{(it.cat || it.category || '').replaceAll('_', ' ')}</div>
                </div>
                {#if it.lvl}<span class="text-[11px] text-text-faint font-mono num shrink-0">Niv {it.lvl}</span>{/if}
              </a>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-text-faint italic">Aucune pièce référencée pour cette panoplie.</p>
        {/if}
      </section>

      <section>
        <h2 class="text-sm uppercase tracking-wider text-text-faint mb-4">Bonus de set</h2>
        {#if p.bonuses && Object.keys(p.bonuses).length}
          <div class="space-y-4">
            {#each Object.entries(p.bonuses).sort(([a], [b]) => Number(a) - Number(b)) as [n, stats] (n)}
              <div class="p-4 bg-surface rounded-lg border-l-2" style="border-left-color:{accent}">
                <div class="text-xs uppercase tracking-wider text-text-faint mb-3">
                  À partir de {n} pièce{Number(n) > 1 ? 's' : ''}
                </div>
                <dl class="space-y-1.5">
                  {#each Object.entries(stats) as [stat, value]}
                    <div class="flex justify-between text-sm">
                      <dt class="text-text-dim">{STAT_LABEL[stat] ?? stat}</dt>
                      <dd class="font-mono num text-success">{fmtStat(value as number, STAT_UNIT[stat] ?? '%')}</dd>
                    </div>
                  {/each}
                </dl>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-text-faint italic">Aucun bonus défini.</p>
        {/if}
      </section>
    </div>
  </div>
{/if}
