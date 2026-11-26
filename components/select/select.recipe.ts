import { tv, type VariantProps } from "../lib/tv";
import { popup } from "../lib/popup";
import { option } from "../lib/option";
import { glideLayer } from "../lib/glide";
import { control, controlGhostTrigger, controlSize, controlVariant } from "../lib/control";

/* select — a control-style trigger (lib/control.ts) + raised popup that scales out of the trigger.
 * Behaviour comes from the Zag select machine (data-state, data-highlighted, data-disabled…).
 * The popup lives in a portal, so nothing below depends on the root being an ancestor.
 *
 * The popup surface, the option rows and the one gliding highlight are shared (the popup and
 * option recipes, glideLayer of lib/glide.ts), composed into the parts below; only what a select adds is written here. The positioner takes its stacking from base.css. Parts are found by
 * data-slot (select, select-trigger, select-content, select-item, …); the root slot is `base`. */

const row = option();
const ctl = control({ kind: "trigger" });

export const select = tv({
  slots: {
    base: "inline-flex flex-col gap-1.5 min-w-0 max-w-full",
    label: "text-sm font-medium text-ink",
    control: "flex min-w-0",
    /* the shared control recipe (lib/control.ts), trigger kind: the ring for keyboard focus and while
     * open, a press darkens it. The caret side is 2px tighter than the text side. */
    trigger: [
      ctl.base(),
      "inline-flex items-center justify-between gap-1.5 pe-[calc(var(--control-px)-2px)] leading-none",
    ],
    /* author text keeps its own direction (a Latin value on a right-to-left page keeps its word
     * order and is cut at its own end) while the layout follows the page */
    value: [
      /* the trigger is leading-none, so the value's line box is exactly the font size: 2px of block
       * padding, taken back by the margin, keep descenders (g, y) out of the clip, as the Button's
       * label does */
      "min-w-0 -my-0.5 py-0.5 overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext] [text-align:match-parent]",
      "[[data-slot=select-trigger][data-placeholder-shown]_&]:text-ink-3",
    ],
    /* carries kbd-instant: a popup opened from the keyboard flips its caret at once */
    indicator: [
      "kbd-instant",
      "inline-flex shrink-0 text-[12px] text-ink-3 motion-transform-move",
      "[[data-slot=select-trigger][data-state=open]_&]:rotate-180",
    ],
    positioner: "",
    /* Width: never narrower than the trigger (or 120px), then as wide as its longest option, up to
     * 360px. An option is what the user is choosing, so it is never cut: past the cap it wraps.
     * (The engine's sameWidth option stays off in every target: it pins the list to the trigger.) */
    content: [popup({ drop: true }), "w-max min-w-[max(var(--reference-width,0px),120px)] max-w-[min(360px,calc(100vw-16px))]"],
    /* the popup's 4px: the highlight sits on the rows */
    highlight: [glideLayer, "inset-x-1"],
    item: row.base(),
    itemText: row.text(),
    itemMeta: [row.meta(), "[unicode-bidi:plaintext] [text-align:match-parent]"],
    itemIndicator: row.indicator(),
    /* groups of options (in the anatomy; the adapters render a flat list today): a hairline
     * between two groups */
    group: "[[data-slot=select-group]+&]:mt-1 [[data-slot=select-group]+&]:pt-1 [[data-slot=select-group]+&]:border-t [[data-slot=select-group]+&]:border-line",
    groupLabel: row.label(),
  },
  variants: {
    /* the shared control's sizes; up to 28px the list's rows are 26px */
    size: {
      xs: { trigger: controlSize.xs, content: "[--option-height:26px]" },
      sm: { trigger: controlSize.sm, content: "[--option-height:26px]" },
      md: { trigger: controlSize.md },
      lg: { trigger: controlSize.lg },
    },
    /* the shared control's looks: outline (the form field), subtle (the inspector), ghost (reads
     * as text until touched: the model picker; as wide as its value unless given a width, then the
     * caret at the end, as the combobox's) */
    variant: {
      outline: { trigger: controlVariant.outline },
      subtle: { trigger: controlVariant.subtle },
      ghost: { trigger: [controlVariant.ghost, controlGhostTrigger] },
    },
  },
  defaultVariants: { size: "md", variant: "outline" },
});

export type SelectRecipeProps = VariantProps<typeof select>;
