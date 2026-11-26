<script setup lang="ts">
import { Card, EmptyState } from "@fndn/vue";
</script>

<!-- a member picker's list after typing "jonas.w": one row, at the list's row height -->
<template>
  <Card elevation="overlay" class="w-80 max-w-full p-1">
    <EmptyState title="No members match “jonas.w”" hint="Invite by email instead" />
  </Card>
</template>
