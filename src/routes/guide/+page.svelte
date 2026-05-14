<script lang="ts">
  import { guideP1 } from '$lib/data/guide-p1';
  import { questById } from '$lib/data/store';
  import { user, getQuestStatus, type QuestStatus } from '$lib/data/user';
  import QuestDetail from '$lib/components/details/QuestDetail.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  function statusOf(qid: string): QuestStatus {
    const q = $questById.get(qid);
    return getQuestStatus($user, qid, q?.objectifs?.length ?? 0);
  }

  // Index courant via ?step=N (1-based en URL pour lisibilité)
  const stepParam = $derived(parseInt($page.url.searchParams.get('step') ?? '') || 0);
  const firstUndoneIdx = $derived.by(() => {
    const i = guideP1.findIndex((id) => statusOf(id) !== 'done');
    return i === -1 ? 0 : i;
  });
  const idx = $derived(stepParam > 0 ? Math.min(stepParam - 1, guideP1.length - 1) : firstUndoneIdx);

  const currentId = $derived(guideP1[idx]);
  const prevId = $derived(idx > 0 ? guideP1[idx - 1] : null);
  const nextId = $derived(idx < guideP1.length - 1 ? guideP1[idx + 1] : null);

  function setStep(n: number) {
    const u = new URL($page.url);
    u.searchParams.set('step', String(n + 1));
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: false });
  }

  const totalDone = $derived(guideP1.filter((id) => statusOf(id) === 'done').length);
</script>

<svelte:head>
  <title>Guide P1 · Argo</title>
</svelte:head>

<div class="max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <SectionHeader
    title="Guide P1"
    subtitle="Quête par quête. Utilise précédent / suivant pour avancer."
    count="{idx + 1} / {guideP1.length}"
  />

  <!-- Progression -->
  <div class="mb-6 flex items-center gap-3">
    <div class="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
      <div class="h-full bg-accent transition-all" style="width:{(totalDone / guideP1.length) * 100}%"></div>
    </div>
    <span class="text-[11px] font-mono num text-text-faint shrink-0">{totalDone} terminée{totalDone > 1 ? 's' : ''}</span>
  </div>

  <!-- Nav haut -->
  <nav class="mb-8 grid grid-cols-2 gap-3">
    {#if prevId}
      {@const pq = $questById.get(prevId)}
      <button type="button" onclick={() => setStep(idx - 1)} class="flex items-start gap-3 p-3 bg-surface hover:bg-surface-2 rounded-md border border-border hover:border-border-strong transition-colors text-left">
        <Icon name="chevron_right" size={16} class="text-text-faint rotate-180 mt-0.5 shrink-0" />
        <span class="min-w-0 flex-1">
          <span class="block text-[11px] uppercase tracking-wider text-text-faint">Précédente</span>
          <span class="block text-sm text-text truncate">{pq?.titre || pq?.name || prevId}</span>
        </span>
      </button>
    {:else}<div></div>{/if}
    {#if nextId}
      {@const nq = $questById.get(nextId)}
      <button type="button" onclick={() => setStep(idx + 1)} class="flex items-start gap-3 p-3 bg-surface hover:bg-surface-2 rounded-md border border-border hover:border-border-strong transition-colors text-right justify-end">
        <span class="min-w-0 flex-1 text-right">
          <span class="block text-[11px] uppercase tracking-wider text-text-faint">Suivante</span>
          <span class="block text-sm text-text truncate">{nq?.titre || nq?.name || nextId}</span>
        </span>
        <Icon name="chevron_right" size={16} class="text-text-faint mt-0.5 shrink-0" />
      </button>
    {/if}
  </nav>

  <!-- Détail de la quête courante (même affichage que /quetes/[id]) -->
  <QuestDetail id={currentId} showBreadcrumb={false} showNav={false} />

  <!-- Nav bas (redondant pour ne pas avoir à remonter) -->
  <nav class="mt-12 pt-6 border-t border-border grid grid-cols-2 gap-3">
    {#if prevId}
      {@const pq = $questById.get(prevId)}
      <button type="button" onclick={() => setStep(idx - 1)} class="flex items-start gap-3 p-3 bg-surface hover:bg-surface-2 rounded-md border border-border hover:border-border-strong transition-colors text-left">
        <Icon name="chevron_right" size={16} class="text-text-faint rotate-180 mt-0.5 shrink-0" />
        <span class="min-w-0 flex-1">
          <span class="block text-[11px] uppercase tracking-wider text-text-faint">Précédente</span>
          <span class="block text-sm text-text truncate">{pq?.titre || pq?.name || prevId}</span>
        </span>
      </button>
    {:else}<div></div>{/if}
    {#if nextId}
      {@const nq = $questById.get(nextId)}
      <button type="button" onclick={() => setStep(idx + 1)} class="flex items-start gap-3 p-3 bg-surface hover:bg-surface-2 rounded-md border border-border hover:border-border-strong transition-colors text-right justify-end">
        <span class="min-w-0 flex-1 text-right">
          <span class="block text-[11px] uppercase tracking-wider text-text-faint">Suivante</span>
          <span class="block text-sm text-text truncate">{nq?.titre || nq?.name || nextId}</span>
        </span>
        <Icon name="chevron_right" size={16} class="text-text-faint mt-0.5 shrink-0" />
      </button>
    {/if}
  </nav>
</div>
