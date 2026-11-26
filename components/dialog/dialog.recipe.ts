import { tv, type VariantProps } from "../lib/tv";

/* dialog — a centred window over a dimmed page: title, description, body, actions.
 * Behaviour comes from the Zag dialog machine: focus trap, Escape, focus return, scroll lock,
 * inert page. Not anchored to a trigger, so it scales from its own centre (from its top edge when
 * placed at the top).
 * The root is only a hook for the trigger; backdrop and window live in a portal. Stacking (above
 * popups, below tooltips) comes from base.css (--fndn-z-dialog). The trigger, the close button and
 * the actions are Buttons; only their placement is the dialog's (passed as className). The trigger
 * and the close button are marked data-dialog="trigger|close".
 * A dialog that is already open when it mounts is drawn at once: the adapter marks its backdrop and
 * window data-mounted-open until it first closes, and the entrance (@starting-style) skips them.
 * Opening it later, and every close, animate as usual. */

/* on a phone ([@media(pointer:coarse)_and_(max-width:480px)], written out in full in each class so
 * Tailwind finds it) the window sits near the thumb and the actions share the row */

export const dialog = tv({
  slots: {
    base: "contents",
    /* a trigger in a toolbar keeps its size */
    trigger: "shrink-0",
    backdrop: [
      "kbd-instant",
      "fixed inset-0 bg-scrim",
      "motion-opacity-slow-out motion-also-[display_var(--fndn-duration-slow)_allow-discrete]",
      "starting:data-[state=open]:not-data-mounted-open:opacity-0",
      "data-[state=closed]:opacity-0",
      "data-[state=closed]:motion-opacity-fast-out data-[state=closed]:motion-also-[display_var(--fndn-duration-fast)_allow-discrete]",
    ],
    /* the engine sets pointer-events: none on <body> while modal; the dimmed area still takes the
     * press so it can be told apart from the page (and keep focus inside, see the adapter) */
    positioner: [
      "fixed inset-0 flex justify-center p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]",
      "overflow-y-auto overscroll-contain pointer-events-auto",
    ],
    content: [
      "kbd-instant",
      "relative flex flex-col w-full max-w-[440px] rounded-window bg-surface text-ink shadow-overlay outline-none",
      "[transform:scale(1)]",
      "motion-opacity-slow-out motion-transform-slow-out motion-also-[display_var(--fndn-duration-slow)_allow-discrete]",
      "starting:data-[state=open]:not-data-mounted-open:opacity-0 starting:data-[state=open]:not-data-mounted-open:scale-popup",
      "data-[state=closed]:opacity-0 data-[state=closed]:scale-popup",
      /* it leaves faster than it came */
      "data-[state=closed]:motion-opacity-fast-out data-[state=closed]:motion-transform-fast-out",
      "data-[state=closed]:motion-also-[display_var(--fndn-duration-fast)_allow-discrete]",
    ],
    header: "flex items-start justify-between gap-3 px-4 pt-4 pb-0",
    title: "min-w-0 m-0 text-md font-semibold leading-[1.4] tracking-[-0.01em] text-ink wrap-anywhere",
    /* the close button sits on the title's first line and reaches into the corner */
    close: "shrink-0 -my-1 ms-0 -me-1.5",
    description: "px-4 pt-1 pb-0 text-sm leading-normal text-ink-2 wrap-anywhere",
    body: "px-4 pt-3 pb-0 text-sm leading-normal text-ink wrap-anywhere",
    footer: [
      "flex flex-wrap items-center justify-end gap-2 p-4",
      "[@media(pointer:coarse)_and_(max-width:480px)]:[&>[data-slot=button]]:flex-auto",
    ],
  },
  variants: {
    /* width: sm 360px, md 440px, lg 880px for a large preview */
    /* placement: center (a decision, near the thumb on a phone); top: pinned below the top of the
     * viewport and growing downward, so a window whose height follows what is typed (a command
     * palette's results) never moves its field under the caret. It scales from its top edge. */
    placement: {
      center: {
        positioner: "items-center [@media(pointer:coarse)_and_(max-width:480px)]:items-end",
        content: "origin-center",
      },
      top: {
        positioner: "items-start pt-[min(15vh,120px)]",
        content: "origin-top",
      },
    },
    /* instant: opens and closes at once from the pointer too, as from the keyboard: for a window
     * summoned many times a session (a command palette). No entrance, no exit. */
    instant: {
      true: {
        backdrop: "transition-none!",
        content: "transition-none!",
      },
    },
    size: {
      sm: { content: "max-w-[360px]" },
      md: {},
      lg: { content: "max-w-[880px]" },
    },
    /* bare: only the frame (position, focus trap, motion). Its one child is the surface (a command
     * palette: the Search panel), so there is never a box in a box. No fill, no shadow, no
     * padding; the header is kept for assistive technology (the title names the dialog) and not
     * shown; the adapter renders no close button. */
    bare: {
      true: {
        content: "bg-transparent shadow-none rounded-none",
        header: "sr-only p-0",
        body: "p-0",
      },
    },
  },
  defaultVariants: { size: "md", placement: "center" },
});

export type DialogRecipeProps = VariantProps<typeof dialog>;
