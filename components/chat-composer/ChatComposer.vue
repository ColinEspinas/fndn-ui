<script setup lang="ts">
/** A compact chat panel: tab strip, threads, composer. */
import { PhArrowUp, PhStop } from "@phosphor-icons/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import Message from "../message/Message.vue";
import Shimmer from "../shimmer/Shimmer.vue";
import { chatComposer } from "./chat-composer.recipe";
import Tabs from "../tabs/Tabs.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { chatComposerLabels, pressField, timeText, watchThreads, type ChatComposerLabels } from "./chat-composer.logic";
import { trackModality } from "../lib/modality";
import { autosize } from "../prompt-bar/prompt-bar.logic";
import { isSubmitKey } from "../prompt-bar/prompt-suggest";

export type ChatComposerMessage =
  | { role: "user"; text: string }
  | { role: "agent"; text: string; label?: string; source?: string; time?: string };
export type ChatComposerTab = { value: string; label?: string; messages?: ChatComposerMessage[] };
export type ChatComposerSubmit = { value: string; tab: string | null };

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = chatComposer();

const props = withDefaults(
  defineProps<{
    /** Prompts offered as pills; choosing one puts it in the composer. */
    suggestions?: string[];
    /** The agent is working: status instead of suggestions, send becomes stop. */
    busy?: boolean;
    /** Busy label (an ellipsis is added). */
    status?: string;
    placeholder?: string;
    /** Name of the tab list. */
    ariaLabel?: string;
    /** The fixed strings: { message, send, stop, time } ({time} is a step's duration). */
    labels?: Partial<ChatComposerLabels>;
  }>(),
  { suggestions: () => [], busy: false, status: "Thinking", placeholder: "Write a message…", ariaLabel: "Conversations" },
);

/** v-model:tabs — sending appends the user's message to the selected tab. */
const tabs = defineModel<ChatComposerTab[]>("tabs", { default: () => [] });
/** v-model:tab — the selected conversation; defaults to the first. */
const tab = defineModel<string>("tab");
/** v-model:value — the draft. */
const value = defineModel<string>("value", { default: "" });
const emit = defineEmits<{
  valueChange: [value: string];
  tabChange: [tab: string];
  tabsChange: [tabs: ChatComposerTab[]];
  submit: [detail: ChatComposerSubmit];
  stop: [];
}>();

const t = computed(() => chatComposerLabels(props.labels));
const current = computed(() => tab.value ?? tabs.value[0]?.value);
const items = computed(() => tabs.value.map((t) => ({ value: t.value, label: t.label ?? t.value })));
const messagesOf = (v: string) => tabs.value.find((t) => t.value === v)?.messages ?? [];

function setValue(next: string) {
  value.value = next;
  emit("valueChange", next);
}
function setTab(next: string | undefined) {
  if (next === undefined) return;
  tab.value = next;
  emit("tabChange", next);
}

function submit() {
  if (props.busy) { emit("stop"); return; }
  const text = value.value.trim();
  if (!text) return;
  const tabValue = current.value ?? null;
  const next = tabs.value.map((t) => (t.value === tabValue ? { ...t, messages: [...(t.messages ?? []), { role: "user" as const, text }] } : t));
  tabs.value = next;
  emit("tabsChange", next);
  emit("submit", { value: text, tab: tabValue });
  setValue("");
}
function onKeyDown(e: KeyboardEvent) {
  if (!isSubmitKey(e)) return;
  e.preventDefault();
  if (!props.busy) submit();
}
function suggest(text: string) {
  setValue(text);
  void nextTick(() => {
    const el = input.value;
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  });
}

const root = ref<HTMLElement | null>(null);
const field = ref<HTMLElement | null>(null);
const input = ref<HTMLTextAreaElement | null>(null);
let stops: (() => void)[] = [];
let sizing: ReturnType<typeof autosize> | null = null;
onMounted(() => {
  trackModality();
  if (!root.value || !field.value || !input.value) return;
  sizing = autosize(input.value);
  stops = [watchThreads(root.value), pressField(field.value, input.value)];
});
onBeforeUnmount(() => { stops.forEach((s) => s()); sizing?.stop(); });
watch(value, () => void nextTick(() => sizing?.update()));
</script>

<template>
  <div ref="root" v-bind="attrs" data-slot="chat-composer" :class="r.base({ class: attrs.class as string | undefined })">
    <Tabs data-chat-composer="tabs" :class="r.tabs()" :aria-label="ariaLabel" :items="items" :value="current" @update:value="setTab">
      <template #panel="{ item }">
        <div data-slot="chat-composer-thread" :class="r.thread()" role="log">
          <template v-for="(m, i) in messagesOf(item.value)" :key="i">
            <Message v-if="m.role === 'user'" data-chat-composer="message" :class="r.message()" role="user" :text="m.text" />
            <Message v-else data-chat-composer="message" :class="r.message()" role="assistant" :name="m.label" :source="m.source" :time="m.time ? timeText(m.time, t) : undefined" :text="m.text" />
          </template>
        </div>
      </template>
    </Tabs>
    <div data-slot="chat-composer-composer" :class="r.composer()">
      <div v-if="busy" data-slot="chat-composer-status" :class="r.status()" role="status"><Shimmer speed="fast">{{ status }}…</Shimmer></div>
      <div v-else-if="suggestions.length" data-slot="chat-composer-suggestions" :class="r.suggestions()">
        <Button v-for="(s, i) in suggestions" :key="i" data-chat-composer="suggestion" :class="r.suggestion()" variant="outline" size="sm" :title="s" @click="suggest(s)">{{ s }}</Button>
      </div>
      <div ref="field" data-slot="chat-composer-field" :class="r.field()">
        <textarea
          ref="input"
          data-slot="chat-composer-input" :class="r.input()"
          rows="1"
          :aria-label="t.message"
          :placeholder="placeholder"
          enterkeyhint="send"
          :value="value"
          @input="setValue(($event.target as HTMLTextAreaElement).value)"
          @keydown="onKeyDown"
        />
        <div data-slot="chat-composer-footer" :class="r.footer()">
          <Tooltip :content="busy ? t.stop : t.send">
            <Button
              data-chat-composer="send"
              :class="r.send()"
              variant="primary"
              size="sm"
              square
              :aria-label="busy ? t.stop : t.send"
              :disabled="!busy && !value.trim()"
              @click="submit"
            >
              <template #icon>
                <PhStop v-if="busy" data-slot="icon" weight="fill" />
                <PhArrowUp v-else data-slot="icon" weight="bold" />
              </template>
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  </div>
</template>
