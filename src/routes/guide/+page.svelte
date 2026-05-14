<script lang="ts">
  import { guideP1 } from '$lib/data/guide-p1';
  import { questById, itemById, resolveImg } from '$lib/data/store';
  import { user, setQuestStatus, getQuestStatus, type QuestStatus } from '$lib/data/user';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import QuestStatusDot from '$lib/components/QuestStatusDot.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Icon from '$lib/components/Icon.svelte';

  function statusOf(qid: string): QuestStatus {
    const q = $questById.get(qid);
    return getQuestStatus($user, qid, q?.objectifs?.length ?? 0);
  }

  // Progress across all P1 main quests in the guide
  const total = $derived(guideP1.reduce((s, p) => s + p.quests.length, 0));
  const done = $derived(
    guideP1.reduce((s, p) => s + p.quests.filter((q) => statusOf(q.id) === 'done').length, 0)
  );

  // Currently-active phase = first phase that still has a non-done quest
  const activePhaseNum = $derived.by(() => {
    for (const p of guideP1) {
      if (p.quests.some((q) => statusOf(q.id) !== 'done')) return p.num;
    }
    return guideP1.length;
  });

  function isPhaseDone(p: typeof guideP1[number]): boolean {
    return p.quests.every((q) => statusOf(q.id) === 'done');
  }
</script>

<svelte:head>
  <title>Guide P1 · Argo</title>
</svelte:head>

<div class="max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <SectionHeader
    title="Guide P1"
    subtitle="Parcours main P1 optimisé par zones — gather opportuniste, zéro retour inutile."
    count="{done}/{total}"
  />

  <!-- Top progress bar -->
  <div class="mb-8 p-4 rounded-lg bg-surface border border-border">
    <div class="flex items-baseline justify-between mb-2">
      <span class="text-[11px] uppercase tracking-wider text-text-faint">Progression</span>
      <span class="text-sm font-mono num {done === total ? 'text-success' : 'text-text'}">{done} / {total} quêtes</span>
    </div>
    <div class="h-1.5 rounded-full bg-bg overflow-hidden">
      <div class="h-full bg-accent transition-all" style="width:{(done/total)*100}%"></div>
    </div>
  </div>

  <ol class="space-y-3">
    {#each guideP1 as phase (phase.num)}
      {@const phaseDone = isPhaseDone(phase)}
      {@const isActive = phase.num === activePhaseNum}
      <li>
        <details open={isActive || phaseDone === false && phase.num <= activePhaseNum + 1} class="group rounded-lg border {phaseDone ? 'border-success/30 bg-success/5' : isActive ? 'border-accent/40 bg-surface' : 'border-border bg-surface/40'} overflow-hidden">
          <summary class="px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-4">
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-md shrink-0 font-mono num text-sm {phaseDone ? 'bg-success/20 text-success' : isActive ? 'bg-accent/20 text-accent' : 'bg-bg text-text-dim'}">
              {#if phaseDone}<Icon name="check" size={16} />{:else}{phase.num}{/if}
            </span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold tracking-tight truncate">{phase.title}</div>
              <div class="text-xs text-text-faint truncate mt-0.5">{phase.zone}{phase.zoneHint ? ' · ' + phase.zoneHint : ''}</div>
            </div>
            <span class="text-xs text-text-faint num shrink-0">
              {phase.quests.filter((q) => statusOf(q.id) === 'done').length}/{phase.quests.length}
            </span>
            <Icon name="chevron_down" size={14} class="text-text-faint group-open:rotate-180 transition-transform shrink-0" />
          </summary>

          <div class="px-5 pb-5 space-y-5">
            <!-- Carry list for this phase -->
            {#if phase.carry?.length}
              <div class="-mt-1 p-3 rounded-md bg-bg/60 border border-border">
                <div class="text-[11px] uppercase tracking-wider text-warning mb-2 flex items-center gap-1.5">
                  <Icon name="bookmark_outline" size={12} /> À ramasser en passant
                </div>
                <ul class="space-y-1">
                  {#each phase.carry as c}
                    {@const it = $itemById.get(c.itemId)}
                    {@const img = it ? resolveImg(it.images?.[0] ?? it.image) : null}
                    {@const usedInQ = $questById.get(c.usedIn)}
                    <li class="flex items-center gap-2.5 text-sm">
                      <ItemImage src={img} cat={it?.cat || it?.category || ''} size={22} alt={it?.name ?? c.itemId} />
                      <a href="/items/{c.itemId}" class="{it ? 'text-rarity-' + (it.rarity || 'commun') : 'text-text-dim'}">{it?.name ?? c.itemId}</a>
                      <span class="font-mono num text-xs text-text">×{c.qty}</span>
                      <span class="text-[11px] text-text-faint truncate">
                        → <a href="/quetes/{c.usedIn}" class="hover:text-text">{usedInQ?.titre || usedInQ?.name || c.usedIn}</a>
                      </span>
                      {#if c.note}
                        <span class="text-[11px] text-text-faint italic truncate hidden md:inline">· {c.note}</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- Quests in this phase -->
            <ol class="space-y-2.5">
              {#each phase.quests as step, i}
                {@const q = $questById.get(step.id)}
                {@const s = statusOf(step.id)}
                <li class="flex items-start gap-3 p-3 rounded-md border {s === 'done' ? 'border-success/30 bg-success/5' : 'border-border bg-bg/30'}">
                  <button
                    type="button"
                    onclick={() => setQuestStatus(step.id, s === 'done' ? 'todo' : 'done')}
                    class="mt-0.5 shrink-0"
                    title={s === 'done' ? 'Marquer non fait' : 'Marquer terminée'}
                  >
                    <QuestStatusDot status={s} size={14} />
                  </button>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2 flex-wrap">
                      <span class="text-[11px] text-text-faint font-mono num">{phase.num}.{i + 1}</span>
                      <a href="/quetes/{step.id}" class="text-sm font-medium {s === 'done' ? 'text-text-dim line-through' : 'text-text hover:text-accent'}">{q?.titre || q?.name || step.id}</a>
                      {#if q?.npc}
                        <span class="text-[11px] text-text-faint">· {q.npc}</span>
                      {/if}
                      {#if q?.coords?.x}
                        <span class="text-[11px] text-text-faint font-mono">({q.coords.x}, {q.coords.z})</span>
                      {/if}
                    </div>
                    {#if step.hint}
                      <p class="mt-1.5 text-xs text-text-dim leading-relaxed">{step.hint}</p>
                    {/if}
                  </div>
                </li>
              {/each}
            </ol>

            <!-- Side quests -->
            {#if phase.sidequests?.length}
              <div class="p-3 rounded-md bg-bg/60 border border-border">
                <div class="text-[11px] uppercase tracking-wider text-accent mb-2">Secondaires à faire dans la même zone</div>
                <ul class="space-y-1.5">
                  {#each phase.sidequests as sq}
                    {@const q = $questById.get(sq.id)}
                    <li class="flex items-baseline gap-2 text-sm">
                      <Icon name="arrow_right" size={12} class="text-text-faint shrink-0 self-center" />
                      <a href="/quetes/{sq.id}" class="text-accent hover:underline">{q?.titre || q?.name || sq.id}</a>
                      {#if sq.note}
                        <span class="text-[11px] text-text-faint italic">— {sq.note}</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if phase.notes}
              <p class="text-xs text-text-dim italic border-l-2 border-border pl-3">{phase.notes}</p>
            {/if}
          </div>
        </details>
      </li>
    {/each}
  </ol>
</div>
