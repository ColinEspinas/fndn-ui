<script lang="ts">
  import { StatusPill } from "@fndn/svelte";

  /* a neutral pill whose dot alone carries the colour: a category, not a state */
  const environments = [
    { name: "Production", dot: "green" },
    { name: "Staging", dot: "yellow" },
    { name: "Preview", dot: "purple" },
  ] as const;
</script>

<div class="flex flex-wrap gap-2">
  {#each environments as env (env.name)}
    <StatusPill tone="neutral" dotTone={env.dot}>{env.name}</StatusPill>
  {/each}
</div>
