<script setup lang="ts">
import { ref } from "vue";
import { Button, TagsInput } from "@fndn/vue";

const labels = ref<string[]>(["bug", "p1"]);
</script>

<!-- sm: 28px, beside an sm Button in a list's toolbar -->
<template>
  <div class="flex items-center gap-2" style="width: 320px">
    <TagsInput v-model:value="labels" size="sm" aria-label="Filter by label" placeholder="Label" class="min-w-0 flex-1" />
    <Button size="sm" variant="secondary" :disabled="labels.length === 0" @click="labels = []">Clear</Button>
  </div>
</template>
