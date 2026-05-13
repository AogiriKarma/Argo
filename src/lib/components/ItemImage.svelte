<script lang="ts">
  import CategoryIcon from './CategoryIcon.svelte';

  interface Props {
    src?: string | null;
    cat?: string;
    size?: number;
    alt?: string;
  }
  let { src, cat = '', size = 48, alt = '' }: Props = $props();

  let failed = $state(false);
  let loaded = $state(false);
  const inner = $derived(Math.max(16, size - 14));
</script>

<div
  class="relative flex items-center justify-center bg-surface-2 rounded shrink-0"
  style="width:{size}px;height:{size}px;"
>
  {#if src && !failed}
    <img
      {src}
      {alt}
      class="pixel"
      style="width:{inner}px;height:{inner}px;object-fit:contain;opacity:{loaded ? 1 : 0};transition:opacity 120ms ease;"
      loading="lazy"
      onload={() => (loaded = true)}
      onerror={() => (failed = true)}
    />
  {:else}
    <CategoryIcon {cat} size={Math.round(size * 0.45)} class="text-text-faint opacity-50" />
  {/if}
</div>
