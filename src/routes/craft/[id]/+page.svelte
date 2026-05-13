<script lang="ts">
  import { page } from '$app/stores';
  import { itemById, resolveImg } from '$lib/data/store';
  import ItemImage from '$lib/components/ItemImage.svelte';

  const rootId = $derived($page.params.id);
  const root = $derived($itemById.get(rootId));

  type Ing = { id: string; qty: number };

  // cols = in-game currency, not a material. We extract them separately.
  const COST_IDS = new Set(['cols']);
  function isCost(id: string): boolean { return COST_IDS.has(id); }

  function flatIngredients(craft: unknown): Ing[] {
    if (!Array.isArray(craft)) return [];
    if (!craft.length) return [];
    if (typeof craft[0] === 'object' && craft[0] && 'items' in (craft[0] as object)) {
      const all: Ing[] = [];
      for (const g of craft as { items: Ing[] }[]) all.push(...(g.items ?? []));
      return all;
    }
    return (craft as any[]).flatMap((x) =>
      x?.ingredients ? (x.ingredients as Ing[]) : x?.id ? [x as Ing] : []
    );
  }

  type Node = { id: string; qty: number; children: Node[]; costAtStep: number };

  function buildTree(id: string, qty: number, visited: Set<string>): Node {
    if (visited.has(id)) return { id, qty, children: [], costAtStep: 0 };
    visited = new Set(visited).add(id);
    const it = $itemById.get(id);
    const allIngs = flatIngredients(it?.craft);
    const costAtStep = allIngs
      .filter((i) => isCost(i.id))
      .reduce((s, i) => s + (i.qty ?? 0), 0) * qty;
    const materialIngs = allIngs.filter((i) => !isCost(i.id));
    return {
      id,
      qty,
      costAtStep,
      children: materialIngs.map((ing) => buildTree(ing.id, ing.qty * qty, visited))
    };
  }

  const tree = $derived(root ? buildTree(rootId, 1, new Set()) : null);

  function collectRaw(n: Node, acc: Map<string, number>) {
    if (n.children.length === 0) {
      acc.set(n.id, (acc.get(n.id) ?? 0) + n.qty);
    } else {
      for (const c of n.children) collectRaw(c, acc);
    }
  }
  const raw = $derived.by(() => {
    if (!tree) return [];
    const m = new Map<string, number>();
    for (const c of tree.children) collectRaw(c, m);
    return [...m.entries()]
      .map(([id, qty]) => ({ id, qty, item: $itemById.get(id) }))
      .sort((a, b) => b.qty - a.qty);
  });

  /** Sum of all cols paid across the entire crafting chain */
  function collectCols(n: Node): number {
    return n.costAtStep + n.children.reduce((s, c) => s + collectCols(c), 0);
  }
  const totalCols = $derived(tree ? collectCols(tree) : 0);

  const totalNodes = $derived.by(() => {
    if (!tree) return 0;
    let n = 0;
    const stack = [tree];
    while (stack.length) {
      const x = stack.pop()!;
      n++;
      stack.push(...x.children);
    }
    return n - 1;
  });
</script>

{#if !root}
  <div class="max-w-2xl mx-auto py-24 text-center">
    <h1 class="text-2xl font-semibold mb-2">Item introuvable</h1>
    <a href="/items" class="mt-6 inline-block text-accent hover:underline text-sm">← Items</a>
  </div>
{:else if !root.craft}
  <div class="max-w-2xl mx-auto py-24 text-center">
    <h1 class="text-2xl font-semibold mb-2">{root.name} n'a pas de recette de craft</h1>
    <a href="/items/{root.id}" class="mt-6 inline-block text-accent hover:underline text-sm">← Retour</a>
  </div>
{:else}
  <div class="max-w-[1100px] mx-auto px-6 py-10">
    <nav class="mb-8 text-sm text-text-dim flex items-center gap-2">
      <a href="/items" class="hover:text-text">Items</a>
      <span class="text-text-faint">/</span>
      <a href="/items/{root.id}" class="hover:text-text">{root.name}</a>
      <span class="text-text-faint">/</span>
      <span>Arbre de craft</span>
    </nav>

    <header class="mb-10 pb-8 border-b border-border flex items-center gap-6 flex-wrap">
      <ItemImage src={resolveImg(root.images?.[0] ?? root.image)} cat={root.cat || root.category || ''} size={88} alt={root.name} />
      <div class="flex-1 min-w-0">
        <div class="text-sm text-text-dim mb-1">Arbre de craft · {totalNodes} étape{totalNodes > 1 ? 's' : ''}</div>
        <h1 class="text-3xl md:text-4xl font-semibold tracking-tight text-rarity-{root.rarity}">{root.name}</h1>
      </div>
      {#if totalCols > 0}
        <div class="px-4 py-3 bg-surface rounded-lg border border-border">
          <div class="text-[11px] uppercase tracking-wider text-text-faint mb-1">Coût total</div>
          <div class="font-mono num text-warning text-xl">{totalCols.toLocaleString('fr-FR')} <span class="text-sm text-text-dim">cols</span></div>
        </div>
      {/if}
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
      <!-- Tree view -->
      <section>
        <h2 class="text-sm uppercase tracking-wider text-text-faint mb-4">Étapes de craft</h2>
        {#if tree}
          {#snippet branch(n: Node, depth: number)}
            {@const it = $itemById.get(n.id)}
            {@const img = it ? resolveImg(it.images?.[0] ?? it.image) : null}
            {@const isLeaf = n.children.length === 0}
            <div class="relative" style="padding-left: {depth * 20}px">
              <div class="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-surface/60">
                {#if depth > 0}
                  <span class="absolute left-0 top-0 bottom-0 w-px bg-border" style="left: {(depth - 1) * 20 + 10}px"></span>
                {/if}
                <ItemImage src={img} cat={it?.cat || it?.category || ''} size={32} alt={it?.name ?? n.id} />
                <a href="/items/{n.id}" class="text-sm truncate {it ? 'text-rarity-' + (it.rarity || 'commun') : 'text-text-dim'}">{it?.name ?? n.id}</a>
                <span class="font-mono num text-xs text-text-faint">×{n.qty}</span>
                {#if n.costAtStep > 0}
                  <span class="text-[10px] text-warning font-mono num" title="Coût pour cette étape">+{n.costAtStep} cols</span>
                {/if}
                {#if isLeaf}<span class="ml-auto text-[10px] uppercase tracking-wider text-text-faint">brut</span>{/if}
              </div>
              {#each n.children as c (c.id)}
                {@render branch(c, depth + 1)}
              {/each}
            </div>
          {/snippet}
          {@render branch(tree, 0)}
        {/if}
      </section>

      <aside class="self-start">
        <h2 class="text-sm uppercase tracking-wider text-text-faint mb-4">Matériaux bruts totaux</h2>
        <div class="space-y-1.5">
          {#each raw as r (r.id)}
            {@const img = r.item ? resolveImg(r.item.images?.[0] ?? r.item.image) : null}
            <a
              href={r.item ? `/items/${r.id}` : '#'}
              class="flex items-center gap-3 p-2 bg-surface hover:bg-surface-2 rounded-md transition-colors"
            >
              <ItemImage src={img} cat={r.item?.cat || r.item?.category || ''} size={32} alt={r.item?.name ?? r.id} />
              <span class="flex-1 truncate text-sm {r.item ? 'text-rarity-' + (r.item.rarity || 'commun') : 'text-text-dim'}">{r.item?.name ?? r.id}</span>
              <span class="font-mono num text-sm text-text">×{r.qty}</span>
            </a>
          {/each}
        </div>
      </aside>
    </div>
  </div>
{/if}
