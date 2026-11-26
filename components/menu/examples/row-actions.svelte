<script lang="ts">
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import DotsThree from "phosphor-svelte/lib/DotsThreeIcon";
  import Folder from "phosphor-svelte/lib/FolderIcon";
  import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
  import Trash from "phosphor-svelte/lib/TrashIcon";
  import { Button, Menu, Tooltip, type MenuEntry } from "@fndn/svelte";

  const projects = [
    { name: "web-app", meta: "Deployed 2 min ago by Maya Chen" },
    { name: "billing-api", meta: "Deployed yesterday by Daniel Okafor" },
    { name: "data-pipeline", meta: "No deploys yet" },
  ];

  const actions: MenuEntry[] = [
    { value: "rename", label: "Rename", icon: PencilSimple },
    { value: "duplicate", label: "Duplicate", icon: Copy },
    { value: "move", label: "Move to…", icon: Folder },
    { type: "separator" },
    { value: "delete", label: "Delete", tone: "danger", icon: Trash },
  ];
</script>

<ul class="flex w-80 flex-col gap-1">
  {#each projects as project (project.name)}
    <li class="flex items-center gap-3">
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="text-sm font-medium text-ink">{project.name}</span>
        <span class="text-xs text-ink-2">{project.meta}</span>
      </div>
      <Menu placement="bottom-end" items={actions}>
        {#snippet trigger(menuProps)}
          <Tooltip content="More actions" {...menuProps()}>
            {#snippet trigger(tipProps)}
              <Button {...tipProps()} variant="ghost" size="sm" square aria-label={`More actions for ${project.name}`}>
                {#snippet icon()}<DotsThree data-slot="icon" weight="bold" />{/snippet}
              </Button>
            {/snippet}
          </Tooltip>
        {/snippet}
      </Menu>
    </li>
  {/each}
</ul>
