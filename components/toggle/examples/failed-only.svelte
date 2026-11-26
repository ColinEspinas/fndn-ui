<script lang="ts">
  import WarningCircle from "phosphor-svelte/lib/WarningCircleIcon";
  import { Toggle } from "@fndn/svelte";

  /* ghost: no fill at rest, for a filter that sits in a list header */
  let failedOnly = $state(false);
</script>

<div class="flex w-full max-w-80 items-center justify-between gap-3">
  <p class="text-sm font-medium text-ink">{failedOnly ? "3 failed deploys" : "48 deploys this week"}</p>
  <Toggle bind:pressed={failedOnly} variant="ghost" size="sm">
    {#snippet icon()}<WarningCircle data-slot="icon" weight="bold" />{/snippet}
    Failed only
  </Toggle>
</div>
