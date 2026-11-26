<script lang="ts">
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import { Button, ButtonGroup, Menu, Tooltip } from "@fndn/svelte";

  /* a split button: the common action, and a menu of the other ways to do it */
  const ways = [
    { value: "squash", label: "Squash and merge" },
    { value: "rebase", label: "Rebase and merge" },
  ];
</script>

<ButtonGroup label="Merge #482">
  <Button variant="primary">Merge pull request</Button>
  <Menu placement="bottom-end" items={ways}>
    {#snippet trigger(menuProps)}
      <Tooltip content="More ways to merge" {...menuProps()}>
        {#snippet trigger(tipProps)}
          <Button {...tipProps()} variant="primary" square aria-label="More ways to merge">
            {#snippet icon()}<CaretDown data-slot="icon" weight="bold" />{/snippet}
          </Button>
        {/snippet}
      </Tooltip>
    {/snippet}
  </Menu>
</ButtonGroup>
