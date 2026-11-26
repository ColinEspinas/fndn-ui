<script lang="ts">
  import ArrowClockwise from "phosphor-svelte/lib/ArrowClockwiseIcon";
  import ArrowCounterClockwise from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";
  import { Button, ButtonGroup, Tooltip } from "@fndn/svelte";
</script>

<!-- icon-only and joined: each button named by aria-label and its tooltip -->
<ButtonGroup label="History">
  <Tooltip content="Undo">
    {#snippet trigger(props)}
      <Button {...props()} size="sm" shape="rounded" square aria-label="Undo">
        {#snippet icon()}<ArrowCounterClockwise data-slot="icon" weight="bold" />{/snippet}
      </Button>
    {/snippet}
  </Tooltip>
  <Tooltip content="Redo">
    {#snippet trigger(props)}
      <Button {...props()} size="sm" shape="rounded" square aria-label="Redo" disabled>
        {#snippet icon()}<ArrowClockwise data-slot="icon" weight="bold" />{/snippet}
      </Button>
    {/snippet}
  </Tooltip>
</ButtonGroup>
