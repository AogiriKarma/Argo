<script lang="ts">
  /**
   * Lore text parser — handles the [id|Label][qty] cross-reference syntax
   * found in items.obtain / mobs.lore / quetes.desc etc.
   *
   * Supported forms:
   *   [araignee_volante|Araignée Volante]        → link, qty optional
   *   [araignee_volante|Araignée Volante][10]    → link with quantity badge
   *   Bare URLs not handled — content is plain otherwise.
   */
  import { itemById, mobById, pnjById, regionById, questById } from '$lib/data/store';

  interface Props {
    text?: string | null;
    class?: string;
  }
  let { text = '', class: cls = '' }: Props = $props();

  type Token =
    | { kind: 'text'; v: string }
    | { kind: 'ref'; id: string; label: string; qty?: number }
    | { kind: 'br' };

  function parse(input: unknown): Token[] {
    const s = typeof input === 'string' ? input : String(input ?? '');
    const out: Token[] = [];
    // Match [prefix:id|label][qty?] or [id|label][qty?]
    const re = /\[(?:[a-z]+:)?([a-z0-9_]+)\|([^\]]+)\](?:\[(\d+)\])?/gi;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      if (m.index > last) pushText(out, s.slice(last, m.index));
      out.push({
        kind: 'ref',
        id: m[1],
        label: m[2],
        qty: m[3] ? Number(m[3]) : undefined
      });
      last = re.lastIndex;
    }
    if (last < s.length) pushText(out, s.slice(last));
    return out;
  }

  function pushText(out: Token[], chunk: string) {
    const parts = String(chunk).split('\n');
    parts.forEach((p, i) => {
      if (p) out.push({ kind: 'text', v: p });
      if (i < parts.length - 1) out.push({ kind: 'br' });
    });
  }

  function resolve(
    id: string,
    items: Map<string, unknown>,
    mobs: Map<string, unknown>,
    pnj: Map<string, unknown>,
    regions: Map<string, unknown>,
    quests: Map<string, unknown>
  ): { kind: string; href: string } | null {
    if (items.has(id)) return { kind: 'item', href: `/items/${id}` };
    if (mobs.has(id)) return { kind: 'mob', href: `/mobs/${id}` };
    if (pnj.has(id)) return { kind: 'pnj', href: `/pnj/${id}` };
    if (regions.has(id)) return { kind: 'region', href: `/regions/${id}` };
    if (quests.has(id)) return { kind: 'quest', href: `/quetes/${id}` };
    return null;
  }

  const tokens = $derived(parse(text ?? ''));
</script>

<div class="lore {cls}">
  {#each tokens as t, i (i)}
    {#if t.kind === 'text'}
      <span>{t.v}</span>
    {:else if t.kind === 'br'}
      <br />
    {:else if t.kind === 'ref'}
      {@const ref = resolve(t.id, $itemById, $mobById, $pnjById, $regionById, $questById)}
      {#if ref}
        <a
          href={ref.href}
          class="text-accent hover:underline decoration-dotted underline-offset-2 inline-flex items-baseline gap-1"
        >
          <span>{t.label}</span>
          {#if t.qty}<span class="font-mono text-[11px] text-text-dim">×{t.qty}</span>{/if}
        </a>
      {:else}
        <span class="text-text-dim">
          {t.label}{#if t.qty}<span class="font-mono text-[11px]">×{t.qty}</span>{/if}
        </span>
      {/if}
    {/if}
  {/each}
</div>

<style>
  .lore {
    line-height: 1.6;
  }
</style>
