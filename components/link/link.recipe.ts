import { tv, type VariantProps } from "../lib/tv";

/* link — a link in running text, or one on its own ("View all deploys").
 *
 * Inline: always underlined (colour alone does not mark a link, accessibility.md), a 1px line 3px
 * under the text in a softer shade of the link's colour; hover gives the line the full colour.
 * Standalone: medium weight, no line at rest, the line on hover. Both wrap anywhere (a pasted URL
 * never overflows its column) and keep their own direction (plaintext).
 *
 * Tone: accent (accent-ink) for a link in product text; neutral (ink, the line in ink-3: the line
 * is all that marks it) for a link in quiet text (a footnote, a field hint, terms). Visited links
 * look the same: a product's links are navigation, not a reading list.
 *
 * Press: text links never scale (as breadcrumb's); a pointer press turns the text
 * accent (accent) or ink-2 (neutral) at once, the release eases back over duration.fast. The focus
 * ring is the global one (2px accent, 2px out), following a 3px radius on every line of a wrapped
 * link (box-decoration-clone).
 *
 * External: the arrow-up-right marker after the text (it mirrors right-to-left), kept on the last
 * word's line, and a visually hidden "(opens in a new tab)". */

export const link = tv({
  slots: {
    base: [
      "rounded-[3px] box-decoration-clone wrap-anywhere [unicode-bidi:plaintext] [touch-action:manipulation]",
      "underline decoration-1 underline-offset-[3px]",
      "motion-colors-fast active:duration-0",
      /* an icon in the text (data-slot=icon, 1em) sits on the text line */
      "[&>[data-slot=icon]]:inline-block [&>[data-slot=icon]]:align-[-0.125em]",
    ],
    /* the external marker: an inline icon that the underline skips, held to the last word */
    external: [
      "inline-block ms-0.5 align-[-0.1em] no-underline whitespace-nowrap",
      "[&>[data-slot=icon]]:size-[0.85em] [&>[data-slot=icon]]:inline-block [:dir(rtl)_&>[data-slot=icon]]:[transform:scaleX(-1)]",
    ],
  },
  variants: {
    variant: {
      inline: {},
      standalone: {
        base: [
          "relative font-medium decoration-transparent hover:decoration-current",
          /* a taller hit area on touch, not wider (it never pokes out of a narrow row) */
          "pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2.5 pointer-coarse:after:content-['']",
        ],
      },
    },
    tone: {
      accent: { base: "text-accent-ink active:text-accent" },
      neutral: { base: "text-ink active:text-ink-2" },
    },
  },
  compoundVariants: [
    { variant: "inline", tone: "accent", class: { base: "decoration-[color-mix(in_srgb,var(--fndn-accent-ink)_40%,transparent)] hover:decoration-accent-ink" } },
    { variant: "inline", tone: "neutral", class: { base: "decoration-ink-3 hover:decoration-ink" } },
  ],
  defaultVariants: { variant: "inline", tone: "accent" },
});

export type LinkRecipeProps = VariantProps<typeof link>;
