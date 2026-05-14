<script lang="ts">
  import { itemById, resolveImg } from '$lib/data/store';
  import {
    user, setBuildSlot, clearBuild, renameBuild, setBuildClass,
    BUILD_SLOTS, SLOT_CATEGORY, PLAYER_CLASSES,
    type BuildSlot, type PlayerClass
  } from '$lib/data/user';
  import { aggregateBuildStats } from '$lib/build-stats';
  import { STAT_LABEL, STAT_UNIT } from '$lib/types';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import SlotPicker from '$lib/components/SlotPicker.svelte';
  import { askConfirm } from '$lib/stores/confirm';

  const SLOT_LABEL: Record<BuildSlot, string> = {
    casque: 'Casque', plastron: 'Plastron', jambieres: 'Jambières', bottes: 'Bottes', gants: 'Gants',
    arme_p: 'Arme principale', arme_s: 'Arme secondaire',
    amulette: 'Amulette', bracelet: 'Bracelet',
    anneau1: 'Anneau I', anneau2: 'Anneau II',
    artefact: 'Artefact'
  };
  const LEFT_SLOTS: BuildSlot[]  = ['casque', 'plastron', 'jambieres', 'bottes', 'gants'];
  const RIGHT_SLOTS: BuildSlot[] = ['amulette', 'bracelet', 'anneau1', 'anneau2', 'artefact'];
  const WEAPON_SLOTS: BuildSlot[] = ['arme_p', 'arme_s'];

  let pickerOpen = $state(false);
  let pickerSlot = $state<BuildSlot | null>(null);

  function openPicker(slot: BuildSlot) { pickerSlot = slot; pickerOpen = true; }
  function pickItem(itemId: string) { if (pickerSlot) setBuildSlot(pickerSlot, itemId); }
  function unequip(slot: BuildSlot) { setBuildSlot(slot, null); }

  async function reset() {
    const ok = await askConfirm({
      title: 'Vider le build',
      message: 'Tous les slots seront déséquipés. La classe et le nom restent.',
      confirmLabel: 'Vider',
      danger: true
    });
    if (ok) clearBuild();
  }

  function pickClass(c: Exclude<PlayerClass, null>) {
    setBuildClass($user.build.class === c ? null : c);
  }

  let editingName = $state(false);
  let editedName = $state('');
  function startRename() { editingName = true; editedName = $user.build.name; }
  function commitRename() { renameBuild(editedName); editingName = false; }

  const equipped = $derived(
    BUILD_SLOTS.map((s) => ({ slot: s, item: $user.build.slots[s] ? $itemById.get($user.build.slots[s] as string) : undefined }))
  );
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

  const requiredLvl = $derived(
    equippedItems.reduce((max, it: any) => Math.max(max, it?.lvl ?? 0), 0)
  );

  function classMismatch(item: any): boolean {
    if (!$user.build.class || !item?.classes?.length) return false;
    return !item.classes.includes($user.build.class);
  }
  const mismatchCount = $derived(equipped.filter((e) => e.item && classMismatch(e.item)).length);

  const skinUrl = $derived(
    $user.build.class
      ? `/img/skins/${$user.build.class}.png`
      : '/img/skins/default.png'
  );

  // Helpers pour le rendu des slots
  function slotIcon(slot: BuildSlot): string {
    switch (slot) {
      case 'casque': return 'armor_h';
      case 'plastron': return 'armor_p';
      case 'jambieres': case 'bottes': return 'armor_b';
      case 'gants': return 'armor_g';
      case 'amulette': return 'amulet';
      case 'bracelet': return 'bracelet';
      case 'anneau1': case 'anneau2': return 'ring';
      case 'artefact': return 'rune';
      case 'arme_p': return 'weapon_p';
      case 'arme_s': return 'weapon_s';
      default: return 'plus';
    }
  }
</script>

<svelte:head>
  <title>Build · Argo</title>
</svelte:head>

<div class="max-w-[1480px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <header class="mb-8 flex items-center gap-4 flex-wrap">
    <div class="flex-1 min-w-[200px]">
      {#if editingName}
        <input
          bind:value={editedName}
          onblur={commitRename}
          onkeydown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') editingName = false; }}
          class="text-3xl md:text-4xl font-semibold tracking-tight bg-transparent border-b border-border outline-none w-full"
          autofocus
        />
      {:else}
        <h1 class="text-3xl md:text-4xl font-semibold tracking-tight leading-tight inline-flex items-center gap-3 flex-wrap">
          {$user.build.name}
          <button type="button" onclick={startRename} class="text-xs text-text-faint hover:text-text font-normal">Renommer</button>
        </h1>
      {/if}
      <p class="mt-2 text-sm text-text-dim">
        Clic sur un slot pour équiper.
        {#if requiredLvl > 0}<span> · Niveau requis : <span class="text-warning font-mono num">{requiredLvl}</span></span>{/if}
        {#if mismatchCount > 0}<span class="text-warning"> · {mismatchCount} item{mismatchCount > 1 ? 's' : ''} hors classe</span>{/if}
      </p>
    </div>

    <button type="button" onclick={reset} class="text-sm text-text-dim hover:text-danger flex items-center gap-1.5">
      <Icon name="trash" size={14} /> Vider
    </button>
  </header>

  <!-- Sélecteur de classe -->
  <div class="mb-8 flex items-center gap-2 flex-wrap">
    <span class="text-[11px] uppercase tracking-wider text-text-faint mr-1">Classe</span>
    {#each PLAYER_CLASSES as cls}
      {@const selected = $user.build.class === cls.id}
      <button
        type="button"
        onclick={() => pickClass(cls.id)}
        class="inline-flex items-center gap-2 h-9 pl-1 pr-3 rounded-md border transition-colors {selected ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-text-dim hover:text-text hover:border-border-strong'}"
      >
        <img src="/img/skins/{cls.id}.png" alt="" class="w-7 h-7 rounded object-cover" />
        <span class="text-sm">{cls.label}</span>
      </button>
    {/each}
    {#if $user.build.class}
      <button type="button" onclick={() => setBuildClass(null)} class="text-xs text-text-faint hover:text-text">Aucune classe</button>
    {/if}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
    <div>
      <div class="grid grid-cols-2 md:grid-cols-[1fr_280px_1fr] gap-3 md:gap-4 items-start">
        <!-- Slots gauche -->
        <div class="space-y-2 order-1">
          {#each LEFT_SLOTS as slot (slot)}
            {@const id = $user.build.slots[slot]}
            {@const it = id ? $itemById.get(id) : undefined}
            {@const bad = it && classMismatch(it)}
            <button
              type="button"
              onclick={() => openPicker(slot)}
              class="group w-full flex items-center gap-3 p-2.5 rounded-md border transition-colors text-left {it ? 'bg-surface border-border hover:border-border-strong' : 'bg-surface/30 border-dashed border-border hover:border-accent/40'} {bad ? 'border-warning/40 bg-warning/5' : ''}"
            >
              {#if it}
                <ItemImage src={resolveImg(it.images?.[0] ?? it.image)} cat={it.cat || it.category || ''} size={36} alt={it.name} />
              {:else}
                <span class="w-9 h-9 rounded-md bg-bg/60 inline-flex items-center justify-center text-text-faint shrink-0">
                  <Icon name={slotIcon(slot)} size={16} />
                </span>
              {/if}
              <div class="flex-1 min-w-0">
                <div class="text-[10px] uppercase tracking-wider text-text-faint">{SLOT_LABEL[slot]}</div>
                {#if it}
                  <div class="text-sm font-medium truncate text-rarity-{it.rarity}">{it.name}</div>
                {:else}
                  <div class="text-sm text-text-dim italic">Vide</div>
                {/if}
              </div>
              {#if it}
                <span role="button" tabindex="0" aria-label="Déséquiper"
                  onclick={(e) => { e.stopPropagation(); unequip(slot); }}
                  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); unequip(slot); } }}
                  class="opacity-0 group-hover:opacity-100 w-6 h-6 inline-flex items-center justify-center text-text-faint hover:text-danger cursor-pointer">
                  <Icon name="close" size={12} />
                </span>
              {/if}
            </button>
          {/each}
        </div>

        <!-- Silhouette + armes -->
        <div class="order-3 md:order-2 col-span-2 md:col-span-1">
          <div class="relative aspect-square bg-gradient-to-b from-surface to-bg rounded-lg border border-border overflow-hidden flex items-end justify-center">
            <img
              src={skinUrl}
              alt={$user.build.class ?? 'sans classe'}
              class="w-full h-full object-contain pixel"
              style="image-rendering: pixelated"
            />
            {#if !$user.build.class}
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="px-3 py-1.5 bg-bg/80 backdrop-blur-sm rounded-md text-xs text-text-dim">Choisis une classe</div>
              </div>
            {:else}
              <div class="absolute bottom-2 left-2 right-2 px-3 py-1.5 bg-bg/80 backdrop-blur-sm rounded text-center text-sm font-medium capitalize">
                {$user.build.class}
              </div>
            {/if}
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2">
            {#each WEAPON_SLOTS as slot (slot)}
              {@const id = $user.build.slots[slot]}
              {@const it = id ? $itemById.get(id) : undefined}
              {@const bad = it && classMismatch(it)}
              <button
                type="button"
                onclick={() => openPicker(slot)}
                class="group flex flex-col items-center gap-1.5 p-2 rounded-md border transition-colors {it ? 'bg-surface border-border hover:border-border-strong' : 'bg-surface/30 border-dashed border-border hover:border-accent/40'} {bad ? 'border-warning/40 bg-warning/5' : ''}"
              >
                {#if it}
                  <ItemImage src={resolveImg(it.images?.[0] ?? it.image)} cat={it.cat || it.category || ''} size={44} alt={it.name} />
                  <div class="text-[11px] font-medium truncate w-full text-center text-rarity-{it.rarity}">{it.name}</div>
                {:else}
                  <span class="w-11 h-11 rounded bg-bg/60 inline-flex items-center justify-center text-text-faint">
                    <Icon name={slotIcon(slot)} size={18} />
                  </span>
                  <div class="text-[11px] text-text-dim italic">{SLOT_LABEL[slot]}</div>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Slots droite -->
        <div class="space-y-2 order-2 md:order-3">
          {#each RIGHT_SLOTS as slot (slot)}
            {@const id = $user.build.slots[slot]}
            {@const it = id ? $itemById.get(id) : undefined}
            {@const bad = it && classMismatch(it)}
            <button
              type="button"
              onclick={() => openPicker(slot)}
              class="group w-full flex items-center gap-3 p-2.5 rounded-md border transition-colors text-left {it ? 'bg-surface border-border hover:border-border-strong' : 'bg-surface/30 border-dashed border-border hover:border-accent/40'} {bad ? 'border-warning/40 bg-warning/5' : ''}"
            >
              {#if it}
                <ItemImage src={resolveImg(it.images?.[0] ?? it.image)} cat={it.cat || it.category || ''} size={36} alt={it.name} />
              {:else}
                <span class="w-9 h-9 rounded-md bg-bg/60 inline-flex items-center justify-center text-text-faint shrink-0">
                  <Icon name={slotIcon(slot)} size={16} />
                </span>
              {/if}
              <div class="flex-1 min-w-0">
                <div class="text-[10px] uppercase tracking-wider text-text-faint">{SLOT_LABEL[slot]}</div>
                {#if it}
                  <div class="text-sm font-medium truncate text-rarity-{it.rarity}">{it.name}</div>
                {:else}
                  <div class="text-sm text-text-dim italic">Vide</div>
                {/if}
              </div>
              {#if it}
                <span role="button" tabindex="0" aria-label="Déséquiper"
                  onclick={(e) => { e.stopPropagation(); unequip(slot); }}
                  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); unequip(slot); } }}
                  class="opacity-0 group-hover:opacity-100 w-6 h-6 inline-flex items-center justify-center text-text-faint hover:text-danger cursor-pointer">
                  <Icon name="close" size={12} />
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Panneau stats -->
    <aside class="lg:sticky lg:top-20 self-start space-y-5">
      <div class="bg-surface border border-border rounded-lg p-5">
        <div class="flex items-baseline justify-between mb-3">
          <div class="text-[11px] uppercase tracking-wider text-text-faint">Total stats</div>
          <div class="text-[11px] text-text-faint num">{equippedItems.length}/{BUILD_SLOTS.length}</div>
        </div>
        {#if sortedStats.length === 0}
          <p class="text-sm text-text-dim italic">Équipe au moins un item pour voir les stats.</p>
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

      {#if mismatchCount > 0}
        <div class="p-3 rounded-md bg-warning/10 border border-warning/30 text-xs text-warning leading-relaxed">
          <strong class="font-medium block mb-1">{mismatchCount} item{mismatchCount > 1 ? 's' : ''} hors classe</strong>
          Les slots concernés sont surlignés. Tu ne pourras pas les équiper en jeu avec cette classe.
        </div>
      {/if}
    </aside>
  </div>
</div>

{#if pickerSlot}
  <SlotPicker
    bind:open={pickerOpen}
    category={SLOT_CATEGORY[pickerSlot]}
    slotLabel={SLOT_LABEL[pickerSlot]}
    classFilter={$user.build.class}
    onClose={() => (pickerOpen = false)}
    onPick={pickItem}
  />
{/if}
