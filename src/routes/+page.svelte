<script lang="ts">
  import { items, mobs, pnj, quetes } from '$lib/data/store';

  const sections = $derived([
    { href: '/items', label: 'Items', count: $items.length, desc: 'Armes, armures, accessoires, consommables, matériaux.' },
    { href: '/mobs', label: 'Bestiaire', count: $mobs.length, desc: 'Boss, mini-boss, monstres et sbires.' },
    { href: '/pnj', label: 'Personnages', count: $pnj.length, desc: 'Marchands, forgerons, donneurs de quêtes.' },
    { href: '/quetes', label: 'Quêtes', count: $quetes.length, desc: 'Principales, secondaires et tertiaires.' },
    { href: '/compare', label: 'Comparateur', count: '⇄', desc: "Comparer plusieurs items côte à côte sur leurs stats." },
    { href: '/me', label: 'Mon profil', count: '★', desc: 'Wishlist, items possédés, quêtes faites, notes personnelles.' }
  ]);
  const total = $derived($items.length + $mobs.length + $pnj.length + $quetes.length);
</script>

<div class="max-w-[1480px] mx-auto px-6 py-16 lg:py-24">
  <section class="max-w-2xl">
    <div class="text-[11px] uppercase tracking-[0.2em] text-text-faint mb-4">Argo</div>
    <h1 class="text-5xl md:text-6xl font-semibold tracking-tight text-text leading-[1.05]">
      Le codex complet du serveur.
    </h1>
    <p class="mt-6 text-lg text-text-dim leading-relaxed">
      Recherche, filtre et compare {total.toLocaleString('fr-FR')} entrées —
      items, créatures, personnages, régions et quêtes des Veilleurs au Clair de Lune.
    </p>
  </section>

  <section class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {#each sections as s (s.href)}
      <a
        href={s.href}
        class="group block p-5 rounded-lg bg-surface hover:bg-surface-2 border border-border hover:border-border-strong transition-colors"
      >
        <div class="flex items-baseline justify-between mb-3">
          <span class="text-[13px] uppercase tracking-wider text-text-faint">Section</span>
          <span class="text-2xl font-semibold text-text num">{s.count}</span>
        </div>
        <div class="text-xl font-semibold text-text group-hover:text-accent transition-colors">
          {s.label}
        </div>
        <p class="mt-1.5 text-sm text-text-dim leading-relaxed">{s.desc}</p>
      </a>
    {/each}
  </section>
</div>
