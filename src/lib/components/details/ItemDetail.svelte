<script lang="ts">
  import { itemById, mobs, panoplieById, resolveImg } from '$lib/data/store';
  import { RARITY_LABEL, CATEGORY_LABEL } from '$lib/types';
  import RarityChip from '$lib/components/RarityChip.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import StatRow from '$lib/components/StatRow.svelte';
  import Lore from '$lib/components/Lore.svelte';
  import CraftRecipe from '$lib/components/CraftRecipe.svelte';
  import WishlistButton from '$lib/components/WishlistButton.svelte';
  import NoteEditor from '$lib/components/NoteEditor.svelte';

  interface Props {
    id: string;
    showBreadcrumb?: boolean;
  }
  let { id, showBreadcrumb = true }: Props = $props();

  const item = $derived($itemById.get(id));
  const cat = $derived(item?.cat || item?.category || '');
  const img = $derived(resolveImg(item?.images?.[0] ?? item?.image));
  const rarity = $derived(item?.rarity ?? 'commun');
  const droppedBy = $derived($mobs.filter((m) => m.loot?.some((l) => l.id === id)));
  const panoplie = $derived(item?.set ? $panoplieById.get(item.set) : null);
</script>

{#if !item}
  <div class="py-20 text-center">
    <h2 class="text-2xl font-semibold mb-2">Item introuvable</h2>
    <p class="text-text-dim text-sm font-mono">{id}</p>
  </div>
{:else}
  <div>
    {#if showBreadcrumb}
      <nav class="mb-8 text-sm text-text-dim flex items-center gap-2">
        <a href="/items" class="hover:text-text">Items</a>
        <span class="text-text-faint">/</span>
        <span>{CATEGORY_LABEL[cat] ?? cat}</span>
      </nav>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 lg:gap-14">
      <aside>
        <div class="bg-surface rounded-lg p-6 flex items-center justify-center mb-5" style="aspect-ratio:1">
          <ItemImage src={img} {cat} size={180} alt={item.name} />
        </div>

        <dl class="text-sm space-y-2.5">
          <div class="flex justify-between"><dt class="text-text-dim">Rareté</dt><dd><RarityChip {rarity} /></dd></div>
          <div class="flex justify-between"><dt class="text-text-dim">Catégorie</dt><dd class="text-text">{CATEGORY_LABEL[cat] ?? cat}</dd></div>
          {#if item.palier}<div class="flex justify-between"><dt class="text-text-dim">Palier</dt><dd class="text-text num">{item.palier}</dd></div>{/if}
          {#if item.lvl}<div class="flex justify-between"><dt class="text-text-dim">Niveau requis</dt><dd class="text-text num">{item.lvl}</dd></div>{/if}
          {#if item.twoHanded}<div class="flex justify-between"><dt class="text-text-dim">À deux mains</dt><dd class="text-text">Oui</dd></div>{/if}
          {#if item.rune_slots}<div class="flex justify-between"><dt class="text-text-dim">Emplacements de rune</dt><dd class="text-text num">{item.rune_slots}</dd></div>{/if}
          {#if item.unique}<div class="flex justify-between"><dt class="text-text-dim">Unique</dt><dd class="text-warning">Oui</dd></div>{/if}
        </dl>

        {#if item._contributor?.name}
          <div class="mt-6 pt-4 border-t border-border text-xs text-text-faint">
            Contribué par <span class="text-text-dim">{item._contributor.name}</span>
          </div>
        {/if}
      </aside>

      <div class="min-w-0">
        <div class="text-sm text-text-dim mb-2">{CATEGORY_LABEL[cat] ?? cat}</div>
        <h1 class="text-rarity-{rarity} text-4xl md:text-[42px] font-semibold tracking-tight leading-[1.1]">
          {item.name}
        </h1>

        {#if panoplie}
          <a href="/panoplies/{panoplie.id}" class="inline-block mt-4 text-sm text-text-dim hover:text-accent">
            Panoplie : <span class="text-text">{panoplie.label}</span>
          </a>
        {/if}

        <div class="mt-6 flex flex-wrap gap-2 items-center">
          <WishlistButton itemId={item.id} />
          <a href="/compare?ids={item.id}" class="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface text-text-dim hover:text-text hover:border-border-strong text-sm transition-colors">Comparer</a>
          {#if item.craft}
            <a href="/craft/{item.id}" class="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface text-text-dim hover:text-text hover:border-border-strong text-sm transition-colors">Arbre de craft</a>
          {/if}
        </div>

        {#if item.stats && Object.keys(item.stats).length > 0}
          <section class="mt-8">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Statistiques</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-0 max-w-2xl">
              {#each Object.entries(item.stats) as [stat, value]}
                <StatRow {stat} {value} />
              {/each}
            </div>
          </section>
        {/if}

        {#if item.lore}
          <section class="mt-8 max-w-2xl">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Lore</h2>
            <div class="text-text-dim italic leading-relaxed"><Lore text={item.lore} /></div>
          </section>
        {/if}

        {#if item.obtain}
          <section class="mt-8 max-w-2xl">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Obtention</h2>
            <div class="text-text leading-relaxed"><Lore text={item.obtain} /></div>
          </section>
        {/if}

        {#if item.craft}
          <section class="mt-8">
            <h2 class="text-sm uppercase tracking-wider text-text-faint mb-3">Craft</h2>
            {#if typeof item.craft === 'string'}
              <div class="text-text leading-relaxed max-w-2xl"><Lore text={item.craft} /></div>
            {:else}
              <CraftRecipe craft={item.craft} />
            {/if}
          </section>
        {/if}

        {#if droppedBy.length}
          <section class="mt-8">
            <div class="flex items-baseline justify-between mb-3">
              <h2 class="text-sm uppercase tracking-wider text-text-faint">
                Loot de {droppedBy.length} créature{droppedBy.length > 1 ? 's' : ''}
              </h2>
              <a href="/drops/{item.id}" class="text-xs text-accent hover:underline">Calculateur ↗</a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
              {#each droppedBy as m (m._id)}
                {@const loot = m.loot?.find((l) => l.id === id)}
                <a href="/mobs/{m.id}" class="flex items-center justify-between gap-3 px-3 h-10 bg-surface hover:bg-surface-2 rounded-md transition-colors">
                  <span class="text-text text-sm truncate">{m.name}</span>
                  {#if loot}
                    <span class="text-[13px] font-mono num {loot.chance >= 50 ? 'text-success' : loot.chance >= 15 ? 'text-warning' : 'text-text-dim'}">{loot.chance}%</span>
                  {/if}
                </a>
              {/each}
            </div>
          </section>
        {/if}

        <section class="mt-10 max-w-2xl">
          <NoteEditor entityId={'item:' + item.id} />
        </section>
      </div>
    </div>
  </div>
{/if}
