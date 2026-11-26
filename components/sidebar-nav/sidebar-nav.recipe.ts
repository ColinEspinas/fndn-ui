import { tv, type VariantProps } from "../lib/tv";
import { glideLayer } from "../lib/glide";

/* sidebar-nav — workspace switcher, primary links and recent chats; collapses to a 52px rail.
 *
 * The panel is one fixed 224px tree. Collapsing changes only the root's width, which clips the
 * panel, so every glyph keeps its x position (26px from the inline start) in both states.
 * Labels fade and drift; row backgrounds are childless pseudo-elements that shrink to 36px.
 * The workspace switcher is the real Menu (its trigger carries the menu's trigger classes and
 * data-menu="trigger"); the toggle is the real Button (data-sidebar-nav="toggle"); the chats are the
 * real Collapsible (section); "No chats yet" is the real EmptyState. Whatever fades on collapse
 * carries the copy classes and data-sidebar-nav="copy". Collapsed is a variant of every part it
 * changes. Rows carry the shared gliding highlight (glideLayer of lib/glide.ts).
 *
 * Sections (projects, teams): each is the real Collapsible (section) with its own label, below the
 * primary links; with sections, they and the chats share one scroller (`sections`) and each takes
 * its own height. Every link's text starts on one edge: a link with an icon shows it in the icon
 * column, one without is indented to the label column (indent), so the rail never has two text
 * edges.
 *
 * Motion (`docs motion`), all here:
 *   collapse  the root's width at duration.move easing.out-strong (the sidebar's footprint must
 *             change so the page beside it reflows; the 224px panel inside is never re-laid out);
 *             the copy fades (base) and drifts by motion.enter-shift (move); a row's background
 *             narrows to 36px (width, a childless layer: scaleX would distort its radius); the row
 *             itself switches to 36px at the end of the collapse (a discrete 0s switch), back at once
 *   keyboard  the root is kbd-instant (its own transition is skipped); its moving
 *             parts follow with kbd:duration-0 kbd:delay-0
 *   press     the switcher scales (press); a row darkens its background
 *
 * size (dimensions only, the control scale): md (default) 32px rows, 14px text, 18px glyphs, the
 * control radius; sm 28px rows, 13px text, 16px glyphs, the chip radius (rows, their fill and ring,
 * the highlight and the switcher), for a dense app whose content is 13px (an issue tracker, an
 * editor). The glyph box stays 20px, so every glyph keeps its 26px centre and the 52px rail, the
 * toggle's landing place and the label column (34px) are the same at both sizes; collapsed rows
 * stay 36px wide (as tall as the size). */

export const sidebarNav = tv({
  slots: {
    /* rows and the toggle stack above the highlight; isolation keeps that inside, below portaled popups */
    base: "kbd-instant relative isolate flex flex-col shrink-0 w-56 max-h-full overflow-clip motion-size-move",
    panel: "flex flex-col flex-[1_1_auto] w-56 min-h-0 pb-2",
    /* switcher + toggle */
    header: "flex items-center shrink-0 h-10 mb-2.5 px-2",
    switcher: "min-w-0",
    /* added to the menu's trigger classes. Ark stamps dir="ltr" on the menu trigger; the switcher
     * follows the page instead. An open switcher keeps the pressed fill, hovered or not. */
    workspace: [
      "flex items-center gap-1.5 w-[164px] h-8 px-2 rounded-control text-md font-medium leading-none text-ink-2 text-start",
      "opacity-100 hover:not-data-[state=open]:bg-hover data-[state=open]:bg-hover-2 active:scale-press",
      "[[data-slot=sidebar-nav]:dir(rtl)_&]:[direction:rtl]",
      "motion-colors-fast motion-transform-press motion-opacity-base motion-also-[visibility_var(--fndn-duration-base)] kbd:duration-0 kbd:delay-0",
    ],
    logo: "flex items-center justify-center shrink-0 size-5 text-[18px] text-ink",
    /* names take their direction from their own first letter (a name in the other script keeps its
     * words in order and its ellipsis at its own end), but still start on the page's side */
    workspaceName: "flex-1 min-w-0 leading-[1.5] overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    caret: "flex shrink-0 text-[14px] text-ink-3",
    /* added to the Button (md square ghost rounded muted), pinned to the root's inline-end edge: it
     * rides the edge as the rail closes and lands where the logo was (its glyph centre is 26px from
     * the start when collapsed). Its glyph mirrors to point the way the rail will move. */
    toggle: [
      "absolute top-1 end-2.5 z-2",
      "[&_[data-slot=icon]]:motion-transform-move kbd:[&_[data-slot=icon]]:duration-0 kbd:[&_[data-slot=icon]]:delay-0",
      "[[data-slot=sidebar-nav]:dir(rtl)_&_[data-slot=icon]]:[transform:scaleX(-1)]",
    ],
    /* the chats' list gets room for the focus ring of its first and last row inside the clipping region */
    group: "relative shrink-0 mx-2",
    /* the gliding highlight: hover-gated (a tap would leave it stuck); it follows pointer and focus
     * and glides for both */
    highlight: [
      glideLayer, "rounded-control bg-hover invisible [@media(hover:hover)_and_(pointer:fine)]:visible",
    ],
    list: "flex flex-col gap-px m-0 p-0 list-none",
    /* a width, not auto, so the collapsed 36px can be switched at a delay. Collapsed, the link
     * itself is the 36px square once the rail has closed, so its tooltip sits next to the rail (a
     * tooltip anchors to its trigger's box) and nothing is reachable in the clipped part; it
     * switches after the collapse, when the label has faded, and back at once.
     * The background and focus ring are a childless ::before that narrows to 36px with the rail. */
    item: [
      "relative z-1 flex w-full items-center gap-1.5 h-8 px-2 rounded-control pointer-coarse:h-10",
      "text-md font-medium leading-none text-ink-2 no-underline outline-none select-none aria-[current=page]:text-ink",
      "motion-colors-fast kbd:duration-0 kbd:delay-0",
      "before:content-[''] before:absolute before:inset-y-0 before:start-0 before:-z-1 before:w-full before:rounded-control before:bg-transparent",
      "aria-[current=page]:before:bg-hover-2 active:before:bg-hover-2",
      "focus-visible:before:outline-2 focus-visible:before:outline-solid focus-visible:before:outline-accent focus-visible:before:outline-offset-2",
      "before:motion-colors-fast before:motion-size-move kbd:before:duration-0 kbd:before:delay-0",
    ],
    /* holds the sections and the chats: one scroller when there are sections, otherwise no box of
     * its own (contents), so the chats section scrolls itself */
    sections: "contents",
    itemIcon: "flex items-center justify-center shrink-0 size-5 text-[18px]",
    /* the row is 32px with line-height 1; truncation clips, so descenders (Arabic, Devanagari) get room */
    label: "flex-1 min-w-0 leading-[1.5] overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    /* what fades on collapse: added to the labels, the switcher's name and caret, and a badge */
    copy: [
      "opacity-100 [transform:none] motion-opacity-base motion-transform-move kbd:duration-0 kbd:delay-0",
    ],
    /* chats: the Collapsible's root (variant section), which owns the trigger, the caret, the
     * reveal and the press colour. Collapsed, the section is visibility: hidden and the open region
     * inherits it (the collapsible never sets visibility on an open region), so the chats leave the
     * tab order with the rest of the copy. Its header sits at the top of the scrolling group, which
     * clips: the ring is drawn inside. "No chats yet" lines up with the chat labels. */
    section: [
      "flex flex-col flex-[1_1_auto] min-h-0 mt-3 overflow-y-auto overscroll-contain",
      "opacity-100",
      "motion-opacity-base motion-also-[visibility_var(--fndn-duration-base)] kbd:duration-0 kbd:delay-0",
      "[&>[data-slot=collapsible-trigger]]:shrink-0 [&>[data-slot=collapsible-trigger]]:mx-2",
      "[&>[data-slot=collapsible-trigger]:focus-visible]:outline-offset-[-2px]",
      "[&_[data-slot=empty-state]]:mx-2",
    ],
  },
  variants: {
    size: {
      md: {},
      /* 28px rows take the chip radius, as every control up to 28px (md stays control) */
      sm: {
        workspace: "h-7 rounded-chip text-sm",
        logo: "text-[16px]",
        highlight: "rounded-chip",
        item: "h-7 rounded-chip before:rounded-chip text-sm pointer-coarse:h-10",
        itemIcon: "text-[16px]",
      },
    },
    /* the 52px rail: the root narrows; the copy, the switcher and the chats fade (and leave the tab
     * order); rows and the highlight become 36px squares (rows at the end of the collapse); the
     * toggle's glyph turns to point the way the rail will open */
    collapsed: {
      true: {
        base: "w-13",
        workspace: "opacity-0 invisible",
        toggle: "[&_[data-slot=icon]]:[transform:scaleX(-1)] [[data-slot=sidebar-nav]:dir(rtl)_&_[data-slot=icon]]:[transform:none]",
        highlight: "end-auto w-9",
        item: "w-9 motion-also-[width_0s_linear_var(--fndn-duration-move)] before:w-9",
        copy: "opacity-0 [transform:translateX(calc(var(--fndn-motion-enter-shift)*-1))] [[data-slot=sidebar-nav]:dir(rtl)_&]:[transform:translateX(var(--fndn-motion-enter-shift))]",
        section: "opacity-0 invisible",
      },
    },
    inSection: {
      true: { group: "py-1" },
    },
    /* a link without an icon: its text starts where the labels of icon links do (8 + 20 + 6px) */
    indent: {
      true: { item: "ps-[34px]" },
    },
    /* a section among others in the scroller: as tall as its rows, the scroller scrolls */
    stacked: {
      true: {
        sections: "flex flex-col flex-[1_1_auto] min-h-0 mt-3 gap-3 overflow-y-auto overscroll-contain",
        section: "flex-none mt-0 min-h-auto overflow-visible",
      },
    },
    /* the copy class on a Count: only the fade and drift are timed there (the badge's
     * own colour and shadow easing is switched off; it never changes state in the rail) */
    badge: {
      true: { copy: "[--fndn-m-colors:initial]! [--fndn-m-shadow:initial]!" },
    },
  },
  defaultVariants: { collapsed: false, size: "md" },
});

export type SidebarNavRecipeProps = VariantProps<typeof sidebarNav>;
