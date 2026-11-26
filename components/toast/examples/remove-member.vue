<script setup lang="ts">
import { Button, Toast, toast } from "@fndn/vue";

function remove() {
  toast({ title: "Lucas Moreau was removed from Northwind", action: { label: "Undo", onClick: () => toast({ title: "Lucas Moreau is back in Northwind", tone: "green" }) } });
}
</script>

<template>
  <Button variant="danger" @click="remove">Remove Lucas Moreau</Button>
  <!-- mount the region once, near the root of the app -->
  <Toast />
</template>
