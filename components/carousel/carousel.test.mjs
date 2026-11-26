// Carousel: Ark's carousel (a region of slides named "n of count", out-of-view slides hidden from
// assistive technology), native scroll snapping that never holds the page's vertical scroll, the
// real Pager below (smooth from the pointer, instant from the keyboard and under reduced motion),
// a mouse drag that follows 1:1 then snaps (a flick turns the page), the arrow keys on the slides
// (after a click too; the page follows slides the browser scrolls by itself), the dots, several per page, loop
// (rewind, and the endless strip: Next on the last page goes on to the first), worst cases,
// right-to-left, dark; the scroll-driven effects (depth, fade, parallax: half a page, at rest,
// reduced motion) and autoplay (advances, wraps, holds on hover and focus, stops after a page
// turned by hand, the pause / play button, the dot's fill, nothing under reduced motion).
//   node components/carousel/carousel.test.mjs [react …]   (default: the spec's targets)
const C = "carousel";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`!window.__stale && location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=carousel]")`).catch(() => false)) break; await sleep(100); } await sleep(400); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; await q("window.__stale = true").catch(() => {}); const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const S = (part) => `#stage [data-slot=${part}]`;
const GROUP = S("carousel-item-group");
const PAGER = "#stage [data-carousel=pager]";
const pos = () => q(`(document.querySelector(${JSON.stringify(PAGER + " [data-slot=pager-position]")})?.textContent ?? "").replace(/^Slide |^Page /,"").trim()`);
const scroll = () => q(`Math.round(document.querySelector(${JSON.stringify(GROUP)}).scrollLeft)`);
const hiddenSlides = () => q(`[...document.querySelectorAll(${JSON.stringify(S("carousel-item"))})].map((e)=>e.getAttribute("aria-hidden")==="true")`);
/* record scrollLeft every frame for `ms`, starting now */
const track = (ms) => q(`new Promise((res)=>{const g=document.querySelector(${JSON.stringify(GROUP)});const out=[];const t0=performance.now();const f=()=>{out.push(Math.round(g.scrollLeft));if(performance.now()-t0<${ms})requestAnimationFrame(f);else res(out)};requestAnimationFrame(f)})`);

async function run(fw, check) {
  await open(fw, 0);
  check("root: a region with aria-roledescription carousel; slides are groups named \"n of 5\"",
    await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("carousel"))});const s=[...r.querySelectorAll("[data-slot=carousel-item]")];return [r.getAttribute("role"),r.getAttribute("aria-roledescription"),s.length,s[0].getAttribute("role"),s[0].getAttribute("aria-roledescription"),s[1].getAttribute("aria-label")]})()`),
    ["region", "carousel", 5, "group", "slide", "2 of 5"]);
  check("only the slide in view is exposed (the others aria-hidden)", await hiddenSlides(), [false, true, true, true, true]);
  check("scroller: snaps on x (mandatory), keeps only sideways overscroll in, never scrolls vertically, lets the page pan vertically",
    await q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(GROUP)}));return [cs.scrollSnapType,cs.overscrollBehaviorX,cs.overscrollBehaviorY,cs.overflowY,cs.touchAction]})()`),
    ["x mandatory", "contain", "auto", "hidden", "auto"]);
  const slide = await p.rect(S("carousel-item"));
  check("text slide: as wide as the carousel (360), 160 high, on the inset colour", [slide.w, slide.h, await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("carousel-item"))})).backgroundColor`)], [360, 160, await token("--fndn-inset")]);
  /* the scroller clips what is outside a slide: an outer ring showed only at the corners */
  check("text slide: its hairline is drawn inside it (an inset ring in the line colour)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("carousel-item"))})).boxShadow.includes("0px 0px 0px 1px inset")`), true);
  check("scroller: the slides' radius (its focus ring follows their corners); the grab cursor for a mouse that can drag", await q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(GROUP)}));return [cs.borderRadius,cs.cursor]})()`), [await token("--fndn-radius-card", "borderTopLeftRadius"), "grab"]);
  check("the pager below: data-carousel=pager, \"1 of 5\", previous disabled at the start", [await pos(), await q(`document.querySelector(${JSON.stringify(PAGER + " [data-pager=prev]")}).getAttribute("aria-disabled")`)], ["1 of 5", "true"]);
  check("the pager's two buttons control the slide group (aria-controls)", await q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)});return [...document.querySelectorAll(${JSON.stringify(`${PAGER} [data-pager]`)})].map((b)=>!!g.id&&b.getAttribute("aria-controls")===g.id)})()`), [true, true]);
  const pr = await p.rect(PAGER), cr = await p.rect(S("carousel"));
  check("the pager sits at the end of the row, 12px under the slides", [Math.abs(pr.x + pr.w - (cr.x + cr.w)) <= 1, Math.round(pr.y - (slide.y + slide.h))], [true, 12]);

  /* pointer: the browser's smooth scroll */
  const next = await p.rect(PAGER + " [data-pager=next]");
  await p.click(next.cx, next.cy);
  const frames = await track(700);
  check("pointer: Next scrolls smoothly (intermediate positions), lands on the snap point 372", [frames.some((x) => x > 5 && x < 367), frames.at(-1)], [true, 372]);
  check("page 2: \"2 of 5\", slide 2 exposed, slide 1 hidden", [await pos(), (await hiddenSlides()).slice(0, 2)], ["2 of 5", [true, false]]);

  /* keyboard: instant */
  await open(fw, 0);
  await p.click(5, 5);
  await q(`document.querySelector(${JSON.stringify(PAGER + " [data-pager=next]")}).focus()`);
  await p.key("Tab", { shift: true }); await p.key("Tab");
  check("Tab reaches the Next button", await q(`document.activeElement?.dataset.pager`), "next");
  await p.key("Enter");
  const kf = await track(120);
  check("keyboard: Enter on Next changes the page at once (no smooth scroll)", [kf.every((x) => x === 372 || x === 0) && kf.at(-1) === 372], [true]);
  await sleep(300);
  check("keyboard: \"2 of 5\"", await pos(), "2 of 5");
  await p.key("ArrowRight"); await sleep(50);
  check("Arrow Right on the pager: page 3 at once", [await scroll(), (await track(60)).every((x) => x === 744)], [744, true]);

  /* reduced motion: pointer paging is instant too */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 0);
  const n2 = await p.rect(PAGER + " [data-pager=next]");
  await p.click(n2.cx, n2.cy);
  const rf = await track(120);
  check("reduced motion: a pointer Next is instant as well", rf.every((x) => x === 0 || x === 372) && rf.at(-1) === 372, true);
  await p.media([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* mouse drag: 1:1, then the snap */
  await open(fw, 0);
  const s0 = await p.rect(S("carousel-item"));
  await q(`(()=>{window.__drag=[];const g=document.querySelector(${JSON.stringify(GROUP)});document.addEventListener("pointermove",(e)=>{if(e.buttons)window.__drag.push([e.clientX,g.scrollLeft])},{capture:true})})()`);
  await p.drag(s0.cx + 100, s0.cy, s0.cx - 100, s0.cy, { steps: 10 }); await sleep(900);
  const drag = await q(`window.__drag`);
  const moved = drag.length > 2 ? Math.abs((drag.at(-1)[1] - drag[1][1]) - (drag[1][0] - drag.at(-1)[0])) : 999;
  check("mouse drag: the slides follow the pointer 1:1 (±4px)", moved <= 4, true);
  check("mouse drag of 200px: snaps to page 2 after release", [await scroll(), await pos()], [372, "2 of 5"]);
  /* a flick turns the page however short the drag; a drag that has stopped before the release
   * settles on the nearest page */
  const mouse = (type, x, buttons = 1) => p.send("Input.dispatchMouseEvent", { type, x, y: s0.cy, button: "left", buttons, clickCount: 1 });
  await mouse("mouseMoved", s0.cx + 30, 0); await mouse("mousePressed", s0.cx + 30);
  for (const dx of [10, -10, -30]) { await mouse("mouseMoved", s0.cx + dx); await sleep(12); }
  await mouse("mouseReleased", s0.cx - 30, 0); await sleep(900);
  check("a 60px flick goes on to the next page", [await scroll(), await pos()], [744, "3 of 5"]);
  await mouse("mouseMoved", s0.cx + 50, 0); await mouse("mousePressed", s0.cx + 50);
  for (const dx of [30, 10, -10, -30, -50]) { await mouse("mouseMoved", s0.cx + dx); await sleep(30); }
  await sleep(250);
  await mouse("mouseReleased", s0.cx - 50, 0); await sleep(900);
  check("a 100px drag that has stopped before the release returns to its page", [await scroll(), await pos()], [744, "3 of 5"]);
  await mouse("mouseMoved", s0.cx - 20, 0); await mouse("mousePressed", s0.cx - 20);
  for (const dx of [0, 20, 40]) { await mouse("mouseMoved", s0.cx + dx); await sleep(12); }
  await mouse("mouseReleased", s0.cx + 40, 0); await sleep(900);
  check("a flick the other way goes back a page", [await scroll(), await pos()], [372, "2 of 5"]);
  /* how a release settles: recorded every frame in the page. The slides go on from where they were
   * let go, never back first, with snapping off until they are there; the pager says the page at
   * once, not when the slides arrive */
  await q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)});window.__frames=[];window.__rec=true;const tick=()=>{if(!window.__rec)return;window.__frames.push([g.scrollLeft,g.hasAttribute("data-settling")||g.hasAttribute("data-dragging"),getComputedStyle(g).scrollSnapType,(document.querySelector(${JSON.stringify(PAGER + " [data-slot=pager-position]")})?.textContent ?? "").replace(/^Slide |^Page /,"").trim()]);requestAnimationFrame(tick)};tick()})()`);
  await mouse("mouseMoved", s0.cx + 30, 0); await mouse("mousePressed", s0.cx + 30);
  for (const dx of [10, -10, -30]) { await mouse("mouseMoved", s0.cx + dx); await sleep(12); }
  await mouse("mouseReleased", s0.cx - 30, 0); await sleep(700);
  const glide = await q(`(()=>{window.__rec=false;return window.__frames})()`);
  const gliding = glide.filter((f, i) => i > 0 && f[0] !== glide[i - 1][0]);
  const steps = gliding.map((f, i) => (i ? f[0] - gliding[i - 1][0] : 1)).filter((d) => d !== 0);
  const turnedAt = glide.findIndex((f) => f[3] === "3 of 5"), arrivedAt = glide.findIndex((f) => Math.abs(f[0] - 744) < 0.5);
  check("a release glides: many frames, always forward, snapping off on the way, on the page exactly", [gliding.length > 8, steps.every((d) => d > 0), gliding.slice(0, -1).every((f) => f[1] && f[2] === "none"), glide.at(-1)[0], glide.at(-1)[2] !== "none"], [true, true, true, 744, true]);
  check("the pager names the new page while the slides are still on their way", [turnedAt > 0, turnedAt < arrivedAt - 5], [true, true]);
  /* the pager's page change travels on the same animator (not the browser's smooth scroll) */
  await q(`(()=>{window.__frames=[];window.__rec=true;const g=document.querySelector(${JSON.stringify(GROUP)});const tick=()=>{if(!window.__rec)return;window.__frames.push([g.scrollLeft,g.hasAttribute("data-settling")]);requestAnimationFrame(tick)};tick()})()`);
  { const n = await p.rect(PAGER + " [data-pager=next]"); await p.click(n.cx, n.cy); await sleep(700); }
  const paged = await q(`(()=>{window.__rec=false;return window.__frames})()`);
  const travel = paged.filter((f, i) => i > 0 && f[0] !== paged[i - 1][0]);
  check("Next with the mouse: the slides travel over several frames on the animator, done within about 0.4s", [travel.length > 8, travel.length < 30, travel.every((f, i) => i === travel.length - 1 || f[1]), paged.at(-1)[0]], [true, true, true, 1116]);

  /* loop: a flick past the last page goes round to the first, and one before the first to the
   * last; without loop it stays (example 3 loops, starting on the third of four) */
  { await open(fw, 3);
    const g = await p.rect(GROUP);
    const m = (type, x, buttons = 1) => p.send("Input.dispatchMouseEvent", { type, x, y: g.cy, button: "left", buttons, clickCount: 1 });
    const flick = async (dx) => { const x0 = g.cx - dx / 2; await m("mouseMoved", x0, 0); await m("mousePressed", x0); for (let k = 1; k <= 4; k++) { await m("mouseMoved", x0 + (dx * k) / 4); await sleep(12); } await m("mouseReleased", x0 + dx, 0); await sleep(700); };
    await flick(-120);
    const last = await pos();
    await flick(-120);
    const round = [await scroll(), await pos()];
    await flick(120);
    check("loop: a flick past the last page goes round to the first; a flick back from the first, to the last", [last, round, await pos()], ["4 of 4", [0, "1 of 4"], "4 of 4"]);
    await open(fw, 0);
    await flick(120);
    check("without loop: a flick back from the first page stays there", [await scroll(), await pos()], [0, "1 of 5"]);
  }

  /* dragReach: one drag reaches the neighbouring page at most (page, the default); free goes as
   * far as it is dragged (example 11) */
  { const far = async (ex) => {
      await open(fw, ex);
      const g = await p.rect(GROUP);
      const m = (type, x, buttons = 1) => p.send("Input.dispatchMouseEvent", { type, x, y: g.cy, button: "left", buttons, clickCount: 1 });
      await m("mouseMoved", g.cx + 170, 0); await m("mousePressed", g.cx + 170);
      for (let k = 1; k <= 20; k++) { await m("mouseMoved", g.cx + 170 - k * 35); await sleep(10); }
      await sleep(250);
      const held = await scroll();
      await m("mouseReleased", g.cx - 530, 0); await sleep(700);
      return [held, await scroll(), await pos()];
    };
    check("dragReach page (the default): a 700px drag holds the slides on the next page and ends there", await far(0), [372, 372, "2 of 5"]);
    check("dragReach free: the same drag carries the slides 700px and settles on the nearest page", await far(11), [700, 744, "3 of 5"]);
  }

  /* effect none: no animation. The page changes at once from the pager and from a 40px swipe;
   * the slides are never seen between two pages (example 12) */
  { await open(fw, 12);
    check("effect none: the scroller does not scroll by itself", await q(`getComputedStyle(document.querySelector(${JSON.stringify(GROUP)})).overflowX`), "hidden");
    await q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)});window.__seen=new Set();window.__rec=true;const tick=()=>{if(!window.__rec)return;window.__seen.add(Math.round(g.scrollLeft));requestAnimationFrame(tick)};tick()})()`);
    const n = await p.rect(PAGER + " [data-pager=next]"); await p.click(n.cx, n.cy); await sleep(400);
    const g = await p.rect(GROUP);
    const m = (type, x, buttons = 1) => p.send("Input.dispatchMouseEvent", { type, x, y: g.cy, button: "left", buttons, clickCount: 1 });
    await m("mouseMoved", g.cx + 60, 0); await m("mousePressed", g.cx + 60);
    for (const dx of [40, 20, 0, -20]) { await m("mouseMoved", g.cx + dx); await sleep(30); }
    await m("mouseReleased", g.cx - 20, 0); await sleep(400);
    check("effect none: Next, then a swipe: the slides are only ever on a page (0, 372, 744), and end on the third", [await q(`(()=>{window.__rec=false;return [...window.__seen].sort((a,b)=>a-b)})()`), await pos()], [[0, 372, 744], "3 of 5"]);
  }

  /* dots */
  await open(fw, 1);
  const dots = await q(`[...document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})].map((d)=>{const b=d.getBoundingClientRect();return [Math.round(b.width),Math.round(b.height),d.hasAttribute("data-current"),getComputedStyle(d,"::before").backgroundColor,parseFloat(getComputedStyle(d,"::before").width)]})`);
  check("dots: four 24px buttons, a 6px dot, the first current in ink, the others line-strong",
    dots.map((d) => [d[0], d[1], d[2], d[4]]).concat([[dots[0][3] === await token("--fndn-ink"), dots[1][3] === await token("--fndn-line-strong")]]),
    [[24, 24, true, 6], [24, 24, false, 6], [24, 24, false, 6], [24, 24, false, 6], [true, true]]);
  check("dots are named by the engine", await q(`document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})[2].getAttribute("aria-label")`), "Go to slide 3");
  check("dots: round (their focus ring is), one tab stop: only the current dot is in the tab order", await q(`[...document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})].map((d)=>[d.tabIndex,getComputedStyle(d).borderRadius!=="0px"])`), [[0, true], [-1, true], [-1, true], [-1, true]]);
  await q(`document.querySelector(${JSON.stringify(S("carousel-indicator"))}).focus()`);
  await p.key("ArrowRight"); await sleep(150);
  check("Arrow Right on the current dot: page 2, focus and the tab stop move to the second dot", [await pos(), await q(`(()=>{const d=[...document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})];return [d.indexOf(document.activeElement),d.map((x)=>x.tabIndex)]})()`)], ["2 of 4", [1, [-1, 0, -1, -1]]]);
  await open(fw, 1);
  const d3 = await q(`(()=>{const b=document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})[2].getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await p.click(d3.x, d3.y); await sleep(900);
  check("a click on the third dot: page 3, that dot current", [await pos(), await q(`[...document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})].findIndex((d)=>d.hasAttribute("data-current"))`)], ["3 of 4", 2]);

  /* the arrow keys on the slides: a press gives the scroller the focus, the engine pages */
  await open(fw, 1);
  const sr = await p.rect(GROUP);
  const dotNow = () => q(`[...document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})].findIndex((d)=>d.hasAttribute("data-current"))`);
  await p.click(sr.cx, sr.cy); await sleep(60);
  check("a click on a slide gives the scroller the focus, with no ring (a pointer put it there)", await q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)});return [document.activeElement===g,g.matches(":focus-visible")]})()`), [true, false]);
  await p.key("ArrowRight");
  check("Arrow Right after a click on a slide: page 2 at once, the pager and the dots with it", [await scroll(), await pos(), await dotNow()], [372, "2 of 4", 1]);
  await p.key("End");
  check("End: the last page at once", [await scroll(), await pos(), await dotNow()], [1116, "4 of 4", 3]);
  await p.key("ArrowLeft");
  check("Arrow Left: back one page", [await scroll(), await pos(), await dotNow()], [744, "3 of 4", 2]);
  await p.key("Home");
  check("Home: the first page", [await scroll(), await pos(), await dotNow()], [0, "1 of 4", 0]);
  /* a mouse drag leaves the text of the slides unselected, and the focus on the scroller */
  await p.drag(sr.cx + 80, sr.cy, sr.cx - 80, sr.cy); await sleep(700);
  check("a mouse drag selects no text and leaves the focus on the scroller", [await q(`String(getSelection())`), await q(`document.activeElement===document.querySelector(${JSON.stringify(GROUP)})`), await pos()], ["", true, "2 of 4"]);
  /* slides the browser scrolls by itself: the page follows where they come to rest */
  await open(fw, 1);
  /* (the control is added first: the engine puts the slides back on their page when their content changes) */
  await q(`(()=>{const b=document.createElement("button");b.id="probe";b.textContent="Open";document.querySelectorAll(${JSON.stringify(S("carousel-item"))})[2].append(b)})()`);
  await sleep(300);
  await q(`document.getElementById("probe").focus()`);
  await sleep(500);
  check("a control that takes the focus in another slide: the browser scrolls to it, and the page follows", [await scroll(), await pos(), await dotNow()], [744, "3 of 4", 2]);

  /* several per page, loop, one slide */
  await open(fw, 2);
  check("two per page: 6 slides make 3 pages, two slides in view", [await pos(), (await hiddenSlides()).filter((h) => !h).length], ["1 of 3", 2]);
  await open(fw, 3);
  check("loop, starting on the third: \"3 of 4\", previous enabled", [await pos(), await q(`document.querySelector(${JSON.stringify(PAGER + " [data-pager=prev]")}).getAttribute("aria-disabled")`)], ["3 of 4", null]);
  for (let i = 0; i < 2; i++) { const b = await p.rect(PAGER + " [data-pager=next]"); await p.click(b.cx, b.cy); await sleep(900); }
  check("loop: Next twice from the third wraps to the first", await pos(), "1 of 4");

  /* each slide's left edge from the scroller's, every frame for `ms` (null while out of view) */
  const film = (ms) => q(`new Promise((res)=>{const g=document.querySelector(${JSON.stringify(GROUP)});const out=[];const t0=performance.now();const f=()=>{const b=g.getBoundingClientRect();out.push([...g.children].map((s)=>{const r=s.getBoundingClientRect();return r.right>b.left+1&&r.left<b.right-1?Math.round(r.left-b.left):null}));if(performance.now()-t0<${ms})requestAnimationFrame(f);else res(out)};requestAnimationFrame(f)})`);
  const atStart = () => q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)});const b=g.getBoundingClientRect();return [...g.children].findIndex((s)=>Math.abs(s.getBoundingClientRect().left-b.left)<1.5)})()`);
  const press = async (side) => { const b = await p.rect(`${PAGER} [data-pager=${side}]`); await p.click(b.cx, b.cy); };
  /* the positions a slide is seen at, in order; and whether they only ever go one way */
  const seenAt = (frames, slide) => frames.map((f) => f[slide]).filter((x) => x !== null);
  const only = (xs, sign) => xs.every((x, i) => i === 0 || (x - xs[i - 1]) * sign >= -1);
  /* rewind: from the last page, Next runs the slides back past the others */
  await open(fw, 3);
  await press("next"); await sleep(700);
  await press("next");
  const back = await film(700);
  check("loop rewind: Next on the last page runs back to the first past the slides between", [back.some((f) => f[1] !== null || f[2] !== null), await pos(), await atStart()], [true, "1 of 4", 0]);

  /* an endless strip (example 13: four slides, dots): the first slide follows the last */
  await open(fw, 13);
  check("endless: the first slide in view, \"1 of 4\", previous enabled, no slide copied", [await atStart(), await pos(), await q(`document.querySelector(${JSON.stringify(PAGER + " [data-pager=prev]")}).getAttribute("aria-disabled")`), await q(`document.querySelectorAll(${JSON.stringify(S("carousel-item"))}).length`)], [0, "1 of 4", null, 4]);
  check("endless: only the slide in view is exposed", await hiddenSlides(), [false, true, true, true]);
  await press("prev");
  const before = await film(700);
  check("endless: Previous on the first page brings the last slide in from the start side; the slides between are never seen", [seenAt(before, 3).length > 3, only(seenAt(before, 3), 1), only(seenAt(before, 0), 1), before.every((f) => f[1] === null && f[2] === null), await pos(), await atStart()], [true, true, true, true, "4 of 4", 3]);
  await press("next");
  const after = await film(700);
  check("endless: Next on the last page goes on to the first, the same way, never back past the others", [seenAt(after, 0).length > 3, only(seenAt(after, 0), -1), only(seenAt(after, 3), -1), after.every((f) => f[1] === null && f[2] === null), await pos(), await atStart()], [true, true, true, true, "1 of 4", 0]);
  check("endless at rest: no slide carries an effect, and the dots follow", [await q(`document.querySelectorAll(${JSON.stringify(S("carousel-item") + "[data-moving]")}).length`), await q(`[...document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})].findIndex((d)=>d.hasAttribute("data-current"))`)], [0, 0]);
  /* a drag past either end goes on round */
  const er = await p.rect(GROUP);
  await p.drag(er.cx - 80, er.cy, er.cx + 80, er.cy); await sleep(700);
  check("endless: a drag back from the first page shows the last", [await pos(), await atStart()], ["4 of 4", 3]);
  await p.drag(er.cx + 80, er.cy, er.cx - 80, er.cy); await sleep(700);
  check("endless: a drag on from the last page shows the first", [await pos(), await atStart()], ["1 of 4", 0]);
  /* the keyboard: at once, round either end */
  await q(`document.querySelector(${JSON.stringify(GROUP)}).focus()`);
  await p.key("ArrowLeft");
  check("endless: Arrow Left on the first page is the last, at once", [await pos(), await atStart()], ["4 of 4", 3]);
  await p.key("ArrowRight");
  check("endless: Arrow Right on the last page is the first, at once", [await pos(), await atStart()], ["1 of 4", 0]);
  /* the third dot from the first page: the shorter way round is on, two slides */
  await p.click(5, 5);
  const dot4 = await q(`(()=>{const b=document.querySelectorAll(${JSON.stringify(S("carousel-indicator"))})[3].getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await p.click(dot4.x, dot4.y);
  const short = await film(700);
  check("endless: a dot goes the shorter way round (the fourth from the first: one slide back)", [short.every((f) => f[1] === null && f[2] === null), await pos()], [true, "4 of 4"]);
  /* right-to-left: the same, mirrored */
  await open(fw, 13, "&dir=rtl");
  await press("prev");
  const rb = await film(700);
  check("endless right-to-left: Previous on the first page shows the last; the slides between are never seen", [rb.every((f) => f[1] === null && f[2] === null), await pos()], [true, "4 of 4"]);
  await press("next"); await sleep(700);
  check("endless right-to-left: Next on the last page shows the first", [await pos(), await q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)});const b=g.getBoundingClientRect();return [...g.children].findIndex((s)=>Math.abs(s.getBoundingClientRect().right-b.right)<1.5)})()`)], ["1 of 4", 0]);
  /* two per page (example 14: five slides): the last page is the fifth slide and the first after it */
  await open(fw, 14);
  await press("next"); await sleep(700); await press("next"); await sleep(700);
  check("endless, two per page: the third page shows the fifth slide, then the first", [await pos(), await atStart(), (await hiddenSlides())], ["3 of 3", 4, [false, true, true, true, false]]);
  await press("next"); await sleep(700);
  check("endless, two per page: Next goes on to the first page", [await pos(), await atStart()], ["1 of 3", 0]);
  /* under reduced motion the page changes at once, round the end too */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 13);
  await press("prev"); await sleep(60);
  check("endless under reduced motion: Previous on the first page is the last, at once", [await pos(), await atStart()], ["4 of 4", 3]);
  await p.media([]); await sleep(250);

  await open(fw, 4);
  check("one slide: no control row", await q(`document.querySelector(${JSON.stringify(S("carousel-control"))})`), null);

  /* worst cases */
  for (const [i, name] of [[0, "long text"], [1, "112 slides"], [2, "narrow"], [3, "right-to-left text"], [4, "no slides"], [5, "fade, three per page"], [6, "autoplay, forty slides"], [7, "endless, two long slides"]]) {
    await open(fw, i, "&data=worst");
    check(`worst ${name}: nothing pokes out of the carousel`, await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("carousel"))});const b=r.getBoundingClientRect();return [...r.querySelectorAll("[data-slot=carousel-control] *, [data-slot=carousel-item-group]")].every((e)=>{const x=e.getBoundingClientRect();return x.width===0||(x.right<=b.right+0.5&&x.left>=b.left-0.5)})})()`), true);
  }
  await open(fw, 0, "&data=worst");
  check("worst long text: it wraps inside the slide, nothing cut", await q(`(()=>{const s=document.querySelector(${JSON.stringify(S("carousel-item"))});return [s.getBoundingClientRect().height>=160,s.scrollHeight<=s.clientHeight+1&&s.scrollWidth<=s.clientWidth+1]})()`), [true, true]);
  await open(fw, 7, "&data=worst");
  await press("prev"); await sleep(700); await press("prev"); await sleep(700);
  check("worst endless, two slides: Previous twice goes round to the first again, each slide whole in the scroller", [await pos(), await atStart(), await q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)});const b=g.getBoundingClientRect();return [...g.children].filter((s)=>{const r=s.getBoundingClientRect();return r.right>b.left+1&&r.left<b.right-1}).length})()`)], ["1 of 2", 0, 1]);
  await open(fw, 1, "&data=worst");
  check("worst 112 slides: the dots wrap onto several rows, the pager reads \"1 of 112\"", [await q(`(()=>{const g=document.querySelector(${JSON.stringify(S("carousel-indicator-group"))});return g.getBoundingClientRect().height>24})()`), await pos()], [true, "1 of 112"]);

  /* right-to-left: page 2 lies to the left */
  await open(fw, 0, "&dir=rtl");
  const rn = await p.rect(PAGER + " [data-pager=next]");
  await p.click(rn.cx, rn.cy); await sleep(900);
  check("rtl: Next brings the slide on the left into view", [await pos(), await q(`(()=>{const s=[...document.querySelectorAll(${JSON.stringify(S("carousel-item"))})].map((e)=>e.getBoundingClientRect());const g=document.querySelector(${JSON.stringify(GROUP)}).getBoundingClientRect();return Math.abs(s[1].x-g.x)<1&&s[0].x>g.x})()`)], ["2 of 5", true]);

  /* effects: drawn from where the slides are, so the scroller is put half way (snapping off) and read */
  const at = async (x) => { await q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)});g.style.scrollSnapType="none";g.scrollLeft=${x}})()`); await sleep(150); };
  const looks = (sel = S("carousel-item")) => q(`(()=>{const g=document.querySelector(${JSON.stringify(GROUP)}).getBoundingClientRect();return [...document.querySelectorAll(${JSON.stringify(sel)})].slice(0,2).map((e)=>{const c=getComputedStyle(e);const b=e.getBoundingClientRect();return {moving:e.hasAttribute("data-moving"),t:c.transform,scale:c.scale==="none"?1:Math.round(parseFloat(c.scale)*1000)/1000,move:c.translate==="none"?0:Math.round(parseFloat(c.translate)),o:Math.round(+c.opacity*100)/100,mid:Math.round((b.x+b.width/2-g.x-g.width/2)*10)/10}})})()`);
  await open(fw, 5);
  check("depth at rest: the slide in view carries nothing (no data-moving, no scale, no transform, opaque)", (await looks()).slice(0, 1).map((l) => [l.moving, l.scale, l.t, l.o]), [[false, 1, "none", 1]]);
  check("the effects are not CSS animations: the same in a browser without scroll-driven animation", await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("carousel-item"))})).animationName`), "none");
  await at(186);
  const depth = await looks();
  check("depth half way: both slides smaller (0.94–1) and dimmer (0.5–1), alike", depth.map((l) => l.moving && l.scale > 0.94 && l.scale < 0.99 && l.o > 0.5 && l.o < 0.95).concat(Math.abs(depth[0].scale - depth[1].scale) < 0.01), [true, true, true]);
  await at(372);
  check("depth at rest on page 2: that slide carries nothing", (await looks()).slice(1).map((l) => [l.moving, l.scale, l.o]), [[false, 1, 1]]);
  await open(fw, 6);
  await at(456);
  check("depth, 900px slides: half way the slides give at most 3% of their width each side", (await looks()).map((l) => l.scale >= 0.94 && l.scale < 1), [true, true]);
  await open(fw, 7);
  check("fade: the scroller does not scroll by itself (nothing travels), and a sideways finger is the drag's", await q(`(()=>{const c=getComputedStyle(document.querySelector(${JSON.stringify(GROUP)}));return [c.overflowX,c.touchAction]})()`), ["hidden", "pan-y"]);
  await at(186);
  const fade = await looks();
  check("fade half way: both slides sit on the scroller's box (±1px), the arriving one half faded in over the leaving one, which stays whole", fade.map((l) => [Math.abs(l.mid) <= 1, l.o]), [[true, 1], [true, 0.5]]);
  check("fade half way: the arriving slide comes forward a little (half the depth scale), the leaving one is not scaled", fade.map((l) => l.scale), [1, 0.985]);
  /* in fade nothing follows the pointer: a sideways drag of 40px turns the page, once a drag,
   * however long and however fast it is, and the slides cross-fade on the animator */
  { await open(fw, 7);
    const g = await p.rect(GROUP);
    const m = (type, x, buttons = 1) => p.send("Input.dispatchMouseEvent", { type, x, y: g.cy, button: "left", buttons, clickCount: 1 });
    await m("mouseMoved", g.cx + 170, 0); await m("mousePressed", g.cx + 170);
    await m("mouseMoved", g.cx + 140); await sleep(60);
    const before = [await scroll(), await pos()];
    await m("mouseMoved", g.cx + 120); await sleep(40);
    const turned = await pos();
    for (let k = 1; k <= 20; k++) { await m("mouseMoved", g.cx + 120 - k * 30); await sleep(8); }
    await m("mouseReleased", g.cx - 480, 0); await sleep(700);
    check("fade: 30px of drag moves nothing; at 50px the page has turned; a 650px drag ending in a flick still stops at the next slide", [before, turned, await scroll(), await pos()], [[0, "1 of 3"], "2 of 3", 372, "2 of 3"]);
  }
  await at(372);
  check("fade at rest on page 2: that slide carries nothing and sits on the box", (await looks()).slice(1).map((l) => [l.moving, l.move, l.scale, l.o, l.mid]), [[false, 0, 1, 1, 0]]);
  /* right-to-left: the same, mirrored (scroll positions run down from 0) */
  await open(fw, 7, "&dir=rtl");
  await at(-186);
  check("fade right-to-left, half way: both on the scroller's box, the arriving (later) one half faded in", (await looks()).map((l) => [Math.abs(l.mid) <= 1, l.o]), [[true, 1], [true, 0.5]]);
  await open(fw, 5, "&dir=rtl");
  await at(-186);
  check("depth right-to-left, half way: both slides smaller and dimmer", (await looks()).map((l) => l.moving && l.scale > 0.94 && l.scale < 0.99 && l.o < 0.95), [true, true]);
  /* parallax moves what a slide marks data-carousel="picture": the test gives each text slide one */
  const PICTURE = `${S("carousel-item")} [data-carousel=picture]`;
  const pictures = () => q(`document.querySelectorAll(${JSON.stringify(S("carousel-item"))}).forEach((s)=>{const d=document.createElement("div");d.dataset.carousel="picture";d.style.height="40px";s.prepend(d)})`);
  /* px a picture is moved by (its translate is a share of its own width) */
  const lag = () => q(`[...document.querySelectorAll(${JSON.stringify(PICTURE)})].slice(0,2).map((e)=>{const t=getComputedStyle(e).translate;return t==="none"?"none":Math.round(t.includes("%")?parseFloat(t)/100*e.offsetWidth:parseFloat(t))})`);
  await open(fw, 8);
  await pictures(); await sleep(150);
  check("parallax at rest: the picture untouched, wider than its frame by a fifth of it on each side (328px wide: 131 in all)", [await lag(), await q(`(()=>{const e=document.querySelector(${JSON.stringify(PICTURE)});const s=getComputedStyle(e.parentElement);return Math.round(e.getBoundingClientRect().width-(e.parentElement.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)))})()`)], [["none", "none"], 131]);
  await at(186);
  check("parallax half way: the leaving slide's picture lags to the right, the arriving one's to the left (a tenth of the frame: 34px each)", await lag(), [34, -34]);
  /* a picture's share of the shift (several layers in one slide slide past each other) */
  await q(`document.querySelectorAll(${JSON.stringify(PICTURE)}).forEach((e)=>e.style.setProperty("--fndn-carousel-parallax","2"))`); await sleep(120);
  check("--fndn-carousel-parallax: 2 on a picture: twice the lag, and twice the room on each side", [await lag(), await q(`(()=>{const e=document.querySelector(${JSON.stringify(PICTURE)});const s=getComputedStyle(e.parentElement);return Math.round(e.getBoundingClientRect().width-(e.parentElement.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)))})()`)], [[68, -68], 262]);
  await q(`document.querySelectorAll(${JSON.stringify(PICTURE)}).forEach((e)=>e.style.removeProperty("--fndn-carousel-parallax"))`);
  await at(372);
  check("parallax at rest on page 2: the picture back on its slide", (await lag())[1], "none");

  /* reduced motion: depth and parallax do nothing; the fade (not travel) stays, without its scale */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 5); await sleep(250);
  await at(186);
  check("reduced motion, depth half way: no scale, no dimming", (await looks()).map((l) => [l.scale, l.o]), [[1, 1], [1, 1]]);
  await open(fw, 8); await sleep(250);
  await pictures(); await at(186);
  check("reduced motion, parallax half way: the pictures move with their slides", (await lag()).map((dx) => dx === "none" || dx === 0), [true, true]);
  await open(fw, 7); await sleep(250);
  await at(186);
  check("reduced motion, fade half way: still a cross-fade in place, not scaled", (await looks()).map((l) => [Math.abs(l.mid) <= 1, l.o, l.scale]), [[true, 1, 1], [true, 0.5, 1]]);
  await p.media([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await open(fw, 5, "&data=worst");
  check("fade with three per page falls back to the plain slide", await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("carousel-item"))})).animationName`), "none");

  /* autoplay: 1500ms a page, three slides, no loop; the pointer is kept off the carousel */
  const PLAY = "#stage [data-carousel=autoplay]";
  const button = () => q(`(()=>{const b=document.querySelector(${JSON.stringify(PLAY)});return b&&[b.getAttribute("aria-label"),b.dataset.slot]})()`);
  const fill = () => q(`(()=>{const a=document.querySelector(${JSON.stringify(S("carousel-indicator-group"))}).getAnimations({subtree:true}).find((x)=>x.animationName==="fndn-carousel-progress");return a?{state:a.playState,time:Math.round(Number(a.currentTime)),current:a.effect.target.hasAttribute("data-current")}:null})()`);
  const away = () => p.hover(5, 5);
  await away();
  await open(fw, 9);
  check("autoplay: a ghost square button named \"Pause\" first in the control row", [await button(), await q(`document.querySelector(${JSON.stringify(S("carousel-control"))}).firstElementChild.matches(${JSON.stringify(PLAY)})`)], [["Pause", "button"], true]);
  check("autoplay: while advancing, the slide group does not announce each slide (aria-live off)", await q(`document.querySelector(${JSON.stringify(GROUP)}).getAttribute("aria-live")`), "off");
  const f0 = await fill(); await sleep(300); const f1 = await fill();
  check("autoplay: the current dot's fill runs (linear, over the dwell)", [f0?.state, f0?.current, f1.time > f0.time, await q(`getComputedStyle(document.querySelector(${JSON.stringify(S("carousel-indicator") + "[data-current]")}),"::after").animationTimingFunction`)], ["running", true, true, "linear"]);
  await sleep(1400);
  check("autoplay: after 1.5s, page 2", await pos(), "2 of 3");
  const auto = await q(`(()=>{document.documentElement.dataset.fndnInput="keyboard";return 1})()`) && await track(1700);
  check("autoplay: an automatic page change scrolls smoothly, even after a key was pressed", [auto.some((x) => x > 380 && x < 740), await pos()], [true, "3 of 3"]);
  await sleep(1500);
  check("autoplay: from the last page it wraps to the first (loop off)", await pos(), "1 of 3");
  /* the pointer over the carousel holds it, and the fill holds with it */
  const slideAt = await p.rect(S("carousel-item"));
  await p.hover(slideAt.cx, slideAt.cy);
  const h0 = await pos(), hf = await fill(); await sleep(1900);
  check("autoplay: holds while the pointer is over the carousel; the fill holds (paused, same time)", [await pos(), hf.state, (await fill()).time === hf.time, await q(`document.querySelector(${JSON.stringify(GROUP)}).getAttribute("aria-live")`)], [h0, "paused", true, "polite"]);
  await away(); await sleep(150);
  check("autoplay: resumes when the pointer leaves, the fill starting over with the engine's full delay", [(await fill()).state, (await fill()).time < 400], ["running", true]);
  await sleep(1600);
  check("autoplay: then advances", await pos(), h0 === "1 of 3" ? "2 of 3" : "3 of 3");
  /* focus inside holds it */
  await q(`document.querySelector(${JSON.stringify(PAGER + " [data-pager=next]")}).focus()`);
  const k0 = await pos(); await sleep(1900);
  check("autoplay: holds while focus is inside", [await pos(), await button()], [k0, ["Pause", "button"]]);
  await q(`document.activeElement.blur()`); await sleep(1700);
  check("autoplay: resumes when focus leaves", (await pos()) !== k0, true);
  /* the button */
  const b0 = await p.rect(PLAY);
  await p.click(b0.cx, b0.cy);
  check("autoplay: Pause pressed: the button reads \"Play\"", await button(), ["Play", "button"]);
  await q(`document.activeElement.blur()`); await away();
  const still = await pos(); await sleep(1900);
  check("autoplay: paused, nothing moves with the pointer and focus away", await pos(), still);
  await p.click(b0.cx, b0.cy);
  check("autoplay: Play pressed: \"Pause\" again", await button(), ["Pause", "button"]);
  await sleep(1700);
  check("autoplay: Play moves the slides at once, though the pointer and focus are still on the button", (await pos()) !== still, true);
  /* a page turned by hand stops it */
  const nx = await p.rect(PAGER + " [data-pager=next]");
  await p.click(nx.cx, nx.cy); await sleep(400);
  await q(`document.activeElement.blur()`); await away();
  const m0 = await pos(); await sleep(1900);
  check("autoplay: a page turned by hand stops it (the button reads \"Play\", nothing moves)", [await button(), await pos()], [["Play", "button"], m0]);
  /* the focus arrives on the slides while they advance (the engine misses it): the keys still page */
  await open(fw, 9); await away();
  await q(`document.querySelector(${JSON.stringify(GROUP)}).focus()`); await sleep(150);
  const a0 = await pos();
  await p.key("ArrowRight");
  check("autoplay: focus arriving on the slides while they advance: Arrow Right pages them at once", [a0, await pos(), await scroll()], a0 === "1 of 3" ? ["1 of 3", "2 of 3", 372] : ["2 of 3", "3 of 3", 744]);
  await open(fw, 10);
  check("autoplay without controls: the control row holds the pause button alone", await q(`[...document.querySelector(${JSON.stringify(S("carousel-control"))}).children].map((e)=>e.dataset.carousel??e.dataset.slot)`), ["autoplay"]);
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 9); await sleep(1700);
  check("autoplay under reduced motion: does not start (\"Play\", still page 1)", [await button(), await pos()], [["Play", "button"], "1 of 3"]);
  await p.media([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* dark */
  await open(fw, 1, "&theme=dark");
  check("dark: the current dot in ink, a slide on the dark inset", await q(`[getComputedStyle(document.querySelector(${JSON.stringify(S("carousel-indicator"))}),"::before").backgroundColor,getComputedStyle(document.querySelector(${JSON.stringify(S("carousel-item"))})).backgroundColor]`), [await token("--fndn-ink"), await token("--fndn-inset")]);
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
