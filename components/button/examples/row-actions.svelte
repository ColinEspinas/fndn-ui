<script lang="ts">
  import DotsThree from "phosphor-svelte/lib/DotsThreeIcon";
  import LinkSimple from "phosphor-svelte/lib/LinkSimpleIcon";
  import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
  import { Button, Tooltip } from "@fndn/svelte";

  /* icon-only buttons: ghost and muted, square, each named by aria-label and its tooltip */
  const actions = [
    { label: "Edit title", Icon: PencilSimple },
    { label: "Copy link", Icon: LinkSimple },
    { label: "More actions", Icon: DotsThree },
  ];
</script>

<div class="flex w-80 items-center justify-between gap-3">
  <p class="min-w-0 text-sm text-ink">#482 Add retry to webhook delivery</p>
  <div role="toolbar" aria-label="Pull request actions" class="flex shrink-0 gap-0.5">
    {#each actions as { label, Icon } (label)}
      <Tooltip content={label}>
        {#snippet trigger(props)}
          <Button {...props()} variant="ghost" size="sm" square muted aria-label={label}>
            {#snippet icon()}<Icon data-slot="icon" weight="bold" />{/snippet}
          </Button>
        {/snippet}
      </Tooltip>
    {/each}
  </div>
</div>
