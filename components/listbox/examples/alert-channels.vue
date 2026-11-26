<script setup lang="ts">
import { ref } from "vue";
import { PhBell, PhDeviceMobile, PhEnvelopeSimple, PhLink } from "@phosphor-icons/vue";
import { Listbox } from "@fndn/vue";

/* an icon says what kind of channel, a one-line description where it goes; a long one is cut, with a title */
const channels = [
  { value: "email", label: "Email", description: "maya@northwind.example and 3 teammates", icon: PhEnvelopeSimple },
  { value: "sms", label: "Text message", description: "+1 (555) 014-2290", icon: PhDeviceMobile },
  { value: "webhook", label: "Webhook", description: "POST https://hooks.northwind.example/deploys/web-app", icon: PhLink },
  { value: "inbox", label: "Workspace inbox", description: "No email, shown when you sign in", icon: PhBell },
];

const selected = ref(["email", "webhook"]);
</script>

<template>
  <Listbox :items="channels" v-model:value="selected" label="Send failed deploy alerts to" selection-mode="multiple" style="width: 320px" />
</template>
