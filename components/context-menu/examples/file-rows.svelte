<script lang="ts">
  import ArrowSquareOut from "phosphor-svelte/lib/ArrowSquareOutIcon";
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import File from "phosphor-svelte/lib/FileIcon";
  import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
  import Trash from "phosphor-svelte/lib/TrashIcon";
  import { ContextMenu, type MenuEntry } from "@fndn/svelte";

  const files = [
    { name: "deliver.ts", modified: "2 min ago" },
    { name: "retry-policy.ts", modified: "Yesterday" },
    { name: "deliver.test.ts", modified: "Nov 12" },
  ];

  const actions: MenuEntry[] = [
    { value: "open", label: "Open", icon: ArrowSquareOut },
    { value: "copy-path", label: "Copy path", icon: Copy },
    { value: "rename", label: "Rename", icon: PencilSimple },
    { type: "separator" },
    { value: "delete", label: "Delete", tone: "danger", icon: Trash },
  ];
</script>

<!-- each row is its own area: right-click, long press or Shift+F10 opens the menu for that file -->
<div class="flex w-80 flex-col">
  {#each files as file (file.name)}
    <ContextMenu items={actions} label={file.name} class="flex items-center gap-2 rounded-control px-2 py-1.5">
      <File class="size-4 shrink-0 text-ink-3" weight="bold" />
      <span class="flex-1 font-mono text-sm text-ink">{file.name}</span>
      <span class="text-xs text-ink-2">{file.modified}</span>
    </ContextMenu>
  {/each}
</div>
