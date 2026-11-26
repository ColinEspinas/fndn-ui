<script setup lang="ts">
import { ref } from "vue";
import { Editable } from "@fndn/vue";

const description = ref("Webhook deliveries that time out are dropped today.\nRetry them three times with backoff, then mark the event failed.");
</script>

<!-- a description reads as plain text; the field appears only while editing. Enter starts a new line,
     Cmd/Ctrl+Enter or a click away saves -->
<template>
  <Editable v-model:value="description" aria-label="Description" multiline size="sm" placeholder="Add a description…" style="width: 360px" />
</template>
