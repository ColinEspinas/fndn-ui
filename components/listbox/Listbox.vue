<script setup lang="ts">
/** A list of options laid in the page, single or multiple choice. Behaviour by Ark UI (Zag listbox). */
import { Listbox as ArkListbox, createListCollection } from "@ark-ui/vue/listbox";
import { PhCheck } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, type Component } from "vue";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { listbox } from "./listbox.recipe";

export type ListboxItem = {
  value: string;
  label: string;
  /** One line after the label (an address, a cost): cut when the row is full, with a title. */
  description?: string;
  /** A leading icon: a Phosphor icon component (drawn bold). */
  icon?: Component;
  /** At the row's end: a note, a count, or a status letter (M, A, D). */
  meta?: string;
  /** The meta's colour: a status letter in its tone (orange modified, green added, red deleted). Default neutral (ink-2). */
  metaTone?: "neutral" | "accent" | "green" | "orange" | "red";
  disabled?: boolean;
};

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Options in order. Strings are accepted as value = label. */
    items: ReadonlyArray<ListboxItem | string>;
    /** single: one value, a click replaces it. multiple: a click adds or removes. */
    selectionMode?: "single" | "multiple";
    /** Visible label. Without one, pass ariaLabel. */
    label?: string;
    ariaLabel?: string;
    /** Row height: xs 24 · sm 28 (dense: editors) · md 32 · lg 36. */
    size?: "xs" | "sm" | "md" | "lg";
    /** card: a box in the page (default). flush: no box, the list is part of its pane (a change list, an explorer). */
    variant?: "card" | "flush";
    disabled?: boolean;
  }>(),
  { selectionMode: "single", size: "md", variant: "card", disabled: false },
);

/** v-model:value — the selected values (one at most in single mode); falls back to local state when unbound. */
const value = defineModel<string[]>("value", { default: () => [] });
const emit = defineEmits<{ valueChange: [value: string[]] }>();
defineSlots<{ label?: () => unknown }>();

const collection = computed(() =>
  createListCollection<ListboxItem>({ items: props.items.map((item) => (typeof item === "string" ? { value: item, label: item } : item)) }),
);
const r = computed(() => listbox({ size: props.size, variant: props.variant }));

function onValue(next: string[]) {
  value.value = next;
  emit("valueChange", next);
}

/* hovered or focused: the list shows its highlight */
const hovered = ref(false);
const focused = ref(false);
const active = computed(() => hovered.value || focused.value);

/* The engine marks its highlighted row only while the list has keyboard focus, and its
 * highlightOnHover waits for its own record of a press or a key, so the pointer alone would never
 * move the one highlight. Here a mouse move over an enabled row makes it the engine's highlighted
 * value (unless the last input was a key: a list scrolled by the keyboard under a resting pointer
 * keeps its highlight), and the row carries data-highlighted while it is that value and the list is
 * hovered or holds focus: the glide follows it. */
function onRowMove(event: PointerEvent, item: ListboxItem, api: { highlightedValue: string | null; highlightValue: (value: string) => void }) {
  if (event.pointerType !== "mouse" || item.disabled || api.highlightedValue === item.value) return;
  if (document.documentElement.dataset.fndnInput === "keyboard") return;
  api.highlightValue(item.value);
}

const content = ref<{ $el: HTMLElement } | null>(null);
const highlight = ref<HTMLElement | null>(null);
let stopGlide: (() => void) | undefined;
onMounted(() => {
  trackModality();
  if (content.value?.$el && highlight.value) stopGlide = glide(content.value.$el, highlight.value, { rows: "[data-slot=listbox-item]", follow: "highlighted" });
});
onBeforeUnmount(() => stopGlide?.());
</script>

<template>
  <ArkListbox.Root
    v-bind="attrs"
    data-slot="listbox"
    :class="r.base({ class: attrs.class as string | undefined })"
    :collection="collection"
    :model-value="value"
    :selection-mode="selectionMode"
    :disabled="disabled"
    @update:model-value="onValue"
  >
    <ArkListbox.Label v-if="label || $slots.label" data-slot="listbox-label" :class="r.label()"><slot name="label">{{ label }}</slot></ArkListbox.Label>
    <ArkListbox.Content
      ref="content"
      data-slot="listbox-content"
      :class="r.content()"
      :aria-label="label || $slots.label ? undefined : ariaLabel"
      @pointerenter="hovered = true"
      @pointerleave="hovered = false"
      @focusin="focused = true"
      @focusout="focused = false"
    >
      <span ref="highlight" data-slot="listbox-highlight" :class="r.highlight()" aria-hidden="true" />
      <ArkListbox.Context v-slot="api">
        <ArkListbox.Item
          v-for="item in collection.items"
          :key="item.value"
          :item="item"
          data-slot="listbox-item"
          :class="r.item()"
          :data-highlighted="active && api.highlightedValue === item.value ? '' : undefined"
          @pointermove="(event: PointerEvent) => onRowMove(event, item, api)"
        >
          <span v-if="item.icon" data-slot="listbox-item-icon" :class="r.itemIcon()" aria-hidden="true"><component :is="item.icon" data-slot="icon" weight="bold" /></span>
          <ArkListbox.ItemText data-slot="listbox-item-text" :class="r.itemText()">{{ item.label }}</ArkListbox.ItemText>
          <span v-if="item.description" data-slot="listbox-item-description" :class="r.itemDescription()" :title="item.description">{{ item.description }}</span>
          <span v-if="item.meta" data-slot="listbox-item-meta" :class="r.itemMeta({ metaTone: item.metaTone })">{{ item.meta }}</span>
          <span data-slot="listbox-item-indicator" :class="r.itemIndicator()" aria-hidden="true"><PhCheck data-slot="icon" weight="bold" /></span>
        </ArkListbox.Item>
      </ArkListbox.Context>
    </ArkListbox.Content>
  </ArkListbox.Root>
</template>
