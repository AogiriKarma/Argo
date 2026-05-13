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
        <div class="px-5 pb-2 space-y-2">
          <button type="button" onclick={() => oauth('google')} disabled={busy} class="w-full h-10 inline-flex items-center justify-center gap-2 bg-bg border border-border hover:border-border-strong text-text-dim hover:text-text rounded-md text-sm transition-colors disabled:opacity-40">
            Continuer avec Google
          </button>
          <button type="button" onclick={() => oauth('discord')} disabled={busy} class="w-full h-10 inline-flex items-center justify-center gap-2 bg-bg border border-border hover:border-border-strong text-text-dim hover:text-text rounded-md text-sm transition-colors disabled:opacity-40">
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
