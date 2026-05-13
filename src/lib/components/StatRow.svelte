<script lang="ts">
  import { STAT_LABEL, STAT_UNIT } from '$lib/types';

  type StatValue = number | [number, number] | { min: number; max: number };

  interface Props {
    stat: string;
    value: StatValue;
  }
  let { stat, value }: Props = $props();

  const label = $derived(STAT_LABEL[stat] ?? stat);
  const unit = $derived(STAT_UNIT[stat] ?? '%');

  // Normalize {min,max} or [a,b] into a tuple; pass through scalar numbers.
  function toRange(v: StatValue): number | [number, number] {
    if (Array.isArray(v)) return v as [number, number];
    if (v && typeof v === 'object' && 'min' in v && 'max' in v) {
      return [v.min, v.max];
    }
    return v as number;
  }

  function fmt(v: StatValue, u: string): string {
    const n = toRange(v);
    if (Array.isArray(n)) {
      if (n[0] === n[1]) return `${n[0] > 0 ? '+' : ''}${n[0]}${u}`;
      return `${n[0]} – ${n[1]}${u}`;
    }
    const sign = n > 0 ? '+' : '';
    return `${sign}${n}${u}`;
  }

  const positive = $derived.by(() => {
    const n = toRange(value);
    return Array.isArray(n) ? n[1] > 0 : n > 0;
  });
</script>

<div class="flex items-baseline justify-between gap-4 py-2 border-b border-border/60 last:border-b-0">
  <span class="text-text-dim text-sm">{label}</span>
  <span class="font-mono text-[13px] num {positive ? 'text-text' : 'text-danger'}">{fmt(value, unit)}</span>
</div>
