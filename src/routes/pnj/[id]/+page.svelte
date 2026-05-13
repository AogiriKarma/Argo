<script lang="ts">
  import { page } from '$app/stores';
  import { pnjById, regionById, resolveImg } from '$lib/data/store';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Lore from '$lib/components/Lore.svelte';
  import CraftRecipe from '$lib/components/CraftRecipe.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import NoteEditor from '$lib/components/NoteEditor.svelte';

  const id = $derived($page.params.id);
  const p = $derived($pnjById.get(id));
  const img = $derived(resolveImg(p?.images?.[0]));
  const region = $derived(p?.regionId ? $regionById.get(p.regionId) : null);
</script>

{#if !p}
  <div class="max-w-2xl mx-auto py-24 text-center">
    <h1 class="text-2xl font-semibold mb-2">PNJ introuvable</h1>
    <p class="text-text-dim text-sm font-mono">{id}</p>
    <a href="/pnj" class="mt-6 inline-block text-accent hover:underline text-sm">← Personnages</a>
  </div>
{:else}
  <div class="max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-10">
    <nav class="mb-8 text-sm text-text-dim flex items-center gap-2">
      <a href="/pnj" class="hover:text-text">Personnages</a>
      {#if p.type}<span class="text-text-faint">/</span><span class="capitalize">{p.type.replaceAll('_', ' ')}</span>{/if}
    </nav>

    <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 lg:gap-14">
      <aside>
        <div class="bg-surface rounded-lg p-6 flex items-center justify-center mb-5" style="aspect-ratio:1">
          <ItemImage src={img} cat="" size={180} alt={p.name} />
        </div>
        <dl class="text-sm space-y-2.5">
          {#if p.type}<div class="flex justify-between"><dt class="text-text-dim">Type</dt><dd class="capitalize">{p.type.replaceAll('_', ' ')}</dd></div>{/if}
          {#if p.palier}<div class="flex justify-between"><dt class="text-text-dim">Palier</dt><dd class="num">{p.palier}</dd></div>{/if}
          {#if p.coords}<div class="flex justify-between"><dt class="text-text-dim">Coords</dt><dd class="font-mono num">{p.coords.x}, {p.coords.z}</dd></div>{/if}
          {#if p.is_underground}<div class="flex justify-between"><dt class="text-text-dim">Niveau</dt><dd class="text-warning">Souterrain</dd></div>{/if}
        </dl>
      </aside>

      <div class="min-w-0">
        <div class="text-sm text-text-dim mb-2">Personnage non-joueur</div>
        <h1 class="text-4xl md:text-[42px] font-semibold tracking-tight leading-[1.1] text-text">{p.name}</h1>
        {#if region || p.region}
          <div class="mt-4 text-sm text-text-dim flex items-center gap-2">
            <Icon name="atlas" size={14} />
            Région :
            {#if region}
              <a href="/regions/{region.id}" class="text-text hover:text-accent">{region.name}</a>
            {:else}
              <span class="text-text">{p.region}</span>
            {/if}
          </div>
        {/if}

        {#if p.lore}
          <section class="mt-10 max-w-2xl">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Description</h2>
            <div class="text-text-dim italic leading-relaxed"><Lore text={p.lore} /></div>
          </section>
        {/if}

        {#if p.instructions}
          <section class="mt-10 max-w-2xl">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Instructions</h2>
            <div class="text-text leading-relaxed"><Lore text={p.instructions} /></div>
          </section>
        {/if}

        {#if Array.isArray(p.craft) && p.craft.length}
          <section class="mt-10">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Propose à la création</h2>
            <CraftRecipe craft={p.craft} />
          </section>
        {/if}

        {#if Array.isArray(p.sells) && p.sells.length}
          <section class="mt-10">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Propose à la vente</h2>
            <CraftRecipe craft={p.sells} />
          </section>
        {/if}

        <section class="mt-10 max-w-2xl">
          <NoteEditor entityId={'pnj:' + p.id} />
        </section>
      </div>
    </div>
  </div>
{/if}
