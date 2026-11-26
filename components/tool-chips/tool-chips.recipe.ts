import { tv, type VariantProps } from "../lib/tv";

/* tool-chips — an agent run as compact rows: tool calls with inline value chips, then file-diff
 * chips. The run and every step are the real Collapsible (inline, caret first): it owns the
 * triggers' hover, press, caret and the reveal; the run and the steps are marked data-tool-chips="run|step"; this recipe sizes its parts (the trigger through
 * triggerClass, the caret, label and body by name from the collapsible's root). A step's tool glyph
 * sits over its caret and hands over to it on hover, focus or open. Each file chip is the real
 * hover-card trigger (its recipe classes) laid out as a row, previewing the diff.
 * Fully controlled: the host owns the steps, the diffs and which rows are open.
 *
 * Motion (`docs motion`), all here:
 *   mount     a mount is not an arrival: a plain mount shows its steps and diffs at once. With
 *             appear (the host's prop, for a run its code adds live) the steps present at first
 *             render fade up, staggered and capped (--fndn-row-index, set by the adapter only on
 *             those steps), and the diff row follows as one more beat, fading in place.
 *   arrival   a step added after mount always enters, with no delay, and opens its room; a diff
 *             row added after mount always fades in.
 *   run       the collapsible reveals the whole run as one container; nothing inside enters again
 *   row       the collapsible reveals the detail as one container; its lines do not move
 *   caret     the collapsible's caret turns; on a step it crossfades in place with the tool glyph */

export const toolChips = tv({
  slots: {
    base: "w-full max-w-[320px] min-w-0 pb-1",
    /* the run's collapsible root: its caret at 12px; -4px + 6px gives the rows' hover fills and
     * focus rings room inside the region's clip box */
    run: [
      /* its header: the collapsible's inline trigger at this component's size (text-dense, regular weight) */
      "[&>[data-slot=collapsible-trigger]]:gap-1.5 [&>[data-slot=collapsible-trigger]]:text-dense [&>[data-slot=collapsible-trigger]]:font-normal [&>[data-slot=collapsible-trigger]]:tabular-nums",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-caret]]:text-[12px]",
      "[&>[data-slot=collapsible-content]>[data-slot=collapsible-body]]:-mx-1",
      "[&>[data-slot=collapsible-content]>[data-slot=collapsible-body]]:px-1.5",
      "[&>[data-slot=collapsible-content]>[data-slot=collapsible-body]]:pt-0",
      "[&>[data-slot=collapsible-content]>[data-slot=collapsible-body]]:pb-1",
    ],
    rows: "flex flex-col gap-1 mt-1.5",
    /* a step's collapsible root. Only steps present at first render carry --fndn-row-index; a step
     * that arrives later enters at once. Its label lays the glyph, label and value out in a row
     * (the parts truncate themselves; the value chip's hairline must not be clipped). Its caret is
     * a 16px slot under the glyph, shown on hover, focus or open. */
    /* A step that arrives after the first render makes its room as it fades up, so the diffs below
     * slide down instead of jumping: its first track opens from minmax(0, var(--fndn-row-room)) at
     * @starting-style to minmax(0,1fr) over duration.reveal, out-strong (the collapsible's reveal).
     * The adapter sets --fndn-row-room: 0fr on an arriving step only; a step present at first render
     * starts at 1fr, so nothing moves on first paint. The second track holds the step's own region.
     * Clipped vertically only: the trigger bleeds 3px sideways.
     * fndn-check-ok: grid-template-rows is the sanctioned way to open room; one track, the step's own */
    step: [
      "grid grid-rows-[minmax(0,1fr)_auto] [overflow-y:clip] motion-size-reveal starting:grid-rows-[minmax(0,var(--fndn-row-room,1fr))_auto]",
      "animate-[fndn-fade-up_var(--fndn-duration-enter)_var(--fndn-easing-out-strong)_calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))_both]",
      /* the trigger stretched to a 28px row. The run's body clips (it is the reveal) and a step is
       * nearly as wide as it: the ring is drawn inside the step. */
      "[&>[data-slot=collapsible-trigger]]:w-[calc(100%+6px)] [&>[data-slot=collapsible-trigger]]:max-w-none [&>[data-slot=collapsible-trigger]]:h-7 [&>[data-slot=collapsible-trigger]]:-mx-[3px] [&>[data-slot=collapsible-trigger]]:px-[3px] [&>[data-slot=collapsible-trigger]]:py-0 [&>[data-slot=collapsible-trigger]]:text-ink",
      "[&>[data-slot=collapsible-trigger]:focus-visible]:outline-offset-[-2px]",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:flex",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:flex-[1_1_auto]",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:items-center",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:gap-2",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:overflow-visible",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-caret]]:size-4",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-caret]]:text-[12px]",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-caret]]:opacity-0",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-caret]]:motion-opacity-fast",
      "[&>[data-slot=collapsible-trigger]:is([data-state=open],:focus-visible)>[data-slot=collapsible-caret]]:opacity-100",
      "[@media(hover:hover)_and_(pointer:fine)]:[&>[data-slot=collapsible-trigger]:hover>[data-slot=collapsible-caret]]:opacity-100",
    ],
    /* the tool glyph, over the caret */
    icon: [
      "absolute inset-y-0 start-[3px] grid w-4 place-items-center text-[13px] text-ink-3 motion-opacity-fast",
      "[&>svg[data-slot=icon]]:size-[13px]",
      "[[data-slot=collapsible-trigger]:is([data-state=open],:focus-visible)_&]:opacity-0",
      "[@media(hover:hover)_and_(pointer:fine)]:[[data-slot=collapsible-trigger]:hover_&]:opacity-0",
    ],
    label: "flex-[0_1_auto] min-w-0 max-w-[60%] overflow-hidden text-ellipsis whitespace-nowrap text-dense font-medium text-ink [unicode-bidi:plaintext]",
    /* the value chip takes the row's hover fill, keeping its hairline */
    value: [
      "inline-flex flex-[1_1_0] min-w-0 h-[22px] items-center px-1.5 rounded-chip bg-field shadow-hairline",
      "text-[11.5px] font-normal text-ink-2 whitespace-nowrap motion-colors-fast",
      "[&>span]:min-w-0 [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:[unicode-bidi:plaintext]",
      "[@media(hover:hover)_and_(pointer:fine)]:[[data-slot=collapsible-trigger]:hover:not(:active)_&]:bg-hover",
      "[[data-slot=collapsible-trigger]:active_&]:bg-hover-2",
    ],
    /* the step's detail, inside its collapsible region */
    lines: "flex flex-col gap-0.5 min-w-0 mt-0.5 mb-1 ms-2 py-0.5 ps-3.5 border-s border-line",
    line: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] leading-[1.6] text-ink-2 [unicode-bidi:plaintext]",
    /* file-diff chips: the row enters as one beat after the steps. It sits on the run's clipping
     * edge: a rise would show its chips cut at the bottom, so it fades in place (the beat is kept). */
    diffs: [
      "flex flex-wrap gap-1.5 max-w-full mt-2.5 pt-2.5 border-t border-line",
      "animate-[fndn-fade-in_var(--fndn-duration-enter)_ease_calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))_both]",
    ],
    /* added to the hover-card's chip trigger: laid out so the counts stay whole and the file name
     * truncates */
    diff: [
      "inline-flex min-w-0 items-center gap-2 tabular-nums",
      "[&>span:first-child]:min-w-0 [&>span:first-child]:overflow-hidden [&>span:first-child]:text-ellipsis [&>span:first-child]:[unicode-bidi:plaintext]",
    ],
    /* a count reads "+13" / "−41" on a right-to-left page too */
    add: "shrink-0 text-green [direction:ltr] [unicode-bidi:isolate]",
    del: "shrink-0 text-red [direction:ltr] [unicode-bidi:isolate]",
    /* each file wraps its chip and lays out as if it were not there */
    file: "contents",
    more: [
      "inline-flex shrink-0 h-7 items-center px-1.5 rounded-chip font-mono text-[11.5px] tabular-nums whitespace-nowrap text-ink-2",
      "underline decoration-transparent underline-offset-2 hover:text-ink hover:decoration-current",
      "motion-colors-fast motion-transform-press active:scale-press",
    ],
  },
  variants: {
    /* appear=false (the default): the steps and the diff row present at mount are simply there;
     * what is added later still enters. Set per part by the adapter. */
    appear: { true: {}, false: { step: "animate-none", diffs: "animate-none" } },
    /* a value chip or a step's detail that is code */
    mono: { true: { value: "font-mono", lines: "font-mono" } },
    /* a detail line that was added */
    tone: { add: { line: "text-green" } },
    /* the last file also holds the more button and keeps the two on one line: it counts as 160px
     * when the row wraps, then grows into the room left, so the chip's file name truncates before
     * "+2 more" would go to a line of its own */
    withMore: {
      true: { file: "flex flex-[1_1_160px] min-w-0 max-w-full items-center gap-1.5" },
    },
  },
});

export type ToolChipsRecipeProps = VariantProps<typeof toolChips>;
