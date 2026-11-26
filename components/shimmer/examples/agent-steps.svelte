<script lang="ts">
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Sparkle from "phosphor-svelte/lib/SparkleIcon";
  import { Shimmer } from "@fndn/svelte";

  const done = ["Read the failing test in webhooks.test.ts", "Found the 10 s timeout in deliver()"];
</script>

<ol class="flex w-80 max-w-full flex-col gap-2 text-sm">
  {#each done as step (step)}
    <li class="flex items-center gap-2 text-ink-2">
      <Check data-slot="icon" weight="bold" class="shrink-0 text-green" aria-hidden="true" />
      {step}
    </li>
  {/each}
  <li class="flex items-center gap-2">
    <Sparkle data-slot="icon" weight="fill" class="shrink-0 text-accent" aria-hidden="true" />
    <Shimmer>Writing a retry with backoff…</Shimmer>
  </li>
</ol>
