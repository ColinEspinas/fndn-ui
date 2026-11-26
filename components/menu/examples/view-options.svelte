<script lang="ts">
  import SlidersHorizontal from "phosphor-svelte/lib/SlidersHorizontalIcon";
  import { Button, Menu, type MenuEntry } from "@fndn/svelte";

  /* options keep their own state; pass onradiochange / oncheckedchange to store them */
  const items: MenuEntry[] = [
    {
      type: "radio-group",
      name: "sort",
      label: "Sort by",
      value: "deployed",
      items: [
        { value: "deployed", label: "Last deploy" },
        { value: "name", label: "Project name" },
        { value: "status", label: "Status" },
      ],
    },
    { type: "separator" },
    {
      type: "group",
      label: "Columns",
      items: [
        { type: "checkbox", value: "branch", label: "Branch", checked: true },
        { type: "checkbox", value: "author", label: "Deployed by", checked: true },
        { type: "checkbox", value: "duration", label: "Build time" },
      ],
    },
  ];
</script>

<Menu {items}>
  {#snippet trigger(props)}
    <Button {...props()} size="sm">
      {#snippet icon()}<SlidersHorizontal data-slot="icon" weight="bold" />{/snippet}
      View
    </Button>
  {/snippet}
</Menu>
