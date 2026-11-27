import { tv, type VariantProps } from "../lib/tv";

/* tabs — tab strip + panels on the Zag tabs machine.
 *   pill (default)  13px labels, 26px tabs; the selected tab sits on a filled pill (the chat header strip)
 *                   whose radius is the chip token
 *   underline       13px labels, 32px tabs on a hairline; an ink bar under the selected tab
 *   size            xs 24 · sm 28 · md (default) — dimensions only; md keeps each variant's height
 *                   (pill 26, underline 32)
 *   inHeader        pill or underline inside a card header: fills the header's height, no hairline
 *                   (its own prop: the size scale is dimensions only)
 *   closable        a closable tab is wrapped in the tab part with its close part beside the
 *                   trigger (a button cannot hold a button): the trigger keeps room at its end and
 *                   the close button is pulled back over it, so the indicator, which measures the
 *                   trigger, covers both. The wrapper is not positioned: the trigger's offset box
 *                   stays relative to the list, which the engine and placeIndicator measure
 *   fill            the root fills its container's height and the selected panel takes the rest
 *   document tabs   closable tabs are documents (open files, browser tabs): a title is free text, so
 *                   a closable tab's label stops at 240px and is cut at its end (with its title);
 *                   a tab that is not closable names a view and is never cut
 *   arrivals        closable tabs (house rule "arrivals and removals make room"): a tab added after
 *                   the first paint (`ready`, set by the adapter after mount) opens its width from 0
 *                   over duration.reveal while it fades in over duration.base; a tab closed by the
 *                   pointer (`closing`) closes its width to 0 the same way, and the adapter calls
 *                   onClose when it has. From the keyboard both are instant (kbd-instant; the adapter
 *                   closes at once); under reduced motion duration.reveal is 0, so the width jumps
 *                   and only the fade is left. Width, min-width and inline padding move (a tab's
 *                   room is its width: no transform can open it); the width is auto, so it moves
 *                   through interpolate-size (Chromium; elsewhere the tab appears at once). The
 *                   indicator measures the trigger, so it rides along and lands on the selected tab
 *   overflow        every variant: a strip with more tabs than room scrolls sideways (no scrollbar),
 *                   fades each edge it continues past and shows the all-tabs button after the list.
 *                   watchStrip (tabs.logic.ts) measures it: data-overflow on the list while the tabs
 *                   are wider than it (never on a list with no box), data-overflow-start and
 *                   data-overflow-end from the scroll position. The fade is a 24px mask on the list,
 *                   the room revealTab keeps clear of each edge; it follows the scroll, with no time
 *                   of its own. The adapters render the button (the more part: a Menu whose trigger is
 *                   the real Button, ghost, muted, square) only while data-overflow holds
 *
 * Everything is here, motion included. The indicator is the engine's: it measures the selected tab
 * and travels on transform only while a selection is being made (the engine sets transition-property
 * from --transition-property then), so it does not slide in on mount or when fonts load. Keyboard
 * selections are instant (kbd-instant). Panels swap instantly. Parts are found by data-slot
 * (tabs, tabs-header, tabs-list, tabs-indicator, tabs-trigger, tabs-label, tabs-content); the root
 * slot is `base`. The all-tabs menu is marked data-tabs="more", its button data-tabs="more-trigger".
 *
 * The root is a grid of two columns, the list and the all-tabs button side by side on the first row
 * (when there is no header part to hold them), and every other part across both: the header, and
 * the selected panel on the second row. Its rows are as tall as their content, packed at the top
 * (a panel keeps its content's height in a taller root); with fill the panel's row takes the
 * height the strip leaves. */

/* until the indicator is measured the selected tab paints itself exactly like the indicator, so the
 * hand-over is invisible (written whole below: a class built from pieces is never generated). The
 * adapters also place the indicator before the first paint (tabs.logic.ts placeIndicator). */

export const tabs = tv({
  slots: {
    base: "grid grid-cols-[minmax(0,1fr)_auto] content-start min-w-0 max-w-full *:col-span-full",
    /* the host's header row, when the list is wrapped in it */
    header: "flex items-center min-w-0",
    list: [
      "relative flex items-center min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [[data-slot=tabs]>&]:col-span-1",
      /* a tab's width can open from 0 to auto (arrivals) and close back */
      "[interpolate-size:allow-keywords]",
      /* overflowing, each edge the strip continues past fades out over 24px (a mask: the strip has
       * no colour of its own to fade into); logical, so right-to-left swaps the ends */
      "[--_fade:linear-gradient(to_var(--_end,right),transparent,#000_var(--_fade-start,0px),#000_calc(100%_-_var(--_fade-end,0px)),transparent)] [&:dir(rtl)]:[--_end:left]",
      "data-overflow-start:[--_fade-start:24px] data-overflow-end:[--_fade-end:24px]",
      "data-overflow-start:[mask-image:var(--_fade)] data-overflow-end:[mask-image:var(--_fade)]",
    ],
    /* the all-tabs menu (the Menu's root) after the list, holding its button; centred on the strip */
    more: "flex shrink-0 items-center self-stretch [[data-slot=tabs]>&]:col-span-1",
    /* the all-tabs button (the real Button, ghost, muted, square) */
    moreTrigger: "",
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
      pill: { close: "-ms-5 me-1", more: "[[data-slot=tabs]>&]:ps-1" },
      underline: {
        /* the list clips: 4px of inline padding, taken back by the margin, give the ring room at the
         * ends (a list that is the root's child; one in the header part keeps its edges) */
        list: "gap-4 [[data-slot=tabs]>&]:px-1 [[data-slot=tabs]>&]:-mx-1",
        more: "[[data-slot=tabs]>&]:ps-1",
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
    },
    size: {
      xs: { trigger: "text-xs", icon: "size-3.5 text-[14px]" },
      sm: { trigger: "text-xs", icon: "size-3.5 text-[14px]" },
      md: {},
    },
    /* inside a card header: the strip fills the header's height, with no hairline of its own; a
     * list that is the root's only child fills the root */
    /* (the panel starts at the header's line: what it holds brings its own inset) */
    inHeader: {
      true: { base: "self-stretch", list: "self-stretch [[data-slot=tabs]>&]:flex-[1_0_auto]", content: "pt-0" },
      false: {},
    },
    /* a closable tab is a document: its trigger keeps room at its end for the close button, and its
     * title (free text) stops at 240px, cut at its end */
    closable: { true: { label: "max-w-60" }, false: {} },
    /* set by the adapter after mount: from then on an inserted closable tab opens its room */
    ready: { true: {}, false: {} },
    /* a tab closed by the pointer, while its room closes; the adapter then calls onClose */
    closing: { true: {}, false: {} },
    /* fill: the root takes its container's height; the selected panel takes what the strip leaves
     * and scrolls inside itself (put a ScrollArea in it for the system's scrollbar) */
    fill: {
      true: { base: "h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]", content: "flex-1 min-h-0 overflow-y-auto overscroll-x-contain" },
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
          /* the edge fades leave the hairline whole: a second mask layer keeps the bottom pixel */
          "data-overflow-start:[mask-image:var(--_fade),linear-gradient(#000_0_0)] data-overflow-end:[mask-image:var(--_fade),linear-gradient(#000_0_0)]",
          "[mask-size:100%_100%,100%_1px] [mask-position:0_0,0_100%] [mask-repeat:no-repeat]",
        ],
        /* the hairline runs on under the all-tabs button */
        more: "shadow-[inset_0_-1px_0_var(--fndn-line)]",
      },
    },
    /* pill tabs of 20 and 22px: the 24px button keeps to the strip's height (negative block margins) */
    { variant: "pill", size: "xs", class: { moreTrigger: "-my-0.5" } },
    { variant: "pill", size: "sm", class: { moreTrigger: "-my-px" } },
    /* the dense sizes (editors): xs 24 · sm 28; md keeps each variant's own height */
    { variant: "pill", size: "xs", class: { trigger: "h-5 px-1.5" } },
    { variant: "pill", size: "sm", class: { trigger: "h-[22px] px-1.5" } },
    { variant: "underline", size: "xs", class: { trigger: "h-6" } },
    { variant: "underline", size: "sm", class: { trigger: "h-7" } },
    { variant: "underline", size: ["xs", "sm"], class: { list: "gap-3" } },
    /* a closable trigger keeps room at its end for the close button (after the dense sizes, whose
     * inline padding it overrides at the end) */
    { variant: "pill", closable: true, class: { trigger: "pe-6" } },
    { variant: "underline", closable: true, class: { trigger: "pe-5" } },
    /* in a header the underline tabs stretch to the header's height (after the dense heights: it wins) */
    { variant: "underline", inHeader: true, class: { list: "items-stretch", tab: "self-stretch", trigger: "h-auto" } },
    /* arrivals make room: an inserted closable tab (the tab part, which fades, and its trigger) opens
     * from 0; underline also opens the gap before the next tab (its end margin, from -16px).
     * fndn-check-ok: width, min-width, inline padding and margin are a tab's room in the strip; no
     * transform can open it, and they move over duration.reveal (0 under reduced motion: only the
     * fade stays) */
    {
      ready: true,
      class: {
        tab: [
          "kbd-instant starting:w-0 starting:min-w-0 starting:opacity-0",
          "motion-opacity-base motion-also-[width_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong),min-width_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong),margin-inline-end_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong)]",
        ],
      },
    },
    {
      ready: true,
      closable: true,
      class: {
        trigger: [
          "starting:w-0 starting:min-w-0 starting:px-0",
          "motion-also-[width_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong),min-width_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong),padding-inline_var(--fndn-duration-reveal)_var(--fndn-easing-out-strong)]",
        ],
      },
    },
    { variant: "underline", ready: true, class: { tab: "starting:-me-4" } },
    /* departures close their room: the closing tab's width and padding go to 0 and it fades; it takes
     * no more presses. After the closable compounds, so its px-0 wins over their pe-* */
    {
      closing: true,
      class: {
        tab: "w-0 min-w-0 opacity-0 pointer-events-none",
        trigger: "w-0 min-w-0 px-0",
      },
    },
    { variant: "underline", closing: true, class: { tab: "-me-4" } },
  ],
  defaultVariants: { variant: "pill", size: "md", inHeader: false, closable: false, fill: false, ready: false, closing: false },
});

export type TabsRecipeProps = VariantProps<typeof tabs>;
