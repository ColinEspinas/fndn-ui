<script setup lang="ts">
/** Buttons joined into one control. */
import { computed, useAttrs } from "vue";
import Button, { type ButtonShape, type ButtonSize } from "../button/Button.vue";
import { buttonGroup } from "./button-group.recipe";

export type ButtonGroupItem = { value: string; label: string; disabled?: boolean };

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    orientation?: "horizontal" | "vertical";
    /** The group's accessible name. */
    label?: string;
    /** Buttons as data, rendered before the default slot. */
    items?: ReadonlyArray<ButtonGroupItem>;
    /** The Button variant of the items (slotted buttons set their own). */
    variant?: "outline" | "primary" | "secondary" | "ghost";
    /** The Button size of the items. */
    size?: ButtonSize;
    /** The Button shape of the items. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: ButtonShape;
  }>(),
  { orientation: "horizontal", label: undefined, items: undefined, variant: "outline", size: "md" },
);
const emit = defineEmits<{ itemClick: [value: string] }>();
defineSlots<{ default?: () => unknown }>();

const r = computed(() => buttonGroup({ orientation: props.orientation }));
</script>

<template>
  <div v-bind="attrs" role="group" :aria-label="label" data-slot="button-group" :class="r.base({ class: attrs.class as string | undefined })">
    <Button
      v-for="item in items"
      :key="item.value"
      data-button-group="item"
      :class="r.item()"
      :variant="variant"
      :size="size"
      :shape="shape"
      :disabled="item.disabled"
      @click="emit('itemClick', item.value)"
    >{{ item.label }}</Button>
    <slot />
  </div>
</template>
