import { tv, type VariantProps } from "../lib/tv";

/* breadcrumb — the trail to the current page. The models: the pager for the ghost muted square
 * Button and the caret that mirrors right-to-left, the text row for text that wraps whole and keeps
 * its own direction. 13px text on a 20px line; ancestors ink-2 → ink on hover and while pressed
 * (the inline-choice hover, colour only: text links do not scale); the current page ink; the
 * separators ink-3.
 *
 * Names are never cut: a long one wraps anywhere, and the trail wraps between items. A link keeps
 * its look but gets a hit area 6px taller above and below (not wider, so it never pokes out of a narrow row) (40px tall on coarse pointers) from an
 * ::after; its focus ring follows radius.chip. The ⋯ (the real Button, ghost xs square muted,
 * marked data-breadcrumb="ellipsis") is 24px, pulled onto the 20px line by negative block margins
 * so a folded trail is as tall as an unfolded one. Parts are found by data-slot; the root slot is
 * `base`. */

export const breadcrumb = tv({
  slots: {
    base: "min-w-0",
    list: "m-0 flex min-w-0 list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0 text-sm leading-5 text-ink-2",
    item: "inline-flex min-w-0 items-center",
    link: [
      "relative min-w-0 rounded-chip text-ink-2 no-underline wrap-anywhere [unicode-bidi:plaintext]",
      "motion-colors-fast [&[href]]:hover:text-ink [&[href]]:active:text-ink",
      "[&[href]]:after:absolute [&[href]]:after:inset-x-0 [&[href]]:after:-inset-y-1.5 [&[href]]:after:content-['']",
      "pointer-coarse:[&[href]]:after:-inset-y-2.5",
    ],
    page: "min-w-0 text-ink wrap-anywhere [unicode-bidi:plaintext]",
    separator: "inline-flex shrink-0 items-center text-[12px] text-ink-3 [&:dir(rtl)>[data-slot=icon]]:[transform:scaleX(-1)]",
    /* passed to the ⋯ Button as className, after its own classes */
    ellipsis: "-my-0.5",
  },
});

export type BreadcrumbRecipeProps = VariantProps<typeof breadcrumb>;
