<script setup lang="ts">
import { ref } from "vue";
import { Dialog, Field, Input, type DialogAction } from "@fndn/vue";

/* Rename submits the form in the body: the browser checks the required field, Enter in it
 * renames, and the dialog closes on the form's submit */
const actions: DialogAction[] = [
  { label: "Cancel", value: "cancel", variant: "ghost" },
  { label: "Rename", value: "rename", variant: "primary", form: "rename-project-form" },
];

const project = ref("billing-api");
const name = ref(project.value);

function opened(open: boolean) {
  if (open) name.value = project.value;
}
function rename() {
  project.value = name.value.trim() || project.value;
}
</script>

<template>
  <div class="flex w-80 items-center gap-3">
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-ink">Project name</div>
      <div class="truncate text-xs text-ink-2" :title="`northwind.dev/${project}`">{{ `northwind.dev/${project}` }}</div>
    </div>
    <Dialog
      size="sm"
      triggerLabel="Rename"
      title="Rename project"
      :actions="actions"
      initialFocus="input"
      @open-change="opened"
    >
      <form id="rename-project-form" @submit.prevent="rename">
        <Field label="Project name" required :helper="`URLs become northwind.dev/${name.trim() || '…'}.`">
          <Input v-model:value="name" name="name" />
        </Field>
      </form>
    </Dialog>
  </div>
</template>
