import { tv, type VariantProps } from "../lib/tv";

/* button-group — real Buttons joined into one control (a split button, related actions). The
 * group only joins its direct children; their look, sizes, hover and press are the Button's own.
 *
 *   corners   the inner corners lose their radius (logical start / end, so the join mirrors
 *             right-to-left; top / bottom when vertical)
 *   hairline  a Button draws its edge as a 1px ring outside its box (shadow.btn), translucent in
 *             the dark theme. Two rings on the same pixels, or a ring over a neighbour's fill,
 *             show as a thicker, brighter line with ticks at its ends. So the children sit 1px apart and every child
 *             but the first is clipped on its joined side: the line at a join is the previous
 *             child's ring alone, on the page like the outline, and meets the outline without
 *             overlapping it. A filled look (primary, accent …) has no ring: left alone, the 1px
 *             between two of them would show the page, a black line in the dark theme. Every child but the last therefore paints
 *             that pixel itself, in the colour its look names (`--_join`, set in button.recipe.ts: its
 *             fill, a little towards its text). Ghost buttons name none and keep a clear gap. A
 *             focused child is not clipped, so its focus ring is whole
 *   stacking  a focused child rises above its neighbours so its whole ring shows
 *   press     a joined button never scales: scaling alone it pulls away from its neighbour and
 *             shows a cut at the join, and scaling
 *             the whole group squashes buttons that were not pressed. The box stays still and the pressed button's
 *             label and icon dip inside it (the small press scale), from the pointer only
 *   direction the children take the group's direction (Zag may stamp dir="ltr" on a trigger)
 *   menu      a Menu child is a wrapper (data-slot=menu) around its trigger: the same corners
 *             reach the trigger inside it, so a split button is a Button and a Menu
 *   narrow    in a row narrower than its buttons they wrap onto the next line, each shown whole;
 *             only a button wider than the row by itself is cut at the end with a title (the
 *             Button's own truncation). Nothing overflows
 *   vertical  children stretch to the widest; a pill cannot be split top to bottom, so they take
 *             radius.control
 * Items made from the items prop are Buttons marked data-button-group="item"; the item slot is
 * passed to them as className, after their own classes. */

export const buttonGroup = tv({
  slots: {
    base: [
      "inline-flex max-w-full isolate",
      "[&>*]:relative [&>*:focus-within]:z-2 [&>*:focus-visible]:z-2",
      /* the joins are logical (start / end), read from each child's own direction. Zag stamps
       * dir="ltr" on a Menu or Tooltip trigger when no LocaleProvider tells it otherwise, which
       * would round a split button's caret on the wrong end in right-to-left: the children take
       * the group's direction instead */
      "[&>*]:[direction:inherit] [&>[data-slot=menu]>*]:[direction:inherit]",
      /* a press never moves a joined button's box (the join would open); its label and icon dip
       * inside it instead, from the pointer only. Visible on every look and in both themes, which
       * a dim of the fill was not (in dark it reads as two levels of grey) */
      "[&>[data-slot=button]:active]:[transform:none]! [&>[data-slot=menu]>[data-slot=button]:active]:[transform:none]!",
      "[&>[data-slot=button]>*]:motion-transform-press [&>[data-slot=menu]>[data-slot=button]>*]:motion-transform-press",
      "[:root:not([data-fndn-input=keyboard])_&>[data-slot=button]:active>*]:scale-press-sm [:root:not([data-fndn-input=keyboard])_&>[data-slot=menu]>[data-slot=button]:active>*]:scale-press-sm",
    ],
    item: "",
  },
  variants: {
    orientation: {
      horizontal: {
        base: [
          /* too many buttons for the row: they wrap onto the next line, whole (a number or a short
           * name is never cut); a single button wider than the row is cut by the Button's own rule */
          "flex-row flex-wrap items-stretch [&>*]:min-w-0 [&>*]:shrink [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none",
          "[&>*:not(:first-child)]:ms-px",
          "[&>[data-slot=button]:not(:last-child)]:after:absolute [&>[data-slot=button]:not(:last-child)]:after:inset-y-0 [&>[data-slot=button]:not(:last-child)]:after:-end-px [&>[data-slot=button]:not(:last-child)]:after:w-px [&>[data-slot=button]:not(:last-child)]:after:bg-(--_join) [&>[data-slot=button]:not(:last-child)]:after:content-[''] [&>[data-slot=button]:not(:last-child)]:after:pointer-events-none",
          "[&>[data-slot=menu]:not(:last-child)>[data-slot=button]]:after:absolute [&>[data-slot=menu]:not(:last-child)>[data-slot=button]]:after:inset-y-0 [&>[data-slot=menu]:not(:last-child)>[data-slot=button]]:after:-end-px [&>[data-slot=menu]:not(:last-child)>[data-slot=button]]:after:w-px [&>[data-slot=menu]:not(:last-child)>[data-slot=button]]:after:bg-(--_join) [&>[data-slot=menu]:not(:last-child)>[data-slot=button]]:after:content-['']",
          "ltr:[&>*:not(:first-child)]:[clip-path:inset(-12px_-12px_-12px_0)] rtl:[&>*:not(:first-child)]:[clip-path:inset(-12px_0_-12px_-12px)]",
          "[&>*:not(:first-child):focus-visible]:[clip-path:none] [&>*:not(:first-child):focus-within]:[clip-path:none]",
          "[&>[data-slot=menu]:not(:first-child)>*]:rounded-s-none [&>[data-slot=menu]:not(:last-child)>*]:rounded-e-none",
        ],
      },
      vertical: {
        base: [
          "flex-col items-stretch [&>*]:rounded-control",
          "[&>*:not(:first-child)]:mt-px [&>*:not(:first-child)]:[clip-path:inset(0_-12px_-12px_-12px)]",
          "[&>[data-slot=button]:not(:last-child)]:after:absolute [&>[data-slot=button]:not(:last-child)]:after:inset-x-0 [&>[data-slot=button]:not(:last-child)]:after:-bottom-px [&>[data-slot=button]:not(:last-child)]:after:h-px [&>[data-slot=button]:not(:last-child)]:after:bg-(--_join) [&>[data-slot=button]:not(:last-child)]:after:content-[''] [&>[data-slot=button]:not(:last-child)]:after:pointer-events-none",
          "[&>*:not(:first-child):focus-visible]:[clip-path:none] [&>*:not(:first-child):focus-within]:[clip-path:none]",
          "[&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none",
          "[&>[data-slot=menu]>*]:w-full [&>[data-slot=menu]>*]:rounded-control",
          "[&>[data-slot=menu]:not(:first-child)>*]:rounded-t-none [&>[data-slot=menu]:not(:last-child)>*]:rounded-b-none",
        ],
      },
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

export type ButtonGroupRecipeProps = VariantProps<typeof buttonGroup>;
