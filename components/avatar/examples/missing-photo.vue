<script setup lang="ts">
import { Avatar } from "@fndn/vue";
</script>

<!-- the photo failed to load: the initials under it show instead -->
<template>
  <div class="flex w-80 gap-2.5 text-sm">
    <Avatar name="Sofia Alvarez" src="/avatars/sofia-alvarez.png" color="var(--fndn-tag-red)" size="20" />
    <div class="min-w-0 flex-1">
      <p><span class="font-medium text-ink">Sofia Alvarez</span> <span class="text-ink-2">· 5 min ago</span></p>
      <p class="text-ink-2">Retries look good on staging. Can we ship #482 before the billing run on Dec 1?</p>
    </div>
  </div>
</template>
