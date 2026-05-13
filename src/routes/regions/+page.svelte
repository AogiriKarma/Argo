<script lang="ts">
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import { regions } from '$lib/data/store';
</script>

<div class="max-w-[1480px] mx-auto px-6 py-10">
  <SectionHeader title="Régions" subtitle="Tous les biomes et zones du serveur" count={$regions.length} />

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
    {#each [...$regions].sort((a, b) => a.name.localeCompare(b.name, 'fr')) as r (r._id)}
      <a
        href="/regions/{r.id}"
        class="group flex items-center justify-between p-4 bg-surface hover:bg-surface-2 rounded-lg border border-border hover:border-border-strong transition-colors"
        style="border-left: 3px solid {r.color || 'transparent'}"
      >
        <div class="min-w-0">
          <div class="text-text group-hover:text-accent font-semibold transition-colors truncate">{r.name}</div>
          <div class="text-xs text-text-dim mt-1 flex items-center gap-2">
            {#if r.palier}<span>Palier {r.palier}</span>{/if}
            {#if r.canTp}<span>· Téléportation</span>{/if}
            {#if r.is_underground}<span class="text-warning">· Souterrain</span>{/if}
          </div>
        </div>
      </a>
    {/each}
  </div>
</div>
