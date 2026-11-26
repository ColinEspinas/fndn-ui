<script setup lang="ts">
import { PhCode, PhLink, PhPaperclip, PhTextB, PhTextItalic } from "@phosphor-icons/vue";
import { Button, Input, Tooltip } from "@fndn/vue";

const tools = [
  { label: "Bold", shortcut: "⌘B", icon: PhTextB },
  { label: "Italic", shortcut: "⌘I", icon: PhTextItalic },
  { label: "Code", shortcut: "⌘E", icon: PhCode },
  { label: "Link", shortcut: "⌘K", icon: PhLink },
  { label: "Attach a file", icon: PhPaperclip },
];
</script>

<!-- once one tooltip is open, its neighbours open at once, with no animation -->
<template>
  <div class="flex w-80 flex-col gap-2">
    <div class="flex gap-0.5" role="toolbar" aria-label="Formatting">
      <Tooltip v-for="tool in tools" :key="tool.label" :content="tool.label" :shortcut="tool.shortcut">
        <Button variant="ghost" size="sm" square :aria-label="tool.label">
          <template #icon><component :is="tool.icon" data-slot="icon" weight="bold" /></template>
        </Button>
      </Tooltip>
    </div>
    <Input multiline :rows="3" aria-label="Comment on #482" placeholder="Leave a review comment" />
  </div>
</template>
