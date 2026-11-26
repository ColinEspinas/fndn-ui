<script setup lang="ts">
import { PhLink } from "@phosphor-icons/vue";
import { Button, Toast, toast } from "@fndn/vue";

function copy() {
  void navigator.clipboard.writeText("https://northwind.example/join/8f2k1q");
  toast({ title: "Invite link copied", description: "Anyone with the link can join Northwind until Nov 24.", tone: "green" });
}
</script>

<template>
  <Button @click="copy"><template #icon><PhLink data-slot="icon" weight="bold" /></template>Copy invite link</Button>
  <!-- mount the region once, near the root of the app -->
  <Toast />
</template>
