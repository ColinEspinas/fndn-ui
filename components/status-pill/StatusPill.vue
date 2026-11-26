<script setup lang="ts">
/** Tinted pill with a leading status dot. */
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { afterPaint } from "../lib/paint";
import { truncationTitles } from "../lib/truncate";
import { PhCheck } from "@phosphor-icons/vue";
import { statusPill } from "./status-pill.recipe";

export type StatusPillTone = "neutral" | "accent" | "green" | "orange" | "red" | "blue";
export type StatusPillSize = "md" | "sm";
export type StatusPillDotTone = "accent" | "green" | "orange" | "red" | "blue" | "purple" | "cyan" | "yellow" | "pink";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    tone?: StatusPillTone;
    size?: StatusPillSize;
    /** Leading dot. Default: true. */
    dot?: boolean;
    /** Circle with a check in place of the dot, for a finished state; it pops in when it appears after the first paint. */
    mark?: boolean;
    /** A neutral pill whose dot alone takes this colour (a category). */
    dotTone?: StatusPillDotTone;
  }>(),
  { tone: "neutral", size: "md", dot: true, mark: false, dotTone: undefined },
);
/* trailing: a glyph after the label */
defineSlots<{ default?: () => unknown; trailing?: () => unknown }>();
const showDot = computed(() => !props.mark && props.dot);
const r = computed(() => statusPill({ tone: props.tone, size: props.size, dotTone: props.dotTone, mark: props.mark }));

/* a label cut by its ellipsis carries its full text as a title */
const label = ref<HTMLElement | null>(null);
let stop = () => {};
watch(label, (el) => { stop(); stop = truncationTitles(el); }, { flush: "post" });
onBeforeUnmount(() => stop());

/* the mark pops in only when it appears after the first paint: data-enter only after it (lib/paint.ts) */
const enter = ref(false);
let cancel = () => {};
onMounted(() => { cancel = afterPaint(() => { enter.value = true; }); });
onBeforeUnmount(() => cancel());
</script>

<template>
  <span
    v-bind="attrs"
    data-slot="status-pill"
    :class="r.base({ class: attrs.class as string | undefined })"
    :data-enter="enter || attrs['data-enter'] !== undefined ? '' : undefined"
  >
    <span v-if="mark" data-slot="status-pill-mark" :class="r.mark()" aria-hidden="true"><PhCheck data-slot="icon" weight="bold" /></span>
    <span v-if="showDot" data-slot="status-pill-dot" :class="r.dot()" aria-hidden="true" />
    <span v-if="$slots.default" ref="label" data-slot="status-pill-label" :class="r.label()"><slot /></span>
    <span v-if="$slots.trailing" data-slot="status-pill-trailing" :class="r.trailing()" aria-hidden="true"><slot name="trailing" /></span>
  </span>
</template>
