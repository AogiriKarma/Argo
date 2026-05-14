<script lang="ts">
  import { onDestroy } from 'svelte';

  interface Props {
    skinUrl: string;
    autoRotate?: boolean;
  }
  let { skinUrl, autoRotate = true }: Props = $props();

  let canvas = $state<HTMLCanvasElement | null>(null);
  let viewer: any = null;
  let modPromise: Promise<any> | null = null;

  function getMod() {
    modPromise ??= import('skinview3d');
    return modPromise;
  }

  async function ensureViewer() {
    if (!canvas) return null;
    const mod = await getMod();
    if (!viewer) {
      viewer = new mod.SkinViewer({
        canvas,
        width: canvas.clientWidth || 280,
        height: canvas.clientHeight || 280,
        animation: new mod.IdleAnimation(),
        enableControls: true
      });
      viewer.controls.enableZoom = false;
      viewer.controls.enablePan = false;
      viewer.autoRotate = autoRotate;
      viewer.autoRotateSpeed = 0.6;
      viewer.zoom = 0.8;
    }
    return viewer;
  }

  // Charge le skin dès que l'URL change OU que le canvas est dispo
  $effect(() => {
    const url = skinUrl;
    if (!canvas || !url) return;
    let cancelled = false;
    (async () => {
      const v = await ensureViewer();
      if (cancelled || !v) return;
      try { await v.loadSkin(url); } catch (e) { console.error('[SkinViewer] loadSkin failed', e); }
    })();
    return () => { cancelled = true; };
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
