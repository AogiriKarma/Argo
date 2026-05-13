<script lang="ts">
  import { user, toggleCrafted } from '$lib/data/user';
  import Icon from './Icon.svelte';
  import ListPickerButton from './ListPickerButton.svelte';

  interface Props {
    itemId: string;
  }
  let { itemId }: Props = $props();

  const isCrafted = $derived($user.craftedItems.includes(itemId));
</script>

<div class="flex gap-2 flex-wrap">
  <ListPickerButton {itemId} />

  <button
    type="button"
    onclick={() => toggleCrafted(itemId)}
    class="inline-flex items-center gap-2 px-3 h-9 rounded-md border text-sm transition-colors {isCrafted
      ? 'bg-success/20 text-success border-success/40'
      : 'bg-surface text-text-dim border-border hover:border-border-strong hover:text-text'}"
    title={isCrafted ? "Retirer de l'inventaire" : "J'ai déjà cet item"}
  >
    <Icon name={isCrafted ? 'check' : 'plus'} size={15} />
    {isCrafted ? 'Possédé' : "J'ai"}
  </button>
</div>
