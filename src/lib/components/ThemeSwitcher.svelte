<script lang="ts">
  import { theme, themes } from '$lib/stores/theme';
  import Icon from './Icon.svelte';

  let open = $state(false);
  const current = $derived(themes.find((t) => t.id === $theme) ?? themes[0]);

  function pick(id: string) {
    theme.set(id);
    open = false;
  }
</script>

<div class="relative">
  <button
    type="button"
    onclick={() => (open = !open)}
    class="inline-flex items-center gap-2 h-9 px-2.5 rounded-md border border-border bg-surface text-text-dim hover:text-text hover:border-border-strong text-sm transition-colors"
    aria-haspopup="true"
    aria-expanded={open}
    title="Changer le thème"
  >
    <span class="flex gap-px">
      <span class="w-2 h-3 rounded-sm" style="background:{current.swatch[0]}"></span>
      <span class="w-2 h-3 rounded-sm" style="background:{current.swatch[1]}"></span>
      <span class="w-2 h-3 rounded-sm" style="background:{current.swatch[2]}"></span>
    </span>
    <span class="hidden md:inline text-xs">{current.label}</span>
    <Icon name="chevron_right" size={11} class="text-text-faint rotate-90" />
  </button>

  {#if open}
    <div
      role="presentation"
      class="fixed inset-0 z-40"
      onclick={() => (open = false)}
      onkeydown={(e) => e.key === 'Escape' && (open = false)}
    ></div>
    <div
      class="absolute right-0 z-50 mt-1 w-52 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      role="dialog"
    >
      <div class="px-3 pt-2.5 pb-1 text-[11px] uppercase tracking-wider text-text-faint">Thème</div>
      <ul class="py-1">
        {#each themes as t (t.id)}
          <li>
            <button
              type="button"
              onclick={() => pick(t.id)}
              class="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-2 text-left transition-colors"
            >
              <span class="flex gap-px shrink-0">
                <span class="w-2.5 h-4 rounded-sm" style="background:{t.swatch[0]}"></span>
                <span class="w-2.5 h-4 rounded-sm" style="background:{t.swatch[1]}"></span>
                <span class="w-2.5 h-4 rounded-sm" style="background:{t.swatch[2]}"></span>
              </span>
              <span class="flex-1 {$theme === t.id ? 'text-text' : 'text-text-dim'}">{t.label}</span>
              {#if $theme === t.id}
                <Icon name="check" size={13} class="text-accent" />
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
