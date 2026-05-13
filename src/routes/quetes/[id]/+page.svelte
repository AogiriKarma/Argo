<script lang="ts">
  import { page } from '$app/stores';
  import QuestDetail from '$lib/components/details/QuestDetail.svelte';
</script>

<div class="max-w-[900px] mx-auto px-4 md:px-6 py-6 md:py-10">
  <QuestDetail id={$page.params.id} />
</div>
