<script setup lang="ts">
import { PinInput } from "@fndn/vue";
</script>

<!-- mask: dots instead of digits, for a PIN someone could read over a shoulder -->
<template>
  <PinInput label="PIN to reveal production secrets" :length="4" mask />
</template>
