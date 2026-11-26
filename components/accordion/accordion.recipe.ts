import { tv, type VariantProps } from "../lib/tv";
import { collapsible } from "../collapsible/collapsible.recipe";

/* accordion — a stack of disclosures that know about each other (Zag accordion through Ark UI:
 * one open at a time unless multiple, arrow keys between the headers). Each Ark item is a
 * collapsible root, its content the collapsible's content, so an item is the collapsible's row:
 * its trigger, caret, label, meta, region, body and text are the collapsible recipe's (variant
 * row) composed here, never copied. The reveal, the caret turn, the hover and press fills and the
 * keyboard's instant change all come from collapsible.recipe.ts.
 *
 * What the accordion adds:
 *   item     a 1px line under every item but the last (task-rows' list look)
 *   caret    turns down from this trigger's open state (the collapsible's own rule names its trigger)
 *   trigger  Ark disables an item's trigger natively (the collapsible uses data-disabled)
 *   card     the rows in one surface card that clips them, so the first and last row's hover
 *            follows the card's radius
 * Parts are found by data-slot (accordion, accordion-item, accordion-trigger, …); the root slot is
 * `base`. The exit's @keyframes (fndn-collapsible-exit) is the collapsible's. */

const row = collapsible({ variant: "row" });

export const accordion = tv({
  slots: {
    base: "flex w-full min-w-0 flex-col",
    item: "flex min-w-0 flex-col border-b border-solid border-line last:border-b-0",
    trigger: [row.trigger(), "disabled:opacity-50 disabled:pointer-events-none"],
    caret: [row.caret(), "[[data-slot=accordion-trigger][data-state=open]>&]:[transform:rotate(90deg)]"],
    label: row.label(),
    meta: row.meta(),
    content: row.content(),
    body: row.body(),
    text: row.text(),
  },
  variants: {
    variant: {
      plain: {},
      card: { base: "overflow-hidden rounded-card bg-surface shadow-card" },
    },
  },
  defaultVariants: { variant: "plain" },
});

export type AccordionRecipeProps = VariantProps<typeof accordion>;
