<script setup lang="ts">
/** Switch between views that share one place. Behaviour by Ark UI (Zag tabs). */
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";
import { PhX } from "@phosphor-icons/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch, type Component } from "vue";
import { trackModality } from "../lib/modality";
import { afterFirstPaint, closeDelay, focusTab, holdsFocus, neighbourTab, placeIndicator, revealTab, revealTabSoon } from "./tabs.logic";
import { tabs } from "./tabs.recipe";

export type TabsItem = {
  value: string; label?: string; content?: string; disabled?: boolean;
  /** Before the label: an icon component (a file icon, drawn with data-slot="icon") or an image URL (a favicon). */
  icon?: Component | string;
  /** This tab has a close button and closes on Delete. Overrides the Tabs' `closable`. */
  closable?: boolean;
};

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Tabs in order, each with its panel content. Strings are accepted as value = label. */
    items: ReadonlyArray<TabsItem | string>;
    /** pill: selected tab on a filled pill (default). underline: ink bar under the selected tab.
     * attached: browser and editor tabs; the selected tab is the surface below it (--fndn-tabs-surface) and joins it. */
    variant?: "pill" | "underline" | "attached";
    /** xs 24 · sm 28 (dense: editors, browsers) · md (default). Dimensions only. */
    size?: "xs" | "sm" | "md";
    /** pill or underline inside a card header: the strip fills the header's height, with no hairline of its own. */
    inHeader?: boolean;
    /** Wraps the list in the header part (data-slot="tabs-header") with this class added: the host's header row. */
    headerClass?: string;
    /** Attributes for the header row, so a host can mark it as its own part. */
    headerProps?: Record<string, string | undefined>;
    /** Every tab has a close button and closes on Delete (an item's own `closable` wins). */
    closable?: boolean;
    /** Verb of a close button's name, followed by the tab's text ("Close rate-limit.ts"). */
    closeLabel?: string;
    /** The root fills its container's height; the selected panel takes the rest and scrolls. */
    fill?: boolean;
    /** attached only. shrink (default, Chrome): tabs share the strip and shrink, labels cut with a title.
     * fit (VS Code): each tab as wide as its title, the strip scrolls. */
    tabSizing?: "shrink" | "fit";
    /** Name of the tab list. */
    ariaLabel?: string;
  }>(),
  { variant: "pill", size: "md", inHeader: false, headerClass: undefined, headerProps: undefined, closable: false, closeLabel: "Close", fill: false, tabSizing: "shrink" },
);

/** v-model:value — falls back to local state when unbound; defaults to the first enabled tab. */
const value = defineModel<string>("value");
/* close: a tab asks to close (its button, or Delete / Backspace on it). Remove it from `items`: when
 * it was selected, the next tab (else the previous) is already selected through valueChange. */
const emit = defineEmits<{ valueChange: [value: string]; close: [value: string] }>();
/* end: parts after the list inside the header part (a path, a copy button); implies the header part */
const slots = defineSlots<{ panel?: (props: { item: TabsItem & { label: string } }) => unknown; end?: () => unknown }>();

const opts = computed(() => props.items.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o })));
/* after mount: from then on an inserted attached tab opens its room (nothing plays on first paint) */
const ready = ref(false);
let stopReady: (() => void) | undefined;
/* attached tabs closed by the pointer, while their room closes */
const closing = ref<string[]>([]);
const r = computed(() => tabs({ variant: props.variant, size: props.size, inHeader: props.inHeader, fill: props.fill, tabSizing: props.tabSizing, ready: ready.value }));
const current = computed(() => value.value ?? opts.value.find((o) => !o.disabled)?.value);

function onValue(next: string) {
  value.value = next;
  emit("valueChange", next);
}

/* the indicator on the selected tab from the first paint (the engine measures a frame or more later) */
const root = ref<{ $el?: HTMLElement } | null>(null);
const rootEl = () => root.value?.$el ?? null;
onMounted(() => { trackModality(); placeIndicator(rootEl()); revealTab(rootEl(), current.value, true); stopReady = afterFirstPaint(() => { ready.value = true; }); });
onBeforeUnmount(() => stopReady?.());
/* a strip that scrolls keeps the selected tab in view (also when a tab is added and selected) */
watch([current, () => opts.value.length], () => nextTick(() => revealTabSoon(rootEl(), current.value)));

const canClose = (o: TabsItem) => o.closable ?? props.closable;
const labelOf = (o: TabsItem) => o.label ?? o.value;
function close(o: TabsItem, focus: boolean) {
  const next = neighbourTab(opts.value, o.value);
  if (current.value === o.value && next !== undefined) onValue(next);
  if (focus || holdsFocus(rootEl(), o.value)) focusTab(rootEl(), next);
  /* attached, from the pointer: the tab closes its room first (instant from the keyboard) */
  const wait = props.variant === "attached" ? closeDelay(rootEl(), focus) : 0;
  if (wait === 0) { emit("close", o.value); return; }
  closing.value = [...closing.value, o.value];
  setTimeout(() => { closing.value = closing.value.filter((v) => v !== o.value); emit("close", o.value); }, wait);
}
const leaving = (o: TabsItem) => closing.value.includes(o.value);
function onTabKey(o: TabsItem, event: KeyboardEvent) {
  if (!canClose(o)) return;
  if ((event.key === "Delete" || event.key === "Backspace") && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    event.preventDefault();
    close(o, true);
  }
}
</script>

<template>
  <ArkTabs.Root ref="root" v-bind="attrs" data-slot="tabs" :class="r.base({ class: attrs.class as string | undefined })" :model-value="current" @update:model-value="onValue">
    <div v-if="headerClass !== undefined || slots.end" data-slot="tabs-header" v-bind="headerProps" :class="r.header({ class: headerClass })">
      <ArkTabs.List data-slot="tabs-list" :class="r.list()" :aria-label="ariaLabel">
        <ArkTabs.Indicator data-slot="tabs-indicator" :class="r.indicator()" />
        <template v-for="o in opts" :key="o.value">
          <div v-if="canClose(o)" data-slot="tabs-tab" :class="r.tab({ closing: leaving(o) })">
            <ArkTabs.Trigger :value="o.value" :disabled="o.disabled" data-slot="tabs-trigger" :class="r.trigger({ closable: true, closing: leaving(o) })" aria-keyshortcuts="Delete" @keydown="onTabKey(o, $event)"><span v-if="o.icon" data-slot="tabs-icon" :class="r.icon()" aria-hidden="true"><img v-if="typeof o.icon === 'string'" :src="o.icon" alt="" /><component :is="o.icon" v-else data-slot="icon" /></span><span data-slot="tabs-label" :class="r.label()" :title="o.label">{{ o.label }}</span></ArkTabs.Trigger>
            <button type="button" data-slot="tabs-close" :class="r.close()" tabindex="-1" :aria-label="`${closeLabel} ${labelOf(o)}`" :disabled="o.disabled" @pointerdown.prevent @click="close(o, false)"><PhX data-slot="icon" weight="bold" aria-hidden="true" /></button>
          </div>
          <ArkTabs.Trigger v-else :value="o.value" :disabled="o.disabled" data-slot="tabs-trigger" :class="r.trigger({ closable: false })"><span v-if="o.icon" data-slot="tabs-icon" :class="r.icon()" aria-hidden="true"><img v-if="typeof o.icon === 'string'" :src="o.icon" alt="" /><component :is="o.icon" v-else data-slot="icon" /></span><span data-slot="tabs-label" :class="r.label()" :title="o.label">{{ o.label }}</span></ArkTabs.Trigger>
        </template>
      </ArkTabs.List>
      <slot name="end" />
    </div>
    <ArkTabs.List v-else data-slot="tabs-list" :class="r.list()" :aria-label="ariaLabel">
      <ArkTabs.Indicator data-slot="tabs-indicator" :class="r.indicator()" />
      <template v-for="o in opts" :key="o.value">
          <div v-if="canClose(o)" data-slot="tabs-tab" :class="r.tab({ closing: leaving(o) })">
            <ArkTabs.Trigger :value="o.value" :disabled="o.disabled" data-slot="tabs-trigger" :class="r.trigger({ closable: true, closing: leaving(o) })" aria-keyshortcuts="Delete" @keydown="onTabKey(o, $event)"><span v-if="o.icon" data-slot="tabs-icon" :class="r.icon()" aria-hidden="true"><img v-if="typeof o.icon === 'string'" :src="o.icon" alt="" /><component :is="o.icon" v-else data-slot="icon" /></span><span data-slot="tabs-label" :class="r.label()" :title="o.label">{{ o.label }}</span></ArkTabs.Trigger>
            <button type="button" data-slot="tabs-close" :class="r.close()" tabindex="-1" :aria-label="`${closeLabel} ${labelOf(o)}`" :disabled="o.disabled" @pointerdown.prevent @click="close(o, false)"><PhX data-slot="icon" weight="bold" aria-hidden="true" /></button>
          </div>
          <ArkTabs.Trigger v-else :value="o.value" :disabled="o.disabled" data-slot="tabs-trigger" :class="r.trigger({ closable: false })"><span v-if="o.icon" data-slot="tabs-icon" :class="r.icon()" aria-hidden="true"><img v-if="typeof o.icon === 'string'" :src="o.icon" alt="" /><component :is="o.icon" v-else data-slot="icon" /></span><span data-slot="tabs-label" :class="r.label()" :title="o.label">{{ o.label }}</span></ArkTabs.Trigger>
        </template>
    </ArkTabs.List>
    <ArkTabs.Content v-for="o in opts" :key="o.value" :value="o.value" data-slot="tabs-content" :class="r.content()"><slot name="panel" :item="o">{{ o.content }}</slot></ArkTabs.Content>
  </ArkTabs.Root>
</template>
