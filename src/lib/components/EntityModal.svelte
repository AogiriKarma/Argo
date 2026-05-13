<script lang="ts">
  import { modalTarget, closeModal } from '$lib/stores/modal';
  import { itemById, questById } from '$lib/data/store';
  import ItemDetail from './details/ItemDetail.svelte';
  import QuestDetail from './details/QuestDetail.svelte';
  import Icon from './Icon.svelte';

  const target = $derived($modalTarget);

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && target) closeModal();
  }

  // Full-URL link for "open in standalone page"
  const fullHref = $derived(
    target ? (target.kind === 'item' ? `/items/${target.id}` : `/quetes/${target.id}`) : ''
  );
</script>

<svelte:window onkeydown={onKeydown} />

{#if target}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-bg/85 backdrop-blur-sm flex items-start justify-center p-4 md:p-8 overflow-y-auto"
    onclick={closeModal}
  >
    <div
      role="dialog"
      aria-modal="true"
      class="relative w-full max-w-[1100px] my-auto bg-bg border border-border rounded-lg shadow-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Top action bar -->
      <div class="sticky top-0 z-10 flex items-center justify-between px-5 h-12 border-b border-border bg-bg rounded-t-lg">
        <span class="text-xs uppercase tracking-wider text-text-faint">
          {target.kind === 'item' ? 'Item' : 'Quête'}
        </span>
        <div class="flex items-center gap-1">
          <a
            href={fullHref}
            data-modal-skip
            onclick={(e) => { e.stopPropagation(); closeModal(); }}
            class="px-3 h-8 inline-flex items-center text-xs text-text-dim hover:text-text"
            title="Ouvrir en page complète"
          >Page entière ↗</a>
          <button
            type="button"
            onclick={closeModal}
            class="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-surface text-text-dim hover:text-text"
            aria-label="Fermer"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>

      <div class="p-6 md:p-8">
        {#if target.kind === 'item'}
          {#if $itemById.get(target.id)}
            <ItemDetail id={target.id} showBreadcrumb={false} />
          {:else}
            <div class="py-12 text-center text-text-dim">Item introuvable : <span class="font-mono">{target.id}</span></div>
          {/if}
        {:else if target.kind === 'quest'}
          {#if $questById.get(target.id)}
            <QuestDetail id={target.id} showBreadcrumb={false} showNav={false} />
          {:else}
            <div class="py-12 text-center text-text-dim">Quête introuvable : <span class="font-mono">{target.id}</span></div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
