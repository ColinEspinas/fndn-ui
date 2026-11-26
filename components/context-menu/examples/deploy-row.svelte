<script lang="ts">
  import ArrowsClockwise from "phosphor-svelte/lib/ArrowsClockwiseIcon";
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import Terminal from "phosphor-svelte/lib/TerminalIcon";
  import Trash from "phosphor-svelte/lib/TrashIcon";
  import { ContextMenu, StatusPill, type MenuEntry } from "@fndn/svelte";

  const items: MenuEntry[] = [
    { value: "logs", label: "View build logs", icon: Terminal },
    { value: "copy-id", label: "Copy deploy ID", icon: Copy },
    {
      type: "submenu",
      label: "Redeploy to",
      icon: ArrowsClockwise,
      items: [
        { value: "redeploy:production", label: "Production" },
        { value: "redeploy:staging", label: "Staging" },
        { value: "redeploy:preview", label: "Preview" },
      ],
    },
    { type: "separator" },
    { value: "delete", label: "Delete deploy", tone: "danger", icon: Trash },
  ];
</script>

<ContextMenu {items} label="Deploy dpl_7f3a9c" class="flex w-80 items-center gap-3 rounded-control px-2 py-1.5">
  <StatusPill tone="green">Ready</StatusPill>
  <div class="flex min-w-0 flex-1 flex-col">
    <span class="font-mono text-sm text-ink">dpl_7f3a9c</span>
    <span class="text-xs text-ink-2">main · a1b2c3d</span>
  </div>
  <span class="text-xs text-ink-2">2 min ago</span>
</ContextMenu>
