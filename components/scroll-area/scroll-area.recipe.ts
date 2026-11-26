import { tv, type VariantProps } from "../lib/tv";

/* scroll-area — a native scroller with an overlay scrollbar of the system's own (Zag scroll-area
 * through Ark UI). Sizes have no model in the system: a 10px bar with 2px padding and a 6px thumb,
 * ink-3 at 45% (65% hovered, 80% dragged), so it reads on surface, canvas and inset alike, light or dark.
 *
 * The root is a flex column, so a height or a max-height given to it sizes the viewport
 * (min-h-0 lets it shrink below its content). The viewport hides the platform's scrollbar and
 * keeps scrolling native; it is focusable while it overflows (the engine), with the focus ring
 * drawn inside it so the root never clips it. The engine places each scrollbar absolutely (end
 * edge, bottom) and moves the thumb with a transform; we only show the bar while the pointer is
 * over the region, while it scrolls or while the thumb is dragged, and hide a bar whose direction
 * does not overflow. Parts are found by data-slot; the root slot is `base`.
 *
 * The engine gives the content `min-width: fit-content` so a wide child can scroll sideways. A
 * region that scrolls only vertically (orientation vertical, the default) takes it back: the content
 * is as wide as the viewport, so a row inside can truncate (an ellipsis, a min-w-0 flex child)
 * instead of stretching the content past the viewport; a word longer than the region breaks
 * (overflow-wrap: break-word, which leaves min-content alone) rather than poking out sideways.
 * horizontal and both keep the engine's. */

export const scrollArea = tv({
  slots: {
    base: "relative flex min-h-0 min-w-0 flex-col",
    viewport: [
      "min-h-0 w-full flex-1 rounded-[inherit] overscroll-x-contain",
      "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      "focus-visible:outline-offset-[-2px]",
    ],
    content: "",
    scrollbar: [
      "flex p-0.5 opacity-0 select-none touch-none motion-opacity-base",
      "data-hover:opacity-100 data-scrolling:opacity-100 data-dragging:opacity-100",
      "data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:flex-col",
      "data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-row",
      "data-[orientation=vertical]:not-data-overflow-y:hidden data-[orientation=horizontal]:not-data-overflow-x:hidden",
    ],
    thumb: [
      "shrink-0 rounded-pill bg-ink-3/45 motion-colors-base",
      "hover:bg-ink-3/65 data-dragging:bg-ink-3/80",
      "data-[orientation=vertical]:w-full data-[orientation=horizontal]:h-full",
    ],
    corner: "",
  },
  variants: {
    orientation: {
      /* over the engine's inline min-width (hence the !) */
      vertical: { content: "min-w-0! wrap-break-word" },
      horizontal: {},
      both: {},
    },
  },
  defaultVariants: { orientation: "vertical" },
});

export type ScrollAreaRecipeProps = VariantProps<typeof scrollArea>;
