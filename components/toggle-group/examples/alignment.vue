<script setup lang="ts">
import { PhTextAlignCenter, PhTextAlignLeft, PhTextAlignRight } from "@phosphor-icons/vue";
import { ToggleGroup } from "@fndn/vue";

/* one at most, never none: alignment always has a value; icon-only items are named by their labels */
const alignments = [
  { value: "left", label: "Align left", icon: PhTextAlignLeft },
  { value: "center", label: "Align center", icon: PhTextAlignCenter },
  { value: "right", label: "Align right", icon: PhTextAlignRight },
];
</script>

<template>
  <ToggleGroup
    aria-label="Alignment"
    variant="ghost"
    size="sm"
    shape="rounded"
    square
    muted
    :deselectable="false"
    :value="['left']"
    :items="alignments"
  />
</template>
