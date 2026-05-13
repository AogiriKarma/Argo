<script lang="ts">
  import {
    user, clearAll, toggleCrafted,
    setQuestStatus, createList, renameList, deleteList,
    setListItemQty, removeItemFromList, removeQuestFromList,
    addGroup, renameGroup, deleteGroup, toggleIgnoredReward, setListProgress,
    moveEntry,
    type QuestStatus
  } from '$lib/data/user';
  import { setNote } from '$lib/data/user';
  import { itemById, mobById, pnjById, regionById, questById, resolveImg } from '$lib/data/store';
  import { aggregateListFull } from '$lib/list-aggregate';
  import { askConfirm } from '$lib/stores/confirm';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import QuestStatusDot from '$lib/components/QuestStatusDot.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const tab = $derived($page.url.searchParams.get('tab') ?? 'lists');
  const tabs = [
    { key: 'lists',    label: 'Listes' },
    { key: 'crafted',  label: 'Possédés' },
    { key: 'quests',   label: 'Quêtes' },
    { key: 'notes',    label: 'Notes' }
  ];
  function setTab(t: string) {
    const u = new URL($page.url);
    u.searchParams.set('tab', t);
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: true });
  }

  // ── Lists ───────────────────────────────────────────
  const activeListId = $derived($page.url.searchParams.get('list') ?? ($user.lists[0]?.id ?? ''));
  const activeList = $derived($user.lists.find((l) => l.id === activeListId));

  function setActiveList(id: string) {
    const u = new URL($page.url);
    u.searchParams.set('list', id);
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: true });
  }

  let newListName = $state('');
  function submitNewList(e: SubmitEvent) {
    e.preventDefault();
    const id = createList(newListName || 'Nouvelle liste');
    newListName = '';
    setActiveList(id);
  }

  let editingName = $state(false);
  let editedName = $state('');
  function startRename() { editingName = true; editedName = activeList?.name ?? ''; }
  function commitRename() {
    if (activeList) renameList(activeList.id, editedName);
    editingName = false;
  }
  async function confirmDelete() {
    if (!activeList) return;
    const ok = await askConfirm({
      title: 'Supprimer la liste',
      message: `« ${activeList.name} » et toutes ses entrées seront supprimées définitivement.`,
      confirmLabel: 'Supprimer',
      danger: true
    });
    if (ok) deleteList(activeList.id);
  }

  // Full aggregation (items + quests, with reward subtraction)
  const totals = $derived(activeList ? aggregateListFull(activeList, $itemById, $questById) : null);

  // Sort raw materials by qty desc, split quest items aside
  const rawAll = $derived(
    totals
      ? [...totals.materials.raw.entries()]
          .map(([id, qty]) => ({ id, qty, item: $itemById.get(id) }))
          .sort((a, b) => b.qty - a.qty)
      : []
  );
  const isQuestItem = (r: { item: any }) => (r.item?.cat || r.item?.category) === 'quete';
  const rawSorted = $derived(rawAll.filter((r) => !isQuestItem(r)));
  const questItemsSorted = $derived(rawAll.filter(isQuestItem));

  // Union of all rewardable items from quests in the list — either currently
  // deducted (active) or opted out (ignored). Single panel to manage both.
  const allRewards = $derived(
    totals
      ? [
          ...[...totals.rewards.entries()].map(([id, qty]) => ({ id, qty, item: $itemById.get(id), ignored: false })),
          ...[...totals.ignored.entries()].map(([id, qty]) => ({ id, qty, item: $itemById.get(id), ignored: true }))
        ].sort((a, b) => Number(a.ignored) - Number(b.ignored) || b.qty - a.qty)
      : []
  );

  function entryCount(l: typeof activeList): number {
    return l?.groups.reduce((s, g) => s + g.entries.length, 0) ?? 0;
  }

  // Text transcript — groups → quests + items, then materials, then rewards
  const transcript = $derived.by(() => {
    if (!activeList) return '';
    const iname = (id: string) => $itemById.get(id)?.name ?? id;
    const qname = (id: string) => $questById.get(id)?.titre || $questById.get(id)?.name || id;
    const lines: string[] = [];
    lines.push(`# ${activeList.name}`);
    for (const g of activeList.groups) {
      if (!g.entries.length) continue;
      lines.push('');
      lines.push(`## ${g.name || 'Sans groupe'}`);
      for (const e of g.entries) {
        if (e.kind === 'quest') {
          lines.push(`- [Quête] ${qname(e.id)}`);
        } else {
          const have = activeList.progress?.[e.id] ?? 0;
          const mark = have >= e.qty ? '[x]' : '[ ]';
          lines.push(`- ${mark} ${iname(e.id)} ${have}/${e.qty}`);
        }
      }
    }
    const writeRows = (rows: typeof rawSorted) => {
      for (const r of rows) {
        const have = activeList.progress?.[r.id] ?? 0;
        const mark = have >= r.qty ? '[x]' : '[ ]';
        lines.push(`- ${mark} ${iname(r.id)} ${have}/${r.qty}`);
      }
    };
    if (rawSorted.length) {
      lines.push('');
      lines.push('## Matériaux à récupérer');
      writeRows(rawSorted);
    }
    if (questItemsSorted.length) {
      lines.push('');
      lines.push('## Items de quête (à part)');
      writeRows(questItemsSorted);
    }
    const activeRewards = allRewards.filter((r) => !r.ignored);
    if (activeRewards.length) {
      lines.push('');
      lines.push('## Récupéré via récompenses de quêtes');
      for (const r of activeRewards) lines.push(`- ${iname(r.id)} ×${r.qty}`);
    }
    if (totals && totals.materials.cols > 0) {
      lines.push('');
      lines.push(`## Cols (à part) : ${totals.materials.cols.toLocaleString('fr-FR')}`);
    }
    return lines.join('\n');
  });

  // Collapsed group IDs (per session — persisted in sessionStorage so HMR/reloads keep state)
  let collapsedGroups = $state<Set<string>>(new Set());
  if (typeof sessionStorage !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('vcl_collapsed_groups');
      if (raw) collapsedGroups = new Set(JSON.parse(raw));
    } catch {}
  }
  function toggleCollapse(gid: string) {
    const next = new Set(collapsedGroups);
    if (next.has(gid)) next.delete(gid); else next.add(gid);
    collapsedGroups = next;
    try { sessionStorage.setItem('vcl_collapsed_groups', JSON.stringify([...next])); } catch {}
  }

  // Group rename state
  let editingGroupId = $state<string | null>(null);
  let editingGroupName = $state('');
  function startGroupRename(gid: string, current: string) { editingGroupId = gid; editingGroupName = current; }
  function commitGroupRename() {
    if (editingGroupId && activeList) renameGroup(activeList.id, editingGroupId, editingGroupName);
    editingGroupId = null;
  }
  let newGroupName = $state('');
  function submitNewGroup(e: SubmitEvent) {
    e.preventDefault();
    if (!activeList) return;
    addGroup(activeList.id, newGroupName);
    newGroupName = '';
  }

  let copyState = $state<'idle' | 'copied'>('idle');
  async function copyTranscript() {
    try {
      await navigator.clipboard.writeText(transcript);
      copyState = 'copied';
      setTimeout(() => (copyState = 'idle'), 1500);
    } catch {
      // fallback: select textarea content
    }
  }
  function downloadTxt() {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: (activeList?.name ?? 'liste').replace(/[^a-z0-9-]+/gi, '_') + '.txt'
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  // Crafted, Quests, Notes (unchanged)
  const craftedList = $derived($user.craftedItems.map((id) => $itemById.get(id)).filter(Boolean));
  const trackedQuests = $derived(
    Object.entries($user.questStatus)
      .map(([id, status]) => ({ id, status: status as QuestStatus, quest: $questById.get(id) }))
      .filter((x) => x.quest)
  );
  // Also include quests that have objectives ticked but no explicit status
  const allTracked = $derived.by(() => {
    const map = new Map<string, { id: string; status: QuestStatus; quest: any }>();
    for (const t of trackedQuests) map.set(t.id, t);
    for (const id of Object.keys($user.questObjectives)) {
      if (!map.has(id)) {
        const quest = $questById.get(id);
        if (quest) map.set(id, { id, status: 'wip', quest });
      }
    }
    return [...map.values()];
  });

  function noteEntry(key: string) {
    const [kind, id] = key.split(':');
    let name: string | undefined;
    let href: string | undefined;
    if (kind === 'item')        { const it = $itemById.get(id); name = it?.name; href = `/items/${id}`; }
    else if (kind === 'mob')    { const m = $mobById.get(id); name = m?.name; href = `/mobs/${id}`; }
    else if (kind === 'pnj')    { const p = $pnjById.get(id); name = p?.name; href = `/pnj/${id}`; }
    else if (kind === 'region') { const r = $regionById.get(id); name = r?.name; href = `/regions/${id}`; }
    else if (kind === 'quest')  { const q = $questById.get(id); name = q?.titre || q?.name; href = `/quetes/${id}`; }
    return { kind, id, name: name ?? id, href: href ?? '#' };
  }
  const notes = $derived(
    Object.entries($user.notes).map(([k, v]) => ({ ...noteEntry(k), key: k, text: v }))
  );
  const KIND_LABEL: Record<string, string> = { item: 'Item', mob: 'Mob', pnj: 'PNJ', region: 'Région', quest: 'Quête' };

  function exportData() {
    const blob = new Blob([JSON.stringify($user, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `vcl-profil-${new Date().toISOString().slice(0, 10)}.json`
    });
    a.click();
    URL.revokeObjectURL(url);
  }
  async function reset() {
    const ok = await askConfirm({
      title: 'Tout effacer',
      message: 'Toutes les données locales (listes, items possédés, quêtes suivies, notes) seront supprimées. Cette action est irréversible.',
      confirmLabel: 'Effacer',
      danger: true
    });
    if (ok) clearAll();
  }
</script>

<div class="max-w-[1480px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <SectionHeader title="Mon profil" subtitle="Stocké localement dans ce navigateur uniquement.">
    {#snippet children()}
      <button type="button" onclick={exportData} class="text-sm text-text-dim hover:text-text">Exporter (.json)</button>
      <button type="button" onclick={reset} class="text-sm text-text-dim hover:text-danger flex items-center gap-1.5">
        <Icon name="trash" size={14} /> Tout effacer
      </button>
    {/snippet}
  </SectionHeader>

  <div class="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
    {#each [
      { label: 'Listes',        n: $user.lists.length },
      { label: 'Items possédés', n: $user.craftedItems.length },
      { label: 'Quêtes suivies', n: allTracked.length },
      { label: 'Notes',         n: Object.keys($user.notes).length }
    ] as s}
      <div class="p-4 bg-surface rounded-lg border border-border">
        <div class="text-xs uppercase tracking-wider text-text-faint">{s.label}</div>
        <div class="text-3xl font-semibold mt-1 num">{s.n}</div>
      </div>
    {/each}
  </div>

  <div class="border-b border-border mb-6 flex gap-1 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
    {#each tabs as t (t.key)}
      <button
        type="button"
        onclick={() => setTab(t.key)}
        class="px-4 h-10 text-sm whitespace-nowrap transition-colors relative {tab === t.key ? 'text-text' : 'text-text-dim hover:text-text'}"
      >
        {t.label}
        {#if tab === t.key}<span class="absolute left-0 right-0 -bottom-px h-px bg-accent"></span>{/if}
      </button>
    {/each}
  </div>

  {#if tab === 'lists'}
    <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <!-- List sidebar (horizontal chips on mobile, sidebar on lg+) -->
      <aside>
        <!-- Mobile: horizontal scrollable chips -->
        <div class="lg:hidden flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-3 mb-3 border-b border-border">
          {#each $user.lists as l (l.id)}
            <button
              type="button"
              onclick={() => setActiveList(l.id)}
              class="shrink-0 inline-flex items-center gap-2 px-3 h-9 rounded-md text-sm whitespace-nowrap transition-colors {activeListId === l.id ? 'bg-surface text-text border border-border' : 'text-text-dim bg-surface/40'}"
            >
              <span>{l.name}</span>
              <span class="text-xs text-text-faint num">{l.groups.reduce((s, g) => s + g.entries.length, 0)}</span>
            </button>
          {/each}
        </div>
        <!-- Desktop: vertical list -->
        <div class="hidden lg:block space-y-0.5 mb-3">
          {#each $user.lists as l (l.id)}
            <button
              type="button"
              onclick={() => setActiveList(l.id)}
              class="w-full flex items-center justify-between px-3 h-9 rounded-md text-left text-sm transition-colors {activeListId === l.id ? 'bg-surface text-text border border-border' : 'text-text-dim hover:bg-surface/60'}"
            >
              <span class="truncate">{l.name}</span>
              <span class="text-xs text-text-faint num shrink-0">{l.groups.reduce((s, g) => s + g.entries.length, 0)}</span>
            </button>
          {/each}
        </div>
        <form onsubmit={submitNewList} class="flex items-center gap-1.5">
          <input
            bind:value={newListName}
            type="text"
            placeholder="Nouvelle liste"
            class="flex-1 h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md"
          />
          <button type="submit" class="h-9 w-9 inline-flex items-center justify-center bg-accent text-bg rounded-md" title="Créer">
            <Icon name="plus" size={15} />
          </button>
        </form>
      </aside>

      <!-- Selected list -->
      <section>
        {#if !activeList}
          <div class="p-12 text-center bg-surface rounded-lg border border-border">
            <p class="text-text-dim">Crée une liste pour commencer.</p>
          </div>
        {:else}
          <header class="mb-6 pb-4 border-b border-border flex items-center gap-3 flex-wrap">
            {#if editingName}
              <input
                bind:value={editedName}
                onblur={commitRename}
                onkeydown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') editingName = false; }}
                class="text-2xl font-semibold tracking-tight bg-transparent border-b border-border outline-none flex-1 min-w-[200px]"
                autofocus
              />
            {:else}
              <h2 class="text-2xl font-semibold tracking-tight flex-1 min-w-0 truncate">{activeList.name}</h2>
              <button type="button" onclick={startRename} class="text-xs text-text-dim hover:text-text">Renommer</button>
            {/if}
            <button type="button" onclick={confirmDelete} class="text-xs text-text-dim hover:text-danger flex items-center gap-1.5">
              <Icon name="trash" size={13} /> Supprimer
            </button>
          </header>

          <div class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
            <!-- Groups + entries -->
            <div class="space-y-6">
              {#if entryCount(activeList) === 0 && activeList.groups.length === 1 && !activeList.groups[0].name}
                <p class="text-text-faint italic text-sm">Liste vide. Ajoute une quête depuis sa fiche (« Ajouter à une liste ») ou ajoute des items individuels depuis leur fiche.</p>
              {/if}

              {#each activeList.groups as g (g.id)}
                {#if !(g.entries.length === 0 && !g.name && activeList.groups.length === 1)}
                {@const collapsed = collapsedGroups.has(g.id)}
                <section class="rounded-lg {g.name ? 'border border-border bg-surface/40' : ''}">
                  <header class="flex items-center justify-between gap-3 {g.name ? 'px-4 py-3' : ''}">
                    <button type="button" onclick={() => toggleCollapse(g.id)} class="flex items-center gap-1.5 flex-1 min-w-0 text-left hover:text-text" title={collapsed ? 'Déplier' : 'Replier'}>
                      <Icon name="chevron_right" size={14} class="text-text-faint shrink-0 transition-transform {collapsed ? '' : 'rotate-90'}" />
                      {#if editingGroupId === g.id}
                        <!-- placeholder; input rendered below -->
                        <span class="flex-1"></span>
                      {:else}
                        <h3 class="text-sm font-medium text-text flex-1 truncate">
                          {#if g.name}{g.name}{:else}<span class="text-text-faint uppercase tracking-wider text-[11px]">Sans groupe</span>{/if}
                          <span class="ml-2 text-[11px] text-text-faint font-mono num">{g.entries.length}</span>
                        </h3>
                      {/if}
                    </button>
                    {#if editingGroupId === g.id}
                      <input
                        bind:value={editingGroupName}
                        onblur={commitGroupRename}
                        onkeydown={(e) => { if (e.key === 'Enter') commitGroupRename(); if (e.key === 'Escape') editingGroupId = null; }}
                        class="text-sm font-medium bg-transparent border-b border-border outline-none flex-1"
                        autofocus
                      />
                    {/if}
                    {#if g.name || activeList.groups.length > 1}
                      <button type="button" onclick={() => startGroupRename(g.id, g.name)} class="text-[11px] text-text-faint hover:text-text">{g.name ? 'Renommer' : 'Nommer'}</button>
                    {/if}
                    {#if activeList.groups.length > 1}
                      <button
                        type="button"
                        onclick={async () => {
                          const n = g.entries.length;
                          if (!n) { deleteGroup(activeList.id, g.id); return; }
                          const ok = await askConfirm({
                            title: 'Supprimer le sous-groupe',
                            message: `« ${g.name || 'sans groupe'} » et ses ${n} entrée${n > 1 ? 's' : ''} seront supprimées.`,
                            confirmLabel: 'Supprimer',
                            danger: true
                          });
                          if (ok) deleteGroup(activeList.id, g.id);
                        }}
                        class="text-[11px] text-text-faint hover:text-danger"
                        title="Supprimer ce sous-groupe et toutes ses entrées"
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    {/if}
                  </header>

                  {#if collapsed}
                    <!-- collapsed -->
                  {:else if !g.entries.length}
                    <p class="text-text-faint italic text-xs {g.name ? 'px-4 pb-3' : 'mt-2'}">Sous-groupe vide.</p>
                  {:else}
                    <ul class="space-y-1.5 {g.name ? 'px-4 pb-3' : 'mt-2'}">
                      {#each g.entries as e (e.kind + ':' + e.id)}
                        {#if e.kind === 'quest'}
                          {@const q = $questById.get(e.id)}
                          <li class="flex flex-wrap items-center gap-2 sm:gap-3 p-2 bg-surface rounded-md border border-border">
                            <span class="inline-flex items-center justify-center w-10 h-10 bg-bg rounded-md text-warning shrink-0" title="Quête">
                              <Icon name="quest" size={18} />
                            </span>
                            <a href={q ? `/quetes/${e.id}` : '#'} class="flex-1 min-w-[140px]">
                              <div class="text-[10px] uppercase tracking-wider text-text-faint">Quête</div>
                              <div class="text-sm font-medium truncate text-text">{q?.titre || q?.name || e.id}</div>
                            </a>
                            <button type="button" onclick={() => removeQuestFromList(activeList.id, e.id)} class="w-9 h-9 inline-flex items-center justify-center rounded text-text-faint hover:text-danger order-last sm:order-none" title="Retirer">
                              <Icon name="close" size={14} />
                            </button>
                            {#if activeList.groups.length > 1}
                              <select
                                value={g.id}
                                onchange={(ev) => moveEntry(activeList.id, 'quest', e.id, ev.currentTarget.value)}
                                class="h-9 px-2 bg-bg border border-border hover:border-border-strong rounded text-xs text-text-dim hover:text-text outline-none max-w-[160px] w-full sm:w-auto"
                                title="Déplacer vers un autre sous-groupe"
                              >
                                {#each activeList.groups as og (og.id)}
                                  <option value={og.id}>{og.name || 'Sans groupe'}</option>
                                {/each}
                              </select>
                            {/if}
                          </li>
                        {:else}
                          {@const it = $itemById.get(e.id)}
                          {@const img = it ? resolveImg(it.images?.[0] ?? it.image) : null}
                          <li class="flex flex-wrap items-center gap-2 sm:gap-3 p-2 bg-surface rounded-md border border-border">
                            <ItemImage src={img} cat={it?.cat || it?.category || ''} size={40} alt={it?.name ?? e.id} />
                            <a href={it ? `/items/${e.id}` : '#'} class="flex-1 min-w-[140px] text-sm font-medium truncate {it ? 'text-rarity-' + (it.rarity || 'commun') : 'text-text-dim'}">{it?.name ?? e.id}</a>
                            <button type="button" onclick={() => removeItemFromList(activeList.id, e.id)} class="w-9 h-9 inline-flex items-center justify-center rounded text-text-faint hover:text-danger order-last sm:order-none" title="Retirer">
                              <Icon name="close" size={14} />
                            </button>
                            <div class="flex items-center bg-bg rounded-md border border-border">
                              <button type="button" onclick={() => setListItemQty(activeList.id, e.id, Math.max(1, e.qty - 1))} class="w-8 h-9 text-text-dim hover:text-text" aria-label="−">−</button>
                              <input
                                type="number"
                                min="1"
                                value={e.qty}
                                oninput={(ev) => {
                                  const v = parseInt(ev.currentTarget.value);
                                  if (Number.isFinite(v) && v > 0) setListItemQty(activeList.id, e.id, v);
                                }}
                                class="w-12 h-9 bg-transparent text-center font-mono num text-sm outline-none"
                              />
                              <button type="button" onclick={() => setListItemQty(activeList.id, e.id, e.qty + 1)} class="w-8 h-9 text-text-dim hover:text-text" aria-label="+">+</button>
                            </div>
                            {#if activeList.groups.length > 1}
                              <select
                                value={g.id}
                                onchange={(ev) => moveEntry(activeList.id, 'item', e.id, ev.currentTarget.value)}
                                class="h-9 px-2 bg-bg border border-border hover:border-border-strong rounded text-xs text-text-dim hover:text-text outline-none max-w-[160px] flex-1 sm:flex-none"
                                title="Déplacer vers un autre sous-groupe"
                              >
                                {#each activeList.groups as og (og.id)}
                                  <option value={og.id}>{og.name || 'Sans groupe'}</option>
                                {/each}
                              </select>
                            {/if}
                          </li>
                        {/if}
                      {/each}
                    </ul>
                  {/if}
                </section>
                {/if}
              {/each}

              <form onsubmit={submitNewGroup} class="flex items-center gap-1.5">
                <input
                  bind:value={newGroupName}
                  type="text"
                  placeholder="Nouveau sous-groupe"
                  class="flex-1 h-9 px-3 bg-surface border border-border focus:border-border-strong outline-none text-sm rounded-md"
                />
                <button type="submit" class="h-9 px-3 inline-flex items-center gap-1.5 bg-surface border border-border hover:border-border-strong rounded-md text-sm text-text-dim hover:text-text" title="Créer un sous-groupe">
                  <Icon name="plus" size={14} /> Sous-groupe
                </button>
              </form>
            </div>

            <!-- Aggregate panel -->
            <aside class="space-y-5 self-start">
              {#if rawSorted.length}
                {@const doneCount = rawSorted.filter((r) => (activeList.progress?.[r.id] ?? 0) >= r.qty).length}
                <div>
                  <div class="flex items-baseline justify-between mb-2">
                    <div class="text-[11px] uppercase tracking-wider text-text-faint">Matériaux à récupérer</div>
                    <span class="text-[11px] num {doneCount === rawSorted.length ? 'text-success' : 'text-text-faint'}">{doneCount}/{rawSorted.length}</span>
                  </div>
                  <ul class="space-y-1">
                    {#each rawSorted as r (r.id)}
                      {@const img = r.item ? resolveImg(r.item.images?.[0] ?? r.item.image) : null}
                      {@const have = activeList.progress?.[r.id] ?? 0}
                      {@const done = have >= r.qty}
                      <li class="flex items-center gap-2 p-1.5 rounded-md transition-colors {done ? 'bg-success/10' : 'bg-surface hover:bg-surface-2'}">
                        <a href={r.item ? `/items/${r.id}` : '#'} class="flex items-center gap-2.5 flex-1 min-w-0">
                          <ItemImage src={img} cat={r.item?.cat || r.item?.category || ''} size={28} alt={r.item?.name ?? r.id} />
                          <span class="flex-1 truncate text-xs {done ? 'text-text-dim line-through' : (r.item ? 'text-rarity-' + (r.item.rarity || 'commun') : 'text-text-dim')}">{r.item?.name ?? r.id}</span>
                        </a>
                        <div class="flex items-center bg-bg rounded border border-border shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={r.qty}
                            value={have}
                            oninput={(ev) => {
                              const v = parseInt(ev.currentTarget.value);
                              setListProgress(activeList.id, r.id, Number.isFinite(v) ? v : 0);
                            }}
                            class="w-10 h-6 bg-transparent text-center font-mono num text-[11px] outline-none {done ? 'text-success' : 'text-text'}"
                            aria-label="J'ai déjà"
                          />
                          <span class="text-[11px] text-text-faint pr-1.5 font-mono num">/{r.qty}</span>
                        </div>
                        <button
                          type="button"
                          onclick={() => setListProgress(activeList.id, r.id, done ? 0 : r.qty)}
                          class="text-text-faint hover:text-success shrink-0"
                          title={done ? 'Remettre à 0' : 'Marquer complet'}
                        >
                          <Icon name={done ? 'check' : 'plus'} size={13} />
                        </button>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if questItemsSorted.length}
                {@const qDone = questItemsSorted.filter((r) => (activeList.progress?.[r.id] ?? 0) >= r.qty).length}
                <div>
                  <div class="flex items-baseline justify-between mb-2">
                    <div class="text-[11px] uppercase tracking-wider text-text-faint">Items de quête (à part)</div>
                    <span class="text-[11px] num {qDone === questItemsSorted.length ? 'text-success' : 'text-text-faint'}">{qDone}/{questItemsSorted.length}</span>
                  </div>
                  <ul class="space-y-1">
                    {#each questItemsSorted as r (r.id)}
                      {@const img = r.item ? resolveImg(r.item.images?.[0] ?? r.item.image) : null}
                      {@const have = activeList.progress?.[r.id] ?? 0}
                      {@const done = have >= r.qty}
                      <li class="flex items-center gap-2 p-1.5 rounded-md transition-colors {done ? 'bg-success/10' : 'bg-surface hover:bg-surface-2'}">
                        <a href={r.item ? `/items/${r.id}` : '#'} class="flex items-center gap-2.5 flex-1 min-w-0">
                          <ItemImage src={img} cat={r.item?.cat || r.item?.category || ''} size={28} alt={r.item?.name ?? r.id} />
                          <span class="flex-1 truncate text-xs {done ? 'text-text-dim line-through' : (r.item ? 'text-rarity-' + (r.item.rarity || 'commun') : 'text-text-dim')}">{r.item?.name ?? r.id}</span>
                        </a>
                        <div class="flex items-center bg-bg rounded border border-border shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={r.qty}
                            value={have}
                            oninput={(ev) => {
                              const v = parseInt(ev.currentTarget.value);
                              setListProgress(activeList.id, r.id, Number.isFinite(v) ? v : 0);
                            }}
                            class="w-10 h-6 bg-transparent text-center font-mono num text-[11px] outline-none {done ? 'text-success' : 'text-text'}"
                          />
                          <span class="text-[11px] text-text-faint pr-1.5 font-mono num">/{r.qty}</span>
                        </div>
                        <button
                          type="button"
                          onclick={() => setListProgress(activeList.id, r.id, done ? 0 : r.qty)}
                          class="text-text-faint hover:text-success shrink-0"
                          title={done ? 'Remettre à 0' : 'Marquer complet'}
                        >
                          <Icon name={done ? 'check' : 'plus'} size={13} />
                        </button>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if allRewards.length}
                <div>
                  <div class="flex items-baseline justify-between mb-2">
                    <div class="text-[11px] uppercase tracking-wider text-text-faint">Récompenses de quêtes</div>
                    <span class="text-[11px] text-text-faint num">{allRewards.length}</span>
                  </div>
                  <p class="text-[11px] text-text-faint mb-2">Cliquer pour basculer entre « déduit des besoins » et « à récupérer quand même ».</p>
                  <ul class="space-y-1">
                    {#each allRewards as r (r.id)}
                      {@const img = r.item ? resolveImg(r.item.images?.[0] ?? r.item.image) : null}
                      <li>
                        <button
                          type="button"
                          onclick={() => toggleIgnoredReward(activeList.id, r.id)}
                          class="group w-full flex items-center gap-2.5 p-1.5 rounded-md text-left transition-colors {r.ignored ? 'bg-surface hover:bg-surface-2' : 'bg-success/5 hover:bg-success/10'}"
                          title={r.ignored ? "Cliquer pour déduire cette récompense des besoins" : "Cliquer pour ne pas déduire (récupérer l'item normalement)"}
                        >
                          <ItemImage src={img} cat={r.item?.cat || r.item?.category || ''} size={24} alt={r.item?.name ?? r.id} />
                          <span class="flex-1 truncate text-xs {r.ignored ? 'text-text-dim' : 'text-text-dim line-through'}">{r.item?.name ?? r.id}</span>
                          {#if r.ignored}
                            <span class="font-mono num text-xs text-text-faint">×{r.qty} · à fetch</span>
                          {:else}
                            <span class="font-mono num text-xs text-success">−{r.qty}</span>
                          {/if}
                        </button>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if totals && totals.materials.cols > 0}
                <div class="flex items-baseline justify-between px-1">
                  <span class="text-[11px] uppercase tracking-wider text-text-faint">Cols (à part)</span>
                  <span class="font-mono num text-sm text-warning">{totals.materials.cols.toLocaleString('fr-FR')}</span>
                </div>
              {/if}

              {#if entryCount(activeList) > 0}
                <div class="border-t border-border pt-4">
                  <div class="flex items-center gap-2">
                    <button type="button" onclick={copyTranscript} class="flex-1 inline-flex items-center justify-center gap-2 h-9 bg-accent text-bg rounded-md text-sm">
                      <Icon name="check" size={14} />
                      {copyState === 'copied' ? 'Copié !' : 'Copier en texte'}
                    </button>
                    <button type="button" onclick={downloadTxt} class="h-9 px-3 bg-surface border border-border hover:border-border-strong rounded-md text-sm text-text-dim hover:text-text" title="Télécharger .txt">
                      .txt
                    </button>
                  </div>
                  <details class="mt-3">
                    <summary class="text-xs text-text-faint cursor-pointer hover:text-text-dim">Prévisualiser</summary>
                    <pre class="mt-2 p-3 bg-bg border border-border rounded-md text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-[280px] overflow-y-auto">{transcript}</pre>
                  </details>
                </div>
              {/if}
            </aside>
          </div>
        {/if}
      </section>
    </div>

  {:else if tab === 'crafted'}
    {#if !craftedList.length}
      <p class="text-text-faint italic">Aucun item marqué comme possédé.</p>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {#each craftedList as it}
          <div class="flex items-center gap-3 p-3 bg-surface rounded-md border border-border">
            <ItemImage src={resolveImg(it.images?.[0] ?? it.image)} cat={it.cat || it.category || ''} size={48} alt={it.name} />
            <a href="/items/{it.id}" class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate text-rarity-{it.rarity}">{it.name}</div>
              <div class="text-xs text-text-faint mt-0.5 capitalize">{(it.cat || it.category || '').replaceAll('_', ' ')}</div>
            </a>
            <button type="button" onclick={() => toggleCrafted(it.id)} class="text-text-faint hover:text-danger" title="Retirer">
              <Icon name="close" size={14} />
            </button>
          </div>
        {/each}
      </div>
    {/if}

  {:else if tab === 'quests'}
    {#if !allTracked.length}
      <p class="text-text-faint italic">Aucune quête suivie. Coche des objectifs ou marque une quête « en cours » depuis sa fiche.</p>
    {:else}
      <ul class="space-y-1">
        {#each allTracked as t (t.id)}
          <li class="flex items-center gap-3 px-3 h-10 bg-surface rounded-md border border-border">
            <QuestStatusDot status={t.status} size={11} />
            <a href="/quetes/{t.id}" class="flex-1 text-text hover:text-accent text-sm truncate {t.status === 'done' ? 'line-through text-text-dim' : ''}">{t.quest.titre || t.quest.name}</a>
            <button type="button" onclick={() => setQuestStatus(t.id, 'todo')} class="text-text-faint hover:text-danger" title="Retirer du suivi"><Icon name="close" size={14} /></button>
          </li>
        {/each}
      </ul>
    {/if}

  {:else if tab === 'notes'}
    {#if !notes.length}
      <p class="text-text-faint italic">Aucune note enregistrée.</p>
    {:else}
      <div class="space-y-3">
        {#each notes as n (n.key)}
          <article class="p-4 bg-surface rounded-md border border-border">
            <div class="flex items-baseline justify-between mb-2">
              <a href={n.href} class="text-sm">
                <span class="text-text-faint mr-2">{KIND_LABEL[n.kind] ?? n.kind}</span>
                <span class="text-text hover:text-accent">{n.name}</span>
              </a>
              <button type="button" onclick={() => setNote(n.key, '')} class="text-text-faint hover:text-danger" title="Supprimer"><Icon name="trash" size={14} /></button>
            </div>
            <p class="text-sm text-text-dim whitespace-pre-wrap leading-relaxed">{n.text}</p>
          </article>
        {/each}
      </div>
    {/if}
  {/if}
</div>
