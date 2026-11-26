/* Carousel — how the slides move (shared by the React, Vue and Svelte adapters). Plain TypeScript,
 * no framework imports.
 *
 * One rule runs through this file: where the slides are (the scroller's scroll position) decides
 * everything that is drawn, and one animator moves that position. So the pager, the dots, a page
 * set from outside, the slides advancing by themselves and a released drag all travel the same
 * way, an effect can never drift from where the slides are, and it is the same in every browser.
 *
 *   the animator   `carouselMotion` takes over the scroller's scrollTo. A smooth scroll the engine
 *                  asks for becomes a critically damped spring (it starts at the speed the slides
 *                  already have, so a drag let go or a second press on Next never stops and starts
 *                  again, and it never goes past the page). The browser's own smooth scroll is not
 *                  used: it differs between browsers, starts from a standstill and is slow.
 *   instant        with the effect `none` (the page changes at once, always), under reduced
 *                  motion, and for a page changed from the keyboard while the focus
 *                  is in the carousel (`docs motion`: keyboard changes are instant). A page the
 *                  slides advance to by themselves, or one set from outside while the user types
 *                  elsewhere, is no keyboard action on the carousel: it travels. Putting the
 *                  slides back on the page they are on (first paint, a resize) never travels.
 *   a drag         the slides follow the pointer 1:1. Let go while the pointer is still moving (a
 *                  flick, however short) they go on to the next page in its direction; let go at
 *                  rest, to the nearest. One drag reaches the neighbouring page at most (`reach`
 *                  "page", the default): the slides stop following there, however far or fast
 *                  the pointer goes; with "free" they go as far as they are dragged. The engine
 *                  is told the page at once (`turn`), so the dots and the pager do not wait for
 *                  the slides to arrive. Where the slides run back (`loop` "rewind"), a drag or
 *                  a flick past the last page goes round to the first, and one before the first
 *                  to the last. A mouse drags in every
 *                  effect; a finger scrolls the scroller itself, except in fade, where nothing
 *                  travels: there a sideways drag of 40px (mouse or finger) turns the page, once
 *                  a drag, and the slides cross-fade on the animator like any other page change
 *                  (with `none` they change at once).
 *                  (Following the pointer there would hold two slides half faded over each
 *                  other for as long as the drag lasts.)
 *   the page       follows the slides wherever something else leaves them: once slides scrolled
 *                  by a wheel, a finger or the browser itself (to a control that takes the focus
 *                  in another slide) have come to rest on a page, the engine is told that page.
 *                  A press on the slides gives the scroller the focus, as on any focusable thing:
 *                  the arrow keys then page it (the engine listens while the focus is there).
 *   endless        with `loop` "endless" the strip has no end: after the last slide comes the
 *                  first, and the slides go on the same way. No slide is copied. Each is drawn on
 *                  the turn of the strip nearest the scroller: on its own place, or a whole
 *                  number of turns further on (--fndn-carousel-round, which the recipe turns into
 *                  an offset), so the slides in view always have their neighbours on either
 *                  side. At rest the slides sit one turn in, with a turn of slides either way,
 *                  and a travel that ends further off is put back there, a whole number of turns
 *                  away, which nothing shows.
 *   the effects    after every change of position each slide is told where it is (custom
 *                  properties and data-moving, below); the recipe turns that into its look. A
 *                  slide at rest carries none of it: no transform, no property.
 *
 * On a slide that is crossing an edge of the scroller (data-moving):
 *   --fndn-carousel-out    0 to 1: how much of it is out of view
 *   --fndn-carousel-lag    -1 to 1: the same, signed (negative: out on the left)
 *   --fndn-carousel-shift  px that would put it on the scroller's box (fade holds it there)
 *   --fndn-carousel-show   0 to 1: its opacity in a cross-fade (the later slide fades in over the
 *                        earlier one, which stays whole underneath: an opaque slide never lets the
 *                        page show through half way)
 *
 * On an endless strip:
 *   --fndn-carousel-round  on a slide drawn further on: px along the strip from its own place (a
 *                        whole number of turns)
 *   --fndn-carousel-strip  on the scroller: the length of the strip, all its turns (the recipe
 *                        makes the scrollable width that long, whichever slides are drawn where)
 *
 * While a drag or the spring moves the slides, the scroller carries data-dragging or
 * data-settling: the recipe keeps scroll snapping off then. */

const FLICK_SPEED = 0.3; /* px per ms at release: under this the pointer was placed, not thrown */
const FLICK_WINDOW = 100; /* ms of the pointer's last moves the speed is read from */
const SETTLE = 300; /* ms for the spring to come within a hundredth of its way */
const RATE = 6.64 / SETTLE;
const SLOP = 3; /* px a press may wander before it is a drag: a click stays a click */
const SWIPE = 40; /* px of a sideways drag that turns the page where nothing travels (fade) */
const REST = 100; /* ms with no scroll before slides something else scrolled are taken to be at rest */
const TURNS = 4; /* endless: the turns of the strip a slide can be drawn on (its own and three further on) */

export type CarouselEffect = "slide" | "depth" | "fade" | "parallax" | "none";
export type CarouselLoop = "none" | "rewind" | "endless";
export type CarouselMotion = {
  /** The current page (0-based), as the adapter holds it. */
  page: () => number;
  /** Tell the engine the page the slides are on now, or are going to (0-based): a drag let go, or slides something else scrolled. */
  turn: (page: number) => void;
  /** The engine is advancing the slides by itself now. */
  automatic: () => boolean;
  /** A mouse may drag the slides. */
  drag: () => boolean;
  /** What follows the last page: nothing; the first, once the slides have run back to it (rewind); or the first as the next slide of a strip with no end (endless). */
  loop: () => CarouselLoop;
  /** How far one drag can take the slides: to the neighbouring page, or as far as it is dragged. */
  reach: () => "page" | "free";
  effect: () => CarouselEffect;
};

/** The engine's props for the slide group, without its wheel and touch listeners. With them the
 * engine names the page itself once a wheel or a finger has stopped, from its own measure of
 * where the slides are. `carouselMotion` names it instead, wherever the slides come to rest and
 * whatever moved them, by its own ruler, which also holds on an endless strip. */
export function withoutScrollWatch<T extends object>(props: T): T {
  /* (a copy that keeps what is not named by a string too: one framework carries the styles so) */
  const out = { ...props } as Record<string, unknown>;
  for (const name of Object.keys(out)) if (/^on(wheel|touchstart)$/i.test(name)) delete out[name];
  return out as T;
}

export function carouselMotion(group: HTMLElement | null, options: CarouselMotion): () => void {
  if (!group) return () => {};
  const scrollToOwn = group.scrollTo as (this: HTMLElement, ...args: unknown[]) => void;
  /* 1 where later slides lie to the right and scroll positions grow; -1 right-to-left, where
   * they lie to the left and scroll positions run down from 0 */
  const way = () => (getComputedStyle(group).direction === "rtl" ? -1 : 1);
  const slides = () => [...group.children] as HTMLElement[];

  /* ── where things are ─────────────────────────────────────── */
  /* each slide's own place in the scroller's content (px from the scroller's left edge at scroll
   * 0), measured with no effect applied: an effect moves a slide, and must not move its own ruler */
  let places: { left: number; width: number; snaps: boolean }[] = [];
  /* endless: how far along the strip each slide is drawn from its own place (px), the length of
   * one turn of the strip (from the first slide round to the first again), and of the slides alone */
  const moved = new WeakMap<HTMLElement, number>();
  let cycle = 0;
  let span = 0;
  const measure = () => {
    const all = slides();
    for (const slide of all) clear(slide);
    const box = group.getBoundingClientRect(), dir = way();
    places = all.map((slide) => {
      const rect = slide.getBoundingClientRect();
      return { left: rect.left - box.left + group.scrollLeft - dir * (moved.get(slide) ?? 0), width: rect.width, snaps: getComputedStyle(slide).scrollSnapAlign !== "none" };
    });
    const first = places[0], second = places[1], last = places[places.length - 1];
    span = first && last ? Math.abs(last.left - first.left) + last.width : 0;
    cycle = first && second && last ? Math.abs(last.left - first.left) + Math.abs(second.left - first.left) : 0;
  };
  /* the strip is endless when the carousel asks for it and there is more of it than the scroller shows */
  const endless = () => options.loop() === "endless" && cycle > 0 && span > group.clientWidth + 1;
  /* a slide's own distance along the strip from the first one's start, in the reading direction */
  const along = (place: { left: number; width: number }) => (way() > 0 ? place.left : group.clientWidth - place.left - place.width);
  /* where each page starts, as scroll positions in page order (right-to-left they run down from
   * 0). The last page is held at the end of the slides, except on an endless strip: there the
   * first slide follows the last */
  const starts = (): number[] => {
    const width = group.clientWidth, reach = group.scrollWidth - width, dir = way(), free = endless();
    const out: number[] = [];
    for (const place of places) {
      if (!place.snaps) continue;
      const own = dir * along(place);
      const start = free ? own : dir < 0 ? Math.max(-reach, Math.min(0, own)) : Math.min(reach, Math.max(0, own));
      if (!out.some((other) => Math.abs(other - start) < 0.5)) out.push(start);
    }
    return out.sort((a, b) => Math.abs(a) - Math.abs(b));
  };
  /* every scroll position the slides can rest on, in order along the strip, with its page. On an
   * endless strip each page comes round once a turn */
  type Stop = { at: number; page: number };
  const stops = (): Stop[] => {
    const pages = starts().map((at, page) => ({ at, page }));
    if (!endless()) return pages;
    const turn = way() * cycle;
    return Array.from({ length: TURNS }, (_, n) => pages.map((stop) => ({ at: stop.at + n * turn, page: stop.page }))).flat();
  };
  const nearest = (list: Stop[], at: number) => list.reduce<Stop | undefined>((a, b) => (!a || Math.abs(b.at - at) < Math.abs(a.at - at) ? b : a), undefined);
  const pageOf = (at: number) => {
    const stop = nearest(stops(), at);
    return stop && Math.abs(stop.at - at) < 0.5 ? stop.page : -1;
  };
  /* where a page rests: at its start; on an endless strip, at its start one turn in */
  const home = (page: number) => {
    const start = starts()[page];
    return start === undefined || !endless() ? start : start + way() * cycle;
  };
  /* Endless: each slide is drawn on the turn of the strip nearest the scroller, its own place or
   * a whole number of turns further on, so the slides in view have their neighbours on either
   * side and the strip never ends. Otherwise every slide is on its own place. Done before the
   * scroller is moved to `at`: a slide drawn further on is what makes that position reachable */
  const arrange = (at: number) => {
    const on = endless(), width = group.clientWidth, far = Math.abs(at);
    /* the strip is as long as all its turns from the start, whichever slides are drawn where: a
     * scroll the browser is animating must not find the scrollable width changing under it */
    const strip = on ? `${TURNS * cycle}px` : "";
    if (group.style.getPropertyValue("--fndn-carousel-strip") !== strip) {
      if (strip) group.style.setProperty("--fndn-carousel-strip", strip);
      else group.style.removeProperty("--fndn-carousel-strip");
    }
    slides().forEach((slide, index) => {
      const place = places[index];
      const turns = on && place ? Math.max(0, Math.min(TURNS - 1, Math.round((far + width / 2 - along(place) - place.width / 2) / cycle))) : 0;
      const px = turns * cycle;
      if ((moved.get(slide) ?? 0) === px) return;
      moved.set(slide, px);
      if (px) slide.style.setProperty("--fndn-carousel-round", `${px}px`);
      else slide.style.removeProperty("--fndn-carousel-round");
    });
  };

  /* ── the effects ──────────────────────────────────────────── */
  const VARS = ["--fndn-carousel-out", "--fndn-carousel-lag", "--fndn-carousel-shift", "--fndn-carousel-show"];
  const clear = (slide: HTMLElement) => {
    if (!slide.hasAttribute("data-moving")) return;
    slide.removeAttribute("data-moving");
    for (const name of VARS) slide.style.removeProperty(name);
  };
  const paint = () => {
    const effect = options.effect();
    const all = slides();
    if (places.length !== all.length) measure();
    if (sync()) return;
    const width = group.clientWidth, at = group.scrollLeft, dir = way();
    arrange(at);
    /* from one slide's place to the next: its width and the space between two */
    const pitch = places.length > 1 ? Math.abs(places[1]!.left - places[0]!.left) || width : width;
    all.forEach((slide, index) => {
      const place = places[index]!;
      const left = place.left + dir * (moved.get(slide) ?? 0) - at; /* its left edge from the scroller's left edge */
      const seen = Math.max(0, Math.min(left + place.width, width) - Math.max(left, 0)) / (place.width || 1);
      const out = 1 - Math.min(1, seen);
      /* in pages, from its place on the scroller's start edge; later slides are positive */
      const pages = (dir < 0 ? width - (left + place.width) : left) / (pitch || 1);
      /* (a slide a whole page away is not crossing: its distance can come out a hair under one) */
      const crossing = effect === "fade" ? Math.abs(pages) < 0.9995 && Math.abs(pages) > 0.0005 : out > 0.0005 && out < 0.9995;
      if (effect === "slide" || effect === "none" || !crossing) return clear(slide);
      slide.setAttribute("data-moving", "");
      slide.style.setProperty("--fndn-carousel-out", out.toFixed(4));
      slide.style.setProperty("--fndn-carousel-lag", (left < 0 ? -out : out).toFixed(4));
      slide.style.setProperty("--fndn-carousel-shift", `${(-left).toFixed(2)}px`);
      slide.style.setProperty("--fndn-carousel-show", (pages > 0 ? 1 - pages : 1).toFixed(4));
    });
  };

  /* ── the animator ─────────────────────────────────────────── */
  let spring: { to: number; off: number; drift: number; began: number } | undefined;
  let frame = 0;
  let wrote: number | undefined;
  /* the last thing done to this carousel was a key pressed in it. Heard on the window as the key
   * goes down, where the engine listens too and, having started later, hears it after this: so
   * the very first key after the pointer is instant too */
  const root = group.closest<HTMLElement>("[data-slot=carousel]") ?? group;
  let byKey = false;
  const keyed = (event: KeyboardEvent) => { if (root.contains(event.target as Node | null)) byKey = true; };
  /* the pager's Previous or Next was pressed a moment ago: which way round an endless strip goes */
  let heading: { way: 1 | -1; until: number } | undefined;
  const headed = (event: Event) => {
    const side = (event.target as Element | null)?.closest?.("[data-pager]")?.getAttribute("data-pager");
    if (side === "next" || side === "prev") heading = { way: side === "next" ? 1 : -1, until: performance.now() + 400 };
  };
  const pointed = () => { byKey = false; heading = undefined; };
  /* with no effect at all (`none`) a page change is never shown travelling */
  const still = () => options.effect() === "none";
  const quiet = () => reducedMotion() || still() || (byKey && !options.automatic());
  const rest = () => {
    cancelAnimationFrame(frame);
    spring = undefined;
    wrote = undefined;
    group.removeAttribute("data-settling");
  };
  /* Put the slides on a position and end there. Snapping comes back last, once the effects are
   * drawn for that position: the browser snaps to where the slides are drawn, and a slide still
   * held a fraction off its place would pull the scroller off its page. On an endless strip they
   * end on the same page one turn in, where a turn of slides lies either way; nothing is seen to
   * change, the slides being drawn on the turn nearest the scroller */
  const land = (to: number) => {
    cancelAnimationFrame(frame);
    spring = undefined;
    wrote = undefined;
    const stop = endless() ? nearest(stops(), to) : undefined;
    const at = (stop ? home(stop.page) : undefined) ?? to;
    group.setAttribute("data-settling", "");
    arrange(at);
    scrollToOwn.call(group, { left: at, behavior: "instant" });
    paint();
    group.removeAttribute("data-settling");
  };
  /* The strip has become endless or stopped being (the prop changed, or a resize left a single
   * page): every slide goes on the right turn and the slides back on their page, by the new rule.
   * True when it did so */
  let wasEndless = false;
  const sync = (): boolean => {
    if (endless() === wasEndless) return false;
    wasEndless = !wasEndless;
    if (!wasEndless) arrange(0);
    land(home(options.page()) ?? 0);
    return true;
  };
  /* Endless, before the slides set off: the same place one turn in (a whole number of turns
   * away, so nothing is seen to change). No travel is longer than a turn, and from there a turn
   * of slides lies either way */
  const centre = () => {
    if (!endless()) return;
    const at = group.scrollLeft, turn = way() * cycle;
    /* (a resting place can lie a fraction short of its whole turn: a scroll position is a whole
     * number of device pixels) */
    const off = Math.floor((Math.abs(at) + 2) / cycle) - 1;
    if (!off) return;
    const settling = group.hasAttribute("data-settling");
    group.setAttribute("data-settling", "");
    arrange(at - off * turn);
    scrollToOwn.call(group, { left: at - off * turn, behavior: "instant" });
    if (spring) spring.to -= off * turn;
    if (wrote !== undefined) wrote = group.scrollLeft;
    paint();
    if (!settling) group.removeAttribute("data-settling");
  };
  /* The scroll position to go to for a page. On an endless strip the page comes round once a
   * turn: the nearest of them, or the next one the way that was asked for (the pager's Previous
   * and Next, the slides advancing by themselves), so Next on the last page goes on to the first
   * and never back through the others */
  const route = (page: number) => {
    const start = starts()[page];
    if (start === undefined || !endless()) return start;
    const from = Math.abs(spring ? spring.to : group.scrollLeft), own = Math.abs(start);
    const asked = options.automatic() ? 1 : heading && performance.now() < heading.until ? heading.way : 0;
    const turns = asked > 0 ? Math.ceil((from + 1 - own) / cycle) : asked < 0 ? Math.floor((from - 1 - own) / cycle) : Math.round((from - own) / cycle);
    return way() * (own + Math.max(0, turns) * cycle);
  };
  const speedNow = () => {
    if (!spring) return 0;
    const time = performance.now() - spring.began;
    return (spring.drift - RATE * (spring.off + spring.drift * time)) * Math.exp(-RATE * time);
  };
  /* off(t) = (off + drift * t) * e^(-RATE * t): critically damped. A drift that would carry it past
   * the page is dropped: it then closes in from its own side */
  const glide = (to: number, speed = speedNow()) => {
    if (quiet()) return land(to);
    cancelAnimationFrame(frame);
    const off = group.scrollLeft - to;
    let drift = speed + RATE * off;
    if (drift * off < 0) drift = 0;
    spring = { to, off, drift, began: performance.now() };
    wrote = undefined;
    group.setAttribute("data-settling", "");
    frame = requestAnimationFrame(step);
  };
  const step = (now: number) => {
    if (!spring) return;
    /* something else has scrolled the slides since the last frame (a wheel, a finger): theirs now */
    if (wrote !== undefined && Math.abs(group.scrollLeft - wrote) > 1) {
      rest();
      return paint();
    }
    const time = Math.max(0, now - spring.began);
    const left = (spring.off + spring.drift * time) * Math.exp(-RATE * time);
    if (time > 0 && Math.abs(left) < 0.4) return land(spring.to);
    arrange(spring.to + left);
    group.scrollLeft = spring.to + left;
    wrote = group.scrollLeft;
    paint();
    frame = requestAnimationFrame(step);
  };
  /* Every scroll the engine asks for comes here. Whether it travels is decided here, not by the
   * behaviour the engine passes (that is the flag of the last event it handled, so a page set
   * from outside can arrive marked instant): a scroll to a new page travels; one that only puts
   * the slides back on the page they are on (after a resize, at first paint) is instant. Where
   * to is decided here too, by this file's own ruler (taken with no effect applied; the engine
   * measures the slides as they are drawn, effects included). */
  let pageSeen = options.page();
  const wrapped = function (this: HTMLElement, a?: ScrollToOptions | number) {
    const asked = typeof a === "number" ? a : a?.left;
    if (asked === undefined) return scrollToOwn.call(this, a);
    const turned = options.page() !== pageSeen;
    pageSeen = options.page();
    if (!turned) {
      /* already on its way to this page (a drag let go a moment ago): it keeps its speed */
      if (spring && nearest(stops(), spring.to)?.page === pageSeen) return;
      measure();
      if (sync()) return;
      return land(starts()[pageSeen] ?? asked);
    }
    if (places.length !== group.children.length) measure();
    sync();
    centre();
    const to = route(pageSeen) ?? asked;
    heading = undefined;
    if (spring && Math.abs(spring.to - to) < 1) return;
    glide(to);
  };
  group.scrollTo = wrapped as typeof group.scrollTo;

  /* ── a drag ───────────────────────────────────────────────── */
  /* where nothing travels (fade, none) the scroller does not scroll by itself and a drag is a swipe */
  const swipes = () => options.effect() === "fade" || options.effect() === "none";
  let held: { id: number; mouse: boolean; x: number; from: number; low: number; high: number; swipe: boolean; moved: boolean; moves: [number, number][] } | undefined;
  const press = (event: PointerEvent) => {
    if (event.button !== 0 || held) return;
    /* a mouse where the carousel lets it; a finger only where the scroller does not scroll by itself */
    if (event.pointerType === "mouse" ? !options.drag() : !swipes()) return;
    /* a control inside a slide keeps its press */
    const control = (event.target as Element | null)?.closest("a, button, input, select, textarea, [contenteditable], [tabindex]");
    if (control && control !== group && group.contains(control)) return;
    if (places.length !== group.children.length) measure();
    sync();
    /* where nothing travels (fade) the drag is a swipe to the page before or after this one;
     * elsewhere the slides follow the pointer, as far as those two pages unless the reach is free */
    const swipe = swipes();
    /* caught while settling: the slides are the pointer's again, from where they are */
    if (!swipe) rest();
    centre();
    const from = group.scrollLeft;
    const pages = stops().map((stop) => stop.at);
    const near = swipe || options.reach() === "page";
    const here = pages.reduce((a, b) => (Math.abs(b - from) < Math.abs(a - from) ? b : a), pages[0] ?? from);
    const low = near ? Math.max(-Infinity, ...pages.filter((start) => start < here - 0.5)) : -Infinity;
    const high = near ? Math.min(Infinity, ...pages.filter((start) => start > here + 0.5)) : Infinity;
    held = { id: event.pointerId, mouse: event.pointerType === "mouse", x: event.clientX, from, low, high, swipe, moved: false, moves: [[event.timeStamp, event.clientX]] };
  };
  const drag = (event: PointerEvent) => {
    if (!held || event.pointerId !== held.id) return;
    const by = event.clientX - held.x;
    if (held.swipe) {
      if (held.moved || Math.abs(by) < SWIPE) return;
      held.moved = true;
      group.setPointerCapture?.(held.id);
      /* the slides would scroll the opposite way to the pointer: that page, if there is one;
       * where the slides run back (rewind), the one at the other end */
      const all = starts();
      const round = options.loop() === "rewind" && all.length > 1 ? (by < 0 ? Math.min(...all) : Math.max(...all)) : NaN;
      const to = Number.isFinite(by < 0 ? held.high : held.low) ? (by < 0 ? held.high : held.low) : round;
      if (!Number.isFinite(to)) return;
      options.turn(pageOf(to));
      return glide(to, 0);
    }
    if (!held.moved) {
      if (Math.abs(by) < SLOP) return;
      held.moved = true;
      group.setAttribute("data-dragging", "");
      group.setPointerCapture?.(held.id);
    }
    held.moves.push([event.timeStamp, event.clientX]);
    if (held.moves.length > 32) held.moves.shift();
    /* the slides scroll the opposite way to the pointer */
    /* (an end with no page beyond it is the scroller's own end: the browser holds the slides there) */
    const to = Math.max(held.low, Math.min(held.high, held.from - by));
    arrange(to);
    group.scrollLeft = to;
    paint();
  };
  const release = (event: PointerEvent) => {
    if (!held || event.pointerId !== held.id) return;
    const { moved: dragged, moves, swipe, low, high } = held;
    /* where the pointer would have put the slides, had they been free to go there */
    const wanted = held.from - (event.clientX - held.x);
    held = undefined;
    if (!dragged) return;
    /* the click that ends a drag is not a click on what is under the pointer */
    const swallow = (click: Event) => { click.stopPropagation(); click.preventDefault(); };
    group.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => group.removeEventListener("click", swallow, true), 0);
    if (swipe) return;
    /* (data-dragging stays until the animator has taken over: snapping must not come back between
     * the two, or the browser puts the slides on a page at once) */
    const handOver = () => group.removeAttribute("data-dragging");
    const at = group.scrollLeft;
    const recent = moves.filter(([time]) => event.timeStamp - time <= FLICK_WINDOW);
    const first = recent[0], last = recent[recent.length - 1];
    const speed = event.type !== "pointercancel" && first && last && last[0] > first[0] ? -(last[1] - first[1]) / (last[0] - first[0]) : 0;
    const every = stops().map((stop) => stop.at);
    /* the pages this drag could reach */
    const pages = every.filter((start) => start >= low - 0.5 && start <= high + 0.5);
    if (!pages.length) return handOver();
    const closest = pages.reduce((a, b) => (Math.abs(b - at) < Math.abs(a - at) ? b : a));
    const ordered = [...pages].sort((a, b) => a - b);
    const thrown = Math.abs(speed) >= FLICK_SPEED
      ? (speed > 0 ? ordered.find((start) => start > at + 1) : ordered.reverse().find((start) => start < at - 1))
      : undefined;
    /* at an end, pulled or thrown further: where the slides run back (rewind), round to the other
     * end. (An endless strip has no end: the page beyond is simply the next stop.) */
    const lowest = Math.min(...every), highest = Math.max(...every);
    const past = Math.abs(speed) >= FLICK_SPEED ? Math.sign(speed) : wanted > highest + SWIPE ? 1 : wanted < lowest - SWIPE ? -1 : 0;
    const round = options.loop() === "rewind" && every.length > 1 && thrown === undefined
      ? (past > 0 && Math.abs(at - highest) < 1 ? lowest : past < 0 && Math.abs(at - lowest) < 1 ? highest : undefined)
      : undefined;
    const to = round ?? thrown ?? closest;
    options.turn(pageOf(to));
    glide(to, speed);
    handOver();
  };
  /* A mouse that drags the slides does not select their text or pull a picture out of them. The
   * press itself is left to the browser: it gives the scroller the focus, and the engine pages
   * on the arrow keys while the focus is there. */
  const noSelect = (event: Event) => {
    if (held?.mouse) event.preventDefault();
  };

  /* The engine pages on these keys while the focus is in the scroller, but only once it has seen
   * the focus arrive, and it misses one that arrives while the slides advance by themselves. A
   * key it left alone would have the browser scroll the slides by itself (its own smooth scroll,
   * and no page told): the page is turned here instead, the way the engine turns it. */
  const paged = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.target !== group || event.altKey || event.ctrlKey || event.metaKey) return;
    const count = starts().length, at = options.page();
    const to = event.key === "ArrowRight" ? at + 1 : event.key === "ArrowLeft" ? at - 1 : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : NaN;
    if (Number.isNaN(to) || !count) return;
    event.preventDefault();
    options.turn(options.loop() !== "none" ? (to + count) % count : Math.max(0, Math.min(count - 1, to)));
  };

  /* ── wiring ───────────────────────────────────────────────── */
  let painting = 0;
  let resting = 0;
  /* The slides have come to rest where something else scrolled them: a wheel, a finger, or the
   * browser by itself (to a control that took the focus in another slide, to a match of its
   * find-in-page). The page is where the slides are, so the adapter is told. (On an endless
   * strip they are first put on that page's own resting place, a whole number of turns away.) */
  const rested = () => {
    if (spring || held) return;
    const stop = nearest(stops(), group.scrollLeft);
    if (!stop || Math.abs(stop.at - group.scrollLeft) >= 2) return;
    if (endless() && Math.abs((home(stop.page) ?? stop.at) - stop.at) >= 2) land(stop.at);
    options.turn(stop.page);
  };
  const scrolled = () => {
    if (spring || held?.moved) return; /* those paint as they write, and tell the page themselves */
    clearTimeout(resting);
    resting = window.setTimeout(rested, REST);
    cancelAnimationFrame(painting);
    painting = requestAnimationFrame(paint);
  };
  /* a new size: the places are measured again and the slides put back on their page */
  const resized = new ResizeObserver(() => {
    measure();
    if (sync()) return;
    if (endless()) land(starts()[options.page()] ?? 0);
    else paint();
  });
  resized.observe(group);
  group.addEventListener("pointerdown", press);
  group.addEventListener("selectstart", noSelect);
  group.addEventListener("dragstart", noSelect);
  group.addEventListener("pointermove", drag);
  group.addEventListener("pointerup", release);
  group.addEventListener("pointercancel", release);
  group.addEventListener("scroll", scrolled, { passive: true });
  group.addEventListener("keydown", paged);
  root.addEventListener("click", headed, true);
  window.addEventListener("keydown", keyed, true);
  document.addEventListener("pointerdown", pointed, true);
  document.addEventListener("wheel", pointed, { capture: true, passive: true });
  measure();
  paint();
  return () => {
    rest();
    cancelAnimationFrame(painting);
    clearTimeout(resting);
    resized.disconnect();
    group.removeEventListener("pointerdown", press);
    group.removeEventListener("selectstart", noSelect);
    group.removeEventListener("dragstart", noSelect);
    group.removeEventListener("pointermove", drag);
    group.removeEventListener("pointerup", release);
    group.removeEventListener("pointercancel", release);
    group.removeEventListener("scroll", scrolled);
    group.removeEventListener("keydown", paged);
    root.removeEventListener("click", headed, true);
    window.removeEventListener("keydown", keyed, true);
    document.removeEventListener("pointerdown", pointed, true);
    document.removeEventListener("wheel", pointed, true);
    group.removeAttribute("data-dragging");
    /* every slide back on its own place, and the slides on their page there */
    const natural = wasEndless ? way() * along(places.filter((place) => place.snaps)[options.page()] ?? { left: 0, width: group.clientWidth }) : undefined;
    for (const slide of slides()) {
      clear(slide);
      slide.style.removeProperty("--fndn-carousel-round");
      moved.delete(slide);
    }
    group.style.removeProperty("--fndn-carousel-strip");
    if (natural !== undefined) scrollToOwn.call(group, { left: natural, behavior: "instant" });
    if (group.scrollTo === wrapped) delete (group as { scrollTo?: unknown }).scrollTo;
  };
}

/** The user prefers reduced motion. */
export function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Slides that advance by themselves (the autoplay prop).
 *
 * The engine advances them (`autoplay: { delay }` on the root: a timer that turns to the next page
 * every `delay` ms, wrapping at the end, and starts over from a full `delay` whenever it is started
 * again) and stops when the page is hidden or the user pages by hand. It does not pause for someone
 * reading, so the adapter runs it only while nothing holds it, and this says what does: the
 * pointer over the carousel, focus inside it, the page hidden, the carousel off screen. `onHeld`
 * is called with the new answer whenever it changes.
 *
 * `release()` is for the Play button: pressing it asks for the slides to move now, so it lets go of
 * the pointer and the focus that pressed it (they hold again when they next come in).
 * Returns { stop, release }. */
export function holdAutoplay(root: HTMLElement | null, onHeld: (held: boolean) => void): { stop: () => void; release: () => void } {
  if (!root) return { stop: () => {}, release: () => {} };
  let pointer = false, focus = false, hidden = document.visibilityState === "hidden", away = false;
  let last: boolean | undefined;
  const tell = () => {
    const held = pointer || focus || hidden || away;
    if (held !== last) onHeld((last = held));
  };
  const enter = () => { pointer = true; tell(); };
  const leave = () => { pointer = false; tell(); };
  const focusIn = (event: FocusEvent) => {
    if (root.contains(event.relatedTarget as Node | null)) return;
    focus = true; tell();
  };
  const focusOut = (event: FocusEvent) => {
    if (root.contains(event.relatedTarget as Node | null)) return;
    focus = false; tell();
  };
  const visibility = () => { hidden = document.visibilityState === "hidden"; tell(); };
  const observer = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(([entry]) => { away = !entry?.isIntersecting; tell(); })
    : null;
  root.addEventListener("pointerenter", enter);
  root.addEventListener("pointerleave", leave);
  root.addEventListener("focusin", focusIn);
  root.addEventListener("focusout", focusOut);
  document.addEventListener("visibilitychange", visibility);
  observer?.observe(root);
  focus = root.contains(document.activeElement);
  pointer = root.matches(":hover");
  tell();
  return {
    stop() {
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("focusin", focusIn);
      root.removeEventListener("focusout", focusOut);
      document.removeEventListener("visibilitychange", visibility);
      observer?.disconnect();
    },
    release() { pointer = false; focus = false; tell(); },
  };
}

/* The current dot's fill shows the engine's timer, which starts over from a full delay whenever
 * the slides start advancing again. A paused CSS animation would resume where it stopped, so the
 * adapter calls this when they start: the fill goes back to empty. */
export function restartProgress(root: HTMLElement | null): void {
  if (!root || typeof root.getAnimations !== "function") return;
  for (const animation of root.getAnimations({ subtree: true })) {
    if ((animation as CSSAnimation).animationName === "fndn-carousel-progress") animation.currentTime = 0;
  }
}
