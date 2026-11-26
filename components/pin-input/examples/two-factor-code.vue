<script setup lang="ts">
import { PinInput } from "@fndn/vue";
</script>

<!-- otp: the browser and the phone offer the code from the latest text message -->
<template>
  <PinInput label="Authentication code" otp />
</template>
