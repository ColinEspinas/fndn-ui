<script setup lang="ts">
import { computed, ref } from "vue";
import { PhUser } from "@phosphor-icons/vue";
import { Avatar, Combobox } from "@fndn/vue";

const members = [
  { value: "maya", label: "Maya Chen", meta: "Owner" },
  { value: "daniel", label: "Daniel Okafor", meta: "Admin" },
  { value: "priya", label: "Priya Raman", meta: "Member" },
  { value: "lucas", label: "Lucas Moreau", meta: "Member" },
  { value: "aiko", label: "Aiko Tanaka", meta: "Member" },
  { value: "jonas", label: "Jonas Weber", meta: "Member" },
];

const assignee = ref<string | null>("priya");
const person = computed(() => members.find((member) => member.value === assignee.value));
</script>

<!-- a property row of an issue: ghost and without a caret it reads as text until touched;
     the start shows who is assigned (the name is already the field's text, so it is decorative) -->
<template>
  <div class="flex items-center gap-2 text-sm" style="width: 280px">
    <span class="w-20 shrink-0 text-ink-2">Assignee</span>
    <Combobox
      :items="members"
      v-model:value="assignee"
      aria-label="Assignee"
      placeholder="Unassigned"
      empty-text="No one in Northwind matches"
      size="sm"
      variant="ghost"
      :caret="false"
      class="flex-1"
    >
      <template #start>
        <Avatar v-if="person" :name="person.label" :size="16" aria-hidden="true" />
        <PhUser v-else data-slot="icon" weight="bold" />
      </template>
    </Combobox>
  </div>
</template>
