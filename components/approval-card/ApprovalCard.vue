<script setup lang="ts">
/** Human-in-the-loop questions, one at a time. */
import { PhX } from "@phosphor-icons/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import Button from "../button/Button.vue";
import Checkbox from "../checkbox/Checkbox.vue";
import Pager from "../pager/Pager.vue";
import RadioGroup from "../radio-group/RadioGroup.vue";
import StatusPill from "../status-pill/StatusPill.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { glide } from "../lib/glide";
import { afterFadeOut, fadesOnDismiss, placeTrack } from "./approval-card.logic";
import { trackModality } from "../lib/modality";
import { approvalCard } from "./approval-card.recipe";
import { radioGroup } from "../radio-group/radio-group.recipe";

export type ApprovalQuestion = { q: string; type: "radio" | "check"; options: string[] };
export type ApprovalState = "open" | "sent" | "closed";
export type ApprovalAnswers = Record<number, number[]>;
/** Approve mode: the one action the agent asks to take. */
export type ApprovalAction = {
  /** The heading, as a question: "Run the migration on Production?" */
  title: string;
  /** What it does and why, in a sentence. */
  description?: string;
  /** The exact command or call, as the agent will run it (mono, read left to right). */
  command?: string;
  /** Facts about it: { label: "Branch", value: "main", mono: true }. */
  details?: { label: string; value: string; mono?: boolean }[];
};
export type ApprovalDecision = "approve" | "deny";
export type ApprovalLabels = {
  skip: string;
  continue: string;
  send: string;
  customPlaceholder: string;
  customLabel: string;
  sentMessage: string;
  startOver: string;
  reopen: string;
  dismiss: string;
  previous: string;
  next: string;
  /** Accessible name of the pager. */
  pager: string;
  /** Read by screen readers before the pager's position: "Question" → "Question 1 / 3". */
  unit: string;
  /** Approve mode: the two actions, the checkbox and the settled pill. */
  approve: string;
  deny: string;
  alwaysAllow: string;
  approved: string;
  alwaysAllowed: string;
  denied: string;
  /** Approve mode's reset: reopens the decision. */
  change: string;
};

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = approvalCard();
/* the after-states fade in once the card has been seen, never on first paint */
const ready = ref(false);
/* two frames: Vue mounts before the first paint, and @starting-style must not see the first one */
onMounted(() => requestAnimationFrame(() => requestAnimationFrame(() => { ready.value = true; })));

const props = withDefaults(
  defineProps<{
    /** Question mode: the questions, one at a time. */
    questions?: ApprovalQuestion[];
    /** Approve mode: one action described, then Approve / Deny (replaces the questions). */
    action?: ApprovalAction;
    /** Approve mode: offer "Always allow" (a checkbox beside Deny / Approve). */
    alwaysAllow?: boolean;
    labels?: Partial<ApprovalLabels>;
    /** Show "Start over" after sending. */
    resettable?: boolean;
    /** Fade up on mount. Off by default; set it on the card your code adds live, never on one rendered from history or with the page. A reopened card fades up either way. */
    appear?: boolean;
    /** Answers to start with: question index → selected option indexes. */
    defaultAnswers?: ApprovalAnswers;
  }>(),
  { questions: () => [], action: undefined, alwaysAllow: false, labels: () => ({}), resettable: true, appear: false, defaultAnswers: () => ({}) },
);
/** v-model:index — current question; falls back to local state when unbound. */
const index = defineModel<number>("index", { default: 0 });
/** v-model:state — open | sent | closed. */
const state = defineModel<ApprovalState>("state", { default: "open" });
/* no entrance on mount unless the host says so (appear); once the card has been hidden, a reopen fades up */
const entrance = ref(props.appear);
watch(state, (s) => { if (s !== "open") entrance.value = true; }, { immediate: true });
const emit = defineEmits<{
  submitted: [answers: ApprovalAnswers, custom: Record<number, string>];
  answerChange: [questionIndex: number, answer: number[]];
  dismiss: [];
  /** Approve mode: the decision, and whether "Always allow" was ticked (only with approve). */
  decision: [decision: ApprovalDecision, always: boolean];
}>();

/** A pointer pick on a single-choice question moves on by itself after this long. */
const ADVANCE_MS = 480;
const CHOICE = "[data-slot=radio-group-input], [data-slot=checkbox-input]";
const CUSTOM = "[data-slot=radio-group-custom-input]";
const t = computed<ApprovalLabels>(() => ({
  skip: "Skip",
  continue: "Continue",
  send: "Send",
  customPlaceholder: "Something else…",
  customLabel: "Custom answer",
  sentMessage: "Answers sent",
  startOver: "Start over",
  reopen: "Open approval",
  dismiss: "Dismiss",
  previous: "Previous question",
  next: "Next question",
  pager: "Questions",
  unit: "Question",
  approve: "Approve",
  deny: "Deny",
  alwaysAllow: "Always allow",
  approved: "Approved",
  alwaysAllowed: "Always allowed",
  denied: "Denied",
  change: "Change",
  ...props.labels,
}));

const id = useId();
const answers = ref<ApprovalAnswers>({ ...props.defaultAnswers });
const custom = ref<Record<number, string>>({});
const current = computed(() => Math.min(Math.max(index.value, 0), Math.max(props.questions.length - 1, 0)));
const question = computed(() => props.questions[current.value]);
const last = computed(() => current.value === props.questions.length - 1);
const hasAnswer = computed(() => (answers.value[current.value]?.length ?? 0) > 0 || Boolean(custom.value[current.value]?.trim()));

const root = ref<HTMLDivElement | null>(null);
let measured = false;
let timer: ReturnType<typeof setTimeout> | undefined;
/* where focus has to land after the next render: the old question is inert, a hidden view cannot hold it */
let refocus: "step" | "view" | null = null;

function setIndex(next: number) {
  clearTimeout(timer);
  const target = Math.min(Math.max(next, 0), props.questions.length - 1);
  if (target === current.value) return;
  if (root.value?.querySelector("[data-slot=approval-card-step]:not([inert])")?.contains(document.activeElement)) refocus = "step";
  index.value = target;
}
function setState(next: ApprovalState) {
  clearTimeout(timer);
  if (next === state.value) return;
  if (root.value?.contains(document.activeElement)) refocus = "view";
  state.value = next;
}
function send() {
  setState("sent");
  emit("submitted", answers.value, custom.value);
}
function advance() {
  if (last.value) send();
  else setIndex(current.value + 1);
}
function close() {
  setState("closed");
  emit("dismiss");
}
/* a pointer dismissal fades the card out first; from a key, or under reduced motion, it is instant */
const card = ref<HTMLDivElement | null>(null);
const leaving = ref(false);
let stopFade = () => {};
function dismiss(e?: MouseEvent) {
  if (leaving.value) return;
  if (state.value !== "open" || !fadesOnDismiss(e)) return close();
  clearTimeout(timer);
  leaving.value = true;
  stopFade = afterFadeOut(card.value, () => { leaving.value = false; close(); });
}
/* approve mode: one decision, then the card settles into its pill */
const decision = ref<ApprovalDecision | null>(null);
const always = ref(false);
function decide(d: ApprovalDecision) {
  decision.value = d;
  setState("sent");
  emit("decision", d, d === "approve" && always.value);
}
const settled = computed(() => (props.action ? (decision.value === "deny" ? t.value.denied : always.value ? t.value.alwaysAllowed : t.value.approved) : t.value.sentMessage));
function startOver() {
  answers.value = {};
  custom.value = {};
  decision.value = null;
  always.value = false;
  index.value = 0;
  setState("open");
}
function toggle(option: number) {
  const q = question.value;
  if (!q) return;
  clearTimeout(timer);
  const at = current.value;
  const picked = answers.value[at] ?? [];
  const radio = q.type === "radio";
  const next = radio ? [option] : picked.includes(option) ? picked.filter((i) => i !== option) : [...picked, option].sort((a, b) => a - b);
  answers.value = { ...answers.value, [at]: next };
  if (radio) custom.value = { ...custom.value, [at]: "" };
  emit("answerChange", at, next);
  /* a pointer pick moves on by itself; arrow keys only browse, Enter confirms */
  if (radio && document.documentElement.dataset.fndnInput !== "keyboard") timer = setTimeout(advance, ADVANCE_MS);
}
function typeCustom(text: string) {
  const at = current.value;
  custom.value = { ...custom.value, [at]: text };
  /* an emptied field (a pick clears it) leaves the pick and its auto-advance alone */
  if (!text) return;
  clearTimeout(timer);
  if (question.value?.type === "radio") answers.value = { ...answers.value, [at]: [] };
}
/* the radio-group clears its pick when a free-text answer is typed */
function clearPick() {
  answers.value = { ...answers.value, [current.value]: [] };
}
function onRadio(value: string | null) {
  if (value == null) clearPick();
  else toggle(Number(value));
}
function onKeyDown(e: KeyboardEvent) {
  if (e.key !== "Enter" || e.isComposing || !hasAnswer.value) return;
  if (!(e.target as HTMLElement).matches(`${CHOICE}, ${CUSTOM}`)) return;
  e.preventDefault();
  advance();
}

/* viewport height + track place for the active question (placeTrack); the first write never animates */
function slide(animate: boolean) {
  const el = root.value;
  const viewport = el?.querySelector<HTMLElement>("[data-slot=approval-card-viewport]");
  const track = el?.querySelector<HTMLElement>("[data-slot=approval-card-track]");
  const step = track?.querySelector<HTMLElement>("[data-slot=approval-card-step]:not([inert])");
  if (!el || !viewport || !track || !step || state.value !== "open") return;
  el.setAttribute("data-measured", "");
  if (animate && measured) return placeTrack(viewport, track, step, true);
  placeTrack(viewport, track, step, false);
  measured = true;
}
function afterRender() {
  if (state.value !== "open") measured = false;
  slide(true);
  const el = root.value;
  const pending = refocus;
  refocus = null;
  if (!el || !pending) return;
  if (pending === "view" && state.value !== "open") {
    el.querySelector<HTMLElement>(state.value === "sent" ? "[data-approval-card=reset]" : "[data-approval-card=reopen]")?.focus({ preventScroll: true });
    return;
  }
  const step = el.querySelector<HTMLElement>("[data-slot=approval-card-step]:not([inert])");
  const inputs = Array.from(step?.querySelectorAll<HTMLInputElement>(CHOICE) ?? []);
  (inputs.find((input) => input.checked) ?? inputs[0] ?? step?.querySelector<HTMLElement>(CUSTOM))?.focus({ preventScroll: true });
}

let glides: Array<() => void> = [];
let observer: ResizeObserver | null = null;
function wireGlides() {
  glides.forEach((stop) => stop());
  /* the multi-select lists own their glide; a radio-group wires its own */
  glides = Array.from(root.value?.querySelectorAll<HTMLElement>("[data-slot=approval-card-options]:not([data-slot=radio-group])") ?? []).map((list) => {
    const layer = list.querySelector<HTMLElement>(":scope > [data-slot=approval-card-highlight]");
    return layer ? glide(list, layer, { rows: "[data-slot=checkbox]", follow: "hover" }) : () => {};
  });
}
onMounted(() => {
  trackModality();
  wireGlides();
  slide(false);
  const track = root.value?.querySelector("[data-slot=approval-card-track]");
  if (track && typeof ResizeObserver !== "undefined") {
    /* text can rewrap when the card's width changes: follow without animating */
    observer = new ResizeObserver(() => { measured = false; slide(false); });
    observer.observe(track);
  }
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  stopFade();
  observer?.disconnect();
  glides.forEach((stop) => stop());
});
watch([current, state], afterRender, { flush: "post" });
watch(() => props.questions, () => nextTick(() => { wireGlides(); measured = false; slide(false); }));
</script>

<template>
  <div v-bind="attrs" ref="root" data-slot="approval-card" :class="r.base({ state, class: attrs.class as string | undefined })">
    <span data-slot="approval-card-status" :class="r.status()" role="status">{{ state === "sent" ? settled : "" }}</span>
    <div ref="card" data-slot="approval-card-card" :class="r.card({ leaving: leaving && state === 'open', appear: entrance })" :hidden="state !== 'open'" @keydown="onKeyDown">
      <Tooltip :content="t.dismiss">
        <Button data-approval-card="dismiss" :class="r.dismiss()" variant="ghost" size="sm" shape="rounded" square muted :aria-label="t.dismiss" @click="dismiss">
          <template #icon><PhX data-slot="icon" weight="bold" /></template>
        </Button>
      </Tooltip>
      <template v-if="action">
        <div data-slot="approval-card-body" :class="r.body()">
          <div data-slot="approval-card-action" :class="r.action()">
            <div data-slot="approval-card-question" :class="r.question()">{{ action.title }}</div>
            <p v-if="action.description" data-slot="approval-card-description" :class="r.description()">{{ action.description }}</p>
            <pre v-if="action.command" data-slot="approval-card-command" :class="r.command()"><code>{{ action.command }}</code></pre>
            <dl v-if="action.details?.length" data-slot="approval-card-details" :class="r.details()">
              <div v-for="(d, i) in action.details" :key="i" data-slot="approval-card-detail" :class="r.detail()">
                <dt data-slot="approval-card-detail-label" :class="r.detailLabel()">{{ d.label }}</dt>
                <dd data-slot="approval-card-detail-value" :class="r.detailValue({ mono: !!d.mono })">{{ d.value }}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div data-slot="approval-card-footer" :class="r.footer()">
          <Checkbox v-if="alwaysAllow" data-approval-card="always" :class="r.always()" size="sm" :label="t.alwaysAllow" :checked="always" @checked-change="(c: boolean | 'indeterminate') => (always = c === true)" />
          <span v-else />
          <div data-slot="approval-card-actions" :class="r.actions()">
            <Button variant="ghost" size="sm" @click="decide('deny')">{{ t.deny }}</Button>
            <Button variant="accent" size="sm" @click="decide('approve')">{{ t.approve }}</Button>
          </div>
        </div>
      </template>
      <template v-else>
      <div data-slot="approval-card-body" :class="r.body()">
        <div data-slot="approval-card-viewport" :class="r.viewport()">
          <div data-slot="approval-card-track" :class="r.track()">
            <div
              v-for="(q, qi) in questions"
              :key="qi"
              data-slot="approval-card-step"
              :class="r.step({ active: qi === current })"
              :inert="qi !== current"
            >
              <div data-slot="approval-card-question" :class="r.question()">{{ q.q }}</div>
              <RadioGroup
                v-if="q.type === 'radio'"
                :class="r.options()"
                data-approval-card="options"
                layout="row"
                :aria-label="q.q"
                :name="`${id}-q${qi}`"
                :items="q.options.map((label, i) => ({ value: String(i), label }))"
                :value="(answers[qi] ?? []).length ? String(answers[qi]![0]) : null"
                :custom-placeholder="t.customPlaceholder"
                :custom-label="t.customLabel"
                custom-enter-key-hint="next"
                :custom="custom[qi] ?? ''"
                @value-change="onRadio"
                @custom-change="typeCustom"
              />
              <div v-else data-slot="approval-card-options" :class="r.options({ list: true })" role="group" :aria-label="q.q">
                <span data-slot="approval-card-highlight" :class="r.highlight()" aria-hidden="true" />
                <Checkbox
                  v-for="(option, i) in q.options"
                  :key="i"
                  layout="row"
                  :label="option"
                  :checked="(answers[qi] ?? []).includes(i)"
                  @checked-change="toggle(i)"
                />
                <label data-slot="radio-group-custom" :class="radioGroup().custom()">
                  <input
                    data-slot="radio-group-custom-input"
                    :class="radioGroup().customInput()"
                    dir="auto"
                    type="text"
                    :value="custom[qi] ?? ''"
                    :placeholder="t.customPlaceholder"
                    :aria-label="t.customLabel"
                    enterkeyhint="next"
                    @input="typeCustom(($event.target as HTMLInputElement).value)"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div data-slot="approval-card-footer" :class="r.footer()">
        <!-- one question needs no pager -->
        <Pager
          v-if="questions.length > 1"
          :count="questions.length"
          :page="current"
          reel
          orientation="vertical"
          separator="/"
          :unit="t.unit"
          :label="t.pager"
          :prev-label="t.previous"
          :next-label="t.next"
          @update:page="setIndex"
        />
        <div data-slot="approval-card-actions" :class="r.actions()">
          <Button variant="ghost" size="sm" @click="(e: MouseEvent) => (last ? dismiss(e) : setIndex(current + 1))">{{ t.skip }}</Button>
          <Button variant="accent" size="sm" :disabled="!hasAnswer" @click="advance">{{ last ? t.send : t.continue }}</Button>
        </div>
      </div>
      </template>
    </div>
    <div data-slot="approval-card-sent" :class="r.sent({ ready })" :hidden="state !== 'sent'">
      <StatusPill :tone="action && decision === 'deny' ? 'neutral' : 'green'" :mark="!(action && decision === 'deny')">{{ settled }}</StatusPill>
      <Button v-if="resettable" data-approval-card="reset" :class="r.reset()" variant="ghost" size="sm" muted @click="startOver">{{ action ? t.change : t.startOver }}</Button>
    </div>
    <Button data-approval-card="reopen" :class="r.reopen({ ready })" variant="outline" size="sm" :hidden="state !== 'closed'" @click="setState('open')">{{ t.reopen }}</Button>
  </div>
</template>
