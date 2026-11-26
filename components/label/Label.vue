<script setup lang="ts">
/** The name of a form control. Inside a Field it is wired to the control by Ark UI's field
 * context; on its own, point it at the control with for. */
import { Field as ArkField, useFieldContext } from "@ark-ui/vue/field";
import { computed, useAttrs } from "vue";
import { label } from "./label.recipe";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
defineSlots<{ default?: () => unknown }>();

/* Ark's Field.Label needs a Field around it; outside one the label is a plain <label> */
const field = useFieldContext();
const cls = computed(() => label({ class: attrs.class as string | undefined }));
const rest = computed(() => { const { class: _class, ...other } = attrs; return other; });
</script>

<template>
  <ArkField.Label v-if="field" data-slot="label" :class="cls" v-bind="rest"><slot /></ArkField.Label>
  <label v-else data-slot="label" :class="cls" v-bind="rest"><slot /></label>
</template>
