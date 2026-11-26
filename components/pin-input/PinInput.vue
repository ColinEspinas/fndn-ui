<script setup lang="ts">
/** A code typed one character per cell. Behaviour by Ark UI (Zag pin-input). */
import { PinInput as ArkPinInput } from "@ark-ui/vue/pin-input";
import { computed, onMounted, useAttrs } from "vue";
import Input from "../input/Input.vue";
import { pinInput } from "./pin-input.recipe";
import { trackModality } from "../lib/modality";

export type PinInputSize = "xs" | "sm" | "md" | "lg";

/* the caller's class goes through the recipe; other attributes (id, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Number of cells. */
    length?: number;
    /** What a cell accepts. */
    type?: "numeric" | "alphanumeric" | "alphabetic";
    /** A one-time code: autocomplete="one-time-code", so the keyboard can offer the code it received. */
    otp?: boolean;
    /** Shows dots instead of the characters (a PIN). */
    mask?: boolean;
    /** Square cells at the Input's heights: xs 24px, sm 28px, md 32px (default), lg 36px. */
    size?: PinInputSize;
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    /** Visible label above the cells. */
    label?: string;
    /** Shown in an empty cell that does not have focus. Default: none. */
    placeholder?: string;
    /** Leaves the last cell when the code is complete. */
    blurOnComplete?: boolean;
    autoFocus?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    /** Form field name (one hidden input with the whole code). */
    name?: string;
    /** Name of the group when there is no visible label; each cell is "<name>, 2 of 6". */
    ariaLabel?: string;
  }>(),
  { length: 6, type: "numeric", otp: false, mask: false, size: "md", variant: "outline", placeholder: "", blurOnComplete: false, autoFocus: false, invalid: false, disabled: false },
);

/** v-model:value — one character per cell ("" for an empty one); falls back to local state when unbound. */
const value = defineModel<string[]>("value", { default: () => [] });
const emit = defineEmits<{ valueChange: [value: string[]]; valueComplete: [code: string] }>();

const r = computed(() => pinInput({ size: props.size }));
const groupName = computed(() => props.ariaLabel ?? props.label);
const translations = computed(() => {
  const n = groupName.value;
  return n ? { inputLabel: (index: number, count: number) => `${n}, ${index + 1} of ${count}` } : undefined;
});

function onValue(next: string[]) {
  value.value = next;
  emit("valueChange", next);
}

onMounted(() => trackModality());
</script>

<template>
  <ArkPinInput.Root
    v-bind="attrs"
    data-slot="pin-input"
    :class="r.base({ class: attrs.class as string | undefined })"
    :count="length"
    :model-value="value"
    :type="type"
    :otp="otp"
    :mask="mask"
    :placeholder="placeholder"
    :blur-on-complete="blurOnComplete"
    :auto-focus="autoFocus"
    :invalid="invalid"
    :disabled="disabled"
    :name="name"
    :translations="translations"
    @update:model-value="onValue"
    @value-complete="(d) => emit('valueComplete', d.valueAsString)"
  >
    <ArkPinInput.Label v-if="label" data-slot="pin-input-label" :class="r.label()">{{ label }}</ArkPinInput.Label>
    <ArkPinInput.Control data-slot="pin-input-control" :class="r.control()" role="group" :aria-label="groupName">
      <ArkPinInput.Input v-for="index in length" :key="index" :index="index - 1" as-child>
        <Input data-pin-input="input" :size="size" :variant="variant" :class="r.input()" />
      </ArkPinInput.Input>
    </ArkPinInput.Control>
    <ArkPinInput.HiddenInput data-slot="pin-input-hidden-input" />
  </ArkPinInput.Root>
</template>
