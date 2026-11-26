import { tv, type VariantProps } from "./tv";

/* control — the surface of every field-like control: the Input and the Textarea, the select's
 * trigger, the combobox's and the date picker's control, the tags input's, the input group (and
 * through the real Input: number input, pin input cells, password input, editable, clipboard's
 * field). A shared recipe: a component composes its slots into its
 * own parts and adds only what is its own (a caret, room for buttons, a wrap).
 *
 * The variant contract: `size` changes dimensions only, `variant`
 * is the look and works at every size.
 *
 *   size     height · text · inline padding · radius. One scale for everything a user presses or
 *            types into, buttons included: xs 24 · sm 28 · md 32 · lg 36. Set as two custom
 *            properties, --control-height and --control-px, so a part inside (the inner input, a
 *            pin cell, a tag row) sizes itself from them. Coarse pointers: 40px at least and 16px
 *            text (iOS zooms the page on a smaller focused field and never zooms back).
 *   variant  outline (the field colour and a hairline: the form field) · subtle (the inset grey
 *            with no edge: the inspector) · ghost (nothing until touched: reads as text)
 *   kind     field: holds a text field, so the ring shows for any focus, pointer included
 *            (:focus-within) · trigger: a button that opens a popup, so the ring shows for
 *            keyboard focus and while open (:focus-visible, aria-expanded), and a press darkens it
 *
 * States, decided once for every variant: hover takes the hover fill (not while focused, open or
 * read-only); focus and open take the surface fill and the accent ring (1px accent, 4px tint),
 * the same ring in every variant (one exception: an open ghost trigger, below); invalid shows a red hairline, and the red ring when focused;
 * disabled is half opacity and takes no pointer; read-only keeps its rest look (no hover fill) and
 * still shows the ring, since its value can be selected and copied. The rings are whole box-shadow
 * values, so they read back as written.
 *
 * Motion: the fill changes fast, the ring eases in at base (pointer); from the keyboard both are
 * instant (kbd-instant): Tab never waits for a ring. */

/* every variant, every size, every kind */
const BASE = [
  "w-full min-w-0 h-(--control-height) min-h-(--control-height) px-(--control-px)",
  "rounded-control text-ink outline-none",
  "placeholder:text-ink-3 placeholder:opacity-100",
  /* hover (a real pointer only): not while focused, open or read-only (the ring and the surface
   * say more). All of it inside :where(), so it never out-ranks the press (interaction.md) */
  "[@media(hover:hover)_and_(pointer:fine)]:[&:where(:hover:not(:focus-visible,:has(:focus-visible),[aria-expanded=true],[readonly],[data-readonly],[aria-readonly=true]))]:bg-hover",
  /* invalid: a red hairline at rest, the red ring when focused or open */
  "[&:is([aria-invalid=true],[data-invalid])]:[box-shadow:0_0_0_1px_var(--fndn-red)]",
  "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-default data-disabled:opacity-50 data-disabled:pointer-events-none",
  "pointer-coarse:min-h-10 pointer-coarse:text-[16px]",
  "kbd-instant motion-colors-fast motion-shadow-base",
];

/* the bare text input inside a composite control (combobox, date picker, tags input): it fills the
 * control, draws nothing, takes the page's font and the control's size, and starts where the
 * control's padding would have put it. That start is the page's (the control's direction), not
 * the text's: with dir="auto" a Latin value on a right-to-left page would take its padding on the
 * wrong side, so it is set physically from the control's direction */
const INPUT = [
  "flex-1 w-full min-w-0 h-full m-0 border-0 p-0 bg-transparent text-inherit outline-none",
  "[:dir(ltr)>&]:pl-(--control-px) [:dir(rtl)>&]:pr-(--control-px)",
  "[font-family:inherit] [font-weight:inherit] [font-style:inherit] tracking-[inherit] leading-[1.4] text-ellipsis",
  "placeholder:text-ink-3 placeholder:opacity-100",
  /* dir="auto": the text reads in its own direction, the alignment stays on the page's side */
  "[:dir(ltr)>&[dir=auto]]:text-left [:dir(rtl)>&[dir=auto]]:text-right",
  "pointer-coarse:text-[16px]",
];

/** size: dimensions only. Heights 24 · 28 · 32 · 36; text 12 · 13 · 14 · 14; padding 6 · 8 · 10 · 12;
 * radius chip (6px) up to 28px, control (8px) from 32px. */
export const controlSize = {
  xs: "[--control-height:24px] [--control-px:6px] rounded-chip text-xs",
  sm: "[--control-height:28px] [--control-px:8px] rounded-chip text-sm",
  md: "[--control-height:32px] [--control-px:10px] rounded-control text-md",
  lg: "[--control-height:36px] [--control-px:12px] rounded-control text-md",
} as const;

/** variant: the look at rest. Every other state is the same in every variant. */
export const controlVariant = {
  outline: "bg-field shadow-hairline",
  subtle: "bg-inset shadow-none",
  ghost: "bg-transparent shadow-none",
} as const;

/** kind: which focus shows the ring. */
export const controlKind = {
  field: [
    "focus-within:bg-surface focus-within:[box-shadow:0_0_0_1px_var(--fndn-accent),0_0_0_4px_var(--fndn-accent-tint)]",
    "[&:is([aria-invalid=true],[data-invalid]):focus-within]:[box-shadow:0_0_0_1px_var(--fndn-red),0_0_0_4px_var(--fndn-red-tint)]",
  ].join(" "),
  trigger: [
    "active:bg-hover-2",
    "[&:is(:focus-visible,[aria-expanded=true])]:bg-surface",
    "[&:is(:focus-visible,[aria-expanded=true])]:[box-shadow:0_0_0_1px_var(--fndn-accent),0_0_0_4px_var(--fndn-accent-tint)]",
    "[&:is([aria-invalid=true],[data-invalid]):is(:focus-visible,[aria-expanded=true])]:[box-shadow:0_0_0_1px_var(--fndn-red),0_0_0_4px_var(--fndn-red-tint)]",
  ].join(" "),
} as const;

/** a ghost trigger reads as a label until touched (the model picker): secondary ink until hovered,
 * focused or open. A press darkens it, as it does every trigger; it never scales: a scale takes a
 * share of the width, and a trigger is as wide as its row (a property row in a side panel).
 * Open, it stays a label: it keeps the darker fill an open ghost button keeps, with no field fill
 * and no ring (the list under it says it is open; a ring would turn a line of text into a field
 * beside rows that are still text). The ring is for keyboard focus, as on every trigger; an
 * invalid one keeps its red ring while open.
 * Width as every control: with no width given it is as wide as its value (the caret right after
 * it); given a width it fills it and the caret sits at the end, as the ghost combobox's does (the
 * field's end, as in GitHub's and Notion's property rows, where the whole row is the target) */
export const controlGhostTrigger = [
  "font-medium text-ink-2 hover:text-ink [&:is(:focus-visible,[aria-expanded=true])]:text-ink",
  "[&[aria-expanded=true]:not(:focus-visible)]:bg-hover-2",
  "[&[aria-expanded=true]:not(:focus-visible,[aria-invalid=true],[data-invalid])]:[box-shadow:none]",
].join(" ");

export const control = tv({
  slots: {
    base: BASE,
    input: INPUT,
  },
  variants: {
    size: {
      xs: { base: controlSize.xs },
      sm: { base: controlSize.sm },
      md: { base: controlSize.md },
      lg: { base: controlSize.lg },
    },
    variant: {
      outline: { base: controlVariant.outline },
      subtle: { base: controlVariant.subtle },
      ghost: { base: controlVariant.ghost },
    },
    kind: {
      field: { base: controlKind.field },
      trigger: { base: controlKind.trigger },
    },
  },
  compoundVariants: [{ variant: "ghost", kind: "trigger", class: { base: controlGhostTrigger } }],
  defaultVariants: { size: "md", variant: "outline", kind: "field" },
});

export type ControlSize = keyof typeof controlSize;
export type ControlVariant = keyof typeof controlVariant;
export type ControlRecipeProps = VariantProps<typeof control>;
