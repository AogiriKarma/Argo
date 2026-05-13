<script lang="ts">
  import { sessionUser, signOut, supabaseEnabled } from '$lib/stores/session';
  import { syncStatus } from '$lib/data/cloud-sync';
  import AuthDialog from './AuthDialog.svelte';
  import Icon from './Icon.svelte';

  let open = $state(false);
  let menuOpen = $state(false);

  // Prefer provider-supplied display name (Discord username, Google name…)
  // over the email. Fall back to email then '?'.
  const displayName = $derived.by(() => {
    const u = $sessionUser;
    if (!u) return '';
    const md = u.user_metadata ?? {};
    return (
      md.global_name ||
      md.full_name ||
      md.name ||
      md.preferred_username ||
      md.user_name ||
      u.email ||
      ''
    );
  });
  const avatarUrl = $derived($sessionUser?.user_metadata?.avatar_url as string | undefined);
  const initial = $derived((displayName || '?')[0].toUpperCase());
  const statusLabel = $derived.by(() => {
    switch ($syncStatus) {
      case 'pulling': return 'Chargement…';
      case 'pushing': return 'Synchro…';
      case 'synced':  return 'Synchronisé';
      case 'offline': return 'Hors-ligne';
      case 'error':   return 'Erreur sync';
      default:        return '';
    }
  });
</script>

{#if !supabaseEnabled}
  <!-- Sync non configurée — pas de chip -->
{:else if $sessionUser}
  <div class="relative">
    <button
      type="button"
      onclick={() => (menuOpen = !menuOpen)}
      class="inline-flex items-center gap-2 h-9 pl-1 pr-3 rounded-md border border-border bg-surface text-text-dim hover:text-text hover:border-border-strong text-sm transition-colors"
      title={displayName}
    >
      {#if avatarUrl}
        <img src={avatarUrl} alt={displayName} class="w-7 h-7 rounded object-cover" referrerpolicy="no-referrer" />
      {:else}
        <span class="inline-flex items-center justify-center w-7 h-7 rounded bg-accent/15 text-accent text-[12px] font-semibold">{initial}</span>
      {/if}
      <span class="hidden md:inline truncate max-w-[140px]">{displayName}</span>
    </button>

    {#if menuOpen}
      <div role="presentation" class="fixed inset-0 z-40" onclick={() => (menuOpen = false)}></div>
      <div class="absolute right-0 z-50 mt-1 w-64 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden" role="dialog">
        <div class="px-4 py-3 border-b border-border flex items-center gap-3">
          {#if avatarUrl}
            <img src={avatarUrl} alt={displayName} class="w-10 h-10 rounded-full object-cover shrink-0" referrerpolicy="no-referrer" />
          {:else}
            <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/15 text-accent text-base font-semibold shrink-0">{initial}</span>
          {/if}
          <div class="min-w-0">
            <div class="text-sm text-text truncate">{displayName}</div>
            {#if $sessionUser.email && $sessionUser.email !== displayName}
              <div class="text-[11px] text-text-faint truncate">{$sessionUser.email}</div>
            {/if}
          </div>
        </div>
        {#if statusLabel}
          <div class="px-4 py-2 text-xs flex items-center gap-2 {$syncStatus === 'error' ? 'text-danger' : $syncStatus === 'offline' ? 'text-warning' : 'text-success'}">
            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
            {statusLabel}
          </div>
        {/if}
        <button type="button" onclick={async () => { await signOut(); menuOpen = false; }} class="w-full text-left px-4 py-2.5 text-sm text-text-dim hover:text-text hover:bg-surface-2 transition-colors">
          Se déconnecter
        </button>
      </div>
    {/if}
  </div>
{:else}
  <button
    type="button"
    onclick={() => (open = true)}
    class="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-surface text-text-dim hover:text-text hover:border-border-strong text-sm transition-colors"
  >
    <Icon name="plus" size={14} />
    <span class="hidden md:inline">Connexion</span>
  </button>
{/if}

<AuthDialog bind:open onClose={() => (open = false)} />
