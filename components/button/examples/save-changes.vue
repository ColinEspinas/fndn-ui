<script setup lang="ts">
import { Button } from "@fndn/vue";
</script>

<!-- a form footer: the primary action last, Cancel before it -->
<template>
  <div class="inline-flex items-center gap-2">
    <Button>Cancel</Button>
    <Button variant="primary">Save changes</Button>
  </div>
</template>
