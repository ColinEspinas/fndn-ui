import { tv, type VariantProps } from "../lib/tv";
import { option } from "../lib/option";
import { glideLayer } from "../lib/glide";

/* listbox — the select's list, laid in the page: a box of option rows under one gliding
 * highlight, single or multiple choice. Behaviour comes from the Zag listbox machine (role=listbox
 * on the content, which takes focus; aria-activedescendant; data-highlighted, data-state on rows).
 *
 * The box is the popup's (surface, 4px padding, card radius, rows concentric inside it) without
 * the popup's lift and motion: it sits in the page, so it takes the field's hairline instead of
 * the raised shadow, and the field's accent ring when focused from the keyboard. Rows compose the
 * shared option row; the one highlight is the shared glide. It scrolls inside itself past 360px.
 *
 * flush (variant): no card. A list that is part of its pane (an editor's change list, an
 * explorer): no surface, no hairline, no padding, no height cap (the pane scrolls); the rows and
 * their highlight run edge to edge of the list, so their text lines up with the pane's own 8px
 * inset. The keyboard focus ring stays: it is the only sign the list holds focus. */

const row = option();
const DIR = "[unicode-bidi:plaintext] [text-align:match-parent]";

export const listbox = tv({
  slots: {
    base: "inline-flex flex-col gap-1.5 min-w-0 max-w-full",
    label: "text-sm font-medium text-ink",
    content: [
      "relative flex flex-col min-w-[120px] overflow-y-auto",
      "rounded-card text-ink outline-none",
      /* the content holds focus (the rows are reached through aria-activedescendant): the field's
       * accent ring when a key moved focus here; nothing after a press on a row (the engine focuses
       * the list from its mousedown, which Chromium counts as :focus-visible). data-fndn-focus-input
       * is set by trackModality. */
      "[:root[data-fndn-focus-input=keyboard]_&]:focus:[box-shadow:0_0_0_1px_var(--fndn-accent),0_0_0_4px_var(--fndn-accent-tint)]",
      "data-disabled:opacity-50 data-disabled:pointer-events-none",
      "motion-shadow-base",
    ],
    /* the list's cursor: on the row the adapter marks data-highlighted while the list is hovered or
     * holds focus; it fades out when neither */
    highlight: glideLayer,
    item: [row.base(), "shrink-0"],
    /* optional leading icon (14px, ink-3) and one-line description after the label: the shared
     * option row's. The description is the one part that is cut (the label keeps 70% of the row,
     * and wraps), so the adapter gives it a title with its full text. */
    itemIcon: row.icon(),
    itemText: row.text(),
    itemDescription: row.description(),
    /* at the row's end, before the check: a note, a count or a status letter (metaTone) */
    itemMeta: [row.meta(), DIR, "tabular-nums"],
    itemIndicator: row.indicator(),
  },
  variants: {
    /* the one control scale: xs 24 · sm 28 · md 32 · lg 36 rows (dimensions only). xs and sm are
     * the dense lists of editors (a source-control change list, an explorer); 12px text there */
    size: {
      xs: { content: "[--option-height:24px]", item: "py-1 text-xs" },
      sm: { content: "[--option-height:28px]", item: "text-xs" },
      md: { content: "[--option-height:32px]" },
      lg: { content: "[--option-height:36px]", item: "text-sm" },
    },
    /* the meta's tone: a status letter (M modified, A added, D deleted) in its colour; neutral is
     * the quiet ink-2 note or count */
    metaTone: {
      neutral: {},
      accent: { itemMeta: "text-xs font-medium text-accent-ink" },
      green: { itemMeta: "text-xs font-medium text-green" },
      orange: { itemMeta: "text-xs font-medium text-orange" },
      red: { itemMeta: "text-xs font-medium text-red" },
    },
    /* card: the popup's box laid in the page. flush: no box, part of its pane */
    variant: {
      card: { content: "max-h-[360px] p-1 bg-surface shadow-hairline", highlight: "inset-x-1" },
      flush: { content: "p-0 bg-transparent shadow-none" },
    },
  },
  defaultVariants: { size: "md", metaTone: "neutral", variant: "card" },
});

export type ListboxRecipeProps = VariantProps<typeof listbox>;
