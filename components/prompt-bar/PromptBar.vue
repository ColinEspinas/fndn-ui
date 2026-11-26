<script setup lang="ts">
/** The composer of an agent surface. */
import {
  PhArrowUp, PhAt, PhChartBar, PhChatCircle, PhDatabase, PhEnvelopeSimple, PhFile, PhFileText, PhFolder, PhGlobe, PhLink,
  PhMicrophone, PhPaperclip, PhPlus, PhStack, PhStop, PhUsers,
} from "@phosphor-icons/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch, type Component } from "vue";
import Button from "../button/Button.vue";
import { button } from "../button/button.recipe";
import { promptBar } from "./prompt-bar.recipe";
import Menu, { type MenuEntry } from "../menu/Menu.vue";
import Select from "../select/Select.vue";
import EmptyState from "../empty-state/EmptyState.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import Tag from "../tag/Tag.vue";
import { glide } from "../lib/glide";
import { looksLikePath, middleTruncation, truncationTitles } from "../lib/truncate";
import { trackModality } from "../lib/modality";
import { autosize, flipRow, focusAfterRemove, sweep, wideLayout } from "./prompt-bar.logic";
import {
  applySuggestion, filterOptions, insertionFor, isSubmitKey, parseToken, placeList, revealOption, suggestKey, type SuggestKind,
} from "./prompt-suggest";

export type PromptBarSourceIcon = "database" | "chart-bar" | "stack" | "globe" | "file-text" | "folder" | "link" | "users" | "envelope-simple" | "chat-circle" | "at";
export type PromptBarModel = { value: string; label: string; meta?: string };
export type PromptBarSource = { value: string; label: string; description?: string; icon?: PromptBarSourceIcon };
export type PromptBarCommand = { value: string; label?: string; description?: string };
export type PromptBarAttachment = string | { name: string };
export type PromptBarSubmit = { value: string; model: string | null; attachments: PromptBarAttachment[] };

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Radius only. rounded: card radius. pill: fully round while it is one line. */
    shape?: "pill" | "rounded";
    placeholder?: string;
    models?: ReadonlyArray<PromptBarModel>;
    /** Typing @ lists them; also listed in the attach menu. */
    sources?: ReadonlyArray<PromptBarSource>;
    /** Typing / lists them. */
    commands?: ReadonlyArray<PromptBarCommand>;
    /** The agent is working: send becomes stop, Enter does not send. */
    busy?: boolean;
    ariaLabel?: string;
  }>(),
  { shape: "rounded", placeholder: "Write a message…", models: () => [], sources: () => [], commands: () => [], busy: false, ariaLabel: "Prompt" },
);

/** v-model:value, v-model:model, v-model:attachments, v-model:dictating — local state when unbound. */
const value = defineModel<string>("value", { default: "" });
const model = defineModel<string | null>("model", { default: null });
const attachments = defineModel<ReadonlyArray<PromptBarAttachment>>("attachments", { default: () => [] });
const dictating = defineModel<boolean>("dictating", { default: false });
const emit = defineEmits<{
  valueChange: [value: string];
  modelChange: [model: string];
  attachmentsChange: [attachments: PromptBarAttachment[]];
  dictatingChange: [dictating: boolean];
  submit: [detail: PromptBarSubmit];
  stop: [];
  attach: [];
}>();

const GLYPHS: Record<PromptBarSourceIcon, Component> = {
  database: PhDatabase, "chart-bar": PhChartBar, stack: PhStack, globe: PhGlobe, "file-text": PhFileText, folder: PhFolder,
  link: PhLink, users: PhUsers, "envelope-simple": PhEnvelopeSimple, "chat-circle": PhChatCircle, at: PhAt,
};
const glyph = (icon: PromptBarSourceIcon | undefined) => GLYPHS[icon ?? "at"] ?? PhAt;
const nameOf = (a: PromptBarAttachment) => (typeof a === "string" ? a : a.name);

const id = useId();
const caret = ref(value.value.length);
const dismissed = ref(false);
const active = ref(0);
const expanded = ref(false);
const currentModel = computed(() => model.value ?? props.models[0]?.value ?? null);

const root = ref<HTMLElement | null>(null);
const composer = ref<HTMLElement | null>(null);
const row = ref<HTMLElement | null>(null);
const input = ref<HTMLTextAreaElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const positioners: Record<SuggestKind, HTMLElement | null> = { source: null, command: null };
const listboxes: Record<SuggestKind, HTMLElement | null> = { source: null, command: null };
const highlights: Record<SuggestKind, HTMLElement | null> = { source: null, command: null };

type Option = { value: string; label: string; description?: string; icon?: PromptBarSourceIcon };
const optionsOf = (kind: SuggestKind): Option[] =>
  kind === "source" ? props.sources.map((s) => ({ ...s })) : props.commands.map((c) => ({ ...c, label: (c.label ?? `/${c.value}`).replace(/^\//, "") }));
const shownLabel = (kind: SuggestKind, option: Option, i: number) => (kind === "source" ? option.label : props.commands[i]!.label ?? `/${props.commands[i]!.value}`);

const token = computed(() => (dismissed.value ? null : parseToken(value.value, caret.value)));
const openKind = computed<SuggestKind | null>(() => {
  const t = token.value;
  return t && (t.kind === "source" ? props.sources.length : props.commands.length) ? t.kind : null;
});
const visible = computed(() => (openKind.value && token.value ? filterOptions(openKind.value, token.value.query, optionsOf(openKind.value)) : []));
const activeIndex = computed(() => Math.min(active.value, Math.max(visible.value.length - 1, 0)));
const optionId = (kind: SuggestKind, index: number) => `${id}-${kind}-${index}`;
const activeId = computed(() => {
  const kind = openKind.value;
  if (!kind || !visible.value.length) return undefined;
  return optionId(kind, optionsOf(kind).findIndex((o) => o.value === visible.value[activeIndex.value]!.value));
});
const canSend = computed(() => value.value.trim().length > 0 || attachments.value.length > 0);

const lists = computed(() => (["source", "command"] as const).map((kind) => {
  const all = optionsOf(kind);
  const open = openKind.value === kind;
  const shown = new Set(open ? visible.value.map((o) => o.value) : all.map((o) => o.value));
  let index = -1;
  const rows = all.map((option, i) => {
    const isShown = shown.has(option.value);
    if (isShown) index++;
    return { option, i, isShown, position: index, on: open && isShown && index === activeIndex.value };
  });
  return {
    kind, open, rows,
    label: kind === "source" ? "Sources" : "Commands",
    footer: kind === "source" ? "Type to search sources" : "Type to search commands",
  };
}));

const menuItems = computed<MenuEntry[]>(() => [
  { value: "attach-files", label: "Add photos & files", icon: PhPaperclip },
  ...(props.sources.length ? [{ type: "separator" } as const] : []),
  ...props.sources.map((s) => ({ value: `source:${s.value}`, label: s.label, icon: glyph(s.icon) })),
]);

/* the textarea is driven through the DOM, so every target renders the same markup */
let nextCaret: number | null = null;
const syncInput = () => {
  const el = input.value;
  if (!el) return;
  if (el.value !== value.value) el.value = value.value;
  if (nextCaret !== null && document.activeElement === el) el.setSelectionRange(nextCaret, nextCaret);
  nextCaret = null;
  expanded.value = wideLayout(row.value, el, value.value);
  sizing?.update();
};
watch(value, () => nextTick(syncInput));

function setValue(next: string, at = next.length) {
  caret.value = at;
  nextCaret = at;
  if (next !== value.value) {
    value.value = next;
    emit("valueChange", next);
  }
  void nextTick(syncInput);
}
function setAttachments(next: PromptBarAttachment[]) {
  attachments.value = next;
  emit("attachmentsChange", next);
}
function accept(index: number) {
  const option = visible.value[index];
  const kind = openKind.value;
  if (!kind || !token.value || !option) return;
  const next = applySuggestion(value.value, token.value, insertionFor(kind, option));
  dismissed.value = false;
  active.value = 0;
  setValue(next.value, next.caret);
  input.value?.focus();
}
function submit() {
  if (props.busy) { emit("stop"); return; }
  if (!canSend.value) return;
  emit("submit", { value: value.value, model: currentModel.value, attachments: [...attachments.value] });
  void sweep(canvas.value, !!root.value && getComputedStyle(root.value).direction === "rtl");
  if (attachments.value.length) setAttachments([]);
  dismissed.value = false;
  setValue("");
}
function syncCaret() {
  const at = input.value?.selectionStart ?? value.value.length;
  if (at !== caret.value) caret.value = at;
}
function onInput(e: Event) {
  const el = e.currentTarget as HTMLTextAreaElement;
  dismissed.value = false;
  active.value = 0;
  setValue(el.value, el.selectionStart ?? el.value.length);
}
function onKeyDown(e: KeyboardEvent) {
  const action = suggestKey(e, !!openKind.value, visible.value.length, activeIndex.value);
  if (action) {
    e.preventDefault();
    if (action.type === "move") active.value = action.index;
    else if (action.type === "accept") accept(action.index);
    else dismissed.value = true;
    return;
  }
  if (isSubmitKey(e)) { e.preventDefault(); if (!props.busy) submit(); }
}
function onKeyUp(e: KeyboardEvent) { if (!["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(e.key)) syncCaret(); }
function onBlur() { if (openKind.value) dismissed.value = true; }
function onFocus() { if (dismissed.value) { dismissed.value = false; syncCaret(); } }
function onModel(next: string | null) {
  if (!next) return;
  model.value = next;
  emit("modelChange", next);
}
function onDictate() {
  dictating.value = !dictating.value;
  emit("dictatingChange", dictating.value);
}
function onMenuSelect(picked: string) {
  if (picked === "attach-files") { emit("attach"); return; }
  const source = props.sources.find((s) => `source:${s.value}` === picked);
  if (!source) return;
  const glue = value.value && !/\s$/.test(value.value) ? " " : "";
  setValue(`${value.value}${glue}${insertionFor("source", source)}`);
  /* the menu hands focus back to its trigger as it closes; take it on to the textarea */
  setTimeout(() => { const el = input.value; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 0);
}
function removeAttachment(index: number) {
  setAttachments(attachments.value.filter((_, i) => i !== index));
  /* keep focus in the bar: the chip that takes this one's place, else the textarea */
  void nextTick(() => focusAfterRemove(root.value, index, input.value));
}
function onPointer(kind: SuggestKind, position: number, isShown: boolean) {
  if (openKind.value === kind && isShown && position !== activeIndex.value) active.value = position;
}
function onOptionClick(kind: SuggestKind, position: number) {
  if (openKind.value === kind) accept(position);
}

let unplace: (() => void) | null = null;
watch(openKind, (kind) => {
  unplace?.(); unplace = null;
  if (kind && composer.value && positioners[kind]) unplace = placeList(composer.value, positioners[kind]!);
}, { flush: "post" });
watch([activeId, openKind], () => { if (openKind.value) revealOption(listboxes[openKind.value], activeId.value); }, { flush: "post" });

/* the buttons follow the bar's shape (radius only) */
/* the buttons follow the bar's shape (radius only) */
const btnShape = computed(() => (props.shape === "rounded" ? "rounded" : "pill"));
const r = computed(() => promptBar({ shape: props.shape, expanded: expanded.value }));
/* the button recipe on a <button> of our own: the level bars must be its direct flex item */
const dictateButton = computed(() => button({ variant: "ghost", size: "sm", shape: btnShape.value, square: true, muted: true }));
const sendLabel = computed(() => (props.busy ? "Stop generating" : "Send"));
const dictateLabel = computed(() => (dictating.value ? "Stop dictation" : "Start dictation"));

let sizing: ReturnType<typeof autosize> | null = null;
let observer: ResizeObserver | null = null;
const stops: (() => void)[] = [];
onMounted(() => {
  trackModality();
  for (const kind of ["source", "command"] as const) {
    if (listboxes[kind] && highlights[kind]) stops.push(glide(listboxes[kind]!, highlights[kind]!, { rows: "[data-slot=prompt-bar-option]", follow: "highlighted" }));
    /* a description cut by its ellipsis (it gives way to the label) carries its full text as a title */
    stops.push(truncationTitles(listboxes[kind], "[data-slot=prompt-bar-option-description]"));
  }
  /* an attachment named by a file is cut in the middle, so its extension stays (full name in title) */
  stops.push(middleTruncation(composer.value, "[data-prompt-bar=attachment] > [data-slot=tag-label]", { when: looksLikePath }));
  if (input.value) sizing = autosize(input.value);
  syncInput();
  if (openKind.value && composer.value && positioners[openKind.value]) unplace = placeList(composer.value, positioners[openKind.value]!);
  /* the layout switch travels: the controls glide to their new row and the composer grows with them */
  if (row.value && composer.value) stops.push(flipRow(row.value, composer.value));
  if (row.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => { expanded.value = wideLayout(row.value, input.value, value.value); });
    observer.observe(row.value);
  }
});
onBeforeUnmount(() => { stops.forEach((s) => s()); sizing?.stop(); observer?.disconnect(); unplace?.(); });
</script>

<template>
  <div
    ref="root"
    v-bind="attrs"
    data-slot="prompt-bar"
    :class="r.base({ class: attrs.class as string | undefined })"
  >
    <div ref="composer" data-slot="prompt-bar-composer" :class="r.composer()">
      <canvas ref="canvas" data-slot="prompt-bar-sweep" :class="r.sweep()" aria-hidden="true" />
      <div v-if="attachments.length" data-slot="prompt-bar-attachments" :class="r.attachments()" role="list" aria-label="Attachments">
        <Tag v-for="(a, i) in attachments" :key="`${nameOf(a)}-${i}`" data-prompt-bar="attachment" :class="r.attachment()" tone="neutral" :shape="shape === 'pill' ? 'pill' : 'rounded'" role="listitem"
          removable :remove-label="`Remove ${nameOf(a)}`" :remove-tooltip="`Remove ${nameOf(a)}`" :remove-props="{ 'data-prompt-bar': 'attachment-remove' }" @remove="removeAttachment(i)">
          <!-- the name sits against the tags: whitespace around it would reach the Tag's title -->
          <template #icon><PhFile data-slot="icon" weight="bold" /></template>{{ nameOf(a) }}</Tag>
      </div>
      <div ref="row" data-slot="prompt-bar-row" :class="r.row()">
        <Menu data-prompt-bar="attach" :class="r.attach()" placement="top-start" :items="menuItems" @select="onMenuSelect">
          <template #trigger>
            <Tooltip content="Add attachments and sources">
              <Button data-menu="trigger" data-prompt-bar="attach-trigger" :class="r.attachTrigger()" variant="ghost" size="sm" :shape="btnShape" square muted aria-label="Add attachments and sources">
                <template #icon><PhPlus data-slot="icon" weight="bold" /></template>
              </Button>
            </Tooltip>
          </template>
        </Menu>
        <textarea
          ref="input"
          data-slot="prompt-bar-input" :class="r.input()"
          rows="1"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="openKind ? 'true' : 'false'"
          :aria-controls="openKind ? `${id}-${openKind}s` : undefined"
          :aria-activedescendant="activeId"
          :aria-label="ariaLabel"
          :placeholder="dictating ? 'Listening…' : placeholder"
          enterkeyhint="send"
          @input="onInput"
          @keydown="onKeyDown"
          @keyup="onKeyUp"
          @click="syncCaret"
          @blur="onBlur"
          @focus="onFocus"
        />
        <Select data-prompt-bar="model"
          :class="r.model()"
          :items="models"
          :value="currentModel"
          size="sm"
          variant="ghost"
          placement="top-start"
          aria-label="Choose model"
          @update:value="onModel"
        />
        <Tooltip :content="dictateLabel">
          <button
            type="button"
            data-slot="button"
            :class="dictateButton.base({ class: r.dictate() })"
            data-prompt-bar="dictate"
            :aria-pressed="dictating ? 'true' : 'false'"
            :aria-label="dictateLabel"
            @click="onDictate"
          >
            <span data-slot="button-icon" :class="dictateButton.icon()" aria-hidden="true"><PhMicrophone data-slot="icon" weight="bold" /></span>
            <span data-slot="prompt-bar-bars" :class="r.bars()" aria-hidden="true"><span data-slot="prompt-bar-bar" :class="r.bar()" /><span data-slot="prompt-bar-bar" :class="r.bar()" /><span data-slot="prompt-bar-bar" :class="r.bar()" /></span>
          </button>
        </Tooltip>
        <Tooltip :content="sendLabel">
          <Button data-prompt-bar="send" :class="r.send()" variant="primary" size="sm" :shape="btnShape" square :icon-size="busy ? 12 : undefined" :aria-label="sendLabel" :disabled="!busy && !canSend" @click="submit">
            <template #icon>
              <PhStop v-if="busy" data-slot="icon" weight="fill" />
              <PhArrowUp v-else data-slot="icon" weight="bold" />
            </template>
          </Button>
        </Tooltip>
      </div>
    </div>
    <Teleport v-for="l in lists" :key="l.kind" to="body">
      <div :ref="(el) => (positioners[l.kind] = el as HTMLElement | null)" data-slot="prompt-bar-positioner" :class="r.positioner()" data-scope="prompt-bar" data-part="positioner">
        <div data-slot="prompt-bar-list" :class="r.list()" :data-kind="l.kind" :data-state="l.open ? 'open' : 'closed'" :hidden="!l.open">
          <div
            :ref="(el) => (listboxes[l.kind] = el as HTMLElement | null)"
            :id="`${id}-${l.kind}s`"
            data-slot="prompt-bar-options" :class="r.options()"
            role="listbox"
            :aria-label="l.label"
            @mousedown.prevent
          >
            <span :ref="(el) => (highlights[l.kind] = el as HTMLElement | null)" data-slot="prompt-bar-highlight" :class="r.highlight()" aria-hidden="true" />
            <div
              v-for="o in l.rows"
              :id="optionId(l.kind, o.i)"
              :key="o.option.value"
              data-slot="prompt-bar-option" :class="r.option()"
              role="option"
              :aria-selected="o.on ? 'true' : 'false'"
              :data-value="o.option.value"
              :data-highlighted="o.on ? '' : undefined"
              :hidden="!o.isShown"
              @pointermove="onPointer(l.kind, o.position, o.isShown)"
              @click="onOptionClick(l.kind, o.position)"
            >
              <span v-if="l.kind === 'source'" data-slot="prompt-bar-option-icon" :class="r.optionIcon()" aria-hidden="true"><component :is="glyph(o.option.icon)" data-slot="icon" weight="bold" /></span>
              <span data-slot="prompt-bar-option-label" :class="r.optionLabel()">{{ shownLabel(l.kind, o.option, o.i) }}</span>
              <span v-if="o.option.description" data-slot="prompt-bar-option-description" :class="r.optionDescription()">{{ o.option.description }}</span>
            </div>
          </div>
          <EmptyState data-prompt-bar="empty" title="No matches" :hidden="!l.open || visible.length > 0" />
          <div data-slot="prompt-bar-footer" :class="r.footer()">{{ l.footer }}</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
