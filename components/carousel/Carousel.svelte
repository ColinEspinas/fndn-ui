<!-- Slides that scroll sideways a page at a time. Behaviour by Ark UI (Zag carousel). -->
<script lang="ts">
  import { Carousel as ArkCarousel } from "@ark-ui/svelte/carousel";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import PauseIcon from "phosphor-svelte/lib/PauseIcon";
  import PlayIcon from "phosphor-svelte/lib/PlayIcon";
  import { untrack, type Snippet } from "svelte";
  import { carouselMotion, holdAutoplay, reducedMotion, restartProgress, withoutScrollWatch } from "./carousel.logic";
  import { trackModality } from "../lib/modality";
  import Button from "../button/Button.svelte";
  import Pager from "../pager/Pager.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { carousel } from "./carousel.recipe";

  /** A slide: text (content), or rich content through the `slide` snippet; label names it for screen readers. */
  export type CarouselItem = { content?: string; label?: string };
  export type CarouselEffect = "slide" | "depth" | "fade" | "parallax" | "none";
  export type CarouselLoop = "none" | "rewind" | "endless";

  type Props = {
    /** The slides in order. Strings are text slides. */
    items: ReadonlyArray<CarouselItem | string>;
    /** Two-way bindable, 0-based: <Carousel bind:page /> */
    page?: number;
    onpagechange?: (page: number) => void;
    /** Slides shown at once; a page moves by that many. */
    slidesPerPage?: number;
    /** Pixels between slides. */
    spacing?: number;
    /** Wrap from the last page to the first and back. */
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
    /** A slide's content, instead of its text. */
    slide?: Snippet<[{ item: CarouselItem; index: number }]>;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, page = $bindable(0), onpagechange, slidesPerPage = 1, spacing = 12, loop = "none", indicators = false, controls = true,
    mouseDrag = true, dragReach = "page", effect: arrival = "slide", autoplay = 0, label = "Slides", slide: slideSnippet, class: className, ...rest
  }: Props = $props();

  const slides = $derived(items.map((o): CarouselItem => (typeof o === "string" ? { content: o } : o)));
  /* before the engine has measured, a page is slidesPerPage slides */
  const guess = $derived(Math.ceil(slides.length / Math.max(1, Math.floor(slidesPerPage))));
  const pageCount = (snaps: number) => snaps || guess;

  /* Autoplay: the user's wish (on until they pause or page by hand; off under reduced motion), and
   * what holds it now (pointer, focus, hidden page, off screen: carousel.logic.ts). The engine runs
   * only while both allow; `running` is what the engine last said it does. The wish is made once
   * mounted, where reduced motion can be read. */
  const on = $derived(autoplay > 0);
  let wanted = $state(false);
  let held = $state(false);
  const playing = $derived(on && wanted && !held && guess > 1);
  let running = false;
  let hold: ReturnType<typeof holdAutoplay> | undefined;
  /* fade is for one slide a page */
  const shown = $derived(arrival === "fade" && slidesPerPage !== 1 ? "slide" : arrival);
  const r = $derived(carousel({ draggable: mouseDrag, effect: shown, autoplay: on, playing, endless: loop === "endless" }));

  let group = $state<HTMLElement | null>(null);
  const root = () => group?.parentElement ?? null;
  $effect(() => trackModality());
  /* how the slides move (carousel.logic.ts): one animator for every page change, the drag (which
     tells the engine its page the moment the slides are let go), and where each slide is, for
     the effects. Set up once for the scroller; it reads the latest props when it needs them. */
  $effect(() => {
    const el = group;
    return untrack(() => carouselMotion(el, {
      page: () => page,
      turn: (next) => { if (next >= 0 && next !== page) { page = next; onPage(next); } },
      automatic: () => running,
      drag: () => mouseDrag,
      loop: () => loop,
      reach: () => dragReach,
      effect: () => shown,
    }));
  });
  $effect(() => {
    wanted = on && !reducedMotion();
    if (!on || !group) return;
    hold = holdAutoplay(root(), (h) => { held = h; });
    return () => hold?.stop();
  });
  /* the engine's timer starts over from a full delay: so does the current dot's fill */
  $effect(() => { if (playing) restartProgress(root()); });

  function onPage(next: number) {
    /* a page the engine did not turn by itself was turned by hand: autoplay stops */
    if (on && !running) wanted = false;
    onpagechange?.(next);
  }
  function toggle() {
    if (!wanted) hold?.release();
    wanted = !wanted;
  }
</script>

<ArkCarousel.Root
  data-slot="carousel"
  class={r.base({ class: className })}
  slideCount={slides.length}
  bind:page
  onPageChange={(d) => onPage(d.page)}
  {slidesPerPage}
  spacing={`${spacing}px`}
  loop={loop !== "none" || playing}
  autoplay={playing ? { delay: autoplay } : false}
  onAutoplayStatusChange={(d) => { running = d.isPlaying; }}
  allowMouseDrag={false}
  translations={{ item: (index, count) => slides[index]?.label ?? `${index + 1} of ${count}` }}
  {...rest}
>
  <!-- the engine's slide group, without its own watch on wheel and touch (carousel.logic.ts names the page) -->
  <ArkCarousel.Context>
    {#snippet render(carouselApi)}
      <div {...withoutScrollWatch(carouselApi().getItemGroupProps())} bind:this={group} data-slot="carousel-item-group" class={r.itemGroup()}>
        {#each slides as item, index (index)}
          <ArkCarousel.Item {index} data-slot="carousel-item" class={r.item({ plain: typeof item.content === "string" })}>
            {#if slideSnippet}{@render slideSnippet({ item, index })}{:else}{item.content}{/if}
          </ArkCarousel.Item>
        {/each}
      </div>
    {/snippet}
  </ArkCarousel.Context>
  {#if controls || on}
    <ArkCarousel.Context>
      {#snippet render(carouselApi)}
        {@const api = carouselApi()}
        {@const count = pageCount(api.pageSnapPoints.length)}
        {#if count > 1}
          {@const pages = { "aria-controls": api.getItemGroupProps().id as string | undefined }}
          <ArkCarousel.Control data-slot="carousel-control" class={r.control()}>
            <!-- slides that move by themselves always have a pause control, whatever `controls` hides -->
            {#if on}
              {#snippet autoplayIcon()}{#if wanted}<PauseIcon data-slot="icon" weight="fill" />{:else}<PlayIcon data-slot="icon" weight="fill" />{/if}{/snippet}
              <Tooltip content={wanted ? "Pause" : "Play"}>
                {#snippet trigger(tipProps)}
                  <Button {...pages} {...mergeProps(tipProps(), { onclick: toggle })} data-carousel="autoplay" class={r.autoplay()} variant="ghost" size="sm" square muted icon={autoplayIcon} aria-label={wanted ? "Pause" : "Play"} />
                {/snippet}
              </Tooltip>
            {/if}
            {#if controls && indicators}
              <ArkCarousel.IndicatorGroup data-slot="carousel-indicator-group" class={r.indicatorGroup()} style={on ? `--fndn-carousel-dwell: ${autoplay}ms` : undefined}>
                <!-- one tab stop: the current dot (the arrow keys move between them, focus following) -->
                {#each { length: count }, index (index)}
                  <ArkCarousel.Indicator {index} tabindex={index === Math.min(api.page, count - 1) ? 0 : -1} data-slot="carousel-indicator" class={r.indicator()} />
                {/each}
              </ArkCarousel.IndicatorGroup>
            {/if}
            <!-- the pager's buttons page the slide group, as the engine's own triggers would say -->
            {#if controls}
              <Pager
                data-carousel="pager"
                class={r.pager()}
                layout="start"
                {count}
                page={Math.min(api.page, count - 1)}
                onpagechange={(to) => api.scrollTo(to)}
                loop={loop !== "none"}
                unit={slidesPerPage === 1 ? "Slide" : "Page"}
                {label}
                prevLabel={slidesPerPage === 1 ? "Previous slide" : "Previous page"}
                nextLabel={slidesPerPage === 1 ? "Next slide" : "Next page"}
                prevProps={pages}
                nextProps={pages}
              />
            {/if}
          </ArkCarousel.Control>
        {/if}
      {/snippet}
    </ArkCarousel.Context>
  {/if}
</ArkCarousel.Root>
