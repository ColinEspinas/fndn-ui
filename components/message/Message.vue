<script setup lang="ts">
/** One message of a conversation. */
import { PhArrowClockwise, PhCheck, PhCopy, PhPencilSimple, PhThumbsDown, PhThumbsUp } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useSlots } from "vue";
import Avatar from "../avatar/Avatar.vue";
import Button from "../button/Button.vue";
import Chip from "../chip/Chip.vue";
import { message } from "./message.recipe";
import Shimmer from "../shimmer/Shimmer.vue";
import Toggle from "../toggle/Toggle.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { createCopier, messageLabels, orderActions, type MessageAction as Action, type MessageFeedback as Feedback, type MessageLabels as Labels } from "./message.logic";
import { trackModality } from "../lib/modality";

export type MessageAction = Action;
export type MessageFeedback = Feedback;
export type MessageLabels = Labels;

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const slots = useSlots();

const props = withDefaults(
  defineProps<{
    /** user: the person's, a bubble at the end. assistant: plain text at the start. */
    role?: "user" | "assistant";
    /** Who wrote it, in the header. */
    name?: string;
    /** Shown beside the header: true for the name's initials, or an image URL. */
    avatar?: boolean | string;
    /** Where it came from, as a neutral Chip after the name (a file, a tool, a page). */
    source?: string;
    /** When, as shown ("2 min ago", "10:42"). */
    time?: string;
    /** The time as a machine-readable date (the <time> element's datetime). */
    datetime?: string;
    /** Plain text. For rich content (streaming text, tool chips, a code block) use the default slot. */
    text?: string;
    /** Still being written: aria-busy, no actions, and a "Thinking…" status while there is nothing yet. */
    streaming?: boolean;
    /** The actions offered under it, shown on hover and focus (always on touch). */
    actions?: MessageAction[];
    /** What Copy puts on the clipboard; defaults to text. */
    copyText?: string;
    labels?: Partial<MessageLabels>;
  }>(),
  { role: "assistant", name: undefined, avatar: false, source: undefined, time: undefined, datetime: undefined, text: undefined, streaming: false, actions: () => [], copyText: undefined, labels: undefined },
);
/** v-model:feedback — Good / Bad response. */
const feedback = defineModel<MessageFeedback>("feedback", { default: null });
const emit = defineEmits<{ action: [action: MessageAction]; feedbackChange: [feedback: MessageFeedback] }>();

const t = computed(() => messageLabels(props.labels));
const r = computed(() => message({ role: props.role, kept: feedback.value != null }));
const hasContent = computed(() => (props.text != null && props.text !== "") || !!slots.default);
const shown = computed(() => (props.streaming ? [] : orderActions(props.actions)));
const setFeedback = (next: MessageFeedback) => { feedback.value = next; emit("feedbackChange", next); };

const copied = ref(false);
const copier = createCopier((value) => { copied.value = value; });
async function copy() { if (await copier.copy(props.copyText ?? props.text ?? "")) emit("action", "copy"); }
onMounted(() => trackModality());
onBeforeUnmount(() => copier.stop());
</script>

<template>
  <article v-bind="attrs" data-slot="message" :class="r.base({ class: attrs.class as string | undefined })" :aria-busy="streaming || undefined">
    <Avatar v-if="avatar" data-message="avatar" :class="r.avatar()" :size="20" :name="name" :src="typeof avatar === 'string' ? avatar : undefined" />
    <div data-slot="message-main" :class="r.main()">
      <div v-if="name || source || time" data-slot="message-header" :class="r.header()">
        <span v-if="name" data-slot="message-name" :class="r.name()" :title="name">{{ name }}</span>
        <Chip v-if="source" data-message="source" :class="r.source()" :title="source">{{ source }}</Chip>
        <time v-if="time" data-slot="message-time" :class="r.time()" :datetime="datetime">{{ time }}</time>
      </div>
      <div data-slot="message-body" :class="r.body()">
        <p v-if="text != null && text !== ''" data-slot="message-text" :class="r.text()">{{ text }}</p>
        <slot v-else />
        <div v-if="streaming && !hasContent" data-slot="message-status" :class="r.status()" role="status"><Shimmer speed="fast">{{ `${t.thinking}…` }}</Shimmer></div>
      </div>
      <div v-if="shown.length" data-slot="message-actions" :class="r.actions()" role="group" :aria-label="t.actions">
        <template v-for="action in shown" :key="action">
          <Tooltip v-if="action === 'copy'" :content="copied ? t.copied : t.copy">
            <Button variant="ghost" size="xs" shape="rounded" square muted :swapped="copied" :aria-label="t.copy" @click="copy">
              <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
            </Button>
          </Tooltip>
          <Tooltip v-else-if="action === 'retry' || action === 'edit'" :content="t[action]">
            <Button variant="ghost" size="xs" shape="rounded" square muted :aria-label="t[action]" @click="emit('action', action)">
              <template #icon><PhArrowClockwise v-if="action === 'retry'" data-slot="icon" weight="bold" /><PhPencilSimple v-else data-slot="icon" weight="bold" /></template>
            </Button>
          </Tooltip>
          <Toggle
            v-else
            variant="ghost" size="xs" shape="rounded" square muted :tooltip="action === 'good' ? t.good : t.bad"
            :pressed="feedback === action"
            @pressed-change="(on: boolean) => { setFeedback(on ? action : null); emit('action', action); }"
          >
            <template #icon><PhThumbsUp v-if="action === 'good'" data-slot="icon" :weight="feedback === 'good' ? 'fill' : 'bold'" /><PhThumbsDown v-else data-slot="icon" :weight="feedback === 'bad' ? 'fill' : 'bold'" /></template>
          </Toggle>
        </template>
        <span v-if="shown.includes('copy')" data-slot="message-announce" class="sr-only" role="status">{{ copied ? t.copied : "" }}</span>
      </div>
    </div>
  </article>
</template>
