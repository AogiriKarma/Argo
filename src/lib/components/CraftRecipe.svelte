<script lang="ts">
  import { itemById, pnjById, resolveImg } from '$lib/data/store';
  import ItemImage from './ItemImage.svelte';

  interface SimpleIng {
    id: string;
    qty: number;
  }
  interface NpcGroup {
    name?: string;
    npcSection?: string;
    npcId?: string;
    items: SimpleIng[];
  }

  interface Props {
    craft: unknown;
  }
  let { craft }: Props = $props();

  // Normalize: always end up with NpcGroup[]
  const groups = $derived.by((): NpcGroup[] => {
    if (!craft) return [];
    if (!Array.isArray(craft)) return [];
    // Nested form (NpcGroup[])
    if (craft.length && typeof craft[0] === 'object' && craft[0] && 'items' in (craft[0] as object)) {
      return craft as NpcGroup[];
    }
    // Flat form: SimpleIng[]
    return [{ items: craft as SimpleIng[] }];
  });
</script>

{#each groups as g, gi (gi)}
  <div class="mb-6 last:mb-0">
    {#if g.name}
      <div class="text-sm text-text-dim mb-3">Chez <span class="text-text">{g.name}</span></div>
    {/if}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
      {#each g.items ?? [] as ing (ing.id)}
        {@const item = $itemById.get(ing.id)}
        {@const img = item ? resolveImg(item.images?.[0] ?? item.image) : null}
        {@const cat = item?.cat || item?.category || ''}
        <a
          href={item ? `/items/${ing.id}` : '#'}
          class="flex items-center gap-3 p-2 bg-surface hover:bg-surface-2 rounded-md transition-colors group"
        >
          <ItemImage src={img} {cat} size={40} alt={item?.name ?? ing.id} />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate {item ? 'text-rarity-' + (item.rarity || 'commun') : 'text-text-dim'}">
              {item?.name ?? ing.id}
            </div>
            <div class="text-[11px] text-text-faint mt-0.5">×{ing.qty}</div>
          </div>
        </a>
      {/each}
    </div>
  </div>
{/each}
