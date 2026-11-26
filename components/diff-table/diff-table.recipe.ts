import { tv, type VariantProps } from "../lib/tv";

/* diff-table — AI-proposed edits in tabular data. Each changed row is the control: click it, or
 * focus its include box and press Enter / Space, to include or exclude that edit before applying.
 * Native table semantics. The include box is the real Checkbox (size md, tone red for a removal,
 * green for an addition, aria-label on its input); the category is a small neutral StatusPill whose
 * dot takes the row's tone; "applied" is a green StatusPill with a mark; Apply is the real Button.
 *
 * The root is a size container with a definite width (380px, or less when its container is
 * narrower), so its width never comes from its content. In a phone-width card (container ≤ 340px)
 * the category column takes a little more and the cells an 8px inset, so a category pill
 * ("Enterprise", "年間契約") is shown whole and a one-word name ("Kubernetes") is not split.
 *
 * The row, cell, value-text and pill parts take the row's state as variants (change, included,
 * toggleable): the adapter knows it, and the rules read in one place.
 *
 * Motion (`docs motion`), all here:
 *   tint     a row's tint and its text colour change at duration.base (colour only)
 *   hover    a layer over the row, instant both ways (the tables' one hover); the press eases
 *   reveal   an added row arrives with the reveal recipe (grid rows 0fr → 1fr at duration.reveal
 *            easing.out-strong, opacity at duration.base), but only once the table has been
 *            painted: data-enter lands on the root after its first paint (lib/paint.ts), so the rows
 *            the table mounts with are simply there. Not a disclosure (no trigger, no open state),
 *            so it is not the collapsible.
 */

/* Spelled out in full below (Tailwind reads whole class names only):
 *   [@container(max-width:340px)]:          the phone-width card
 *   [&_[data-slot=status-pill]]:            the category StatusPill inside a cell
 *   [&>[data-slot=button]]:                 the Apply Button in the footer
 *   [[data-slot=diff-table][data-enter]_&]: inside a painted table only */

export const diffTable = tv({
  slots: {
    base: "@container w-[380px] max-w-full min-w-0",
    card: "relative overflow-hidden rounded-card bg-surface shadow-card",
    bar: "flex min-h-10 items-center justify-between gap-3 px-3 py-2.5 border-b border-line",
    title: "min-w-0 text-dense font-medium leading-[1.3] text-ink wrap-anywhere",
    hint: "shrink-0 text-2xs leading-[1.3] text-ink-2",
    table: "w-full table-fixed border-collapse text-start",
    /* its <col> elements: name · category · value (widths in the col variant) */
    col: "",
    th: [
      "px-3 py-2.5 border-b border-line overflow-hidden text-ellipsis whitespace-nowrap",
      "text-xs font-medium text-start text-ink-2",
      "[@container(max-width:340px)]:px-2",
    ],
    /* tint changes are colour only; --_bg is the row's own fill, which hover and press darken.
     * Toggled from the keyboard (Space on its include box) the row, its text and its pill change at
     * once, like the Checkbox they hold (kbd-instant zeroes only the element it sits on). */
    row: "kbd-instant border-b border-line last:border-b-0 [--_bg:var(--fndn-surface)] bg-(--_bg) motion-colors-base",
    /* the category is a StatusPill; a removal dims it with the row */
    cell: [
      "kbd-instant px-3 py-2.5 text-dense leading-[1.4] align-middle text-ink-2 motion-colors-base",
      "[@container(max-width:340px)]:px-2",
      "[&_[data-slot=status-pill]]:align-middle [&_[data-slot=status-pill]]:motion-opacity-base [&_[data-slot=status-pill]]:kbd-instant",
    ],
    /* an added row's cell content: reveal → clipping child → pad (the cell's padding) */
    reveal: [
      "grid grid-rows-[1fr] opacity-100 [&>*]:min-h-0 [&>*]:overflow-hidden",
      "[[data-slot=diff-table][data-enter]_&]:motion-size-reveal [[data-slot=diff-table][data-enter]_&]:motion-opacity-base",
      "starting:[[data-slot=diff-table][data-enter]_&]:grid-rows-[0fr] starting:[[data-slot=diff-table][data-enter]_&]:opacity-0",
    ],
    pad: "px-3 py-2.5 [@container(max-width:340px)]:px-2",
    /* the value and its include Checkbox */
    value: "flex min-w-0 items-center justify-between gap-2 [&>[data-slot=checkbox]]:shrink-0",
    /* author text keeps its own direction and is cut at its own end; the layout follows the page */
    valueText: [
      "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
      "no-underline decoration-[color-mix(in_srgb,var(--fndn-red)_50%,transparent)]",
      "[unicode-bidi:plaintext] [text-align:match-parent]",
    ],
    /* the summary follows the row-level selection; Apply is the real Button */
    footer: [
      "flex min-h-12 items-center justify-between gap-3 py-2.5 ps-3 pe-2.5 border-t border-line",
      "[&>[data-slot=button]]:text-xs [&>[data-slot=button]]:tabular-nums",
    ],
    summary: "min-w-0 [unicode-bidi:plaintext] text-[11.5px] tabular-nums text-ink-2",
    /* the accepted state is rare and final: a green StatusPill with a mark, which pops in once */
    applied: "tabular-nums [unicode-bidi:plaintext]",
    /* no rows: an EmptyState block across the columns */
    empty: "p-0",
  },
  variants: {
    col: {
      name: {
        col: "w-[34%] [@container(max-width:340px)]:w-[32%]",
        cell: "text-sm font-medium tabular-nums text-ink wrap-anywhere [unicode-bidi:plaintext] [text-align:match-parent]",
      },
      category: { col: "w-[30%] [@container(max-width:340px)]:w-[33%]" },
      value: { col: "w-[36%] [@container(max-width:340px)]:w-[35%]" },
    },
    change: {
      removed: {},
      added: { cell: ["p-0 [@container(max-width:340px)]:px-0 text-sm text-ink-3", "[&_[data-slot=status-pill]]:bg-surface"] },
      unchanged: {},
    },
    included: { true: {}, false: {} },
    toggleable: {
      true: {
        row: [
          "cursor-pointer select-none touch-manipulation",
          /* hover: a 4% ink layer over the fill, lit and unlit at once (the tables' one hover); the
           * press darkens the fill beneath it over duration.base, to 7% ink in all
           * (1 - 0.93 / 0.96 = 3.125% under the 4% layer) */
          "hover:[background-image:linear-gradient(color-mix(in_srgb,var(--fndn-ink)_4%,transparent),color-mix(in_srgb,var(--fndn-ink)_4%,transparent))]",
          "active:bg-[color-mix(in_srgb,var(--_bg),var(--fndn-ink)_3.125%)]",
          /* no hover layer without a fine pointer (touch): the press goes the whole 7% itself */
          "[@media_not_((hover:hover)_and_(pointer:fine))]:active:bg-[color-mix(in_srgb,var(--_bg),var(--fndn-ink)_7%)]",
        ],
      },
    },
  },
  compoundVariants: [
    /* removed, included → red tint, red text, struck value, dimmed pill */
    { change: "removed", included: true, class: { row: "[--_bg:var(--fndn-red-tint)]", cell: "text-red", valueText: "line-through" } },
    { change: "removed", included: true, class: { cell: "[&_[data-slot=status-pill]]:opacity-55" } },
    /* added, included → green; added, excluded → muted */
    { change: "added", included: true, class: { row: "[--_bg:var(--fndn-green-tint)]", cell: "text-green" } },
  ],
});

export type DiffTableRecipeProps = VariantProps<typeof diffTable>;
