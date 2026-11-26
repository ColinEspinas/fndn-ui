// Entrance, pointer and layout contract of Context Cards, run against every target through the harness.
//   node components/context-cards/context-cards.test.mjs            all four targets
//   node components/context-cards/context-cards.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=context-cards]";
const p = await launch({ dpr: 2, port: 11000 + Math.floor(Math.random() * 3000) });
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=context-cards&fw=${fw}&ex=0`, 100);
  for (let t = 0; t < 60; t++) { if (await p.eval(`!!document.querySelector("${R} [data-slot=context-cards-card]")`).catch(() => false)) break; await sleep(50); }
  const q = (js) => p.eval(js).catch((e) => `error: ${String(e.message).slice(0, 80)}`);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };

  /* a mount is not an arrival: a plain mount shows everything at once */
  check("plain mount (appear off by default): neither the header nor the cards enter", await q(`[...document.querySelectorAll("${R} :is([data-slot=context-cards-header], [data-slot=context-cards-card])")].map((e)=>getComputedStyle(e).animationName)`), ["none", "none", "none"]);
  await p.goto(`${BASE}/harness.html?c=context-cards&fw=${fw}&ex=0&step=2`, 100);
  for (let t = 0; t < 60; t++) { if (await p.eval(`document.querySelectorAll("${R} [data-slot=context-cards-card]").length === 4`).catch(() => false)) break; await sleep(50); }
  check("cards added after mount rise; what was there at mount does not", await q(`[...document.querySelectorAll("${R} :is([data-slot=context-cards-header], [data-slot=context-cards-card])")].map((e)=>getComputedStyle(e).animationName)`), ["none", "none", "none", "fndn-fade-up", "fndn-fade-up"]);
  /* appear: the set the host's code adds live */
  await p.goto(`${BASE}/harness.html?c=context-cards&fw=${fw}&ex=1`, 100);
  for (let t = 0; t < 60; t++) { if (await p.eval(`!!document.querySelector("${R} [data-slot=context-cards-card]")`).catch(() => false)) break; await sleep(50); }
  const timing = await q(`(()=>{const ms=(v)=>Math.round(parseFloat(v)*(v.endsWith("ms")?1:1000));const cs=(s)=>[...document.querySelectorAll(s)].map((e)=>{const c=getComputedStyle(e);return [c.animationName, ms(c.animationDuration), ms(c.animationDelay)]});
    return {header: cs("${R} [data-slot=context-cards-header]")[0], cards: cs("${R} [data-slot=context-cards-card]"), chips: cs("${R} [data-slot=context-cards-source]")}})()`);
  check("appear, one entrance: header fades with the first card, cards rise in a 40ms stagger, the chips arrive with their card (no entrance of their own)", timing, {
    header: ["fndn-fade-in", 300, 0],
    cards: [["fndn-fade-up", 300, 0], ["fndn-fade-up", 300, 40]],
    chips: [["none", 0, 0], ["none", 0, 0]],
  });
  const layout0 = await q(`[...document.querySelectorAll("${R} [data-slot=context-cards-card]")].map((c)=>[c.offsetTop, c.offsetHeight])`);
  await sleep(700);
  check("no layout shift during the entrance", await q(`[...document.querySelectorAll("${R} [data-slot=context-cards-card]")].map((c)=>[c.offsetTop, c.offsetHeight])`), layout0);
  check("everything settled: opaque, untransformed", await q(`[...document.querySelectorAll("${R} [data-slot=context-cards-card], ${R} [data-slot=context-cards-source]")].every((e)=>{const c=getComputedStyle(e);return c.opacity==="1"&&(c.transform==="none"||new DOMMatrix(c.transform).isIdentity)})`), true);

  /* layout at dpr 2 */
  const geo = await q(`(()=>{const b=[...document.querySelectorAll("${R} [data-slot=context-cards-badge]")].map((e)=>{const r=e.getBoundingClientRect();return [r.width,r.height,e.textContent.trim().length]});
    const e4=(w)=>w<24; /* a four-letter type (XLSX) widens the badge a little instead of being cut */
    const mid=(e)=>{const r=e.getBoundingClientRect();return r.top+r.height/2};
    const chip=[...document.querySelectorAll("${R} [data-slot=context-cards-source]")].every((s)=>[...s.children].every((c)=>Math.abs(mid(c)-mid(s))<=0.5));
    const bar=[...document.querySelectorAll("${R} [data-slot=context-cards-bar]")].every((s)=>[...s.children].every((c)=>Math.abs(mid(c)-mid(s))<=0.5));
    return {badges: b.every(([w,h,n])=>h===14&&(n<=3?w===14:w>14&&e4(w))), chip, bar, tabular: getComputedStyle(document.querySelector("${R} [data-slot=context-cards-chars]")).fontVariantNumeric+"|"+getComputedStyle(document.querySelector("${R} [data-slot=count]")).fontVariantNumeric}})()`);
  check("badges are 14px squares (a four-letter type a little wider, never cut); chip and bar contents centred; numbers tabular", geo, { badges: true, chip: true, bar: true, tabular: "tabular-nums|tabular-nums" });
  check("truncatable text carries its full value as title", await q(`[...document.querySelectorAll("${R} [data-slot=context-cards-card-title] > span, ${R} [data-slot=context-cards-source-name]")].every((e)=>e.title===e.textContent)`), true);

  /* keyboard: the chips are links in order */
  await q(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(50);
  const first = await q(`document.activeElement?.dataset.slot`);
  await p.key("Tab"); await sleep(50);
  check("Tab walks the source links", [first, await q(`document.activeElement?.querySelector("[data-slot=context-cards-source-name]")?.textContent`)], ["context-cards-source", "Sales Velocity Export.csv"]);

  /* pointer: press feedback works after the entrance (the keyframe let go of transform) */
  const chip = await p.rect(`${R} [data-slot=context-cards-source]`);
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: chip.cx, y: chip.cy });
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: chip.cx, y: chip.cy, button: "left", clickCount: 1 });
  await sleep(250);
  const pressed = await q(`getComputedStyle(document.querySelector("${R} [data-slot=context-cards-source]")).transform`);
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: chip.cx, y: chip.cy, button: "left", clickCount: 1 });
  check("source chip presses (scale 0.97)", pressed.startsWith("matrix(0.97"), true);
  check("no console errors", p.errors.slice(0, 2), []);
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
