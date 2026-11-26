<script lang="ts">
  import { ThinkingState } from "@fndn/svelte";

  let expanded = $state(true);

  let selected = $state(1);

  const rows = [
    { primary: "Read", secondary: "src/booking/availability.test.ts", mono: true },
    {
      primary: "Edit",
      secondary: "src/booking/availability.ts",
      mono: true,
      add: 18,
      del: 6,
    },
    { primary: "Run", secondary: "pnpm test availability", mono: true },
  ];
</script>

<ThinkingState
  variant="coding"
  bind:expanded={expanded}
  bind:selected={selected}
  doneLabel="Ran 3 tools"
  rows={rows}
/>
