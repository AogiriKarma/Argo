<script lang="ts">
  import { user, setNote } from '$lib/data/user';
  import Icon from './Icon.svelte';

  interface Props {
    entityId: string;
    placeholder?: string;
  }
  let { entityId, placeholder = 'Note personnelle…' }: Props = $props();

  const initial = $derived($user.notes[entityId] ?? '');
  let value = $state('');
  let editing = $state(false);

  // Sync on entity change
  $effect(() => {
    value = $user.notes[entityId] ?? '';
  });

  function save() {
    setNote(entityId, value);
    editing = false;
  }
  function cancel() {
    value = initial;
    editing = false;
  }
</script>

<section>
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-sm uppercase tracking-wider text-text-faint flex items-center gap-2">
      <Icon name="note" size={14} />
      Note personnelle
    </h2>
    {#if !editing}
      <button type="button" onclick={() => (editing = true)} class="text-xs text-accent hover:underline">
        {initial ? 'Modifier' : 'Ajouter'}
      </button>
    {/if}
  </div>

  {#if editing}
    <textarea
      bind:value
      {placeholder}
      class="w-full min-h-[120px] p-3 bg-surface border border-border focus:border-accent outline-none rounded-md text-sm font-sans resize-y"
    ></textarea>
    <div class="mt-2 flex gap-2 justify-end">
      <button type="button" onclick={cancel} class="px-3 h-8 text-xs text-text-dim hover:text-text">Annuler</button>
      <button type="button" onclick={save} class="px-3 h-8 text-xs bg-accent text-bg rounded-md hover:opacity-90">Enregistrer</button>
    </div>
  {:else if initial}
    <button type="button" onclick={() => (editing = true)} class="w-full text-left p-3 bg-surface/50 border border-border hover:border-border-strong rounded-md text-sm text-text-dim whitespace-pre-wrap leading-relaxed">{initial}</button>
  {:else}
    <button type="button" onclick={() => (editing = true)} class="w-full text-left p-3 bg-surface/30 border border-dashed border-border hover:border-border-strong rounded-md text-sm text-text-faint italic">{placeholder}</button>
  {/if}
</section>
