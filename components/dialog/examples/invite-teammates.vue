<script setup lang="ts">
import { ref } from "vue";
import { Dialog, Field, Input, Select, type DialogAction } from "@fndn/vue";

const roles = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "viewer", label: "Viewer" },
];

const role = ref("member");

const actions: DialogAction[] = [
  { label: "Cancel", value: "cancel", variant: "ghost" },
  { label: "Send invites", value: "send", variant: "primary" },
];
</script>

<!-- a dialog holds any content and closes on Escape, a click outside or its close button -->
<template>
  <div class="flex w-80 items-center gap-3">
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-ink">Members</div>
      <div class="text-xs text-ink-2">12 people at Northwind</div>
    </div>
    <Dialog
      triggerLabel="Invite teammates"
      title="Invite teammates"
      description="They get an email with a link to join Northwind. Invites expire after 7 days."
      :actions="actions"
      initialFocus="input"
    >
      <div class="flex flex-col gap-4">
        <Field label="Email addresses" helper="Separate several addresses with commas.">
          <Input type="email" multiple placeholder="priya@northwind.example, jonas@northwind.example" />
        </Field>
        <Select v-model:value="role" label="Role" :items="roles" />
      </div>
    </Dialog>
  </div>
</template>
