<script setup lang="ts">
/** A number field with minus and plus buttons. Behaviour by Ark UI (Zag number-input). */
import { NumberInput as ArkNumberInput } from "@ark-ui/vue/number-input";
import { PhMinus, PhPlus } from "@phosphor-icons/vue";
import { computed, onMounted, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Input from "../input/Input.vue";
import { trackModality } from "../lib/modality";
import { numberInput } from "./number-input.recipe";

export type NumberInputSize = "xs" | "sm" | "md" | "lg";

/* the caller's class goes through the recipe; other attributes (id, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    /** Arrow keys and the buttons move one step; Shift + arrow ten. */
    step?: number;
    /** The Input's heights: xs 24px, sm 28px, md 32px (default), lg 36px. */
    size?: NumberInputSize;
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    /** Visible label above the field. */
    label?: string;
    placeholder?: string;
    /** Intl number format of the shown value (currency, percent, grouping). */
    formatOptions?: Intl.NumberFormatOptions;
    /** The wheel steps the value while the field has focus. */
    allowMouseWheel?: boolean;
    /** Names of the buttons. Default: "Decrease", "Increase". */
    decrementLabel?: string;
    incrementLabel?: string;
    invalid?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    /** Form field name. */
    name?: string;
    ariaLabel?: string;
  }>(),
  {
    min: undefined, max: undefined, step: 1, size: "md", variant: "outline", allowMouseWheel: false, decrementLabel: "Decrease", incrementLabel: "Increase",
    invalid: false, disabled: false, readOnly: false, required: false,
  },
);

/** v-model:value — the text of the field ("12", "" when empty); falls back to local state when unbound. */
const value = defineModel<string>("value", { default: "" });
const emit = defineEmits<{ valueChange: [value: string, valueAsNumber: number]; valueCommit: [value: string, valueAsNumber: number] }>();

const r = computed(() => numberInput({ size: props.size }));
const button = computed(() => (props.size === "xs" ? 11 : props.size === "sm" ? 12 : 14));
const translations = computed(() => ({ decrementLabel: props.decrementLabel, incrementLabel: props.incrementLabel }));

function onValue(details: { value: string; valueAsNumber: number }) {
  value.value = details.value;
  emit("valueChange", details.value, details.valueAsNumber);
}

onMounted(() => trackModality());
</script>

<template>
  <ArkNumberInput.Root
    v-bind="attrs"
    data-slot="number-input"
    :class="r.base({ class: attrs.class as string | undefined })"
    :model-value="value"
    :min="min"
    :max="max"
    :step="step"
    :format-options="formatOptions"
    :allow-mouse-wheel="allowMouseWheel"
    :translations="translations"
    :invalid="invalid"
    :disabled="disabled"
    :read-only="readOnly"
    :required="required"
    :name="name"
    @value-change="onValue"
    @value-commit="(d: { value: string; valueAsNumber: number }) => emit('valueCommit', d.value, d.valueAsNumber)"
  >
    <ArkNumberInput.Label v-if="label" data-slot="number-input-label" :class="r.label()">{{ label }}</ArkNumberInput.Label>
    <ArkNumberInput.Control data-slot="number-input-control" :class="r.control()">
      <ArkNumberInput.Input as-child>
        <Input data-number-input="input" :size="size" :variant="variant" :class="r.input()" :placeholder="placeholder" :aria-label="ariaLabel" />
      </ArkNumberInput.Input>
      <ArkNumberInput.DecrementTrigger as-child>
        <Button data-number-input="decrement-trigger" :class="r.decrementTrigger()" variant="ghost" size="xs" shape="rounded" square muted :icon-size="button">
          <template #icon><PhMinus data-slot="icon" weight="bold" /></template>
        </Button>
      </ArkNumberInput.DecrementTrigger>
      <ArkNumberInput.IncrementTrigger as-child>
        <Button data-number-input="increment-trigger" :class="r.incrementTrigger()" variant="ghost" size="xs" shape="rounded" square muted :icon-size="button">
          <template #icon><PhPlus data-slot="icon" weight="bold" /></template>
        </Button>
      </ArkNumberInput.IncrementTrigger>
    </ArkNumberInput.Control>
  </ArkNumberInput.Root>
</template>
