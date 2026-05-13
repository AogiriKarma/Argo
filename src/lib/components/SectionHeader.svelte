<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
    count?: number | string;
    children?: import('svelte').Snippet;
  }
  let { title, subtitle, count, children }: Props = $props();
</script>

<header class="mb-8 flex items-end justify-between gap-6">
  <div>
    <h1 class="text-3xl md:text-[34px] font-semibold tracking-tight text-text">
      {title}
      {#if count !== undefined}
        <span class="text-text-faint font-normal ml-2 text-[22px] num">{count}</span>
      {/if}
    </h1>
    {#if subtitle}
      <p class="mt-1.5 text-sm text-text-dim">{subtitle}</p>
    {/if}
  </div>
  {#if children}
    <div class="flex items-center gap-3">{@render children()}</div>
  {/if}
</header>
