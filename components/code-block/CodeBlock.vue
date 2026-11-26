<script setup lang="ts">
/** A line-numbered listing, a unified diff, tabbed files or a one-line command. */
import { PhCheck, PhCode, PhCopy } from "@phosphor-icons/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import { button } from "../button/button.recipe";
import { codeBlock } from "./code-block.recipe";
import Pager from "../pager/Pager.vue";
import Select from "../select/Select.vue";
import Tabs from "../tabs/Tabs.vue";
import { createCopier, revealCurrentLine, tokenize, watchFileTabs, watchOverflow } from "./code-block.logic";
import { looksLikePath, middleTruncation } from "../lib/truncate";

/* A single run of code within a diff row; `change` tints it as an add/del. */
export type CodePiece = { text: string; change?: "add" | "del" };
/* One row of a unified diff: old/new line numbers, its kind, and its pieces. */
export type CodeDiffRow = { old: number | null; cur: number | null; type: "ctx" | "add" | "del"; pieces: CodePiece[] };
export type CodeBlockLabels = { copy: string; copied: string; copyCode: string; files: string; file: string; previousFile: string; nextFile: string };
/** One file of a tabbed code block. */
export type CodeBlockFile = {
  /** Shown in the file's bar, and the name of its scroll region. */
  path: string;
  /** Tab label. Defaults to the path. */
  label?: string;
  /** Plain lines, coloured by the light tokenizer. */
  lines?: string[];
  /** Lines already highlighted elsewhere, as trusted HTML (one string per line). */
  highlighted?: string[];
  /** Raw text placed on the clipboard. Defaults to `lines` joined. */
  code?: string;
};

const props = withDefaults(
  defineProps<{
    /** code: line-numbered listing. diff: unified diff. command: one line to copy, no header and no numbers. */
    variant?: "code" | "diff" | "command";
    filename?: string;
    lines?: string[];
    /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `lines`. */
    highlighted?: string[];
    /** Raw text placed on the clipboard by Copy. Defaults to `lines` joined. */
    code?: string;
    diff?: CodeDiffRow[];
    /** Files shown as tabs in the one header row, with the active file's path and Copy. Replaces filename / lines. */
    files?: CodeBlockFile[];
    /** Body height in px past which the code scrolls (--fndn-code-block-max-height). */
    maxHeight?: number;
    /** Fixed body height in px (--fndn-code-block-height): the box keeps its size whatever the code. */
    height?: number;
    /** Fill the container's height (an editor pane): the body takes what the header leaves and scrolls. */
    fill?: boolean;
    /** The current line (1-based) of the listing, or of the active file: tinted, its number in ink. */
    currentLine?: number;
    /** Long lines wrap (default). Off: lines never wrap, the body scrolls sideways and the gutter stays. Off by default in the editor look. */
    wrap?: boolean;
    /** The body of an editor pane: no frame, no header, no copy, no path (the host gives the file tabs); fills its container. Shows `lines`, `highlighted` or `diff`; ignores `files`. */
    editor?: boolean;
    labels?: Partial<CodeBlockLabels>;
  }>(),
  { variant: "code", filename: "example.ts", lines: () => [], highlighted: undefined, code: undefined, diff: () => [], files: undefined, maxHeight: undefined, height: undefined, fill: false, currentLine: undefined, wrap: undefined, editor: false, labels: undefined },
);
/** v-model:file — the active file's path; falls back to local state when unbound. */
const file = defineModel<string>("file");
const emit = defineEmits<{ copy: [text: string]; fileChange: [path: string] }>();

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
/* names of choices are shown whole: the file tabs while they fit, else a pager and a select */
const fit = ref(true);
const isEditor = computed(() => props.editor && props.variant !== "command");
const r = computed(() => codeBlock({ variant: props.variant, files: hasFiles.value, fit: fit.value ? "tabs" : "select", fill: props.fill && props.variant !== "command", editor: isEditor.value, wrap: props.wrap ?? !isEditor.value }));
/* tok and piece take no variant */
const plain = codeBlock();
/* the two labels of Copy are label parts of the button */
const copyLabel = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

const text = computed<CodeBlockLabels>(() => ({ copy: "Copy", copied: "Copied", copyCode: "Copy code", files: "Files", file: "File", previousFile: "Previous file", nextFile: "Next file", ...props.labels }));
const raw = computed(() => props.code ?? props.lines.join("\n"));
const added = computed(() => props.diff.filter((r) => r.type === "add").length);
const removed = computed(() => props.diff.filter((r) => r.type === "del").length);
const hasFiles = computed(() => !(props.editor && props.variant !== "command") && !!props.files?.length);
const rootStyle = computed(() => {
  const vars: Record<string, string> = {};
  if (props.maxHeight != null) vars["--fndn-code-block-max-height"] = `${props.maxHeight}px`;
  if (props.height != null) vars["--fndn-code-block-height"] = `${props.height}px`;
  return Object.keys(vars).length ? vars : undefined;
});
const fileItems = computed(() => (props.files ?? []).map((f) => ({ value: f.path, label: f.label ?? f.path })));
const fileOf = (path: string) => props.files?.find((f) => f.path === path);
const fileCode = (f?: CodeBlockFile) => (f ? f.code ?? (f.lines ?? []).join("\n") : "");
const activePath = computed(() => (file.value !== undefined && fileOf(file.value) ? file.value : props.files?.[0]?.path ?? ""));
function onFile(path: string) { if (path === activePath.value) return; file.value = path; emit("fileChange", path); }
/* the current line of a body: only the active file's, never a diff's */
const isCurrent = (i: number, path?: string) => props.currentLine === i + 1 && props.variant !== "diff" && (path === undefined || path === activePath.value);
const activeIndex = computed(() => Math.max(0, (props.files ?? []).findIndex((f) => f.path === activePath.value)));

/* one "Copied" at a time: the key of the copy button that just copied */
const copied = ref<string | null>(null);
let pending: string | null = null;
const copier = createCopier((value) => { copied.value = value ? pending : null; });
async function copy(key: string, value: string) { pending = key; if (await copier.copy(value)) emit("copy", value); }
/* "Copied" belongs to the file that was copied: another file starts with a fresh Copy (keyed, so no fade) */
watch(activePath, () => { copier.stop(); copied.value = null; });

/* each body becomes a named scroll region while it overflows */
const root = ref<HTMLElement | null>(null);
let stops: (() => void)[] = [];
function watchBodies() {
  stops.forEach((s) => s());
  const names = hasFiles.value ? (props.files ?? []).map((f) => f.path) : [props.filename];
  stops = Array.from(root.value?.querySelectorAll<HTMLElement>("[data-slot=code-block-body]") ?? []).map((b, i) => watchOverflow(b, names[i] ?? props.filename));
}
onMounted(watchBodies);
watch(() => [props.filename, props.files, props.variant], () => nextTick(watchBodies));

let stopFit = () => {};
function watchFit() {
  stopFit();
  stopFit = () => {};
  const el = root.value;
  if (!hasFiles.value || !el) return;
  stopFit = watchFileTabs(el, (fits) => {
    const at = document.activeElement;
    const refocus = !!at && el.contains(at) && !!at.closest("[data-slot=tabs-list], [data-slot=pager], [data-slot=select]");
    fit.value = fits;
    if (refocus) nextTick(() => el.querySelector<HTMLElement>(fits ? '[data-slot=tabs-trigger][aria-selected="true"]' : "[data-slot=select] [data-slot=select-trigger]")?.focus());
  });
}
/* the path, a file name and the file select's value are cut in the middle, so the file name stays (full text in title) */
let stopMiddle = () => {};
function watchMiddle() {
  stopMiddle();
  stopMiddle = middleTruncation(root.value, "[data-slot=code-block-path], [data-slot=code-block-filename], [data-slot=select] [data-slot=select-value]", { when: looksLikePath });
}
onMounted(() => { watchFit(); watchMiddle(); revealCurrentLine(root.value); });
/* the current line stays in view when it (or the open file) changes; the page never scrolls */
watch(() => [props.currentLine, activePath.value], () => nextTick(() => revealCurrentLine(root.value)));
watch(() => [props.variant, hasFiles.value, (props.files ?? []).map((f) => `${f.path}\u0000${f.label ?? ""}`).join("\u0001")], () => nextTick(() => { watchFit(); watchMiddle(); }));
onBeforeUnmount(() => { copier.stop(); stops.forEach((s) => s()); stopFit(); stopMiddle(); });
</script>

<template>
  <div v-if="variant === 'command'" ref="root" v-bind="attrs" data-slot="code-block" :class="r.base({ class: attrs.class as string | undefined })" :style="rootStyle">
    <div data-slot="code-block-command" :class="r.command()">
      <code data-slot="code-block-code" :class="r.code()">{{ raw }}</code>
      <Button data-code-block="copy" :class="r.copy({ copied: copied === 'main' })" variant="ghost" size="xs" shape="rounded" muted :swapped="copied === 'main'" :aria-label="text.copyCode" :disabled="!raw" @click="copy('main', raw)">
          <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
          <span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copy }}</span><span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copied }}</span>
        </Button>
        <span data-slot="code-block-status" class="sr-only" role="status">{{ copied === "main" ? text.copied : "" }}</span>
    </div>
  </div>
  <div v-else-if="hasFiles" ref="root" v-bind="attrs" data-slot="code-block" :class="r.base({ class: attrs.class as string | undefined })" :style="rootStyle">
    <Tabs variant="underline" in-header :header-class="r.header()" :header-props="{ 'data-code-block': 'header' }" :aria-label="text.files" :items="fileItems" :value="activePath" @value-change="onFile">
      <template #end>
        <template v-if="!fit">
          <Pager :class="r.pager()" :count="files!.length" :page="activeIndex" loop :label="text.files" :unit="text.file" :prev-label="text.previousFile" :next-label="text.nextFile" @update:page="(p: number) => onFile(files![p]!.path)" />
          <Select :class="r.fileSelect()" size="sm" variant="subtle" :aria-label="text.file" :items="fileItems" :value="activePath" @update:value="(v: string | null) => v && onFile(v)" />
        </template>
        <span data-slot="code-block-path" :class="r.path()">{{ activePath }}</span>
        <Button :key="activePath" data-code-block="copy" :class="r.copy({ copied: copied === 'main' })" variant="ghost" size="xs" shape="rounded" muted :swapped="copied === 'main'" :aria-label="text.copyCode" :disabled="!fileCode(fileOf(activePath))" @click="copy('main', fileCode(fileOf(activePath)))">
          <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
          <span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copy }}</span><span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copied }}</span>
        </Button>
        <span data-slot="code-block-status" class="sr-only" role="status">{{ copied === "main" ? text.copied : "" }}</span>
      </template>
      <template #panel="{ item }">
        <div data-slot="code-block-body" :class="r.body()">
          <div data-slot="code-block-rows" :class="r.rows()">
            <template v-if="fileOf(item.value)?.highlighted">
              <div v-for="(html, i) in fileOf(item.value)!.highlighted" :key="i" data-slot="code-block-row" :class="r.row({ current: isCurrent(i, item.value) })" :aria-current="isCurrent(i, item.value) ? 'true' : undefined">
                <span data-slot="code-block-num" :class="r.num({ current: isCurrent(i, item.value) })">{{ i + 1 }}</span>
                <code data-slot="code-block-code" :class="r.code()" v-html="html" />
              </div>
            </template>
            <template v-else>
              <div v-for="(line, i) in fileOf(item.value)?.lines ?? []" :key="i" data-slot="code-block-row" :class="r.row({ current: isCurrent(i, item.value) })" :aria-current="isCurrent(i, item.value) ? 'true' : undefined">
                <span data-slot="code-block-num" :class="r.num({ current: isCurrent(i, item.value) })">{{ i + 1 }}</span>
                <code data-slot="code-block-code" :class="r.code()"><template v-for="(t, k) in tokenize(line)" :key="k"><span v-if="t.tok" data-slot="code-block-tok" :class="plain.tok({ tok: t.tok })">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></code>
              </div>
            </template>
          </div>
        </div>
      </template>
    </Tabs>
  </div>
  <div v-else ref="root" v-bind="attrs" data-slot="code-block" :class="r.base({ class: attrs.class as string | undefined })" :style="rootStyle">
    <div v-if="!isEditor" data-slot="code-block-header" :class="r.header()">
      <PhCode data-slot="code-block-file-icon" :class="r.fileIcon()" weight="bold" aria-hidden="true" />
      <span data-slot="code-block-filename" :class="r.filename()">{{ filename }}</span>
      <span v-if="variant === 'diff'" data-slot="code-block-stat" :class="r.stat()"><span>+{{ added }}</span><span>-{{ removed }}</span></span>
      <template v-else>
        <Button data-code-block="copy" :class="r.copy({ copied: copied === 'main' })" variant="ghost" size="xs" shape="rounded" muted :swapped="copied === 'main'" :aria-label="text.copyCode" :disabled="!raw" @click="copy('main', raw)">
          <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
          <span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copy }}</span><span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copied }}</span>
        </Button>
        <span data-slot="code-block-status" class="sr-only" role="status">{{ copied === "main" ? text.copied : "" }}</span>
      </template>
    </div>
    <div data-slot="code-block-body" :class="r.body()">
      <div data-slot="code-block-rows" :class="r.rows()">
        <template v-if="variant === 'diff'">
          <div v-for="(row, i) in diff" :key="i" data-slot="code-block-row" :class="r.row({ type: row.type })">
            <span v-if="row.type !== 'ctx'" data-slot="code-block-bar" :class="r.bar({ type: row.type })" aria-hidden="true" />
            <span data-slot="code-block-num" :class="r.num({ type: row.type })">{{ (row.type === "del" ? row.old : row.cur) ?? "" }}</span>
            <code data-slot="code-block-code" :class="r.code()"><template v-for="(p, j) in row.pieces" :key="j"><span v-if="p.change" data-slot="code-block-piece" :class="plain.piece({ change: p.change })"><template v-for="(t, k) in tokenize(p.text)" :key="k"><span v-if="t.tok" data-slot="code-block-tok" :class="plain.tok({ tok: t.tok })">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></span><template v-else><template v-for="(t, k) in tokenize(p.text)" :key="k"><span v-if="t.tok" data-slot="code-block-tok" :class="plain.tok({ tok: t.tok })">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></template></template></code>
          </div>
        </template>
        <template v-else-if="highlighted">
          <div v-for="(html, i) in highlighted" :key="i" data-slot="code-block-row" :class="r.row({ current: isCurrent(i) })" :aria-current="isCurrent(i) ? 'true' : undefined">
            <span data-slot="code-block-num" :class="r.num({ current: isCurrent(i) })">{{ i + 1 }}</span>
            <code data-slot="code-block-code" :class="r.code()" v-html="html" />
          </div>
        </template>
        <template v-else>
          <div v-for="(line, i) in lines" :key="i" data-slot="code-block-row" :class="r.row({ current: isCurrent(i) })" :aria-current="isCurrent(i) ? 'true' : undefined">
            <span data-slot="code-block-num" :class="r.num({ current: isCurrent(i) })">{{ i + 1 }}</span>
            <code data-slot="code-block-code" :class="r.code()"><template v-for="(t, k) in tokenize(line)" :key="k"><span v-if="t.tok" data-slot="code-block-tok" :class="plain.tok({ tok: t.tok })">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></code>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
