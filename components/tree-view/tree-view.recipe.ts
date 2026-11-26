import { tv, type VariantProps } from "../lib/tv";
import { glideLayer } from "../lib/glide";
import { collapsible } from "../collapsible/collapsible.recipe";

/* tree-view — a hierarchy of rows that open and close (Zag tree-view through Ark UI).
 *
 * Rows are the sidebar nav's (sidebar-nav.recipe.ts item): 14px/500 ink-2, gap 6, control radius at md, the
 * one gliding hover highlight (glideLayer of lib/glide.ts, hover-gated, it follows pointer and focus), a press
 * that darkens to hover-2 and a current row filled hover-2 in ink, the fill and the focus ring on
 * a childless ::before. Two differences: the fill starts where the row's level starts, not at
 * the tree's edge (the row stays the hit area across the whole width; the highlight follows the
 * level, glideTree of tree-view.logic.ts), and a name wraps instead of being cut, so a row is
 * 32px at least (6px + 20px lines + 6px).
 *
 * A branch is a collapsible: Ark's branch is a collapsible root and its content the collapsible's
 * content, so the caret, the reveal, the held exit and the keyboard's instant change are the
 * collapsible recipe's (variant row) composed here, never copied.
 *
 * Indentation comes from the engine's --depth (1 at the top): 26px a level (the caret's 20px box
 * and the 6px gap), so a child's caret sits under its parent's icon or name; a leaf adds the
 * same 26px, so its name lines up with a sibling branch's. The guide is a hairline under the
 * parent's caret (8px padding + half the 20px box) in line-strong; the guide of the level holding
 * the selection is ink-3. It lies in the parent level's indent, 8px clear of its children's fills
 * (6px at xs), so no fill, highlight or ring ever covers or crosses it.
 * Parts are found by data-slot (tree-view, tree-view-item, tree-view-branch-control, …).
 *
 * size (the control scale) changes dimensions only, through
 * custom properties set on the root that every row, caret, icon, indent and guide reads (the
 * radius steps with the height, as every control's: chip up to 28px rows, control from 32px):
 *   xs  24px rows: 4 + 16px lines + 4, 12px text, a 16px caret / icon box, a 4px gap (20px a
 *       level), 6px inline padding: the dense rows of a side pane (a code editor's explorer)
 *   sm  28px rows: 4 + 20 + 4, 13px text, a 20px box (26px a level)
 *   md  32px rows (default): 6 + 20 + 6, 14px text, a 20px box (26px a level)
 *   lg  36px rows: 8 + 20 + 8, 14px text
 * A coarse pointer keeps its 40px minimum at every size. */

const row = collapsible({ variant: "row" });

const ROW = [
  "relative z-1 flex w-full min-w-0 items-start gap-[var(--tree-gap)] min-h-[calc(var(--tree-line)+2*var(--tree-py))] py-[var(--tree-py)] pe-[var(--tree-pad)]",
  "pointer-coarse:min-h-10 pointer-coarse:py-2.5",
  /* where the row's level starts: one level is the caret's box and the gap after it */
  "[--tree-level:calc((var(--depth,1)-1)*(var(--tree-box)+var(--tree-gap)))] ps-[calc(var(--tree-level)+var(--tree-pad))]",
  /* a row is pressed like the option rows: it invites the click, and on touch it acts at once
   * (base.css lists no treeitem among its controls). The text size is the root's (size). */
  "font-medium leading-[var(--tree-line)] text-ink-2 outline-none select-none cursor-pointer touch-manipulation [-webkit-touch-callout:none]",
  /* the fill and the focus ring are a childless ::before from where the row's level starts to the
   * end: the whole row stays the hit area, and no guide (each lies in a parent level's indent) is
   * ever under a fill or a ring */
  "before:content-[''] before:absolute before:inset-y-0 before:end-0 before:start-(--tree-level) before:-z-1 before:rounded-(--tree-radius)",
  "active:before:bg-hover-2 data-selected:before:bg-hover-2 data-selected:text-ink",
  "focus-visible:before:outline-2 focus-visible:before:outline-solid focus-visible:before:outline-accent focus-visible:before:-outline-offset-2",
  "data-disabled:opacity-50 data-disabled:pointer-events-none",
  "motion-colors-fast before:motion-colors-fast kbd:duration-0 kbd:before:duration-0",
];

export const treeView = tv({
  slots: {
    base: "flex w-full min-w-0 flex-col",
    /* the collapsible section header's type, not its press: a label is not a control. It starts
     * where the carets of the top level are drawn (the padding and the caret's inset in its box) */
    label: "flex items-center h-7 m-0 ps-[calc(var(--tree-pad)+(var(--tree-box)-var(--tree-caret))/2)] pe-[var(--tree-pad)] text-xs font-medium leading-none text-ink-2 [unicode-bidi:plaintext]",
    /* rows stack above the highlight; isolation keeps that inside, below portaled popups */
    tree: "relative isolate flex min-w-0 flex-col gap-px",
    /* glide() moves it down to the row; glideTree() (tree-view.logic.ts) gives it the row's level
     * (--tree-hl-depth), and it starts where the row's fill does: shifted and narrowed, on the
     * same timing as the move (translate is in motion-transform's list, width in motion-size's) */
    highlight: [
      glideLayer, "rounded-(--tree-radius) invisible [@media(hover:hover)_and_(pointer:fine)]:visible",
      "[--tree-hl-start:calc((var(--tree-hl-depth,1)-1)*(var(--tree-box)+var(--tree-gap)))] w-[calc(100%-var(--tree-hl-start))]",
      "ltr:translate-x-(--tree-hl-start) rtl:-translate-x-(--tree-hl-start) motion-size-move",
    ],
    branch: "flex min-w-0 flex-col",
    branchControl: ROW,
    /* a leaf adds one level: its name lines up with a sibling branch's */
    item: [ROW, "ps-[calc(var(--tree-level)+var(--tree-pad)+var(--tree-box)+var(--tree-gap))]"],
    caret: [
      row.caret(),
      "size-[var(--tree-box)] m-0 text-[length:var(--tree-caret)] [[data-slot=tree-view-branch-control][data-state=open]>&]:[transform:rotate(90deg)]",
    ],
    icon: "flex items-center justify-center shrink-0 size-[var(--tree-box)] text-[length:var(--tree-icon)]",
    text: "flex-1 min-w-0 wrap-anywhere [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    content: row.content(),
    /* the rows of a level, 1px apart like the top level; the guide's offset parent */
    body: [row.body(), "relative flex flex-col gap-px pt-px"],
    /* under the parent's caret: the padding, half the box, less half the line. A border, not a
     * 1px background: a border is drawn on whole device pixels, so every level has the same
     * weight at 125% or 150% scaling (a 1px box at a fractional position takes one device pixel
     * on one level and two on the next). It runs from the first child to half a row padding short
     * of the last, so a level ends visibly before the next row. It sits above the rows (none
     * paints where it lies) and takes no pointer. The level that holds a selected row draws its
     * guide in ink-3: the selection's folder shows at a glance. */
    guide: [
      "absolute top-0 bottom-[calc(var(--tree-py)/2)] z-2 w-0 border-s border-line-strong pointer-events-none start-[calc(var(--tree-pad)+var(--tree-box)/2-0.5px+(var(--depth,1)-1)*(var(--tree-box)+var(--tree-gap)))]",
      "[[data-slot=tree-view-body]:has(>[aria-selected=true])>&]:border-ink-3",
      "motion-colors-fast kbd:duration-0",
    ],
  },
  variants: {
    size: {
      xs: { base: "text-xs [--tree-line:16px] [--tree-py:4px] [--tree-box:16px] [--tree-gap:4px] [--tree-pad:6px] [--tree-caret:12px] [--tree-icon:14px] [--tree-radius:var(--fndn-radius-chip)]" },
      sm: { base: "text-sm [--tree-line:20px] [--tree-py:4px] [--tree-box:20px] [--tree-gap:6px] [--tree-pad:8px] [--tree-caret:13px] [--tree-icon:16px] [--tree-radius:var(--fndn-radius-chip)]" },
      md: { base: "text-md [--tree-line:20px] [--tree-py:6px] [--tree-box:20px] [--tree-gap:6px] [--tree-pad:8px] [--tree-caret:14px] [--tree-icon:18px] [--tree-radius:var(--fndn-radius-control)]" },
      lg: { base: "text-md [--tree-line:20px] [--tree-py:8px] [--tree-box:20px] [--tree-gap:6px] [--tree-pad:8px] [--tree-caret:14px] [--tree-icon:18px] [--tree-radius:var(--fndn-radius-control)]" },
    },
  },
  defaultVariants: { size: "md" },
});

export type TreeViewRecipeProps = VariantProps<typeof treeView>;
