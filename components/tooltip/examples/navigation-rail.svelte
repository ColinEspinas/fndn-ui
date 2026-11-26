<script lang="ts">
  import ChartLine from "phosphor-svelte/lib/ChartLineIcon";
  import Gear from "phosphor-svelte/lib/GearIcon";
  import House from "phosphor-svelte/lib/HouseIcon";
  import RocketLaunch from "phosphor-svelte/lib/RocketLaunchIcon";
  import { Button, Tooltip } from "@fndn/svelte";

  const pages = [
    { label: "Overview", icon: House },
    { label: "Deploys", icon: RocketLaunch },
    { label: "Usage", icon: ChartLine },
    { label: "Settings", icon: Gear },
  ];
</script>

<!-- a collapsed rail has no visible labels: the tooltip names each page, to the side -->
<nav aria-label="Project" class="flex flex-col gap-0.5">
  {#each pages as page (page.label)}
    <Tooltip content={page.label} placement="right">
      {#snippet trigger(props)}
        <Button {...props()} variant="ghost" square aria-label={page.label}>
          {#snippet icon()}<page.icon data-slot="icon" weight="bold" />{/snippet}
        </Button>
      {/snippet}
    </Tooltip>
  {/each}
</nav>
