<script lang="ts">
  import { items as allItems, resolveImg } from '$lib/data/store';
  import { RARITY_LABEL } from '$lib/types';
  import ItemImage from './ItemImage.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    /** Catégorie d'item attendue */
    category: string;
    slotLabel: string;
    /** Classe sélectionnée — items restreints à une autre classe sont filtrés */
    classFilter?: string | null;
    onClose: () => void;
    onPick: (itemId: string) => void;
  }
  let { open = $bindable(), category, slotLabel, classFilter = null, onClose, onPick }: Props = $props();

  let q = $state('');
  let palier = $state('');
  let showOtherClasses = $state(false);

  function fitsClass(it: any): boolean {
    const cls = it.classes;
    if (!cls || !cls.length) return true; // pas de restriction
    if (!classFilter) return true;         // pas de classe choisie → tout est dispo
    return cls.includes(classFilter);
  }

  const candidates = $derived.by(() => {
    const cat = category;
    return $allItems
      .filter((it) => (it.cat || it.category) === cat)
      .filter((it) => showOtherClasses || fitsClass(it))
      .filter((it) => !palier || String(it.palier ?? '') === palier)
      .filter((it) => !q || it.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (a.lvl ?? 99) - (b.lvl ?? 99) || a.name.localeCompare(b.name, 'fr'));
  });

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-[55] bg-bg/85 backdrop-blur-sm flex items-start justify-center pt-[8vh] px-4"
    onclick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      class="w-full max-w-2xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-faint">Équiper</div>
          <div class="text-sm font-semibold">{slotLabel}</div>
        </div>
        <button type="button" onclick={onClose} class="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-surface-2 text-text-dim hover:text-text" aria-label="Fermer">
          <Icon name="close" size={16} />
        </button>
      </div>

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
        {#if classFilter}
          <label class="inline-flex items-center gap-2 text-xs text-text-dim cursor-pointer">
            <input type="checkbox" bind:checked={showOtherClasses} class="accent-accent" />
            Afficher aussi les items d'autres classes
          </label>
        {/if}
      </div>

      <ul class="flex-1 overflow-y-auto py-1">
        {#each candidates.slice(0, 200) as it (it._id)}
          <li>
            <button
              type="button"
              onclick={() => { onPick(it.id); onClose(); }}
              class="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-2 text-left"
            >
              <ItemImage src={resolveImg(it.images?.[0] ?? it.image)} cat={it.cat || it.category || ''} size={32} alt={it.name} />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate text-rarity-{it.rarity}">{it.name}</div>
                <div class="text-[11px] text-text-faint">
                  <span class="dot-rarity-{it.rarity} w-1.5 h-1.5 rounded-full inline-block mr-1.5"></span>
                  {RARITY_LABEL[it.rarity]}
                  {#if it.lvl}<span> · lvl {it.lvl}</span>{/if}
                  {#if it.palier}<span> · P{it.palier}</span>{/if}
                  {#if it.classes?.length}
                    <span class="ml-1.5 px-1.5 py-px rounded {classFilter && !it.classes.includes(classFilter) ? 'bg-warning/15 text-warning' : 'bg-bg text-text-faint'}">
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
      {#if candidates.length > 200}
        <div class="px-4 py-2 text-center text-[11px] text-text-faint border-t border-border">
          {candidates.length} résultats, 200 affichés — affine ta recherche.
        </div>
      {/if}
    </div>
  </div>
{/if}
