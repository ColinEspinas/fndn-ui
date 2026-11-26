import { tv, type VariantProps } from "../lib/tv";
import { glideLayer } from "../lib/glide";

/* recommendation-card — agent suggestion with a confidence meter and actions.
 * The card holds its shape: every option's body is stacked in one grid cell, so the card is as
 * tall as the longest one and switching options crossfades in place (opacity and a 2px blur at
 * duration.base) without moving anything. "Alternatives" reveals a drawer listing the other
 * options (the active one is hidden there); picking one promotes it. The primary action confirms
 * and turns into "Accepted". With one option there is no Alternatives button and no drawer.
 *
 * Composed parts, rendered by the adapter: the card is the root of a collapsible whose trigger is
 * the Alternatives Button and whose region (the collapsible recipe's content and body) is the
 * drawer; bodies hold EntityChips and ValuePills; the actions are Buttons, at text-dense here.
 *
 * Author text takes its direction from its own first letter (plaintext), so an English question
 * in a right-to-left page keeps its question mark at its end; an alternative's name still starts
 * on the page's side. The drawer is the collapsible's content part, marked
 * data-recommendation-card="drawer". The alternatives share one gliding highlight (glideLayer,
 * moved by glide() of lib/glide.ts on hover and focus), as every list of options does. */

export const recommendationCard = tv({
  slots: {
    base: "w-full max-w-[380px] overflow-hidden rounded-card bg-surface shadow-card text-sm",
    status: "sr-only",
    body: "p-3",
    title: "block text-md font-medium text-ink wrap-anywhere [unicode-bidi:plaintext]",
    /* body crossfade: one cell, every option in it; the active one is sharp and opaque */
    texts: "grid mt-1.5",
    text: [
      "[grid-area:1/1] min-w-0 min-h-12 m-0 text-sm leading-[1.625] text-ink-2 wrap-anywhere [unicode-bidi:plaintext]",
      "opacity-0 blur-[2px] motion-opacity-base motion-filter-base",
    ],
    strong: "font-medium text-ink",
    drawer: "",
    /* a distinctly new section of the card */
    drawerList: "relative p-2 border-t border-solid border-t-line bg-surface",
    /* the one hover / focus fill of the alternatives, travelling between them; on the rows' 8px inset */
    highlight: [glideLayer, "inset-x-2 rounded-control"],
    drawerLabel: "m-0 pt-0 pb-1 px-1.5 text-2xs font-medium text-ink-2",
    /* a wrapped name keeps the meter and the label on its first line */
    alt: "relative z-1 flex w-full min-w-0 items-start gap-2.5 p-1.5 rounded-control text-start active:bg-hover-2 motion-colors-fast",
    /* an alternative is a choice: its name wraps rather than being cut */
    altShort: "min-w-0 flex-1 wrap-anywhere text-dense leading-4 text-ink [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    altLabel: "shrink-0 text-2xs leading-4 text-ink-2 whitespace-nowrap",
    /* 3-bar confidence meter; the tone colours the lit bars. The bars share one bottom edge and the
     * meter is a fixed 10px box (centred on a 16px line), so meters line up across rows. */
    meter: [
      "[--_tone:var(--fndn-ink-3)] inline-flex shrink-0 h-2.5 my-[3px] items-end gap-0.5",
    ],
    meterBar: "w-1 h-2.5 rounded-pill bg-line-strong motion-colors-base",
    footer: "flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-2.5 bg-surface",
    /* a long label or action wraps the actions under the confidence instead of squeezing it away */
    confidence: "inline-flex flex-[1_1_96px] min-w-0 items-center gap-2",
    confidenceLabel: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-dense font-medium text-ink-2 [unicode-bidi:plaintext]",
    /* two long actions stack (end-aligned) instead of running past the card */
    actions: "inline-flex flex-wrap justify-end max-w-full min-w-0 items-center gap-2 ms-auto me-[-2px] [&_[data-slot=button]]:text-dense",
  },
  variants: {
    /* the option shown: sharp and opaque */
    active: { true: { text: "opacity-100 filter-none" } },
    /* the meter's tone */
    tone: {
      neutral: {},
      green: { meter: "[--_tone:var(--fndn-green)]" },
      orange: { meter: "[--_tone:var(--fndn-orange)]" },
      red: { meter: "[--_tone:var(--fndn-red)]" },
      accent: { meter: "[--_tone:var(--fndn-accent)]" },
    },
    /* a lit bar */
    on: { true: { meterBar: "bg-[var(--_tone)]" } },
  },
});

export type RecommendationCardRecipeProps = VariantProps<typeof recommendationCard>;
