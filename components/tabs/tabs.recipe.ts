import { tv, type VariantProps } from "../lib/tv";

/* tabs — tab strip + panels on the Zag tabs machine.
 *   pill (default)  13px labels, 26px tabs; the selected tab sits on a filled pill (the chat header strip)
 *                   whose radius is the chip token
 *   underline       13px labels, 32px tabs on a hairline; an ink bar under the selected tab
 *   attached        browser and editor tabs: the selected tab is its own surface (--fndn-tabs-surface,
 *                   the colour of the panel or toolbar under it, default surface) with rounded top
 *                   corners and inverse curves at its feet, joined to what is below (no line); the
 *                   others sit on the strip (the host's colour) with a hairline between them, hidden
 *                   beside the selected and the hovered tab. No travelling indicator: a document tab
 *                   is selected in place, as Chrome and VS Code do, and a joined tab never scales
 *   size            xs 24 · sm 28 · md (default) — dimensions only; md keeps each variant's height
 *                   (pill 26, underline 32, attached 32)
 *   inHeader        pill or underline inside a card header: fills the header's height, no hairline
 *                   (its own prop: the size scale is dimensions only)
 *   closable        a closable tab is wrapped in the tab part with its close part beside the
 *                   trigger (a button cannot hold a button): the trigger keeps room at its end and
 *                   the close button is pulled back over it, so the indicator, which measures the
 *                   trigger, covers both. The wrapper is not positioned: the trigger's offset box
 *                   stays relative to the list, which the engine and placeIndicator measure
 *   fill            the root fills its container's height and the selected panel takes the rest
 *   tabSizing       attached only. shrink (default, Chrome): tabs share the strip, 240px at most,
 *                   shrinking to 96px before the strip scrolls; labels are cut with a title. fit
 *                   (VS Code): each tab is as wide as its title, never cut, and the strip scrolls
 *   arrivals        attached only (house rule "arrivals make room"): a tab added after the first
 *                   paint (`ready`, set by the adapter after mount) opens its width from 0 over
 *                   duration.reveal while it fades in over duration.base; a tab closed by the
 *                   pointer (`closing`) closes its width to 0 the same way, and the adapter calls
 *                   onClose when it has. From the keyboard both are instant (kbd-instant; the adapter
 *                   closes at once); under reduced motion duration.reveal is 0, so the width jumps
 *                   and only the fade is left. Width, min-width and inline padding move (a tab's
 *                   room is its width: no transform can open it); fit tabs, whose width is auto,
 *                   move through interpolate-size (Chromium; elsewhere they appear at once)
 *
 * Everything is here, motion included. The indicator is the engine's: it measures the selected tab
 * and travels on transform only while a selection is being made (the engine sets transition-property
 * from --transition-property then), so it does not slide in on mount or when fonts load. Keyboard
 * selections are instant (kbd-instant). Panels swap instantly. Parts are found by data-slot
 * (tabs, tabs-header, tabs-list, tabs-indicator, tabs-trigger, tabs-label, tabs-content); the root
 * slot is `base`. */

/* until the indicator is measured the selected tab paints itself exactly like the indicator, so the
 * hand-over is invisible (written whole below: a class built from pieces is never generated). The
 * adapters also place the indicator before the first paint (tabs.logic.ts placeIndicator). */

export const tabs = tv({
  slots: {
    base: "flex flex-col min-w-0 max-w-full",
    /* the host's header row, when the list is wrapped in it */
    header: "flex items-center min-w-0",
    list: "relative flex items-center min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    /* a closable tab: the trigger and its close button side by side (never positioned, see above) */
    tab: "group/tab flex shrink-0 items-center min-w-0 max-w-full",
    /* the engine's indicator: left is the engine's inline `left: var(--left)`, overridden (offsets
     * are physical, also right-to-left, and travel on transform) */
    indicator: [
      "kbd-instant",
      "absolute top-0 [left:0]! z-0 w-(--width) h-(--height) rounded-chip bg-field pointer-events-none",
      "[transform:translate(var(--left,0px),var(--top,0px))]",
      /* fndn-check-ok: width — the indicator is absolutely positioned and childless, and scaleX would distort its radius */
      "[--transition-property:transform,width]! [--transition-duration:var(--fndn-duration-move)] [--transition-timing-function:var(--fndn-easing-move)]",
    ],
    trigger: [
      "relative z-1 inline-flex items-center justify-center gap-1.5 shrink-0 min-w-0 max-w-full h-[26px] px-2",
      "rounded-chip text-sm leading-none whitespace-nowrap text-ink-2",
      /* hover is a colour, like every single-choice strip: ink-2 → ink, selected ink */
      "hover:text-ink aria-selected:text-ink",
      "disabled:opacity-50 disabled:cursor-default disabled:pointer-events-none",
      "data-disabled:opacity-50 data-disabled:cursor-default data-disabled:pointer-events-none",
      "[[data-slot=tabs-indicator][hidden]~&]:aria-selected:bg-field [[data-slot=tabs-indicator][hidden]~*>&]:aria-selected:bg-field",
      /* the selected tab's own background is only ever the stand-in: it hands over to the indicator
       * at once (no fade when the engine un-hides it after a first frame); its label colour still
       * transitions as motion-colors-base does */
      "aria-selected:[--fndn-m-colors:color_var(--fndn-duration-base)_ease]",
      "kbd-instant motion-colors-base motion-transform-press active:scale-press",
    ],
    /* the close button of a closable tab: a 16px square pulled back over the trigger's end room,
     * above the trigger. Shown on the selected tab and while the tab is hovered (always on touch);
     * at rest it keeps its room, so the strip never reflows. Not a tab stop: Delete closes the
     * focused tab. Press scales from the pointer only */
    close: [
      "relative z-2 inline-flex shrink-0 items-center justify-center size-4 rounded-[4px] text-[11px] text-ink-3",
      "opacity-0 group-hover/tab:opacity-100 [[aria-selected=true]+&]:opacity-100 pointer-coarse:opacity-100",
      "hover:bg-hover hover:text-ink",
      "[:root:not([data-fndn-input=keyboard])_&:active]:scale-press",
      "motion-colors-fast motion-opacity-fast motion-transform-press",
      /* a 24px target around the 16px glyph box */
      "after:content-[''] after:absolute after:-inset-1",
    ],
    /* an item's icon before its label: a file icon (Phosphor) or a favicon (an image) */
    icon: "inline-flex shrink-0 items-center justify-center size-4 text-[16px] leading-none [&>img]:size-full [&>img]:rounded-[3px] [&>img]:object-contain",
    /* one line that truncates at the end of its own text; the adapters give it a title. The 2px
     * block padding, taken back by the margin, keeps descenders inside the clip */
    label: "block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext] -my-0.5 py-0.5",
    /* panels: no motion, the content just swaps */
    content: "min-w-0 pt-3 text-sm leading-normal text-ink-2 wrap-anywhere",
  },
  variants: {
    variant: {
      pill: { close: "-ms-5 me-1" },
      underline: {
        /* the list clips: 4px of inline padding, taken back by the margin, give the ring room at the
         * ends (a list that is the root's child; one in the header part keeps its edges) */
        list: "gap-4 [[data-slot=tabs]>&]:px-1 [[data-slot=tabs]>&]:-mx-1",
        close: "-ms-4",
        indicator: "top-auto bottom-0 h-0.5 rounded-[1px] bg-ink [transform:translateX(var(--left,0px))]",
        /* the usual ring (outside the tab) would be cut off by the list: it is drawn 4px inside the
         * tab's height (clear of the bar) and 2px outside its text */
        trigger: [
          "h-8 px-0 rounded-none focus-visible:outline-none",
          "focus-visible:after:content-[''] focus-visible:after:absolute focus-visible:after:inset-y-1 focus-visible:after:-inset-x-0.5",
          "focus-visible:after:rounded-chip focus-visible:after:outline-2 focus-visible:after:outline-solid focus-visible:after:outline-accent focus-visible:after:pointer-events-none",
          "[[data-slot=tabs-indicator][hidden]~&]:aria-selected:bg-transparent [[data-slot=tabs-indicator][hidden]~&]:aria-selected:shadow-[inset_0_-2px_0_var(--fndn-ink)]",
          "[[data-slot=tabs-indicator][hidden]~*>&]:aria-selected:bg-transparent [[data-slot=tabs-indicator][hidden]~*>&]:aria-selected:shadow-[inset_0_-2px_0_var(--fndn-ink)]",
        ],
      },
      attached: {
        /* the strip: tabs stand on its bottom edge; the ends leave room for the outer feet. A tab's
         * width can open from 0 to auto (fit tabs arriving and leaving) */
        list: "items-end gap-0 px-2 pt-1 [--fndn-tabs-radius:var(--fndn-radius-control)] [interpolate-size:allow-keywords]",
        /* the selected tab paints itself: the engine's indicator stays hidden */
        indicator: "hidden!",
        /* tabs share the strip, 240px at most each, and shrink together (to 96px) before the strip
         * scrolls, as Chrome's do; the label is cut at its end with its title */
        tab: "w-60 shrink min-w-24",
        trigger: [
          "w-60 shrink min-w-24 justify-start [[data-slot=tabs-tab]>&]:w-auto [[data-slot=tabs-tab]>&]:flex-1",
          "h-8 px-3 rounded-none rounded-t-(--fndn-tabs-radius) text-ink-2 hover:text-ink aria-selected:text-ink",
          /* inactive tabs: a quiet hover fill (half the selected surface); the selected one is the surface */
          "hover:bg-[color-mix(in_oklab,var(--fndn-tabs-surface,var(--fndn-surface))_55%,transparent)]",
          "aria-selected:z-2 aria-selected:bg-[var(--fndn-tabs-surface,var(--fndn-surface))]",
          /* the strip is usually the canvas, whose step under surface reads the same in both themes
           * (the dark canvas is set to match light's contrast). In dark the selected tab
           * also gets a lit top edge (a 1px line-strong inset along its rounded top), as dark
           * browser tabs do: light on top is how dark themes show what is raised */
          "[:is(.dark,[data-theme=dark])_&]:aria-selected:shadow-[inset_0_1px_0_var(--fndn-line-strong)]",
          "[[data-slot=tabs-indicator][hidden]~&]:aria-selected:bg-[var(--fndn-tabs-surface,var(--fndn-surface))] [[data-slot=tabs-indicator][hidden]~*>&]:aria-selected:bg-[var(--fndn-tabs-surface,var(--fndn-surface))]",
          /* only the ink fades; the surface changes at once (selecting a document is instant) */
          "[--fndn-m-colors:color_var(--fndn-duration-base)_ease]",
          /* joined to the panel below: no press scale */
          "active:scale-100",
          /* the ring is drawn inside: the strip clips */
          "focus-visible:-outline-offset-2",
          /* inverse curves at the selected tab's feet, in the surface's colour */
          "after:content-[''] after:absolute after:bottom-0 after:inset-x-[calc(var(--fndn-tabs-radius)*-1)] after:h-(--fndn-tabs-radius) after:pointer-events-none after:hidden aria-selected:after:block",
          "after:[background:radial-gradient(circle_at_0_0,transparent_var(--fndn-tabs-radius),var(--fndn-tabs-surface,var(--fndn-surface))_calc(var(--fndn-tabs-radius)+0.5px))_left_bottom/var(--fndn-tabs-radius)_var(--fndn-tabs-radius)_no-repeat,radial-gradient(circle_at_100%_0,transparent_var(--fndn-tabs-radius),var(--fndn-tabs-surface,var(--fndn-surface))_calc(var(--fndn-tabs-radius)+0.5px))_right_bottom/var(--fndn-tabs-radius)_var(--fndn-tabs-radius)_no-repeat]",
          /* a hairline between inactive tabs, at the tab's inline start; none on the first tab, none
           * beside the selected or the hovered tab */
          "before:content-[''] before:absolute before:start-0 before:inset-y-2 before:w-px before:bg-line-strong before:pointer-events-none",
          "aria-selected:before:opacity-0 hover:before:opacity-0 group-hover/tab:before:opacity-0",
          "[[data-slot=tabs-indicator]+&]:before:opacity-0 [[data-slot=tabs-indicator]+[data-slot=tabs-tab]>&]:before:opacity-0",
          "[[aria-selected=true]+&]:before:opacity-0 [[data-slot=tabs-tab]:has(>[aria-selected=true])+&]:before:opacity-0",
          "[[aria-selected=true]+[data-slot=tabs-tab]>&]:before:opacity-0 [[data-slot=tabs-tab]:has(>[aria-selected=true])+[data-slot=tabs-tab]>&]:before:opacity-0",
          "[:hover+&]:before:opacity-0 [:hover+[data-slot=tabs-tab]>&]:before:opacity-0",
        ],
        close: "-ms-6 me-2",
        /* the selected panel is the same surface, joined to its tab */
        content: "pt-0 bg-[var(--fndn-tabs-surface,var(--fndn-surface))]",
      },
    },
    size: {
      xs: { trigger: "text-xs", icon: "size-3.5 text-[14px]" },
      sm: { trigger: "text-xs", icon: "size-3.5 text-[14px]" },
      md: {},
    },
    /* inside a card header: the strip fills the header's height, with no hairline of its own; a
     * list that is the root's only child fills the root */
    inHeader: {
      true: { base: "self-stretch", list: "self-stretch [[data-slot=tabs]>&]:flex-[1_0_auto]" },
      false: {},
    },
    /* a closable tab's trigger keeps room at its end for the close button */
    closable: { true: {}, false: {} },
    /* attached: shrink (Chrome) or fit (VS Code), see above */
    tabSizing: { shrink: {}, fit: {} },
    /* set by the adapter after mount: from then on an inserted tab opens its room (attached) */
    ready: { true: {}, false: {} },
    /* a tab closed by the pointer, while its room closes (attached); the adapter then calls onClose */
    closing: { true: {}, false: {} },
    /* fill: the root takes its container's height; the selected panel takes what the strip leaves
     * and scrolls inside itself (put a ScrollArea in it for the system's scrollbar) */
    fill: {
      true: { base: "h-full min-h-0", content: "flex-1 min-h-0 overflow-y-auto overscroll-x-contain" },
      false: {},
    },
  },
  compoundVariants: [
    /* the list scrolls, so it clips: 4px of padding, taken back by the margin, keep the focus ring
     * inside it (a list that is the root's child) */
    { variant: "pill", inHeader: false, class: { list: "[[data-slot=tabs]>&]:p-1 [[data-slot=tabs]>&]:-m-1" } },
    /* the hairline: an inset shadow; on a list that is the root's child (which pads its ends) a
     * background on the content box, so it keeps its length */
    {
      variant: "underline",
      inHeader: false,
      class: {
        list: [
          "shadow-[inset_0_-1px_0_var(--fndn-line)] [[data-slot=tabs]>&]:shadow-none",
          "[[data-slot=tabs]>&]:bg-[linear-gradient(var(--fndn-line)_0_0)] [[data-slot=tabs]>&]:bg-bottom [[data-slot=tabs]>&]:bg-[length:100%_1px] [[data-slot=tabs]>&]:bg-no-repeat [[data-slot=tabs]>&]:bg-origin-content [[data-slot=tabs]>&]:bg-clip-content",
        ],
      },
    },
    { variant: "pill", closable: true, class: { trigger: "pe-6" } },
    { variant: "underline", closable: true, class: { trigger: "pe-5" } },
    { variant: "attached", closable: true, class: { trigger: "pe-7" } },
    /* the dense sizes (editors): xs 24 · sm 28; md keeps each variant's own height */
    { variant: "pill", size: "xs", class: { trigger: "h-5 px-1.5" } },
    { variant: "pill", size: "sm", class: { trigger: "h-[22px] px-1.5" } },
    { variant: "underline", size: "xs", class: { trigger: "h-6" } },
    { variant: "underline", size: "sm", class: { trigger: "h-7" } },
    { variant: "underline", size: ["xs", "sm"], class: { list: "gap-3" } },
    /* in a header the underline tabs stretch to the header's height (after the dense heights: it wins) */
    { variant: "underline", inHeader: true, class: { list: "items-stretch", tab: "self-stretch", trigger: "h-auto" } },
    { variant: "attached", size: "xs", class: { trigger: "h-6 px-2", list: "[--fndn-tabs-radius:var(--fndn-radius-chip)]" } },
    { variant: "attached", size: "sm", class: { trigger: "h-7 px-2.5", list: "[--fndn-tabs-radius:var(--fndn-radius-chip)]" } },
    { variant: "attached", size: ["xs", "sm"], closable: true, class: { trigger: "pe-6", close: "-ms-5 me-1" } },
    /* fit (VS Code): as wide as the title, never cut; the strip scrolls */
    { variant: "attached", tabSizing: "fit", class: { tab: "w-auto shrink-0 min-w-0", trigger: "w-auto shrink-0 min-w-0" } },
    /* a fit tab's title is never cut, so the close button stands 8px clear of it, as VS Code's
     * (shrink tabs keep 4px: their title is cut just before it) */
    { variant: "attached", tabSizing: "fit", closable: true, class: { trigger: "pe-8" } },
    { variant: "attached", tabSizing: "fit", size: ["xs", "sm"], closable: true, class: { trigger: "pe-7" } },
    /* arrivals make room: an inserted tab (the closable wrapper, or the trigger alone) opens from 0.
     * fndn-check-ok: width, min-width and inline padding are a tab's room in the strip; no transform
     * can open it, and they move over duration.reveal (0 under reduced motion: only the fade stays) */
    {
      variant: "attached",
      ready: true,
      class: {
        tab: [
          "kbd-instant starting:w-0 starting:min-w-0 starting:opacity-0",
          "motion-opacity-base motion-also-[width_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong),min-width_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong)]",
        ],
        trigger: [
          "starting:w-0 starting:min-w-0 starting:px-0 starting:opacity-0",
          "motion-opacity-base motion-also-[width_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong),min-width_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong),padding-inline_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong)]",
        ],
      },
    },
    /* departures close their room: the closing tab's width and padding go to 0 and it fades; it takes
     * no more presses. After the closable compounds, so its px-0 wins over their pe-* */
    {
      variant: "attached",
      closing: true,
      class: {
        tab: "w-0 min-w-0 opacity-0 pointer-events-none",
        trigger: "w-0 min-w-0 px-0 opacity-0",
      },
    },
  ],
  defaultVariants: { variant: "pill", size: "md", inHeader: false, closable: false, fill: false, tabSizing: "shrink", ready: false, closing: false },
});

export type TabsRecipeProps = VariantProps<typeof tabs>;
