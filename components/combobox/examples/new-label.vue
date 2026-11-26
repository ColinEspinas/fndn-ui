<script setup lang="ts">
import { ref } from "vue";
import { PhTag } from "@phosphor-icons/vue";
import { Combobox } from "@fndn/vue";

/* allowCustomValue: Enter on a name no label has keeps it; the handler adds it to the list */
const labels = ref(["bug", "feature", "docs", "performance", "good first issue"]);
const label = ref<string | null>(null);
function choose(next: string | null) {
  if (next && !labels.value.includes(next)) labels.value = [...labels.value, next];
  label.value = next;
}
</script>

<template>
  <Combobox
    :items="labels"
    :value="label"
    allow-custom-value
    label="Label"
    placeholder="Find or create a label"
    empty-text="No such label: press Enter to create it"
    style="width: 260px"
    @value-change="choose"
  >
    <template #start><PhTag data-slot="icon" weight="bold" /></template>
  </Combobox>
</template>
