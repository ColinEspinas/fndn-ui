<script lang="ts">
  import { SegmentedControl } from "@fndn/svelte";

  /* chips: a filter row over a list, each with a status dot and a count */
  const states = [
    { value: "all", label: "All", count: 31 },
    { value: "open", label: "Open", dot: "green" as const, count: 12 },
    { value: "draft", label: "Draft", dot: true as const, count: 4 },
    { value: "merged", label: "Merged", dot: "purple" as const, count: 15 },
  ];

  let status = $state("open");
</script>

<SegmentedControl bind:value={status} variant="chips" options={states} aria-label="Pull requests by status" />
