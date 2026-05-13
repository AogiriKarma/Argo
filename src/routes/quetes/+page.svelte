<script lang="ts">
  import { quetes, regionById } from '$lib/data/store';
  import { user, cycleQuestStatus, getQuestStatus, type QuestStatus } from '$lib/data/user';
  import { profitScore, totalXP, totalCols, requiredItems } from '$lib/quest-utils';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import QuestStatusDot from '$lib/components/QuestStatusDot.svelte';
  import QuestRewards from '$lib/components/QuestRewards.svelte';
  import BulkListPicker from '$lib/components/BulkListPicker.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const TYPE_LABEL: Record<string, string> = { main: 'Principales', sec: 'Secondaires', ter: 'Tertiaires' };

  const tab = $derived($page.url.searchParams.get('type') ?? 'main');
  const statut = $derived($page.url.searchParams.get('statut') ?? 'all');
  const palier = $derived($page.url.searchParams.get('palier') ?? '');
  const zone = $derived($page.url.searchParams.get('zone') ?? '');
  const q = $derived(($page.url.searchParams.get('q') ?? '').toLowerCase());
  const sort = $derived($page.url.searchParams.get('sort') ?? 'default');
  const invMode = $derived($page.url.searchParams.get('inv') === '1');

  function statusOf(id: string): QuestStatus {
    const q = $quetes.find((x) => x.id === id);
    return getQuestStatus($user, id, q?.objectifs?.length ?? 0);
  }

  const byTab = $derived($quetes.filter((x) => x.type === tab));

  const zones = $derived.by(() => {
    const m = new Map<string, number>();
    for (const x of byTab) {
      const z = x.zone || '—';
      m.set(z, (m.get(z) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  });
  const paliers = $derived.by(() => {
    const m = new Map<string, number>();
    for (const x of byTab) {
      const p = String(x.palier ?? '—');
      m.set(p, (m.get(p) ?? 0) + 1);
    }
    return [...m.entries()].sort();
  });
  const statusCounts = $derived.by(() => {
    const c = { all: 0, todo: 0, wip: 0, done: 0 };
    for (const x of byTab) {
      c.all++;
      c[statusOf(x.id)]++;
    }
    return c;
  });

  const filtered = $derived.by(() => {
    let arr = byTab.filter((x) => {
      if (palier && String(x.palier ?? '') !== palier) return false;
      if (zone && (x.zone || '—') !== zone) return false;
      if (statut !== 'all' && statusOf(x.id) !== statut) return false;
      const name = x.titre || x.name || '';
      if (q && !name.toLowerCase().includes(q)) return false;
      if (invMode) {
        // Feasible: all required items present in craftedItems
        const reqs = requiredItems(x);
        if (!reqs.length) return false;
        for (const r of reqs) {
          if (!$user.craftedItems.includes(r.id)) return false;
        }
      }
      return true;
    });
    arr = arr.slice();
    if (sort === 'profit')   arr.sort((a, b) => profitScore(b) - profitScore(a));
    else if (sort === 'xp')     arr.sort((a, b) => totalXP(b) - totalXP(a));
    else if (sort === 'cols')   arr.sort((a, b) => totalCols(b) - totalCols(a));
    else if (sort === 'alpha')  arr.sort((a, b) => (a.titre || a.name || '').localeCompare(b.titre || b.name || '', 'fr'));
    else                        arr.sort((a, b) => (a.palier ?? 0) - (b.palier ?? 0) || (a.ordre ?? 0) - (b.ordre ?? 0));
    return arr;
  });

  // All currently-filtered quest IDs (to add as quest entries).
  const questIds = $derived(filtered.map((x) => x.id));

  function setParam(key: string, value: string) {
    const u = new URL($page.url);
    if (value) u.searchParams.set(key, value);
    else u.searchParams.delete(key);
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: true });
  }
</script>

<div class="max-w-[1480px] mx-auto px-6 py-10">
  <SectionHeader
    title="Quêtes"
    subtitle="Cycle le statut d'une quête (à faire → en cours → terminée) en cliquant sur la pastille."
    count="{filtered.length} / {byTab.length}"
  />

  <!-- Tabs -->
  <div class="mb-6 flex flex-wrap items-center gap-1 border-b border-border">
    {#each ['main', 'sec', 'ter'] as t}
      <button
        type="button"
        onclick={() => setParam('type', t)}
        class="px-4 h-10 text-sm transition-colors relative {tab === t ? 'text-text' : 'text-text-dim hover:text-text'}"
      >
        {TYPE_LABEL[t]}
        <span class="ml-2 text-xs text-text-faint num">{$quetes.filter((x) => x.type === t).length}</span>
        {#if tab === t}<span class="absolute left-0 right-0 -bottom-px h-px bg-accent"></span>{/if}
      </button>
    {/each}
    <span class="flex-1"></span>
    <button
      type="button"
      onclick={() => setParam('inv', invMode ? '' : '1')}
      class="px-3 h-9 text-xs rounded-md border transition-colors {invMode ? 'bg-success/10 text-success border-success/40' : 'bg-surface border-border text-text-dim hover:text-text'}"
      title="Filtre 'inventaire' : ne montre que les quêtes dont tu as déjà tous les items requis (cf. items 'possédés' dans ton profil)."
    >
      {invMode ? '✓ Inventaire' : 'Inventaire'}
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
    <!-- Sidebar filters -->
    <aside class="space-y-6 lg:sticky lg:top-20 self-start">
      <div>
        <input
          type="text"
          value={q}
          oninput={(e) => setParam('q', e.currentTarget.value)}
          placeholder="Rechercher…"
          class="w-full h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md"
        />
      </div>

      <fieldset>
        <legend class="text-[11px] uppercase tracking-wider text-text-faint mb-2">Statut</legend>
        <div class="space-y-0.5">
          {#each [
            { v: 'all',  label: 'Toutes',     n: statusCounts.all },
            { v: 'todo', label: 'À faire',    n: statusCounts.todo },
            { v: 'wip',  label: 'En cours',   n: statusCounts.wip },
            { v: 'done', label: 'Terminées',  n: statusCounts.done }
          ] as opt}
            <label class="flex items-center gap-2 px-2 h-8 rounded text-sm cursor-pointer {statut === opt.v ? 'bg-surface' : 'hover:bg-surface/60'}">
              <input
                type="radio"
                name="statut"
                value={opt.v}
                checked={statut === opt.v}
                onchange={() => setParam('statut', opt.v === 'all' ? '' : opt.v)}
                class="sr-only"
              />
              {#if opt.v === 'all'}
                <span class="w-2.5 h-2.5 rounded-full border border-text-faint"></span>
              {:else}
                <QuestStatusDot status={opt.v as QuestStatus} size={10} />
              {/if}
              <span class="flex-1 {statut === opt.v ? 'text-text' : 'text-text-dim'}">{opt.label}</span>
              <span class="text-xs text-text-faint num">{opt.n}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      {#if paliers.length}
        <fieldset>
          <legend class="text-[11px] uppercase tracking-wider text-text-faint mb-2">Palier</legend>
          <div class="space-y-0.5">
            <button type="button" onclick={() => setParam('palier', '')} class="w-full flex items-center justify-between px-2 h-7 rounded text-sm {palier === '' ? 'bg-surface text-text' : 'text-text-dim hover:bg-surface/60'}">
              <span>Tous</span>
              <span class="text-xs text-text-faint num">{byTab.length}</span>
            </button>
            {#each paliers as [p, n] (p)}
              <button type="button" onclick={() => setParam('palier', p)} class="w-full flex items-center justify-between px-2 h-7 rounded text-sm {palier === p ? 'bg-surface text-text' : 'text-text-dim hover:bg-surface/60'}">
                <span>Palier {p}</span>
                <span class="text-xs text-text-faint num">{n}</span>
              </button>
            {/each}
          </div>
        </fieldset>
      {/if}

      {#if zones.length > 1}
        <fieldset>
          <legend class="text-[11px] uppercase tracking-wider text-text-faint mb-2">Zone</legend>
          <div class="space-y-0.5 max-h-[280px] overflow-y-auto pr-1">
            <button type="button" onclick={() => setParam('zone', '')} class="w-full flex items-center justify-between px-2 h-7 rounded text-sm {zone === '' ? 'bg-surface text-text' : 'text-text-dim hover:bg-surface/60'}">
              <span>Toutes</span>
              <span class="text-xs text-text-faint num">{byTab.length}</span>
            </button>
            {#each zones as [z, n] (z)}
              <button type="button" onclick={() => setParam('zone', z)} class="w-full flex items-center justify-between px-2 h-7 rounded text-sm text-left {zone === z ? 'bg-surface text-text' : 'text-text-dim hover:bg-surface/60'}">
                <span class="truncate">{z}</span>
                <span class="text-xs text-text-faint num shrink-0 ml-2">{n}</span>
              </button>
            {/each}
          </div>
        </fieldset>
      {/if}
    </aside>

    <!-- Main grid -->
    <section>
      <div class="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <span class="text-sm text-text-dim">{filtered.length} quête{filtered.length > 1 ? 's' : ''}</span>
        <div class="flex items-center gap-2">
          {#if questIds.length}
            <BulkListPicker payload={{ kind: 'quests', questIds }} label="Tout ajouter à une liste" />
          {/if}
          <select
            value={sort}
            onchange={(e) => setParam('sort', e.currentTarget.value === 'default' ? '' : e.currentTarget.value)}
            class="h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md"
          >
            <option value="default">Ordre par défaut</option>
            <option value="profit">Tri par rentabilité (XP)</option>
            <option value="xp">Tri par XP</option>
            <option value="cols">Tri par cols</option>
            <option value="alpha">Tri alphabétique</option>
          </select>
        </div>
      </div>

      {#if filtered.length === 0}
        <div class="py-20 text-center text-text-dim text-sm">
          {invMode ? "Aucune quête réalisable avec ton inventaire actuel. Marque des items comme 'possédés' depuis leur fiche." : 'Aucune quête ne correspond aux filtres.'}
        </div>
      {:else}
        <ul class="space-y-1">
          {#each filtered as quest (quest._id)}
            {@const s = statusOf(quest.id)}
            <li>
              <div class="group flex items-center gap-3 px-3 py-2.5 bg-surface hover:bg-surface-2 rounded-md border border-border hover:border-border-strong transition-colors">
                <QuestStatusDot status={s} size={14} onclick={() => cycleQuestStatus(quest.id)} />
                <a href="/quetes/{quest.id}" class="flex-1 min-w-0 flex items-center gap-3">
                  {#if quest.palier}<span class="text-[11px] text-text-faint font-mono shrink-0 w-6">P{quest.palier}</span>{/if}
                  <span class="text-sm text-text group-hover:text-accent transition-colors truncate {s === 'done' ? 'line-through text-text-dim' : ''}">{quest.titre || quest.name}</span>
                  {#if quest.zone}<span class="text-[11px] text-text-faint truncate hidden lg:inline max-w-[140px]">· {quest.zone}</span>{/if}
                </a>
                <div class="hidden md:block shrink-0">
                  <QuestRewards {quest} compact />
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</div>
