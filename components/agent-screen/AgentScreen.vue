<script setup lang="ts">
/** A framed capture of the agent's screen with its cursor and a recording badge. */
import { PhArrowsOutSimple, PhCursor } from "@phosphor-icons/vue";
import { computed, ref, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Dialog from "../dialog/Dialog.vue";
import Spinner from "../spinner/Spinner.vue";
import { agentScreen } from "./agent-screen.recipe";
import Tooltip from "../tooltip/Tooltip.vue";
import {
  agentScreenLabels, agentScreenStatus, cursorValue,
  type AgentScreenCursor, type AgentScreenLabels, type AgentScreenState,
} from "./agent-screen.logic";

export type { AgentScreenCursor, AgentScreenLabels, AgentScreenState };

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** loading: connecting. live: the agent works, its cursor shows. idle: the cursor hides. */
    state?: AgentScreenState;
    /** Cursor position in percent of the screen ({ x, y }, clamped to 0–100). */
    cursor?: AgentScreenCursor;
    /** Shows the REC badge and adds "Recording" to the status. */
    recording?: boolean;
    /** Caption under the frame; also starts the status text. */
    label?: string;
    /** Text alternative of the frame. Defaults to the label. */
    alt?: string;
    /** Image URL of the agent's screen. Without it a neutral placeholder is drawn. */
    src?: string;
    labels?: Partial<AgentScreenLabels>;
    /** Adds a button (with a tooltip) that opens the screen larger in our dialog. */
    expandable?: boolean;
  }>(),
  { state: "live", recording: false, label: "Agent's screen", expandable: false },
);
const open = ref(false);

const text = computed(() => agentScreenLabels(props.labels));
const status = computed(() => agentScreenStatus(props.label, props.state, props.recording, text.value));
const r = computed(() => agentScreen({ state: props.state, recording: props.recording, placeholder: !props.src }));
const cursorStyle = computed(() => ({ "--fndn-agent-screen-cursor": cursorValue(props.cursor) }));
</script>

<template>
  <figure v-bind="attrs" data-slot="agent-screen" :class="r.base({ class: attrs.class as string | undefined })">
    <span data-slot="agent-screen-status" :class="r.status()" role="status">{{ status }}</span>
    <div data-slot="agent-screen-frame" :class="r.frame({ inViewer: false })" role="img" :aria-label="alt ?? label">
      <img v-if="src" data-slot="agent-screen-media" :class="r.media()" :src="src" alt="" />
      <span v-else data-slot="agent-screen-placeholder" :class="r.placeholder()" aria-hidden="true">
        <span data-slot="agent-screen-chrome" :class="r.chrome()" />
        <span data-slot="agent-screen-page" :class="r.page()"><span v-for="i in 4" :key="i" data-slot="agent-screen-line" :class="r.line()" /></span>
      </span>
      <span data-slot="agent-screen-cursor" :class="r.cursor()" aria-hidden="true" :style="cursorStyle"><PhCursor data-slot="icon" weight="fill" /></span>
      <span data-slot="agent-screen-loading" :class="r.loading()" aria-hidden="true">
        <Spinner size="md" decorative />
        <span data-slot="agent-screen-loading-text" :class="r.loadingText()">{{ text.loading }}</span>
      </span>
      <span data-slot="agent-screen-rec" :class="r.rec()" aria-hidden="true"><span data-slot="agent-screen-rec-dot" :class="r.recDot()" />{{ text.rec }}</span>
    </div>
    <template v-if="expandable">
      <Tooltip :content="text.expand">
        <Button data-agent-screen="expand" :class="r.expand()" variant="outline" size="xs" shape="rounded" square :aria-label="text.expand" aria-haspopup="dialog" @click="open = true">
          <template #icon><PhArrowsOutSimple data-slot="icon" weight="bold" /></template>
        </Button>
      </Tooltip>
      <Dialog v-model:open="open" :title="label" size="lg">
        <div data-slot="agent-screen-viewer" :class="r.viewer()">
          <div data-slot="agent-screen-frame" :class="r.frame({ inViewer: true })" role="img" :aria-label="alt ?? label">
            <img v-if="src" data-slot="agent-screen-media" :class="r.media()" :src="src" alt="" />
            <span v-else data-slot="agent-screen-placeholder" :class="r.placeholder()" aria-hidden="true">
              <span data-slot="agent-screen-chrome" :class="r.chrome()" />
              <span data-slot="agent-screen-page" :class="r.page()"><span v-for="i in 4" :key="i" data-slot="agent-screen-line" :class="r.line()" /></span>
            </span>
            <span data-slot="agent-screen-cursor" :class="r.cursor()" aria-hidden="true" :style="cursorStyle"><PhCursor data-slot="icon" weight="fill" /></span>
            <span data-slot="agent-screen-loading" :class="r.loading()" aria-hidden="true">
              <Spinner size="md" decorative />
              <span data-slot="agent-screen-loading-text" :class="r.loadingText()">{{ text.loading }}</span>
            </span>
            <span data-slot="agent-screen-rec" :class="r.rec()" aria-hidden="true"><span data-slot="agent-screen-rec-dot" :class="r.recDot()" />{{ text.rec }}</span>
          </div>
        </div>
      </Dialog>
    </template>
    <figcaption data-slot="agent-screen-label" :class="r.label()" :title="label">{{ label }}</figcaption>
  </figure>
</template>
