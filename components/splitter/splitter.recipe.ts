import { tv, type VariantProps } from "../lib/tv";

/* splitter — panels with a handle between each pair that resizes them (Ark UI splitter).
 *
 * The engine lays the root out (flex row, or column when vertical; width and height 100%; it
 * clips) and sizes every panel (flex-basis from its percentage), so nothing here sizes a panel.
 * The handle at rest is the separator's rule (1px, color.line); a mouse over it darkens it to
 * ink-3 (over duration.fast) and a drag turns it accent at once, both as colour only. Panels never animate: they follow the
 * pointer 1:1 and a key moves them at once.
 *
 * Touch: the handle's hit area is a ::after that reaches 4px each side under a mouse (9px) and
 * 20px each side on a coarse pointer (41px), without changing its look; the handle is positioned
 * and the panels are not, so the hit area sits above them. The engine puts touch-action: none on
 * the handle, so a drag never scrolls the page.
 *
 * The optional grip is centred on the rule by the handle's flex centring (an overflowing flex item
 * overflows both sides equally), never by a fractional translate.
 *
 * The engine sizes panels by flex-grow from a zero basis and puts overflow: hidden on them inline,
 * so a panel never pads itself (padding would skew the proportions) and the scroll is overridden
 * (overflow-auto!). A panel of plain text holds it in the text part, which pads it. */
export const splitter = tv({
  slots: {
    base: "min-w-0 min-h-0",
    /* a panel scrolls its own content and hands the wheel on to the page at its ends */
    panel: "min-w-0 min-h-0 overflow-auto!",
    text: "m-0 p-3 text-sm leading-normal text-ink-2 wrap-anywhere [unicode-bidi:plaintext]",
    handle: [
      "relative z-1 flex items-center justify-center shrink-0 self-stretch bg-line",
      "motion-colors-fast",
      /* hover fades in (duration.fast); a drag turns it accent at once (it answers the press), and
       * releasing fades back */
      "hover:bg-ink-3 data-dragging:bg-accent data-dragging:duration-0",
      "after:content-[''] after:absolute",
      "data-disabled:pointer-events-none",
    ],
    grip: "z-1 shrink-0 flex items-center justify-center rounded-chip bg-surface shadow-btn text-[10px] text-ink-3 [&>svg]:size-[1em]",
  },
  variants: {
    orientation: {
      /* panels side by side: the handle is a vertical rule */
      horizontal: {
        handle: "w-px after:inset-y-0 after:-inset-x-1 pointer-coarse:after:-inset-x-5",
        grip: "w-3 h-6",
      },
      /* panels stacked: the handle is a horizontal rule; the grip's dots lie down */
      vertical: {
        handle: "h-px after:inset-x-0 after:-inset-y-1 pointer-coarse:after:-inset-y-5",
        grip: "w-6 h-3 [&>svg]:rotate-90",
      },
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

export type SplitterRecipeProps = VariantProps<typeof splitter>;
