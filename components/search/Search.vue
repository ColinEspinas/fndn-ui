<script setup lang="ts">
/** Inline command search. Behaviour by Ark UI (Zag combobox, kept open). */
import { Combobox, createListCollection } from "@ark-ui/vue/combobox";
import { PhMagnifyingGlass, PhX } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, type Component } from "vue";
import { glide } from "../lib/glide";
import { filterRows, groupRows } from "./search.logic";
import { trackModality } from "../lib/modality";
import EmptyState from "../empty-state/EmptyState.vue";
import Kbd from "../kbd/Kbd.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import Button from "../button/Button.vue";
import { search } from "./search.recipe";

export type SearchItem = {
  value: string; label: string;
  /** Rows of one group are listed together under this label, groups in the order they first appear. */
  group?: string;
  /** Leading icon: a Phosphor component (PhGitBranch). */
  icon?: Component;
  /** Trailing muted note (a path, a category). */
  meta?: string;
  /** Keys of the command's own shortcut, shown at the end of the row (["⌘", "J"]). */
  shortcut?: ReadonlyArray<string>;
  /** More words the query matches besides the label (a path, synonyms). */
  keywords?: ReadonlyArray<string>;
  disabled?: boolean;
};

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Commands in order. Strings are accepted as value = label. */
    items: ReadonlyArray<SearchItem | string>;
    /** Rows shown while the query is empty. */
    limit?: number;
    placeholder?: string;
    /** Accessible name of the field. */
    label?: string;
    clearLabel?: string;
    emptyTitle?: string;
    emptyHint?: string;
    /** The first row starts highlighted, so Enter runs it at once (a command palette). */
    highlightFirst?: boolean;
  }>(),
  { limit: 5, placeholder: "Search…", label: "Search", clearLabel: "Clear search", emptyTitle: "No results found", emptyHint: "Adjust your search to try again", highlightFirst: false },
);

/** v-model:query — falls back to local state when unbound. */
const query = defineModel<string>("query", { default: "" });
const emit = defineEmits<{ queryChange: [query: string]; select: [value: string, item: SearchItem] }>();

const all = computed(() => props.items.map((item): SearchItem => (typeof item === "string" ? { value: item, label: item } : item)));
/* only matching rows are rendered; the first `limit` while the query is empty */
/* rows of a group stay together, so the collection (the arrow keys' order) is the drawn order */
const runs = computed(() => groupRows(filterRows(all.value, query.value, props.limit)));
const shown = computed(() => runs.value.flatMap((run) => run.items));
const collection = computed(() => createListCollection<SearchItem>({ items: shown.value }));
const isEmpty = computed(() => shown.value.length === 0 && query.value.trim() !== "");
const value = ref<string[]>([]);
/* arms the clear button's fade-in once mounted: a mount is not an arrival */
const ready = ref(false);
onMounted(() => { ready.value = true; });
const r = computed(() => search({ ready: ready.value }));

function setQuery(next: string) {
  query.value = next;
  emit("queryChange", next);
}
/* Escape and the clear button empty the field (and the selection); focus never leaves the field */
function reset() {
  value.value = [];
  setQuery("");
}
function onSelect(details: { itemValue: string }) {
  const item = all.value.find((entry) => entry.value === details.itemValue);
  if (item) emit("select", item.value, item);
}

/* Root props below: the list is inline, so the machine stays open with nothing to dismiss or
 * position; free text is a valid query and the first match is highlighted while typing so Enter
 * takes it. (Kept out of the template: a top-level template comment would make the root a fragment.) */
const input = ref<{ $el: HTMLInputElement } | null>(null);
const list = ref<{ $el: HTMLElement } | null>(null);
const highlight = ref<HTMLElement | null>(null);
let stopGlide: (() => void) | undefined;
onMounted(() => {
  trackModality();
  if (list.value?.$el && highlight.value) stopGlide = glide(list.value.$el, highlight.value, { rows: "[data-slot=search-item]", follow: "highlighted" });
});
onBeforeUnmount(() => stopGlide?.());
</script>

<template>
  <Combobox.Root
    v-bind="attrs"
    data-slot="search"
    :class="r.base({ class: attrs.class as string | undefined })"
    :collection="collection"
    :input-value="query"
    :model-value="value"
    :placeholder="placeholder"
    :default-highlighted-value="highlightFirst ? shown[0]?.value : undefined"
    open
    disable-layer
    :close-on-select="false"
    :open-on-click="false"
    allow-custom-value
    input-behavior="autohighlight"
    selection-behavior="replace"
    @update:input-value="setQuery"
    @update:model-value="(next) => (value = next)"
    @select="onSelect"
  >
    <div data-slot="search-panel" :class="r.panel()">
      <Combobox.Control data-slot="search-bar" :class="r.bar()">
        <PhMagnifyingGlass data-slot="search-icon" :class="r.icon()" weight="bold" aria-hidden="true" />
        <Combobox.Input ref="input" data-slot="search-input" :class="r.input()" :aria-label="label" @keydown="(event: KeyboardEvent) => { if (event.key === 'Escape' && query !== '') reset(); }" />
        <Tooltip :content="clearLabel">
          <Button
            data-search="clear"
            :class="r.clear()"
            variant="ghost"
            size="xs"
            square
            muted
            tabindex="-1"
            :aria-label="clearLabel"
            :hidden="query === ''"
            @pointerdown.prevent
            @click="reset(); input?.$el.focus()"
          >
            <template #icon><PhX data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </Combobox.Control>
      <Combobox.Content ref="list" data-slot="search-list" :class="r.list()" :hidden="isEmpty">
        <span ref="highlight" data-slot="search-highlight" :class="r.highlight()" aria-hidden="true" />
        <template v-for="run in runs" :key="`group:${run.group ?? ''}`">
          <template v-if="run.group === undefined">
            <Combobox.Item v-for="item in run.items" :key="item.value" :item="item" data-slot="search-item" :class="r.item()">
              <span v-if="item.icon" data-slot="search-item-icon" :class="r.itemIcon()" aria-hidden="true"><component :is="item.icon" data-slot="icon" weight="bold" /></span>
              <Combobox.ItemText data-slot="search-item-text" :class="r.itemText()">{{ item.label }}</Combobox.ItemText>
              <span v-if="item.meta" data-slot="search-item-meta" :class="r.itemMeta()">{{ item.meta }}</span>
              <Kbd v-if="item.shortcut" data-search="item-shortcut" :class="r.itemShortcut()" :keys="[...item.shortcut]" />
            </Combobox.Item>
          </template>
          <Combobox.ItemGroup v-else data-slot="search-group" :class="r.group()">
            <Combobox.ItemGroupLabel data-slot="search-group-label" :class="r.groupLabel()">{{ run.group }}</Combobox.ItemGroupLabel>
            <Combobox.Item v-for="item in run.items" :key="item.value" :item="item" data-slot="search-item" :class="r.item()">
              <span v-if="item.icon" data-slot="search-item-icon" :class="r.itemIcon()" aria-hidden="true"><component :is="item.icon" data-slot="icon" weight="bold" /></span>
              <Combobox.ItemText data-slot="search-item-text" :class="r.itemText()">{{ item.label }}</Combobox.ItemText>
              <span v-if="item.meta" data-slot="search-item-meta" :class="r.itemMeta()">{{ item.meta }}</span>
              <Kbd v-if="item.shortcut" data-search="item-shortcut" :class="r.itemShortcut()" :keys="[...item.shortcut]" />
            </Combobox.Item>
          </Combobox.ItemGroup>
        </template>
      </Combobox.Content>
      <EmptyState data-search="empty" :class="r.empty()" size="block" align="center" icon="magnifying-glass" :title="emptyTitle" :hint="emptyHint" :hidden="!isEmpty" />
    </div>
  </Combobox.Root>
</template>
