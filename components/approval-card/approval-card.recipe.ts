import { tv, type VariantProps } from "../lib/tv";
import { glideLayer } from "../lib/glide";

/* approval-card — human-in-the-loop questions the agent asks before acting.
 * One question at a time. Every question sits in a vertical track; the viewport clips to the
 * active one and resizes to it while the track slides, so the swap reads as one move.
 * A single choice is a radio-group (layout="row"), a multi-select a list of checkbox rows; both
 * draw their own marks. Footer: a vertical pager (previous, rolling "1 / 3", next), ghost Skip
 * and accent Continue. Dismiss is a button; "Answers sent" is a status-pill with a mark.
 * The state prop: open | sent | closed. All three views stay in the DOM; `hidden` picks one.
 * Approve mode (the action prop) replaces the questions with one action to approve: its title,
 * description, command and details, an optional "Always allow" Checkbox in the footer and
 * Deny (ghost: no fill at rest, a secondary-filled pill read as a second button) / Approve (accent); deciding settles into an "Approved" (green) or "Denied"
 * (neutral) status-pill.
 *
 * Motion. A mount is not an arrival (`docs motion`): a plain mount shows the card at once.
 * It fades up when it arrives: on mount only with appear (the host's prop, for a card its code
 * adds live), and on every reopen. It fills backwards, not both: once in, the card rests on its own
 * opacity, which a pointer dismissal fades (the leaving variant, duration.fast; approval-card.logic.ts
 * afterFadeOut then hides it; from the keyboard and under reduced motion it is hidden at once).
 * Height, track and the pager's digit reel share duration.move + out-strong, so the card resizes,
 * the questions travel and the digit rolls as one object. The track rests in layout (a negative
 * margin, placeTrack), never on a transform; the transform only carries a move. The crossfade is
 * lighter (duration.base) and survives reduced motion. Dismiss, Start over and Open approval
 * are the real Button, marked data-approval-card="dismiss" | "reset" | "reopen"; the sent view and
 * the reopen button fade in (duration.base) once the card is gone; a single choice's options are the RadioGroup, marked
 * data-approval-card="options". */

export const approvalCard = tv({
  slots: {
    base: "relative w-full max-w-[320px] text-sm",
    status: "sr-only",
    card: [
      "relative overflow-hidden rounded-card bg-surface shadow-card",
      "animate-[fndn-fade-up_var(--fndn-duration-enter)_var(--fndn-easing-out-strong)_backwards]",
    ],
    /* on the Button (ghost sm square rounded muted): pinned top right */
    dismiss: "absolute top-2.5 end-2.5 z-2",
    body: "p-3",
    /* fndn-check-ok: the card has to change size between questions; there is no transform
     * equivalent, and it is kept to duration.move */
    viewport: "kbd-instant overflow-hidden motion-size-move",
    track: "kbd-instant relative flex flex-col gap-[26px] motion-transform-move",
    step: [
      "kbd-instant",
      "min-w-0 opacity-0 motion-opacity-base",
    ],
    /* author text takes its direction from its own first letter */
    question: "pe-7 text-md font-medium text-ink wrap-anywhere [unicode-bidi:plaintext]",
    /* on the RadioGroup, or the multi-select's own list (variant list) */
    options: "mt-2.5",
    highlight: glideLayer,
    /* approve mode (the action prop): the action described, then Approve / Deny. The heading is
     * the question part; then what it does, the exact command and its details. Nothing moves: the
     * card shows one decision, so there is no track to slide. */
    action: "flex min-w-0 flex-col gap-2",
    description: "m-0 text-sm text-ink-2 wrap-anywhere [unicode-bidi:plaintext]",
    /* the exact command, as the agent will run it: mono, wraps anywhere, reads left to right */
    command: [
      "m-0 px-2.5 py-2 rounded-control bg-inset text-start",
      "font-mono text-xs leading-5 text-ink whitespace-pre-wrap wrap-anywhere [direction:ltr]",
    ],
    details: "m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs leading-5",
    detail: "contents",
    detailLabel: "text-ink-2 whitespace-nowrap",
    /* a value keeps its own direction but sits on the page's side of its column, as its label does */
    detailValue: "m-0 min-w-0 text-ink wrap-anywhere [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    /* "Always allow": the real Checkbox where the pager sits in question mode, its box on the body's
     * 12px inset; its label may wrap */
    always: "min-w-0 ms-0.5",
    footer: "flex items-center justify-between gap-3 p-2.5",
    /* at the end, also when a single question has no pager before them */
    actions: "flex shrink-0 items-center gap-1.5 ms-auto -me-0.5",
    sent: "flex w-full items-center gap-3",
    /* on the Button (ghost sm muted), marked data-approval-card="reset" */
    reset: "shrink-0",
    /* on the Button (outline sm), marked data-approval-card="reopen" */
    reopen: "whitespace-nowrap",
  },
  variants: {
    /* set after the first render: the sent view and the reopen button fade in where the card was
     * (never on first paint; from the keyboard at once) */
    ready: {
      true: {
        sent: "kbd-instant starting:opacity-0 motion-opacity-base",
        reopen: "kbd-instant starting:opacity-0 motion-opacity-base",
      },
    },
    /* a detail value written in code (a path, a branch, a host) */
    mono: { true: { detailValue: "font-mono [direction:ltr]" } },
    /* the multi-select's checkbox rows: a column holding its glide layer */
    list: {
      true: { options: "relative flex flex-col" },
    },
    /* open | sent | closed: sent and closed replace the card with a pill or a reopen button */
    state: {
      open: {},
      sent: { base: "w-auto max-w-none" },
      closed: { base: "w-auto max-w-none" },
    },
    /* appear=false (the default) until the card has first been hidden: no entrance on mount (the adapter) */
    appear: { true: {}, false: { card: "animate-none" } },
    /* a pointer dismissal: the card fades out (duration.fast), then the host hides it */
    leaving: { true: { card: "opacity-0 pointer-events-none motion-opacity-fast" } },
    /* the question shown. Before the first measurement (data-measured, set on the root by the
     * adapter) only the active question exists. */
    active: {
      true: { step: "opacity-100" },
      false: { step: "[[data-slot=approval-card]:not([data-measured])_&]:hidden" },
    },
  },
});

export type ApprovalCardRecipeProps = VariantProps<typeof approvalCard>;
