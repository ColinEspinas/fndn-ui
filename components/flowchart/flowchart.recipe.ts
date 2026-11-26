import { tv, type VariantProps } from "../lib/tv";

/* flowchart — a trigger node and an If / Else node on a dotted canvas, joined by a connector.
 * Each node is a kind pill above a card. The trigger card is a Menu's own trigger; condition rows
 * hold a Menu handle (inside a Tooltip) and two sm ghost Selects, and the card ends with a ghost
 * sm Add Button. Their popups live in portals and keep their own styling. The nodes stack above
 * the connector (z-index 1); the portaled popups sit on their own layers (--fndn-z-popup), so they
 * paint above the nodes without the canvas isolating them.
 *
 * Nothing here animates except the one-shot reveal of a row the pointer added (data-entering and
 * data-collapsed, set and cleared by the shared helper flowchart.logic.ts): it opens its room and fades up. The trigger card and the handles are Menu
 * triggers (marked data-menu="trigger"); the Add Button is marked data-flowchart="add".
 * The menu engine stamps dir="ltr" on its triggers; the trigger card and the handles follow the
 * page's direction instead, so they mirror right-to-left.
 *
 * The Add button keeps the button's own ink. */

export const flowchart = tv({
  slots: {
    base: [
      "relative flex flex-col items-center w-full min-w-0 py-6 px-4 rounded-card shadow-hairline text-ink",
      "bg-page bg-[image:radial-gradient(var(--fndn-line-strong)_1px,transparent_1.25px)] bg-size-[22px_22px] bg-center",
    ],
    /* the kind pill above the card; the Menu around the trigger card fills the node */
    node: "relative z-1 flex flex-col items-start gap-1.5 w-full min-w-0 [&>[data-slot=menu]]:flex [&>[data-slot=menu]]:w-full",
    kind: "inline-flex items-center h-[22px] px-2 rounded-chip text-[11.5px] font-medium leading-none whitespace-nowrap",
    card: "w-full min-w-0 rounded-window bg-surface shadow-card",
    icon: [
      "flex shrink-0 items-center justify-center size-9 rounded-control text-accent text-[16px]",
      "bg-[color-mix(in_srgb,var(--fndn-accent)_12%,var(--fndn-surface))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--fndn-accent)_20%,var(--fndn-surface))]",
    ],
    text: "flex flex-1 flex-col gap-0.5 min-w-0",
    /* wraps rather than truncates: trigger names often carry numbers */
    title: "wrap-anywhere text-sm font-semibold leading-[1.25]",
    caption: "text-xs leading-[1.4] text-ink-2 wrap-anywhere",
    caret: "flex shrink-0 text-[12px] text-ink-3",
    /* connector: runs from the trigger card's bottom to the condition card's top, behind its pill */
    edge: "relative z-0 shrink-0 w-[1.25px] h-16 -mb-7 bg-line-strong",
    conditions: "flex flex-col self-stretch gap-1 min-w-0 m-0 p-0 list-none empty:hidden",
    /* handle · joiner · clause; a clause that wraps continues under itself, not under the handle */
    /* a row the pointer added makes its room as it fades up, so the card grows with it instead of
     * snapping: flowchart.logic.ts sets data-entering and, for one frame, data-collapsed (0fr: the minimum is 0, so the 28px handle cannot hold it open), then the
     * one row track opens to 1fr over duration.reveal (the collapsible's reveal), clipped meanwhile.
     * lint-motion-ok: grid-template-rows is the sanctioned way to open room; the track is the row's own */
    row: [
      "grid grid-cols-[auto_28px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] [align-items:start] gap-x-1 min-w-0",
      "data-entering:animate-fade-up data-entering:overflow-hidden data-entering:motion-size-reveal",
      "data-collapsed:grid-rows-[minmax(0,0fr)]",
    ],
    /* a narrow grip still gets a 30px-wide target */
    handle: [
      "relative flex shrink-0 items-center justify-center w-[18px] h-7 rounded-chip text-ink-3 text-[14px] [direction:inherit]",
      "after:content-[''] after:absolute after:inset-y-0 after:inset-x-[-6px]",
      "motion-colors-fast hover:bg-hover hover:text-ink-2 active:bg-hover-2 active:text-ink data-[state=open]:bg-hover-2 data-[state=open]:text-ink",
    ],
    joiner: "flex items-center h-7 text-dense text-ink-2 whitespace-nowrap",
    operator: "flex items-center h-7 text-dense text-ink-2 whitespace-nowrap",
    clause: "flex flex-wrap items-center gap-x-1 gap-y-0 min-w-0",
    source: [
      "inline-flex shrink-0 items-center gap-1 max-w-full h-6 px-1.5 rounded-chip bg-surface shadow-btn",
      "text-xs font-medium leading-none whitespace-nowrap",
    ],
    sourceIcon: "flex shrink-0 text-[12px] text-ink-2",
    sourceText: "min-w-0 overflow-hidden text-ellipsis",
    /* the Button */
    add: "ms-[22px]",
  },
  variants: {
    kind: {
      trigger: {
        node: "max-w-[300px]",
        kind: "bg-[color-mix(in_srgb,var(--fndn-accent)_14%,var(--fndn-page))] text-[color-mix(in_srgb,var(--fndn-accent)_80%,var(--fndn-ink))]",
        card: [
          "flex shrink-0 items-center gap-2.5 p-2.5 text-start [direction:inherit]",
          "motion-shadow-base motion-colors-fast hover:shadow-raised active:bg-hover-2",
          "data-[state=open]:shadow-[0_0_0_1.5px_var(--fndn-accent),var(--fndn-shadow-card)]",
        ],
      },
      condition: {
        node: "max-w-[356px]",
        kind: "bg-[color-mix(in_srgb,var(--fndn-orange)_14%,var(--fndn-page))] text-[color-mix(in_srgb,var(--fndn-orange)_80%,var(--fndn-ink))]",
        card: "flex flex-col items-start gap-1 py-2 ps-2 pe-3",
      },
    },
  },
});

export type FlowchartRecipeProps = VariantProps<typeof flowchart>;
