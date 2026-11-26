<script setup lang="ts">
/** Turn one option on or off. Behaviour by Ark UI (Zag checkbox). */
import { Checkbox as ArkCheckbox } from "@ark-ui/vue/checkbox";
import { PhCheck, PhMinus } from "@phosphor-icons/vue";
import { computed, onMounted, useAttrs } from "vue";
import { trackModality } from "../lib/modality";
import { checkbox } from "./checkbox.recipe";

export type CheckboxChecked = boolean | "indeterminate";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Visible label. Without one, pass ariaLabel. */
    label?: string;
    ariaLabel?: string;
    /** sm: the 16px box (default). md: an 18px box, for table rows. */
    size?: "sm" | "md";
    /** Colour of the checked fill: ink (default), or red / green for a change to remove / add. */
    tone?: "ink" | "red" | "green";
    /** inline: box and label sized to the text (default). row: fills an option row (the shared option recipe) in a list that owns the glide. */
    layout?: "inline" | "row";
    disabled?: boolean;
    invalid?: boolean;
    /** tabindex of the input (the focusable part), for a host that runs a roving tab stop. */
    tabIndex?: number;
    /** Form field name. */
    name?: string;
    /** Form value when checked. */
    value?: string;
  }>(),
  { size: "sm", tone: "ink", layout: "inline", disabled: false, invalid: false, tabIndex: undefined },
);

/** v-model:checked — falls back to local state when unbound. */
const checked = defineModel<CheckboxChecked>("checked", { default: false });
const emit = defineEmits<{ checkedChange: [checked: CheckboxChecked] }>();
defineSlots<{ default?: () => unknown }>();
onMounted(() => trackModality());

const r = computed(() => checkbox({ size: props.size, tone: props.tone, layout: props.layout }));

function onChecked(next: CheckboxChecked) {
  checked.value = next;
  emit("checkedChange", next);
}
</script>

<template>
  <ArkCheckbox.Root
    v-bind="attrs"
    data-slot="checkbox" :class="r.base({ class: attrs.class as string | undefined })"
    :checked="checked"
    :disabled="disabled"
    :invalid="invalid"
    :name="name"
    :value="value"
    @update:checked="onChecked"
  >
    <ArkCheckbox.Control data-slot="checkbox-control" :class="r.control()">
      <span data-slot="checkbox-mark" :class="r.mark()" data-mark="check"><PhCheck data-slot="icon" weight="bold" /></span>
      <span data-slot="checkbox-mark" :class="r.mark()" data-mark="indeterminate"><PhMinus data-slot="icon" weight="bold" /></span>
    </ArkCheckbox.Control>
    <ArkCheckbox.Label v-if="label || $slots.default" data-slot="checkbox-label" :class="r.label()"><slot>{{ label }}</slot></ArkCheckbox.Label>
    <ArkCheckbox.HiddenInput data-slot="checkbox-input" :class="r.input()" :aria-label="ariaLabel" :tabindex="tabIndex" />
  </ArkCheckbox.Root>
</template>
