import { tv, type VariantProps } from "../lib/tv";

/* task-rows — live agent task status: running, failed, completed.
 *   capsules  each row its own surface capsule; the radius morphs 22 → 14 while it is open
 *   list      one card, rows separated by hairlines
 * Each row is the real Collapsible (variant row); `row` is passed to it as className. The
 * collapsible owns the trigger's metrics, hover, press, caret and the reveal; the row lays out its
 * label part (badge · label · status · amount) and wraps the amount to a second line (at the end)
 * before the label is squeezed below 96px. The pills are the real StatusPill.
 * Fully controlled: the host owns every row's status and which rows are open.
 *
 * Motion (`docs motion`), all here:
 *   mount     a mount is not an arrival: a plain mount shows its rows at once. With appear (the
 *             host's prop, for a list its code adds live) the rows present at first render fade up,
 *             staggered and capped (--fndn-row-index, set by the adapter only on those rows)
 *   arrival   a row added after mount always fades up, with no delay
 *   expand    the collapsible reveals the details as one container; the capsule radius moves with
 *             it, in the same timing family
 *   status    a new badge or pill replaces the old one in its own fixed slot: marks scale in from
 *             0.5 with opacity, rings fade, status pills arrive out of a 2px blur. @starting-style
 *             armed by the ready variant, so nothing plays at first paint and a swap mid-way retargets
 *   loops     the running ring spins (also under reduced motion: it is the loading signal)
 * Each row is the real Collapsible, marked data-task-rows="row". */

export const taskRows = tv({
  slots: {
    base: "flex w-full max-w-[440px] min-w-0 flex-col gap-2 text-sm",
    row: [
      "self-stretch min-w-0 overflow-hidden rounded-[22px] bg-surface shadow-card",
      "data-[state=open]:rounded-window motion-radius-reveal",
      "animate-[fndn-fade-up_var(--fndn-duration-enter)_var(--fndn-easing-out-strong)_calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))_both]",
      /* the collapsible's label part holds the row */
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:flex",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:flex-wrap",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:items-center",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:gap-x-2.5",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:gap-y-0.5",
    ],
    /* 24px slot: the mark or the ring replace each other in place */
    badge: "grid shrink-0 size-6 place-items-center [&>*]:[grid-area:1/1]",
    mark: [
      "grid size-[22px] place-items-center rounded-[50%] bg-green text-[13px] text-on-accent",
      "opacity-100 [transform:scale(1)] motion-opacity-base motion-transform-press",
    ],
    /* a progress ring with the step number inside (24px track + 28% round-capped arc) */
    ring: [
      "relative grid size-6 place-items-center opacity-100 motion-opacity-base",
      "[&>svg]:absolute [&>svg]:inset-0 [&>svg]:size-6 [&>svg]:animate-[fndn-spin_1.1s_linear_infinite]",
    ],
    ringTrack: "stroke-line",
    ringArc: "stroke-ink-3",
    step: "relative text-[10.5px] font-semibold leading-none tabular-nums text-ink",
    /* a growing label still starts on the page's side */
    label: "flex-[1_1_96px] min-w-0 overflow-hidden text-ellipsis [unicode-bidi:plaintext] [&:dir(rtl)]:text-right",
    amount: "shrink-0 ms-auto text-dense tabular-nums whitespace-nowrap text-ink-2 [unicode-bidi:plaintext]",
    /* the live region stays mounted; only the StatusPill inside it is replaced. It sits before the
     * amount, so a pill that arrives takes room from the label and nothing after it moves. While
     * running the ring says it visually; the words are for assistive technology only. */
    status: [
      "inline-grid shrink-0 [&:has(>.sr-only)]:absolute",
      "[&>[data-slot=status-pill]]:opacity-100 [&>[data-slot=status-pill]]:[filter:blur(0)]",
      "[&>[data-slot=status-pill]]:motion-opacity-base [&>[data-slot=status-pill]]:motion-filter-base",
    ],
    /* details: the collapsible's region holds them */
    detailGrid: "grid grid-cols-[24px_minmax(0,1fr)] gap-2.5 mb-2.5 px-2.5",
    rail: "w-px h-full mx-auto bg-line",
    detailList: "flex min-w-0 flex-col gap-1.5",
    detail: "flex min-w-0 items-center justify-between gap-2.5",
    detailLabel: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-2 [unicode-bidi:plaintext]",
    detailMeta: "shrink-0 font-mono text-[11.5px] tabular-nums whitespace-nowrap text-ink-2 [unicode-bidi:plaintext]",
  },
  variants: {
    /* appear=false (the default): the rows present at mount are simply there; a row added later
     * still enters. Set per row by the adapter. */
    appear: { true: {}, false: { row: "animate-none" } },
    /* set after the first render: a new badge or pill enters from @starting-style, first paint does not */
    ready: {
      true: {
        mark: "starting:opacity-0 starting:[transform:scale(0.5)] motion-reduce:starting:[transform:none]",
        ring: "starting:opacity-0",
        status: "[&>[data-slot=status-pill]]:starting:opacity-0 [&>[data-slot=status-pill]]:starting:[filter:blur(2px)]",
      },
    },
    /* the mark: a green check, or a red cross a size smaller */
    tone: { green: {}, red: { mark: "bg-red text-[12px]" } },
    variant: {
      capsules: {},
      list: {
        base: "gap-0 self-start overflow-hidden rounded-card bg-surface shadow-card",
        row: "rounded-none data-[state=open]:rounded-none bg-transparent shadow-none border-b border-solid border-line last:border-b-0",
      },
    },
  },
  defaultVariants: { variant: "capsules" },
});

export type TaskRowsRecipeProps = VariantProps<typeof taskRows>;
