<script lang="ts">
  import { page } from '$app/stores';
  import CommandK from './CommandK.svelte';
  import ThemeSwitcher from './ThemeSwitcher.svelte';
  import AccountChip from './AccountChip.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    children: import('svelte').Snippet;
  }
  let { children }: Props = $props();

  const tabs = [
    { href: '/items', label: 'Items' },
    { href: '/mobs', label: 'Bestiaire' },
    { href: '/pnj', label: 'PNJ' },
    { href: '/quetes', label: 'Quêtes' },
    { href: '/guide', label: 'Guide' },
    { href: '/map', label: 'Carte' },
    { href: '/me', label: 'Profil' }
  ];

  function isActive(href: string, pathname: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  let mobileOpen = $state(false);
  // Close the drawer whenever the route changes
  $effect(() => {
    $page.url.pathname;
    mobileOpen = false;
  });
</script>

<div class="min-h-screen flex flex-col">
  <header class="border-b border-border bg-bg sticky top-0 z-30">
    <div class="max-w-[1480px] mx-auto px-4 md:px-6 h-14 flex items-center gap-3 md:gap-8">
      <a href="/" class="flex items-center gap-2 text-text font-semibold tracking-tight shrink-0">
        <img src="/argo.png" alt="" class="w-7 h-7 rounded-md object-cover" />
        <span>Argo</span>
      </a>

      <nav class="hidden md:flex items-center gap-1 flex-1">
        {#each tabs as t (t.href)}
          {@const active = isActive(t.href, $page.url.pathname)}
          <a
            href={t.href}
            class="px-3 h-9 inline-flex items-center text-sm rounded-md transition-colors {active
              ? 'text-text bg-surface'
              : 'text-text-dim hover:text-text hover:bg-surface/60'}"
            aria-current={active ? 'page' : undefined}
          >
            {t.label}
          </a>
        {/each}
      </nav>

      <div class="ml-auto flex items-center gap-1.5 md:gap-2">
        <CommandK />
        <ThemeSwitcher />
        <AccountChip />
        <button
          type="button"
          onclick={() => (mobileOpen = !mobileOpen)}
          class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-surface text-text-dim hover:text-text hover:border-border-strong transition-colors"
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          {#if mobileOpen}
            <Icon name="close" size={16} />
          {:else}
            <Icon name="list" size={16} />
          {/if}
        </button>
      </div>
    </div>

    {#if mobileOpen}
      <nav class="md:hidden border-t border-border bg-bg px-2 py-2 flex flex-col gap-0.5">
        {#each tabs as t (t.href)}
          {@const active = isActive(t.href, $page.url.pathname)}
          <a
            href={t.href}
            class="px-3 h-11 inline-flex items-center text-sm rounded-md transition-colors {active
              ? 'text-text bg-surface'
              : 'text-text-dim active:bg-surface/60'}"
            aria-current={active ? 'page' : undefined}
          >
            {t.label}
          </a>
        {/each}
      </nav>
    {/if}
  </header>

  <main class="flex-1 min-w-0">
    {@render children()}
  </main>
</div>
