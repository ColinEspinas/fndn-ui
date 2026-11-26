<script lang="ts">
  import Trash from "phosphor-svelte/lib/TrashIcon";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { AlertDialog, Button, Tooltip } from "@fndn/svelte";

  const key = { name: "Production server", hint: "nw_live_…4f2a", lastUsed: "Used 3 min ago" };
</script>

<!-- your own trigger: the row's icon button, named by its tooltip; the dialog's trigger props and
     the tooltip's go on one Button (the tooltip finds it by its id) -->
{#snippet trigger(props: () => HTMLButtonAttributes)}
  <Tooltip content="Revoke key" triggerId={props().id ?? undefined}>
    {#snippet trigger(tip)}
      <Button {...tip()} {...props()} variant="ghost" size="sm" square muted aria-label={`Revoke ${key.name} key`}>
        {#snippet icon()}<Trash data-slot="icon" weight="bold" />{/snippet}
      </Button>
    {/snippet}
  </Tooltip>
{/snippet}
<div class="flex w-80 items-center gap-3">
  <div class="min-w-0 flex-1">
    <div class="text-sm font-medium text-ink">{key.name}</div>
    <div class="text-xs text-ink-2"><span class="font-mono">{key.hint}</span> · {key.lastUsed}</div>
  </div>
  <AlertDialog
    {trigger}
    title={`Revoke the ${key.name} key?`}
    description={`Apps that use ${key.hint} stop working at once. Create a new key before you revoke this one.`}
    actionLabel="Revoke key"
  />
</div>
