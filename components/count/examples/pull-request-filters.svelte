<script lang="ts">
  import { Button, Count } from "@fndn/svelte";

  const filters = [
    { value: "open", label: "Open", count: "28" },
    { value: "merged", label: "Merged", count: "1,204" },
    { value: "closed", label: "Closed", count: "96" },
  ];
  let filter = $state("open");
</script>

<!-- inside a pressed control the count takes the selected look by itself -->
<div class="flex gap-1">
  {#each filters as f (f.value)}
    <Button size="sm" variant={filter === f.value ? "outline" : "ghost"} aria-pressed={filter === f.value} onclick={() => (filter = f.value)}>
      {f.label} <Count variant="boxed">{f.count}</Count>
    </Button>
  {/each}
</div>
