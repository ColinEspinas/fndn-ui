"use client";
import { Carousel as ArkCarousel } from "@ark-ui/react/carousel";
import { Pause, Play } from "@phosphor-icons/react";
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { carouselMotion, holdAutoplay, reducedMotion, restartProgress, withoutScrollWatch } from "./carousel.logic";
import { trackModality } from "../lib/modality";
import { Button } from "../button/button";
import { Pager } from "../pager/pager";
import { Tooltip } from "../tooltip/tooltip";
import { carousel } from "./carousel.recipe";

export type CarouselItem = { content?: ReactNode; label?: string };
export type CarouselEffect = "slide" | "depth" | "fade" | "parallax" | "none";
export type CarouselLoop = "none" | "rewind" | "endless";

export type CarouselProps = {
  /** The slides in order. Strings are text slides. */
  items: ReadonlyArray<CarouselItem | string>;
  /** Controlled page, 0-based, with onPageChange. Omit for uncontrolled (defaultPage). */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Slides shown at once; a page moves by that many. */
  slidesPerPage?: number;
  /** Pixels between slides. */
  spacing?: number;
  /** What follows the last page: none (nothing, the default), rewind (the slides run back to the first) or endless (the first slide follows the last and the slides go on the same way). */
  loop?: CarouselLoop;
  /** Dots at the start of the control row. */
  indicators?: boolean;
  /** The control row (pager and dots). */
  controls?: boolean;
  /** A mouse can drag the slides. */
  mouseDrag?: boolean;
  /** How far one drag takes the slides: page (the neighbouring page at most, the default) or free (as far as it is dragged). In fade a drag always turns one page. */
  dragReach?: "page" | "free";
  /** How a slide arrives: slide, depth, fade (one slide per page) or parallax (moves the element a slide marks data-carousel="picture"). */
  effect?: CarouselEffect;
  /** Milliseconds a page stays before the next comes by itself; 0 is off. */
  autoplay?: number;
  /** The pager's accessible name. */
  label?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Slides that scroll sideways a page at a time. Behaviour by Ark UI (Zag carousel). */
export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  { items, page, defaultPage = 0, onPageChange, slidesPerPage = 1, spacing = 12, loop = "none", indicators = false, controls = true, mouseDrag = true, dragReach = "page", effect = "slide", autoplay = 0, label = "Slides", className, ...rest },
  ref,
) {
  useEffect(() => trackModality(), []);
  const group = useRef<HTMLDivElement>(null);
  const slides = items.map((o): CarouselItem => (typeof o === "string" ? { content: o } : o));
  /* before the engine has measured, a page is slidesPerPage slides */
  const guess = Math.ceil(slides.length / Math.max(1, Math.floor(slidesPerPage)));

  /* Autoplay: the user's wish (on until they pause or page by hand; off under reduced motion), and
   * what holds it now (pointer, focus, hidden page, off screen: carousel.logic.ts). The engine
   * runs only while both allow; `running` is what the engine last said it does. The wish is made
   * once mounted, where reduced motion can be read. */
  const [wanted, setWanted] = useState(false);
  const [held, setHeld] = useState(false);
  const playing = autoplay > 0 && wanted && !held && guess > 1;
  const running = useRef(false);
  const hold = useRef<ReturnType<typeof holdAutoplay>>(null);
  useEffect(() => setWanted(autoplay > 0 && !reducedMotion()), [autoplay > 0]);
  useEffect(() => {
    if (!autoplay) return;
    hold.current = holdAutoplay(group.current?.parentElement ?? null, setHeld);
    return () => hold.current?.stop();
  }, [autoplay > 0]);
  /* the engine's timer starts over from a full delay: so does the current dot's fill */
  useEffect(() => { if (playing) restartProgress(group.current?.parentElement ?? null); }, [playing]);

  /* The page is held here when the caller does not hold it, so that a drag can turn it (the
   * engine is told the page the moment the slides are let go, not when they arrive). */
  const [own, setOwn] = useState(defaultPage);
  const current = page ?? own;
  const turned = (next: number) => {
    /* a page the engine did not turn by itself was turned by hand: autoplay stops */
    if (autoplay > 0 && !running.current) setWanted(false);
    setOwn(next);
    onPageChange?.(next);
  };
  const shown = effect === "fade" && slidesPerPage !== 1 ? "slide" : effect;
  /* how the slides move (carousel.logic.ts): one animator for every page change, the drag, and
   * where each slide is, for the effects. It reads the latest props through this ref. */
  const live = useRef({ turned, current, mouseDrag, dragReach, shown, loop });
  live.current = { turned, current, mouseDrag, dragReach, shown, loop };
  useEffect(() => carouselMotion(group.current, {
    page: () => live.current.current,
    turn: (next) => { if (next >= 0 && next !== live.current.current) live.current.turned(next); },
    automatic: () => running.current,
    drag: () => live.current.mouseDrag,
    loop: () => live.current.loop,
    reach: () => live.current.dragReach,
    effect: () => live.current.shown,
  }), []);
  const r = carousel({ draggable: mouseDrag, effect: shown, autoplay: autoplay > 0, playing, endless: loop === "endless" });
  return (
    <ArkCarousel.Root
      ref={ref}
      data-slot="carousel"
      className={r.base({ class: className })}
      slideCount={slides.length}
      page={current}
      onPageChange={(d) => turned(d.page)}
      slidesPerPage={slidesPerPage}
      spacing={`${spacing}px`}
      /* while advancing by themselves the slides wrap from the last page to the first */
      loop={loop !== "none" || playing}
      autoplay={playing ? { delay: autoplay } : false}
      onAutoplayStatusChange={(d) => { running.current = d.isPlaying; }}
      /* the drag is carousel.logic.ts's: it carries the pointer's speed into the settle */
      allowMouseDrag={false}
      translations={{ item: (index, count) => slides[index]?.label ?? `${index + 1} of ${count}` }}
      {...rest}
    >
      {/* the engine's slide group, without its own watch on wheel and touch (carousel.logic.ts names the page) */}
      <ArkCarousel.Context>
        {(api) => (
          <div {...withoutScrollWatch(api.getItemGroupProps())} ref={group} data-slot="carousel-item-group" className={r.itemGroup()}>
            {slides.map((slide, index) => (
              <ArkCarousel.Item key={index} index={index} data-slot="carousel-item" className={r.item({ plain: typeof slide.content === "string" })}>
                {slide.content}
              </ArkCarousel.Item>
            ))}
          </div>
        )}
      </ArkCarousel.Context>
      {(controls || autoplay > 0) && (
        <ArkCarousel.Context>
          {(api) => {
            const count = api.pageSnapPoints.length || guess;
            if (count <= 1) return null;
            /* the pager's buttons page the slide group, as the engine's own triggers would say */
            const pages = { "aria-controls": api.getItemGroupProps().id as string | undefined };
            return (
              <ArkCarousel.Control data-slot="carousel-control" className={r.control()}>
                {/* slides that move by themselves always have a pause control, whatever `controls` hides */}
                {autoplay > 0 && (
                  <Tooltip content={wanted ? "Pause" : "Play"}>
                    <Button
                      {...pages}
                      data-carousel="autoplay"
                      className={r.autoplay()}
                      variant="ghost"
                      size="sm"
                      square
                      muted
                      icon={wanted ? <Pause data-slot="icon" weight="fill" /> : <Play data-slot="icon" weight="fill" />}
                      aria-label={wanted ? "Pause" : "Play"}
                      onClick={() => {
                        if (!wanted) hold.current?.release();
                        setWanted(!wanted);
                      }}
                    />
                  </Tooltip>
                )}
                {controls && indicators && (
                  <ArkCarousel.IndicatorGroup data-slot="carousel-indicator-group" className={r.indicatorGroup()} style={autoplay > 0 ? ({ "--fndn-carousel-dwell": `${autoplay}ms` } as CSSProperties) : undefined}>
                    {/* one tab stop: the current dot (the arrow keys move between them, focus following) */}
                    {Array.from({ length: count }, (_, index) => (
                      <ArkCarousel.Indicator key={index} index={index} tabIndex={index === Math.min(api.page, count - 1) ? 0 : -1} data-slot="carousel-indicator" className={r.indicator()} />
                    ))}
                  </ArkCarousel.IndicatorGroup>
                )}
                {controls && (
                  <Pager
                    data-carousel="pager"
                    className={r.pager()}
                    layout="start"
                    count={count}
                    page={Math.min(api.page, count - 1)}
                    onPageChange={(to) => api.scrollTo(to)}
                    loop={loop !== "none"}
                    unit={slidesPerPage === 1 ? "Slide" : "Page"}
                    label={label}
                    prevLabel={slidesPerPage === 1 ? "Previous slide" : "Previous page"}
                    nextLabel={slidesPerPage === 1 ? "Next slide" : "Next page"}
                    prevProps={pages}
                    nextProps={pages}
                  />
                )}
              </ArkCarousel.Control>
            );
          }}
        </ArkCarousel.Context>
      )}
    </ArkCarousel.Root>
  );
});
