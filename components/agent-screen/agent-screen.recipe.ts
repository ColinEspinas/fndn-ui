import { tv, type VariantProps } from "../lib/tv";

/* agent-screen — a framed capture of the agent's screen with its cursor and a recording badge.
 * The capture is an <img> when the host has one, else a neutral placeholder window drawn here
 * from tokens. The cursor layer is as large as the frame, so translating it by "x%, y%" puts its
 * top-left corner (the pointer's tip) at that point of the screen: a transform, never left/top.
 * The screen's coordinates are physical, so the cursor and the placeholder stay left-to-right.
 *
 * State and recording are variants of the frame's layers: the frame is rendered once and shown in
 * both the card and the viewer. The expand button is marked data-agent-screen="expand".
 * expandable: the real Button (outline, xs, square, rounded) with the real Tooltip sits on the
 * frame's bottom end corner (the frame and the button share the first grid cell) and opens the
 * real Dialog, whose body holds the viewer: the same frame, larger. The connecting spinner is the
 * real Spinner.
 *
 * Motion (`docs motion`), all here but the pulse's @keyframes:
 *   cursor    travels on transform at duration.slow easing.in-out-strong: the cursor is a pointer
 *             travelling across the screen, so it eases in and out like a hand moving a mouse, not
 *             like a UI element arriving; it fades (base) when it hides. Reduced motion: it jumps,
 *             the fade stays.
 *   loading   the connecting layer fades (base)
 *   rec       the badge pops in (popup, from scale.popup) and leaves faster (fast)
 *   pulse     the badge's dot: opacity only, so it keeps pulsing under reduced motion */

export const agentScreen = tv({
  slots: {
    /* the frame has no intrinsic width, so the root states one and shrinks in narrow containers */
    base: "relative grid gap-2.5 w-[340px] max-w-full min-w-0 m-0",
    frame: [
      "[grid-area:1/1] relative aspect-[16/10] overflow-hidden isolate rounded-window bg-inset shadow-card",
      "forced-colors:[outline:1px_solid_CanvasText]",
    ],
    media: "absolute inset-0 block size-full object-cover",
    /* placeholder: a neutral browser window */
    placeholder: "absolute inset-0 flex flex-col [direction:ltr] bg-surface",
    chrome: [
      "relative shrink-0 h-6 border-b border-line",
      "[background:radial-gradient(circle_at_12px_50%,var(--fndn-red)_3px,transparent_3.5px),radial-gradient(circle_at_22px_50%,var(--fndn-orange)_3px,transparent_3.5px),radial-gradient(circle_at_32px_50%,var(--fndn-green)_3px,transparent_3.5px),var(--fndn-inset)]",
      "after:content-[''] after:absolute after:top-[7px] after:bottom-[7px] after:start-12 after:end-[28%] after:rounded-pill after:bg-field",
    ],
    page: "flex flex-col gap-2.5 px-3 py-3.5",
    line: [
      "flex items-center gap-2 h-[18px]",
      "before:content-[''] before:shrink-0 before:size-[18px] before:rounded-[50%] before:bg-accent-tint",
      "after:content-[''] after:w-[46%] after:h-1.5 after:rounded-pill after:bg-line-strong",
      "first:after:w-[58%] nth-3:after:w-[34%] nth-4:after:w-[50%]",
    ],
    /* travels on transform; hidden while connecting and when the agent is idle */
    cursor: [
      "absolute inset-0 z-1 [direction:ltr] pointer-events-none",
      "[transform:translate(var(--fndn-agent-screen-cursor,42%,53%))]",
      /* lint-composition-ok: the cursor is a pointer travelling between targets, the move easing's own case */
      "motion-opacity-base motion-also-[transform_var(--fndn-duration-slow)_var(--fndn-easing-in-out-strong)] motion-reduce:[--fndn-m-also:initial]",
      "[&>[data-slot=icon]]:block [&>[data-slot=icon]]:-mt-0.5 [&>[data-slot=icon]]:-ms-[3px] [&>[data-slot=icon]]:text-[20px] [&>[data-slot=icon]]:text-ink",
      "[&>[data-slot=icon]]:[filter:drop-shadow(0_0_1px_var(--fndn-surface))_drop-shadow(0_1px_1.5px_var(--fndn-ink-3))]",
    ],
    /* connecting */
    loading: [
      "absolute inset-0 z-2 flex flex-col items-center justify-center gap-2.5 p-3 bg-inset",
      "opacity-0 invisible motion-opacity-base motion-also-[visibility_var(--fndn-duration-base)]",
    ],
    loadingText: "max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-ink-2",
    /* recording badge: pops in from its own top right corner (where it is pinned), leaves faster than it came. The screen is
     * physical (left-to-right in every page direction), and the placeholder window's three dots
     * sit at its top left, so the badge takes the right corner, over the empty end of the title bar
     * (a physical side on purpose, so written as the property) */
    rec: [
      "absolute z-3 top-2 [right:--spacing(2)] inline-flex items-center gap-[5px] h-5 ps-1.5 pe-2 rounded-pill bg-red",
      "text-2xs font-semibold leading-none tracking-[0.04em] whitespace-nowrap text-on-accent",
      "origin-top-right opacity-0 invisible [transform:scale(var(--fndn-motion-popup-scale))] motion-opacity-fast-out motion-transform-fast-out motion-also-[visibility_var(--fndn-duration-fast)]",
      "forced-colors:[forced-color-adjust:none] forced-colors:bg-[Mark] forced-colors:text-[MarkText]",
    ],
    recDot: "shrink-0 size-[7px] rounded-[50%] bg-current animate-[fndn-agent-screen-pulse_1.1s_ease_infinite_alternate]",
    /* the caption takes its direction from its own first letter, so a name in the other script
     * keeps its ellipsis at its own end */
    label: "min-w-0 px-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-ink [unicode-bidi:plaintext]",
    status: "sr-only",
    /* added to the Button: the frame's bottom end corner, above the frame's layers */
    expand: "[grid-area:1/1] [align-self:end] [justify-self:end] z-1 m-2",
    /* the viewer, in the Dialog (size lg) */
    viewer: "pb-4",
  },
  variants: {
    state: {
      loading: { cursor: "opacity-0", loading: "opacity-100 visible" },
      live: {},
      idle: { cursor: "opacity-0" },
    },
    recording: {
      true: { rec: "opacity-100 visible [transform:none] motion-opacity-popup motion-transform-popup motion-also-[visibility_var(--fndn-duration-popup)]" },
    },
    /* on the placeholder the badge sits in the 24px title bar, centred on the dots' line */
    placeholder: {
      true: { rec: "top-0.5" },
    },
    /* in the viewer the frame is as large as the window allows without scrolling */
    inViewer: {
      true: { frame: "w-[min(100%,(100dvh_-_160px)*16/10)] mx-auto" },
    },
  },
  defaultVariants: { state: "live" },
});

export type AgentScreenRecipeProps = VariantProps<typeof agentScreen>;
