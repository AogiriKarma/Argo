<script lang="ts">
  import type { Quest } from '$lib/types';
  import { itemById, resolveImg } from '$lib/data/store';
  import { questRewards } from '$lib/quest-utils';
  import ItemImage from './ItemImage.svelte';

  interface Props {
    quest: Quest;
    compact?: boolean;
  }
  let { quest, compact = false }: Props = $props();
  const rewards = $derived(questRewards(quest));
</script>

{#if rewards.length}
  <div class="flex flex-wrap items-center gap-{compact ? '2' : '3'} text-{compact ? '[11px]' : 'xs'} font-mono num">
    {#each rewards as r, i (i)}
      {#if r.type === 'exp' && r.xp}
        <span class="text-warning">+{r.xp.toLocaleString('fr-FR')} XP</span>
      {:else if r.type === 'cols' && r.cols}
        <span class="text-text-dim">{r.cols.toLocaleString('fr-FR')} cols</span>
      {:else if r.type === 'items' && (r.itemId || r.id)}
        {@const id = r.itemId || r.id!}
        {@const it = $itemById.get(id)}
        {#if compact}
          <span class="inline-flex items-center gap-1.5">
            <ItemImage src={it ? resolveImg(it.images?.[0] ?? it.image) : null} cat={it?.cat || it?.category || ''} size={18} />
            <span class={it ? 'text-rarity-' + (it.rarity || 'commun') : 'text-text-dim'}>{r.label || it?.name || id}</span>
          </span>
        {:else}
          <a href={it ? `/items/${id}` : '#'} class="inline-flex items-center gap-2 px-2 h-7 bg-surface-2 rounded">
            <ItemImage src={it ? resolveImg(it.images?.[0] ?? it.image) : null} cat={it?.cat || it?.category || ''} size={22} />
            <span class={it ? 'text-rarity-' + (it.rarity || 'commun') : 'text-text-dim'}>{r.label || it?.name || id}</span>
            {#if r.qty}<span class="text-text-faint">×{r.qty}</span>{/if}
          </a>
        {/if}
      {/if}
    {/each}
  </div>
{/if}
