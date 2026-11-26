<script setup lang="ts">
import { ref } from "vue";
import { PhBell, PhDeviceMobile, PhEnvelopeSimple } from "@phosphor-icons/vue";
import { ToggleGroup } from "@fndn/vue";

/* several channels at once; one the plan does not include is disabled and says why */
const channels = [
  { value: "email", label: "Email", icon: PhEnvelopeSimple },
  { value: "in-app", label: "In app", icon: PhBell },
  { value: "sms", label: "SMS", icon: PhDeviceMobile, tooltip: "SMS alerts need the Business plan", disabled: true },
];

const notify = ref<string[]>(["email", "in-app"]);
</script>

<template>
  <div class="flex flex-col items-start gap-2">
    <p class="text-sm font-medium text-ink">When a deploy fails, notify me by</p>
    <ToggleGroup v-model:value="notify" aria-label="When a deploy fails, notify me by" multiple size="sm" :items="channels" />
  </div>
</template>
