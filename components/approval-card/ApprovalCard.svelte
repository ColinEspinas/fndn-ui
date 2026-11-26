<!-- Human-in-the-loop questions, one at a time. -->
<script lang="ts">
  import X from "phosphor-svelte/lib/XIcon";
  import type { HTMLAttributes } from "svelte/elements";
  import { untrack } from "svelte";
  import Button from "../button/Button.svelte";
  import Checkbox from "../checkbox/Checkbox.svelte";
  import Pager from "../pager/Pager.svelte";
  import RadioGroup from "../radio-group/RadioGroup.svelte";
  import StatusPill from "../status-pill/StatusPill.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { glide } from "../lib/glide";
  import { afterFadeOut, fadesOnDismiss, placeTrack } from "./approval-card.logic";
  import { trackModality } from "../lib/modality";
  import { approvalCard } from "./approval-card.recipe";
  import { radioGroup } from "../radio-group/radio-group.recipe";

  const r = approvalCard();
  /* the after-states fade in once the card has been seen, never on first paint */
  let ready = $state(false);
  $effect(() => { ready = true; });

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

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    /** Question mode: the questions, one at a time. */
    questions?: ApprovalQuestion[];
    /** Approve mode: one action described, then Approve / Deny (replaces the questions). */
    action?: ApprovalAction;
    /** Approve mode: offer "Always allow" (a checkbox beside Deny / Approve). */
    alwaysAllow?: boolean;
    /** Approve mode: the decision, and whether "Always allow" was ticked (only with approve). */
    ondecision?: (decision: ApprovalDecision, always: boolean) => void;
    labels?: Partial<ApprovalLabels>;
    /** Show "Start over" after sending. */
    resettable?: boolean;
    /** Fade up on mount. Off by default; set it on the card your code adds live, never on one rendered from history or with the page. A reopened card fades up either way. */
    appear?: boolean;
    /** Two-way bindable: current question. */
    index?: number;
    /** Two-way bindable: open | sent | closed. */
    state?: ApprovalState;
    /** Answers to start with: question index → selected option indexes. */
    defaultAnswers?: ApprovalAnswers;
    onsubmitted?: (answers: ApprovalAnswers, custom: Record<number, string>) => void;
    onanswerchange?: (questionIndex: number, answer: number[]) => void;
    ondismiss?: () => void;
  };

  let {
    questions = [], action, alwaysAllow = false, ondecision, labels, resettable = true, appear = false, index = $bindable(0), state: view = $bindable("open"), defaultAnswers = {},
    onsubmitted, onanswerchange, ondismiss, class: className, ...rest
  }: Props = $props();
  /* no entrance on mount unless the host says so (appear); once the card has been hidden, a reopen fades up */
  let entrance = $state(untrack(() => appear));
  $effect(() => { if (view !== "open") entrance = true; });

  /** A pointer pick on a single-choice question moves on by itself after this long. */
  const ADVANCE_MS = 480;
  const CHOICE = "[data-slot=radio-group-input], [data-slot=checkbox-input]";
  const CUSTOM = "[data-slot=radio-group-custom-input]";
  const DEFAULT_LABELS: ApprovalLabels = {
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
  };
  const t = $derived({ ...DEFAULT_LABELS, ...labels });

  const id = $props.id();
  // svelte-ignore state_referenced_locally
  let answers = $state<ApprovalAnswers>({ ...defaultAnswers });
  let custom = $state<Record<number, string>>({});
  const current = $derived(Math.min(Math.max(index, 0), Math.max(questions.length - 1, 0)));
  const question = $derived(questions[current]);
  const last = $derived(current === questions.length - 1);
  const hasAnswer = $derived((answers[current]?.length ?? 0) > 0 || Boolean(custom[current]?.trim()));

  let root = $state<HTMLDivElement | null>(null);
  let measured = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /* where focus has to land after the next render: the old question is inert, a hidden view cannot hold it */
  let refocus: "step" | "view" | null = null;

  function setIndex(next: number) {
    clearTimeout(timer);
    const target = Math.min(Math.max(next, 0), questions.length - 1);
    if (target === current) return;
    if (root?.querySelector("[data-slot=approval-card-step]:not([inert])")?.contains(document.activeElement)) refocus = "step";
    index = target;
  }
  function setState(next: ApprovalState) {
    clearTimeout(timer);
    if (next === view) return;
    if (root?.contains(document.activeElement)) refocus = "view";
    view = next;
  }
  function send() {
    setState("sent");
    onsubmitted?.($state.snapshot(answers), $state.snapshot(custom));
  }
  function advance() {
    if (last) send();
    else setIndex(current + 1);
  }
  function close() {
    setState("closed");
    ondismiss?.();
  }
  /* a pointer dismissal fades the card out first; from a key, or under reduced motion, it is instant */
  let card = $state<HTMLDivElement | null>(null);
  let leaving = $state(false);
  let stopFade = () => {};
  function dismiss(e?: MouseEvent) {
    if (leaving) return;
    if (view !== "open" || !fadesOnDismiss(e)) return close();
    clearTimeout(timer);
    leaving = true;
    stopFade = afterFadeOut(card, () => { leaving = false; close(); });
  }
  $effect(() => () => stopFade());
  /* approve mode: one decision, then the card settles into its pill */
  let decision = $state<ApprovalDecision | null>(null);
  let always = $state(false);
  function decide(d: ApprovalDecision) {
    decision = d;
    setState("sent");
    ondecision?.(d, d === "approve" && always);
  }
  const settled = $derived(action ? (decision === "deny" ? t.denied : always ? t.alwaysAllowed : t.approved) : t.sentMessage);
  function startOver() {
    answers = {};
    custom = {};
    decision = null;
    always = false;
    index = 0;
    setState("open");
  }
  function toggle(option: number) {
    const q = question;
    if (!q) return;
    clearTimeout(timer);
    const at = current;
    const picked = answers[at] ?? [];
    const radio = q.type === "radio";
    const next = radio ? [option] : picked.includes(option) ? picked.filter((i) => i !== option) : [...picked, option].sort((a, b) => a - b);
    answers = { ...answers, [at]: next };
    if (radio) custom = { ...custom, [at]: "" };
    onanswerchange?.(at, next);
    /* a pointer pick moves on by itself; arrow keys only browse, Enter confirms */
    if (radio && document.documentElement.dataset.fndnInput !== "keyboard") timer = setTimeout(advance, ADVANCE_MS);
  }
  function typeCustom(text: string) {
    const at = current;
    custom = { ...custom, [at]: text };
    /* an emptied field (a pick clears it) leaves the pick and its auto-advance alone */
    if (!text) return;
    clearTimeout(timer);
    if (question?.type === "radio") answers = { ...answers, [at]: [] };
  }
  /* the radio-group reports a pick, or null when a free-text answer clears it */
  function onRadio(value: string | null) {
    if (value == null) answers = { ...answers, [current]: [] };
    else toggle(Number(value));
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== "Enter" || e.isComposing || !hasAnswer) return;
    if (!(e.target as HTMLElement).matches(`${CHOICE}, ${CUSTOM}`)) return;
    e.preventDefault();
    advance();
  }

  /* viewport height + track place for the active question (placeTrack); the first write never animates */
  function slide(animate: boolean) {
    const el = root;
    const viewport = el?.querySelector<HTMLElement>("[data-slot=approval-card-viewport]");
    const track = el?.querySelector<HTMLElement>("[data-slot=approval-card-track]");
    const step = track?.querySelector<HTMLElement>("[data-slot=approval-card-step]:not([inert])");
    if (!el || !viewport || !track || !step || view !== "open") return;
    el.setAttribute("data-measured", "");
    if (animate && measured) return placeTrack(viewport, track, step, true);
    placeTrack(viewport, track, step, false);
    measured = true;
  }

  /* after every move between questions or views: slide, then put focus where the user can keep working */
  $effect(() => {
    void current;
    void view;
    if (view !== "open") measured = false;
    slide(true);
    const el = root;
    const pending = refocus;
    refocus = null;
    if (!el || !pending) return;
    if (pending === "view" && view !== "open") {
      el.querySelector<HTMLElement>(view === "sent" ? "[data-approval-card=reset]" : "[data-approval-card=reopen]")?.focus({ preventScroll: true });
      return;
    }
    const step = el.querySelector<HTMLElement>("[data-slot=approval-card-step]:not([inert])");
    const inputs = Array.from(step?.querySelectorAll<HTMLInputElement>(CHOICE) ?? []);
    (inputs.find((input) => input.checked) ?? inputs[0] ?? step?.querySelector<HTMLElement>(CUSTOM))?.focus({ preventScroll: true });
  });

  /* one gliding highlight per multi-select list (a radio-group wires its own), re-wired when the questions change */
  $effect(() => {
    void questions;
    const el = root;
    if (!el) return;
    trackModality();
    const stops = Array.from(el.querySelectorAll<HTMLElement>("[data-slot=approval-card-options]:not([data-slot=radio-group])")).map((list) => {
      const layer = list.querySelector<HTMLElement>(":scope > [data-slot=approval-card-highlight]");
      return layer ? glide(list, layer, { rows: "[data-slot=checkbox]", follow: "hover" }) : () => {};
    });
    measured = false;
    slide(false);
    return () => stops.forEach((stop) => stop());
  });

  $effect(() => {
    const track = root?.querySelector("[data-slot=approval-card-track]");
    if (!track || typeof ResizeObserver === "undefined") return;
    /* text can rewrap when the card's width changes: follow without animating */
    const observer = new ResizeObserver(() => { measured = false; slide(false); });
    observer.observe(track);
    return () => { observer.disconnect(); clearTimeout(timer); };
  });
</script>

<div bind:this={root} data-slot="approval-card" class={r.base({ state: view, class: className as string | undefined })} {...rest}>
  <span data-slot="approval-card-status" class={r.status()} role="status">{view === "sent" ? settled : ""}</span>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div bind:this={card} data-slot="approval-card-card" class={r.card({ leaving: leaving && view === "open", appear: entrance })} hidden={view !== "open"} onkeydown={onKeyDown}>
    <Tooltip content={t.dismiss}>
      {#snippet trigger(props)}
        <Button {...props()} data-approval-card="dismiss" class={r.dismiss()} variant="ghost" size="sm" shape="rounded" square muted aria-label={t.dismiss} onclick={dismiss}>
          {#snippet icon()}<X data-slot="icon" weight="bold" />{/snippet}
        </Button>
      {/snippet}
    </Tooltip>
    {#if action}
      <div data-slot="approval-card-body" class={r.body()}>
        <div data-slot="approval-card-action" class={r.action()}>
          <div data-slot="approval-card-question" class={r.question()}>{action.title}</div>
          {#if action.description}<p data-slot="approval-card-description" class={r.description()}>{action.description}</p>{/if}
          {#if action.command}<pre data-slot="approval-card-command" class={r.command()}><code>{action.command}</code></pre>{/if}
          {#if action.details?.length}
            <dl data-slot="approval-card-details" class={r.details()}>
              {#each action.details as d, i (i)}
                <div data-slot="approval-card-detail" class={r.detail()}>
                  <dt data-slot="approval-card-detail-label" class={r.detailLabel()}>{d.label}</dt>
                  <dd data-slot="approval-card-detail-value" class={r.detailValue({ mono: !!d.mono })}>{d.value}</dd>
                </div>
              {/each}
            </dl>
          {/if}
        </div>
      </div>
      <div data-slot="approval-card-footer" class={r.footer()}>
        {#if alwaysAllow}
          <Checkbox data-approval-card="always" class={r.always()} size="sm" label={t.alwaysAllow} checked={always} oncheckedchange={(c) => (always = c === true)} />
        {:else}
          <span></span>
        {/if}
        <div data-slot="approval-card-actions" class={r.actions()}>
          <Button variant="ghost" size="sm" onclick={() => decide("deny")}>{t.deny}</Button>
          <Button variant="accent" size="sm" onclick={() => decide("approve")}>{t.approve}</Button>
        </div>
      </div>
    {:else}
    <div data-slot="approval-card-body" class={r.body()}>
      <div data-slot="approval-card-viewport" class={r.viewport()}>
        <div data-slot="approval-card-track" class={r.track()}>
          {#each questions as q, qi (qi)}
            <div data-slot="approval-card-step" class={r.step({ active: qi === current })} inert={qi !== current}>
              <div data-slot="approval-card-question" class={r.question()}>{q.q}</div>
              {#if q.type === "radio"}
                <RadioGroup
                  class={r.options()}
                  data-approval-card="options"
                  layout="row"
                  aria-label={q.q}
                  name="{id}-q{qi}"
                  items={q.options.map((label, i) => ({ value: String(i), label }))}
                  value={(answers[qi] ?? []).length ? String(answers[qi]![0]) : null}
                  customPlaceholder={t.customPlaceholder}
                  customLabel={t.customLabel}
                  customEnterKeyHint="next"
                  custom={custom[qi] ?? ""}
                  onvaluechange={onRadio}
                  oncustomchange={typeCustom}
                />
              {:else}
                <div data-slot="approval-card-options" class={r.options({ list: true })} role="group" aria-label={q.q}>
                  <span data-slot="approval-card-highlight" class={r.highlight()} aria-hidden="true"></span>
                  {#each q.options as option, i (i)}
                    <Checkbox layout="row" label={option} checked={(answers[qi] ?? []).includes(i)} oncheckedchange={() => toggle(i)} />
                  {/each}
                  <label data-slot="radio-group-custom" class={radioGroup().custom()}>
                    <input
                      data-slot="radio-group-custom-input"
                      class={radioGroup().customInput()}
                      dir="auto"
                      type="text"
                      value={custom[qi] ?? ""}
                      placeholder={t.customPlaceholder}
                      aria-label={t.customLabel}
                      enterkeyhint="next"
                      oninput={(e) => typeCustom(e.currentTarget.value)}
                    />
                  </label>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
    <div data-slot="approval-card-footer" class={r.footer()}>
      <!-- one question needs no pager -->
      {#if questions.length > 1}<Pager
        count={questions.length}
        page={current}
        reel
        orientation="vertical"
        separator="/"
        unit={t.unit}
        label={t.pager}
        prevLabel={t.previous}
        nextLabel={t.next}
        onpagechange={setIndex}
      />{/if}
      <div data-slot="approval-card-actions" class={r.actions()}>
        <Button variant="ghost" size="sm" onclick={(e) => (last ? dismiss(e) : setIndex(current + 1))}>{t.skip}</Button>
        <Button variant="accent" size="sm" disabled={!hasAnswer} onclick={advance}>{last ? t.send : t.continue}</Button>
      </div>
    </div>
    {/if}
  </div>
  <div data-slot="approval-card-sent" class={r.sent({ ready })} hidden={view !== "sent"}>
    <StatusPill tone={action && decision === "deny" ? "neutral" : "green"} mark={!(action && decision === "deny")}>{settled}</StatusPill>
    {#if resettable}<Button data-approval-card="reset" class={r.reset()} variant="ghost" size="sm" muted onclick={startOver}>{action ? t.change : t.startOver}</Button>{/if}
  </div>
  <Button data-approval-card="reopen" class={r.reopen({ ready })} variant="outline" size="sm" hidden={view !== "closed"} onclick={() => setState("open")}>{t.reopen}</Button>
</div>
