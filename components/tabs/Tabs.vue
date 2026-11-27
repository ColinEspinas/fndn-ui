<script setup lang="ts">
/** Switch between views that share one place. Behaviour by Ark UI (Zag tabs). */
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";
import { PhCaretDown, PhX } from "@phosphor-icons/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch, type Component } from "vue";
import Button from "../button/Button.vue";
import { trackModality } from "../lib/modality";
import Menu from "../menu/Menu.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import {
  afterFirstPaint, allTabsMenu, closeDelay, focusTab, focusTabSoon, holdsFocus, neighbourTab, placeIndicator, revealTab, revealTabSoon, tabsLabels, watchStrip,
  type TabsLabels,
} from "./tabs.logic";
import { tabs } from "./tabs.recipe";

export type { TabsLabels };

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
    /** pill: selected tab on a filled pill (default; also document tabs). underline: ink bar under the selected tab. */
    variant?: "pill" | "underline";
    /** xs 24 · sm 28 (dense: editors, browsers) · md (default). Dimensions only. */
    size?: "xs" | "sm" | "md";
    /** pill or underline inside a card header: the strip fills the header's height, with no hairline of its own. */
    inHeader?: boolean;
    /** Wraps the list in the header part (data-slot="tabs-header") with this class added: the host's header row. */
    headerClass?: string;
    /** Attributes for the header row, so a host can mark it as its own part. */
    headerProps?: Record<string, string | undefined>;
    /** Every tab has a close button and closes on Delete (an item's own `closable` wins): document tabs,
     * whose title stops at 240px, cut at its end with its full text in the title. */
    closable?: boolean;
    /** Verb of a close button's name, followed by the tab's text ("Close rate-limit.ts"). */
    closeLabel?: string;
    /** The root fills its container's height; the selected panel takes the rest and scrolls. */
    fill?: boolean;
    /** Name of the tab list. */
    ariaLabel?: string;
    /** The strings, for translation: allTabs, the name and tooltip of the button that lists every tab. */
    labels?: Partial<TabsLabels>;
  }>(),
  { variant: "pill", size: "md", inHeader: false, headerClass: undefined, headerProps: undefined, closable: false, closeLabel: "Close", fill: false, labels: undefined },
);

/** v-model:value — falls back to local state when unbound; defaults to the first enabled tab. */
const value = defineModel<string>("value");
/* close: a tab asks to close (its button, or Delete / Backspace on it). Remove it from `items`: when
 * it was selected, the next tab (else the previous) is already selected through valueChange. */
const emit = defineEmits<{ valueChange: [value: string]; close: [value: string] }>();
/* end: parts after the list inside the header part (a path, a copy button); implies the header part */
const slots = defineSlots<{ panel?: (props: { item: TabsItem & { label: string } }) => unknown; end?: () => unknown }>();

const opts = computed(() => props.items.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o })));
/* after mount: from then on an inserted closable tab opens its room (nothing plays on first paint) */
const ready = ref(false);
let stopReady: (() => void) | undefined;
/* closable tabs closed by the pointer, while their room closes */
const closing = ref<string[]>([]);
const r = computed(() => tabs({ variant: props.variant, size: props.size, inHeader: props.inHeader, fill: props.fill, ready: ready.value }));
const current = computed(() => value.value ?? opts.value.find((o) => !o.disabled)?.value);

function onValue(next: string) {
  value.value = next;
  emit("valueChange", next);
}

/* the indicator on the selected tab from the first paint (the engine measures a frame or more later) */
const root = ref<{ $el?: HTMLElement } | null>(null);
const rootEl = () => root.value?.$el ?? null;
/* more tabs than room: the edge fades and the all-tabs button (measured, never on a hidden list) */
const overflow = ref(false);
let stopStrip: (() => void) | undefined;
onMounted(() => {
  trackModality(); placeIndicator(rootEl()); revealTab(rootEl(), current.value, true);
  stopStrip = watchStrip(rootEl(), (over) => { overflow.value = over; });
  stopReady = afterFirstPaint(() => { ready.value = true; });
});
onBeforeUnmount(() => { stopReady?.(); stopStrip?.(); });
/* a strip that scrolls keeps the selected tab in view (also when a tab is added and selected) */
watch([current, () => opts.value.length], () => nextTick(() => revealTabSoon(rootEl(), current.value)));

const canClose = (o: TabsItem) => o.closable ?? props.closable;
const labelOf = (o: TabsItem) => o.label ?? o.value;
function close(o: TabsItem, focus: boolean) {
  const next = neighbourTab(opts.value, o.value);
  if (current.value === o.value && next !== undefined) onValue(next);
  if (focus || holdsFocus(rootEl(), o.value)) focusTab(rootEl(), next);
  /* from the pointer the tab closes its room first (instant from the keyboard) */
  const wait = closeDelay(rootEl(), focus);
  if (wait === 0) { emit("close", o.value); return; }
  closing.value = [...closing.value, o.value];
  setTimeout(() => { closing.value = closing.value.filter((v) => v !== o.value); emit("close", o.value); }, wait);
}
/* a tab picked from the all-tabs menu is selected and takes focus, as after any selection */
function pick(next: string) { onValue(next); focusTabSoon(rootEl(), next); }
const hasHeader = computed(() => props.headerClass !== undefined || !!slots.end);
const leaving = (o: TabsItem) => closing.value.includes(o.value);
const text = computed(() => tabsLabels(props.labels));
/* every tab in order, the selected one checked; picking one selects it (and scrolls it into view) */
const moreItems = computed(() => allTabsMenu(opts.value.filter((o) => !closing.value.includes(o.value)), current.value));
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
    <div v-if="hasHeader" data-slot="tabs-header" v-bind="headerProps" :class="r.header({ class: headerClass })">
      <ArkTabs.List data-slot="tabs-list" :class="r.list()" :aria-label="ariaLabel">
        <ArkTabs.Indicator data-slot="tabs-indicator" :class="r.indicator()" />
        <template v-for="o in opts" :key="o.value">
          <div v-if="canClose(o)" data-slot="tabs-tab" :class="r.tab({ closing: leaving(o) })">
            <ArkTabs.Trigger :value="o.value" :disabled="o.disabled" data-slot="tabs-trigger" :class="r.trigger({ closable: true, closing: leaving(o) })" aria-keyshortcuts="Delete" @keydown="onTabKey(o, $event)"><span v-if="o.icon" data-slot="tabs-icon" :class="r.icon()" aria-hidden="true"><img v-if="typeof o.icon === 'string'" :src="o.icon" alt="" /><component :is="o.icon" v-else data-slot="icon" /></span><span data-slot="tabs-label" :class="r.label({ closable: true })" :title="o.label">{{ o.label }}</span></ArkTabs.Trigger>
            <button type="button" data-slot="tabs-close" :class="r.close()" tabindex="-1" :aria-label="`${closeLabel} ${labelOf(o)}`" :disabled="o.disabled" @pointerdown.prevent @click="close(o, false)"><PhX data-slot="icon" weight="bold" aria-hidden="true" /></button>
          </div>
          <ArkTabs.Trigger v-else :value="o.value" :disabled="o.disabled" data-slot="tabs-trigger" :class="r.trigger({ closable: false })"><span v-if="o.icon" data-slot="tabs-icon" :class="r.icon()" aria-hidden="true"><img v-if="typeof o.icon === 'string'" :src="o.icon" alt="" /><component :is="o.icon" v-else data-slot="icon" /></span><span data-slot="tabs-label" :class="r.label()" :title="o.label">{{ o.label }}</span></ArkTabs.Trigger>
        </template>
      </ArkTabs.List>
      <Menu v-if="overflow" data-tabs="more" :class="r.more()" placement="bottom-end" :items="moreItems" @radio-change="(_name: string, next: string) => pick(next)">
        <template #trigger>
          <Tooltip :content="text.allTabs">
            <Button data-tabs="more-trigger" :class="r.moreTrigger()" variant="ghost" :size="variant === 'pill' ? 'xs' : size" square muted :aria-label="text.allTabs">
              <template #icon><PhCaretDown data-slot="icon" weight="bold" /></template>
            </Button>
          </Tooltip>
        </template>
      </Menu>
      <slot name="end" />
    </div>
    <ArkTabs.List v-else data-slot="tabs-list" :class="r.list()" :aria-label="ariaLabel">
      <ArkTabs.Indicator data-slot="tabs-indicator" :class="r.indicator()" />
      <template v-for="o in opts" :key="o.value">
          <div v-if="canClose(o)" data-slot="tabs-tab" :class="r.tab({ closing: leaving(o) })">
            <ArkTabs.Trigger :value="o.value" :disabled="o.disabled" data-slot="tabs-trigger" :class="r.trigger({ closable: true, closing: leaving(o) })" aria-keyshortcuts="Delete" @keydown="onTabKey(o, $event)"><span v-if="o.icon" data-slot="tabs-icon" :class="r.icon()" aria-hidden="true"><img v-if="typeof o.icon === 'string'" :src="o.icon" alt="" /><component :is="o.icon" v-else data-slot="icon" /></span><span data-slot="tabs-label" :class="r.label({ closable: true })" :title="o.label">{{ o.label }}</span></ArkTabs.Trigger>
            <button type="button" data-slot="tabs-close" :class="r.close()" tabindex="-1" :aria-label="`${closeLabel} ${labelOf(o)}`" :disabled="o.disabled" @pointerdown.prevent @click="close(o, false)"><PhX data-slot="icon" weight="bold" aria-hidden="true" /></button>
          </div>
          <ArkTabs.Trigger v-else :value="o.value" :disabled="o.disabled" data-slot="tabs-trigger" :class="r.trigger({ closable: false })"><span v-if="o.icon" data-slot="tabs-icon" :class="r.icon()" aria-hidden="true"><img v-if="typeof o.icon === 'string'" :src="o.icon" alt="" /><component :is="o.icon" v-else data-slot="icon" /></span><span data-slot="tabs-label" :class="r.label()" :title="o.label">{{ o.label }}</span></ArkTabs.Trigger>
        </template>
    </ArkTabs.List>
    <Menu v-if="overflow && !hasHeader" data-tabs="more" :class="r.more()" placement="bottom-end" :items="moreItems" @radio-change="(_name: string, next: string) => pick(next)">
      <template #trigger>
        <Tooltip :content="text.allTabs">
          <Button data-tabs="more-trigger" :class="r.moreTrigger()" variant="ghost" :size="variant === 'pill' ? 'xs' : size" square muted :aria-label="text.allTabs">
            <template #icon><PhCaretDown data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </template>
    </Menu>
    <ArkTabs.Content v-for="o in opts" :key="o.value" :value="o.value" data-slot="tabs-content" :class="r.content()"><slot name="panel" :item="o">{{ o.content }}</slot></ArkTabs.Content>
  </ArkTabs.Root>
</template>
