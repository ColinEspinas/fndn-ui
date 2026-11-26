<script lang="ts">
  import WarningCircle from "phosphor-svelte/lib/WarningCircleIcon";
  import { Button, Shimmer } from "@fndn/svelte";
</script>

<div class="flex w-80 max-w-full items-center gap-2 text-sm">
  <WarningCircle data-slot="icon" weight="fill" class="shrink-0 text-red" aria-hidden="true" />
  <span class="min-w-0 flex-1 text-ink-2">Build failed on main · a1b2c3d</span>
  <Button size="sm" variant="ghost">
    <Shimmer speed="fast" tone="accent">Suggest a fix</Shimmer>
  </Button>
</div>
