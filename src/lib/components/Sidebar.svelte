<script lang="ts">
  import { page } from '$app/stores';
  import Icon from './Icon.svelte';

  const links = [
    { href: '/', label: 'Aperçu', icon: 'moon' },
    { href: '/items', label: 'Items', icon: 'codex' },
    { href: '/mobs', label: 'Bestiaire', icon: 'bestiary' },
    { href: '/pnj', label: 'Personnages', icon: 'user' },
    { href: '/regions', label: 'Régions', icon: 'atlas' },
    { href: '/quetes', label: 'Quêtes', icon: 'quest' },
    { href: '/panoplies', label: 'Panoplies', icon: 'star' },
    { href: '/map', label: 'Carte', icon: 'map' }
  ];

  function isActive(href: string, pathname: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }
</script>

<aside class="hidden lg:flex w-[68px] flex-col items-center border-r border-border bg-surface/40 py-6">
  <a href="/" class="mb-8 block" aria-label="Accueil">
    <div class="w-10 h-10 border border-accent flex items-center justify-center hud-pulse">
      <Icon name="moon" size={20} class="text-accent" />
    </div>
  </a>

  <nav class="flex flex-col gap-1 flex-1">
    {#each links as l (l.href)}
      {@const active = isActive(l.href, $page.url.pathname)}
      <a
        href={l.href}
        class="group relative flex flex-col items-center gap-1 py-3 px-1 text-text-faint hover:text-accent transition-colors"
        class:text-accent={active}
        aria-current={active ? 'page' : undefined}
      >
        {#if active}
          <span class="absolute left-0 top-1 bottom-1 w-px bg-accent"></span>
        {/if}
        <Icon name={l.icon} size={20} />
        <span class="font-mono text-[9px] tracking-widest uppercase">{l.label}</span>
      </a>
    {/each}
  </nav>
</aside>
