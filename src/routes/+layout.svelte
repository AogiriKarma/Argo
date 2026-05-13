<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { ensureDump, loaded } from '$lib/data/store';
  import HudShell from '$lib/components/HudShell.svelte';
  import EntityModal from '$lib/components/EntityModal.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { tryInterceptLink } from '$lib/stores/modal';
  import { initCloudSync } from '$lib/data/cloud-sync';

  let { children } = $props();
  let error = $state<string | null>(null);

  onMount(() => {
    ensureDump().catch((e) => { error = String(e); });
    initCloudSync();

    // Global click interceptor (capture phase, before SvelteKit's link
    // navigation kicks in). Cmd/Ctrl/Shift-click keeps normal navigation.
    // Links with data-modal-skip bypass interception.
    function handleClick(e: MouseEvent) {
      const t = e.target as Element | null;
      if (t?.closest('[data-modal-skip]')) return;
      tryInterceptLink(e);
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  });
</script>

{#if error}
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="max-w-md p-6 bg-surface border border-danger/40 rounded-lg">
      <div class="text-danger text-sm font-medium mb-2">Erreur de chargement</div>
      <p class="text-text-dim text-sm font-mono">{error}</p>
    </div>
  </div>
{:else if !$loaded}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-text-faint text-sm">Chargement…</div>
  </div>
{:else}
  <HudShell>
    {@render children()}
  </HudShell>
  <EntityModal />
  <ConfirmDialog />
{/if}
