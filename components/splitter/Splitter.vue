<script setup lang="ts">
/** Panels with a handle between each pair that resizes them. Behaviour by Ark UI (Zag splitter). */
import { Splitter as ArkSplitter } from "@ark-ui/vue/splitter";
import { PhDotsSixVertical } from "@phosphor-icons/vue";
import { computed, onMounted, useAttrs } from "vue";
import { trackModality } from "../lib/modality";
import { splitter } from "./splitter.recipe";

export type SplitterOrientation = "horizontal" | "vertical";

export type SplitterPanel = {
  id: string;
  /** Plain text, padded. Richer content goes in the `panel` slot. */
  content?: string;
  /** Percent. */
  minSize?: number;
  /** Percent. */
  maxSize?: number;
  collapsible?: boolean;
  /** Percent, when collapsible (default 0). */
  collapsedSize?: number;
};

/* the caller's class goes through the recipe; other attributes (id, style, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The panels in order, with their limits. Every pair gets a handle. */
    panels: ReadonlyArray<SplitterPanel>;
    /** horizontal: side by side (default). vertical: stacked. */
    orientation?: SplitterOrientation;
    /** Show a grip on every handle. */
    grip?: boolean;
    /** Percent an arrow key moves a handle (Shift: 10). */
    keyboardStep?: number;
    /** Accessible name of every handle. */
    handleLabel?: string;
  }>(),
  { orientation: "horizontal", grip: false, keyboardStep: 1, handleLabel: "Resize" },
);

/** v-model:size — one percentage per panel; falls back to local state (equal shares) when unbound.
 * Updates while dragging and on every key. */
const size = defineModel<number[]>("size");
const emit = defineEmits<{ sizeChange: [size: number[]]; sizeChangeEnd: [size: number[]] }>();
defineSlots<{ panel?: (props: { panel: SplitterPanel; index: number }) => unknown }>();

const r = computed(() => splitter({ orientation: props.orientation }));
/* without sizes the panels share the room equally */
const current = computed(() => size.value ?? props.panels.map(() => 100 / Math.max(1, props.panels.length)));
const limits = computed(() => props.panels.map(({ id, minSize, maxSize, collapsible, collapsedSize }) => ({ id, minSize, maxSize, collapsible, collapsedSize })));

function onResize(next: number[]) {
  size.value = next;
  emit("sizeChange", next);
}

onMounted(() => trackModality());
</script>

<template>
  <ArkSplitter.Root
    v-bind="attrs"
    data-slot="splitter"
    :class="r.base({ class: attrs.class as string | undefined })"
    :orientation="orientation"
    :panels="limits"
    :size="current"
    :keyboard-resize-by="keyboardStep"
    @resize="(d) => onResize(d.size)"
    @resize-end="(d) => emit('sizeChangeEnd', d.size)"
  >
    <template v-for="(panel, index) in panels" :key="panel.id">
      <ArkSplitter.Panel :id="panel.id" data-slot="splitter-panel" :class="r.panel()">
        <slot name="panel" :panel="panel" :index="index"><p v-if="panel.content !== undefined" data-slot="splitter-text" :class="r.text()">{{ panel.content }}</p></slot>
      </ArkSplitter.Panel>
      <ArkSplitter.ResizeTrigger v-if="panels[index + 1]" :id="`${panel.id}:${panels[index + 1]!.id}`" data-slot="splitter-handle" :class="r.handle()" :aria-label="handleLabel">
        <ArkSplitter.ResizeTriggerIndicator v-if="grip" data-slot="splitter-grip" :class="r.grip()" aria-hidden="true">
          <PhDotsSixVertical data-slot="icon" weight="bold" />
        </ArkSplitter.ResizeTriggerIndicator>
      </ArkSplitter.ResizeTrigger>
    </template>
  </ArkSplitter.Root>
</template>
