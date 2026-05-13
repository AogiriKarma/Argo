<script lang="ts">
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import { panoplies, items } from '$lib/data/store';

  const list = $derived(
    $panoplies
      .map((p) => ({ ...p, itemCount: $items.filter((i) => i.set === p.id).length }))
      .filter((p) => p.itemCount > 0)
      .sort((a, b) => b.itemCount - a.itemCount)
  );
</script>

<div class="max-w-[1480px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <SectionHeader title="Panoplies" subtitle="Sets d'équipement et leurs bonus de pièces" count={list.length} />

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
    {#each list as p (p._id)}
      <a
        href="/panoplies/{p.id}"
        class="group block p-4 bg-surface hover:bg-surface-2 rounded-lg border border-border hover:border-border-strong transition-colors"
        style="border-left: 3px solid {p.color || 'transparent'}"
      >
        <div class="flex items-baseline justify-between mb-2">
          <span class="text-text group-hover:text-accent font-semibold transition-colors">{p.label}</span>
          <span class="text-xs text-text-dim num">{p.itemCount} pièces</span>
        </div>
        {#if p.bonuses}
          <div class="flex flex-wrap gap-1.5 mt-2">
            {#each Object.keys(p.bonuses).sort() as n}
              <span class="text-[11px] px-1.5 py-0.5 bg-surface-2 text-text-dim rounded">{n} pcs</span>
            {/each}
          </div>
        {/if}
      </a>
    {/each}
  </div>
</div>
