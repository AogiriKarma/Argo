<script lang="ts">
  import { page } from '$app/stores';
  import CommandK from './CommandK.svelte';
  import ThemeSwitcher from './ThemeSwitcher.svelte';
  import AccountChip from './AccountChip.svelte';

  interface Props {
    children: import('svelte').Snippet;
  }
  let { children }: Props = $props();

  const tabs = [
    { href: '/items', label: 'Items' },
    { href: '/mobs', label: 'Bestiaire' },
    { href: '/pnj', label: 'PNJ' },
    { href: '/quetes', label: 'Quêtes' },
    { href: '/map', label: 'Carte' },
    { href: '/me', label: 'Profil' }
  ];

  function isActive(href: string, pathname: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }
</script>

<div class="min-h-screen flex flex-col">
  <header class="border-b border-border bg-bg sticky top-0 z-30">
    <div class="max-w-[1480px] mx-auto px-6 h-14 flex items-center gap-8">
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

      <div class="flex items-center gap-2">
        <CommandK />
        <ThemeSwitcher />
        <AccountChip />
      </div>
    </div>
  </header>

  <main class="flex-1 min-w-0">
    {@render children()}
  </main>
</div>
