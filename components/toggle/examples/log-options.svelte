<script lang="ts">
  import ArrowDown from "phosphor-svelte/lib/ArrowDownIcon";
  import Clock from "phosphor-svelte/lib/ClockIcon";
  import TextAlignLeft from "phosphor-svelte/lib/TextAlignLeftIcon";
  import { Toggle } from "@fndn/svelte";
</script>

<!-- icon-only toggles: ghost, muted and square; the tooltip names each one -->
<div class="flex items-center gap-3">
  <span class="text-sm text-ink-2">Build log · dpl_7f3a9c</span>
  <div role="toolbar" aria-label="Log options" class="flex items-center gap-0.5">
    <Toggle variant="ghost" size="sm" square muted tooltip="Show timestamps" pressed>
      {#snippet icon()}<Clock data-slot="icon" weight="bold" />{/snippet}
    </Toggle>
    <Toggle variant="ghost" size="sm" square muted tooltip="Wrap long lines">
      {#snippet icon()}<TextAlignLeft data-slot="icon" weight="bold" />{/snippet}
    </Toggle>
    <Toggle variant="ghost" size="sm" square muted tooltip="Follow new output" pressed>
      {#snippet icon()}<ArrowDown data-slot="icon" weight="bold" />{/snippet}
    </Toggle>
  </div>
</div>
