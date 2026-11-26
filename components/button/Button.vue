<script setup lang="ts">
/** The app's core button, in the app's shape: a pill unless the app is rounded. */
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { button, buttonSpinner } from "./button.recipe";
import Spinner from "../spinner/Spinner.vue";
import { truncationTitles } from "../lib/truncate";
import { trackModality } from "../lib/modality";
import { easeSwapWidth, watchSwapWidth } from "./swap";
export type ButtonVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ButtonShape = "pill" | "rounded";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Icon-only: equal width and height (24, 28 or 32). Needs an aria-label. */
    square?: boolean;
    /** Radius only: pill (a pill square is round) or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: ButtonShape;
    /** ink-3 at rest, ink when hovered, pressed or open. */
    muted?: boolean;
    /** Two states in one cell (Copy / Copied): shows the second label and icon. */
    swapped?: boolean;
    /** Square buttons: the icon's size in px (--fndn-button-icon-size); defaults to 14 / 15 / 16 by size. */
    iconSize?: number;
    /** Work under way: a spinner takes the icon's place (or covers the label), aria-busy, clicks are
     * dropped; the width does not change and the button keeps its focus. */
    busy?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "outline", size: "md", square: false, muted: false, swapped: false, iconSize: undefined, busy: false, disabled: false, type: "button" },
);

const slots = defineSlots<{ default?: () => unknown; icon?: () => unknown; trailingIcon?: () => unknown }>();

const r = computed(() => button({ variant: props.variant, size: props.size, shape: props.shape, square: props.square, muted: props.muted, swapped: props.swapped, busy: props.busy, cover: props.busy && !slots.icon, holding: props.busy && !!slots.icon }));
/* busy: a press does nothing (a submit button does not submit either); the caller's other
 * attributes and listeners stay */
const bound = computed(() => (props.busy ? { ...attrs, onClick: (event: Event) => event.preventDefault() } : attrs));

/* a label cut by its ellipsis carries its full text as a title */
const label = ref<HTMLElement | null>(null);
let stop = () => {};
watch(label, (el) => { stop(); stop = truncationTitles(el); }, { flush: "post" });
onBeforeUnmount(() => stop());
onMounted(() => trackModality());
/* two states in one cell (Copy / Copied): the width eases to the new label with the cross-fade */
let stopWidth = () => {};
watch(label, (el) => { stopWidth(); stopWidth = watchSwapWidth(el?.parentElement); }, { flush: "post" });
watch(() => !!props.swapped, () => easeSwapWidth(label.value?.parentElement), { flush: "post" });
onBeforeUnmount(() => stopWidth());
</script>

<template>
  <button
    v-bind="bound"
    data-slot="button"
    :class="r.base({ class: attrs.class as string | undefined })"
    :type="type"
    :disabled="disabled || undefined"
    :aria-busy="busy || undefined"
    :style="iconSize == null ? undefined : { '--fndn-button-icon-size': `${iconSize}px` }"
  >
    <span v-if="$slots.icon" data-slot="button-icon" :class="r.icon()" aria-hidden="true"><slot name="icon" /><Spinner v-if="busy" data-button="spinner" :class="buttonSpinner({ cover: !$slots.icon })" decorative /></span>
    <span v-if="$slots.default" ref="label" data-slot="button-label" :class="r.label()"><slot /></span>
    <span v-if="$slots.trailingIcon" data-slot="button-icon" data-trailing="" :class="r.icon({ holding: false })" aria-hidden="true"><slot name="trailingIcon" /></span>
    <Spinner v-if="busy && !$slots.icon" data-button="spinner" :class="buttonSpinner({ cover: !$slots.icon })" decorative />
  </button>
</template>
