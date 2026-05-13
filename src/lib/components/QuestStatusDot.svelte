<script lang="ts">
  import type { QuestStatus } from '$lib/data/user';

  interface Props {
    status: QuestStatus;
    size?: number;
    onclick?: (e: MouseEvent) => void;
    title?: string;
  }
  let { status, size = 10, onclick, title }: Props = $props();

  const COLOR: Record<QuestStatus, string> = {
    todo: 'bg-text-faint',
    wip: 'bg-warning',
    done: 'bg-success'
  };

  const titleByStatus: Record<QuestStatus, string> = {
    todo: 'À faire',
    wip: 'En cours',
    done: 'Terminée'
  };
</script>

{#if onclick}
  <button
    type="button"
    {onclick}
    class="shrink-0 inline-flex items-center justify-center rounded-full {status === 'todo' ? 'border border-text-faint hover:border-warning' : COLOR[status]}"
    style="width:{size}px;height:{size}px;"
    title={title ?? titleByStatus[status]}
    aria-label={titleByStatus[status]}
  >
    {#if status === 'done'}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="text-bg" style="width:{size * 0.7}px;height:{size * 0.7}px"><path d="M5 12l5 5L20 7" /></svg>
    {/if}
  </button>
{:else}
  <span
    class="shrink-0 inline-block rounded-full {status === 'todo' ? 'border border-text-faint' : COLOR[status]}"
    style="width:{size}px;height:{size}px;"
    title={title ?? titleByStatus[status]}
  ></span>
{/if}
