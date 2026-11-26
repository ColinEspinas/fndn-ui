<script setup lang="ts">
/** A select you can type into: the list is filtered by the text. Behaviour by Ark UI (Zag combobox). */
import { Combobox as ArkCombobox, createListCollection } from "@ark-ui/vue/combobox";
import { PhCaretDown, PhCheck } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, type Component } from "vue";
import Button from "../button/Button.vue";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";
import { matchParts } from "./combobox.logic";
import { combobox } from "./combobox.recipe";

export type ComboboxItem = {
  value: string;
  label: string;
  /** A leading icon: a Phosphor icon component (drawn bold), or a component drawing a 14px image (a favicon). */
  icon?: Component;
  meta?: string;
  disabled?: boolean;
  /** Other words that find this option (an ISO code, a city, a former name); never shown. */
  keywords?: ReadonlyArray<string>;
};
export type ComboboxPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Options in order. Strings are accepted as value = label. */
    items: ReadonlyArray<ComboboxItem | string>;
    placeholder?: string;
    /** Visible label. Without one, pass ariaLabel. */
    label?: string;
    ariaLabel?: string;
    /** Before the text, inside the field, as text. An icon, an avatar or a status go in the `start` slot. */
    start?: string;
    /** After the text, inside the field, before the caret, as text (a count, a status). A star or an icon go in the `end` slot. */
    end?: string;
    /** The caret button at the end. false: the field opens its list by typing, a click or the arrow keys only. */
    caret?: boolean;
    /** The part of each label that matches what was typed stays in ink, the rest dims (Chrome's suggestions). */
    highlightMatch?: boolean;
    /** Enter with no option highlighted keeps what was typed as the value (valueChange fires with the text). */
    allowCustomValue?: boolean;
    /** Shown in the list when nothing matches. */
    emptyText?: string;
    /** aria-label of the caret button. */
    triggerLabel?: string;
    /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    disabled?: boolean;
    invalid?: boolean;
    /** Form field name; the input carries it. */
    name?: string;
    placement?: ComboboxPlacement;
  }>(),
  { start: undefined, end: undefined, caret: true, highlightMatch: false, allowCustomValue: false, placeholder: "Search", emptyText: "No results", triggerLabel: "Show options", size: "md", variant: "outline", disabled: false, invalid: false, placement: "bottom-start" },
);

/** v-model:value — falls back to local state when unbound. */
const value = defineModel<string | null>("value", { default: null });
const emit = defineEmits<{ valueChange: [value: string | null]; openChange: [open: boolean]; inputValueChange: [text: string] }>();
/* end: after the text, inside the field, before the caret (a star, a status, a count) */
const slots = defineSlots<{ label?: () => unknown; start?: () => unknown; end?: () => unknown }>();

const all = computed(() => {
  const list = props.items.map((item): ComboboxItem => (typeof item === "string" ? { value: item, label: item } : item));
  /* free text that was kept is an option of its own, so the field and the list show it */
  const current = value.value;
  if (props.allowCustomValue && current && !list.some((item) => item.value === current)) list.push({ value: current, label: current });
  return list;
});
/* the list filters on what the user typed, not on the label a selection writes into the field:
 * reopened after a choice, it shows every option again. A query matches the label or a keyword */
const query = ref("");
const collection = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const matches = (item: ComboboxItem) => item.label.toLowerCase().includes(needle) || !!item.keywords?.some((word) => word.toLowerCase().includes(needle));
  return createListCollection<ComboboxItem>({ items: needle ? all.value.filter(matches) : all.value });
});
/* highlightMatch: the label cut around what was typed */
const parts = (item: ComboboxItem) => (props.highlightMatch ? matchParts(item.label, query.value) : null);
const hasStart = computed(() => (props.start != null && props.start !== "") || !!slots.start);
const hasEnd = computed(() => (props.end != null && props.end !== "") || !!slots.end);
const r = computed(() => combobox({ size: props.size, variant: props.variant, start: hasStart.value, end: hasEnd.value, caret: props.caret }));
/* the engine's sameWidth pins the list to the control; off, the list grows to its options (the select's) */
const positioning = computed(() => ({ placement: props.placement, gutter: 4, sameWidth: false }));

function onValue(next: string[]) {
  value.value = next[0] ?? null;
  emit("valueChange", value.value);
}
function onInputValue(details: { inputValue: string; reason?: string }) {
  if (details.reason === "input-change") query.value = details.inputValue;
  emit("inputValueChange", details.inputValue);
}
function onOpen(details: { open: boolean; reason?: string }) {
  /* the query is dropped when the list next opens (by anything but typing), not when it closes: a
   * closing list keeps the options it shows while it fades, it does not fill up again */
  if (details.open && details.reason !== "input-change") query.value = "";
  emit("openChange", details.open);
}

/* free text: Enter with no option highlighted keeps what was typed. Runs before the engine's
 * Enter (capture), which would put back the chosen label; an exact match of an option (a
 * disabled one too) is never kept as text */
function keepTyped(event: KeyboardEvent, close: () => void) {
  if (!props.allowCustomValue || event.key !== "Enter" || event.isComposing) return;
  const input = event.currentTarget as HTMLInputElement;
  const text = input.value.trim();
  if (!text || input.hasAttribute("aria-activedescendant")) return;
  if (all.value.some((item) => item.label.toLowerCase() === text.toLowerCase())) return;
  event.preventDefault();
  onValue([text]);
  close();
}
/* a press on the start or end part (or the control's own padding) is a press in the field: focus,
 * then the field's click, which opens the list. A control inside them keeps its own press */
function inField(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target !== event.currentTarget && (!target.closest("[data-slot=combobox-start], [data-slot=combobox-end]") || target.closest("a, button, input, select, textarea, [tabindex]"))) return null;
  return (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>("[data-slot=combobox-input]");
}
function pressDown(event: MouseEvent) {
  const input = inField(event);
  if (!input) return;
  event.preventDefault();
  input.focus();
}
function pressUp(event: MouseEvent) {
  inField(event)?.click();
}

const content = ref<{ $el: HTMLElement } | null>(null);
const highlight = ref<HTMLElement | null>(null);
const control = ref<{ $el: HTMLElement } | null>(null);
let stopGlide: (() => void) | undefined;
let stopTitles: (() => void) | undefined;
onMounted(() => {
  trackModality();
  if (content.value?.$el && highlight.value) stopGlide = glide(content.value.$el, highlight.value, { rows: "[data-slot=combobox-item]", follow: "highlighted" });
  /* start text cut by its ellipsis carries its full text as a title */
  stopTitles = truncationTitles(control.value?.$el, "[data-slot=combobox-start]");
});
onBeforeUnmount(() => { stopGlide?.(); stopTitles?.(); });
</script>

<template>
  <ArkCombobox.Root
    v-bind="attrs"
    data-slot="combobox"
    :class="r.base({ class: attrs.class as string | undefined })"
    :collection="collection"
    :model-value="value == null ? [] : [value]"
    :disabled="disabled || items.length === 0"
    :invalid="invalid"
    :name="name"
    :placeholder="placeholder"
    open-on-click
    input-behavior="autohighlight"
    :positioning="positioning"
    @update:model-value="onValue"
    @input-value-change="onInputValue"
    @open-change="onOpen"
  >
    <ArkCombobox.Label v-if="label || $slots.label" data-slot="combobox-label" :class="r.label()"><slot name="label">{{ label }}</slot></ArkCombobox.Label>
    <ArkCombobox.Context v-slot="api">
      <ArkCombobox.Control ref="control" data-slot="combobox-control" :class="r.control()" @mousedown="pressDown" @click="pressUp">
        <span v-if="hasStart" data-slot="combobox-start" :class="r.start()"><slot name="start">{{ start }}</slot></span>
        <ArkCombobox.Input data-slot="combobox-input" :class="r.input()" :aria-label="ariaLabel" dir="auto" @keydown.capture="(event: KeyboardEvent) => keepTyped(event, () => api.setOpen(false))" />
        <span v-if="hasEnd" data-slot="combobox-end" :class="r.end()"><slot name="end">{{ end }}</slot></span>
        <ArkCombobox.Trigger v-if="caret" as-child :aria-label="triggerLabel">
          <Button data-combobox="trigger" :class="r.trigger()" variant="ghost" size="xs" square muted>
            <template #icon><span data-slot="combobox-indicator" :class="r.indicator()"><PhCaretDown data-slot="icon" weight="bold" /></span></template>
          </Button>
        </ArkCombobox.Trigger>
      </ArkCombobox.Control>
    </ArkCombobox.Context>
    <Teleport to="body">
      <ArkCombobox.Positioner data-slot="combobox-positioner" :class="r.positioner()">
        <ArkCombobox.Content ref="content" data-slot="combobox-content" :class="r.content()">
          <span ref="highlight" data-slot="combobox-highlight" :class="r.highlight()" aria-hidden="true" />
          <ArkCombobox.Item v-for="item in collection.items" :key="item.value" :item="item" data-slot="combobox-item" :class="r.item()">
            <span v-if="item.icon" data-slot="combobox-item-icon" :class="r.itemIcon()" aria-hidden="true"><component :is="item.icon" data-slot="icon" weight="bold" /></span>
            <ArkCombobox.ItemText v-if="parts(item)" data-slot="combobox-item-text" :class="r.itemText({ matching: true })">{{ parts(item)![0] }}<span data-slot="combobox-item-match" :class="r.itemMatch()">{{ parts(item)![1] }}</span>{{ parts(item)![2] }}</ArkCombobox.ItemText>
            <ArkCombobox.ItemText v-else data-slot="combobox-item-text" :class="r.itemText()">{{ item.label }}</ArkCombobox.ItemText>
            <span v-if="item.meta" data-slot="combobox-item-meta" :class="r.itemMeta()">{{ item.meta }}</span>
            <span data-slot="combobox-item-indicator" :class="r.itemIndicator()" aria-hidden="true"><PhCheck data-slot="icon" weight="bold" /></span>
          </ArkCombobox.Item>
          <ArkCombobox.Empty data-slot="combobox-empty" :class="r.empty()">{{ emptyText }}</ArkCombobox.Empty>
        </ArkCombobox.Content>
      </ArkCombobox.Positioner>
    </Teleport>
  </ArkCombobox.Root>
</template>
