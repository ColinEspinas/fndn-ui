<script setup lang="ts">
/** Multiline text field that grows with its text. Behaviour by Ark UI (Field.Textarea). */
import { Field as ArkField } from "@ark-ui/vue/field";
import { computed, onMounted, ref, useAttrs } from "vue";
import { textarea } from "./textarea.recipe";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** md: text-sm, 10px padding. sm: text-xs, 8px. Both start at 72px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    mono?: boolean;
    /** aria-invalid and the red ring. Absent: a surrounding Field decides. */
    invalid?: boolean;
    /** Grow with the text (default). Cap it with a max-height class; past it the text scrolls. */
    autoResize?: boolean;
  }>(),
  { size: "md", variant: "outline", mono: false, invalid: false, autoResize: true },
);

/** v-model — falls back to local state when unbound. */
const value = defineModel<string>("value", { default: "" });
const emit = defineEmits<{ input: [value: string] }>();
function onValue(v: string) {
  value.value = v;
  emit("input", v);
}

const cls = computed(() => textarea({ size: props.size, variant: props.variant, mono: props.mono, autoResize: props.autoResize, class: attrs.class as string | undefined }));
/* every other attribute goes to the textarea, after the defaults (a caller's dir wins); one left
 * undefined leaves the Field's value in place, and aria-invalid is set only when invalid */
const bound = computed(() => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) if (k !== "class" && v !== undefined) out[k] = v;
  if (props.invalid) out["aria-invalid"] = "true";
  return out;
});

/* the engine sizes the field a frame after mount; a long first value is sized before the first
 * paint instead, so the field never jumps */
const el = ref<{ $el: HTMLTextAreaElement } | null>(null);
onMounted(() => {
  const node = el.value?.$el;
  if (!node) return;
  /* the first value is also the default (a form reset returns to it), as React's defaultValue */
  node.defaultValue = value.value;
  if (!props.autoResize) return;
  node.style.height = "auto";
  node.style.height = `${node.scrollHeight}px`;
});
</script>

<template>
  <ArkField.Textarea
    ref="el"
    data-slot="textarea"
    :autoresize="autoResize"
    :class="cls"
    dir="auto"
    :model-value="value"
    v-bind="bound"
    @update:model-value="onValue"
  />
</template>
