import { tv, type VariantProps } from "../lib/tv";

/* button — the app's core button, in the app's shape (a pill unless the app is rounded). Works on
 * <button> and <a>.
 * Height comes from symmetric padding plus a minimum, so the label is always centred and every
 * size lands on a whole pixel: xs 24 · sm 28 · md 32 · lg 36, the one height scale every control
 * shares, so a sm Button and a sm Select line up in a toolbar. Size changes dimensions only
 * (height, padding, text, gap, icon, the radius step that keeps a rounded xs concentric): every
 * size has the same weight, fill, ring and focus. Text 12 · 13 · 14 · 14.
 *
 * The adapters always put text in the label part, which is what gets cut when the button is
 * squeezed; there is no bare-text button.
 *
 * Parts are found by data-slot
 * (button, button-icon, button-label); the root slot is `base`.
 *
 * Two states in one cell (Copy / Copied): the icon part holds two icons, the label part holds two
 * label parts. The first shows until the button is `swapped` (a prop, set by the caller), then
 * they cross-fade. The button is as wide as the label it shows: the label that is not showing is out of flow,
 * pinned to the start of the cell, so it fades from where it stood. The stacked runs are
 * aria-hidden and the button has an aria-label; announce the change through a status region.
 *
 * Busy (a save or a deploy under way): the real Spinner (marked data-button="spinner") takes the
 * leading icon's cell, or, without an icon, sits over the label (an icon button: over its icon),
 * while what it covers turns transparent in place: the button keeps its width. It swaps at once
 * both ways (no fade, so nothing plays on first paint and the keyboard is instant); the press
 * does not scale and the adapters drop the click (aria-busy="true"; still focusable). */

/* the 1px top highlight of the filled variants */
const FILL = "shadow-[inset_0_1px_0_oklch(1_0_0/0.14)]";

export const button = tv({
  slots: {
    base: [
      /* the stylesheet resets only buttons marked data-slot or inside a component; these two are
       * what that reset adds, for when the recipe is put on another element */
      "appearance-none [text-align:inherit]",
      "inline-flex shrink-0 items-center justify-center max-w-full",
      "rounded-shape font-medium leading-none whitespace-nowrap no-underline",
      /* an <a> gets the touch behaviour real buttons have */
      "touch-manipulation select-none [-webkit-touch-callout:none]",
      "disabled:opacity-50 disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:pointer-events-none",
      /* motion: colours, opacity and filter change fast, the shadow a beat slower; a press scales
       * the whole button (label and icon with it), so it reads as a physical press. From the pointer
       * only: Space and Enter act at once, like every other control (the adapters start the
       * modality tracker; without it the press always scales). A popup or disclosure trigger
       * (aria-haspopup, aria-expanded) changes at once when the keyboard opens or closes it
       * (kbd-instant): Enter or ArrowDown fills it now, not over duration.fast. Only on those: a
       * Button that moves while the user types (prompt-bar's send) keeps its travel */
      "[&[aria-haspopup]]:kbd-instant [&[aria-expanded]]:kbd-instant motion-colors-fast motion-opacity-fast motion-filter-fast motion-shadow-base motion-transform-press data-swapping:motion-size-base [:root:not([data-fndn-input=keyboard])_&:active]:scale-press",
    ],
    /* a label longer than the room it has is cut at the end of its own text (unicode-bidi); the
     * 2px block padding, taken back by the margin, keeps descenders out of the clip */
    label: [
      "min-w-0 -my-0.5 py-0.5 overflow-hidden text-ellipsis [unicode-bidi:plaintext]",
      /* while the width eases to a swapped label (Copy → Copied), the new label is laid out at its
       * full width before the button has reached it: drawn whole into the padding for those frames,
       * never cut with an ellipsis: an ellipsis there would flicker */
      "[[data-swapping]_&]:overflow-visible",
      /* holding two label parts (Copy / Copied): one grid cell, nothing clipped */
      "[&:has(>[data-slot=button-label])]:inline-grid [&:has(>[data-slot=button-label])]:relative [&:has(>[data-slot=button-label])]:my-0",
      "[&:has(>[data-slot=button-label])]:py-0 [&:has(>[data-slot=button-label])]:overflow-visible",
      /* the two labels share the cell and cross-fade; the second waits out of flow */
      "[&>[data-slot=button-label]]:[grid-area:1/1] [&>[data-slot=button-label]]:motion-opacity-base [&>[data-slot=button-label]]:motion-filter-base",
      "[&>[data-slot=button-label]:nth-child(2)]:opacity-0 [&>[data-slot=button-label]:nth-child(2)]:[filter:blur(2px)]",
      "[&>[data-slot=button-label]:nth-child(2)]:absolute [&>[data-slot=button-label]:nth-child(2)]:top-0 [&>[data-slot=button-label]:nth-child(2)]:start-0 [&>[data-slot=button-label]:nth-child(2)]:whitespace-nowrap",
    ],
    /* wraps the icon and centres it; the icon is 1em of the button's text. A trailing icon (a caret
     * after the label) is the same part after the label, with data-trailing: same size, same gap. */
    icon: [
      "inline-flex shrink-0 items-center justify-center [&>[data-slot=icon]]:size-[1em] [&>svg]:size-[1em] [&:has(>:nth-child(2))]:inline-grid",
      /* two icons share the cell and cross-fade: the first shows until the button is swapped */
      "[&:has(>:nth-child(2))>*]:[grid-area:1/1] [&:has(>:nth-child(2))>*]:motion-opacity-base [&:has(>:nth-child(2))>*]:motion-filter-base",
      "[&>:nth-child(2)]:opacity-0 [&>:nth-child(2)]:[filter:blur(2px)]",
    ],
  },
  variants: {
    size: {
      xs: { base: "min-h-6 gap-1 px-1.5 py-0 text-xs rounded-shape-sm" },
      sm: { base: "min-h-7 gap-1.5 px-3 py-[7px] text-sm rounded-shape-sm" },
      md: { base: "min-h-8 gap-2 px-4 py-[9px] text-md" },
      lg: { base: "min-h-9 gap-2 px-[18px] py-[11px] text-md" },
    },
    /* --_join: what a filled look paints in the 1px between it and the next button of a button
     * group (its own fill, a little towards its text colour). The looks with a ring (outline)
     * or with nothing (ghost) leave it unset: the ring, or nothing, is their join. */
    variant: {
      /* an open outline button keeps the hover fill; hovering it still shows the hover */
      outline: { base: "bg-surface text-ink shadow-btn aria-expanded:bg-hover hover:bg-inset aria-expanded:hover:bg-inset" },
      primary: { base: ["bg-ink text-on-ink hover:opacity-90 [--_join:color-mix(in_oklab,var(--fndn-on-ink)_22%,var(--fndn-ink))]", FILL] },
      secondary: { base: "bg-hover-2 text-ink shadow-none hover:bg-line-strong [--_join:var(--fndn-line-strong)]" },
      accent: { base: ["bg-accent text-on-accent hover:bg-accent-ink [--_join:color-mix(in_oklab,var(--fndn-on-accent)_26%,var(--fndn-accent))]", FILL] },
      success: { base: ["bg-green text-on-accent hover:brightness-95 [--_join:color-mix(in_oklab,var(--fndn-on-accent)_26%,var(--fndn-green))]", FILL] },
      danger: { base: ["bg-red text-on-accent hover:brightness-95 [--_join:color-mix(in_oklab,var(--fndn-on-accent)_26%,var(--fndn-red))]", FILL] },
      /* the danger zone's button (GitHub's "Delete this repository"): the outline button's surface
       * with red text and a red edge; hovered it fills red, so the risk shows before the press. The
       * filled danger stays for the confirmation itself (the alert dialog's action). Like outline,
       * its edge is its join */
      "danger-outline": {
        base: [
          "bg-surface text-red shadow-[0_0_0_1px_color-mix(in_oklab,var(--fndn-red)_55%,transparent),0_1px_2px_0_oklch(0_0_0/0.05)]",
          "hover:bg-red hover:text-on-accent hover:shadow-[0_0_0_1px_var(--fndn-red),0_1px_2px_0_oklch(0_0_0/0.05)]",
        ],
      },
      /* transparent until hovered, for dense toolbars. It presses darker than it hovers, and an
       * open or current one keeps the darker fill, hovered or not. */
      ghost: { base: "bg-transparent text-ink shadow-none hover:bg-hover active:bg-hover-2 aria-expanded:bg-hover-2 aria-expanded:hover:bg-hover-2" },
    },
    /* radius only. Left out, the button takes the app's shape (rounded-shape, rounded-shape-sm up
     * to 28px): a pill, or a field's corners in a rounded app ("shape": "rounded" in the project's fndn.json).
     * Named, it is that shape whatever the app's. A pill square is round. */
    shape: {
      pill: { base: "rounded-pill" },
      rounded: { base: "rounded-control" },
    },
    /* icon-only: as wide as it is tall. An icon on its own reads a size larger than one next to a
     * label; --fndn-button-icon-size sets it from outside. */
    square: {
      true: { base: "size-8 p-0", icon: "text-[length:var(--fndn-button-icon-size,15px)]" },
    },
    /* two states in one cell (Copy / Copied): swapped, the first label and icon wait out of flow and
     * the second ones show; they cross-fade */
    swapped: {
      true: {
        label: [
          "[&>[data-slot=button-label]:first-child]:opacity-0 [&>[data-slot=button-label]:first-child]:[filter:blur(2px)]",
          "[&>[data-slot=button-label]:first-child]:absolute [&>[data-slot=button-label]:first-child]:top-0 [&>[data-slot=button-label]:first-child]:start-0 [&>[data-slot=button-label]:first-child]:whitespace-nowrap",
          "[&>[data-slot=button-label]:nth-child(2)]:static [&>[data-slot=button-label]:nth-child(2)]:opacity-100 [&>[data-slot=button-label]:nth-child(2)]:[filter:none]",
        ],
        icon: [
          "[&>:first-child:not(:only-child)]:opacity-0 [&>:first-child:not(:only-child)]:[filter:blur(2px)]",
          "[&>:nth-child(2)]:static [&>:nth-child(2)]:opacity-100 [&>:nth-child(2)]:[filter:none]",
        ],
      },
    },
    /* a spinner over what it replaces; the press does not scale (the click is dropped) */
    busy: {
      true: {
        base: "cursor-progress [:root:not([data-fndn-input=keyboard])_&:active]:scale-100",
      },
    },
    /* busy without a leading icon: the spinner is centred over the button, the label stays (hidden)
     * to hold the width */
    cover: {
      true: {
        base: "relative",
        label: "opacity-0",
        icon: "opacity-0",
      },
    },
    /* busy with a leading icon: the spinner shares the icon's cell, the glyph stays (hidden) */
    holding: {
      true: { icon: "inline-grid [&>*]:[grid-area:1/1] [&>:not([data-button=spinner])]:opacity-0" },
    },
    /* quiet at rest, ink when hovered, pressed or open. A label is text someone reads, so it rests
     * in ink-2; an icon alone (square) rests in ink-3 (below): the icon buttons of headers,
     * toolbars, fields */
    muted: {
      true: { base: "text-ink-2 hover:text-ink active:text-ink aria-expanded:text-ink" },
    },
  },
  compoundVariants: [
    { muted: true, square: true, class: { base: "text-ink-3" } },
    { square: true, size: "xs", class: { base: "size-6", icon: "text-[length:var(--fndn-button-icon-size,14px)]" } },
    { square: true, size: "sm", class: { base: "size-7" } },
    { square: true, size: "md", class: { icon: "text-[length:var(--fndn-button-icon-size,16px)]" } },
    { square: true, size: "lg", class: { base: "size-9", icon: "text-[length:var(--fndn-button-icon-size,18px)]" } },
    /* rounded takes the radius of a field of the same height (chip up to 28px, control from 32px),
     * so a small button and a small select in one row have the same corners */
    { shape: "rounded", size: ["xs", "sm"], class: { base: "rounded-chip" } },
  ],
  defaultVariants: { variant: "outline", size: "md" },
});

/* the busy spinner (part `spinner`, on the real Spinner): 1em of the button's text, in its ink (the
 * Spinner's own greys would vanish on a filled button); in the icon's cell, or centred over the
 * button (cover). Its own recipe, not a slot of `button`: toggle extends `button` and has no spinner. */
export const buttonSpinner = tv({
  base: "box-border size-[1em] border-[1.5px] border-current/25 border-t-current [grid-area:1/1]",
  variants: { cover: { true: "absolute inset-0 m-auto" } },
});

export type ButtonRecipeProps = VariantProps<typeof button>;
