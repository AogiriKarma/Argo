<script lang="ts">
  interface Props {
    name: string;
    size?: number;
    class?: string;
    stroke?: number;
  }
  let { name, size = 16, class: cls = '', stroke = 1.75 }: Props = $props();

  const PATHS: Record<string, string> = {
    // Navigation / sections
    codex: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 0v13a3 3 0 0 0 3 3M9 9h6M9 13h4',
    bestiary: 'M5 17c1-4 3-6 7-6s6 2 7 6M9 10V6m6 4V6M7 4l2 3m8-3-2 3M6 21h12',
    map: 'M3 6 9 4l6 2 6-2v14l-6 2-6-2-6 2V6Zm6-2v16m6-14v16',
    atlas: 'M4 5v15h16V5M4 5h16M9 5v15m6-15v15',
    quest: 'M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h6m-6 4h6m-6-8h3',
    // Items
    weapon_p: 'M14 4 4 14l3 3 1-1 2 2 1-1 2 2 8-8-7-7Zm0 0 6 6m-9 3 4 4',
    weapon_s: 'M5 5l6 6M5 5 4 9l3 3 4-1M19 19l-6-6M19 19l1-4-3-3-4 1',
    armor_p: 'M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6l-8-3Z',
    armor_h: 'M5 12c0-4 3-7 7-7s7 3 7 7v6c0 1-1 2-2 2H7c-1 0-2-1-2-2v-6Zm0 4h14',
    armor_g: 'M6 6h12v8l-2 2v4H8v-4l-2-2V6Zm0 0v2m12-2v2M9 14v-3m3 3v-3m3 3v-3',
    armor_b: 'M7 4h5l1 2v8c0 2 1 4 3 4v6H7v-3l-1-1V8l1-2V4Zm10 14h-2',
    ring: 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 0V3l3 3-3 0Z',
    amulet: 'M7 4h10l-1 4-2 1v3a3 3 0 1 1-4 0V9L8 8 7 4Zm5 8v6',
    bracelet: 'M6 8c0-2 3-4 6-4s6 2 6 4-3 4-6 4-6-2-6-4Zm0 8c0-2 3-4 6-4s6 2 6 4-3 4-6 4-6-2-6-4Zm6-8v8',
    rune: 'M12 3 3 12l9 9 9-9-9-9Zm0 6v6m-3-3h6',
    consumable: 'M9 3h6v3l2 2v11H7V8l2-2V3Zm0 3h6m-5 7c1-1 4-1 4 1s-3 1-3 3 3 2 3 3',
    material: 'M12 4 4 9v6l8 5 8-5V9l-8-5Zm0 0v16m-8-11 16 0',
    quest_item: 'M12 4l8 8-8 8-8-8 8-8Zm0 5v6m-3-3h6',
    // UI
    search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm5 12 4 4',
    close: 'M5 5l14 14M19 5 5 19',
    chevron_right: 'M9 5l7 7-7 7',
    chevron_down: 'M5 9l7 7 7-7',
    star_outline: 'M12 4l2.5 5 5.5.7-4 4 1 5.5-5-2.7-5 2.7 1-5.5-4-4 5.5-.7L12 4Z',
    star_filled: 'M12 4l2.5 5 5.5.7-4 4 1 5.5-5-2.7-5 2.7 1-5.5-4-4 5.5-.7L12 4Z',
    bookmark_outline: 'M6 3h12v18l-6-4-6 4V3Z',
    bookmark_filled: 'M6 3h12v18l-6-4-6 4V3Z',
    compare: 'M9 4v16M15 4v16M3 8l6-4M21 16l-6 4',
    filter: 'M4 5h16l-6 8v6l-4-2v-4L4 5Z',
    user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm-8 16c0-4 4-6 8-6s8 2 8 6',
    moon: 'M19 14a8 8 0 1 1-8-11c0 4 4 8 8 8a8 8 0 0 1 0 3Z',
    coords: 'M12 4v16M4 12h16M12 8l-4 4 4 4 4-4-4-4Z',
    arrow_right: 'M5 12h14m-5-5 5 5-5 5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    check: 'M5 12l5 5L20 7',
    grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
    list: 'M4 6h16M4 12h16M4 18h16',
    info: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 7v6m0-9v.01',
    drop: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z',
    tree: 'M12 3v18M12 6h-4l-2 2m6 0h4l2 2M12 12h-6l-2 2m8 0h6l2 2',
    settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-5v3m0 14v3M5 12H2m20 0h-3M5.6 5.6 7.7 7.7m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1',
    chevron_up: 'M5 15l7-7 7 7',
    note: 'M5 3h11l3 3v15H5V3Zm11 0v3h3M9 11h6m-6 4h4',
    trash: 'M5 6h14m-2 0v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2'
  };

  const path = $derived(PATHS[name] ?? '');
</script>

{#if path}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width={stroke}
    stroke-linecap="round"
    stroke-linejoin="round"
    width={size}
    height={size}
    class={cls}
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
{/if}
