<script lang="ts">
  import { questById, mobById, itemById, quetes, resolveImg } from '$lib/data/store';
  import { user, setQuestStatus, toggleObjective, isObjectiveDone, getQuestStatus, type QuestStatus } from '$lib/data/user';
  import Lore from '$lib/components/Lore.svelte';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import NoteEditor from '$lib/components/NoteEditor.svelte';
  import QuestStatusDot from '$lib/components/QuestStatusDot.svelte';
  import QuestRewards from '$lib/components/QuestRewards.svelte';
  import BulkListPicker from '$lib/components/BulkListPicker.svelte';

  interface Props {
    id: string;
    showBreadcrumb?: boolean;
    showNav?: boolean;
  }
  let { id, showBreadcrumb = true, showNav = true }: Props = $props();

  /** Payload for adding this quest to a list. */
  const questPayload = $derived(q ? { kind: 'quests' as const, questIds: [q.id] } : { kind: 'quests' as const, questIds: [] });

  const q = $derived($questById.get(id));
  const TYPE_LABEL: Record<string, string> = { main: 'Principale', sec: 'Secondaire', ter: 'Tertiaire' };
  const TYPE_COLOR: Record<string, string> = { main: 'text-warning', sec: 'text-accent', ter: 'text-text-dim' };
  const totalObjectives = $derived(q?.objectifs?.length ?? 0);
  const status = $derived<QuestStatus>(q ? getQuestStatus($user, q.id, totalObjectives) : 'todo');
  const doneObjectives = $derived(
    q ? (status === 'done' ? totalObjectives : ($user.questObjectives[q.id] ?? []).length) : 0
  );

  const STATUS_LABEL: Record<QuestStatus, string> = { todo: 'À faire', wip: 'En cours', done: 'Terminée' };
  const STATUS_RING: Record<QuestStatus, string> = {
    todo: 'border-text-faint text-text-dim',
    wip: 'border-warning text-warning bg-warning/10',
    done: 'border-success text-success bg-success/10'
  };

  const sortedSameType = $derived(
    q ? $quetes.filter((x) => x.type === q.type).slice().sort((a, b) => (a.palier ?? 0) - (b.palier ?? 0) || (a.ordre ?? 0) - (b.ordre ?? 0)) : []
  );
  const currentIdx = $derived(q ? sortedSameType.findIndex((x) => x.id === q.id) : -1);
  const prevQuest = $derived(currentIdx > 0 ? sortedSameType[currentIdx - 1] : null);
  const nextQuest = $derived(currentIdx >= 0 && currentIdx < sortedSameType.length - 1 ? sortedSameType[currentIdx + 1] : null);
</script>

{#if !q}
  <div class="py-20 text-center">
    <h2 class="text-2xl font-semibold mb-2">Quête introuvable</h2>
    <p class="text-text-dim text-sm font-mono">{id}</p>
  </div>
{:else}
  <div>
    {#if showBreadcrumb}
      <nav class="mb-8 text-sm text-text-dim flex items-center gap-2">
        <a href="/quetes" class="hover:text-text">Quêtes</a>
        <span class="text-text-faint">/</span>
        <a href="/quetes?type={q.type}" class={TYPE_COLOR[q.type]}>{TYPE_LABEL[q.type]}</a>
      </nav>
    {/if}

    <header class="mb-10 pb-8 border-b border-border">
      <div class="flex items-start justify-between gap-6 mb-3 flex-wrap">
        <div class="flex items-center gap-3 text-sm text-text-dim flex-wrap">
          <span class={TYPE_COLOR[q.type]}>{TYPE_LABEL[q.type]}</span>
          {#if q.palier}<span>· Palier {q.palier}</span>{/if}
          {#if q.zone}<span>· {q.zone}</span>{/if}
          {#if q.npc}<span>· chez <span class="text-text">{q.npc}</span></span>{/if}
          {#if totalObjectives > 0}<span class="text-text-faint">· {doneObjectives}/{totalObjectives} objectifs</span>{/if}
        </div>

        <div class="flex gap-1 bg-surface border border-border rounded-md p-1">
          {#each ['todo', 'wip', 'done'] as s}
            <button
              type="button"
              onclick={() => setQuestStatus(q.id, s as QuestStatus)}
              class="inline-flex items-center gap-2 px-3 h-8 text-xs rounded transition-colors {status === s ? STATUS_RING[s as QuestStatus] + ' border' : 'border border-transparent text-text-dim hover:text-text'}"
            >
              <QuestStatusDot status={s as QuestStatus} size={9} />
              {STATUS_LABEL[s as QuestStatus]}
            </button>
          {/each}
        </div>
      </div>
      <h1 class="text-3xl md:text-4xl font-semibold tracking-tight leading-tight {status === 'done' ? 'line-through text-text-dim' : ''}">{q.titre || q.name}</h1>
      <div class="mt-4 flex items-center justify-between gap-4 flex-wrap">
        <QuestRewards quest={q} />
        <BulkListPicker payload={questPayload} label="Ajouter à une liste" />
      </div>
    </header>

    {#if q.desc}
      <section class="mb-10 max-w-2xl">
        <p class="text-text-dim italic leading-relaxed"><Lore text={q.desc} /></p>
      </section>
    {/if}

    {#if q.objectifs?.length}
      <section class="mb-10">
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="text-sm uppercase tracking-wider text-text-faint">Objectifs</h2>
          {#if doneObjectives > 0}
            <span class="text-xs text-success font-mono num">{doneObjectives}/{totalObjectives}</span>
          {/if}
        </div>

        <ol class="space-y-2">
          {#each q.objectifs as obj, i (i)}
            {@const done = isObjectiveDone($user, q.id, i)}
            <li
              role="button"
              tabindex="0"
              onclick={() => toggleObjective(q.id, i)}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleObjective(q.id, i); } }}
              class="flex gap-3 items-start py-2.5 px-3 rounded-md cursor-pointer select-none transition-colors {done ? 'bg-success/10 hover:bg-success/15' : 'bg-surface/40 hover:bg-surface'}"
              aria-pressed={done}
              aria-label={done ? 'Marquer non fait' : 'Marquer fait'}
            >
              <span class="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded border transition-colors {done ? 'bg-success border-success text-bg' : 'border-border text-text-faint'}">
                {#if done}<Icon name="check" size={14} />{:else}<span class="text-xs font-mono num">{i + 1}</span>{/if}
              </span>

              <div class="flex-1 pt-0.5 min-w-0">
                <p class="text-sm leading-relaxed {done ? 'line-through text-text-dim' : 'text-text'}"><Lore text={obj.texte} /></p>

                {#if (obj as any).mobs?.length}
                  <ul class="mt-2 flex flex-wrap gap-2">
                    {#each (obj as any).mobs as mm (mm.id)}
                      {@const mob = $mobById.get(mm.id)}
                      <li class="inline-flex items-center gap-2 text-xs">
                        {#if mob}
                          <a href="/mobs/{mm.id}" onclick={(e) => e.stopPropagation()} class="text-accent hover:underline">{mob.name}</a>
                        {:else}
                          <span class="text-text-dim">{mm.id}</span>
                        {/if}
                        <span class="text-text-faint font-mono">×{mm.qte}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}

                {#if (obj as any).items?.length}
                  <ul class="mt-2 flex flex-wrap gap-2">
                    {#each (obj as any).items as ii (ii.id)}
                      {@const it = $itemById.get(ii.id)}
                      <li>
                        <a href={it ? `/items/${ii.id}` : '#'} onclick={(e) => e.stopPropagation()} class="inline-flex items-center gap-2 px-2 h-7 bg-surface rounded text-xs hover:bg-surface-2 transition-colors">
                          <ItemImage src={it ? resolveImg(it.images?.[0] ?? it.image) : null} cat={it?.cat || it?.category || ''} size={18} alt={it?.name ?? ii.id} />
                          <span class={it ? 'text-rarity-' + (it.rarity || 'commun') : 'text-text-dim'}>{it?.name ?? ii.id}</span>
                          <span class="text-text-faint font-mono">×{ii.qte}</span>
                        </a>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            </li>
          {/each}
        </ol>
      </section>
    {/if}

    <section class="mt-10 max-w-2xl">
      <NoteEditor entityId={'quest:' + q.id} placeholder="Astuce, ordre des étapes, NPC à voir…" />
    </section>

    {#if showNav}
      <nav class="mt-12 pt-6 border-t border-border grid grid-cols-2 gap-3">
        {#if prevQuest}
          <a href="/quetes/{prevQuest.id}" class="flex items-start gap-3 p-3 bg-surface hover:bg-surface-2 rounded-md border border-border hover:border-border-strong transition-colors text-left">
            <Icon name="chevron_right" size={16} class="text-text-faint rotate-180 mt-0.5 shrink-0" />
            <span class="min-w-0 flex-1">
              <span class="block text-[11px] uppercase tracking-wider text-text-faint">Précédente</span>
              <span class="block text-sm text-text truncate">{prevQuest.titre || prevQuest.name}</span>
            </span>
          </a>
        {:else}<div></div>{/if}
        {#if nextQuest}
          <a href="/quetes/{nextQuest.id}" class="flex items-start gap-3 p-3 bg-surface hover:bg-surface-2 rounded-md border border-border hover:border-border-strong transition-colors text-right justify-end">
            <span class="min-w-0 flex-1 text-right">
              <span class="block text-[11px] uppercase tracking-wider text-text-faint">Suivante</span>
              <span class="block text-sm text-text truncate">{nextQuest.titre || nextQuest.name}</span>
            </span>
            <Icon name="chevron_right" size={16} class="text-text-faint mt-0.5 shrink-0" />
          </a>
        {/if}
      </nav>
    {/if}
  </div>
{/if}
