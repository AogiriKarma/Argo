<script lang="ts">
  import { stepsP1 } from '$lib/data/guide-p1';
  import { questById, itemById, resolveImg } from '$lib/data/store';
  import { user, setQuestStatus, getQuestStatus, type QuestStatus } from '$lib/data/user';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import QuestStatusDot from '$lib/components/QuestStatusDot.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Lore from '$lib/components/Lore.svelte';
  import Icon from '$lib/components/Icon.svelte';

  function statusOf(qid: string): QuestStatus {
    const q = $questById.get(qid);
    return getQuestStatus($user, qid, q?.objectifs?.length ?? 0);
  }

  const total = $derived(stepsP1.length);
  const done = $derived(stepsP1.filter((s) => statusOf(s.id) === 'done').length);

  // First non-done quest = current step. Used to auto-scroll/highlight.
  const currentId = $derived(stepsP1.find((s) => statusOf(s.id) !== 'done')?.id ?? null);

  // Filter
  let showDone = $state(true);
  const visible = $derived(showDone ? stepsP1 : stepsP1.filter((s) => statusOf(s.id) !== 'done'));
</script>

<svelte:head>
  <title>Guide P1 · Argo</title>
</svelte:head>

<div class="max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <SectionHeader
    title="Guide P1"
    subtitle="Une quête par carte, avec les items à préparer avant de la commencer."
    count="{done}/{total}"
  />

  <!-- Header strip -->
  <div class="mb-6 flex items-center justify-between gap-4 flex-wrap p-4 rounded-lg bg-surface border border-border">
    <div class="flex-1 min-w-[200px]">
      <div class="flex items-baseline justify-between mb-2">
        <span class="text-[11px] uppercase tracking-wider text-text-faint">Progression P1 main</span>
        <span class="text-sm font-mono num {done === total ? 'text-success' : 'text-text'}">{done} / {total}</span>
      </div>
      <div class="h-1.5 rounded-full bg-bg overflow-hidden">
        <div class="h-full bg-accent transition-all" style="width:{(done/total)*100}%"></div>
      </div>
    </div>
    <label class="inline-flex items-center gap-2 text-sm text-text-dim cursor-pointer select-none">
      <input type="checkbox" bind:checked={showDone} class="sr-only peer" />
      <span class="w-9 h-5 rounded-full bg-bg border border-border peer-checked:bg-accent/30 peer-checked:border-accent/50 relative transition-colors">
        <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-text-faint peer-checked:bg-accent peer-checked:translate-x-4 transition-all"></span>
      </span>
      Afficher terminées
    </label>
  </div>

  <ol class="space-y-3">
    {#each visible as step (step.id)}
      {@const q = $questById.get(step.id)}
      {@const s = statusOf(step.id)}
      {@const isCurrent = step.id === currentId}
      <li class="rounded-lg border overflow-hidden {s === 'done' ? 'border-success/30 bg-success/5' : isCurrent ? 'border-accent/40 bg-surface' : 'border-border bg-surface/40'}">
        <header class="px-5 py-4 flex items-start gap-4">
          <button
            type="button"
            onclick={() => setQuestStatus(step.id, s === 'done' ? 'todo' : 'done')}
            class="mt-1 shrink-0"
            title={s === 'done' ? 'Marquer non fait' : 'Marquer terminée'}
            aria-label={s === 'done' ? 'Marquer non fait' : 'Marquer terminée'}
          >
            <QuestStatusDot status={s} size={14} />
          </button>

          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="text-[11px] text-text-faint font-mono num">{q?.titre?.match(/^\d+/)?.[0] ?? '?'}</span>
              <a href="/quetes/{step.id}" class="text-base md:text-lg font-semibold tracking-tight {s === 'done' ? 'text-text-dim line-through' : 'text-text hover:text-accent'}">{q?.titre || q?.name || step.id}</a>
              {#if isCurrent && s !== 'done'}
                <span class="text-[10px] uppercase tracking-wider text-accent bg-accent/15 px-1.5 py-0.5 rounded">en cours</span>
              {/if}
            </div>
            <div class="mt-1 text-xs text-text-faint flex items-center gap-2 flex-wrap">
              {#if q?.zone}<span>{q.zone}</span>{/if}
              {#if q?.npc}<span>· chez <span class="text-text-dim">{q.npc}</span></span>{/if}
              {#if q?.coords?.x}<span class="font-mono">· ({q.coords.x}, {q.coords.z})</span>{/if}
              {#if step.prepLevel}<span class="text-warning">· lvl {step.prepLevel} requis</span>{/if}
            </div>
          </div>
        </header>

        <div class="px-5 pb-5 space-y-4">
          <!-- Items à préparer -->
          {#if step.prepItems?.length}
            <div class="p-3 rounded-md bg-bg/60 border border-border">
              <div class="text-[11px] uppercase tracking-wider text-warning mb-2 flex items-center gap-1.5">
                <Icon name="bookmark_outline" size={12} /> Items à préparer
              </div>
              <ul class="space-y-1.5">
                {#each step.prepItems as it}
                  {@const item = $itemById.get(it.id)}
                  {@const img = item ? resolveImg(item.images?.[0] ?? item.image) : null}
                  <li class="flex items-start gap-2.5 text-sm">
                    <ItemImage src={img} cat={item?.cat || item?.category || ''} size={24} alt={item?.name ?? it.id} />
                    <div class="flex-1 min-w-0">
                      <div>
                        <a href="/items/{it.id}" class="{item ? 'text-rarity-' + (item.rarity || 'commun') : 'text-text-dim'}">{item?.name ?? it.id}</a>
                        <span class="ml-1.5 font-mono num text-xs text-text">×{it.qty}</span>
                      </div>
                      {#if it.source}
                        <div class="text-[11px] text-text-faint italic mt-0.5">{it.source}</div>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Prereq quêtes -->
          {#if step.prereqQuests?.length}
            <div class="p-3 rounded-md bg-bg/60 border border-border">
              <div class="text-[11px] uppercase tracking-wider text-accent mb-2">À faire avant</div>
              <ul class="space-y-1">
                {#each step.prereqQuests as pq}
                  {@const pqq = $questById.get(pq.id)}
                  <li class="text-sm">
                    <a href="/quetes/{pq.id}" class="text-accent hover:underline">{pqq?.titre || pqq?.name || pq.id}</a>
                    {#if pq.note}<span class="text-[11px] text-text-faint italic"> — {pq.note}</span>{/if}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Objectifs (depuis le dump) -->
          {#if q?.objectifs?.length}
            <div>
              <div class="text-[11px] uppercase tracking-wider text-text-faint mb-2">Objectifs</div>
              <ol class="space-y-1 list-none">
                {#each q.objectifs as o, i}
                  <li class="text-sm text-text-dim flex items-start gap-2">
                    <span class="text-text-faint font-mono num text-[11px] mt-0.5">{i + 1}.</span>
                    <span class="flex-1"><Lore text={o.texte} /></span>
                  </li>
                {/each}
              </ol>
            </div>
          {/if}

          <!-- Tactique -->
          {#if step.tactique}
            <div class="text-sm text-text-dim italic border-l-2 border-accent/40 pl-3 leading-relaxed">
              {step.tactique}
            </div>
          {/if}
        </div>
      </li>
    {/each}
  </ol>

  {#if visible.length === 0}
    <div class="py-20 text-center text-text-dim">
      Tout est marqué terminé. Active "Afficher terminées" pour les revoir.
    </div>
  {/if}
</div>
