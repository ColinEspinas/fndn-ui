<script setup lang="ts">
import { ref } from "vue";
import { PinInput } from "@fndn/vue";

const code = ref(["N", "W", "7"]);
</script>

<!-- alphanumeric: letters and digits, as printed on the invite -->
<template>
  <PinInput v-model:value="code" label="Invite code" type="alphanumeric" :length="6" />
</template>
