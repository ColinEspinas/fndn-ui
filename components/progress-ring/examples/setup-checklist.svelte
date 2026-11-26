<script lang="ts">
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Circle from "phosphor-svelte/lib/CircleIcon";
  import { ProgressRing } from "@fndn/svelte";

  const steps = [
    { name: "Deploy to Production", done: true },
    { name: "Add a custom domain", done: false },
    { name: "Turn on usage alerts", done: false },
  ];
</script>

<div class="flex w-72 flex-col gap-3 text-sm">
  <div class="flex items-center gap-3">
    <ProgressRing progress={3 / 5} label="Setup: 3 of 5 steps done">3</ProgressRing>
    <div>
      <p class="font-medium text-ink">Set up web-app</p>
      <p class="text-ink-2">3 of 5 steps done</p>
    </div>
  </div>
  <ul class="flex flex-col gap-1.5">
    {#each steps as step (step.name)}
      <li class={`flex items-center gap-2 ${step.done ? "text-ink-2 line-through" : "text-ink"}`}>
        {#if step.done}
          <Check data-slot="icon" weight="bold" class="text-green" />
        {:else}
          <Circle data-slot="icon" class="text-ink-3" />
        {/if}
        {step.name}
      </li>
    {/each}
  </ul>
</div>
