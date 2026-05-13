<script lang="ts">
  import { page } from '$app/stores';
  import { itemById, mobs, resolveImg } from '$lib/data/store';
  import { RARITY_LABEL, CATEGORY_LABEL } from '$lib/types';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import Icon from '$lib/components/Icon.svelte';

  const id = $derived($page.params.id);
  const item = $derived($itemById.get(id));

  type Drop = { mobId: string; mobName: string; chance: number };
  const drops = $derived.by<Drop[]>(() => {
    const out: Drop[] = [];
    for (const m of $mobs) {
      const l = m.loot?.find((x) => x.id === id);
      if (l) out.push({ mobId: m.id, mobName: m.name, chance: l.chance });
    }
    return out.sort((a, b) => b.chance - a.chance);
  });

  let kills = $state(50);

  function pAtLeastOne(p: number, n: number): number {
    if (p <= 0 || n <= 0) return 0;
    return 1 - Math.pow(1 - p / 100, n);
  }
  function killsForConfidence(p: number, c: number): number {
    if (p <= 0 || c <= 0 || c >= 1) return Infinity;
    return Math.ceil(Math.log(1 - c) / Math.log(1 - p / 100));
  }
  function fmtPct(x: number): string {
    if (!isFinite(x)) return '∞';
    return (x * 100).toFixed(1) + '%';
  }
</script>

{#if !item}
  <div class="max-w-2xl mx-auto py-24 text-center">
    <h1 class="text-2xl font-semibold mb-2">Item introuvable</h1>
    <a href="/items" class="mt-6 inline-block text-accent hover:underline text-sm">← Items</a>
  </div>
{:else}
  <div class="max-w-[1100px] mx-auto px-6 py-10">
    <nav class="mb-8 text-sm text-text-dim flex items-center gap-2">
      <a href="/items" class="hover:text-text">Items</a>
      <span class="text-text-faint">/</span>
      <a href="/items/{item.id}" class="hover:text-text">{item.name}</a>
      <span class="text-text-faint">/</span>
      <span>Drops</span>
    </nav>

    <header class="mb-10 pb-8 border-b border-border flex items-center gap-6">
      <ItemImage src={resolveImg(item.images?.[0] ?? item.image)} cat={item.cat || item.category || ''} size={88} alt={item.name} />
      <div>
        <div class="text-sm text-text-dim mb-1">Calculateur de drop · {CATEGORY_LABEL[item.cat || item.category || ''] ?? (item.cat || item.category)}</div>
        <h1 class="text-3xl md:text-4xl font-semibold tracking-tight text-rarity-{item.rarity}">{item.name}</h1>
      </div>
    </header>

    {#if drops.length === 0}
      <div class="p-12 text-center bg-surface rounded-lg border border-border max-w-xl mx-auto">
        <p class="text-text-dim">Cet item n'a aucune source de drop référencée.</p>
      </div>
    {:else}
      <div class="mb-10 max-w-xl">
        <label class="block">
          <span class="text-sm text-text-dim mb-2 block">Nombre de kills à simuler</span>
          <input type="number" min="1" max="10000" bind:value={kills} class="w-32 h-10 px-3 bg-surface border border-border focus:border-accent outline-none rounded-md font-mono num" />
        </label>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <section>
          <h2 class="text-sm uppercase tracking-wider text-text-faint mb-4">Sources · {drops.length}</h2>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] uppercase tracking-wider text-text-faint">
                <th class="font-medium py-2 pr-3">Créature</th>
                <th class="font-medium py-2 px-3 text-right w-20">Chance</th>
                <th class="font-medium py-2 px-3 text-right w-32">P({kills} kills)</th>
                <th class="font-medium py-2 px-3 text-right w-32">Pour 90%</th>
                <th class="font-medium py-2 px-3 text-right w-32">Pour 99%</th>
              </tr>
            </thead>
            <tbody>
              {#each drops as d (d.mobId)}
                {@const p = pAtLeastOne(d.chance, kills)}
                <tr class="border-t border-border hover:bg-surface/50">
                  <td class="py-2 pr-3"><a href="/mobs/{d.mobId}" class="text-text hover:text-accent">{d.mobName}</a></td>
                  <td class="py-2 px-3 text-right font-mono num {d.chance >= 50 ? 'text-success' : d.chance >= 15 ? 'text-warning' : 'text-text-dim'}">{d.chance}%</td>
                  <td class="py-2 px-3 text-right font-mono num text-text">{fmtPct(p)}</td>
                  <td class="py-2 px-3 text-right font-mono num text-text-dim">{killsForConfidence(d.chance, 0.9)}</td>
                  <td class="py-2 px-3 text-right font-mono num text-text-dim">{killsForConfidence(d.chance, 0.99)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </section>

        <aside class="bg-surface rounded-lg p-5 self-start">
          <div class="text-xs uppercase tracking-wider text-text-faint mb-3 flex items-center gap-2">
            <Icon name="info" size={14} /> Formules
          </div>
          <p class="text-sm text-text-dim leading-relaxed mb-3">
            Probabilité d'obtenir au moins un drop sur <span class="font-mono num text-text">N</span> kills avec un taux de <span class="font-mono num text-text">p%</span> :
          </p>
          <code class="block bg-bg p-3 rounded font-mono text-xs text-accent mb-3">P = 1 − (1 − p/100)ᴺ</code>
          <p class="text-sm text-text-dim leading-relaxed">
            Nombre de kills pour une confiance <span class="font-mono num text-text">c</span> :
          </p>
          <code class="block bg-bg p-3 rounded font-mono text-xs text-accent mt-2">N = ⌈ ln(1−c) / ln(1−p/100) ⌉</code>
        </aside>
      </div>
    {/if}
  </div>
{/if}
