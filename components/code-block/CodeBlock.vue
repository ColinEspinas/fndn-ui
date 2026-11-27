<script setup lang="ts">
/** A line-numbered listing, a unified diff, tabbed files or a one-line command, in a card. */
import { PhCheck, PhCode, PhCopy } from "@phosphor-icons/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import { button } from "../button/button.recipe";
import CodeView from "../code-view/CodeView.vue";
import type { CodeDiffRow, CodeViewLabels } from "../code-view/code-view.logic";
import { codeBlock } from "./code-block.recipe";
import Pager from "../pager/Pager.vue";
import Select from "../select/Select.vue";
import Tabs from "../tabs/Tabs.vue";
import { createCopier, watchFileTabs } from "./code-block.logic";
import { looksLikePath, middleTruncation } from "../lib/truncate";

type OwnLabels = { copy: string; copied: string; copyCode: string; files: string; file: string; previousFile: string; nextFile: string };
/** The block's words and its Code View's (the editor's), for translation. */
export type CodeBlockLabels = OwnLabels & CodeViewLabels;
/** One file of a tabbed code block. */
export type CodeBlockFile = {
  /** Shown in the file's bar, and the name of its scroll region. */
  path: string;
  /** Tab label. Defaults to the path. */
  label?: string;
  /** The file's text, lines separated by \n: shown (coloured by the light tokenizer) and copied. */
  value?: string;
  /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `value`. */
  highlighted?: string[];
};

const props = withDefaults(
  defineProps<{
    /** code: line-numbered listing. diff: unified diff. command: one line to copy, no header and no numbers. */
    variant?: "code" | "diff" | "command";
    filename?: string;
    /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `value`. Display only. */
    highlighted?: string[];
    diff?: CodeDiffRow[];
    /** Files shown as tabs in the one header row, with the active file's path and Copy. Replaces filename / value. */
    files?: CodeBlockFile[];
    /** Height in px of the code past which it scrolls. */
    maxHeight?: number;
    /** Fixed height in px of the code: the box keeps its size whatever the code. */
    height?: number;
    /** Fill the container's height: the code takes what the header leaves and scrolls. */
    fill?: boolean;
    /** The current line (1-based) of the listing, or of the active file. */
    currentLine?: number;
    /** Long lines wrap (default). Off: lines never wrap, the code scrolls sideways and the gutter stays. */
    wrap?: boolean;
    /** The code is an editor (the Code View's editable); Copy takes the edited text. Not for a diff or a command. */
    editable?: boolean;
    labels?: Partial<CodeBlockLabels>;
  }>(),
  { variant: "code", filename: "example.ts", highlighted: undefined, diff: () => [], files: undefined, maxHeight: undefined, height: undefined, fill: false, currentLine: undefined, wrap: true, editable: false, labels: undefined },
);
/** v-model:value — the code, lines separated by \n: shown and copied. */
const value = defineModel<string>("value", { default: "" });
/** v-model:file — the active file's path; falls back to local state when unbound. */
const file = defineModel<string>("file");
const emit = defineEmits<{ copy: [text: string]; fileChange: [path: string]; valueChange: [value: string]; currentLineChange: [line: number] }>();

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
/* names of choices are shown whole: the file tabs while they fit, else a pager and a select */
const fit = ref(true);
const hasFiles = computed(() => props.variant !== "command" && !!props.files?.length);
const r = computed(() => codeBlock({ variant: props.variant, files: hasFiles.value, fit: fit.value ? "tabs" : "select", fill: props.fill && props.variant !== "command" }));
/* the two labels of Copy are label parts of the button */
const copyLabel = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

const text = computed<OwnLabels & Partial<CodeViewLabels>>(() => ({ copy: "Copy", copied: "Copied", copyCode: "Copy code", files: "Files", file: "File", previousFile: "Previous file", nextFile: "Next file", ...props.labels }));
const added = computed(() => props.diff.filter((r) => r.type === "add").length);
const removed = computed(() => props.diff.filter((r) => r.type === "del").length);
const fileItems = computed(() => (props.files ?? []).map((f) => ({ value: f.path, label: f.label ?? f.path })));
const fileOf = (path: string) => props.files?.find((f) => f.path === path);
/* with files, the edits of each file, kept while another file is open */
const edits = ref<Record<string, string>>({});
const fileText = (f?: CodeBlockFile) => (f ? edits.value[f.path] ?? f.value ?? "" : "");
function edit(path: string, v: string) { edits.value = { ...edits.value, [path]: v }; emit("valueChange", v); }
function editOwn(v: string) { value.value = v; emit("valueChange", v); }
const activePath = computed(() => (file.value !== undefined && fileOf(file.value) ? file.value : props.files?.[0]?.path ?? ""));
function onFile(path: string) { if (path === activePath.value) return; file.value = path; emit("fileChange", path); }
const activeIndex = computed(() => Math.max(0, (props.files ?? []).findIndex((f) => f.path === activePath.value)));

/* one "Copied" at a time: the key of the copy button that just copied */
const copied = ref<string | null>(null);
let pending: string | null = null;
const copier = createCopier((on) => { copied.value = on ? pending : null; });
async function copy(key: string, content: string) { pending = key; if (await copier.copy(content)) emit("copy", content); }
/* "Copied" belongs to the file that was copied: another file starts with a fresh Copy (keyed, so no fade) */
watch(activePath, () => { copier.stop(); copied.value = null; });

const root = ref<HTMLElement | null>(null);
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
onMounted(() => { watchFit(); watchMiddle(); });
watch(() => [props.variant, hasFiles.value, (props.files ?? []).map((f) => `${f.path}\u0000${f.label ?? ""}`).join("\u0001")], () => nextTick(() => { watchFit(); watchMiddle(); }));
onBeforeUnmount(() => { copier.stop(); stopFit(); stopMiddle(); });
</script>

<template>
  <div v-if="variant === 'command'" ref="root" v-bind="attrs" data-slot="code-block" :class="r.base({ class: attrs.class as string | undefined })">
    <div data-slot="code-block-command" :class="r.command()">
      <code data-slot="code-block-code" :class="r.code()">{{ value }}</code>
      <Button data-code-block="copy" :class="r.copy({ copied: copied === 'main' })" variant="ghost" size="xs" shape="rounded" muted :swapped="copied === 'main'" :aria-label="text.copyCode" :disabled="!value" @click="copy('main', value)">
          <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
          <span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copy }}</span><span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copied }}</span>
        </Button>
        <span data-slot="code-block-status" class="sr-only" role="status">{{ copied === "main" ? text.copied : "" }}</span>
    </div>
  </div>
  <div v-else-if="hasFiles" ref="root" v-bind="attrs" data-slot="code-block" :class="r.base({ class: attrs.class as string | undefined })">
    <Tabs variant="underline" in-header :header-class="r.header()" :header-props="{ 'data-code-block': 'header' }" :aria-label="text.files" :items="fileItems" :value="activePath" @value-change="onFile">
      <template #end>
        <template v-if="!fit">
          <Pager :class="r.pager()" :count="files!.length" :page="activeIndex" loop :label="text.files" :unit="text.file" :prev-label="text.previousFile" :next-label="text.nextFile" @update:page="(p: number) => onFile(files![p]!.path)" />
          <Select :class="r.fileSelect()" size="sm" variant="subtle" :aria-label="text.file" :items="fileItems" :value="activePath" @update:value="(v: string | null) => v && onFile(v)" />
        </template>
        <span data-slot="code-block-path" :class="r.path()">{{ activePath }}</span>
        <Button :key="activePath" data-code-block="copy" :class="r.copy({ copied: copied === 'main' })" variant="ghost" size="xs" shape="rounded" muted :swapped="copied === 'main'" :aria-label="text.copyCode" :disabled="!fileText(fileOf(activePath))" @click="copy('main', fileText(fileOf(activePath)))">
          <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
          <span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copy }}</span><span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copied }}</span>
        </Button>
        <span data-slot="code-block-status" class="sr-only" role="status">{{ copied === "main" ? text.copied : "" }}</span>
      </template>
      <template #panel="{ item }">
        <CodeView
          data-code-block="view" :class="r.view()" :wrap="wrap" :height="height" :max-height="maxHeight" :labels="text" :label="item.value"
          :value="fileText(fileOf(item.value))" :highlighted="fileOf(item.value)?.highlighted" :editable="editable" :current-line="item.value === activePath ? currentLine : undefined"
          @update:value="(v: string) => edit(item.value, v)" @current-line-change="(n: number) => emit('currentLineChange', n)"
        />
      </template>
    </Tabs>
  </div>
  <div v-else ref="root" v-bind="attrs" data-slot="code-block" :class="r.base({ class: attrs.class as string | undefined })">
    <div data-slot="code-block-header" :class="r.header()">
      <PhCode data-slot="code-block-file-icon" :class="r.fileIcon()" weight="bold" aria-hidden="true" />
      <span data-slot="code-block-filename" :class="r.filename()">{{ filename }}</span>
      <span v-if="variant === 'diff'" data-slot="code-block-stat" :class="r.stat()"><span>+{{ added }}</span><span>-{{ removed }}</span></span>
      <template v-else>
        <Button data-code-block="copy" :class="r.copy({ copied: copied === 'main' })" variant="ghost" size="xs" shape="rounded" muted :swapped="copied === 'main'" :aria-label="text.copyCode" :disabled="!value" @click="copy('main', value)">
          <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
          <span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copy }}</span><span data-slot="button-label" :class="copyLabel" aria-hidden="true">{{ text.copied }}</span>
        </Button>
        <span data-slot="code-block-status" class="sr-only" role="status">{{ copied === "main" ? text.copied : "" }}</span>
      </template>
    </div>
    <CodeView
      v-if="variant === 'diff'"
      data-code-block="view" :class="r.view()" :wrap="wrap" :height="height" :max-height="maxHeight" :labels="text" :label="filename" :diff="diff"
    />
    <CodeView
      v-else
      data-code-block="view" :class="r.view()" :wrap="wrap" :height="height" :max-height="maxHeight" :labels="text" :label="filename"
      :value="value" :highlighted="highlighted" :editable="editable" :current-line="currentLine"
      @update:value="editOwn" @current-line-change="(n: number) => emit('currentLineChange', n)"
    />
  </div>
</template>
