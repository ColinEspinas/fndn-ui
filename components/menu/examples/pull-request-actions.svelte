<script lang="ts">
  import DotsThree from "phosphor-svelte/lib/DotsThreeIcon";
  import Tag from "phosphor-svelte/lib/TagIcon";
  import UserPlus from "phosphor-svelte/lib/UserPlusIcon";
  import X from "phosphor-svelte/lib/XIcon";
  import { Button, Menu, Tooltip, type MenuEntry } from "@fndn/svelte";

  const people: Record<string, string> = {
    priya: "Priya Raman",
    lucas: "Lucas Moreau",
    aiko: "Aiko Tanaka",
    sofia: "Sofia Alvarez",
  };

  /* a sub-menu keeps a second-level choice out of the first list */
  const items: MenuEntry[] = [
    {
      type: "submenu",
      label: "Request review",
      icon: UserPlus,
      items: Object.entries(people).map(([value, label]) => ({ value, label })),
    },
    {
      type: "submenu",
      label: "Add label",
      icon: Tag,
      items: [
        { value: "bug", label: "bug" },
        { value: "reliability", label: "reliability" },
        { value: "needs-docs", label: "needs-docs" },
      ],
    },
    { type: "separator" },
    { value: "close", label: "Close pull request", tone: "danger", icon: X },
  ];

  let reviewer = $state("");
</script>

<div class="flex w-80 items-center gap-3">
  <div class="flex min-w-0 flex-1 flex-col">
    <span class="text-sm font-medium text-ink">#482 Add retry to webhook delivery</span>
    <span class="text-xs text-ink-2">{reviewer ? `Review requested from ${reviewer}` : "Daniel Okafor wants to merge into main"}</span>
  </div>
  <Menu placement="bottom-end" {items} onselect={(value) => people[value] && (reviewer = people[value])}>
    {#snippet trigger(menuProps)}
      <Tooltip content="More actions" {...menuProps()}>
        {#snippet trigger(tipProps)}
          <Button {...tipProps()} variant="ghost" size="sm" square aria-label="More actions for #482">
            {#snippet icon()}<DotsThree data-slot="icon" weight="bold" />{/snippet}
          </Button>
        {/snippet}
      </Tooltip>
    {/snippet}
  </Menu>
</div>
