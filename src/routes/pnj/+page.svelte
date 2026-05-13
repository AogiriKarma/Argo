<script lang="ts">
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import { pnj } from '$lib/data/store';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const q = $derived(($page.url.searchParams.get('q') ?? '').toLowerCase());
  const palier = $derived($page.url.searchParams.get('palier') ?? '');

  const filtered = $derived(
    $pnj
      .filter((p) => {
        if (palier && String(p.palier ?? '') !== palier) return false;
        if (q && !p.name.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.palier ?? 0) - (b.palier ?? 0) || a.name.localeCompare(b.name, 'fr'))
  );

  function setParam(key: string, value: string) {
    const u = new URL($page.url);
    if (value) u.searchParams.set(key, value);
    else u.searchParams.delete(key);
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: true });
  }
</script>

<div class="max-w-[1480px] mx-auto px-6 py-10">
  <SectionHeader title="Personnages" subtitle="Marchands, forgerons, donneurs de quêtes" count={filtered.length} />

  <div class="mb-4 flex flex-wrap items-center gap-2 sticky top-14 z-10 py-3 -mx-6 px-6 bg-bg/95 backdrop-blur-sm border-b border-border">
    <input type="text" value={q} oninput={(e) => setParam('q', e.currentTarget.value)} placeholder="Rechercher par nom" class="flex-1 min-w-[220px] max-w-md h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md" />
    <select value={palier} onchange={(e) => setParam('palier', e.currentTarget.value)} class="h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md">
      <option value="">Tous paliers</option>
      <option value="1">Palier 1</option>
      <option value="2">Palier 2</option>
      <option value="3">Palier 3</option>
    </select>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
    {#each filtered as p (p._id)}
      <a href="/pnj/{p.id}" class="group flex items-center gap-3 p-3 bg-surface hover:bg-surface-2 rounded-lg border border-border hover:border-border-strong transition-colors">
        <div class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-text-faint shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-text group-hover:text-accent font-medium truncate transition-colors">{p.name}</div>
          <div class="text-[12px] text-text-dim mt-0.5 flex items-center gap-2 truncate">
            {#if p.palier}<span>P{p.palier}</span>{/if}
            {#if p.region}<span class="truncate">{p.region}</span>{/if}
          </div>
        </div>
      </a>
    {/each}
  </div>
</div>
