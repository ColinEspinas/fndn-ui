<script setup lang="ts">
/** Streamed answer with inline sources, actions and follow-ups. */
import { PhArrowCounterClockwise, PhArrowElbowDownLeft, PhCopy, PhThumbsDown, PhThumbsUp } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, ref, useAttrs, watch, type Component } from "vue";
import Avatar from "../avatar/Avatar.vue";
import Button from "../button/Button.vue";
import { streamingText } from "./streaming-text.recipe";
import Collapsible from "../collapsible/Collapsible.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { initialsOf, maxInitials } from "../avatar/avatar.logic";
import { stallTimer } from "./streaming-text.logic";

/** One streamed word, or a cite placeholder that renders an inline source chip (index into sources, or true for the first). */
export type StreamingToken = { text: string; cite?: boolean | number };
export type StreamingSource = { name: string; domain: string; href: string; image: string };
export type StreamingAction = "copy" | "retry" | "up" | "down";

const props = withDefaults(
  defineProps<{
    /** The tokens streamed so far. The host appends to it and flips `done`. */
    content: StreamingToken[];
    sources?: StreamingSource[];
    followUps?: string[];
    done?: boolean;
    /** Fill the parent width (and drop the reserved height). */
    fill?: boolean;
    sourcesLabel?: string;
    followUpsLabel?: string;
    /** Announced once done. */
    statusLabel?: string;
    /** Enter on mount: the caret fades in, cites already streamed pop in, follow-ups of an answer mounted done rise. Off by default; set it on the answer your code adds live, never on one rendered from history or with the page. Cites streamed later and follow-ups that come with done enter either way. */
    appear?: boolean;
  }>(),
  { sources: () => [], followUps: () => [], done: false, fill: false, sourcesLabel: "Sources", followUpsLabel: "Follow-ups", statusLabel: "Answer complete", appear: false },
);
/** v-model:sourcesOpen */
const sourcesOpen = defineModel<boolean>("sourcesOpen", { default: false });
const emit = defineEmits<{ followUp: [text: string, index: number]; action: [action: StreamingAction] }>();

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
/* a stream with no new word for a while: the caret blinks until the next one */
const stalled = ref(false);
const rootRef = ref<HTMLElement | null>(null);
let cancelStall = () => {};
const progress = computed(() => `${props.content.length}:${props.content[props.content.length - 1]?.text?.length ?? 0}`);
watch([progress, () => props.done, rootRef], () => {
  cancelStall();
  stalled.value = false;
  if (props.done || !rootRef.value) return;
  cancelStall = stallTimer(rootRef.value, () => { stalled.value = true; });
}, { immediate: true, flush: "post" });
onBeforeUnmount(() => cancelStall());
const r = computed(() => streamingText({ done: props.done, fill: props.fill, stalled: stalled.value && !props.done }));
/* without appear, what is here at mount is simply there; what streams in later enters */
const atMount = { appear: props.appear, tokens: props.content.length, done: props.done };

const ACTIONS: { key: StreamingAction; label: string; icon: Component }[] = [
  { key: "copy", label: "Copy", icon: PhCopy },
  { key: "retry", label: "Retry", icon: PhArrowCounterClockwise },
  { key: "up", label: "Good answer", icon: PhThumbsUp },
  { key: "down", label: "Bad answer", icon: PhThumbsDown },
];
const isCite = (token: StreamingToken) => token.cite !== undefined && token.cite !== false;
const sourceFor = (token: StreamingToken) => props.sources[token.cite === true ? 0 : (token.cite as number)];
/* a source's initials under its image (shown while it loads or if it fails) */
const letters = (s: StreamingSource, size: 12 | 14 | 16) => initialsOf(s.name, maxInitials(size));
/* the list opens only once the answer is done */
function onSources(open: boolean) { sourcesOpen.value = open; }
</script>

<template>
  <div ref="rootRef" v-bind="attrs" data-slot="streaming-text" :class="r.base({ class: attrs.class as string | undefined })" :aria-busy="done ? undefined : 'true'">
    <span data-slot="streaming-text-status" :class="r.status()" role="status">{{ done ? statusLabel : "" }}</span>
    <p data-slot="streaming-text-text" :class="r.text()">
      <template v-for="(token, i) in content" :key="i">
        <template v-if="isCite(token)">
          <a v-if="sourceFor(token)" data-slot="streaming-text-cite" :class="r.cite({ appear: atMount.appear || i >= atMount.tokens })" :href="sourceFor(token)!.href" target="_blank" rel="noreferrer">
            <Avatar data-streaming-text="cite-avatar" :class="r.citeAvatar()" :src="sourceFor(token)!.image" :initials="letters(sourceFor(token)!, 12)" :size="12" shape="square" />
            <span>{{ sourceFor(token)!.domain }}</span>
          </a>
        </template>
        <span v-else>{{ `${token.text} ` }}</span>
      </template>
      <span data-slot="streaming-text-caret" :class="r.caret({ appear: atMount.appear, stalled: stalled && !done })" aria-hidden="true" />
    </p>

    <div data-slot="streaming-text-actions" :class="r.actions()">
      <Tooltip v-for="a in ACTIONS" :key="a.key" :content="a.label">
        <Button
          :class="r.action()"
          data-streaming-text="action"
          variant="ghost"
          size="xs"
          shape="rounded"
          square
          muted
          :aria-label="a.label"
          :data-action="a.key"
          @click="emit('action', a.key)"
        >
          <template #icon><component :is="a.icon" data-slot="icon" weight="bold" /></template>
        </Button>
      </Tooltip>
      <Collapsible v-if="sources.length" data-streaming-text="sources" :class="r.sources()" variant="inline" caret="none" :open="done && sourcesOpen" @open-change="onSources">
        <template #label>
          <span data-slot="streaming-text-avatars" :class="r.avatars()" aria-hidden="true">
            <Avatar v-for="(s, i) in sources.slice(0, 3)" :key="i" data-streaming-text="avatar" :class="r.avatar()" :src="s.image" :initials="letters(s, 14)" :size="14" shape="round" />
          </span>
          <span data-slot="streaming-text-sources-label" :class="r.sourcesLabel()">{{ sourcesLabel }}</span>
        </template>
        <div data-slot="streaming-text-sources-list" :class="r.sourcesList()">
          <a v-for="(s, i) in sources" :key="i" data-slot="streaming-text-source" :class="r.source()" :href="s.href" target="_blank" rel="noreferrer">
            <Avatar data-streaming-text="source-avatar" :class="r.sourceAvatar()" :src="s.image" :initials="letters(s, 16)" :size="16" shape="square" />
            <span data-slot="streaming-text-source-name" :class="r.sourceName()" :title="s.name">{{ s.name }}</span>
            <span data-slot="streaming-text-source-domain" :class="r.sourceDomain()" :title="s.domain">{{ s.domain }}</span>
          </a>
        </div>
      </Collapsible>
    </div>

    <div v-if="followUps.length" data-slot="streaming-text-followups" :class="r.followups()">
      <p data-slot="streaming-text-followups-title" :class="r.followupsTitle({ appear: atMount.appear || !atMount.done })">{{ followUpsLabel }}</p>
      <div data-slot="streaming-text-followups-list" :class="r.followupsList()">
        <button v-for="(text, i) in followUps" :key="i" type="button" data-slot="streaming-text-followup" :class="r.followup({ appear: atMount.appear || !atMount.done })" :style="{ '--fndn-row-index': i }" @click="emit('followUp', text, i)">
          <PhArrowElbowDownLeft data-slot="icon" weight="bold" aria-hidden="true" />
          <span data-slot="streaming-text-followup-text" :class="r.followupText()">{{ text }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
