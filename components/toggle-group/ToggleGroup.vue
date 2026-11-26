<script setup lang="ts">
/** A row of Toggles, one or several pressed. Behaviour by Ark UI (Zag toggle-group). */
import { ToggleGroup as ArkToggleGroup } from "@ark-ui/vue/toggle-group";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, type Component } from "vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { toggle } from "../toggle/toggle.recipe";
import { toggleGroup } from "./toggle-group.recipe";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";

export type ToggleGroupItem = {
  value: string;
  /** Text of the item. With `square` it is not shown: it names the item and is its tooltip. */
  label?: string;
  /** Icon component, e.g. PhTextB (rendered bold, data-slot="icon"). */
  icon?: Component;
  /** Tooltip text; a square item uses its label when this is left out. */
  tooltip?: string;
  disabled?: boolean;
};

/* the caller's class goes through the recipe; other attributes (aria-label, id, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The toggles, in order. Strings are accepted as value = label. */
    items: ReadonlyArray<string | ToggleGroupItem>;
    /** Several may be pressed at once (bold + italic). Otherwise one at most (alignment). */
    multiple?: boolean;
    /** One at most: a click on the pressed item releases it. */
    deselectable?: boolean;
    /** The Toggle's looks. */
    variant?: "outline" | "ghost";
    /** The Toggle's sizes, the one control scale: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** Radius only: pill or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: "pill" | "rounded";
    /** Icon-only items: as wide as they are tall, named and tipped by their labels. */
    square?: boolean;
    /** ink-3 at rest, ink when hovered, held down or pressed. */
    muted?: boolean;
    orientation?: "horizontal" | "vertical";
    disabled?: boolean;
  }>(),
  { multiple: false, deselectable: undefined, variant: "outline", size: "md", square: false, muted: false, orientation: "horizontal", disabled: false },
);

/** v-model:value — the pressed values; falls back to local state when unbound. */
const value = defineModel<string[]>("value", { default: () => [] });
const emit = defineEmits<{ valueChange: [value: string[]] }>();

const list = computed(() => props.items.map((i): ToggleGroupItem => (typeof i === "string" ? { value: i, label: i } : i)));
const r = computed(() => toggleGroup({ orientation: props.orientation, muted: props.muted, variant: props.variant }));
const t = computed(() => toggle({ variant: props.variant, size: props.size, shape: props.shape, square: props.square, muted: props.muted }));
/* square: the icon alone shows, the label names the item and is its tooltip (an item without an
 * icon still shows its label, named by its tooltip when it has one) */
const iconOnly = (item: ToggleGroupItem) => props.square && item.icon != null;
const tip = (item: ToggleGroupItem) => item.tooltip ?? (iconOnly(item) ? item.label : undefined);
const named = (item: ToggleGroupItem) => {
  const name = props.square ? (item.tooltip ?? (iconOnly(item) ? item.label : undefined)) : undefined;
  return name ? { "aria-label": name } : {};
};

function onValue(next: string[]) {
  value.value = next;
  emit("valueChange", next);
}

/* a label cut by its ellipsis carries its full text as a title */
const root = ref<{ $el: HTMLElement } | null>(null);
let stop = () => {};
onMounted(() => {
  trackModality();
  stop = truncationTitles(root.value?.$el ?? null, "[data-slot=toggle-group-label]");
});
onBeforeUnmount(() => stop());
</script>

<template>
  <ArkToggleGroup.Root
    ref="root"
    v-bind="attrs"
    data-slot="toggle-group"
    :class="r.base({ class: attrs.class as string | undefined })"
    :model-value="value"
    :multiple="multiple"
    :deselectable="deselectable"
    :orientation="orientation"
    :disabled="disabled"
    @update:model-value="onValue"
  >
    <template v-for="item in list" :key="item.value">
      <Tooltip v-if="tip(item)" :content="tip(item)">
        <ArkToggleGroup.Item
          :value="item.value"
          :disabled="item.disabled"
          data-slot="toggle-group-item"
          :class="t.base({ class: r.item() })"
          v-bind="named(item)"
        >
          <span v-if="item.icon" data-slot="toggle-group-icon" :class="t.icon({ class: r.icon() })" aria-hidden="true"><component :is="item.icon" data-slot="icon" weight="bold" /></span>
          <span v-if="!iconOnly(item) && item.label" data-slot="toggle-group-label" :class="t.label({ class: r.label() })">{{ item.label }}</span>
        </ArkToggleGroup.Item>
      </Tooltip>
      <ArkToggleGroup.Item
        v-else
        :value="item.value"
        :disabled="item.disabled"
        data-slot="toggle-group-item"
        :class="t.base({ class: r.item() })"
        v-bind="named(item)"
      >
        <span v-if="item.icon" data-slot="toggle-group-icon" :class="t.icon({ class: r.icon() })" aria-hidden="true"><component :is="item.icon" data-slot="icon" weight="bold" /></span>
        <span v-if="!iconOnly(item) && item.label" data-slot="toggle-group-label" :class="t.label({ class: r.label() })">{{ item.label }}</span>
      </ArkToggleGroup.Item>
    </template>
  </ArkToggleGroup.Root>
</template>
