<script lang="ts">
  import { items as allItems, itemById, resolveImg } from '$lib/data/store';
  import { RARITY_LABEL, STAT_LABEL, STAT_UNIT } from '$lib/types';
  import ItemImage from './ItemImage.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    category: string;
    slotLabel: string;
    classFilter?: string | null;
    /** Niveau du joueur — items dont lvl > playerLevel sont masqués sauf opt-out */
    playerLevel?: number;
    /** Item actuellement équipé sur ce slot — pour le delta */
    currentItemId?: string | null;
    onClose: () => void;
    onPick: (itemId: string) => void;
  }
  let {
    open = $bindable(),
    category, slotLabel,
    classFilter = null,
    playerLevel = 0,
    currentItemId = null,
    onClose, onPick
  }: Props = $props();

  let q = $state('');
  let palier = $state('');
  let showOtherClasses = $state(false);
  let showAboveLevel = $state(false);

  /** Item survolé / sélectionné pour le preview */
  let hoverId = $state<string | null>(null);

  function fitsClass(it: any): boolean {
    const cls = it.classes;
    if (!cls || !cls.length) return true;
    if (!classFilter) return true;
    return cls.includes(classFilter);
  }

  function fitsLevel(it: any): boolean {
    if (!playerLevel || playerLevel <= 0) return true;
    return (it.lvl ?? 0) <= playerLevel;
  }

  const candidates = $derived.by(() => {
    return $allItems
      .filter((it) => (it.cat || it.category) === category)
      .filter((it) => showOtherClasses || fitsClass(it))
      .filter((it) => showAboveLevel || fitsLevel(it))
      .filter((it) => !palier || String(it.palier ?? '') === palier)
      .filter((it) => !q || it.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (a.lvl ?? 99) - (b.lvl ?? 99) || a.name.localeCompare(b.name, 'fr'));
  });

  // Auto-preview du premier résultat si rien de survolé
  const previewId = $derived(hoverId ?? candidates[0]?.id ?? null);
  const preview = $derived(previewId ? $itemById.get(previewId) : null);
  const current = $derived(currentItemId ? $itemById.get(currentItemId) : null);

  // Normalize stat value to a tuple [min, max] for diffing
  function asRange(v: any): [number, number] {
    if (typeof v === 'number') return [v, v];
    if (Array.isArray(v) && v.length === 2) return [Number(v[0]), Number(v[1])];
    if (v && typeof v === 'object' && 'min' in v && 'max' in v) return [Number(v.min), Number(v.max)];
    return [0, 0];
  }

  /** Liste fusionnée des stats avec valeurs preview & current pour delta. */
  const statRows = $derived.by(() => {
    const all = new Set<string>([
      ...Object.keys(preview?.stats ?? {}),
      ...Object.keys(current?.stats ?? {})
    ]);
    return Array.from(all)
      .map((k) => {
        const [pMin, pMax] = asRange((preview?.stats as any)?.[k]);
        const [cMin, cMax] = asRange((current?.stats as any)?.[k]);
        return {
          key: k,
          label: STAT_LABEL[k] ?? k,
          unit: STAT_UNIT[k] ?? '%',
          pMin, pMax, cMin, cMax,
          dMin: pMin - cMin,
          dMax: pMax - cMax
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  });

  function fmtVal(min: number, max: number, unit: string): string {
    if (min === 0 && max === 0) return '—';
    if (min === max) return `${min > 0 ? '+' : ''}${min}${unit}`;
    return `${min} – ${max}${unit}`;
  }
  function fmtDelta(min: number, max: number, unit: string): string {
    if (min === 0 && max === 0) return '';
    if (min === max) return `${min > 0 ? '+' : ''}${min}${unit}`;
    return `${min >= 0 ? '+' : ''}${min} … ${max >= 0 ? '+' : ''}${max}${unit}`;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-[55] bg-bg/85 backdrop-blur-sm flex items-start justify-center pt-[5vh] px-4"
    onclick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      class="w-full max-w-4xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- En-tête -->
      <div class="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-faint">Équiper</div>
          <div class="text-sm font-semibold">{slotLabel}</div>
        </div>
        <button type="button" onclick={onClose} class="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-surface-2 text-text-dim hover:text-text" aria-label="Fermer">
          <Icon name="close" size={16} />
        </button>
      </div>

      <!-- Filtres -->
      <div class="px-4 py-3 border-b border-border space-y-2">
        <div class="flex flex-wrap gap-2">
          <input
            bind:value={q}
            type="text"
            placeholder="Rechercher…"
            class="flex-1 min-w-[180px] h-9 px-3 bg-bg border border-border focus:border-border-strong outline-none text-sm rounded-md"
            autocomplete="off"
          />
          <select bind:value={palier} class="h-9 px-3 bg-bg border border-border outline-none text-sm rounded-md">
            <option value="">Tous paliers</option>
            <option value="1">P1</option>
            <option value="2">P2</option>
            <option value="3">P3</option>
          </select>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          {#if classFilter}
            <label class="inline-flex items-center gap-2 text-xs text-text-dim cursor-pointer">
              <input type="checkbox" bind:checked={showOtherClasses} class="accent-accent" />
              Autres classes
            </label>
          {/if}
          {#if playerLevel > 0}
            <label class="inline-flex items-center gap-2 text-xs text-text-dim cursor-pointer">
              <input type="checkbox" bind:checked={showAboveLevel} class="accent-accent" />
              Items au-dessus de mon niveau (lvl {playerLevel})
            </label>
          {/if}
        </div>
      </div>

      <!-- 2 colonnes : liste + preview -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-[1fr_280px] overflow-hidden">
        <!-- LISTE -->
        <ul class="overflow-y-auto py-1 border-b md:border-b-0 md:border-r border-border">
          {#each candidates.slice(0, 200) as it (it._id)}
            {@const active = (hoverId ?? candidates[0]?.id) === it.id}
            <li>
              <button
                type="button"
                onmouseenter={() => (hoverId = it.id)}
                onfocus={() => (hoverId = it.id)}
                onclick={() => { onPick(it.id); onClose(); }}
                class="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors {active ? 'bg-surface-2' : 'hover:bg-surface-2/60'}"
              >
                <ItemImage src={resolveImg(it.images?.[0] ?? it.image)} cat={it.cat || it.category || ''} size={32} alt={it.name} />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate text-rarity-{it.rarity}">{it.name}</div>
                  <div class="text-[11px] text-text-faint flex items-center gap-1.5 flex-wrap">
                    <span class="dot-rarity-{it.rarity} w-1.5 h-1.5 rounded-full inline-block"></span>
                    <span>{RARITY_LABEL[it.rarity]}</span>
                    {#if it.lvl}<span class="{playerLevel > 0 && it.lvl > playerLevel ? 'text-warning' : ''}">· lvl {it.lvl}</span>{/if}
                    {#if it.palier}<span>· P{it.palier}</span>{/if}
                    {#if it.classes?.length}
                      <span class="px-1.5 py-px rounded text-[10px] {classFilter && !it.classes.includes(classFilter) ? 'bg-warning/15 text-warning' : 'bg-bg text-text-faint'}">
                        {it.classes.join(', ')}
                      </span>
                    {/if}
                  </div>
                </div>
              </button>
            </li>
          {/each}
          {#if candidates.length === 0}
            <li class="px-4 py-8 text-center text-text-dim text-sm">Aucun item.</li>
          {/if}
        </ul>

        <!-- PREVIEW -->
        <aside class="overflow-y-auto bg-bg/30">
          {#if !preview}
            <div class="p-5 text-sm text-text-dim italic">Survole un item pour voir l'aperçu.</div>
          {:else}
            <div class="p-5 space-y-4">
              <div class="flex items-start gap-3">
                <ItemImage src={resolveImg(preview.images?.[0] ?? preview.image)} cat={preview.cat || preview.category || ''} size={48} alt={preview.name} />
                <div class="flex-1 min-w-0">
                  <a href="/items/{preview.id}" class="block text-sm font-semibold text-rarity-{preview.rarity}">{preview.name}</a>
                  <div class="text-[11px] text-text-faint mt-0.5 flex flex-wrap gap-1.5 items-center">
                    {RARITY_LABEL[preview.rarity]}
                    {#if preview.lvl}<span>· lvl {preview.lvl}</span>{/if}
                    {#if preview.palier}<span>· P{preview.palier}</span>{/if}
                  </div>
                </div>
              </div>

              {#if current}
                <div class="text-[11px] text-text-faint flex items-center gap-2">
                  <span class="uppercase tracking-wider">vs équipé :</span>
                  <span class="text-rarity-{current.rarity} truncate">{current.name}</span>
                </div>
              {/if}

              {#if statRows.length === 0}
                <p class="text-xs text-text-dim italic">Pas de stats sur cet item.</p>
              {:else}
                <dl class="space-y-1.5">
                  {#each statRows as r}
                    {@const positiveDelta = r.dMax > 0 || (r.dMax === 0 && r.dMin > 0)}
                    {@const negativeDelta = r.dMax < 0 || (r.dMax === 0 && r.dMin < 0)}
                    <div class="flex items-baseline justify-between gap-3 text-[13px]">
                      <dt class="text-text-dim flex-1 truncate">{r.label}</dt>
                      <dd class="font-mono num text-xs text-text shrink-0">{fmtVal(r.pMin, r.pMax, r.unit)}</dd>
                      {#if current}
                        <dd class="font-mono num text-[11px] shrink-0 w-20 text-right {positiveDelta ? 'text-success' : negativeDelta ? 'text-danger' : 'text-text-faint'}">
                          {r.dMin === 0 && r.dMax === 0 ? '=' : fmtDelta(r.dMin, r.dMax, r.unit)}
                        </dd>
                      {/if}
                    </div>
                  {/each}
                </dl>
              {/if}

              <button
                type="button"
                onclick={() => { onPick(preview.id); onClose(); }}
                class="w-full h-9 rounded-md bg-accent text-bg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Équiper
              </button>
            </div>
          {/if}
        </aside>
      </div>

      {#if candidates.length > 200}
        <div class="px-4 py-2 text-center text-[11px] text-text-faint border-t border-border">
          {candidates.length} résultats, 200 affichés — affine ta recherche.
        </div>
      {/if}
    </div>
  </div>
{/if}
