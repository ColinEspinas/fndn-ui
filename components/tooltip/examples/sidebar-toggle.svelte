<script lang="ts">
  import SidebarSimple from "phosphor-svelte/lib/SidebarSimpleIcon";
  import { Button, Tooltip } from "@fndn/svelte";
</script>

<div class="flex items-center gap-2">
  <Tooltip content="Toggle sidebar" shortcut="⌘." placement="bottom-start">
    {#snippet trigger(props)}
      <Button {...props()} variant="ghost" size="sm" square aria-label="Toggle sidebar">
        {#snippet icon()}<SidebarSimple data-slot="icon" weight="bold" />{/snippet}
      </Button>
    {/snippet}
  </Tooltip>
  <span class="text-sm font-medium text-ink">Deploys</span>
</div>
