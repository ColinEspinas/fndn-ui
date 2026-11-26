<script setup lang="ts">
import { ref } from "vue";
import { Button, Field, Input, Popover } from "@fndn/vue";

/* edit one value where it is shown; Save closes the popover (open is controlled) */
const open = ref(false);
const limit = ref("500");
const draft = ref(limit.value);

function save() {
  limit.value = draft.value;
  open.value = false;
}
</script>

<template>
  <div class="flex w-80 items-center justify-between gap-3">
    <div class="flex flex-col">
      <span class="text-sm font-medium text-ink">Monthly spend limit</span>
      <span class="text-xs text-ink-2">$312.40 used this month</span>
    </div>
    <Popover
      v-model:open="open"
      placement="bottom-end"
      title="Monthly spend limit"
      description="Deploys pause when usage reaches the limit. Owners get an email at 80%."
      @open-change="draft = limit"
    >
      <template #trigger>
        <Button size="sm">${{ Number(limit).toLocaleString("en-US") }}</Button>
      </template>
      <form class="flex items-end gap-2" @submit.prevent="save">
        <Field label="Limit in USD" class="flex-1">
          <Input v-model="draft" inputmode="numeric" />
        </Field>
        <Button type="submit" variant="primary">Save</Button>
      </form>
    </Popover>
  </div>
</template>
