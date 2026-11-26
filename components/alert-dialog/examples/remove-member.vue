<script setup lang="ts">
import { ref } from "vue";
import { AlertDialog, Checkbox } from "@fndn/vue";

const reassign = ref(true);
</script>

<!-- a body under the description: one choice that changes what the action does -->
<template>
  <AlertDialog
    triggerLabel="Remove member"
    title="Remove Daniel Okafor from Northwind?"
    description="Daniel loses access to every project at once. Their deploys and comments stay."
    actionLabel="Remove member"
  >
    <Checkbox v-model:checked="reassign" label="Reassign Daniel's 12 open reviews to me" />
  </AlertDialog>
</template>
