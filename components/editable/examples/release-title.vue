<script setup lang="ts">
import { ref } from "vue";
import { Editable } from "@fndn/vue";

const title = ref("v2.14: usage alerts and invoice fixes");
</script>

<!-- controls: Edit, Save and Cancel buttons for people who do not guess the double-click -->
<template>
  <Editable
    v-model:value="title"
    label="Release title"
    controls
    activation-mode="dblclick"
    style="width: 340px"
  />
</template>
