// Keyboard, pointer, geometry and motion contract of the checkbox, run against every target.
//   node components/checkbox/checkbox.test.mjs            all four targets
//   node components/checkbox/checkbox.test.mjs react      one target
// Motion contract (docs/design/motion.md): the fill leads (colour
// over `fast`), the mark is drawn by a clip-path wipe one stagger step later (no scale, no opacity
// ramp), the exit is a shorter plain fade, the press is a visible 0.9 on pointer only, keyboard
// changes and the first paint do not animate, reduced motion drops the wipe.
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2 });
/* every transition that starts, from the first paint on */
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__runs=[];document.addEventListener("transitionrun",(e)=>window.__runs.push(String(e.target.dataset?.slot)+":"+e.propertyName),true);` });
let failed = 0;

const open = async (fw, ex, extra = "") => {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=checkbox&fw=${fw}&ex=${ex}${extra}`, 300);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
};
const CTL = "#stage [data-slot=checkbox-control]";
const MARK = (m) => `#stage [data-slot=checkbox-mark][data-mark="${m}"]`;
const state = () => p.eval(`[document.querySelector("${CTL}").getAttribute("data-state"), document.querySelector("#stage [data-slot=checkbox-input]").checked]`);
const markOpacity = (mark) => p.eval(`getComputedStyle(document.querySelector('${MARK(mark)}')).opacity`);
const markClip = (mark) => p.eval(`getComputedStyle(document.querySelector('${MARK(mark)}')).clipPath`);
/* the transitions in flight: [part, property, delay, duration, easing] */
const inFlight = () => p.eval(`document.getAnimations().filter((a)=>a.transitionProperty).map((a)=>{const t=a.effect.getComputedTiming(),el=a.effect.target;return [String(el.dataset.slot).replace("checkbox-","")+(el.dataset.mark?"="+el.dataset.mark:""),a.transitionProperty,t.delay,t.duration,t.easing]})`);
const end = (list, f) => Math.max(0, ...list.filter(f).map((x) => x[2] + x[3]));
const press = async (sel) => { const r = await p.rect(sel); await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.cx, y: r.cy }); await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", clickCount: 1 }); return r; };
const release = async (r) => { await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.cx, y: r.cy, button: "left", clickCount: 1 }); await sleep(30); };
const scaleOf = (sel) => p.eval(`(()=>{const m=getComputedStyle(document.querySelector("${sel}")).transform;return m==="none"?1:+new DOMMatrix(m).a.toFixed(3)})()`);

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
  await p.rate(1);
  await open(fw, 0);
  check("checked on mount; the native checkbox agrees", await state(), ["checked", true]);
  check("nothing animates at mount (no transition ran since the first paint)", await p.eval(`window.__runs`), []);
  check("the box is 16×16 with a 5px radius", await p.eval(`(()=>{const c=document.querySelector("${CTL}");const b=c.getBoundingClientRect();return [b.width,b.height,getComputedStyle(c).borderTopLeftRadius]})()`), [16, 16, "5px"]);
  check("box and label share one centre line", await p.eval(`(()=>{const c=document.querySelector("${CTL}").getBoundingClientRect(),l=document.querySelector("#stage [data-slot=checkbox-label]").getBoundingClientRect();return +Math.abs((c.top+c.height/2)-(l.top+l.height/2)).toFixed(2)})()`), (d) => d < 0.5);
  check("the check is centred in the box", await p.eval(`(()=>{const c=document.querySelector("${CTL}").getBoundingClientRect(),m=document.querySelector('${MARK("check")} [data-slot=icon]').getBoundingClientRect();return +Math.max(Math.abs((c.left+c.width/2)-(m.left+m.width/2)),Math.abs((c.top+c.height/2)-(m.top+m.height/2))).toFixed(2)})()`), (d) => d < 0.5);
  check("the check rests fully drawn", [await markOpacity("check"), await markClip("check")], ["1", "inset(0px)"]);
  check("control and marks are kbd-instant (the utility)", await p.eval(`[...document.querySelectorAll("${CTL}, #stage [data-slot=checkbox-mark]")].every((e)=>e.classList.contains("kbd-instant"))`), true);

  /* pointer off: a plain fade over fast; the box empties over the same time; the clip waits */
  await p.rate(0.1);
  await p.clickSel("#stage [data-slot=checkbox-label]"); await sleep(20);
  const off = await inFlight();
  check("a click on the label unchecks", await state(), ["unchecked", false]);
  check("off: the check fades over 100ms with no delay; no scale", off.filter((x) => x[0] === "mark=check" && x[1] !== "clip-path").map((x) => x.slice(1, 4)), [["opacity", 0, 100]]);
  check("off: the box empties over 100ms", off.filter((x) => x[0] === "control").map((x) => x.slice(1, 4)), [["background-color", 0, 100], ["box-shadow", 0, 100]]);
  check("off: the check is not wiped while it fades", await markClip("check"), (v) => /^inset\(0px( 0%)?( 0px 0px)?\)$/.test(v));
  await p.rate(1); await sleep(200);
  check("off: the check rests hidden, clip reset for the next draw", [await markOpacity("check"), await markClip("check")], ["0", "inset(0px 100% 0px 0px)"]);
  check("no focus ring after a pointer click", await p.eval(`getComputedStyle(document.querySelector("${CTL}")).outlineStyle`), "none");

  /* pointer on: the fill leads, the check is drawn */
  await p.rate(0.1);
  await p.clickSel(CTL); await sleep(20);
  const on = await inFlight();
  check("a click on the box checks", await state(), ["checked", true]);
  check("on: the box fills over 100ms ease from the start", on.filter((x) => x[0] === "control" && x[1] !== "transform").map((x) => x.slice(1)), [["background-color", 0, 100, "ease"], ["box-shadow", 0, 100, "ease"]]);
  check("on: the check is drawn by a clip-path wipe, 150ms out-strong, 40ms after the fill", on.filter((x) => x[0] === "mark=check").map((x) => x.slice(1)), [["clip-path", 40, 150, "cubic-bezier(0.23, 1, 0.32, 1)"]]);
  check("on: the check starts at the inline start and is shown at full opacity (no fade, no scale)", [await markOpacity("check"), await markClip("check"), await p.eval(`getComputedStyle(document.querySelector('${MARK("check")}')).transform`)], (g) => g[0] === "1" && /^inset\(0px (9\d|100)(\.\d+)?% 0px 0px\)$/.test(g[1]) && g[2] === "none");
  const enterEnd = end(on, () => true), exitEnd = end(off, (x) => x[1] !== "clip-path");
  check(`exit (${exitEnd}ms) is shorter than enter (${enterEnd}ms); enter stays under 250ms`, [exitEnd < enterEnd, enterEnd < 250], [true, true]);
  await p.rate(1); await sleep(250);
  check("on: the check lands fully drawn", [await markOpacity("check"), await markClip("check")], ["1", "inset(0px)"]);

  /* press: a visible 0.9, pointer only */
  let r = await press("#stage [data-slot=checkbox-label]"); await sleep(260);
  check("pressed, the box is at scale 0.9", await scaleOf(CTL), 0.9);
  await release(r); await sleep(260);
  check("released, it springs back to 1; the press toggled it off", [await scaleOf(CTL), await state()], [1, ["unchecked", false]]);

  /* 60ms double and triple toggles retarget: no stuck state, no half-drawn mark */
  await p.clickSel(CTL); await sleep(60); await p.clickSel(CTL); await sleep(300);
  check("double toggle at 60ms: unchecked again, the check fully hidden", [await state(), await markOpacity("check"), await markClip("check")], [["unchecked", false], "0", "inset(0px 100% 0px 0px)"]);
  await p.clickSel(CTL); await sleep(60); await p.clickSel(CTL); await sleep(60); await p.clickSel(CTL); await sleep(300);
  check("triple toggle at 60ms: checked, the check fully shown", [await state(), await markOpacity("check"), await markClip("check")], [["checked", true], "1", "inset(0px)"]);

  /* keyboard: focus ring, Space toggles with no animation and no press */
  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(60);
  check("Tab focuses the native checkbox", await p.eval(`document.activeElement === document.querySelector("#stage [data-slot=checkbox-input]")`), true);
  check("keyboard focus shows a ring on the box", await p.eval(`getComputedStyle(document.querySelector("${CTL}")).outlineStyle`), "solid");
  await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, text: " " }); await sleep(200);
  check("Space held: no press scale (pointer only)", await scaleOf(CTL), 1);
  await p.eval(`window.__runs.length = 0`);
  await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 }); await sleep(60);
  check("Space toggles", await state(), ["unchecked", false]);
  check("Space: the change is instant (no transition ran)", await p.eval(`window.__runs`), []);
  await p.key(" "); await sleep(20);
  check("Space toggles back, instantly, the check fully drawn", [await state(), await p.eval(`window.__runs`), await markOpacity("check"), await markClip("check")], [["checked", true], [], "1", "inset(0px)"]);
  check("no console errors", p.errors.slice(0, 2), []);

  /* indeterminate: the dash is drawn from its centre; to checked, the box does not blink */
  await open(fw, 2);
  check("indeterminate: dash shown, native input is mixed", [await p.eval(`document.querySelector("${CTL}").getAttribute("data-state")`), await p.eval(`document.querySelector("#stage [data-slot=checkbox-input]").indeterminate`), await markOpacity("indeterminate"), await markOpacity("check")], ["indeterminate", true, "1", "0"]);
  check("indeterminate: nothing animates at mount", await p.eval(`window.__runs`), []);
  check("indeterminate: the hidden dash rests clipped to its centre", await p.eval(`(()=>{const c=document.querySelector("${CTL}");c.setAttribute("data-state","checked");const m=document.querySelector('${MARK("indeterminate")}');m.style.transition="none";const v=getComputedStyle(m).clipPath;m.style.transition="";c.setAttribute("data-state","indeterminate");return v})()`), "inset(0px 50%)");
  await p.rate(0.1);
  await p.clickSel("#stage [data-slot=checkbox-label]"); await sleep(20);
  const swap = await inFlight();
  check("a click on an indeterminate box checks it", await state(), ["checked", true]);
  check("indeterminate → checked: the dash fades, the check is drawn, the box does not change", swap.filter((x) => x[3] > 0).map((x) => x.slice(0, 4)).sort(), [["mark=check", "clip-path", 40, 150], ["mark=indeterminate", "opacity", 0, 100]]);
  await p.rate(1); await sleep(250);

  await open(fw, 3);
  r = await press("#stage [data-slot=checkbox-label]"); await sleep(200);
  check("disabled: no press", await scaleOf(CTL), 1);
  await release(r); await sleep(60);
  check("disabled: a click does nothing; the row is at half opacity", [await state(), await p.eval(`getComputedStyle(document.querySelector("#stage [data-slot=checkbox]")).opacity`), await p.eval(`document.querySelector("#stage [data-slot=checkbox-input]").disabled`), await p.eval(`window.__runs`)], [["checked", true], "0.5", true, []]);

  await open(fw, 4);
  check("invalid: red ring and aria-invalid", [await p.eval(`document.querySelector("${CTL}").hasAttribute("data-invalid")`), await p.eval(`document.querySelector("#stage [data-slot=checkbox-input]").getAttribute("aria-invalid")`)], [true, "true"]);

  await open(fw, 5);
  check("no visible label: named by aria-label", await p.eval(`document.querySelector("#stage [data-slot=checkbox-input]").getAttribute("aria-label")`), "Select row");
  const box = await p.rect(CTL);
  await p.click(box.x - 3, box.y - 3); await sleep(60);
  check("the hit area reaches 4px past the box (24px target)", await state(), ["checked", true]);
  check("no console errors (other examples)", p.errors.slice(0, 2), []);

  /* reduced motion: no wipe; the mark fades over fast both ways; the press stays */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw, 1);
  await p.rate(0.1);
  await p.clickSel(CTL); await sleep(20);
  const rm = await inFlight();
  check("reduced motion: the check fades in over 100ms, no clip", [rm.filter((x) => x[0] === "mark=check").map((x) => x.slice(1, 4)), await markClip("check")], [[["opacity", 0, 100]], "none"]);
  await p.rate(1); await sleep(200);
  r = await press(CTL); await sleep(260);
  check("reduced motion: the press scale stays", await scaleOf(CTL), 0.9);
  await release(r); await sleep(200);
  await p.media([]);

  /* right to left, every target (the harness wraps the adapters in Ark's LocaleProvider) */
  await open(fw, 0, "&dir=rtl");
  check("right to left: the box sits at the inline start (right of the label)", await p.eval(`document.querySelector("${CTL}").getBoundingClientRect().left > document.querySelector("#stage [data-slot=checkbox-label]").getBoundingClientRect().left`), true);
  check("right to left: the glyph is not mirrored, so the wipe stays left to right", await p.eval(`(()=>{const c=document.querySelector("${CTL}");c.setAttribute("data-state","unchecked");document.querySelector('${MARK("check")}').style.transition="none";const v=[getComputedStyle(document.querySelector('${MARK("check")}')).clipPath,getComputedStyle(document.querySelector('${MARK("check")} [data-slot=icon]')).transform];c.setAttribute("data-state","checked");return v})()`), ["inset(0px 100% 0px 0px)", "none"]);

  /* layout="row" (example 6): fills an option row; the box is drawn the same */
  await open(fw, 6);
  check("row: the shared option row; 30px tall, as wide as its box (240px); the box 16px, centred on the text line and the row", await p.eval(`(()=>{const r=document.querySelector("#stage [data-slot=checkbox]");const b=r.getBoundingClientRect(),c=document.querySelector("${CTL}").getBoundingClientRect(),t=document.querySelector("#stage [data-slot=checkbox-label]").getBoundingClientRect();return [r.classList.contains("min-h-[var(--option-height,30px)]"), b.height, b.width, c.width, Math.abs((c.top+c.height/2)-(t.top+t.height/2))<0.5, Math.abs((c.top+c.height/2)-(b.top+b.height/2))<0.5, getComputedStyle(r).paddingInlineStart, getComputedStyle(r).borderTopLeftRadius]})()`), [true, 30, 240, 16, true, true, "8px", "6px"]);
  r = await press("#stage [data-slot=checkbox-label]"); await sleep(260);
  check("row: press darkens the row (hover-2) and scales the box (press-scale-sm)", [await p.eval(`(()=>{const probe=document.createElement("i");probe.style.background="var(--fndn-hover-2)";document.body.append(probe);const want=getComputedStyle(probe).backgroundColor;probe.remove();return getComputedStyle(document.querySelector("#stage [data-slot=checkbox]")).backgroundColor===want})()`), await scaleOf(CTL)], [true, 0.9]);
  await release(r); await sleep(300);
  check("row: a click on the row toggles", await state(), ["unchecked", false]);

  /* size="md" and tone (examples 7 and 8) */
  for (const [ex, tone, colour] of [[7, "red", "--fndn-red"], [8, "green", "--fndn-green"]]) {
    await open(fw, ex);
    check(`md ${tone}: an 18px box with the ${tone} fill and a white mark`, await p.eval(`(()=>{const probe=document.createElement("i");probe.style.background="var(${colour})";probe.style.color="var(--fndn-on-accent)";document.body.append(probe);const want=[getComputedStyle(probe).backgroundColor,getComputedStyle(probe).color];probe.remove();const r=document.querySelector("#stage [data-slot=checkbox]"),c=document.querySelector("${CTL}"),b=c.getBoundingClientRect(),cs=getComputedStyle(c);return [b.width, b.height, cs.backgroundColor===want[0], cs.color===want[1]]})()`), [18, 18, true, true]);
  }
  await p.rate(0.1);
  await p.clickSel(CTL); await sleep(20);
  const offMd = await inFlight();
  check("md green: unchecking runs the same exit (mark fades over fast, the fill follows)", offMd.filter((x) => x[0] === "mark=check").map((x) => x.slice(1, 4)), (g) => g.some((x) => x[0] === "opacity" && x[2] === 100));
  await p.rate(1); await sleep(300);
  check("md green: unchecked, the box is back to the ring", await state(), ["unchecked", false]);

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
