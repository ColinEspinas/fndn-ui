<script setup lang="ts">
import { Button, Toast, toast } from "@fndn/vue";

function save() {
  toast({ title: "Changes saved", description: "web-app now builds with pnpm build." });
}
</script>

<template>
  <Button @click="save">Save changes</Button>
  <!-- mount the region once, near the root of the app -->
  <Toast />
</template>
