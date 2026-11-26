<script setup lang="ts">
/** A floating AI toolbar for selected text. Behaviour by Ark UI (Zag popover). */
import { Popover as ArkPopover, usePopover } from "@ark-ui/vue/popover";
import {
  PhArrowClockwise, PhChatText, PhCheck, PhCornersIn, PhListBullets, PhMagicWand, PhPencilSimple, PhQuestion, PhSparkle, PhTextAa, PhX,
} from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import Shimmer from "../shimmer/Shimmer.vue";
import Spinner from "../spinner/Spinner.vue";
import { selectionActions } from "./selection-actions.recipe";
import { streamingText } from "../streaming-text/streaming-text.recipe";
import { trackModality } from "../lib/modality";
import {
  anchorRect, clearNativeSelection, modeOf, restoreSelection, rovingToolbar, spliceResult, splitText, watchSelection,
  type SelectionAction, type TextRange,
} from "./selection-actions.logic";

export type { SelectionAction, SelectionActionIcon, TextRange } from "./selection-actions.logic";

/* the root element is the passage wrapper, not the popover provider: class and style go there */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = selectionActions();

const props = withDefaults(
  defineProps<{
    /** The action is running. */
    busy?: boolean;
    /** Actions offered while idle. */
    actions?: SelectionAction[];
    /** Overrides the status label while busy (an ellipsis is added). */
    busyLabel?: string;
    /** Name of the toolbar. */
    ariaLabel?: string;
  }>(),
  { busy: false, actions: () => [], ariaLabel: "Edit selection" },
);

/** v-model:text — the passage; Keep writes the result into it. */
const text = defineModel<string>("text", { default: "" });
/** v-model:selection — { start, end } offsets into text, or null. */
const selection = defineModel<TextRange | null>("selection", { default: null });
/** v-model:open — the toolbar is showing. */
const open = defineModel<boolean>("open", { default: false });
/** v-model:result — the action's output, shown in place of the selection. */
const result = defineModel<string>("result", { default: "" });
const emit = defineEmits<{
  textChange: [text: string];
  selectionChange: [selection: TextRange | null];
  openChange: [open: boolean];
  resultChange: [result: string];
  action: [detail: { value: string; text: string }];
  keep: [detail: { text: string; result: string }];
  discard: [];
}>();

const ICONS = {
  question: PhQuestion, sparkle: PhSparkle, "corners-in": PhCornersIn, "chat-text": PhChatText, "text-aa": PhTextAa,
  "magic-wand": PhMagicWand, "pencil-simple": PhPencilSimple, "list-bullets": PhListBullets,
} as const;

const setText = (v: string) => { text.value = v; emit("textChange", v); };
const setSelection = (v: TextRange | null) => { selection.value = v; emit("selectionChange", v); };
const setOpen = (v: boolean) => { if (open.value === v) return; open.value = v; emit("openChange", v); };
const setResult = (v: string) => { if (result.value === v) return; result.value = v; emit("resultChange", v); };

const last = ref<SelectionAction | null>(null);
const mode = computed(() => modeOf(props.busy, result.value));
const parts = computed(() => splitText(text.value, selection.value, result.value));
const label = computed(() => `${props.busyLabel ?? last.value?.busyLabel ?? "Editing"}…`);
const original = computed(() => (selection.value ? text.value.slice(selection.value.start, selection.value.end) : ""));

const passage = ref<{ $el: HTMLElement } | null>(null);
const content = ref<{ $el: HTMLElement } | null>(null);
const passageEl = () => passage.value?.$el ?? null;
let escaped = false;
let watcher: ReturnType<typeof watchSelection> | null = null;

/** The toolbar closed by itself: Escape, a press outside, focus leaving. */
function dismiss() {
  const wasEscape = escaped;
  escaped = false;
  const held = selection.value;
  const working = mode.value !== "idle";
  if (working) { setResult(""); emit("discard"); }
  setOpen(false);
  /* pressing in the passage starts a new selection: keep the mark until the press ends */
  if (!wasEscape && !working && watcher?.pressedInside()) return;
  setSelection(null);
  if (wasEscape) restoreSelection(passageEl(), held);
}
function onSelect(sel: TextRange | null) {
  if (mode.value !== "idle") return;
  if (!sel) { if (!open.value) setSelection(null); return; }
  clearNativeSelection();
  setSelection(sel);
  setOpen(true);
}

const popover = usePopover(() => ({
  open: open.value,
  autoFocus: true,
  restoreFocus: false,
  /* we portal it ourselves; false keeps Zag from redirecting Tab to a trigger there is none of */
  portalled: false,
  positioning: { placement: "bottom", gutter: 8, getAnchorRect: () => anchorRect(passageEl()) },
  onEscapeKeyDown: () => { escaped = true; },
  onOpenChange: (details: { open: boolean }) => { if (!details.open) dismiss(); },
}));

let stops: (() => void)[] = [];
onMounted(() => {
  trackModality();
  const p = passageEl();
  const c = content.value?.$el;
  if (!p || !c) return;
  watcher = watchSelection(p, onSelect);
  stops = [watcher.stop, rovingToolbar(c, passageEl, () => { escaped = true; })];
});
onBeforeUnmount(() => stops.forEach((s) => s()));
/* the mark grows as the result streams: keep the toolbar under it */
watch([open, result, mode, () => selection.value?.start, () => selection.value?.end], () => { if (open.value) popover.value.reposition(); }, { flush: "post" });

function run(action: SelectionAction) {
  last.value = action;
  emit("action", { value: action.value, text: original.value });
}
function retry() {
  const value = last.value?.value ?? props.actions.find((a) => a.busyLabel)?.value ?? props.actions[0]?.value ?? "";
  const textNow = original.value;
  setResult("");
  emit("action", { value, text: textNow });
}
function keep() {
  if (!selection.value) return;
  const kept = result.value;
  const next = spliceResult(text.value, selection.value, kept);
  setText(next.text);
  setResult("");
  emit("keep", { text: next.text, result: kept });
  setOpen(false);
  setSelection(null);
  restoreSelection(passageEl(), next.selection);
}
function discard() {
  const held = selection.value;
  setResult("");
  emit("discard");
  setOpen(false);
  setSelection(null);
  restoreSelection(passageEl(), held);
}
</script>

<template>
  <ArkPopover.RootProvider :value="popover">
    <div v-bind="attrs" data-slot="selection-actions" :class="r.base({ class: attrs.class as string | undefined })">
      <!-- one line: whitespace in here would become passage text and shift the offsets -->
      <ArkPopover.Anchor ref="passage" data-slot="selection-actions-text" :class="r.text()" tabindex="-1"><template v-if="parts">{{ parts.before }}<mark data-slot="selection-actions-mark" :class="r.mark({ open })">{{ parts.inner }}<span v-if="mode === 'busy' && result" data-slot="streaming-text-caret" :class="streamingText().caret()" aria-hidden="true" /></mark>{{ parts.after }}</template><template v-else>{{ text }}</template></ArkPopover.Anchor>
    </div>
    <Teleport to="body">
      <ArkPopover.Positioner data-slot="selection-actions-positioner" :class="r.positioner()">
        <ArkPopover.Content ref="content" data-slot="selection-actions-content" :class="r.content()" role="toolbar" :aria-label="ariaLabel">
          <template v-if="mode === 'idle'">
            <Button v-for="a in actions" :key="a.value" data-selection-actions="action" :class="r.action()" variant="ghost" size="sm" :data-value="a.value" @click="run(a)">
              <template #icon><component :is="ICONS[a.icon ?? 'sparkle']" data-slot="icon" :weight="!a.icon || a.icon === 'sparkle' ? 'fill' : 'bold'" /></template>
              {{ a.label }}
            </Button>
          </template>
          <span v-else-if="mode === 'busy'" data-slot="selection-actions-status" :class="r.status()" role="status">
            <Spinner size="sm" decorative />
            <span v-if="result" data-slot="selection-actions-label" :class="r.label()">{{ label }}</span>
            <Shimmer v-else speed="fast">{{ label }}</Shimmer>
          </span>
          <template v-else>
            <Button data-selection-actions="keep" :class="r.keep()" variant="primary" size="sm" @click="keep">
              <template #icon><PhCheck data-slot="icon" weight="bold" /></template>
              Keep
            </Button>
            <Button data-selection-actions="discard" :class="r.discard()" variant="ghost" size="sm" @click="discard">
              <template #icon><PhX data-slot="icon" weight="bold" /></template>
              Discard
            </Button>
            <span data-slot="selection-actions-separator" :class="r.separator()" aria-hidden="true" />
            <Button data-selection-actions="retry" :class="r.retry()" variant="ghost" size="sm" square aria-label="Try again" @click="retry">
              <template #icon><PhArrowClockwise data-slot="icon" weight="bold" /></template>
            </Button>
          </template>
        </ArkPopover.Content>
      </ArkPopover.Positioner>
    </Teleport>
  </ArkPopover.RootProvider>
</template>
