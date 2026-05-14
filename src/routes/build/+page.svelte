<script lang="ts">
  import { itemById, resolveImg } from '$lib/data/store';
  import {
    user, setBuildSlot, clearBuild, renameBuild,
    BUILD_SLOTS, SLOT_CATEGORY, type BuildSlot
  } from '$lib/data/user';
  import { aggregateBuildStats } from '$lib/build-stats';
  import { STAT_LABEL, STAT_UNIT, CATEGORY_LABEL } from '$lib/types';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import SlotPicker from '$lib/components/SlotPicker.svelte';
  import { askConfirm } from '$lib/stores/confirm';

  // Présentation : libellé + ordre visuel des slots (silhouette à la Dofusbook)
  const SLOT_LABEL: Record<BuildSlot, string> = {
    casque: 'Casque', plastron: 'Plastron', jambieres: 'Jambières', bottes: 'Bottes', gants: 'Gants',
    arme_p: 'Arme principale', arme_s: 'Arme secondaire',
    amulette: 'Amulette', bracelet: 'Bracelet',
    anneau1: 'Anneau I', anneau2: 'Anneau II',
    artefact: 'Artefact'
  };

  // Layout 2 colonnes : armures à gauche, armes/accessoires à droite
  const SLOT_GROUPS: { title: string; slots: BuildSlot[] }[] = [
    { title: 'Armure',     slots: ['casque', 'plastron', 'jambieres', 'bottes', 'gants'] },
    { title: 'Armes & accessoires', slots: ['arme_p', 'arme_s', 'amulette', 'bracelet', 'anneau1', 'anneau2', 'artefact'] }
  ];

  let pickerOpen = $state(false);
  let pickerSlot = $state<BuildSlot | null>(null);

  function openPicker(slot: BuildSlot) {
    pickerSlot = slot;
    pickerOpen = true;
  }
  function pickItem(itemId: string) {
    if (pickerSlot) setBuildSlot(pickerSlot, itemId);
  }
  function unequip(slot: BuildSlot) {
    setBuildSlot(slot, null);
  }
  async function reset() {
    const ok = await askConfirm({
      title: 'Vider le build',
      message: 'Tous les slots seront déséquipés. La sauvegarde locale reste.',
      confirmLabel: 'Vider',
      danger: true
    });
    if (ok) clearBuild();
  }

  let editingName = $state(false);
  let editedName = $state('');
  function startRename() { editingName = true; editedName = $user.build.name; }
  function commitRename() { renameBuild(editedName); editingName = false; }

  const equipped = $derived.by(() => {
    const out: { slot: BuildSlot; item: any | undefined }[] = [];
    for (const s of BUILD_SLOTS) {
      const id = $user.build.slots[s];
      out.push({ slot: s, item: id ? $itemById.get(id) : undefined });
    }
    return out;
  });

  const equippedItems = $derived(equipped.map((e) => e.item).filter(Boolean));
  const totals = $derived(aggregateBuildStats(equippedItems));

  function fmt(v: number | [number, number], u: string): string {
    if (Array.isArray(v)) {
      const [a, b] = v;
      if (a === b) return (a > 0 ? '+' : '') + a + u;
      return `${a} – ${b}${u}`;
    }
    return (v > 0 ? '+' : '') + v + u;
  }

  const sortedStats = $derived(
    Object.entries(totals)
      .filter(([_, v]) => v !== 0 && !(Array.isArray(v) && v[0] === 0 && v[1] === 0))
      .sort(([a], [b]) => (STAT_LABEL[a] ?? a).localeCompare(STAT_LABEL[b] ?? b, 'fr'))
  );

  // Niveau requis le plus haut = niveau effectif du build
  const requiredLvl = $derived(
    equippedItems.reduce((max, it: any) => Math.max(max, it?.lvl ?? 0), 0)
  );
</script>

<svelte:head>
  <title>Build · Argo</title>
</svelte:head>

<div class="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <SectionHeader title="Stuff Builder" subtitle="Planifie ton équipement, additionne les stats. Sauvegardé automatiquement.">
    {#snippet children()}
      <button type="button" onclick={reset} class="text-sm text-text-dim hover:text-danger flex items-center gap-1.5">
        <Icon name="trash" size={14} /> Vider
      </button>
    {/snippet}
  </SectionHeader>

  <!-- Nom du build -->
  <div class="mb-6 flex items-center gap-3 flex-wrap">
    {#if editingName}
      <input
        bind:value={editedName}
        onblur={commitRename}
        onkeydown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') editingName = false; }}
        class="text-2xl font-semibold tracking-tight bg-transparent border-b border-border outline-none flex-1 min-w-[200px]"
        autofocus
      />
    {:else}
      <h2 class="text-2xl font-semibold tracking-tight">{$user.build.name}</h2>
      <button type="button" onclick={startRename} class="text-xs text-text-dim hover:text-text">Renommer</button>
    {/if}
    {#if requiredLvl > 0}
      <span class="ml-auto text-sm text-text-faint">Niveau requis : <span class="text-warning font-mono num">{requiredLvl}</span></span>
    {/if}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
    <!-- Slots -->
    <div class="space-y-6">
      {#each SLOT_GROUPS as group (group.title)}
        <section>
          <h3 class="text-[11px] uppercase tracking-wider text-text-faint mb-3">{group.title}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {#each group.slots as slot (slot)}
              {@const id = $user.build.slots[slot]}
              {@const it = id ? $itemById.get(id) : undefined}
              <button
                type="button"
                onclick={() => openPicker(slot)}
                class="group relative flex items-center gap-3 p-3 rounded-md border transition-colors text-left {it ? 'bg-surface border-border hover:border-border-strong' : 'bg-surface/30 border-dashed border-border hover:border-accent/40'}"
              >
                {#if it}
                  <ItemImage src={resolveImg(it.images?.[0] ?? it.image)} cat={it.cat || it.category || ''} size={44} alt={it.name} />
                  <div class="flex-1 min-w-0">
                    <div class="text-[11px] uppercase tracking-wider text-text-faint">{SLOT_LABEL[slot]}</div>
                    <div class="text-sm font-medium truncate text-rarity-{it.rarity}">{it.name}</div>
                    {#if it.lvl}<div class="text-[11px] text-text-faint">lvl {it.lvl}</div>{/if}
                  </div>
                  <span
                    role="button"
                    tabindex="0"
                    aria-label="Déséquiper"
                    onclick={(e) => { e.stopPropagation(); unequip(slot); }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); unequip(slot); } }}
                    class="w-7 h-7 inline-flex items-center justify-center rounded text-text-faint hover:text-danger shrink-0 cursor-pointer"
                  >
                    <Icon name="close" size={14} />
                  </span>
                {:else}
                  <span class="w-11 h-11 rounded-md bg-bg/60 inline-flex items-center justify-center text-text-faint shrink-0">
                    <Icon name="plus" size={18} />
                  </span>
                  <div class="flex-1 min-w-0">
                    <div class="text-[11px] uppercase tracking-wider text-text-faint">{SLOT_LABEL[slot]}</div>
                    <div class="text-sm text-text-dim italic">Cliquer pour équiper</div>
                  </div>
                {/if}
              </button>
            {/each}
          </div>
        </section>
      {/each}
    </div>

    <!-- Totaux -->
    <aside class="lg:sticky lg:top-20 self-start">
      <div class="bg-surface border border-border rounded-lg p-5">
        <div class="text-[11px] uppercase tracking-wider text-text-faint mb-3">Total des stats</div>
        {#if sortedStats.length === 0}
          <p class="text-sm text-text-dim italic">Équipe au moins un item pour voir les stats totales.</p>
        {:else}
          <dl class="space-y-1.5">
            {#each sortedStats as [stat, value]}
              {@const unit = STAT_UNIT[stat] ?? '%'}
              {@const positive = Array.isArray(value) ? value[1] > 0 : value > 0}
              <div class="flex items-baseline justify-between gap-3 text-sm">
                <dt class="text-text-dim">{STAT_LABEL[stat] ?? stat}</dt>
                <dd class="font-mono num text-[13px] {positive ? 'text-text' : 'text-danger'}">{fmt(value, unit)}</dd>
              </div>
            {/each}
          </dl>
        {/if}
      </div>

      <div class="mt-4 text-[11px] text-text-faint text-center">
        {equippedItems.length}/{BUILD_SLOTS.length} slot{equippedItems.length > 1 ? 's' : ''} équipé{equippedItems.length > 1 ? 's' : ''}
      </div>
    </aside>
  </div>
</div>

{#if pickerSlot}
  <SlotPicker
    bind:open={pickerOpen}
    category={SLOT_CATEGORY[pickerSlot]}
    slotLabel={SLOT_LABEL[pickerSlot]}
    onClose={() => (pickerOpen = false)}
    onPick={pickItem}
  />
{/if}
