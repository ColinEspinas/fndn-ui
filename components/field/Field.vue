<script setup lang="ts">
/** Label, control, helper and error, wired together. Behaviour by Ark UI (field). */
import { Field as ArkField } from "@ark-ui/vue/field";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useSlots } from "vue";
import { afterPaint } from "../lib/paint";
import { trackModality } from "../lib/modality";
import { field } from "./field.recipe";
import Input from "../input/Input.vue";
import Label from "../label/Label.vue";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The control's name, shown above it (a Label wired to the control). Or the `label` slot. */
    label?: string;
    /** Help under the control, linked by aria-describedby. Replaced by the error while invalid. Or the `helper` slot. */
    helper?: string;
    /** What to fix, shown in red under the control while invalid (aria-live polite). Or the `error` slot. */
    error?: string;
    /** Marks the control aria-invalid (red ring) and shows the error. */
    invalid?: boolean;
    /** The control is required; the label shows an asterisk (hidden from assistive technology). */
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** id of the control; generated when omitted. */
    id?: string;
  }>(),
  { label: undefined, helper: undefined, error: undefined, invalid: false, required: false, disabled: false, readOnly: false, id: undefined },
);
/** default: the control (Input, Textarea, InputGroup, PasswordInput read the field); an Input when empty */
defineSlots<{ default?: () => unknown; label?: () => unknown; helper?: () => unknown; error?: () => unknown }>();
const slots = useSlots();

const r = field();
const hasLabel = computed(() => !!props.label || !!slots.label);
const showError = computed(() => props.invalid && (!!props.error || !!slots.error));
const showHelper = computed(() => (!!props.helper || !!slots.helper) && !showError.value);
/* an error that arrives later fades in; nothing on the first paint (data-enter after it, lib/paint.ts) */
const enter = ref(false);
let cancel = () => {};
onMounted(() => { trackModality(); cancel = afterPaint(() => { enter.value = true; }); });
onBeforeUnmount(() => cancel());
const rest = computed(() => { const { class: _class, ...other } = attrs; return other; });
</script>

<template>
  <ArkField.Root
    :id="id"
    :invalid="invalid"
    :required="required"
    :disabled="disabled"
    :read-only="readOnly"
    data-slot="field"
    :data-enter="enter ? '' : undefined"
    :class="r.base({ class: attrs.class as string | undefined })"
    v-bind="rest"
  >
    <Label v-if="hasLabel" data-field="label" :class="r.label()">
      <slot name="label">{{ label }}</slot>
      <ArkField.RequiredIndicator data-slot="field-required-indicator" :class="r.requiredIndicator()" />
    </Label>
    <slot><Input /></slot>
    <ArkField.HelperText v-if="showHelper" data-slot="field-helper" :class="r.helper()"><slot name="helper">{{ helper }}</slot></ArkField.HelperText>
    <ArkField.ErrorText v-if="showError" data-slot="field-error" :class="r.error()"><slot name="error">{{ error }}</slot></ArkField.ErrorText>
  </ArkField.Root>
</template>
