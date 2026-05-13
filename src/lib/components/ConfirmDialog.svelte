<script lang="ts">
  import { confirmState, closeConfirm } from '$lib/stores/confirm';

  const s = $derived($confirmState);

  function onKeydown(e: KeyboardEvent) {
    if (!s.open) return;
    if (e.key === 'Escape') closeConfirm(false);
    if (e.key === 'Enter') closeConfirm(true);
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if s.open}
  <div
    role="presentation"
    class="fixed inset-0 z-[60] bg-bg/85 backdrop-blur-sm flex items-center justify-center p-4"
    onclick={() => closeConfirm(false)}
  >
    <div
      role="alertdialog"
      aria-modal="true"
      class="w-full max-w-md bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      onclick={(e) => e.stopPropagation()}
    >
      {#if s.title}
        <div class="px-5 pt-4 pb-2 text-sm font-medium text-text">{s.title}</div>
      {/if}
      <div class="px-5 {s.title ? 'pb-5' : 'py-5'} text-sm text-text-dim leading-relaxed">{s.message}</div>
      <div class="flex items-center justify-end gap-2 px-4 py-3 bg-bg/40 border-t border-border">
        <button
          type="button"
          onclick={() => closeConfirm(false)}
          class="px-3 h-9 text-sm rounded-md text-text-dim hover:text-text hover:bg-surface-2 transition-colors"
        >
          {s.cancelLabel ?? 'Annuler'}
        </button>
        <button
          type="button"
          onclick={() => closeConfirm(true)}
          autofocus
          class="px-3 h-9 text-sm rounded-md transition-colors {s.danger ? 'bg-danger/20 text-danger hover:bg-danger/30 border border-danger/40' : 'bg-accent text-bg hover:opacity-90'}"
        >
          {s.confirmLabel ?? 'Confirmer'}
        </button>
      </div>
    </div>
  </div>
{/if}
