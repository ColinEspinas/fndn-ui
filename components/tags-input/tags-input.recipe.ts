import { tv, type VariantProps } from "../lib/tv";
import { control, controlSize, controlVariant } from "../lib/control";

const ctl = control({ kind: "field" });

/* tags-input — a field that collects values as tags: the shared control recipe (lib/control.ts, field
 * kind: sizes xs 24 · sm 28 · md 32 · lg 36, looks outline · subtle · ghost, the accent ring for
 * every kind of focus) holding a row of tags and a text input
 * that wraps onto new lines. Behaviour comes from the Zag tags-input machine (Enter or the
 * delimiter adds, Backspace highlights then removes the last tag, the arrow keys walk the tags,
 * a click highlights one, a double click edits one).
 *
 * One field, one focus: the control's ring is the only ring. Focus never leaves the text input
 * while the tags are walked, so a highlighted tag is shown as selected (the accent fill, its text,
 * dot and × in on-accent, like a selected token in a mail client) and the input's caret is hidden
 * meanwhile: one of the two shows, never both.
 *
 * A tag is the real Tag (size sm, removable: 22px, chip radius, its remove
 * Button), marked data-tags-input="item-preview"; only its states and its place are set here.
 * The 22px tags sit as far from the start as from the top, so one row is the size's height
 * (xs 1px, sm 3px, md 5px, lg 7px in), and the text starts where the Input's would.
 *
 * Motion: one thing moves. A tag removed with its × (the pointer) fades while its cell gives its
 * width back, so the tags after it slide into the room instead of jumping there (the leaving
 * variant). Everything done from the keyboard is instant: Enter, the delimiter and a paste add at
 * once, Backspace and Delete remove at once, the arrow keys select at once.
 *
 * Editing a tag moves nothing: the item is a one-cell grid holding the tag and its edit field.
 * The engine marks the tag `hidden` while it is edited, which the adapters undo, so the tag keeps
 * its box (a quiet accent-tint fill, its label and × invisible) and holds the cell at its own width;
 * the edit field lies over it, transparent, its text on the label's pixels, at least as wide as the
 * cell and wider when the text grows (the engine sets its width to its text). The selectors below
 * start at the item ([data-part=item]) so they out-rank the Tag's own colours, dark ones included. */

export const tagsInput = tv({
  slots: {
    base: "flex flex-col gap-1.5 min-w-0 max-w-full",
    label: "text-sm font-medium text-ink",
    /* the shared control recipe (lib/control.ts), field kind; it wraps, so its height is a minimum.
     * The text ends where the control's padding says (pe), the tags sit as far in as they are from
     * the top (the size's ps and py below) */
    control: [ctl.base(), "flex flex-wrap items-center gap-1 h-auto cursor-text"],
    /* one cell: the tag and its edit field on top of each other. The cell is a flexible track (as
     * wide as what it holds), so it can close when the tag leaves; the margin moves with it */
    item: [
      "inline-grid grid-cols-[minmax(0,1fr)] min-w-0 max-w-full [&>*]:[grid-area:1/1]",
      "motion-size-reveal motion-also-[margin_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong)]",
    ],
    itemPreview: [
      "max-w-full motion-opacity-fast",
      /* selected (data-highlighted: Backspace, the arrow keys, a click): the accent fill, at once.
       * The ×'s colour follows at once too (its own hover fill still fades) */
      "[[data-part=item]>&[data-highlighted]]:bg-accent [[data-part=item]>&[data-highlighted]]:border-accent [[data-part=item]>&[data-highlighted]]:text-on-accent",
      "[[data-part=item]>&[data-highlighted]_[data-slot=tag-dot]]:bg-on-accent",
      "[&_[data-tag=remove]]:[--fndn-m-colors:background-color_var(--motion-fast)]",
      /* being edited (its edit field is shown): the same box with a quiet fill, its label and ×
       * kept for their width but not drawn; the dot of an outline tag stays, in its own hue (the
       * engine keeps the tag highlighted while it is edited, so these out-rank the selected look) */
      "[[data-part=item]:has(>[data-part=item-input]:not([hidden]))>&]:bg-accent-tint [[data-part=item]:has(>[data-part=item-input]:not([hidden]))>&]:border-transparent",
      "[[data-part=item]:has(>[data-part=item-input]:not([hidden]))>&_[data-slot=tag-dot]]:bg-(--_hue)",
      "[[data-part=item]:has(>[data-part=item-input]:not([hidden]))>&>:not([data-slot=tag-dot])]:invisible",
    ],
    /* the edit field: over the tag, transparent, the label's type; its text starts where the label's
     * does (tagVariant below), and 1px of bottom padding lifts it onto the label's baseline (an
     * input centres its line a hair lower than the Tag's flex row). Before the engine sets its
     * width, it is the cell's (w-0, min-w-full).
     * Selected text (the engine selects it all) is the accent fill, as the selected tag is. */
    itemInput: [
      "relative z-1 h-[22px] w-0 min-w-full max-w-full m-0 border border-solid border-transparent p-0 pe-1.5 pb-px rounded-chip bg-transparent outline-none",
      "text-[11.5px] font-normal leading-none text-ink [font-family:inherit] [unicode-bidi:plaintext]",
      "selection:bg-accent selection:text-on-accent",
      "pointer-coarse:text-[16px]",
    ],
    /* the control's bare input, one tag high: takes what is left of the row, or a row of its own
     * when a tag leaves it less than 64px. Its 5px and the tags' inset put the text where the
     * control's padding would (6 · 8 · 10 · 12px in). Its caret hides while a tag is selected. */
    input: [
      ctl.input(), "w-auto min-w-16 h-[22px] [:dir(ltr)>&]:pl-[5px] [:dir(rtl)>&]:pr-[5px]",
      "[:has(>[data-part=item]>[data-highlighted])>&]:caret-transparent",
    ],
  },
  variants: {
    size: {
      xs: { control: [controlSize.xs, "py-px ps-px"] },
      sm: { control: [controlSize.sm, "py-[3px] ps-[3px]"] },
      md: { control: [controlSize.md, "py-[5px] ps-[5px]"] },
      lg: { control: [controlSize.lg, "py-[7px] ps-[7px]"] },
    },
    variant: {
      outline: { control: controlVariant.outline },
      subtle: { control: controlVariant.subtle },
      ghost: { control: controlVariant.ghost },
    },
    /* where the Tag's label starts, so the edit field's text lands on it: after the same 1px border
     * (drawn transparent, so it snaps to the device pixels as the Tag's does) the padding, 6px; an
     * outline tag also has its dot and gap first (6 + 6 + 5px) */
    tagVariant: {
      tint: { itemInput: "ps-1.5" },
      outline: { itemInput: "ps-[17px]" },
    },
    /* removed with the pointer: the tag fades (duration.fast) while its cell closes to nothing and
     * takes the row's 4px gap with it (duration.reveal, out-strong), so the tags after it slide
     * into place as it goes; the adapter removes it when both are over, and nothing is left to
     * jump. The tag keeps its width and is clipped by the closing cell: its label is not re-cut on
     * the way. Under reduced motion duration.reveal is 0: the cell closes at once and the tag is gone
     * with it, nothing travels. */
    leaving: {
      true: {
        item: "grid-cols-[minmax(0,0fr)] -me-1 overflow-hidden",
        itemPreview: "opacity-0 pointer-events-none min-w-max",
      },
    },
  },
  defaultVariants: { size: "md", variant: "outline", tagVariant: "tint" },
});

export type TagsInputRecipeProps = VariantProps<typeof tagsInput>;
