<script lang="ts">
  import Columns from "phosphor-svelte/lib/ColumnsIcon";
  import ListBullets from "phosphor-svelte/lib/ListBulletsIcon";
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import { Button, SegmentedControl } from "@fndn/svelte";

  /* sm (28px) beside an sm Button: one control height across the toolbar */
  const views = [
    { value: "list", label: "List" },
    { value: "board", label: "Board" },
  ];
  let view = $state("board");
</script>

<div class="flex w-80 items-center justify-between gap-3">
  <SegmentedControl bind:value={view} size="sm" options={views} aria-label="View">
    {#snippet icon({ option })}
      {#if option.value === "list"}<ListBullets data-slot="icon" weight="bold" />
      {:else}<Columns data-slot="icon" weight="bold" />{/if}
    {/snippet}
  </SegmentedControl>
  <Button variant="primary" size="sm">
    {#snippet icon()}<Plus data-slot="icon" weight="bold" />{/snippet}
    New project
  </Button>
</div>
