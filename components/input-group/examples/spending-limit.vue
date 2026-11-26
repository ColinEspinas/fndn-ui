<script setup lang="ts">
import { ref } from "vue";
import { Field, InputGroup } from "@fndn/vue";

const limit = ref("1,240.00");
</script>

<!-- text addons give the unit; inside a Field the label and helper are wired as for an Input -->
<template>
  <Field label="Spending limit" helper="Deploys pause when the month reaches it." class="w-full max-w-80">
    <InputGroup v-model:value="limit" start="$" end="USD" inputmode="decimal" />
  </Field>
</template>
