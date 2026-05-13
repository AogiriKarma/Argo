<script lang="ts">
  import { mobs, pnj, regions, quetes, resolveImg } from '$lib/data/store';
  import { gameToPixel, MAP_SIZE, FLOOR_NAMES, floorForPalier } from '$lib/map-utils';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  type LayerKey = 'pnj' | 'mob_boss' | 'mob_other' | 'quest' | 'region';

  const floor = $derived(Number($page.url.searchParams.get('floor') ?? '1') as 1 | 2 | 3);
  const underground = $derived($page.url.searchParams.get('ug') === '1');
  const enabledLayers = $derived(
    new Set<LayerKey>(
      ($page.url.searchParams.get('layers') ?? 'pnj,mob_boss,mob_other,quest,region').split(',') as LayerKey[]
    )
  );

  function setParam(key: string, value: string) {
    const u = new URL($page.url);
    if (value) u.searchParams.set(key, value);
    else u.searchParams.delete(key);
    goto(u.pathname + u.search, { replaceState: true, keepFocus: true, noScroll: true });
  }
  function toggleLayer(k: LayerKey) {
    const s = new Set(enabledLayers);
    if (s.has(k)) s.delete(k); else s.add(k);
    setParam('layers', [...s].join(','));
  }

  interface Marker {
    id: string;
    kind: LayerKey;
    name: string;
    x: number;
    y: number;
    href: string;
    color: string;
  }

  const markers = $derived.by<Marker[]>(() => {
    const out: Marker[] = [];
    const f = floor;

    if (enabledLayers.has('pnj')) {
      for (const p of $pnj) {
        if (floorForPalier(p.palier) !== f) continue;
        if (!!p.is_underground !== underground) continue;
        if (!p.coords || p.coords.x == null || p.coords.z == null) continue;
        const px = gameToPixel(f, p.coords.x, p.coords.z);
        if (!px) continue;
        out.push({ id: p.id, kind: 'pnj', name: p.name, x: px.x, y: px.y, href: `/pnj/${p.id}`, color: '#5fb4ff' });
      }
    }
    if (enabledLayers.has('mob_boss') || enabledLayers.has('mob_other')) {
      for (const m of $mobs) {
        if (floorForPalier(m.palier) !== f) continue;
        if (!!m.is_underground !== underground) continue;
        if (!m.coords || m.coords.x == null || m.coords.z == null) continue;
        const isBoss = m.type === 'boss' || m.type === 'mini_boss';
        if (isBoss && !enabledLayers.has('mob_boss')) continue;
        if (!isBoss && !enabledLayers.has('mob_other')) continue;
        const px = gameToPixel(f, m.coords.x, m.coords.z);
        if (!px) continue;
        out.push({
          id: m.id,
          kind: isBoss ? 'mob_boss' : 'mob_other',
          name: m.name,
          x: px.x,
          y: px.y,
          href: `/mobs/${m.id}`,
          color: isBoss ? '#ff5b6e' : '#ffb84a'
        });
      }
    }
    if (enabledLayers.has('quest')) {
      for (const q of $quetes) {
        if (floorForPalier(q.palier) !== f) continue;
        if (!!q.is_underground !== underground) continue;
        const c = (q as any).coords;
        if (!c || c.x == null || c.z == null) continue;
        const px = gameToPixel(f, c.x, c.z);
        if (!px) continue;
        out.push({ id: q.id, kind: 'quest', name: q.titre || q.name || q.id, x: px.x, y: px.y, href: `/quetes/${q.id}`, color: '#5fd6a4' });
      }
    }
    if (enabledLayers.has('region')) {
      for (const r of $regions) {
        if (floorForPalier(r.palier) !== f) continue;
        if (!!r.is_underground !== underground) continue;
        const c = (r as any).coords;
        if (!c || c.x == null || c.z == null) continue;
        const px = gameToPixel(f, c.x, c.z);
        if (!px) continue;
        out.push({ id: r.id, kind: 'region', name: r.name, x: px.x, y: px.y, href: `/regions/${r.id}`, color: '#c084fc' });
      }
    }
    return out;
  });

  const mapSrc = $derived(`/img/maps/floor-${floor}${underground ? '_underground' : ''}.webp`);

  // Pan & zoom (logical coords stay 0..MAP_SIZE; we just transform the wrapper)
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let dragging = $state(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let hoveredId = $state<string | null>(null);

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.5, Math.min(5, zoom * (1 + delta)));
    // Zoom toward cursor: simplified — just zoom centered for now
    zoom = newZoom;
  }
  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOriginX = panX;
    dragOriginY = panY;
  }
  function onMouseMove(e: MouseEvent) {
    if (!dragging) return;
    panX = dragOriginX + (e.clientX - dragStartX);
    panY = dragOriginY + (e.clientY - dragStartY);
  }
  function onMouseUp() { dragging = false; }
  function resetView() { zoom = 1; panX = 0; panY = 0; }

  const LAYERS: { k: LayerKey; label: string; color: string }[] = [
    { k: 'pnj',       label: 'PNJ',         color: '#5fb4ff' },
    { k: 'mob_boss',  label: 'Boss',        color: '#ff5b6e' },
    { k: 'mob_other', label: 'Créatures',   color: '#ffb84a' },
    { k: 'quest',     label: 'Quêtes',      color: '#5fd6a4' },
    { k: 'region',    label: 'Régions',     color: '#c084fc' }
  ];

  const counts = $derived.by(() => {
    const c: Record<LayerKey, number> = { pnj: 0, mob_boss: 0, mob_other: 0, quest: 0, region: 0 };
    for (const m of markers) c[m.kind]++;
    return c;
  });
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div class="max-w-[1480px] mx-auto px-6 py-6">
  <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Carte</h1>
      <p class="text-sm text-text-dim mt-1">{FLOOR_NAMES[floor]} {underground ? '— Sous-sol' : ''} · {markers.length} marqueurs</p>
    </div>
    <div class="flex items-center gap-2">
      {#each [1, 2, 3] as f}
        <button
          type="button"
          onclick={() => setParam('floor', String(f))}
          class="px-3 h-9 text-sm rounded-md border transition-colors {floor === f ? 'bg-accent text-bg border-accent' : 'bg-surface border-border text-text-dim hover:text-text'}"
        >
          Palier {f}
        </button>
      {/each}
      <button
        type="button"
        onclick={() => setParam('ug', underground ? '' : '1')}
        class="px-3 h-9 text-sm rounded-md border transition-colors {underground ? 'bg-warning/15 text-warning border-warning/40' : 'bg-surface border-border text-text-dim hover:text-text'}"
        title="Afficher la version souterraine de cet étage"
      >
        Sous-sol
      </button>
      <button type="button" onclick={resetView} class="px-3 h-9 text-sm rounded-md border border-border bg-surface text-text-dim hover:text-text" title="Réinitialiser zoom et position">↺</button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
    <!-- Layer sidebar -->
    <aside class="space-y-2">
      <div class="text-[11px] uppercase tracking-wider text-text-faint mb-1">Couches</div>
      {#each LAYERS as L (L.k)}
        {@const on = enabledLayers.has(L.k)}
        <label class="flex items-center gap-2.5 px-2 h-9 rounded cursor-pointer {on ? 'bg-surface' : 'opacity-60 hover:opacity-100 hover:bg-surface/60'}">
          <input type="checkbox" checked={on} onchange={() => toggleLayer(L.k)} class="sr-only" />
          <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:{L.color}"></span>
          <span class="text-sm {on ? 'text-text' : 'text-text-dim'} flex-1">{L.label}</span>
          <span class="text-xs text-text-faint num">{counts[L.k]}</span>
        </label>
      {/each}
      <div class="pt-2 mt-2 border-t border-border text-[11px] text-text-faint leading-relaxed">
        Cliquer-glisser pour déplacer la carte. Molette pour zoomer.
      </div>
    </aside>

    <!-- Map viewport -->
    <div
      class="relative bg-surface rounded-lg overflow-hidden select-none cursor-grab {dragging ? 'cursor-grabbing' : ''}"
      style="aspect-ratio:1"
      onwheel={onWheel}
      onmousedown={onMouseDown}
      role="presentation"
    >
      <div
        class="absolute inset-0 origin-center"
        style="transform: translate({panX}px, {panY}px) scale({zoom});"
      >
        <img
          src={mapSrc}
          alt="Carte palier {floor}"
          class="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable="false"
        />
        <!-- Markers in MAP_SIZE coords; absolute-positioned inside this transformed wrapper -->
        <svg
          class="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 {MAP_SIZE} {MAP_SIZE}"
          preserveAspectRatio="xMidYMid meet"
        >
          {#each markers as m (m.kind + m.id)}
            <a
              href={m.href}
              class="pointer-events-auto cursor-pointer"
              onmouseenter={() => (hoveredId = m.kind + m.id)}
              onmouseleave={() => (hoveredId = null)}
              data-sveltekit-noscroll
            >
              <circle
                cx={m.x}
                cy={m.y}
                r={hoveredId === m.kind + m.id ? 7 : 4}
                fill={m.color}
                stroke="#0c0f15"
                stroke-width="1.5"
                opacity={hoveredId === m.kind + m.id ? 1 : 0.85}
              />
            </a>
          {/each}
        </svg>
      </div>

      <!-- Hover tooltip -->
      {#if hoveredId}
        {@const m = markers.find((x) => x.kind + x.id === hoveredId)}
        {#if m}
          <div class="absolute top-3 left-3 px-3 py-1.5 bg-bg/95 border border-border rounded-md text-sm pointer-events-none">
            <span class="text-text">{m.name}</span>
          </div>
        {/if}
      {/if}

      <div class="absolute bottom-3 right-3 font-mono text-[11px] text-text-faint bg-bg/70 px-2 py-1 rounded pointer-events-none">
        zoom × {zoom.toFixed(2)}
      </div>
    </div>
  </div>
</div>
