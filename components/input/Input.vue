<script setup lang="ts">
/** Text field on the field color with a hairline ring.
 * Inside a Field it is wired to the field's label, helper and error
 * through Ark UI's field context (Field.Input / Field.Textarea); on its own it is a plain control. */
import { Field as ArkField } from "@ark-ui/vue/field";
import { computed, useAttrs } from "vue";
import { input } from "./input.recipe";
export type InputSize = "xs" | "sm" | "md" | "lg";
export type InputVariant = "outline" | "subtle" | "ghost";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    size?: InputSize;
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: InputVariant;
    mono?: boolean;
    /** aria-invalid and the red ring. Absent: a surrounding Field decides. */
    invalid?: boolean;
    /** Render a textarea. */
    multiline?: boolean;
    /** `@input`: the value as the user types. As the as-child control of an engine part (it passes
     * its data-scope: a number input's, an editable's), the listener is the engine's and receives the
     * native event, as React's does. Declared as a prop so the Input can tell the two apart. */
    onInput?: (value: string) => void;
  }>(),
  { size: "md", variant: "outline", mono: false, invalid: false, multiline: false, onInput: undefined },
);

const cls = computed(() => input({ size: props.size, variant: props.variant, mono: props.mono, multiline: props.multiline }).base({ class: attrs.class as string | undefined }));
/* the as-child control of an engine part: it passes its data-scope and its own input listener, which
 * goes to the control as is (it reads the native event) */
const hosted = computed(() => attrs["data-scope"] !== undefined && props.onInput !== undefined);
/* every other attribute (disabled, id, aria-*) goes to the control, after the defaults (a caller's dir wins); an attribute left undefined
 * leaves the Field's value in place, and aria-invalid is set only when invalid */
const bound = computed(() => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) if (k !== "class" && v !== undefined) out[k] = v;
  if (props.invalid) out["aria-invalid"] = "true";
  if (hosted.value && props.onInput) out.onInput = props.onInput;
  return out;
});

/** v-model — falls back to local state when unbound. */
const value = defineModel<string>("value", { default: "" });

/* hosted, the engine owns the value (it passes it back as `value`); taking it here first, before the
 * engine's listener has run, lost a pin input's move to the next cell */
function onValue(v: string) {
  if (hosted.value) return;
  value.value = v;
  props.onInput?.(v);
}
</script>

<template>
  <ArkField.Textarea v-if="multiline" data-slot="input" :class="cls" dir="auto" :model-value="value" v-bind="bound" @update:model-value="onValue" />
  <ArkField.Input v-else data-slot="input" :class="cls" dir="auto" :model-value="value" v-bind="bound" @update:model-value="onValue" />
</template>
