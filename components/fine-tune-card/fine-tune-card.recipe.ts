import { tv, type VariantProps } from "../lib/tv";
import { control, controlSize, controlVariant } from "../lib/control";

const ctl = control({ kind: "field" });

/* fine-tune-card — compact inspector: a layout switch (our segmented control), scrubbable number
 * fields (the Zag number-input machine) and a type picker (our select). The card marks itself
 * `changed` once anything differs from where it started; each field is `changed` when it
 * differs from its default (recipe variants). The "Adjust" hint and the "Edited · Reset" group share one
 * grid cell, so swapping them never moves the header: a crossfade with a 2px blur, never a jump.
 *
 * Composed parts, rendered by the adapter: the hint word is a Shimmer (fast, accent), Reset is a
 * ghost sm Button with a slimmer box (so the header keeps its height), the layout switch is a
 * SegmentedControl and the type picker a Select; marked data-fine-tune-card="hint-text|reset|layout"
 * (the Select passes on only its className: unmarked).
 *
 * Author text (title, field labels, footer label) takes its direction from its own first letter,
 * so a name in the other script keeps its ellipsis at its own end. */

/* a field's label turns accent while it is pressed, scrubbed or its input has focus */
const LABEL_ON = [
  "[[data-slot=fine-tune-card-scrubber]:active>&]:text-accent-ink",
  "[[data-slot=fine-tune-card-field][data-scrubbing]_&]:text-accent-ink",
  "[[data-slot=fine-tune-card-field][data-focus]_&]:text-accent-ink",
];

export const fineTuneCard = tv({
  slots: {
    base: "relative flex flex-col w-full max-w-[240px] min-w-0 rounded-card bg-surface shadow-raised",
    header: "flex items-center justify-between gap-2 min-w-0 py-2.5 px-3 border-b border-solid border-b-line",
    title: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-ink [unicode-bidi:plaintext]",
    state: "grid shrink-0 items-center justify-items-end",
    /* both states sit in the same cell; the one not shown is transparent, blurred and hidden */
    hint: [
      "[grid-area:1/1] inline-flex items-center gap-1.5 whitespace-nowrap",
      "motion-opacity-base motion-filter-base motion-also-[visibility_var(--fndn-duration-base)]",
    ],
    hintIcon: [
      "inline-flex shrink-0 items-center justify-center size-[18px] rounded-[5px] bg-accent-tint text-[10px] text-accent",
      "shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--fndn-accent)_30%,transparent)]",
    ],
    /* the Shimmer */
    hintText: "text-xs font-medium",
    edited: [
      "[grid-area:1/1] inline-flex items-center gap-1.5 whitespace-nowrap",
      "motion-opacity-base motion-filter-base motion-also-[visibility_var(--fndn-duration-base)]",
    ],
    editedText: "inline-flex items-center gap-[5px] text-xs font-medium text-green [&>[data-slot=icon]]:text-[11px]",
    /* the Button: its look and press, a slimmer box */
    reset: "-my-1.5 -me-1.5 px-1.5 text-ink-2",
    status: "sr-only",
    body: "flex flex-col gap-2 min-w-0 p-3 border-b border-solid border-b-line",
    section: "text-dense font-medium text-ink",
    /* the SegmentedControl */
    layout: "w-full",
    fields: "grid grid-cols-2 gap-2",
    /* a number field: scrub handle (the label), the input, an optional suffix */
    /* the shared control recipe (lib/control.ts): sm, subtle (an inspector field), field kind: the
     * ring for any focus, red when invalid, half opacity when disabled */
    field: [ctl.base(), controlSize.sm, controlVariant.subtle, "flex items-center gap-1 py-1 ps-0.5 pe-1"],
    /* a long label truncates and leaves the value at least half the field; the handle is small,
     * so it gets a larger invisible hit area */
    scrubber: [
      "relative flex min-w-0 max-w-[50%] items-center h-full rounded-[4px] cursor-ew-resize touch-none select-none",
      "after:content-[''] after:absolute after:inset-y-[-5px] after:inset-x-[-2px]",
    ],
    fieldLabel: [
      "min-w-0 overflow-hidden text-ellipsis px-0.5 text-xs leading-none whitespace-nowrap text-ink-2 cursor-[inherit] [unicode-bidi:plaintext]",
      "motion-colors-fast",
      /* :where keeps the hover below the accent states */
      "[@media(hover:hover)_and_(pointer:fine)]:[:where([data-slot=fine-tune-card-scrubber]:hover)>&]:text-ink",
      ...LABEL_ON,
    ],
    /* tabular figures: scrubbing never makes the value jitter in width */
    input: [
      "flex-1 min-w-0 h-full p-0 border-0 bg-transparent",
      "[font-family:inherit] [font-style:inherit] [font-weight:inherit] [font-stretch:inherit] [line-height:inherit]",
      "text-xs tabular-nums text-ink outline-none [@media(pointer:coarse)]:text-[16px]",
    ],
    suffix: "shrink-0 pe-0.5 text-[11.5px] text-ink-2",
    footer: "flex items-center justify-between gap-2 min-w-0 p-2.5",
    footerLabel: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ps-0.5 text-xs text-ink-2 [unicode-bidi:plaintext]",
    /* the Select */
    type: "shrink-0 w-[120px] -me-0.5",
  },
  variants: {
    /* the card: something differs from where it started (the hint gives way to Edited · Reset);
     * a field (passed to its slot): its value differs from its default */
    changed: {
      true: {
        hint: "opacity-0 blur-[2px] invisible",
        field: [
          "bg-accent-tint shadow-[0_0_0_1px_var(--fndn-accent)] forced-colors:[outline:1px_solid_Highlight]",
          /* the tint stays under the pointer: an edited field keeps saying so */
          "[@media(hover:hover)_and_(pointer:fine)]:[&:where(:hover:not(:focus-visible,:has(:focus-visible),[aria-expanded=true],[readonly],[data-readonly],[aria-readonly=true]))]:bg-accent-tint",
        ],
      },
      false: { edited: "opacity-0 blur-[2px] invisible" },
    },
  },
  defaultVariants: { changed: false },
});

export type FineTuneCardRecipeProps = VariantProps<typeof fineTuneCard>;
