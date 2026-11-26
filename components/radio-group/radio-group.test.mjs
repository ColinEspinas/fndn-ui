// Keyboard, pointer, geometry and motion contract of the radio group, run against every target.
//   node components/radio-group/radio-group.test.mjs            all four targets
//   node components/radio-group/radio-group.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2 });
/* every transition that starts, from the first paint on */
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__runs=[];document.addEventListener("transitionrun",(e)=>window.__runs.push(String(e.target.dataset?.slot)+":"+e.propertyName),true);` });
let failed = 0;

const open = async (fw, ex, extra = "") => {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=radio-group&fw=${fw}&ex=${ex}${extra}`, 300);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
};
const selected = () => p.eval(`document.querySelector('#stage [data-slot=radio-group-item][data-state="checked"] [data-slot=radio-group-item-text]')?.textContent.trim() ?? null`);
const focused = () => p.eval(`document.activeElement?.closest?.("[data-slot=radio-group-item]")?.querySelector("[data-slot=radio-group-item-text]")?.textContent.trim() ?? null`);
const both = async () => [await selected(), await focused()];
const nth = (n) => `#stage [data-slot=radio-group-item]:nth-of-type(${n})`;
const ctl = (n) => `${nth(n)} [data-slot=radio-group-control]`;
/* transitions in flight on the controls: [item index, property, delay, duration, easing] */
const inFlight = () => p.eval(`document.getAnimations().filter((a)=>a.transitionProperty&&a.effect.target.dataset.slot==="radio-group-control").map((a)=>{const t=a.effect.getComputedTiming(),el=a.effect.target;return [[...document.querySelectorAll("#stage [data-slot=radio-group-control]")].indexOf(el)+1,a.transitionProperty,t.delay,t.duration,t.easing]})`);
const shadow = (n) => p.eval(`getComputedStyle(document.querySelector("${ctl(n)}")).boxShadow`);
const press = async (sel) => { const r = await p.rect(sel); await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.cx, y: r.cy }); await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", clickCount: 1 }); return r; };
const release = async (r) => { await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.cx, y: r.cy, button: "left", clickCount: 1 }); await sleep(30); };
const scaleOf = (sel) => p.eval(`(()=>{const m=getComputedStyle(document.querySelector("${sel}")).transform;return m==="none"?1:+new DOMMatrix(m).a.toFixed(3)})()`);
const RING_ON = /^[^,]* 0px 0px 0px 5px inset$/, RING_OFF = /^[^,]* 0px 0px 0px 1\.5px inset$/;

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => {
    const ok = typeof want === "function" ? want(got) : JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failed++;
    checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}${typeof want === "function" ? "" : `, want ${JSON.stringify(want)}`}`}`);
  };
  try {
  await open(fw, 0);
  check("a radiogroup with one checked option; the native radio agrees", await p.eval(`[document.querySelector("#stage [data-slot=radio-group]").getAttribute("role"), document.querySelectorAll('#stage [data-slot=radio-group-item][data-state="checked"]').length, document.querySelector("#stage [data-slot=radio-group-input]:checked")?.value]`), ["radiogroup", 1, "three"]);
  check("the group is named by its label", await p.eval(`(()=>{const g=document.querySelector("#stage [data-slot=radio-group]");return document.getElementById(g.getAttribute("aria-labelledby"))?.textContent.trim()})()`), "How many plans should we launch?");
  check("the control is a 16px circle", await p.eval(`(()=>{const c=document.querySelector("#stage [data-slot=radio-group-control]");const b=c.getBoundingClientRect();return [b.width,b.height,getComputedStyle(c).borderTopLeftRadius]})()`), [16, 16, "50%"]);
  check("control and text share one centre line on every row", await p.eval(`Math.max(...[...document.querySelectorAll("#stage [data-slot=radio-group-item]")].map((i)=>{const c=i.querySelector("[data-slot=radio-group-control]").getBoundingClientRect(),t=i.querySelector("[data-slot=radio-group-item-text]").getBoundingClientRect();return Math.abs((c.top+c.height/2)-(t.top+t.height/2))}))`), (d) => d < 0.5);
  check("nothing animates at mount (no transition ran since the first paint)", await p.eval(`window.__runs`), []);
  check("every control is kbd-instant (the utility); no dot pseudo-element", await p.eval(`[...document.querySelectorAll("#stage [data-slot=radio-group-control]")].map((c)=>c.classList.contains("kbd-instant")&&getComputedStyle(c,"::before").content==="none")`), [true, true, true]);
  check("selected: a 5px ink ring around an on-ink centre; others a 1.5px hairline", [await shadow(1), await shadow(2)], (g) => RING_ON.test(g[0]) && RING_OFF.test(g[1]));

  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(60);
  check("Tab reaches the checked option", await focused(), "Three (core line)");
  check("keyboard focus shows a ring on the control", await p.eval(`getComputedStyle(document.querySelector('#stage [data-slot=radio-group-item][data-state="checked"] [data-slot=radio-group-control]')).outlineStyle`), "solid");
  await p.eval(`window.__runs.length = 0`);
  await p.key("ArrowDown"); await sleep(60);
  check("ArrowDown selects and focuses the next option", await both(), ["Five (full case)", "Five (full case)"]);
  check("arrow keys change the selection instantly (no transition ran)", await p.eval(`window.__runs`), []);
  await p.key("ArrowRight"); await sleep(60);
  check("ArrowRight also moves on", await both(), ["Just one hero", "Just one hero"]);
  await p.key("ArrowDown"); await sleep(60);
  check("ArrowDown wraps from the last to the first", await both(), ["Three (core line)", "Three (core line)"]);
  await p.key("ArrowUp"); await sleep(60);
  check("ArrowUp wraps from the first to the last", await both(), ["Just one hero", "Just one hero"]);
  await p.key("Home"); await sleep(60);
  check("Home selects the first option", await both(), ["Three (core line)", "Three (core line)"]);
  await p.key("End"); await sleep(60);
  check("End selects the last option", await both(), ["Just one hero", "Just one hero"]);
  await p.key("Tab"); await sleep(60);
  check("the group is one tab stop", await p.eval(`!!document.activeElement?.closest?.("[data-slot=radio-group]")`), false);

  /* pointer move from option 3 to option 2: one ring closes in while the other opens, together */
  await p.rate(0.1);
  await p.clickSel(`${nth(2)} [data-slot=radio-group-item-text]`); await sleep(20);
  const move = await inFlight();
  check("a click on the text selects", await selected(), "Five (full case)");
  check("move: the new ring closes in over 150ms out-strong from the start", move.filter((x) => x[0] === 2 && x[1] === "box-shadow").map((x) => x.slice(2)), [[0, 150, "cubic-bezier(0.23, 1, 0.32, 1)"]]);
  check("move: the old ring opens over 100ms, starting together with the new one", move.filter((x) => x[0] === 3 && x[1] === "box-shadow").map((x) => x.slice(2)), [[0, 100, "cubic-bezier(0.23, 1, 0.32, 1)"]]);
  check("move: only the ring and the centre colour change (no transform, no other part)", [...new Set(move.map((x) => x[1]))].sort(), ["background-color", "box-shadow"]);
  await p.rate(1); await sleep(250);
  check("move: the rings land (5px on the new option, 1.5px hairline on the old)", [await shadow(2), await shadow(3)], (g) => RING_ON.test(g[0]) && RING_OFF.test(g[1]));
  check("no focus ring after a pointer click", await p.eval(`getComputedStyle(document.querySelector("${ctl(2)}")).outlineStyle`), "none");

  /* press: a visible 0.9, pointer only */
  const r = await press(`${nth(1)} [data-slot=radio-group-item-text]`); await sleep(260);
  check("pressed, the control is at scale 0.9", await scaleOf(ctl(1)), 0.9);
  await release(r); await sleep(260);
  check("released, it springs back to 1 and is selected", [await scaleOf(ctl(1)), await selected()], [1, "Three (core line)"]);

  /* 60ms toggles retarget: no stuck state */
  await p.clickSel(`${nth(2)} [data-slot=radio-group-item-text]`); await sleep(60);
  await p.clickSel(`${nth(1)} [data-slot=radio-group-item-text]`); await sleep(300);
  check("A → B → A at 60ms: A selected, every ring at rest", [await selected(), await shadow(1), await shadow(2), await shadow(3)], (g) => g[0] === "Three (core line)" && RING_ON.test(g[1]) && RING_OFF.test(g[2]) && RING_OFF.test(g[3]));
  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(60);
  await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, text: " " }); await sleep(200);
  check("Space held: no press scale (pointer only)", await scaleOf(ctl(1)), 1);
  await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 }); await sleep(30);
  check("no console errors", p.errors.slice(0, 2), []);

  await open(fw, 1);
  check("horizontal: options sit on one line", await p.eval(`new Set([...document.querySelectorAll("#stage [data-slot=radio-group-item]")].map((i)=>Math.round(i.getBoundingClientRect().top))).size`), 1);
  check("horizontal: named by aria-label", await p.eval(`document.querySelector("#stage [data-slot=radio-group]").getAttribute("aria-label")`), "First market");

  await open(fw, 2);
  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(60);
  await p.key("ArrowDown"); await sleep(60);
  check("arrows skip a disabled option", await both(), ["Never", "Never"]);
  await p.key("ArrowUp"); await sleep(60);
  check("and skip it going back", await both(), ["Weekly", "Weekly"]);
  await p.clickSel(`${nth(3)} [data-slot=radio-group-item-text]`); await sleep(60);
  check("a disabled option cannot be selected", await selected(), "Weekly");

  await open(fw, 3);
  check("none selected: nothing checked", await selected(), null);
  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(60);
  check("Tab reaches the first option when none is checked", await focused(), "Low");
  await p.eval(`window.__runs.length = 0`);
  await p.key(" "); await sleep(60);
  check("Space selects the focused option, instantly", [await selected(), await p.eval(`window.__runs`)], ["Low", []]);
  check("no console errors (other examples)", p.errors.slice(0, 2), []);

  /* reduced motion: the ring keeps its width and only changes colour; the press stays */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 3);
  await p.rate(0.1);
  await p.clickSel(`${nth(1)} [data-slot=radio-group-item-text]`); await sleep(20);
  const rm = await inFlight();
  await p.eval(`document.getAnimations().forEach((a)=>{a.pause();a.currentTime=50})`);
  check("reduced motion: the ring changes colour over 100ms ease, no travel (5px ring at mid-transition)", [rm.filter((x) => x[1] === "box-shadow").map((x) => x.slice(2)), await shadow(1)], (g) => JSON.stringify(g[0]) === JSON.stringify([[0, 100, "ease"]]) && / 5px inset, .* 1\.5px inset$/.test(g[1]));
  await p.eval(`document.getAnimations().forEach((a)=>a.finish())`);
  await p.rate(1);
  const rr = await press(`${nth(2)} [data-slot=radio-group-item-text]`); await sleep(260);
  check("reduced motion: the press scale stays", await scaleOf(ctl(2)), 0.9);
  await release(rr); await sleep(200);
  await p.media([]);

  /* right to left, every target (the harness wraps the adapters in Ark's LocaleProvider) */
  await open(fw, 0, "&dir=rtl");
  check("right to left: the control sits at the inline start (right of the text)", await p.eval(`document.querySelector("#stage [data-slot=radio-group-control]").getBoundingClientRect().left > document.querySelector("#stage [data-slot=radio-group-item-text]").getBoundingClientRect().left`), true);
  await open(fw, 1, "&dir=rtl");
  {
    const xs = await p.eval(`[...document.querySelectorAll("#stage [data-slot=radio-group-item]")].map((i)=>Math.round(i.getBoundingClientRect().x))`);
    await p.eval(`document.activeElement?.blur()`);
    await p.key("Tab"); await sleep(60);
    await p.key("ArrowLeft"); await sleep(80);
    check("right to left (horizontal): the first option sits at the right; ArrowLeft selects the one to the left", [xs[0] > xs[1] && xs[1] > xs[2], await both()], [true, ["Partner resellers", "Partner resellers"]]);
    await p.key("ArrowRight"); await sleep(80);
    check("right to left (horizontal): ArrowRight goes back to the right", await both(), ["Self-serve signups", "Self-serve signups"]);
  }

  /* layout="row" (example 4): option rows under one gliding highlight, and a free-text row */
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2 });
  await open(fw, 4);
  const glideAt = () => p.eval(`(()=>{const g=document.querySelector("#stage [data-slot=radio-group-highlight]");if(!g?.hasAttribute("data-visible"))return null;const y=new DOMMatrix(getComputedStyle(g).transform).f;const rows=[...document.querySelectorAll("#stage :is([data-slot=radio-group-item], [data-slot=radio-group-custom])")];const i=rows.findIndex((r)=>Math.abs(r.offsetTop-y)<0.5&&Math.abs(r.offsetHeight-g.offsetHeight)<0.5);return i<0?"between":i+1})()`);
  check("rows: every option and the free-text row is a 30px option row as wide as the list", await p.eval(`(()=>{const g=document.querySelector("#stage [data-slot=radio-group]");const rows=[...g.querySelectorAll(":scope > :is([data-slot=radio-group-item], [data-slot=radio-group-custom])")];return [rows.length, [...new Set(rows.map((r)=>r.getBoundingClientRect().height))], rows.every((r)=>Math.abs(r.getBoundingClientRect().width-g.clientWidth)<1), [...new Set(rows.map((r)=>getComputedStyle(r).borderTopLeftRadius))]]})()`), [4, [30], true, ["6px"]]);
  check("rows: the control is drawn as in the inline layout (16px circle, centred on the text line)", await p.eval(`[...document.querySelectorAll("#stage [data-slot=radio-group-item]")].map((i)=>{const c=i.querySelector("[data-slot=radio-group-control]").getBoundingClientRect(),t=i.querySelector("[data-slot=radio-group-item-text]").getBoundingClientRect(),r=i.getBoundingClientRect();return [c.width, Math.abs((c.top+c.height/2)-(t.top+t.height/2))<0.5, Math.abs((c.top+c.height/2)-(r.top+r.height/2))<0.5]})`), [[16, true, true], [16, true, true], [16, true, true]]);
  check("rows: no highlight until the pointer or focus arrives", await glideAt(), null);
  { const r = await p.rect(`${nth(2)} [data-slot=radio-group-item-text]`); await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.cx, y: r.cy }); await sleep(300); }
  check("rows: the highlight lands on the hovered row", await glideAt(), 2);
  { const r = await p.rect(`${nth(3)} [data-slot=radio-group-item-text]`); await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.cx, y: r.cy }); await sleep(40); }
  check("rows: and glides to the next row (transform, duration.move)", [await p.eval(`document.getAnimations().filter((a)=>a.effect?.target?.dataset?.slot==="radio-group-highlight").map((a)=>a.transitionProperty)`)], (g) => g[0].includes("transform"));
  await sleep(300);
  check("rows: on the row under the pointer", await glideAt(), 3);
  { const r = await press(`${nth(3)} [data-slot=radio-group-item-text]`); await sleep(260);
    check("rows: press darkens the row (hover-2) and scales the control (press-scale-sm)", [await p.eval(`(()=>{const probe=document.createElement("i");probe.style.background="var(--fndn-hover-2)";document.body.append(probe);const want=getComputedStyle(probe).backgroundColor;probe.remove();return getComputedStyle(document.querySelector("${nth(3)}")).backgroundColor===want})()`), await scaleOf(ctl(3))], [true, 0.9]);
    await release(r); await sleep(200); }
  check("rows: a click selects", await selected(), "Just one hero");
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2 }); await sleep(250);
  check("rows: the highlight leaves with the pointer", await glideAt(), null);
  await p.eval(`document.querySelector("#stage [data-slot=radio-group-custom-input]").focus()`);
  await p.key("Tab", { shift: true }); await sleep(250);
  check("rows: keyboard focus brings the highlight to the focused row", [await focused(), await glideAt()], ["Just one hero", 3]);
  await p.key("ArrowUp"); await sleep(300);
  check("rows: arrows select and the highlight follows", [await both(), await glideAt()], [["Five (full case)", "Five (full case)"], 2]);
  await p.key("Tab"); await sleep(250);
  check("rows: Tab goes on to the free-text row (the group's options are one stop)", [await p.eval(`document.activeElement?.dataset?.slot`), await glideAt()], ["radio-group-custom-input", 4]);
  await p.type("Mint"); await sleep(120);
  check("rows: typing an answer clears the selection", [await selected(), await p.eval(`document.querySelector("#stage [data-slot=radio-group-custom-input]").value`), await p.eval(`document.querySelectorAll("#stage [data-slot=radio-group-input]:checked").length`)], [null, "Mint", 0]);
  await p.key("Home"); await sleep(60);
  check("rows: Home stays in the text field", [await p.eval(`document.activeElement?.dataset?.slot`), await selected()], ["radio-group-custom-input", null]);
  await p.clickSel(`${nth(1)} [data-slot=radio-group-item-text]`); await sleep(120);
  check("rows: picking an option empties the text", [await selected(), await p.eval(`document.querySelector("#stage [data-slot=radio-group-custom-input]").value`)], ["Three (core line)", ""]);
  check("no console errors (rows)", p.errors.slice(0, 2), []);

  } catch (e) { failed++; checks.push(`✗ threw: ${String(e.message).split("\n")[0]}`); }
  await p.rate(1); await p.media([]);
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2 && !process.env.NORETRY) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
