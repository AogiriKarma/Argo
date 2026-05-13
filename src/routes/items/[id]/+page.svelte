<script lang="ts">
  import { page } from '$app/stores';
  import ItemDetail from '$lib/components/details/ItemDetail.svelte';
</script>

<div class="max-w-[1100px] mx-auto px-6 py-10">
  <ItemDetail id={$page.params.id} />
</div>
