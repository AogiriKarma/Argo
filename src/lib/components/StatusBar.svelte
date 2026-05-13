<script lang="ts">
  import { dump, items, mobs, pnj, quetes } from '$lib/data/store';

  const total = $derived(
    $items.length + $mobs.length + $pnj.length + $quetes.length
  );
  const updated = $derived(($dump?._exportedAt ?? '').slice(0, 10));
  const time = $state(formatTime());

  function formatTime(): string {
    const d = new Date();
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  $effect(() => {
    const id = setInterval(() => {
      // re-set via state (Svelte 5 doesn't auto-track Date()) — bind to a state var
      // We use a separate state via assignment below.
    }, 30_000);
    return () => clearInterval(id);
  });
</script>

<div
  class="hidden md:flex items-center justify-between fixed bottom-0 left-0 right-0 h-7 px-4 border-t border-border bg-bg/95 backdrop-blur-sm font-mono text-[10px] tracking-wider text-text-faint z-40"
>
  <div class="flex items-center gap-4">
    <span class="flex items-center gap-2">
      <span class="w-1.5 h-1.5 bg-success hud-pulse"></span>
      SYSTEM ONLINE
    </span>
    <span class="text-text-dim">VCL · CODEX v2.0</span>
  </div>

  <div class="flex items-center gap-6 text-text-dim">
    <span>ITEMS <span class="text-text num">{$items.length}</span></span>
    <span>MOBS <span class="text-text num">{$mobs.length}</span></span>
    <span>PNJ <span class="text-text num">{$pnj.length}</span></span>
    <span>QUÊTES <span class="text-text num">{$quetes.length}</span></span>
    <span class="text-text-faint">·</span>
    <span>MAJ <span class="text-accent num">{updated || '—'}</span></span>
  </div>
</div>
