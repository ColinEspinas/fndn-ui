import { tv, type VariantProps } from "../lib/tv";
import { dialog } from "../dialog/dialog.recipe";

/* drawer — a sheet that slides in from an edge (Zag drawer machine: focus trap, Escape, scroll
 * lock, inert page, drag to dismiss). The header, title, close button, description and footer
 * are the Dialog's (the dialog recipe's slots, composed below), so a sheet and a window read as
 * one family; the trigger and the close button are Buttons, marked data-drawer="trigger|close".
 *
 * Motion. The engine writes the drag offset as an inline transform (translate3d of
 * --drawer-translate-x/y) and zeroes the transition while a finger holds the sheet, so the sheet
 * follows it 1:1. The slide in and out is the separate `translate` property, which composes with
 * that transform instead of fighting it: motion.sheet-shift (100%) of the sheet towards its edge when closed and on
 * the first frame (@starting-style), none when open. In over duration.slow, out over
 * duration.base (shorter), both on easing.drawer; a released drag settles from where it is on the
 * same curve. `hidden` flips display, so display transitions as a discrete property and the sheet
 * stays painted while it leaves. From the keyboard everything is instant (kbd-instant). A sheet
 * already open when it mounts is drawn at once: the adapter marks backdrop and sheet
 * data-mounted-open until it first closes, and the first-frame styles skip them.
 * Stacking: positioner and backdrop take theirs from base.css (see the report: a drawer should
 * sit on the dialog layer). */

const d = dialog();

const IN = "motion-also-[transform_var(--fndn-duration-slow)_var(--fndn-easing-drawer),translate_var(--fndn-duration-slow)_var(--fndn-easing-drawer),display_var(--fndn-duration-slow)_allow-discrete]";
const OUT = "data-[state=closed]:motion-also-[transform_var(--fndn-duration-base)_var(--fndn-easing-drawer),translate_var(--fndn-duration-base)_var(--fndn-easing-drawer),display_var(--fndn-duration-base)_allow-discrete]";

export const drawer = tv({
  slots: {
    base: "contents",
    trigger: "shrink-0",
    backdrop: [
      "kbd-instant",
      "fixed inset-0 bg-scrim [opacity:calc(1-var(--drawer-swipe-progress,0))]",
      "motion-opacity-slow-out motion-also-[display_var(--fndn-duration-slow)_allow-discrete]",
      "starting:data-[state=open]:not-data-mounted-open:opacity-0",
      "data-[state=closed]:opacity-0",
      "data-[state=closed]:motion-opacity-base-out data-[state=closed]:motion-also-[display_var(--fndn-duration-base)_allow-discrete]",
      /* while a finger holds the sheet the dimming follows it, with no lag */
      "data-swiping:data-[state=open]:transition-none!",
    ],
    positioner: [
      "kbd-instant",
      "fixed inset-0 flex pointer-events-auto",
      "motion-also-[display_var(--fndn-duration-base)_allow-discrete]",
    ],
    content: [
      "kbd-instant",
      "relative flex flex-col min-h-0 bg-surface text-ink shadow-overlay outline-none overflow-hidden",
      "[translate:none]",
      /* reduced motion: motion.sheet-shift is 0%, so the sheet does not travel; it fades instead */
      "motion-reduce:data-[state=closed]:opacity-0 motion-reduce:starting:data-[state=open]:not-data-mounted-open:opacity-0",
      "motion-reduce:motion-opacity-slow-out motion-reduce:data-[state=closed]:motion-opacity-base-out",
      IN,
      OUT,
      /* a sheet dismissed by a drag leaves from where the finger let go: the engine keeps its inline
       * transition-duration of 0s until the exit is over, so a pointer exit restores the timing */
      "[:root:not([data-fndn-input=keyboard])_&]:data-[state=closed]:[transition-duration:var(--fndn-duration-base)]!",
    ],
    grabber: "flex shrink-0 justify-center pt-2 cursor-grab active:cursor-grabbing",
    grabberIndicator: "h-1 w-9 rounded-pill bg-line-strong",
    header: [d.header(), "[[data-slot=drawer-grabber]+&]:pt-3"],
    title: d.title(),
    close: d.close(),
    description: d.description(),
    body: [d.body(), "flex-1 min-h-0 overflow-y-auto overscroll-contain"],
    footer: d.footer(),
  },
  variants: {
    side: {
      bottom: {
        positioner: "items-end justify-center pt-12",
        content: [
          "w-full max-w-[640px] max-h-full rounded-t-window",
          "data-[state=closed]:translate-y-(--fndn-motion-sheet-shift) starting:data-[state=open]:not-data-mounted-open:translate-y-(--fndn-motion-sheet-shift)",
        ],
        footer: "pb-[calc(16px+env(safe-area-inset-bottom,0px))]",
      },
      end: {
        positioner: "items-stretch justify-end",
        content: [
          "h-full w-[min(400px,calc(100vw-48px))] rounded-s-window",
          "ltr:data-[state=closed]:translate-x-(--fndn-motion-sheet-shift) ltr:starting:data-[state=open]:not-data-mounted-open:translate-x-(--fndn-motion-sheet-shift)",
          "rtl:data-[state=closed]:-translate-x-(--fndn-motion-sheet-shift) rtl:starting:data-[state=open]:not-data-mounted-open:-translate-x-(--fndn-motion-sheet-shift)",
        ],
      },
      start: {
        positioner: "items-stretch justify-start",
        content: [
          "h-full w-[min(400px,calc(100vw-48px))] rounded-e-window",
          "ltr:data-[state=closed]:-translate-x-(--fndn-motion-sheet-shift) ltr:starting:data-[state=open]:not-data-mounted-open:-translate-x-(--fndn-motion-sheet-shift)",
          "rtl:data-[state=closed]:translate-x-(--fndn-motion-sheet-shift) rtl:starting:data-[state=open]:not-data-mounted-open:translate-x-(--fndn-motion-sheet-shift)",
        ],
      },
    },
  },
  defaultVariants: { side: "bottom" },
});

export type DrawerRecipeProps = VariantProps<typeof drawer>;
