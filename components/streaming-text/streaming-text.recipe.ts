import { tv, type VariantProps } from "../lib/tv";

/* streaming-text — a streamed answer. The host feeds the words and sets done.
 * While streaming: a caret follows the words, cite chips pop in where they land, and the actions
 * and follow-ups already hold their space (hidden), so finishing never moves anything.
 * When done: the actions fade in, the follow-ups rise in a short capped stagger, and the sources
 * list can be revealed. Words themselves never animate: they arrive too often. A mount is not an
 * arrival (`docs motion`): what is there at mount (the caret, the cites already streamed,
 * the follow-ups of an answer mounted done) is simply there, unless the host sets appear on an
 * answer its code adds live; cites that stream in later and the follow-ups that come with done
 * always enter. The cite's pop-in fills backwards, not both: once in, the keyframe lets go of
 * transform so :active can press.
 *
 * Composed parts, rendered by the adapter: the actions are Buttons (xs, square, ghost, rounded,
 * muted) with tooltips; the sources toggle and list are a Collapsible (inline, no caret) whose
 * root lays out as part of the actions row (display: contents) and is restyled from here (its
 * trigger at this row's size: 24px, 12px text, chip radius); every source image is an Avatar,
 * restyled by the cite-avatar, avatar and source-avatar slots passed as its class.
 *
 * Author text takes its direction from its own first letter (plaintext).
 * The composed parts are marked data-streaming-text="action | sources |
 * cite-avatar | avatar | source-avatar"; the caret is a slot (streaming-text-caret) that other
 * blocks may render with this recipe's caret classes. */

export const streamingText = tv({
  slots: {
    /* room for a typical answer, so the block does not push the page down as words arrive */
    base: "w-full max-w-[380px] min-h-[15.5rem]",
    status: "sr-only",
    text: "m-0 text-sm leading-[1.625] text-ink wrap-anywhere [unicode-bidi:plaintext]",
    /* the caret keeps its box when done, so the last line never rewraps */
    caret: [
      "inline-block w-0.5 h-3 ms-0.5 rounded-pill bg-ink align-[-1px]",
      /* backwards, not both: once in, the caret rests on its own opacity, which done fades out */
      "animate-[fndn-fade-in_var(--fndn-duration-base)_var(--fndn-easing-out-strong)_backwards]",
    ],
    /* inline source chip: an inline-block whose one line box is the chip's height, so its text sits
     * on the paragraph's baseline (an inline-flex chip would take the avatar's bottom edge instead) */
    cite: [
      "inline-block h-[18px] me-1 px-[3px] rounded-[5px] bg-inset shadow-hairline",
      "text-ink-2 font-mono text-[10.5px] leading-[18px] no-underline whitespace-nowrap align-baseline",
      "hover:bg-hover hover:text-ink active:bg-hover-2 active:text-ink",
      "motion-colors-fast motion-transform-press active:scale-press",
      "animate-[fndn-pop-in_var(--fndn-duration-popup)_var(--fndn-easing-out-strong)_backwards]",
    ],
    /* the source's avatar (12px square) is centred in the chip's 18px line: top of the line plus 3px
     * (an avatar's own baseline is its initials' baseline, which moves with font rounding) */
    citeAvatar: "mt-[3px] me-1 align-top",
    /* hidden but present while streaming, fade in when done. No row gap: the sources region's
     * height alone moves what is below, down to 0 when it closes */
    actions: [
      "flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-0 mt-2",
      "motion-opacity-slow motion-also-[visibility_var(--fndn-duration-slow)_ease]",
    ],
    action: "",
    /* the Collapsible's root: its trigger sits after the buttons, its region wraps onto a line of
     * its own below them */
    sources: [
      "contents",
      "[&>[data-slot=collapsible-trigger]]:h-6 [&>[data-slot=collapsible-trigger]]:max-w-full [&>[data-slot=collapsible-trigger]]:gap-1.5",
      "[&>[data-slot=collapsible-trigger]]:ms-1.5 [&>[data-slot=collapsible-trigger]]:me-0 [&>[data-slot=collapsible-trigger]]:px-1 [&>[data-slot=collapsible-trigger]]:py-0",
      "[&>[data-slot=collapsible-trigger]]:rounded-chip [&>[data-slot=collapsible-trigger]]:text-xs [&>[data-slot=collapsible-trigger]]:font-normal",
      "[&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:inline-flex [&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:items-center [&>[data-slot=collapsible-trigger]>[data-slot=collapsible-label]]:gap-1.5",
      "[&>[data-slot=collapsible-content]]:flex-[0_0_100%] [&>[data-slot=collapsible-content]]:min-w-0",
    ],
    avatars: "inline-flex shrink-0",
    /* a ring in the page colour keeps the overlapping avatars apart */
    avatar: "not-first:-ms-1 shadow-[0_0_0_1.5px_var(--fndn-canvas)]",
    sourcesLabel: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-ink-2 tabular-nums",
    sourcesList: "flex flex-col mt-1.5 p-1 rounded-card bg-inset shadow-hairline",
    source: [
      "flex min-w-0 items-center gap-2 px-1.5 py-1 rounded-chip text-ink-2 text-xs leading-4 no-underline",
      "hover:bg-hover hover:text-ink active:bg-hover-2 active:text-ink motion-colors-fast",
    ],
    sourceAvatar: "",
    sourceName: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext]",
    sourceDomain: "shrink-0 max-w-[50%] ms-auto overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10.5px] text-ink-2 [unicode-bidi:plaintext]",
    /* one entrance when done: the title with the first row, rows in a capped stagger
     * (--fndn-row-index, set at render) */
    followups: "mt-2.5",
    followupsTitle: "m-0 text-xs font-medium text-ink-2",
    followupsList: "flex flex-col mt-0.5",
    followup: [
      /* the hairline is its own straight 1px line under the row (6px in, on the text), not the bottom
       * border of a rounded box, which would curl at both ends; the radius belongs to the hover fill */
      "relative flex min-w-0 items-center gap-2 -mx-1.5 p-1.5 rounded-chip",
      "after:content-[''] after:absolute after:inset-x-1.5 after:bottom-0 after:h-px after:bg-line after:pointer-events-none last:after:hidden",
      "text-ink text-dense leading-4 text-start hover:bg-hover active:bg-hover-2 motion-colors-fast",
      "[&>[data-slot=icon]]:size-[11px] [&>[data-slot=icon]]:shrink-0 [&>[data-slot=icon]]:text-[11px] [&>[data-slot=icon]]:text-ink-3",
    ],
    followupText: "min-w-0 wrap-anywhere [unicode-bidi:plaintext]",
  },
  variants: {
    /* streaming: the caret blinks in after the words; the actions and follow-ups hold their space,
     * unseen. done: the caret keeps its box, unseen; the actions fade in, the follow-ups title fades
     * in and its rows rise in a capped stagger (--fndn-row-index, set at render) */
    done: {
      false: {
        actions: "invisible opacity-0",
        followups: "invisible opacity-0",
      },
      true: {
        /* the caret leaves on the beat the actions arrive: a short fade (exit, duration.fast), then hidden */
        caret: "opacity-0 invisible animate-none motion-opacity-fast-out motion-also-[visibility_var(--fndn-duration-fast)]",
        followupsTitle: "animate-[fndn-fade-in_var(--fndn-duration-enter)_var(--fndn-easing-out-strong)_both]",
        followup: "animate-[fndn-fade-up_var(--fndn-duration-enter)_var(--fndn-easing-out-strong)_calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))_both]",
      },
    },
    /* appear=false (the default): the parts present at mount are simply there (set per part by
     * the adapter); after done, so it wins over done's entrances, and before stalled, whose blink
     * must still run */
    appear: { true: {}, false: { caret: "animate-none", cite: "animate-none", followupsTitle: "animate-none", followup: "animate-none" } },
    /* stalled (set by the adapter through streaming-text.logic.ts's stallTimer while streaming): no word
     * for duration.enter × 2, the caret blinks (a loop, so a literal 1s) so the stream does not look
     * frozen; the next word drops it. The fade-in keeps its place in the list, so it does not replay. */
    stalled: { true: { caret: "animate-[fndn-fade-in_var(--fndn-duration-base)_var(--fndn-easing-out-strong)_backwards,fndn-caret-blink_1s_steps(1)_infinite]" } },
    /* fill: as wide as its container, no reserved height */
    fill: { true: { base: "max-w-none min-h-0" } },
  },
  defaultVariants: { done: false },
});

export type StreamingTextRecipeProps = VariantProps<typeof streamingText>;
