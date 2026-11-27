<script setup lang="ts">
/** Code with line numbers: a listing, a diff, or an editor. No frame of its own. */
import { PhArrowDown, PhArrowUp, PhCaretDown, PhCaretRight, PhX } from "@phosphor-icons/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import InputGroup from "../input-group/InputGroup.vue";
import Toggle from "../toggle/Toggle.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { codeView } from "./code-view.recipe";
import { CLOSED_SEARCH, CODE_VIEW_LABELS, linesOf, mountEditor, revealCurrentLine, searchCount, tokenize, watchOverflow, type CodeEditorHandle, type CodeSearchState } from "./code-view.logic";
import type * as Logic from "./code-view.logic";

/** A single run of code within a diff row; `change` tints it as an add / del. */
export type CodePiece = Logic.CodePiece;
/** One row of a unified diff: old / new line numbers, its kind, and its pieces. */
export type CodeDiffRow = Logic.CodeDiffRow;
/** The editor's words (its search panel and its folds), for translation. */
export type CodeViewLabels = Logic.CodeViewLabels;

const props = withDefaults(
  defineProps<{
    /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `value`'s rows. Read-only only. */
    highlighted?: string[];
    /** A unified diff, shown instead of `value`. Never editable; no current line. */
    diff?: CodeDiffRow[];
    /** The accessible name: of the scroll region while it overflows, of the editor's text box. */
    label?: string;
    /** A code editor on `value` (CodeMirror, loaded only now). */
    editable?: boolean;
    /** Long lines wrap (default). false: they scroll sideways under a gutter that stays. */
    wrap?: boolean;
    /** Fixed height in px (--fndn-code-view-height). */
    height?: number;
    /** Height in px past which the code scrolls (--fndn-code-view-max-height). */
    maxHeight?: number;
    /** As tall as its container; the code scrolls inside. */
    fill?: boolean;
    labels?: Partial<CodeViewLabels>;
  }>(),
  { highlighted: undefined, diff: undefined, label: undefined, editable: false, wrap: true, height: undefined, maxHeight: undefined, fill: false, labels: undefined },
);
/** v-model:value — the code, lines separated by \n. */
const value = defineModel<string>("value", { default: "" });
/** v-model:current-line — the current line, 1-based; editable, the caret's line. */
const currentLine = defineModel<number>("currentLine");
const emit = defineEmits<{ valueChange: [value: string]; currentLineChange: [line: number] }>();

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
/* tok and piece take no variant */
const plain = codeView();

const isEditable = computed(() => props.editable && !props.diff);
/* an editor always has a caret, so it always has a current line (the first, unless told) */
const line = computed(() => (props.diff ? undefined : (currentLine.value ?? (isEditable.value ? 1 : undefined))));
const words = computed<CodeViewLabels>(() => ({ ...CODE_VIEW_LABELS, ...props.labels }));
const ready = ref(false);
const r = computed(() => codeView({ diff: !!props.diff, wrap: props.wrap, fold: isEditable.value, ready: ready.value, fill: props.fill }));
const rows = computed(() => (!props.diff && (isEditable.value || !props.highlighted) ? linesOf(value.value) : undefined));
const showListing = computed(() => !(isEditable.value && ready.value));
const rootStyle = computed(() => {
  const vars: Record<string, string> = {};
  if (props.maxHeight != null) vars["--fndn-code-view-max-height"] = `${props.maxHeight}px`;
  if (props.height != null) vars["--fndn-code-view-height"] = `${props.height}px`;
  return Object.keys(vars).length ? vars : undefined;
});

const root = ref<HTMLElement | null>(null);
const body = ref<HTMLElement | null>(null);
const editorEl = ref<HTMLElement | null>(null);
const handle = shallowRef<CodeEditorHandle | null>(null);
/* the find widget: what the editor's search shows, and the replace row */
const search = ref<CodeSearchState>(CLOSED_SEARCH);
const replacing = ref(false);
/* the field takes the focus, its text selected, when the widget opens or Mod+F asks again */
function focusFind() {
  nextTick(() => {
    const field = root.value?.querySelector<HTMLInputElement>("input[data-code-view=search-field]");
    field?.focus();
    field?.select();
  });
}
function findKey(event: KeyboardEvent) {
  const act = handle.value?.search;
  if (event.key === "Enter") { event.preventDefault(); if (event.shiftKey) act?.previous(); else act?.next(); }
  else if (act?.key(event)) event.preventDefault();
}
function replaceKey(event: KeyboardEvent) {
  const act = handle.value?.search;
  if (event.key === "Enter") { event.preventDefault(); act?.replace(); }
  else if (act?.key(event)) event.preventDefault();
}
function mount() {
  handle.value?.destroy();
  handle.value = null;
  ready.value = false;
  search.value = CLOSED_SEARCH;
  if (!isEditable.value || !editorEl.value) return;
  handle.value = mountEditor(editorEl.value, {
    value: value.value, wrap: props.wrap, currentLine: line.value, label: props.label, labels: words.value,
    onValueChange: (v) => { value.value = v; emit("valueChange", v); },
    onCurrentLineChange: (n) => { currentLine.value = n; emit("currentLineChange", n); },
    onSearch: (next) => { if (next.open && !search.value.open) { replacing.value = false; focusFind(); } search.value = next; },
    onSearchFocus: focusFind,
  }, () => { ready.value = true; });
}
onMounted(mount);
watch(isEditable, () => nextTick(mount));
watch(() => [value.value, props.wrap, line.value, props.label, words.value] as const, ([v, wrap, current, label, labels]) => handle.value?.update({ value: v, wrap, currentLine: current, label, labels }));

/* the listing: a named scroll region while it overflows, its current line kept in view */
let stopOverflow = () => {};
function watchBody() {
  stopOverflow();
  stopOverflow = body.value ? watchOverflow(body.value, props.label) : () => {};
}
onMounted(() => { watchBody(); revealCurrentLine(root.value); });
watch(() => [showListing.value, props.label], () => nextTick(watchBody));
watch(() => [line.value, showListing.value], () => nextTick(() => { if (showListing.value) revealCurrentLine(root.value); }));
onBeforeUnmount(() => { handle.value?.destroy(); stopOverflow(); });
</script>

<template>
  <div ref="root" v-bind="attrs" data-slot="code-view" :class="r.base({ class: attrs.class as string | undefined })" :style="rootStyle">
    <div v-if="showListing" ref="body" data-slot="code-view-body" :class="r.body()">
      <div data-slot="code-view-rows" :class="r.rows()">
        <template v-if="diff">
          <div v-for="(row, i) in diff" :key="i" data-slot="code-view-row" :class="r.row({ type: row.type })">
            <span v-if="row.type !== 'ctx'" data-slot="code-view-bar" :class="r.bar({ type: row.type })" aria-hidden="true" />
            <span data-slot="code-view-num" :class="r.num({ type: row.type })">{{ (row.type === "del" ? row.old : row.cur) ?? "" }}</span>
            <code data-slot="code-view-code" :class="r.code()"><template v-for="(p, j) in row.pieces" :key="j"><span v-if="p.change" data-slot="code-view-piece" :class="plain.piece({ change: p.change })"><template v-for="(t, k) in tokenize(p.text)" :key="k"><span v-if="t.tok" data-slot="code-view-tok" :class="plain.tok({ tok: t.tok })">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></span><template v-else><template v-for="(t, k) in tokenize(p.text)" :key="k"><span v-if="t.tok" data-slot="code-view-tok" :class="plain.tok({ tok: t.tok })">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></template></template></code>
          </div>
        </template>
        <template v-else-if="rows">
          <div v-for="(source, i) in rows" :key="i" data-slot="code-view-row" :class="r.row({ current: line === i + 1 })" :aria-current="line === i + 1 ? 'true' : undefined">
            <span data-slot="code-view-num" :class="r.num({ current: line === i + 1 })">{{ i + 1 }}</span>
            <code data-slot="code-view-code" :class="r.code()"><template v-for="(t, k) in tokenize(source)" :key="k"><span v-if="t.tok" data-slot="code-view-tok" :class="plain.tok({ tok: t.tok })">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></code>
          </div>
        </template>
        <template v-else>
          <div v-for="(html, i) in highlighted" :key="i" data-slot="code-view-row" :class="r.row({ current: line === i + 1 })" :aria-current="line === i + 1 ? 'true' : undefined">
            <span data-slot="code-view-num" :class="r.num({ current: line === i + 1 })">{{ i + 1 }}</span>
            <code data-slot="code-view-code" :class="r.code()" v-html="html" />
          </div>
        </template>
      </div>
    </div>
    <template v-if="isEditable">
      <span data-slot="code-view-icons" :class="r.icons()" aria-hidden="true"><PhCaretDown data-slot="icon" weight="bold" /></span>
      <div ref="editorEl" data-slot="code-view-editor" :class="r.editor()" />
      <div v-if="ready && search.open" data-slot="code-view-search" :class="r.search()">
        <div data-slot="code-view-search-row" :class="r.searchRow()">
          <Button data-code-view="search-expand" :class="r.searchExpand()" variant="ghost" size="xs" square muted :aria-label="words.toggleReplace" :aria-expanded="replacing" @click="replacing = !replacing">
            <template #icon><PhCaretRight data-slot="icon" weight="bold" /></template>
          </Button>
          <InputGroup
            data-code-view="search-field" :class="r.searchField()" size="sm" mono :aria-label="words.find" :placeholder="words.find" spellcheck="false"
            :value="search.search" @update:value="(v: string) => handle?.search.set({ search: v })" @keydown="findKey"
          >
            <template #end>
              <Toggle variant="ghost" size="xs" square muted :tooltip="words.matchCase" :pressed="search.caseSensitive" @update:pressed="(v: boolean) => handle?.search.set({ caseSensitive: v })">Aa</Toggle>
              <Toggle variant="ghost" size="xs" square muted :tooltip="words.wholeWord" :pressed="search.wholeWord" @update:pressed="(v: boolean) => handle?.search.set({ wholeWord: v })">ab</Toggle>
              <Toggle variant="ghost" size="xs" square muted :tooltip="words.regexp" :pressed="search.regexp" @update:pressed="(v: boolean) => handle?.search.set({ regexp: v })">.*</Toggle>
            </template>
          </InputGroup>
          <span data-slot="code-view-search-count" :class="r.searchCount()" role="status">{{ searchCount(search, words) }}</span>
          <Tooltip :content="words.previous" shortcut="Shift+Enter">
            <Button variant="ghost" size="xs" square muted :aria-label="words.previous" @click="handle?.search.previous()"><template #icon><PhArrowUp data-slot="icon" weight="bold" /></template></Button>
          </Tooltip>
          <Tooltip :content="words.next" shortcut="Enter">
            <Button variant="ghost" size="xs" square muted :aria-label="words.next" @click="handle?.search.next()"><template #icon><PhArrowDown data-slot="icon" weight="bold" /></template></Button>
          </Tooltip>
          <Tooltip :content="words.close" shortcut="Esc">
            <Button variant="ghost" size="xs" square muted :aria-label="words.close" @click="handle?.search.close()"><template #icon><PhX data-slot="icon" weight="bold" /></template></Button>
          </Tooltip>
        </div>
        <div v-if="replacing" data-slot="code-view-search-row" :class="r.searchRow()">
          <InputGroup
            data-code-view="replace-field" :class="r.replaceField()" size="sm" mono :aria-label="words.replace" :placeholder="words.replace" spellcheck="false"
            :value="search.replace" @update:value="(v: string) => handle?.search.set({ replace: v })" @keydown="replaceKey"
          />
          <Button variant="ghost" size="xs" muted @click="handle?.search.replace()">{{ words.replaceOne }}</Button>
          <Button variant="ghost" size="xs" muted @click="handle?.search.replaceAll()">{{ words.replaceAll }}</Button>
        </div>
      </div>
    </template>
  </div>
</template>
