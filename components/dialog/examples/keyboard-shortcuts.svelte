<script lang="ts">
  import Question from "phosphor-svelte/lib/QuestionIcon";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { Button, Dialog, Kbd, TextRow } from "@fndn/svelte";

  const shortcuts = [
    { action: "Search the workspace", keys: ["⌘", "K"] },
    { action: "Create a project", keys: ["C"] },
    { action: "Go to deploys", keys: ["G", "D"] },
    { action: "Toggle the sidebar", keys: ["⌘", "B"] },
  ];
</script>

<!-- your own trigger: a ghost Button with an icon, at the foot of the help panel; it takes the
     dialog's trigger props -->
{#snippet trigger(props: () => HTMLButtonAttributes)}
  <Button {...props()} variant="ghost" size="sm">
    {#snippet icon()}<Question data-slot="icon" weight="bold" />{/snippet}
    Shortcuts
  </Button>
{/snippet}
<div class="flex w-80 items-center gap-3">
  <div class="min-w-0 flex-1">
    <div class="text-sm font-medium text-ink">Work faster</div>
    <div class="text-xs text-ink-2">Every action in Northwind has a key.</div>
  </div>
  <Dialog size="sm" title="Keyboard shortcuts" {trigger}>
    <div class="flex flex-col">
      {#each shortcuts as s (s.action)}
        <TextRow label={s.action}>
          {#snippet value()}<Kbd keys={s.keys} />{/snippet}
        </TextRow>
      {/each}
    </div>
  </Dialog>
</div>
