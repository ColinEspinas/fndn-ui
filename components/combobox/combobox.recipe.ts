import { tv, type VariantProps } from "../lib/tv";
import { popup } from "../lib/popup";
import { option } from "../lib/option";
import { glideLayer } from "../lib/glide";
import { control, controlSize, controlVariant } from "../lib/control";

/* combobox — a select you can type into: the select's field-style control holding a text input,
 * and the select's list (popup surface, option rows, one gliding highlight) filtered by what is
 * typed. Behaviour comes from the Zag combobox machine (data-state, data-highlighted, data-focus…).
 * The popup lives in a portal, so nothing below depends on the root being an ancestor.
 *
 * The control is the shared control recipe (lib/control.ts), field kind: it shows the ring for every
 * kind of focus (the Input's rule), pointer included, and keeps it while the list is open (focus
 * stays in the input). Its sizes (xs 24 · sm 28 · md 32 · lg 36) and looks (outline, subtle,
 * ghost) are the control's. The caret is a real
 * Button (ghost, xs, square, muted) marked data-combobox="trigger"; its caret flips like the
 * select's, instant from the keyboard (kbd-instant on the indicator part); `caret: false` leaves it
 * out. An optional start part (an icon, an avatar, a status) sits before the text, and an optional
 * end part (a star, a status) after it, before the caret.
 *
 * Options may lead with an icon (a favicon, a file icon: the shared option row's icon). With
 * highlightMatch, the part of a label that matches what was typed stays in ink and the rest of
 * the label dims to ink-2 (Chrome's address suggestions, VS Code's quick open: the match says why
 * the option is there). Colour only, never weight: a bolder match would change the label's width
 * at every keystroke.
 *
 * The field's text is one run: a native input cannot style ranges (a host in ink, a path dimmer).
 * A display overlay is not worth its cost: see the spec's notes. */

const row = option();
const ctl = control({ kind: "field" });
const DIR = "[unicode-bidi:plaintext] [text-align:match-parent]";

export const combobox = tv({
  slots: {
    base: "inline-flex flex-col gap-1.5 min-w-0 max-w-full",
    label: "text-sm font-medium text-ink",
    /* the shared control recipe (lib/control.ts), field kind: a text field, so the ring shows for any
     * focus and stays while the list is open (focus stays in the input). The caret Button sits 2px
     * from the end. */
    control: [ctl.base(), "flex items-center ps-0 pe-0.5 cursor-text"],
    /* what sits before the text (an icon, an avatar, a status): text ink-2, icons ink-3 and 14px,
     * as far from the edge as the text would be (the size's padding), and the text 8px after it (the input
     * group's addon). Text: one line, cut at its end past 45% of the field (the adapter adds a
     * title while cut); elements: a centred row that never shrinks. A press on it is a press in the
     * field (the adapter); a control inside it (a button, a link) keeps its own */
    start: [
      "min-w-0 max-w-[45%] shrink-0 ps-(--control-px) overflow-hidden text-ellipsis whitespace-nowrap text-ink-2 [unicode-bidi:plaintext]",
      "has-[>*]:flex has-[>*]:items-center has-[>*]:gap-1.5 has-[>*]:overflow-visible has-[>*]:max-w-none [&>svg]:size-[14px] [&>svg]:shrink-0 [&>svg]:text-ink-3",
      /* the end part's mirror: beginning with a button (a site-info button, a scope picker), it sits
       * 2px from the edge, as the caret does at the end */
      "has-[>button:first-child]:ps-0.5",
    ],
    /* what sits after the text, before the caret (a bookmark star, a status, a count): the start
     * part's mirror. Text ink-2, icons ink-3 and 14px, a centred row that never shrinks; the text stops 8px before
     * it, and it keeps the size's padding from the edge (2px when it ends in a button, as the caret
     * does; the start part mirrors it). A press on it is a press in the field; a control inside it keeps its own */
    end: [
      "flex shrink-0 items-center gap-1.5 pe-(--control-px) text-ink-2 whitespace-nowrap [&>svg]:size-[14px] [&>svg]:shrink-0 [&>svg]:text-ink-3",
      "has-[>button:last-child]:pe-0.5",
    ],
    /* the control's bare input: fills it, so a click anywhere but the caret lands in the field */
    input: ctl.input(),
    /* the caret Button: its own hover and press. Open, it does not keep the ghost Button's open
     * fill: the field's ring already says the list is open, as on the select (whose caret has none) */
    trigger: "shrink-0 aria-expanded:bg-transparent aria-expanded:hover:bg-hover aria-expanded:active:bg-hover-2",
    /* carries kbd-instant: a list opened from the keyboard flips its caret at once */
    indicator: [
      "kbd-instant",
      "inline-flex text-[12px] [&>svg]:size-[1em] motion-transform-move",
      "[[data-combobox=trigger][data-state=open]_&]:rotate-180",
    ],
    positioner: "",
    /* the select's list: never narrower than the control (or 120px), then as wide as its longest
     * option, up to 360px; past that an option wraps */
    content: [popup({ drop: true }), "w-max min-w-[max(var(--reference-width,0px),120px)] max-w-[min(360px,calc(100vw-16px))]"],
    highlight: [glideLayer, "inset-x-1"],
    item: row.base(),
    /* optional leading icon (14px, ink-3), or a 14px image (a favicon) */
    itemIcon: [row.icon(), "[&>img]:size-[14px] [&>img]:rounded-[3px]"],
    itemText: row.text(),
    /* highlightMatch: the typed part of the label, in ink inside the dimmed label */
    itemMatch: "text-ink",
    itemMeta: [row.meta(), DIR],
    itemIndicator: row.indicator(),
    /* nothing matches: one quiet row (ink-2: it says why the list is empty), the height of an option */
    empty: [
      "flex items-center min-h-[var(--option-height,30px)] py-[5px] px-2 text-dense leading-[1.2] text-ink-2", DIR,
      "pointer-coarse:min-h-[max(40px,var(--option-height,30px))] pointer-coarse:text-md",
    ],
  },
  variants: {
    /* the shared control's sizes and looks; up to 28px the list's rows are 26px */
    size: {
      xs: { control: controlSize.xs, content: "[--option-height:26px]" },
      sm: { control: controlSize.sm, content: "[--option-height:26px]" },
      md: { control: controlSize.md },
      lg: { control: controlSize.lg },
    },
    variant: {
      outline: { control: controlVariant.outline },
      subtle: { control: controlVariant.subtle },
      ghost: { control: controlVariant.ghost },
    },
    /* a start part: the text begins 8px after it instead of at the size's padding. Physical sides
     * from the control's direction, as the input's own padding (its dir="auto" text must not
     * flip it) */
    start: {
      true: { input: "[:dir(ltr)>&]:pl-2 [:dir(rtl)>&]:pr-2" },
      false: {},
    },
    /* an end part: the text stops 8px before it */
    end: {
      true: {},
      false: {},
    },
    /* highlightMatch, on a label that contains what was typed: the label dims, its match stays ink */
    matching: {
      true: { itemText: "text-ink-2" },
      false: {},
    },
    /* no caret: the control ends at the text, which keeps the size's padding at its end */
    caret: {
      true: {},
      false: { control: "pe-0", input: "[:dir(ltr)>&]:pr-(--control-px) [:dir(rtl)>&]:pl-(--control-px)" },
    },
  },
  compoundVariants: [
    /* the end part holds the field's end padding; the text stops 8px before it */
    { end: true, class: { input: "[:dir(ltr)>&]:pr-2 [:dir(rtl)>&]:pl-2" } },
    /* before the caret the end part needs no padding of its own: the caret's box spaces it */
    { end: true, caret: true, class: { end: "pe-0 has-[>button:last-child]:pe-0" } },
  ],
  defaultVariants: { size: "md", variant: "outline", start: false, end: false, caret: true, matching: false },
});

export type ComboboxRecipeProps = VariantProps<typeof combobox>;
