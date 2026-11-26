<script setup lang="ts">
/** An Input with addons joined to it. class and style go to the group; every other attribute to
 * the Input. */
import { onBeforeUnmount, onMounted, ref, useAttrs, useSlots, computed } from "vue";
import Input from "../input/Input.vue";
import { inputGroup } from "./input-group.recipe";
import { truncationTitles } from "../lib/truncate";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Addon before the field: text (https://). An icon, a Kbd or a Button go in the `start` slot. */
    start?: string;
    /** Addon after the field: text (.com, USD). An icon, a Kbd or a Button go in the `end` slot. */
    end?: string;
    /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    mono?: boolean;
    /** aria-invalid on the Input; the group shows the red ring. Absent: a surrounding Field decides. */
    invalid?: boolean;
  }>(),
  { start: undefined, end: undefined, size: "md", variant: "outline", mono: false, invalid: false },
);
defineSlots<{ start?: () => unknown; end?: () => unknown }>();
const slots = useSlots();

/** v-model — the Input's value; falls back to local state when unbound. */
const value = defineModel<string>("value", { default: "" });

const r = computed(() => inputGroup({ size: props.size, variant: props.variant }));
const inner = computed(() => { const { class: _class, style: _style, ...rest } = attrs; return rest; });
const hasStart = computed(() => (props.start != null && props.start !== "") || !!slots.start);
const hasEnd = computed(() => (props.end != null && props.end !== "") || !!slots.end);

const root = ref<HTMLElement | null>(null);
const input = ref<{ $el: HTMLInputElement } | null>(null);
/* a press on an addon's text or icon puts the caret in the field; controls in an addon keep theirs */
function focusField(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target.closest("input, button, a, select, textarea, [tabindex]")) return;
  event.preventDefault();
  input.value?.$el.focus();
}
/* addon text cut by its ellipsis carries its full text as a title */
let stop = () => {};
onMounted(() => { stop = truncationTitles(root.value, "[data-slot=input-group-start], [data-slot=input-group-end]"); });
onBeforeUnmount(() => stop());
defineExpose({ focus: () => input.value?.$el.focus() });
</script>

<template>
  <div ref="root" data-slot="input-group" :class="r.base({ class: attrs.class as string | undefined })" :style="attrs.style as any" @mousedown="focusField">
    <span v-if="hasStart" data-slot="input-group-start" :class="r.start()"><slot name="start">{{ start }}</slot></span>
    <Input ref="input" data-input-group="input" :size="size" :mono="mono" :invalid="invalid" :class="r.input()" v-model:value="value" v-bind="inner" />
    <span v-if="hasEnd" data-slot="input-group-end" :class="r.end()"><slot name="end">{{ end }}</slot></span>
  </div>
</template>
