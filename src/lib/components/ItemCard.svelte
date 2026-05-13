<script lang="ts">
  import type { Item } from '$lib/types';
  import { RARITY_LABEL, CATEGORY_LABEL } from '$lib/types';
  import { resolveImg } from '$lib/data/store';
  import ItemImage from './ItemImage.svelte';

  interface Props {
    item: Item;
    href?: string;
  }
  let { item, href }: Props = $props();

  const link = $derived(href ?? `/items/${item.id}`);
  const rarity = $derived(item.rarity || 'commun');
  const img = $derived(resolveImg(item.images?.[0] ?? item.image));
  const cat = $derived(item.cat || item.category || '');
</script>

<a
  href={link}
  class="group block bg-surface border border-border hover:border-border-strong transition-colors relative"
>
  <div class="p-3 flex items-center gap-3">
    <ItemImage src={img} {cat} size={56} alt={item.name} />

    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium text-text-rarity-{rarity} text-rarity-{rarity} truncate group-hover:underline decoration-1 underline-offset-2">
        {item.name}
      </div>
      <div class="mt-0.5 flex items-center gap-2 text-[11px] text-text-dim font-mono">
        <span class="truncate">{CATEGORY_LABEL[cat] ?? cat}</span>
        {#if item.palier}
          <span class="text-text-faint">·</span>
          <span>P{item.palier}</span>
        {/if}
        {#if item.lvl}
          <span class="text-text-faint">·</span>
          <span>Niv {item.lvl}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="h-[2px] bar-rarity-{rarity} opacity-70"></div>
</a>
