import { tv, type VariantProps } from "../lib/tv";
import { controlSize } from "../lib/control";

/* editable — text that turns into a field when you edit it (a title, a name, a value in a row).
 * Behaviour comes from the Zag editable machine: the preview and the input swap through their
 * hidden attributes; Enter or a click away saves, Escape cancels.
 *
 * The input is the real Input (asChild), so the field is the Input's box and ring. The preview
 * takes the same box without the fill: same height, same padding, same type, so the text does not
 * move when the field takes its place. A line box as tall as the control puts the preview's text
 * where the input centres its own. Hovered (pointer), it takes the hover fill: it can be edited.
 *
 *   field   the Input's sizes (the shared control's: xs 24 · sm 28 · md 32 · lg 36)
 *   inline  the text around it (font, size, weight, line height), 6px of padding taken back by a
 *           negative margin so the text lines up with its neighbours: a value in a TextRow
 *
 * multiline (a description): the field is the Input's textarea, one line high and growing with its
 * text (autoresize, no handle, no 72px minimum), and the preview takes the same box: the size's
 * height as a minimum, the textarea's padding and 1.5 leading, the text wrapped and shown whole
 * (pre-wrap). The text stays where it is when the field takes its place; only the ring appears.
 * The engine handles it: Enter is a new line, Cmd/Ctrl+Enter or a click away saves.
 *
 * The controls (edit, save, cancel) are real Buttons (ghost, xs, square, muted) with Tooltips,
 * marked data-editable="edit-trigger|submit-trigger|cancel-trigger". */

export const editable = tv({
  slots: {
    /* label above; the area and the controls share a row */
    base: "grid grid-cols-[minmax(0,1fr)] items-center gap-x-1 gap-y-1.5 min-w-0 max-w-full",
    label: "col-span-full text-sm font-medium text-ink",
    area: "flex min-w-0",
    preview: [
      "block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-control text-ink cursor-text",
      /* the text keeps its own direction; it stays on the page's side, set physically from the
       * element's direction (plaintext does not change it), as the TextRow does */
      "[unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
      "hover:bg-hover motion-colors-fast",
      "data-placeholder-shown:text-ink-3",
      "data-disabled:opacity-50 data-disabled:pointer-events-none",
    ],
    input: "",
    /* room for the two buttons of an edit (save, cancel) at rest too, so the field does not change
     * width when the edit starts */
    control: "inline-flex items-center gap-0.5 min-w-[50px]",
  },
  variants: {
    variant: {
      field: {},
      inline: {
        base: "inline-grid",
        /* w-auto flex-1: the box is the area plus the 6px it reaches out on each side, so the text
         * lines up with its neighbours and is not cut by the padding (w-full kept the area's width
         * and slid it 6px towards the start: the text ran 6px past the end). The input likewise. */
        preview: "w-auto flex-1 -mx-1.5 px-1.5 rounded-chip [font:inherit]",
        input: "w-auto flex-1 h-auto min-h-0 pointer-coarse:min-h-0 -mx-1.5 px-1.5 py-0 rounded-chip text-[length:inherit] leading-[inherit] [font-family:inherit]",
      },
    },
    /* the Input's sizes (lib/control.ts) */
    size: {
      xs: {},
      sm: {},
      md: {},
      lg: {},
    },
    multiline: {
      true: {
        preview: "h-auto whitespace-pre-wrap wrap-break-word overflow-visible text-clip",
        input: "min-h-(--control-height) resize-none overflow-hidden",
      },
    },
    /* the buttons take a column of their own; with several lines they sit at the top */
    controls: {
      true: { base: "grid-cols-[minmax(0,1fr)_auto]" },
    },
  },
  compoundVariants: [
    /* field: the Input's box (the control's size: height, padding, text, radius) and the line box
     * of the Input's text, placed where the Input centres it (half of what the line leaves) */
    { variant: "field", class: { preview: "h-(--control-height) py-[calc((var(--control-height)-1lh)/2)] px-(--control-px) leading-[1.4]" } },
    { variant: "field", size: "xs", class: { preview: controlSize.xs } },
    { variant: "field", size: "sm", class: { preview: controlSize.sm } },
    { variant: "field", size: "md", class: { preview: controlSize.md } },
    { variant: "field", size: "lg", class: { preview: controlSize.lg } },
    /* multiline: the textarea's box (input.recipe.ts multiline: 1.5 leading, the block padding that centres
     * one line in the size's height), at least one line high, then as tall as its text */
    { variant: "field", multiline: true, class: { preview: "h-auto min-h-(--control-height) leading-[1.5]" } },
    { variant: "field", multiline: true, size: "xs", class: { preview: "py-[3px]" } },
    { variant: "field", multiline: true, size: "sm", class: { preview: "py-[5px]" } },
    { variant: "field", multiline: true, size: "md", class: { preview: "py-[7px]" } },
    { variant: "field", multiline: true, size: "lg", class: { preview: "py-2" } },
    { multiline: true, controls: true, class: { base: "items-start" } },
  ],
  defaultVariants: { variant: "field", size: "md", multiline: false },
});

export type EditableRecipeProps = VariantProps<typeof editable>;
