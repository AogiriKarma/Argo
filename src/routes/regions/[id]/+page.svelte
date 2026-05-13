<script lang="ts">
  import { page } from '$app/stores';
  import { regionById, mobs, pnj as pnjList } from '$lib/data/store';
  import Lore from '$lib/components/Lore.svelte';
  import NoteEditor from '$lib/components/NoteEditor.svelte';

  const id = $derived($page.params.id);
  const r = $derived($regionById.get(id));
  const accent = $derived((r?.color as any)?.color || (typeof r?.color === 'string' ? r?.color : null) || '#5fb4ff');

  const mobsHere = $derived($mobs.filter((m) => m.regionId === id || m.region === id || m.region === r?.name));
  const pnjHere = $derived($pnjList.filter((p) => p.regionId === id || p.region === id || p.region === r?.name));
</script>

{#if !r}
  <div class="max-w-2xl mx-auto py-24 text-center">
    <h1 class="text-2xl font-semibold mb-2">Région introuvable</h1>
    <p class="text-text-dim text-sm font-mono">{id}</p>
    <a href="/regions" class="mt-6 inline-block text-accent hover:underline text-sm">← Régions</a>
  </div>
{:else}
  <div class="max-w-[1100px] mx-auto px-6 py-10">
    <nav class="mb-8 text-sm text-text-dim">
      <a href="/regions" class="hover:text-text">Régions</a>
    </nav>

    <header class="mb-12 pb-8 border-b border-border" style="border-left:3px solid {accent}; padding-left:1.25rem;">
      <div class="text-sm text-text-dim mb-2 flex items-center gap-3">
        {#if r.palier}<span>Palier {r.palier}</span>{/if}
        {#if r.canTp}<span>· Téléportation disponible</span>{/if}
        {#if r.is_underground}<span class="text-warning">· Zone souterraine</span>{/if}
      </div>
      <h1 class="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]" style="color:{accent}">{r.name}</h1>
      {#if r.lore}
        <p class="mt-6 text-text-dim italic leading-relaxed max-w-2xl"><Lore text={r.lore} /></p>
      {/if}
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <section>
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="text-sm uppercase tracking-wider text-text-faint">Créatures · {mobsHere.length}</h2>
        </div>
        {#if mobsHere.length}
          <ul class="space-y-1">
            {#each mobsHere as m (m._id)}
              <li>
                <a href="/mobs/{m.id}" class="flex items-center justify-between gap-3 px-3 h-10 rounded-md hover:bg-surface transition-colors text-sm">
                  <span class="text-text">{m.name}</span>
                  <span class="text-xs text-text-faint capitalize">{m.type.replaceAll('_', ' ')}</span>
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-text-faint italic">Aucune créature référencée ici.</p>
        {/if}
      </section>

      <section>
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="text-sm uppercase tracking-wider text-text-faint">Personnages · {pnjHere.length}</h2>
        </div>
        {#if pnjHere.length}
          <ul class="space-y-1">
            {#each pnjHere as p (p._id)}
              <li>
                <a href="/pnj/{p.id}" class="flex items-center justify-between gap-3 px-3 h-10 rounded-md hover:bg-surface transition-colors text-sm">
                  <span class="text-text">{p.name}</span>
                  {#if p.type}<span class="text-xs text-text-faint capitalize">{p.type.replaceAll('_', ' ')}</span>{/if}
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-text-faint italic">Aucun personnage référencé ici.</p>
        {/if}
      </section>
    </div>

    <section class="mt-12 max-w-2xl">
      <NoteEditor entityId={'region:' + r.id} />
    </section>
  </div>
{/if}
