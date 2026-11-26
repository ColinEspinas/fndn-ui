"use client";
import { X } from "@phosphor-icons/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent } from "react";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { Pager } from "../pager/pager";
import { RadioGroup } from "../radio-group/radio-group";
import { StatusPill } from "../status-pill/status-pill";
import { Tooltip } from "../tooltip/tooltip";
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

export type ApprovalCardProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Question mode: the questions, one at a time. */
  questions?: ApprovalQuestion[];
  /** Approve mode: one action described, then Approve / Deny (replaces the questions). */
  action?: ApprovalAction;
  /** Approve mode: offer "Always allow" (a checkbox beside Deny / Approve). */
  alwaysAllow?: boolean;
  /** Approve mode: the decision, and whether "Always allow" was ticked (only with approve). */
  onDecision?: (decision: ApprovalDecision, always: boolean) => void;
  labels?: Partial<ApprovalLabels>;
  /** Show "Start over" after sending. */
  resettable?: boolean;
  /** Fade up on mount. Off by default; set it on the card your code adds live, never on one rendered from history or with the page. A reopened card fades up either way. */
  appear?: boolean;
  /** Current question. Omit for uncontrolled (use defaultIndex). */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** open | sent | closed. Omit for uncontrolled (use defaultState). */
  state?: ApprovalState;
  defaultState?: ApprovalState;
  onStateChange?: (state: ApprovalState) => void;
  /** Answers to start with: question index → selected option indexes. */
  defaultAnswers?: ApprovalAnswers;
  onSubmitted?: (answers: ApprovalAnswers, custom: Record<number, string>) => void;
  onAnswerChange?: (questionIndex: number, answer: number[]) => void;
  onDismiss?: () => void;
};

const NO_QUESTIONS: ApprovalQuestion[] = [];
/** A pointer pick on a single-choice question moves on by itself after this long. */
const ADVANCE_MS = 480;
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const CHOICE = "[data-slot=radio-group-input], [data-slot=checkbox-input]";
const CUSTOM = "[data-slot=radio-group-custom-input]";

/** One question: a radio-group in rows, or checkbox rows under one gliding highlight; both end in the custom row. */
function Question({
  name, question, active, picked, custom, labels, onToggle, onClear, onCustom,
}: {
  name: string;
  question: ApprovalQuestion;
  active: boolean;
  picked: number[];
  custom: string;
  labels: ApprovalLabels;
  onToggle: (option: number) => void;
  onClear: () => void;
  onCustom: (text: string) => void;
}) {
  const radio = question.type === "radio";
  const list = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLSpanElement>(null);
  const r = approvalCard();
  useEffect(() => {
    if (radio || !list.current || !layer.current) return;
    return glide(list.current, layer.current, { rows: "[data-slot=checkbox]", follow: "hover" });
  }, [radio]);

  return (
    <div data-slot="approval-card-step" className={r.step({ active })} ref={(node) => { if (node) node.inert = !active; }}>
      <div data-slot="approval-card-question" className={r.question()}>{question.q}</div>
      {radio ? (
        <RadioGroup
          className={r.options()}
          data-approval-card="options"
          layout="row"
          aria-label={question.q}
          name={name}
          items={question.options.map((label, i) => ({ value: String(i), label }))}
          value={picked.length ? String(picked[0]) : null}
          onValueChange={(value) => (value == null ? onClear() : onToggle(Number(value)))}
          customPlaceholder={labels.customPlaceholder}
          customLabel={labels.customLabel}
          customEnterKeyHint="next"
          custom={custom}
          onCustomChange={onCustom}
        />
      ) : (
        <div data-slot="approval-card-options" className={r.options({ list: true })} role="group" aria-label={question.q} ref={list}>
          <span ref={layer} data-slot="approval-card-highlight" className={r.highlight()} aria-hidden="true" />
          {question.options.map((option, i) => (
            <Checkbox key={i} layout="row" label={option} checked={picked.includes(i)} onCheckedChange={() => onToggle(i)} />
          ))}
          <label data-slot="radio-group-custom" className={radioGroup().custom()}>
            <input data-slot="radio-group-custom-input" className={radioGroup().customInput()} dir="auto" type="text" value={custom} placeholder={labels.customPlaceholder} aria-label={labels.customLabel} enterKeyHint="next" onChange={(e) => onCustom(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}

/** Human-in-the-loop questions, one at a time. */
export function ApprovalCard({
  questions = NO_QUESTIONS, action, alwaysAllow = false, onDecision, labels, resettable = true, appear = false, index: indexProp, defaultIndex = 0, onIndexChange, state: stateProp, defaultState = "open", onStateChange,
  defaultAnswers, onSubmitted, onAnswerChange, onDismiss, className, ...rest
}: ApprovalCardProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const [innerIndex, setInnerIndex] = useState(defaultIndex);
  const [innerState, setInnerState] = useState<ApprovalState>(defaultState);
  const [answers, setAnswers] = useState<ApprovalAnswers>(defaultAnswers ?? {});
  const [custom, setCustom] = useState<Record<number, string>>({});
  const index = Math.min(Math.max(indexProp ?? innerIndex, 0), Math.max(questions.length - 1, 0));
  const state = stateProp ?? innerState;

  const root = useRef<HTMLDivElement>(null);
  const r = approvalCard();
  const measured = useRef(false);
  /* the after-states fade in once the card has been seen, never on first paint */
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  /* no entrance on mount unless the host says so (appear); once the card has been hidden, a reopen fades up */
  const [entrance, setEntrance] = useState(appear);
  useEffect(() => { if (state !== "open") setEntrance(true); }, [state]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /* where focus has to land after the next render: the old question is inert, a hidden view cannot hold it */
  const refocus = useRef<"step" | "view" | null>(null);

  const question = questions[index];
  const last = index === questions.length - 1;
  const hasAnswer = (answers[index]?.length ?? 0) > 0 || Boolean(custom[index]?.trim());
  const focusInside = () => !!root.current?.contains(document.activeElement);

  const setIndex = (next: number) => {
    clearTimeout(timer.current);
    const target = Math.min(Math.max(next, 0), questions.length - 1);
    if (target === index) return;
    if (root.current?.querySelector("[data-slot=approval-card-step]:not([inert])")?.contains(document.activeElement)) refocus.current = "step";
    if (indexProp === undefined) setInnerIndex(target);
    onIndexChange?.(target);
  };
  const setState = (next: ApprovalState) => {
    clearTimeout(timer.current);
    if (next === state) return;
    if (focusInside()) refocus.current = "view";
    if (stateProp === undefined) setInnerState(next);
    onStateChange?.(next);
  };
  const send = () => { setState("sent"); onSubmitted?.(answers, custom); };
  const advance = () => (last ? send() : setIndex(index + 1));
  const close = () => { setState("closed"); onDismiss?.(); };
  /* a pointer dismissal fades the card out first; from a key, or under reduced motion, it is instant */
  const card = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const dismiss = (e?: { detail?: number }) => {
    if (leaving) return;
    if (state !== "open" || !fadesOnDismiss(e)) return close();
    clearTimeout(timer.current);
    setLeaving(true);
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => (leaving ? afterFadeOut(card.current, () => { setLeaving(false); closeRef.current(); }) : undefined), [leaving]);
  const startOver = () => { setAnswers({}); setCustom({}); setDecision(null); setAlways(false); if (indexProp === undefined) setInnerIndex(0); onIndexChange?.(0); setState("open"); };
  /* approve mode: one decision, then the card settles into its pill */
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  const [always, setAlways] = useState(false);
  const decide = (d: ApprovalDecision) => { setDecision(d); setState("sent"); onDecision?.(d, d === "approve" && always); };
  const settled = action ? (decision === "deny" ? t.denied : always ? t.alwaysAllowed : t.approved) : t.sentMessage;

  const toggle = (option: number) => {
    if (!question) return;
    clearTimeout(timer.current);
    const picked = answers[index] ?? [];
    const radio = question.type === "radio";
    const next = radio ? [option] : picked.includes(option) ? picked.filter((i) => i !== option) : [...picked, option].sort((a, b) => a - b);
    const nextAnswers = { ...answers, [index]: next };
    setAnswers(nextAnswers);
    if (radio) setCustom((cur) => ({ ...cur, [index]: "" }));
    onAnswerChange?.(index, next);
    /* a pointer pick moves on by itself; arrow keys only browse, Enter confirms */
    if (radio && document.documentElement.dataset.fndnInput !== "keyboard") {
      timer.current = setTimeout(() => {
        if (last) { setState("sent"); onSubmitted?.(nextAnswers, { ...custom, [index]: "" }); } else setIndex(index + 1);
      }, ADVANCE_MS);
    }
  };
  const typeCustom = (text: string) => {
    setCustom((cur) => ({ ...cur, [index]: text }));
    /* an emptied field (a pick clears it) leaves the pick and its auto-advance alone */
    if (!text) return;
    clearTimeout(timer.current);
    if (question?.type === "radio") setAnswers((cur) => ({ ...cur, [index]: [] }));
  };
  /* the radio-group clears its pick when a free-text answer is typed */
  const clear = () => setAnswers((cur) => ({ ...cur, [index]: [] }));
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing || !hasAnswer) return;
    if (!(e.target as HTMLElement).matches(`${CHOICE}, ${CUSTOM}`)) return;
    e.preventDefault();
    advance();
  };

  /* viewport height + track place for the active question (placeTrack); the first write never animates */
  const slide = (animate: boolean) => {
    const el = root.current;
    const viewport = el?.querySelector<HTMLElement>("[data-slot=approval-card-viewport]");
    const track = el?.querySelector<HTMLElement>("[data-slot=approval-card-track]");
    const step = track?.querySelector<HTMLElement>("[data-slot=approval-card-step]:not([inert])");
    if (!el || !viewport || !track || !step || state !== "open") return;
    el.setAttribute("data-measured", "");
    if (animate && measured.current) return placeTrack(viewport, track, step, true);
    placeTrack(viewport, track, step, false);
    measured.current = true;
  };

  useIsomorphicLayoutEffect(() => {
    if (state !== "open") measured.current = false;
    slide(true);
    const el = root.current;
    const pending = refocus.current;
    refocus.current = null;
    if (!el || !pending) return;
    if (pending === "view" && state !== "open") {
      el.querySelector<HTMLElement>(state === "sent" ? "[data-approval-card=reset]" : "[data-approval-card=reopen]")?.focus({ preventScroll: true });
      return;
    }
    const step = el.querySelector<HTMLElement>("[data-slot=approval-card-step]:not([inert])");
    const inputs = Array.from(step?.querySelectorAll<HTMLInputElement>(CHOICE) ?? []);
    (inputs.find((input) => input.checked) ?? inputs[0] ?? step?.querySelector<HTMLElement>(CUSTOM))?.focus({ preventScroll: true });
  }, [index, state, questions]);

  useEffect(() => {
    trackModality();
    const track = root.current?.querySelector("[data-slot=approval-card-track]");
    if (!track || typeof ResizeObserver === "undefined") return;
    /* text can rewrap when the card's width changes: follow without animating */
    const observer = new ResizeObserver(() => { measured.current = false; slide(false); });
    observer.observe(track);
    return () => { observer.disconnect(); clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} data-slot="approval-card" className={r.base({ state, class: className })} {...rest}>
      <span data-slot="approval-card-status" className={r.status()} role="status">{state === "sent" ? settled : ""}</span>
      <div ref={card} data-slot="approval-card-card" className={r.card({ leaving: leaving && state === "open", appear: entrance })} hidden={state !== "open"} onKeyDown={onKeyDown}>
        <Tooltip content={t.dismiss}>
          <Button data-approval-card="dismiss" className={r.dismiss()} variant="ghost" size="sm" shape="rounded" square muted aria-label={t.dismiss} onClick={dismiss} icon={<X data-slot="icon" weight="bold" />} />
        </Tooltip>
        {action ? (
          <>
            <div data-slot="approval-card-body" className={r.body()}>
              <div data-slot="approval-card-action" className={r.action()}>
                <div data-slot="approval-card-question" className={r.question()}>{action.title}</div>
                {action.description && <p data-slot="approval-card-description" className={r.description()}>{action.description}</p>}
                {action.command && <pre data-slot="approval-card-command" className={r.command()}><code>{action.command}</code></pre>}
                {action.details?.length ? (
                  <dl data-slot="approval-card-details" className={r.details()}>
                    {action.details.map((d, i) => (
                      <div key={i} data-slot="approval-card-detail" className={r.detail()}>
                        <dt data-slot="approval-card-detail-label" className={r.detailLabel()}>{d.label}</dt>
                        <dd data-slot="approval-card-detail-value" className={r.detailValue({ mono: !!d.mono })}>{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            </div>
            <div data-slot="approval-card-footer" className={r.footer()}>
              {alwaysAllow ? <Checkbox data-approval-card="always" className={r.always()} size="sm" label={t.alwaysAllow} checked={always} onCheckedChange={(c) => setAlways(c === true)} /> : <span />}
              <div data-slot="approval-card-actions" className={r.actions()}>
                <Button variant="ghost" size="sm" onClick={() => decide("deny")}>{t.deny}</Button>
                <Button variant="accent" size="sm" onClick={() => decide("approve")}>{t.approve}</Button>
              </div>
            </div>
          </>
        ) : (
        <>
        <div data-slot="approval-card-body" className={r.body()}>
          <div data-slot="approval-card-viewport" className={r.viewport()}>
            <div data-slot="approval-card-track" className={r.track()}>
              {questions.map((q, qi) => (
                <Question
                  key={qi}
                  name={`${id}-q${qi}`}
                  question={q}
                  active={qi === index}
                  picked={answers[qi] ?? []}
                  custom={custom[qi] ?? ""}
                  labels={t}
                  onToggle={toggle}
                  onClear={clear}
                  onCustom={typeCustom}
                />
              ))}
            </div>
          </div>
        </div>
        <div data-slot="approval-card-footer" className={r.footer()}>
          {/* one question needs no pager */}
          {questions.length > 1 && <Pager
            count={questions.length}
            page={index}
            onPageChange={setIndex}
            reel
            orientation="vertical"
            separator="/"
            unit={t.unit}
            label={t.pager}
            prevLabel={t.previous}
            nextLabel={t.next}
          />}
          <div data-slot="approval-card-actions" className={r.actions()}>
            <Button variant="ghost" size="sm" onClick={(e) => (last ? dismiss(e) : setIndex(index + 1))}>{t.skip}</Button>
            <Button variant="accent" size="sm" disabled={!hasAnswer} onClick={advance}>{last ? t.send : t.continue}</Button>
          </div>
        </div>
        </>
        )}
      </div>
      <div data-slot="approval-card-sent" className={r.sent({ ready })} hidden={state !== "sent"}>
        <StatusPill tone={action && decision === "deny" ? "neutral" : "green"} mark={!(action && decision === "deny")}>{settled}</StatusPill>
        {resettable && <Button data-approval-card="reset" className={r.reset()} variant="ghost" size="sm" muted onClick={startOver}>{action ? t.change : t.startOver}</Button>}
      </div>
      <Button data-approval-card="reopen" className={r.reopen({ ready })} variant="outline" size="sm" hidden={state !== "closed"} onClick={() => setState("open")}>{t.reopen}</Button>
    </div>
  );
}
