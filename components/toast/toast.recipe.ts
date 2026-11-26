import { tv, type VariantProps } from "../lib/tv";

/* toast — the region (Ark's toaster group) and its toasts. A toast is a raised card: the floating
 * surface of the selection toolbar (surface, shadow.overlay) at the card radius, with the alert's
 * tone icon on the title's first line, then the text, an optional action and the close Button.
 *
 * Placement and stacking are the Zag toast machine's: the group is fixed in its corner (inline
 * styles), each toast is absolutely placed in it through custom properties the engine writes and
 * updates: --y (its offset, ±100% before it arrives and after it leaves), --opacity, --index,
 * --z-index and --height. The recipe turns them into `translate`, `opacity` and `scale`, and
 * transitions those: in over duration.slow, out over duration.base (shorter), both out-strong.
 * Toasts that exist on first paint do not slide in: the adapter sets `ready` after the first
 * paint, and until then nothing transitions. A dismissal from the keyboard is instant
 * (kbd-instant). overlap: the older toasts tuck behind the newest, 5% smaller per step, their
 * content hidden until the stack expands. Reduced motion: opacity only, no travel. */

const ICON = "inline-flex shrink-0 items-center justify-center h-5 text-[16px] [&>[data-slot=icon]]:size-4 [&>svg]:size-4";

export const toast = tv({
  slots: {
    /* mx-auto centres it at top and bottom, where the engine sets both insets */
    /* the engine resolves start / end to a physical side, then writes it as a logical inset on an
     * element that carries the page's dir, which flips it a second time under rtl: the region is
     * laid out ltr so the inset lands where the engine meant, and each toast takes the page's
     * direction back (rtl: matches the dir attribute on the region) */
    base: "w-[min(356px,calc(100vw-32px))] mx-auto outline-none [direction:ltr]",
    item: [
      "kbd-instant",
      "absolute inset-x-0 flex items-start gap-2.5 p-3 rounded-card bg-surface text-ink shadow-overlay",
      "text-sm leading-5 outline-offset-2 rtl:[direction:rtl]",
      "[translate:var(--x,0)_var(--y,0)] [opacity:var(--opacity,1)] [z-index:var(--z-index)] h-(--height)",
      "[scale:1] data-overlap:data-sibling:[scale:calc(1-var(--index,0)*0.05)]",
      "motion-also-[translate_var(--fndn-duration-slow)_var(--fndn-easing-out-strong),scale_var(--fndn-duration-slow)_var(--fndn-easing-out-strong),opacity_var(--fndn-duration-slow)_var(--fndn-easing-out-strong)]",
      /* it leaves faster than it came */
      "data-[state=closed]:motion-also-[translate_var(--fndn-duration-base)_var(--fndn-easing-out-strong),scale_var(--fndn-duration-base)_var(--fndn-easing-out-strong),opacity_var(--fndn-duration-base)_var(--fndn-easing-out-strong)]",
      /* reduced motion: no travel, the toasts fade in place (position and stacking still apply) */
      "motion-reduce:motion-also-[opacity_var(--fndn-duration-slow)_var(--fndn-easing-out-strong)]",
      "motion-reduce:data-[state=closed]:motion-also-[opacity_var(--fndn-duration-base)_var(--fndn-easing-out-strong)]",
      /* collapsed behind the newest, older toasts show only their edge: their content is hidden
       * (Sonner's stack) so no text peeks past the front toast; it fades back in when the stack
       * expands (hover, focus), with the toast's own timing */
      "data-overlap:data-sibling:overflow-hidden",
      "[&>*]:opacity-100 data-overlap:data-sibling:[&>*]:opacity-0 [&>*]:motion-opacity-slow-out [&>*]:kbd-instant",
    ],
    icon: ICON,
    content: "flex flex-col flex-1 min-w-0",
    title: "font-medium text-ink wrap-anywhere [unicode-bidi:plaintext]",
    description: "text-ink-2 wrap-anywhere [unicode-bidi:plaintext]",
    /* a 28px Button on the 20px title line */
    action: "shrink-0 -my-1",
    close: [
      "shrink-0 -my-0.5 -me-1",
      "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-2 pointer-coarse:after:content-['']",
    ],
  },
  variants: {
    tone: {
      neutral: {},
      accent: { icon: "text-accent" },
      green: { icon: "text-green" },
      orange: { icon: "text-orange" },
      red: { icon: "text-red" },
    },
    /* false until the region has been painted once: toasts present at mount do not slide in */
    ready: { false: { item: "transition-none! [&>*]:transition-none!" }, true: {} },
  },
  defaultVariants: { tone: "neutral", ready: true },
});

export type ToastRecipeProps = VariantProps<typeof toast>;
