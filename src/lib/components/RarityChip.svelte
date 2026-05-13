<script lang="ts">
  import type { Rarity } from '$lib/types';
  import { RARITY_LABEL } from '$lib/types';

  interface Props {
    rarity: Rarity;
  }
  let { rarity }: Props = $props();
</script>

<span class="inline-flex items-center gap-1.5 text-[12px] text-text-dim">
  <span class="w-1.5 h-1.5 rounded-full dot-rarity-{rarity}"></span>
  <span class="text-rarity-{rarity}">{RARITY_LABEL[rarity]}</span>
</span>
