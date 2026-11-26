<script setup lang="ts">
/** The trail to the current page. */
import { PhCaretRight, PhDotsThree } from "@phosphor-icons/vue";
import { computed, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Menu from "../menu/Menu.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { breadcrumb } from "./breadcrumb.recipe";

export type BreadcrumbItem = { label: string; href?: string };
type Entry = { kind: "item"; item: BreadcrumbItem; current: boolean } | { kind: "ellipsis"; hidden: BreadcrumbItem[] };

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The trail from the top level to the current page (the last item). */
    items: ReadonlyArray<BreadcrumbItem>;
    /** Show at most this many items (2 or more): the first, a ⋯ menu, then the last maxItems − 1. */
    maxItems?: number;
    /** The landmark's accessible name. */
    label?: string;
    /** The ⋯ button's name and tooltip. */
    ellipsisLabel?: string;
    /** `@navigate`: replaces the browser's navigation (client routers); a click with a modifier key
     * keeps the browser's. A prop, so the component knows whether a listener is bound. */
    onNavigate?: (href: string | undefined, item: BreadcrumbItem) => void;
  }>(),
  { maxItems: undefined, label: "Breadcrumb", ellipsisLabel: "Show hidden pages", onNavigate: undefined },
);

const r = breadcrumb();
const entries = computed<Entry[]>(() => {
  const items = props.items;
  const n = items.length;
  const keep = props.maxItems != null && Number.isFinite(props.maxItems) ? Math.max(2, Math.floor(props.maxItems)) : n;
  return n > keep
    ? [
        { kind: "item", item: items[0]!, current: false },
        { kind: "ellipsis", hidden: items.slice(1, n - (keep - 1)) },
        ...items.slice(n - (keep - 1)).map((item, i, rest): Entry => ({ kind: "item", item, current: i === rest.length - 1 })),
      ]
    : items.map((item, i) => ({ kind: "item", item, current: i === n - 1 }));
});

function follow(item: BreadcrumbItem, e: MouseEvent) {
  if (!props.onNavigate || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  props.onNavigate(item.href, item);
}
function pick(hidden: BreadcrumbItem[], value: string) {
  const item = hidden[Number(value)];
  if (!item) return;
  if (props.onNavigate) props.onNavigate(item.href, item);
  else if (item.href) window.location.assign(item.href);
}
</script>

<template>
  <nav v-bind="attrs" data-slot="breadcrumb" :aria-label="label" :class="r.base({ class: attrs.class as string | undefined })">
    <ol data-slot="breadcrumb-list" :class="r.list()">
      <template v-for="(entry, i) in entries" :key="i">
        <li v-if="i > 0" data-slot="breadcrumb-separator" :class="r.separator()" role="presentation" aria-hidden="true">
          <PhCaretRight data-slot="icon" weight="bold" />
        </li>
        <li data-slot="breadcrumb-item" :class="r.item()">
          <Menu v-if="entry.kind === 'ellipsis'" :items="entry.hidden.map((item, j) => ({ value: String(j), label: item.label }))" @select="(value: string) => pick(entry.hidden, value)">
            <template #trigger>
              <Tooltip :content="ellipsisLabel">
                <Button data-breadcrumb="ellipsis" :class="r.ellipsis()" variant="ghost" size="xs" square muted :aria-label="ellipsisLabel">
                  <template #icon><PhDotsThree data-slot="icon" weight="bold" /></template>
                </Button>
              </Tooltip>
            </template>
          </Menu>
          <span v-else-if="entry.current" data-slot="breadcrumb-page" :class="r.page()" aria-current="page">{{ entry.item.label }}</span>
          <span v-else-if="entry.item.href == null" data-slot="breadcrumb-link" :class="r.link()">{{ entry.item.label }}</span>
          <a v-else data-slot="breadcrumb-link" :class="r.link()" :href="entry.item.href" @click="(e: MouseEvent) => follow((entry as { item: BreadcrumbItem }).item, e)">{{ entry.item.label }}</a>
        </li>
      </template>
    </ol>
  </nav>
</template>
