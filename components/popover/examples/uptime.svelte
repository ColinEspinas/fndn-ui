<script lang="ts">
  import Info from "phosphor-svelte/lib/InfoIcon";
  import { Button, Popover } from "@fndn/svelte";
</script>

<!-- a short explanation, no title or close button: Escape or a click outside closes it -->
<div class="flex items-center gap-1">
  <span class="text-sm text-ink-2">Uptime, last 30 days</span>
  <span class="text-sm font-medium text-ink">98.2%</span>
  <Popover closable={false} placement="top">
    {#snippet trigger(props)}
      <Button {...props()} variant="ghost" size="xs" square muted aria-label="How uptime is measured">
        {#snippet icon()}<Info data-slot="icon" weight="bold" />{/snippet}
      </Button>
    {/snippet}
    Checked every minute from Frankfurt, Virginia and Singapore. Planned maintenance on Nov 9 is not counted.
  </Popover>
</div>
