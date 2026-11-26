import { tv, type VariantProps } from "../lib/tv";

/* empty-state — what a list, a table or a popup shows when there is nothing in it.
 *   row    one line in a list: the height of an option row (--option-height, 30px by default),
 *          padding-inline 8, 12px ink-2 (the icon ink-3); align="center" centres it. A hint that does not fit drops
 *          under the title rather than squeezing it.
 *   block  a centred stack for a popup or a table body: 32px icon tile, 13px/500 ink title,
 *          12px ink-2 hint, padding 32/16; always centred (block comes after align, so it wins).
 *          The tile is a hover-grey square with a soft hairline: in dark mode the inset grey sat
 *          below the surface with a lighter ring around it, a hole with a bright edge (the heaviest
 *          mark of the block).
 * action   what to do next (a Button, "New issue", "Clear filters"): under a block's text, at the end
 *          of a row's line. The host passes the real Button; nothing here styles it.
 * Author text reads in its own direction (plaintext); a start-aligned row keeps its alignment on
 * the page's side (physical, from the element's own direction, which plaintext does not change).
 *
 * Motion: it fades in at duration.base when it is shown out of `hidden` after its first paint (or
 * inserted with data-enter); data-enter arrives after the first paint (lib/paint.ts), so never on
 * first paint, never on the way out. data-enter is the shared flag of lib/paint.ts and stays an
 * attribute. */

export const emptyState = tv({
  slots: {
    base: [
      "flex min-w-0 items-center gap-2 min-h-[var(--option-height,30px)] px-2",
      "text-xs leading-[1.3] text-ink-2 wrap-anywhere",
      "opacity-100 motion-opacity-base data-enter:starting:opacity-0",
    ],
    icon: "inline-flex shrink-0 items-center justify-center text-[14px] text-ink-3",
    title: "m-0 min-w-0 [unicode-bidi:plaintext]",
    hint: "m-0 min-w-0 [unicode-bidi:plaintext]",
    action: "flex flex-wrap items-center gap-2",
  },
  variants: {
    align: {
      start: { base: "justify-start text-start" },
      center: { base: "justify-center text-center" },
    },
    size: {
      row: {
        base: "flex-wrap gap-y-0.5 py-1.5",
        title: "flex-[0_1_auto]",
        hint: "flex-[0_1_auto]",
        action: "ms-auto",
      },
      block: {
        base: "flex-col justify-center gap-1 px-4 py-8 text-center",
        icon: "size-8 mb-1.5 rounded-control bg-hover shadow-[0_0_0_1px_var(--fndn-line-soft)] text-[15px]",
        title: "text-sm font-medium text-ink",
        hint: "text-xs text-ink-2",
        action: "justify-center mt-2.5",
      },
    },
    /* a row's title followed by a hint ends in " ·" */
    hint: { true: {} },
  },
  compoundVariants: [
    { size: "row", hint: true, class: { title: "after:content-['_·']" } },
    {
      size: "row",
      align: "start",
      class: {
        title: "[&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
        hint: "[&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
      },
    },
  ],
  defaultVariants: { size: "row", align: "start" },
});

export type EmptyStateRecipeProps = VariantProps<typeof emptyState>;
