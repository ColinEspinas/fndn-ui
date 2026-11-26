<script setup lang="ts">
import { ref } from "vue";
import { Button, Textarea } from "@fndn/vue";

const comment = ref("");
</script>

<!-- starts at three lines and grows a line at a time as you type -->
<template>
  <div class="flex w-full max-w-80 flex-col gap-2">
    <Textarea
      v-model:value="comment"
      aria-label="Comment on #482 Add retry to webhook delivery"
      placeholder="Leave a comment"
    />
    <div class="flex justify-end gap-2">
      <Button size="sm" variant="secondary" @click="comment = ''">Cancel</Button>
      <Button size="sm" variant="primary" :disabled="comment.trim() === ''">Comment</Button>
    </div>
  </div>
</template>
