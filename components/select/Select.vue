<script setup lang="ts">
/** Pick one value from a list. Behaviour by Ark UI (Zag select). */
import { Select as ArkSelect, createListCollection } from "@ark-ui/vue/select";
import { PhCaretDown, PhCheck } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { select } from "./select.recipe";

export type SelectItem = { value: string; label: string; meta?: string; disabled?: boolean };
export type SelectPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Options in order. Strings are accepted as value = label. */
    items: ReadonlyArray<SelectItem | string>;
    placeholder?: string;
    /** Visible label. Without one, pass ariaLabel. */
    label?: string;
    ariaLabel?: string;
    /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field, as wide as its container), subtle (the
     * inspector), ghost (reads as text until touched, sized to its value: the model picker). */
    variant?: "outline" | "subtle" | "ghost";
    disabled?: boolean;
    invalid?: boolean;
    /** Form field name; renders a hidden native select. */
    name?: string;
    placement?: SelectPlacement;
  }>(),
  { placeholder: "Select", size: "md", variant: "outline", disabled: false, invalid: false, placement: "bottom-start" },
);

/** v-model:value — falls back to local state when unbound. */
const value = defineModel<string | null>("value", { default: null });
const emit = defineEmits<{ valueChange: [value: string | null]; openChange: [open: boolean] }>();
defineSlots<{ label?: () => unknown }>();

const collection = computed(() =>
  createListCollection<SelectItem>({ items: props.items.map((item) => (typeof item === "string" ? { value: item, label: item } : item)) }),
);
const r = computed(() => select({ size: props.size, variant: props.variant }));
const positioning = computed(() => ({ placement: props.placement, gutter: 4 }));

function onValue(next: string[]) {
  value.value = next[0] ?? null;
  emit("valueChange", value.value);
}

const content = ref<{ $el: HTMLElement } | null>(null);
const highlight = ref<HTMLElement | null>(null);
let stopGlide: (() => void) | undefined;
onMounted(() => {
  trackModality();
  if (content.value?.$el && highlight.value) stopGlide = glide(content.value.$el, highlight.value, { rows: "[data-slot=select-item]", follow: "highlighted" });
});
onBeforeUnmount(() => stopGlide?.());
</script>

<template>
  <ArkSelect.Root
    v-bind="attrs"
    data-slot="select"
    :class="r.base({ class: attrs.class as string | undefined })"
    :collection="collection"
    :model-value="value == null ? [] : [value]"
    :disabled="disabled || items.length === 0"
    :invalid="invalid"
    :name="name"
    :positioning="positioning"
    @update:model-value="onValue"
    @open-change="(details) => emit('openChange', details.open)"
  >
    <ArkSelect.Label v-if="label || $slots.label" data-slot="select-label" :class="r.label()"><slot name="label">{{ label }}</slot></ArkSelect.Label>
    <ArkSelect.Control data-slot="select-control" :class="r.control()">
      <ArkSelect.Trigger data-slot="select-trigger" :class="r.trigger()" :aria-label="ariaLabel">
        <ArkSelect.ValueText data-slot="select-value" :class="r.value()" :placeholder="placeholder" />
        <span data-slot="select-indicator" :class="r.indicator()" aria-hidden="true"><PhCaretDown data-slot="icon" weight="bold" /></span>
      </ArkSelect.Trigger>
    </ArkSelect.Control>
    <Teleport to="body">
      <ArkSelect.Positioner data-slot="select-positioner" :class="r.positioner()">
        <ArkSelect.Content ref="content" data-slot="select-content" :class="r.content()">
          <span ref="highlight" data-slot="select-highlight" :class="r.highlight()" aria-hidden="true" />
          <ArkSelect.Item v-for="item in collection.items" :key="item.value" :item="item" data-slot="select-item" :class="r.item()">
            <ArkSelect.ItemText data-slot="select-item-text" :class="r.itemText()">{{ item.label }}</ArkSelect.ItemText>
            <span v-if="item.meta" data-slot="select-item-meta" :class="r.itemMeta()">{{ item.meta }}</span>
            <span data-slot="select-item-indicator" :class="r.itemIndicator()" aria-hidden="true"><PhCheck data-slot="icon" weight="bold" /></span>
          </ArkSelect.Item>
        </ArkSelect.Content>
      </ArkSelect.Positioner>
    </Teleport>
    <ArkSelect.HiddenSelect v-if="name" />
  </ArkSelect.Root>
</template>
