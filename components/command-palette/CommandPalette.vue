<script setup lang="ts">
/** ⌘K command palette: the Search in a bare Dialog. */
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { isHotkey, paletteRows } from "../search/search.logic";
import { commandPalette } from "./command-palette.recipe";
import Dialog from "../dialog/Dialog.vue";
import Search, { type SearchItem } from "../search/Search.vue";

export type CommandPaletteItem = SearchItem;

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Every command and page, in order; `group` lists them under a label ("Pages", "Actions"). */
    items: ReadonlyArray<CommandPaletteItem>;
    /** Values of recently used commands, most recent first: listed first, under `recentLabel`, while the query is empty. */
    recent?: ReadonlyArray<string>;
    recentLabel?: string;
    /** The query it opens with (a field that opens the palette on a printable key passes that key). */
    defaultQuery?: string;
    /** ⌘K / Ctrl K anywhere on the page opens and closes it with this key. false: no global shortcut (bind your own). */
    hotkey?: string | false;
    /** Rows shown while the query is empty, after the recent ones. */
    limit?: number;
    /** Names the dialog for assistive technology. */
    title?: string;
    /** Accessible name of the field. */
    label?: string;
    placeholder?: string;
    emptyTitle?: string;
    emptyHint?: string;
  }>(),
  {
    recent: () => [], recentLabel: "Recent", defaultQuery: "", hotkey: "k", limit: 8, title: "Command palette", label: "Search commands",
    placeholder: "Type a command or search…", emptyTitle: "No results found", emptyHint: "Try another word, or a page name.",
  },
);

/** v-model:open — falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: false });
/* select: a command was chosen (Enter or a click); the palette has already closed */
const emit = defineEmits<{ openChange: [open: boolean]; select: [value: string, item: CommandPaletteItem] }>();

function setOpen(next: boolean) {
  open.value = next;
  emit("openChange", next);
}
const query = ref(props.defaultQuery);
/* every opening starts from the query it is given */
watch(open, (now) => { if (now) query.value = props.defaultQuery; });

function onKey(event: KeyboardEvent) {
  if (props.hotkey === false || !isHotkey(event, props.hotkey)) return;
  event.preventDefault();
  query.value = "";
  setOpen(!open.value);
}
/* Escape clears a query before it closes the palette: taken on the window, before the dialog's own
 * listener on the document sees it */
function onEscape(event: KeyboardEvent) {
  if (!open.value || event.key !== "Escape" || event.isComposing || !query.value) return;
  event.stopPropagation();
  event.preventDefault();
  query.value = "";
}
onMounted(() => { document.addEventListener("keydown", onKey); window.addEventListener("keydown", onEscape, true); });
onBeforeUnmount(() => { document.removeEventListener("keydown", onKey); window.removeEventListener("keydown", onEscape, true); });

const rows = computed(() => paletteRows(props.items, props.recent, props.recentLabel, query.value));
const r = commandPalette();
function onSelect(value: string, item: SearchItem) {
  setOpen(false);
  emit("select", value, props.items.find((i) => i.value === value) ?? item);
}
</script>

<template>
  <div v-bind="attrs" data-slot="command-palette" :class="r.base({ class: attrs.class as string | undefined })">
    <Dialog :open="open" :title="title" bare size="md" placement="top" instant @update:open="setOpen">
      <Search
        v-if="open"
        v-model:query="query"
        data-command-palette="search"
        :class="r.search()"
        :items="rows"
        :limit="recent.length + limit"
        highlight-first
        :label="label"
        :placeholder="placeholder"
        :empty-title="emptyTitle"
        :empty-hint="emptyHint"
        @select="onSelect"
      />
    </Dialog>
  </div>
</template>
