<script lang="ts">
  import { Button, Tag } from "@fndn/svelte";

  const initial = ["Status: Failed", "Branch: main", "Project: billing-api"];
  let filters = $state(initial);
</script>

<div class="flex w-80 flex-wrap items-center gap-1.5 text-sm">
  {#each filters as filter (filter)}
    <Tag removable removeLabel={`Remove ${filter}`} onremove={() => (filters = filters.filter((f) => f !== filter))}>
      {filter}
    </Tag>
  {/each}
  {#if filters.length}
    <Button size="xs" variant="ghost" onclick={() => (filters = [])}>Clear all</Button>
  {:else}
    <Button size="xs" variant="ghost" onclick={() => (filters = initial)}>Restore filters</Button>
  {/if}
</div>
