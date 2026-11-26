<script setup lang="ts">
import { ref } from "vue";
import { Message, Textarea } from "@fndn/vue";

const text = ref("Which invoices failed to send in November?");
const editing = ref(false);
function onKey(e: KeyboardEvent) {
  const field = e.target as HTMLTextAreaElement;
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); text.value = field.value.trim() || text.value; editing.value = false; }
  if (e.key === "Escape") editing.value = false;
}
</script>

<!-- Edit turns the bubble into a field; Enter keeps the new text -->
<template>
  <div class="flex w-80 flex-col items-end">
    <Textarea v-if="editing" autofocus aria-label="Edit your message" :value="text" :rows="2" @keydown="onKey" />
    <Message v-else role="user" name="Maya Chen" time="10:42" :text="text" :actions="['copy', 'edit']" @action="(a) => a === 'edit' && (editing = true)" />
  </div>
</template>
