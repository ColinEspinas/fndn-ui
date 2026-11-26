import { tv, type VariantProps } from "../lib/tv";
import { link } from "../link/link.recipe";

/* page-header — the strip at the top of a screen's content: a back link, a title, a description,
 * and the actions at the end of the title's line.
 *
 *   page  (default) the title of a page: 20px/600 ink on a 28px line, the description 13px ink-2
 *         under it, the back link 13px ink-2 above it. No padding and no edge of its own: it sits
 *         in the page's content column, which gives the inset and the gap to what follows.
 *   pane  the header row of a pane above a list (an inbox, a panel): one row at least 44px tall,
 *         16px in at both ends, a hairline (line) under it; the title 13px/600 with the
 *         description 12px ink-2 beside it on the same line, the back link before them on the
 *         title's first line (baseline), the lines centred in the row.
 *
 * Wrapping: nothing is cut. The title and the description wrap (anywhere, so an unbroken name
 * never overflows). The text keeps at least 10rem beside the actions (8rem in a pane, whose 13px
 * title is short: "Inbox  3 unread" and its action stay on one row at phone width); when the
 * actions do not fit beside that, they drop to their own line under the text, at its start, and
 * wrap among themselves. On a phone a page's two actions usually drop: the description then keeps
 * the full width instead of wrapping in a narrow column beside them. The actions sit on the title's first line: sm Buttons are 28px, the title's line is
 * 28px (page), and a pane's row centres them.
 *
 * The back link is the Link recipe (standalone, neutral) on an <a> or a <button>: 13px ink-2, ink
 * and underlined on hover, a taller hit area on touch; its arrow mirrors right-to-left. Author
 * text keeps its own direction ([unicode-bidi:plaintext]) and its alignment on the page's side.
 * Static: nothing moves but the link's colour. */

const backLink = link({ variant: "standalone", tone: "neutral" });
const SIDE = "[&:dir(ltr)]:text-left [&:dir(rtl)]:text-right";

export const pageHeader = tv({
  slots: {
    base: "flex min-w-0",
    back: [
      backLink.base(),
      "self-start font-normal text-sm leading-5 text-ink-2 hover:text-ink active:text-ink",
      /* the arrow sits at the page's start whatever the label's own script: the link's plaintext
       * would lay a Latin label out left to right in a right-to-left page, the arrow on its left */
      "[unicode-bidi:isolate]",
      "[&>[data-slot=icon]]:size-3.5 [&>[data-slot=icon]]:me-1 [&>[data-slot=icon]]:align-[-2px]",
      "[&:dir(rtl)>[data-slot=icon]]:[transform:scaleX(-1)]",
    ],
    row: "flex min-w-0 flex-wrap gap-x-4",
    text: "flex min-w-0",
    title: ["m-0 font-semibold text-ink wrap-anywhere [unicode-bidi:plaintext]", SIDE],
    description: ["m-0 text-ink-2 wrap-anywhere [unicode-bidi:plaintext]", SIDE],
    actions: "flex min-w-0 max-w-full flex-wrap items-center gap-2",
  },
  variants: {
    size: {
      page: {
        base: "flex-col gap-1",
        row: "items-start gap-y-3",
        text: "flex-[1_1_10rem] flex-col gap-1",
        title: "text-xl leading-7",
        description: "text-sm leading-5",
      },
      pane: {
        base: "flex-row flex-wrap content-center items-baseline gap-x-3 gap-y-1 min-h-11 px-4 py-2 border-b border-line",
        back: "self-baseline",
        row: "flex-1 items-center gap-y-2",
        text: "flex-[1_1_8rem] flex-row flex-wrap items-baseline gap-x-2",
        title: "text-sm leading-5",
        description: "text-xs leading-5",
      },
    },
  },
  defaultVariants: { size: "page" },
});

export type PageHeaderRecipeProps = VariantProps<typeof pageHeader>;
