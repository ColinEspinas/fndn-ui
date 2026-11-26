import { tv, type VariantProps } from "../lib/tv";

/* insight-cards — paged insights: header + pager, then one insight (sentence, chart card, follow-up).
 * Pages share one grid cell: the component is as tall as its tallest insight, so paging never
 * moves what sits below it. Inactive pages are visibility: hidden (out of the tab order and the
 * accessibility tree). Nothing here animates except the shared button press and gated hover:
 * page changes are instant and charts are data. Composed: count (title), pager (header),
 * empty-state (no insights), entity-chip and value-pill (in the sentence).
 *
 * Author text takes its direction from its own first letter (plaintext), so English in a
 * right-to-left page (and the reverse) keeps its punctuation in place. */

export const insightCards = tv({
  slots: {
    base: "flex flex-col w-full max-w-[344px] min-w-0 text-ink",
    header: "flex items-center justify-between gap-2 min-w-0",
    title: "flex items-baseline gap-1.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold",
    pages: "grid min-w-0",
    page: "[grid-area:1/1] flex flex-col items-start gap-2 min-w-0 pt-1.5",
    summary: "self-stretch m-0 min-w-0 text-dense leading-[1.6] text-ink-2 wrap-anywhere [unicode-bidi:plaintext]",
    card: "flex flex-col gap-2.5 self-stretch min-w-0 p-3 rounded-card bg-surface shadow-hairline",
    cardTitle: "min-w-0 text-xs font-medium leading-[1.35] text-ink wrap-anywhere [unicode-bidi:plaintext]",
    legend: "flex flex-wrap gap-x-4 gap-y-1.5 min-w-0 m-0 p-0 list-none",
    legendItem: "flex flex-[1_1_96px] flex-col gap-0.5 min-w-0",
    legendName: "flex items-center gap-1.5 min-w-0 text-[11.5px] leading-[1.3] text-ink-2",
    legendLabel: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext]",
    swatch: [
      "shrink-0 size-2 rounded-pill bg-accent",
    ],
    /* numbers are never truncated: a huge one wraps at its group separators instead. Signed
     * numbers read left-to-right in either direction; the box still sits at the start */
    legendValue: [
      "self-start text-[15px] font-semibold tracking-[-0.01em] leading-[1.2] tabular-nums text-ink wrap-anywhere",
      "[direction:ltr] [unicode-bidi:isolate]",
    ],
    /* the plot is stretched to this box; strokes keep their width */
    chart: "block w-full h-24 overflow-visible",
    line: [
      "fill-none stroke-accent stroke-2 [stroke-linecap:round] [stroke-linejoin:round] [vector-effect:non-scaling-stroke]",
    ],
    bar: "fill-accent",
    segment: "fill-accent",
    /* follow-up: the real Button (outline, sm) whose label may wrap; these classes go to its
     * root through className (whitespace and leading replace the button's own), the label inherits them */
    action: "max-w-full whitespace-normal text-start leading-[1.3] wrap-anywhere [unicode-bidi:plaintext]",
    rule: "stroke-line stroke-1 [vector-effect:non-scaling-stroke]",
  },
  variants: {
    /* the page shown; the others keep their room in the cell, unseen */
    active: { false: { page: "invisible" } },
    /* a series' colour: its swatch, line, bars or share segment */
    tone: {
      accent: {},
      orange: { swatch: "bg-orange", line: "stroke-orange", bar: "fill-orange", segment: "fill-orange" },
      red: { swatch: "bg-red", line: "stroke-red", bar: "fill-red", segment: "fill-red" },
      green: { swatch: "bg-green", line: "stroke-green", bar: "fill-green", segment: "fill-green" },
      neutral: { swatch: "bg-ink-3", line: "stroke-ink-3", bar: "fill-line-strong", segment: "fill-line-strong" },
    },
    /* the chart: a share is one 12px bar */
    kind: { line: {}, bar: {}, share: { chart: "h-3" } },
    /* a rule: the zero line, or a dashed threshold */
    rule: { zero: {}, threshold: { rule: "stroke-line-strong [stroke-dasharray:3_3]" } },
  },
});

export type InsightCardsRecipeProps = VariantProps<typeof insightCards>;
