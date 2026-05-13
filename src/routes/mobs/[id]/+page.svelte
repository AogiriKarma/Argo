<script lang="ts">
  import { page } from '$app/stores';
  import { mobById, itemById, regionById, resolveImg } from '$lib/data/store';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Lore from '$lib/components/Lore.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import NoteEditor from '$lib/components/NoteEditor.svelte';

  const id = $derived($page.params.id);
  const mob = $derived($mobById.get(id));
  const img = $derived(resolveImg(mob?.images?.[0]));
  const region = $derived(mob?.regionId ? $regionById.get(mob.regionId) : null);

  const TYPE_LABEL: Record<string, string> = { boss: 'Boss', mini_boss: 'Mini-Boss', monstre: 'Monstre', sbire: 'Sbire' };
  const TYPE_COLOR: Record<string, string> = { boss: 'text-danger', mini_boss: 'text-warning', monstre: 'text-accent', sbire: 'text-text-dim' };
  const BEHAVIOR_LABEL: Record<string, string> = { passif: 'Passif', neutre: 'Neutre', agressif: 'Agressif' };

  const lootSorted = $derived(
    [...(mob?.loot ?? [])].sort((a, b) => (b.chance ?? 0) - (a.chance ?? 0))
  );
</script>

{#if !mob}
  <div class="max-w-2xl mx-auto py-24 text-center">
    <h1 class="text-2xl font-semibold mb-2">Créature introuvable</h1>
    <p class="text-text-dim text-sm font-mono">{id}</p>
    <a href="/mobs" class="mt-6 inline-block text-accent hover:underline text-sm">← Bestiaire</a>
  </div>
{:else}
  <div class="max-w-[1100px] mx-auto px-6 py-10">
    <nav class="mb-8 text-sm text-text-dim flex items-center gap-2">
      <a href="/mobs" class="hover:text-text">Bestiaire</a>
      <span class="text-text-faint">/</span>
      <span>{TYPE_LABEL[mob.type] ?? mob.type}</span>
    </nav>

    <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 lg:gap-14">
      <aside>
        <div class="bg-surface rounded-lg p-6 flex items-center justify-center mb-5" style="aspect-ratio:1">
          <ItemImage src={img} cat="" size={180} alt={mob.name} />
        </div>
        <dl class="text-sm space-y-2.5">
          <div class="flex justify-between">
            <dt class="text-text-dim">Type</dt>
            <dd class={TYPE_COLOR[mob.type] ?? ''}>{TYPE_LABEL[mob.type] ?? mob.type}</dd>
          </div>
          {#if mob.palier}
            <div class="flex justify-between"><dt class="text-text-dim">Palier</dt><dd class="num">{mob.palier}</dd></div>
          {/if}
          {#if mob.behavior}
            <div class="flex justify-between"><dt class="text-text-dim">Comportement</dt><dd>{BEHAVIOR_LABEL[mob.behavior] ?? mob.behavior}</dd></div>
          {/if}
          {#if mob.difficulty}
            <div class="flex justify-between items-center">
              <dt class="text-text-dim">Difficulté</dt>
              <dd class="flex gap-0.5">
                {#each Array(5) as _, i}<span class="w-1.5 h-3.5 rounded-sm {i < mob.difficulty ? 'bg-danger' : 'bg-border'}"></span>{/each}
              </dd>
            </div>
          {/if}
          {#if mob.respawnDelay}
            <div class="flex justify-between"><dt class="text-text-dim">Respawn</dt><dd class="font-mono">{mob.respawnDelay}</dd></div>
          {/if}
          {#if mob.coords}
            <div class="flex justify-between"><dt class="text-text-dim">Coords</dt><dd class="font-mono num">{mob.coords.x}, {mob.coords.z}</dd></div>
          {/if}
          {#if mob.is_underground}
            <div class="flex justify-between"><dt class="text-text-dim">Niveau</dt><dd class="text-warning">Souterrain</dd></div>
          {/if}
        </dl>
      </aside>

      <div class="min-w-0">
        <div class="text-sm text-text-dim mb-2">{TYPE_LABEL[mob.type] ?? mob.type}</div>
        <h1 class="text-4xl md:text-[42px] font-semibold tracking-tight leading-[1.1] text-text">{mob.name}</h1>
        {#if region || mob.region}
          <div class="mt-4 text-sm text-text-dim flex items-center gap-2">
            <Icon name="atlas" size={14} />
            Région :
            {#if region}
              <a href="/regions/{region.id}" class="text-text hover:text-accent">{region.name}</a>
            {:else}
              <span class="text-text">{mob.region}</span>
            {/if}
          </div>
        {/if}

        {#if mob.lore}
          <section class="mt-10 max-w-2xl">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Lore</h2>
            <div class="text-text-dim italic leading-relaxed"><Lore text={mob.lore} /></div>
          </section>
        {/if}

        {#if lootSorted.length}
          <section class="mt-10">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Table de loot</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
              {#each lootSorted as l (l.id)}
                {@const it = $itemById.get(l.id)}
                {@const itImg = it ? resolveImg(it.images?.[0] ?? it.image) : null}
                {@const itCat = it?.cat || it?.category || ''}
                <a
                  href={it ? `/items/${l.id}` : '#'}
                  class="flex items-center gap-3 p-2 bg-surface hover:bg-surface-2 rounded-md transition-colors"
                >
                  <ItemImage src={itImg} cat={itCat} size={40} alt={it?.name ?? l.id} />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate {it ? 'text-rarity-' + (it.rarity || 'commun') : 'text-text-dim'}">
                      {it?.name ?? l.id}
                    </div>
                  </div>
                  <span class="text-[13px] font-mono num shrink-0 {l.chance >= 50 ? 'text-success' : l.chance >= 15 ? 'text-warning' : 'text-text-dim'}">
                    {l.chance}%
                  </span>
                </a>
              {/each}
            </div>
          </section>
        {/if}

        <section class="mt-10 max-w-2xl">
          <NoteEditor entityId={'mob:' + mob.id} placeholder="Conseils, technique, comportement…" />
        </section>
      </div>
    </div>
  </div>
{/if}
