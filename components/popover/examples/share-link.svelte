<script lang="ts">
  import ShareNetwork from "phosphor-svelte/lib/ShareNetworkIcon";
  import { Button, Clipboard, Popover } from "@fndn/svelte";

  const previewUrl = "https://web-app-git-feat-usage-alerts.northwind.example";
</script>

<div class="flex w-80 items-center justify-between gap-3">
  <div class="flex min-w-0 flex-col">
    <span class="text-sm font-medium text-ink">feat/usage-alerts</span>
    <span class="text-xs text-ink-2">Preview deployed 4 min ago</span>
  </div>
  <Popover
    placement="bottom-end"
    title="Share preview"
    description="Anyone in Northwind with the link can open this preview."
  >
    {#snippet trigger(props)}
      <Button {...props()} size="sm">
        {#snippet icon()}<ShareNetwork data-slot="icon" weight="bold" />{/snippet}
        Share
      </Button>
    {/snippet}
    <Clipboard variant="field" value={previewUrl} aria-label="Preview link" />
  </Popover>
</div>
