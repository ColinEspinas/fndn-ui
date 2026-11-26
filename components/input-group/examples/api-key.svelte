<script lang="ts">
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import { Button, InputGroup, Tooltip } from "@fndn/svelte";

  let copied = $state(false);
  const key = "nw_live_4f9a2c71e0b8d3";
</script>

<!-- a Button in an addon: ghost, xs, square, muted, named by its tooltip -->
{#snippet end()}
  <Tooltip content={copied ? "Copied" : "Copy"}>
    {#snippet trigger(props)}
      <Button
        {...props()}
        variant="ghost"
        size="xs"
        square
        muted
        aria-label="Copy API key"
        onclick={() => { void navigator.clipboard?.writeText(key); copied = true; }}
      >
        {#snippet icon()}<Copy data-slot="icon" weight="bold" />{/snippet}
      </Button>
    {/snippet}
  </Tooltip>
{/snippet}
<InputGroup readonly mono value={key} aria-label="API key" class="w-full max-w-80" {end} />
