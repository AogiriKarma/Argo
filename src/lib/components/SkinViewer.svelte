<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    skinUrl: string;
    /** Faire tourner le perso automatiquement */
    autoRotate?: boolean;
  }
  let { skinUrl, autoRotate = true }: Props = $props();

  let canvas = $state<HTMLCanvasElement | null>(null);
  let viewer: any = null;
  let mod: any = null;

  async function setup() {
    if (!canvas) return;
    mod ??= await import('skinview3d');
    if (viewer) { viewer.dispose(); viewer = null; }
    viewer = new mod.SkinViewer({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      skin: skinUrl,
      animation: new mod.IdleAnimation(),
      enableControls: true
    });
    viewer.controls.enableZoom = false;
    viewer.controls.enablePan = false;
    viewer.autoRotate = autoRotate;
    viewer.autoRotateSpeed = 0.6;
    viewer.zoom = 0.8;
  }

  onMount(() => {
    setup();
  });

  // Re-load skin when the URL changes (no full re-mount)
  $effect(() => {
    if (viewer && skinUrl) viewer.loadSkin(skinUrl);
  });

  onDestroy(() => {
    if (viewer) { viewer.dispose(); viewer = null; }
  });

  function onResize() {
    if (viewer && canvas) viewer.setSize(canvas.clientWidth, canvas.clientHeight);
  }
</script>

<svelte:window onresize={onResize} />

<canvas bind:this={canvas} class="w-full h-full block"></canvas>
