<script lang="ts">
  import Folder from "phosphor-svelte/lib/FolderIcon";
  import GitBranch from "phosphor-svelte/lib/GitBranchIcon";
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import Terminal from "phosphor-svelte/lib/TerminalIcon";
  import { Toggle } from "@fndn/svelte";

  const views = [
    { value: "explorer", label: "Explorer", Icon: Folder },
    { value: "search", label: "Search", Icon: MagnifyingGlass },
    { value: "source-control", label: "Source control", Icon: GitBranch },
    { value: "terminal", label: "Terminal", Icon: Terminal },
  ];

  let view = $state<string | null>("explorer");
</script>

<!-- an editor's activity bar: ink toggles, never a grey box. The open view is in ink with a bar at the
     inline start; pressing it again closes the side bar -->
<div role="toolbar" aria-orientation="vertical" aria-label="Views" class="flex w-11 flex-col items-center gap-1 rounded-card bg-canvas py-1.5">
  {#each views as { value, label, Icon } (value)}
    <Toggle
      variant="ink"
      indicator="start"
      size="md"
      shape="rounded"
      square
      tooltip={label}
      pressed={view === value}
      onpressedchange={(pressed) => (view = pressed ? value : null)}
    >
      {#snippet icon()}<Icon data-slot="icon" weight="bold" />{/snippet}
    </Toggle>
  {/each}
</div>
