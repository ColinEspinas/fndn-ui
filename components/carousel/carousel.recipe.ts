import { tv, type VariantProps } from "../lib/tv";

/* carousel — a row of slides that moves sideways a page at a time (Ark UI carousel).
 *
 * The engine owns the scroller's layout (a grid of columns sized from --slides-per-page and
 * --slide-spacing, overflow-x auto, scroll-snap x mandatory, overscroll-behavior-x contain, no
 * scrollbar), the pages and the keyboard. How the slides move is carousel.logic.ts: one animator
 * for every page change (a spring, never the browser's own smooth scroll, which differs between
 * browsers), the drag, and where each slide is. Here: the scroller never scrolls vertically (a
 * vertical wheel or swipe goes on to the page); slides are clipped to the card radius; a slide of
 * plain text is an inset panel. While a drag or the animator moves the slides the scroller carries
 * data-dragging or data-settling, and scroll snapping is off: it would pull every frame back.
 *
 * The scroller has the slides' radius, so its focus ring follows their corners. A mouse that can
 * drag the slides (`draggable`, the mouseDrag prop) sees the grab cursor, grabbing while it drags,
 * as on the slider's thumb. A text slide's hairline is drawn inside it (an inset ring): the
 * scroller clips anything outside a slide, which left only the corners of an outer ring.
 *
 * Effects (how a slide arrives) are drawn from where the slide is. A slide crossing an edge of the
 * scroller carries data-moving and four custom properties (--fndn-carousel-out, -lag, -shift, -show:
 * carousel.logic.ts), set after every change of the scroll position, so the pager, the dots, a
 * wheel, a swipe, a drag and a flick all draw the same thing, in every browser and in both
 * directions. A slide at rest carries nothing: no transform, so its text is never on one.
 *   depth     the slide shrinks and dims the further out it is (`scale`, opacity)
 *   fade      nothing travels: the two slides sit on the scroller's box (`translate` takes their
 *             travel back) and the later one fades in over the earlier. The scroller does not
 *             scroll under a wheel or a finger then (a drag turns the page: the logic)
 *   none      no animation at all: the page changes at once, whatever turns it
 *   parallax  the picture a slide marks (data-carousel="picture") lags its slide, by a share of
 *             its frame's width; several pictures in one slide can each take a different share
 *             (--fndn-carousel-parallax: the further back, the more)
 * The amounts are tokens; under reduced motion depth and parallax are still.
 *
 * On an endless strip (loop "endless") the first slide follows the last. No slide is copied: the
 * logic draws each one on the turn of the strip nearest the scroller, by an offset along the
 * strip (--fndn-carousel-round), so an effect still sees every slide once, where it is drawn.
 *
 * The control row holds, at the start, the pause / play button when the slides advance by
 * themselves (the real Button, marked data-carousel="autoplay"), then the dots, and the real Pager
 * at the end (marked data-carousel="pager"; its classes are the `pager` slot, passed as
 * className). A dot is a 24px button (40px under a finger), round so its focus ring is, whose
 * ::before is the 6px dot: line-strong, ink when current. The dots are one tab stop (the current
 * one; the adapter's tabIndex), and the arrow keys move between them. While the slides advance by
 * themselves the current dot is a 16px track (::before) that an ink bar (::after) fills, linear,
 * over the time a page stays (--fndn-carousel-dwell, set by the adapter); paused, the fill holds. */
export const carousel = tv({
  slots: {
    base: "flex flex-col gap-3 min-w-0 w-full",
    itemGroup: "min-w-0 overflow-y-hidden rounded-card [&::-webkit-scrollbar]:hidden data-dragging:[scroll-snap-type:none]! data-settling:[scroll-snap-type:none]!",
    item: "min-w-0 overflow-hidden rounded-card",
    control: "flex items-center gap-3 min-w-0",
    autoplay: "shrink-0",
    indicatorGroup: "flex flex-wrap items-center min-w-0",
    indicator: [
      "relative grid place-items-center size-6 rounded-pill pointer-coarse:size-10",
      "before:content-[''] before:size-1.5 before:rounded-pill before:bg-line-strong",
      "before:motion-colors-base before:motion-transform-press",
      "hover:before:bg-ink-3 data-current:before:bg-ink",
      "[:root:not([data-fndn-input=keyboard])_&:active]:before:scale-press-sm",
    ],
    pager: "ms-auto",
  },
  variants: {
    /* how a slide arrives (the effect prop) */
    effect: {
      /* the slides travel sideways with the scroll, nothing more */
      slide: {},
      /* no animation: the page changes at once (the logic never lets it travel). Nothing travels,
       * so, as in fade, the scroller does not scroll by itself and a sideways drag turns the page */
      none: { itemGroup: "overflow-x-hidden! touch-pan-y" },
      /* a slide crossing an edge is smaller and dimmer, the more the further out it is */
      depth: {
        item: [
          "data-moving:[scale:calc(1-(1-var(--fndn-motion-carousel-depth-scale))*var(--fndn-carousel-out))]",
          "data-moving:opacity-[calc(1-(1-var(--fndn-motion-carousel-depth-opacity))*var(--fndn-carousel-out))]",
        ],
      },
      /* the slides stay on the scroller's box and cross-fade (one slide per page: the adapter
       * passes slide otherwise). Nothing travels, so the scroller does not scroll by itself (its
       * overflow is hidden, over the engine's own style) and a sideways finger is the drag's */
      fade: {
        itemGroup: "overflow-x-hidden! touch-pan-y",
        item: [
          "data-moving:[translate:var(--fndn-carousel-shift)_0] data-moving:opacity-(--fndn-carousel-show)",
          /* the slide fading in comes forward a little as it does (half the depth effect's scale) */
          "data-moving:[scale:calc(1-(1-var(--fndn-motion-carousel-depth-scale))*0.5*(1-var(--fndn-carousel-show)))]",
        ],
      },
      /* the picture a slide marks (data-carousel="picture") lags the slide: by a share of its
       * frame's width (the token), so it reads the same in a small slide and a wide one. It is
       * wider than its frame by that much on each side, so the slide's clip never shows its edge.
       * A slide may mark several, one over the other: --fndn-carousel-parallax on a picture is its
       * share of the lag (1 by default; more for a layer further back, which stays behind longer,
       * less for a nearer one), so the layers slide past each other. `translate` counts in the
       * picture's own width, which is wider than the frame: hence the division */
      parallax: {
        item: [
          "[&_[data-carousel=picture]]:max-w-none [&_[data-carousel=picture]]:shrink-0",
          "[&_[data-carousel=picture]]:w-[calc(100%*(1+2*var(--fndn-motion-carousel-parallax-shift)*var(--fndn-carousel-parallax,1)))]",
          "[&_[data-carousel=picture]]:mx-[calc(-100%*var(--fndn-motion-carousel-parallax-shift)*var(--fndn-carousel-parallax,1))]",
          "data-moving:[&_[data-carousel=picture]]:[translate:calc(var(--fndn-carousel-lag)*-100%*var(--fndn-motion-carousel-parallax-shift)*var(--fndn-carousel-parallax,1)/(1+2*var(--fndn-motion-carousel-parallax-shift)*var(--fndn-carousel-parallax,1)))_0]",
        ],
      },
    },
    /* the slides advance by themselves (the autoplay prop): the current dot is a track that fills */
    autoplay: {
      true: {
        indicator: [
          "before:[grid-area:1/1] data-current:before:w-4 data-current:before:bg-line-strong",
          "data-current:after:content-[''] data-current:after:[grid-area:1/1] data-current:after:h-1.5 data-current:after:w-4 data-current:after:rounded-pill data-current:after:bg-ink",
          "data-current:after:origin-left [&:dir(rtl)]:data-current:after:origin-right data-current:after:animate-[fndn-carousel-progress_var(--fndn-carousel-dwell)_linear_both]",
        ],
      },
    },
    /* the strip has no end (loop "endless"): a slide can be drawn a whole number of turns further
     * along it, by the offset the logic gives it (--fndn-carousel-round; none at its own place) */
    endless: {
      true: {
        /* the scrollable width is the whole strip (--fndn-carousel-strip), held open by a 1px
         * box at its far end, so it does not change as slides are drawn further along */
        itemGroup: "relative after:content-[''] after:absolute after:top-0 after:start-(--fndn-carousel-strip) after:size-px after:pointer-events-none",
        item: "relative start-(--fndn-carousel-round)",
      },
    },
    /* the slides are advancing now; otherwise the current dot's fill holds where it is */
    playing: { true: {}, false: {} },
    /* a mouse can drag the slides (the mouseDrag prop) */
    draggable: {
      true: { itemGroup: "cursor-grab data-dragging:cursor-grabbing data-settling:cursor-grabbing" },
    },
    /* a slide whose content is plain text */
    plain: {
      true: {
        item: "flex items-center justify-center min-h-40 p-4 bg-inset inset-ring inset-ring-line text-sm leading-normal text-ink-2 text-center wrap-anywhere [unicode-bidi:plaintext]",
      },
    },
  },
  /* any after: class gives the dot an ::after, which would push its ::before off centre: only a
   * dot that has the fill is told to hold it */
  compoundVariants: [{ autoplay: true, playing: false, class: { indicator: "data-current:after:[animation-play-state:paused]" } }],
  defaultVariants: { effect: "slide" },
});

export type CarouselRecipeProps = VariantProps<typeof carousel>;
