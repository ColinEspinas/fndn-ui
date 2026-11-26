<script setup lang="ts">
import { ref } from "vue";
import { Button, Checkbox } from "@fndn/vue";

/* invalid until confirmed: the error says what to do, the action waits for it */
const confirmed = ref(false);
</script>

<template>
  <div class="flex w-80 flex-col items-start gap-3">
    <div class="flex flex-col gap-1">
      <Checkbox
        label="I understand that billing-api and its 128 deploys are deleted for good"
        :checked="confirmed"
        @update:checked="(v) => (confirmed = v === true)"
        :invalid="!confirmed"
      />
      <p v-if="!confirmed" class="ps-6 text-xs text-red">Confirm to delete the project.</p>
    </div>
    <Button variant="danger" size="sm" :disabled="!confirmed">Delete billing-api</Button>
  </div>
</template>
