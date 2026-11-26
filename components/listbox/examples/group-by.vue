<script setup lang="ts">
import { ref } from "vue";
import { Listbox } from "@fndn/vue";

const group = ref(["Environment"]);
</script>

<!-- sm: the dense size for side panels and popovers -->
<template>
  <Listbox :items="['Project', 'Environment', 'Author', 'No grouping']" v-model:value="group" size="sm" label="Group deploys by" style="width: 180px" />
</template>
