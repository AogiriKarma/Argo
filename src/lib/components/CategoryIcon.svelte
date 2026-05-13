<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    cat?: string;
    size?: number;
    class?: string;
  }
  let { cat = '', size = 16, class: cls = '' }: Props = $props();

  const MAP: Record<string, string> = {
    arme_p: 'weapon_p',
    arme_s: 'weapon_s',
    plastron: 'armor_p',
    casque: 'armor_h',
    gants: 'armor_g',
    bottes: 'armor_b',
    jambières: 'armor_p',
    anneau: 'ring',
    amulette: 'amulet',
    bracelet: 'bracelet',
    artefact: 'star',
    rune: 'rune',
    consommable: 'consumable',
    materiaux: 'material',
    ressources: 'material',
    quete: 'quest_item',
    accessoire: 'ring'
  };
  const iconName = $derived(MAP[cat] ?? 'codex');
</script>

<Icon name={iconName} {size} class={cls} />
