<script lang="ts">
  import { page } from '$app/stores';
  import QuestDetail from '$lib/components/details/QuestDetail.svelte';
</script>

<div class="max-w-[900px] mx-auto px-6 py-10">
  <QuestDetail id={$page.params.id} />
</div>
