<script setup lang="ts">
import { Avatar, HoverCard } from "@fndn/vue";

const person = {
  name: "Priya Raman",
  role: "Staff engineer, Platform",
  email: "priya@northwind.example",
  localTime: "16:42 in Berlin",
};
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-1 text-sm text-ink-2">
    <span>Approved by</span>
    <HoverCard placement="top-start">
      <template #trigger>
        <button type="button" class="font-medium text-ink underline decoration-line-strong underline-offset-2">{{ person.name }}</button>
      </template>
      <div class="flex items-start gap-3">
        <Avatar :name="person.name" :size="20" />
        <div class="flex flex-col gap-0.5">
          <span class="font-medium text-ink">{{ person.name }}</span>
          <span class="text-ink-2">{{ person.role }}</span>
          <span class="text-ink-2">{{ person.email }} · {{ person.localTime }}</span>
        </div>
      </div>
    </HoverCard>
    <span>· 2 min ago</span>
  </div>
</template>
