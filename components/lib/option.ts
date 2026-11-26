import { tv, type VariantProps } from "./tv";

/* option — one row of a list the user picks from: select items, menu items, search results,
 * suggestion lists, the row layout of the checkbox and the radio group. A shared recipe (no spec,
 * no adapter): a component composes its slots into its own parts and adds only what is its own.
 *
 *   const row = option();
 *   item: row.base(), itemText: row.text(), itemIndicator: row.indicator(), groupLabel: row.label()
 *
 *   base         the row. size sm 26px | md 30px | lg 36px through --option-height; 40px minimum
 *                and 14px text on coarse pointers. A list sets one size for all its rows with
 *                [--option-height:…] on the list (md writes nothing, so the list's value holds).
 *                5px block padding: a single line keeps that height, a wrapped label grows the
 *                row (and the glide with it).
 *   icon         optional leading icon: 14px, ink-3 (danger: the row's colour)
 *   text         the label: takes the free space. The name of a choice is shown whole:
 *                past the list's width it wraps, never cut. Author text keeps its own
 *                direction (unicode-bidi: plaintext) while the row's alignment follows the page.
 *   description  optional second run after the label (lg rows): 12px ink-2. The one part that
 *                truncates: it gives way to the label, which keeps up to 70% of the row, and it
 *                needs a `title` with its full text. It sits on the label's first line (baseline),
 *                also when the label wraps.
 *   meta         optional trailing note or shortcut: 2xs, ink-2, never wraps
 *   indicator    optional trailing check: keeps its space on every row so trailing notes line
 *                up; shown when the row is data-state="checked"
 *   label        group label: 2xs/500 ink-2, padding 6px 8px 4px; wraps like the label
 *   separator    1px `line` rule that bleeds 4px into the popup padding
 *
 * States (written by Ark UI): data-highlighted paints nothing on the row: the list's one glide
 * layer (glideLayer of lib/glide.ts) travels to it (glide(list, layer, { rows: "[data-slot=select-item]",
 * follow: "highlighted" }), or follow: "hover" for lists without an engine). A list never paints
 * a per-row highlight. Press: `hover-2` on the row at duration.fast, above the glide. data-disabled:
 * half opacity, no pointer. data-state="checked": label weight 500 and the indicator. tone danger:
 * red text and icon. The row sits above the glide (relative, z-1); the list is the glide's offset
 * parent (a popup already is). */

const DIR = "[unicode-bidi:plaintext] [text-align:match-parent]";

export const option = tv({
  slots: {
    base: [
      "relative z-1 flex items-center gap-2 min-h-[var(--option-height,30px)] py-[5px] px-2 rounded-chip",
      "text-dense leading-[1.2] text-ink text-start cursor-pointer select-none outline-none",
      "motion-colors-fast",
      /* press darkens the row: the only background a row ever paints */
      "active:bg-hover-2",
      "data-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:cursor-default",
      "pointer-coarse:min-h-[max(40px,var(--option-height,30px))] pointer-coarse:text-md",
      /* with a description the label and the description share the first line's baseline (a
       * wrapped label keeps it under its first line, not centred on all of them); the block
       * padding then centres one line in the row's height, so a single line still sits centred */
      /* 1.25em, not 1.2: a label beside a smaller description on one baseline makes a line box a little
       * taller than the label's own (36.4px rows at lg with 1.2em) */
      "has-[>[data-slot$=-description]]:py-[calc((var(--option-height,30px)-1.25em)/2)]",
      "pointer-coarse:has-[>[data-slot$=-description]]:py-[calc((max(40px,var(--option-height,30px))-1.25em)/2)]",
    ],
    icon: "inline-flex shrink-0 items-center justify-center text-[14px] text-ink-3",
    text: [
      "flex-1 min-w-0 wrap-anywhere", DIR,
      "[&:has(+[data-slot$=-description])]:flex-[0_1_auto] [&:has(+[data-slot$=-description])]:max-w-[70%] [&:has(+[data-slot$=-description])]:self-baseline",
      "[[data-state=checked]>&]:font-medium",
    ],
    description: ["flex-1 min-w-0 self-baseline overflow-hidden text-ellipsis whitespace-nowrap text-xs text-ink-2", DIR],
    meta: "shrink-0 text-2xs text-ink-2 whitespace-nowrap",
    indicator: "inline-flex shrink-0 text-[13px] text-ink invisible [[data-state=checked]>&]:visible",
    /* above the gliding highlight, like a row's text: the highlight glides behind a group title,
     * never over it */
    label: ["relative z-1 pt-1.5 px-2 pb-1 wrap-anywhere text-2xs font-medium text-ink-2", DIR],
    /* above the highlight too: the line is drawn over it as it passes */
    separator: "relative z-1 h-px my-1 -mx-1 border-0 bg-line",
  },
  variants: {
    size: {
      sm: { base: "[--option-height:26px]" },
      md: {},
      lg: { base: "[--option-height:36px]" },
    },
    tone: {
      default: {},
      danger: { base: "text-red", icon: "text-inherit" },
    },
  },
  defaultVariants: { size: "md", tone: "default" },
});

export type OptionRecipeProps = VariantProps<typeof option>;
