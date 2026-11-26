<script setup lang="ts">
import { ref } from "vue";
import { Label, Switch } from "@fndn/vue";

const previews = ref(true);
</script>

<!-- a settings row: the label names the switch (a click on it toggles), the description sits under it -->
<template>
  <div class="flex w-full max-w-80 items-start justify-between gap-4">
    <div class="flex min-w-0 flex-col gap-0.5">
      <Label for="preview-deploys">Preview deploys</Label>
      <p id="preview-deploys-description" class="m-0 text-sm text-ink-2">Build every pull request on its own URL.</p>
    </div>
    <Switch id="preview-deploys" v-model:checked="previews" aria-describedby="preview-deploys-description" />
  </div>
</template>
