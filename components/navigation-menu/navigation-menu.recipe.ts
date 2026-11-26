import { tv, type VariantProps } from "../lib/tv";
import { button } from "../button/button.recipe";
import { popup } from "../lib/popup";
import { option } from "../lib/option";
import { glideLayer } from "../lib/glide";

/* navigation-menu — a row of links and of triggers that open a panel of links (Ark UI
 * navigation-menu).
 *
 * The triggers are the real Button (ghost, sm) with a trailing caret, marked
 * data-navigation-menu="trigger"; a plain link in the row has the same look on an anchor (the
 * button recipe), and the current page keeps the ghost button's darker fill, as an open trigger
 * does. The row wraps when crowded: a name is never cut.
 *
 * One panel box (the engine's viewport) serves every trigger: the engine sizes it to the open
 * content (--viewport-width / --viewport-height) and places it (--viewport-x, from the root's
 * start; kept 10px inside the window). It is the shared popup surface: from the pointer it grows
 * from the opening trigger's centre at its top edge (--trigger-x / --trigger-width, from the root's
 * start, set on the positioner by navigation-menu.logic.ts: the box is in a portal, like every popup),
 * at duration.popup, and closes at duration.fast; from the keyboard it is instant (kbd-instant,
 * in the popup recipe). The box itself clips; the content inside carries the 4px padding, so the
 * box is exactly the content's size.
 *
 * Switching triggers while open is one motion (the engine marks the two contents involved
 * data-motion: from-start / from-end on the arriving one, to-start / to-end on the leaving one,
 * physical sides, mirrored right-to-left by the engine). While the box holds such a content it
 * follows: its start edge (left) and its size ease to the new panel's over duration.move with
 * easing.out-strong (snappy: it starts fast and reaches the new trigger with
 * the content); on a first open there is no data-motion, so the box takes its place and size at once
 * and only grows as a popup. The leaving content goes toward the far side (motion.enter-shift, a
 * fade and a 2px blur, duration.fast); the arriving one comes from the side of travel (the same
 * shift, fade and blur, duration.popup). Transitions, not keyframes: a sweep across the row
 * retargets each content from where it is, and a content that is neither arriving nor leaving keeps
 * opacity 0 while its display runs out. From the keyboard all of it is instant (kbd-instant); under
 * reduced motion the tokens make it a fade (the shift is 0, the box jumps; the blur is motion-safe).
 *
 * The links of a panel are option rows (title above an optional description) under the one
 * gliding highlight (glideLayer of lib/glide.ts, follow: hover). */

const ghost = button({ variant: "ghost", size: "sm" });
const row = option();

export const navigationMenu = tv({
  slots: {
    base: "relative inline-flex flex-col max-w-full min-w-0",
    list: "flex flex-wrap items-center gap-0.5 min-w-0",
    item: "flex min-w-0",
    /* a trigger whose panel holds the current page keeps the darker fill, as a current link does */
    trigger: "aria-[current=true]:bg-hover-2",
    caret: [
      "kbd-instant motion-transform-move",
      "[[data-navigation-menu=trigger][aria-expanded=true]_&]:rotate-180",
    ],
    barLink: [ghost.base(), "aria-[current=page]:bg-hover-2"],
    /* in a portal: navigation-menu.logic.ts sets left, top and width to the root's box. The engine's
     * and the logic's offsets are page coordinates, physical in both directions, so the boxes they
     * place are placed by `left`, written as the property */
    viewportPositioner: "absolute top-0 [left:0] z-popup",
    viewport: [
      popup(),
      "absolute top-1 [left:var(--viewport-x)] w-(--viewport-width) h-(--viewport-height) p-0 overflow-hidden max-h-none",
      "[--transform-origin:calc(var(--trigger-x,0px)_+_var(--trigger-width,0px)/2_-_var(--viewport-x,0px))_top]",
      /* fndn-check-ok: the one box follows the pointer between panels (its start edge and size ease
       * to the new panel's); it is absolutely placed in a portal and its contents are absolute, so
       * nothing else is laid out again. Only while switching (a content carries data-motion). */
      "has-[[data-motion]]:motion-size-move has-[[data-motion]]:motion-also-[display_var(--fndn-duration-popup)_allow-discrete,left_var(--fndn-duration-move)_var(--fndn-easing-out-strong)]",
    ],
    content: [
      "absolute top-0 [left:0] w-max min-w-[220px] max-w-[min(480px,calc(100vw-16px))] p-1 outline-none",
      "kbd-instant motion-opacity-popup motion-transform-popup motion-filter-popup motion-also-[display_var(--fndn-duration-popup)_allow-discrete]",
      /* arriving from the side of travel (only when switching: a first open has no data-motion) */
      "data-[motion=from-end]:starting:opacity-0 data-[motion=from-end]:starting:translate-x-(--fndn-motion-enter-shift)",
      "data-[motion=from-start]:starting:opacity-0 data-[motion=from-start]:starting:-translate-x-(--fndn-motion-enter-shift)",
      "motion-safe:data-[motion^=from]:starting:[filter:blur(2px)]",
      /* leaving toward the far side, shorter; any other closed content in the open box stays at 0
       * (a fast sweep never brings one back). When the whole menu closes the box fades, not this. */
      "[[data-slot=navigation-menu-viewport][data-state=open]>&]:data-[state=closed]:opacity-0 [[data-slot=navigation-menu-viewport][data-state=open]>&]:data-[state=closed]:duration-fast",
      "data-[motion=to-start]:-translate-x-(--fndn-motion-enter-shift) data-[motion=to-end]:translate-x-(--fndn-motion-enter-shift)",
      "motion-safe:data-[motion^=to]:[filter:blur(2px)]",
    ],
    highlight: [glideLayer, "inset-x-1"],
    /* a link takes real focus (the option row draws no ring: its lists move a highlight instead), so
     * it carries the shared ring; the content's 4px padding leaves it room inside the box */
    link: [
      row.base(),
      "flex-col items-start justify-center gap-0.5 no-underline",
      /* the title stacks above its description here: keep the row's own padding, not the one the
       * option row uses to centre a description beside the label */
      "has-[>[data-slot$=-description]]:py-[5px] pointer-coarse:has-[>[data-slot$=-description]]:py-[5px]",
      "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-2",
    ],
    /* shown whole on its own line: not the 70% the option row keeps for a description beside it */
    linkTitle: [row.text(), "flex-none w-full [&:has(+[data-slot$=-description])]:flex-none [&:has(+[data-slot$=-description])]:max-w-none [[aria-current=page]>&]:font-medium"],
    linkDescription: "w-full min-w-0 text-xs leading-[1.35] text-ink-2 wrap-anywhere [unicode-bidi:plaintext] [text-align:match-parent]",
  },
});

export type NavigationMenuRecipeProps = VariantProps<typeof navigationMenu>;
