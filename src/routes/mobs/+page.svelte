<script lang="ts">
  import { mobs, resolveImg } from '$lib/data/store';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const q = $derived(($page.url.searchParams.get('q') ?? '').toLowerCase());
  const palier = $derived($page.url.searchParams.get('palier') ?? '');
  const type = $derived($page.url.searchParams.get('type') ?? '');

  const TYPE_LABEL: Record<string, string> = { boss: 'Boss', mini_boss: 'Mini-Boss', monstre: 'Monstre', sbire: 'Sbire' };

  const filtered = $derived(
    $mobs
      .filter((m) => {
        if (palier && String(m.palier ?? '') !== palier) return false;
        if (type && m.type !== type) return false;
        if (q && !m.name.toLowerCase().includes(q)) return false;
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
  <SectionHeader title="Bestiaire" subtitle="Créatures du serveur, leurs loots et leurs régions" count={filtered.length} />

  <div class="mb-4 flex flex-wrap items-center gap-2 sticky top-14 z-10 py-3 -mx-6 px-6 bg-bg/95 backdrop-blur-sm border-b border-border">
    <input
      type="text"
      value={q}
      oninput={(e) => setParam('q', e.currentTarget.value)}
      placeholder="Rechercher par nom"
      class="flex-1 min-w-[220px] max-w-md h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md"
    />
    <select value={palier} onchange={(e) => setParam('palier', e.currentTarget.value)} class="h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md">
      <option value="">Tous paliers</option>
      <option value="1">Palier 1</option>
      <option value="2">Palier 2</option>
      <option value="3">Palier 3</option>
    </select>
    <select value={type} onchange={(e) => setParam('type', e.currentTarget.value)} class="h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md">
      <option value="">Tous types</option>
      <option value="boss">Boss</option>
      <option value="mini_boss">Mini-Boss</option>
      <option value="monstre">Monstre</option>
      <option value="sbire">Sbire</option>
    </select>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
    {#each filtered.slice(0, 90) as m (m._id)}
      <a
        href="/mobs/{m.id}"
        class="group flex items-center gap-3 p-3 bg-surface hover:bg-surface-2 rounded-lg border border-border hover:border-border-strong transition-colors"
      >
        <ItemImage src={resolveImg(m.images?.[0])} cat="" size={56} alt={m.name} />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 text-[11px] text-text-faint mb-0.5">
            <span class="uppercase tracking-wider">{TYPE_LABEL[m.type] ?? m.type}</span>
            {#if m.palier}<span>· P{m.palier}</span>{/if}
            {#if m.is_underground}<span class="text-warning">· Souterrain</span>{/if}
          </div>
          <div class="text-text group-hover:text-accent font-medium truncate transition-colors">{m.name}</div>
          {#if m.region}<div class="text-xs text-text-dim mt-0.5 truncate">{m.region}</div>{/if}
        </div>
        {#if m.difficulty}
          <div class="flex gap-0.5">
            {#each Array(5) as _, i}
              <span class="w-1 h-3 rounded-sm {i < m.difficulty ? 'bg-danger' : 'bg-border'}"></span>
            {/each}
          </div>
        {/if}
      </a>
    {/each}
  </div>
</div>
