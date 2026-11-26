<script lang="ts">
  import Code from "phosphor-svelte/lib/CodeIcon";
  import Link from "phosphor-svelte/lib/LinkIcon";
  import Paperclip from "phosphor-svelte/lib/PaperclipIcon";
  import TextB from "phosphor-svelte/lib/TextBIcon";
  import TextItalic from "phosphor-svelte/lib/TextItalicIcon";
  import { Button, Input, Tooltip } from "@fndn/svelte";

  const tools = [
    { label: "Bold", shortcut: "⌘B", icon: TextB },
    { label: "Italic", shortcut: "⌘I", icon: TextItalic },
    { label: "Code", shortcut: "⌘E", icon: Code },
    { label: "Link", shortcut: "⌘K", icon: Link },
    { label: "Attach a file", icon: Paperclip },
  ];
</script>

<!-- once one tooltip is open, its neighbours open at once, with no animation -->
<div class="flex w-80 flex-col gap-2">
  <div class="flex gap-0.5" role="toolbar" aria-label="Formatting">
    {#each tools as tool (tool.label)}
      <Tooltip content={tool.label} shortcut={tool.shortcut}>
        {#snippet trigger(props)}
          <Button {...props()} variant="ghost" size="sm" square aria-label={tool.label}>
            {#snippet icon()}<tool.icon data-slot="icon" weight="bold" />{/snippet}
          </Button>
        {/snippet}
      </Tooltip>
    {/each}
  </div>
  <Input multiline rows={3} aria-label="Comment on #482" placeholder="Leave a review comment" />
</div>
