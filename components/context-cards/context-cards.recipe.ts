import { tv, type VariantProps } from "../lib/tv";

/* context-cards — retrieved knowledge chunks with their sources. The chunk count is our count
 * (boxed), rendered by the adapter.
 *
 * A mount is not an arrival (`docs motion`): a plain mount shows everything at once. With
 * appear (the host's prop, for a set its code adds live) the header fades in with the first card
 * and the cards rise in a capped stagger (--fndn-row-index, set only on cards present at mount).
 * A card that arrives after mount always enters, with no delay.
 *
 * Author text takes its direction from its own first letter (plaintext), so Hebrew in a
 * left-to-right page keeps its punctuation in place. */

export const contextCards = tv({
  slots: {
    base: "flex w-full max-w-[380px] flex-col gap-2",
    header: [
      "flex min-w-0 items-center gap-2 px-0.5",
      "animate-[fndn-fade-in_var(--fndn-duration-enter)_var(--fndn-easing-out-strong)_both]",
    ],
    title: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-ink [unicode-bidi:plaintext]",
    card: [
      "min-w-0 overflow-hidden rounded-card bg-surface shadow-card",
      "animate-[fndn-fade-up_var(--fndn-duration-enter)_var(--fndn-easing-out-strong)_calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))_both]",
    ],
    bar: "flex min-w-0 items-center gap-2.5 px-3 py-2.5 border-b border-solid border-b-line",
    cardTitle: [
      "flex min-w-0 items-center gap-1.5 text-sm font-medium leading-[18px] text-ink",
      "[&>[data-slot=icon]]:size-[11px] [&>[data-slot=icon]]:text-[11px] [&>[data-slot=icon]]:text-ink-3",
      "[&>span]:min-w-0 [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap [&>span]:[unicode-bidi:plaintext]",
    ],
    chars: "shrink-0 ms-auto text-xs leading-[18px] text-ink-2 tabular-nums whitespace-nowrap [unicode-bidi:plaintext]",
    body: "m-0 pt-2 px-3 pb-1 text-dense leading-[1.625] text-ink-2 wrap-anywhere [unicode-bidi:plaintext]",
    footer: "flex min-w-0 px-3 pb-3 pt-0",
    /* source chip: arrives with its card (one entrance per card); presses like a chip */
    source: [
      "inline-flex min-w-0 max-w-full h-6 items-center gap-1.5 ps-[5px] pe-2",
      "rounded-pill bg-inset shadow-btn text-ink-2 text-xs font-medium leading-none no-underline",
      "hover:bg-hover hover:text-ink active:bg-hover-2 active:text-ink",
      "motion-colors-fast motion-transform-press active:scale-press",
      "[&>[data-slot=icon]]:size-[9px] [&>[data-slot=icon]]:text-[9px]",
    ],
    sourceName: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext]",
    /* 14px file-type square, tinted by its tone; a four-letter type (DOCX, XLSX) widens it a
     * little rather than being cut. lint-composition-ok: a three-letter file type (PDF, CSV) does
     * not fit our avatar, which holds two letters */
    badge: [
      "inline-flex shrink-0 min-w-3.5 h-3.5 items-center justify-center overflow-hidden rounded-[4px]",
      "bg-ink-3 text-on-accent text-[6.5px] font-bold tracking-[-0.2px] leading-none whitespace-nowrap",
    ],
  },
  variants: {
    /* appear=false (the default): what is present at mount is simply there; a card added later
     * still enters. Set per part by the adapter. */
    appear: { true: {}, false: { header: "animate-none", card: "animate-none" } },
    /* the file-type square's tint */
    tone: {
      neutral: {},
      red: { badge: "bg-red" },
      green: { badge: "bg-green" },
      orange: { badge: "bg-orange" },
      accent: { badge: "bg-accent" },
    },
  },
});

export type ContextCardsRecipeProps = VariantProps<typeof contextCards>;
