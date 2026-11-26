<script setup lang="ts">
import { Avatar } from "@fndn/vue";
</script>

<!-- 40px in a profile header: the name beside it at the header's size -->
<template>
  <div class="flex w-80 items-center gap-3">
    <Avatar initials="DO" color="var(--fndn-tag-blue)" size="40" />
    <div class="flex min-w-0 flex-col gap-0.5">
      <span class="truncate text-md font-medium text-ink">Daniel Okafor</span>
      <span class="truncate text-sm text-ink-2" dir="ltr">daniel@northwind.example · Admin</span>
    </div>
  </div>
</template>
