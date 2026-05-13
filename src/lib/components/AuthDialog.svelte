<script lang="ts">
  import {
    signInWithPassword, signUpWithPassword,
    signInWithOAuth, supabaseEnabled
  } from '$lib/stores/session';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
  }
  let { open = $bindable(), onClose }: Props = $props();

  let mode = $state<'signin' | 'signup'>('signin');
  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let info = $state<string | null>(null);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (busy) return;
    error = info = null;
    busy = true;
    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password);
        onClose();
      } else {
        await signUpWithPassword(email, password);
        info = 'Compte créé. Vérifie ta boîte mail pour confirmer l\'adresse.';
      }
    } catch (e: any) {
      error = e?.message || 'Erreur';
    } finally {
      busy = false;
    }
  }

  async function oauth(provider: 'google' | 'discord') {
    if (busy) return;
    error = null;
    busy = true;
    try { await signInWithOAuth(provider); }
    catch (e: any) { error = e?.message || 'Erreur'; busy = false; }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-[55] bg-bg/85 backdrop-blur-sm flex items-center justify-center p-4"
    onclick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      class="w-full max-w-sm bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="px-5 pt-5 pb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold tracking-tight">{mode === 'signin' ? 'Connexion' : 'Créer un compte'}</h2>
        <button type="button" onclick={onClose} class="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-surface-2 text-text-dim hover:text-text" aria-label="Fermer">
          <Icon name="close" size={16} />
        </button>
      </div>

      {#if !supabaseEnabled}
        <div class="px-5 pb-5 text-sm text-text-dim">
          Synchronisation cloud non configurée pour cette instance. Tes données restent en local.
        </div>
      {:else}
        <div class="px-5 pb-2">
          <button type="button" onclick={() => oauth('discord')} disabled={busy} class="w-full h-10 inline-flex items-center justify-center gap-2.5 bg-bg border border-border hover:border-border-strong text-text-dim hover:text-text rounded-md text-sm transition-colors disabled:opacity-40">
            <svg width="16" height="16" viewBox="0 0 71 55" aria-hidden="true">
              <path fill="#5865F2" d="M60.1 4.9A58.5 58.5 0 0 0 45.6.5c-.6 1.1-1.4 2.7-2 3.9a54 54 0 0 0-16.2 0c-.5-1.2-1.3-2.7-2-3.9a58.5 58.5 0 0 0-14.5 4.4C1.7 18.7-.8 32.1.4 45.3a59.7 59.7 0 0 0 17.9 9c1.4-2 2.7-4 3.8-6.3-2-.8-4-1.8-5.8-2.9.5-.4 1-.7 1.4-1.1a42 42 0 0 0 35.9 0c.5.4 1 .7 1.5 1.1-1.9 1.1-3.8 2-5.8 2.9a47 47 0 0 0 3.8 6.3 59 59 0 0 0 17.9-9c1.4-15.3-2.5-28.6-10.9-40.4ZM23.7 37.3c-3.6 0-6.6-3.3-6.6-7.4 0-4.1 2.9-7.4 6.6-7.4 3.7 0 6.7 3.3 6.6 7.4 0 4.1-3 7.4-6.6 7.4Zm24.4 0c-3.6 0-6.6-3.3-6.6-7.4 0-4.1 2.9-7.4 6.6-7.4 3.7 0 6.7 3.3 6.6 7.4 0 4.1-2.9 7.4-6.6 7.4Z"/>
            </svg>
            Continuer avec Discord
          </button>
        </div>

        <div class="px-5 py-3 flex items-center gap-3">
          <span class="flex-1 h-px bg-border"></span>
          <span class="text-[11px] uppercase tracking-wider text-text-faint">ou par email</span>
          <span class="flex-1 h-px bg-border"></span>
        </div>

        <form onsubmit={submit} class="px-5 pb-4 space-y-3">
          <div>
            <label for="auth-email" class="block text-[11px] uppercase tracking-wider text-text-faint mb-1">Email</label>
            <input
              id="auth-email"
              bind:value={email}
              type="email"
              required
              autocomplete="email"
              class="w-full h-10 px-3 bg-bg border border-border focus:border-border-strong outline-none rounded-md text-sm"
            />
          </div>
          <div>
            <label for="auth-password" class="block text-[11px] uppercase tracking-wider text-text-faint mb-1">Mot de passe</label>
            <input
              id="auth-password"
              bind:value={password}
              type="password"
              required
              minlength="6"
              autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
              class="w-full h-10 px-3 bg-bg border border-border focus:border-border-strong outline-none rounded-md text-sm"
            />
          </div>

          {#if error}
            <p class="text-xs text-danger">{error}</p>
          {/if}
          {#if info}
            <p class="text-xs text-success">{info}</p>
          {/if}

          <button type="submit" disabled={busy} class="w-full h-10 bg-accent text-bg rounded-md text-sm font-medium transition-opacity disabled:opacity-50">
            {busy ? '…' : (mode === 'signin' ? 'Se connecter' : 'Créer le compte')}
          </button>
        </form>

        <div class="px-5 pb-5 text-center text-xs text-text-dim">
          {#if mode === 'signin'}
            Pas de compte ? <button type="button" onclick={() => { mode = 'signup'; error = info = null; }} class="text-accent hover:underline">Créer un compte</button>
          {:else}
            Déjà un compte ? <button type="button" onclick={() => { mode = 'signin'; error = info = null; }} class="text-accent hover:underline">Se connecter</button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
