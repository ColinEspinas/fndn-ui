// Keyboard, pointer and thumb contract of the segmented control, run against every target.
//   node components/segmented-control/segmented-control.test.mjs            all four targets
//   node components/segmented-control/segmented-control.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
/* hover: true makes headless Chromium report a mouse, so the gated hover colour is part of the press sequence */
const p = await launch({ dpr: 2, hover: true });
let failed = 0;

/* an example with props changed, mounted in this target through the harness module (into the stage, or into \`into\`) */
const mountWith = (fw, ex, props, into = "#stage") => p.eval(`(async()=>{const spec=(await (await import("/src/harness/specs.ts")).specOf("segmented-control"));const e=spec.examples[${ex}];const {mountExample}=await import("/src/harness/mount.ts");await mountExample(document.querySelector(${JSON.stringify(into)}),{...spec,examples:[{...e,props:{...e.props,...${JSON.stringify(props)}}}]},"${fw}",0);return true})()`);
const open = async (fw, ex, theme = "light", extra = "") => {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=segmented-control&fw=${fw}&ex=${ex}&theme=${theme}${extra}`, 300);
  /* wait for the harness, the control and its engine (a missing element once crashed getComputedStyle) */
  let ready = false;
  for (let t = 0; t < 100 && !ready; t++) {
    ready = await p.eval(`location.search.includes("fw=${fw}&ex=${ex}&") && "harnessReady" in document.documentElement.dataset && !!document.querySelector("[data-slot=segmented-control][data-scope] > [data-slot=segmented-control-thumb]:not([hidden])")`).catch(() => false);
    if (!ready) await sleep(100);
  }
  if (!ready) throw new Error(`example ${ex} did not mount in ${fw} within 10s: ${JSON.stringify(p.errors.slice(0, 1))}`);
  await sleep(350);
};

/* Press an option for 120ms and release, sampling every frame from the press to 300ms after the
 * release: backgrounds (the thumb's paint is on its ::before), layout positions, outlines, label colours. */
const SAMPLE = `(()=>{const root=document.querySelector("[data-slot=segmented-control]");const thumb=root.querySelector("[data-slot=segmented-control-thumb]");
  const els=[root,...root.querySelectorAll("[data-slot=segmented-control-option],[data-slot=segmented-control-label],[data-slot=icon]")];
  window.__frames=[];window.__sampling=true;
  const f=()=>{const tb=thumb.getBoundingClientRect();
    window.__frames.push({thumb:{x:+tb.x.toFixed(2),bg:getComputedStyle(thumb,"::before").backgroundColor,own:getComputedStyle(thumb).backgroundColor},
      els:els.map((e)=>{const cs=getComputedStyle(e);return {k:e.dataset.slot||"icon",bg:cs.backgroundColor,bgb:getComputedStyle(e,"::before").backgroundColor,pos:[e.offsetLeft,e.offsetTop,e.offsetWidth],outline:cs.outlineStyle,color:cs.color}})});
    if(window.__sampling)requestAnimationFrame(f)};requestAnimationFrame(f)})()`;
const press = async (sel, holdMs = 120, afterMs = 300) => {
  const r = await p.rect(sel);
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.cx, y: r.cy }); await sleep(40);
  await p.eval(SAMPLE);
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", clickCount: 1 });
  await sleep(holdMs);
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.cx, y: r.cy, button: "left", clickCount: 1 });
  await sleep(afterMs);
  await p.eval(`window.__sampling=false`);
  return p.eval(`window.__frames`);
};
/* What changed across the frames, other than the thumb's travel and the label colours */
const changes = (frames) => {
  const out = [];
  const first = frames[0];
  if (!first) return ["no frames"];
  frames.forEach((fr) => {
    if (fr.thumb.bg !== first.thumb.bg || fr.thumb.own !== first.thumb.own) out.push(`thumb background ${first.thumb.bg} → ${fr.thumb.bg}`);
    fr.els.forEach((e, i) => {
      const a = first.els[i];
      if (e.bg !== a.bg || e.bgb !== a.bgb) out.push(`${e.k}#${i} background ${a.bg} → ${e.bg}`);
      if (JSON.stringify(e.pos) !== JSON.stringify(a.pos)) out.push(`${e.k}#${i} position ${a.pos} → ${e.pos}`);
      if (e.outline !== "none") out.push(`${e.k}#${i} outline ${e.outline}`);
    });
  });
  return [...new Set(out)].slice(0, 4);
};
/* a label's colour runs one way between its two end colours (no detour through a third) */
const lightness = (c) => { const m = c.match(/^okl(?:ab|ch)\(([\d.]+)/) ?? c.match(/^rgba?\((\d+)/); return m ? parseFloat(m[1]) : NaN; };
const detours = (frames) => {
  const bad = [];
  frames[0]?.els.forEach((e, i) => {
    if (!e.k.endsWith("__label")) return;
    const ls = frames.map((f) => lightness(f.els[i].color));
    const up = ls.every((v, j) => j === 0 || v >= ls[j - 1] - 0.002), down = ls.every((v, j) => j === 0 || v <= ls[j - 1] + 0.002);
    if (!up && !down) bad.push(`label#${i}: ${[...new Set(ls.map((v) => v.toFixed(3)))].join(" ")}`);
  });
  return bad;
};
const radii = () => p.eval(`(()=>{const r=document.querySelector("[data-slot=segmented-control]"),t=r.querySelector("[data-slot=segmented-control-thumb]"),o=r.querySelector("[data-slot=segmented-control-option]");return [getComputedStyle(r).borderTopLeftRadius,getComputedStyle(t).borderTopLeftRadius,getComputedStyle(t,"::before").borderTopLeftRadius,getComputedStyle(o).borderTopLeftRadius]})()`);
const checked = () => p.eval(`document.querySelector('[data-slot=segmented-control-option][data-state="checked"] [data-slot=segmented-control-label]')?.textContent.trim() ?? null`);
const focused = () => p.eval(`document.activeElement?.closest?.("[data-slot=segmented-control-option]")?.querySelector("[data-slot=segmented-control-label]")?.textContent.trim() ?? null`);
/* how far the thumb is from the selected segment's box, in px */
const drift = () => p.eval(`(()=>{const t=document.querySelector("[data-slot=segmented-control-thumb]");const o=document.querySelector('[data-slot=segmented-control-option][data-state="checked"]');if(!t||!o||t.hidden)return null;const a=t.getBoundingClientRect(),b=o.getBoundingClientRect();return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height),Math.abs((a.y+a.height/2)-(b.y+b.height/2)))})()`);
const thumbStyle = (prop) => p.eval(`getComputedStyle(document.querySelector("[data-slot=segmented-control-thumb]")).${prop}`);

for (const fw of targets) {
 /* a reload caused by someone else's edit can break one run: retry a target up to three times */
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => {
    const ok = typeof want === "function" ? want(got) : JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failed++;
    checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  };
  const near = (px) => (v) => v !== null && v <= px;
  try {

  await open(fw, 0);
  check("is a radiogroup with one selected segment", await p.eval(`[document.querySelector("[data-slot=segmented-control]").getAttribute("role"), document.querySelectorAll('[data-slot=segmented-control-option][data-state="checked"]').length, document.querySelectorAll("[data-slot=segmented-control-input]:checked").length]`), ["radiogroup", 1, 1]);
  check("thumb covers the selected segment on mount", await drift(), near(0.6));
  check("no slide-in on mount (transition is off until a selection)", await thumbStyle("transitionProperty"), "none");
  /* the thumb is measured before the first paint (scrollSelected in a layout effect): the first frame
   * laid out with the control already has its thumb, never a hidden or 0px one (a docs page swap) */
  check("a fresh mount: the thumb is there from the first frame", await p.eval(`(async()=>{
    const spec=(await (await import("/src/harness/specs.ts")).specOf("segmented-control"));const {mountExample}=await import("/src/harness/mount.ts");
    const out=[];const probe=document.createElement("div");probe.style.cssText="position:fixed;top:0;left:0;height:1px";document.body.append(probe);let k=1,n=0;
    const ro=new ResizeObserver(()=>{const t=document.querySelector("#qa-fresh [data-slot=segmented-control-thumb]");if(t)out.push(t.hidden?"hidden":t.getBoundingClientRect().width>1?"ok":"0px")});ro.observe(probe);
    const tick=()=>{probe.style.width=(k++%2+1)+"px";if(n++<12)requestAnimationFrame(tick)};requestAnimationFrame(tick);
    const box=document.createElement("div");box.id="qa-fresh";document.body.append(box);
    await mountExample(box,spec,"${fw}",0);await new Promise((r)=>setTimeout(r,400));ro.disconnect();probe.remove();box.hidden=true;
    return out.length>0&&out[0]})()`), "ok");
  check("track height is segment height + 4px", await p.eval(`(()=>{const r=document.querySelector("[data-slot=segmented-control]").getBoundingClientRect(),o=document.querySelector("[data-slot=segmented-control-option]").getBoundingClientRect();return [r.height,o.height]})()`), [24, 20]);

  await p.key("Tab"); await sleep(60);
  check("Tab reaches the selected segment", await focused(), "Steps");
  check("keyboard focus shows a ring on the segment", await p.eval(`getComputedStyle(document.querySelector('[data-slot=segmented-control-option][data-state="checked"]')).outlineStyle`), "solid");
  await p.key("ArrowRight"); await sleep(80);
  check("ArrowRight selects and focuses the next segment", [await checked(), await focused()], ["Reasoning", "Reasoning"]);
  check("a keyboard selection moves the thumb instantly", [await p.eval(`document.documentElement.dataset.fndnInput`), (await thumbStyle("transitionDuration")).split(",").every((d) => parseFloat(d) === 0), (await drift()) <= 0.6], ["keyboard", true, true]);
  await p.key("ArrowLeft"); await sleep(60);
  await p.key("ArrowLeft"); await sleep(60);
  check("ArrowLeft wraps from the first to the last segment", await checked(), "Coding");
  await p.key("Home"); await sleep(80);
  check("Home selects the first segment", [await checked(), await focused()], ["Steps", "Steps"]);
  await p.key("End"); await sleep(80);
  check("End selects the last segment", [await checked(), await focused()], ["Coding", "Coding"]);
  await p.key("Tab"); await sleep(60);
  check("the group is one tab stop", await p.eval(`!!document.activeElement?.closest?.("[data-slot=segmented-control]")`), false);

  await p.clickSel("[data-slot=segmented-control-option]:nth-of-type(3)"); await sleep(40);
  check("click selects", await checked(), "Search");
  check("a pointer selection slides the thumb on transform", [await p.eval(`document.documentElement.dataset.fndnInput`), (await thumbStyle("transitionProperty")).includes("transform"), parseFloat(await thumbStyle("transitionDuration")) > 0], ["pointer", true, true]);
  await sleep(450);
  check("thumb lands on the clicked segment and the transition switches off again", [(await drift()) <= 0.6, await thumbStyle("transitionProperty")], [true, "none"]);
  await p.eval(`document.querySelector('[data-slot=segmented-control-option][data-state="checked"] [data-slot=segmented-control-label]').textContent = "Search results"`); await sleep(150);
  check("a size change (longer label, late font) re-fits the thumb without animating", [(await drift()) <= 0.6, await thumbStyle("transitionProperty")], [true, "none"]);
  check("no console errors", p.errors.slice(0, 2), []);

  await open(fw, 2);
  await p.key("Tab"); await sleep(60);
  await p.key("ArrowRight"); await sleep(80);
  check("arrows skip a disabled segment", await checked(), "Year");
  await p.key("Home"); await sleep(80);
  check("Home / End use enabled segments", await checked(), "Day");
  await p.eval(`document.querySelector("[data-slot=segmented-control-option]:nth-of-type(3)").click()`); await sleep(80);
  check("a disabled segment cannot be selected", [await checked(), await p.eval(`document.querySelector("[data-slot=segmented-control-option]:nth-of-type(3)").hasAttribute("data-disabled")`)], ["Day", true]);
  check("no console errors (disabled example)", p.errors.slice(0, 2), []);

  /* press: no background flash, in both themes, xs and md */
  for (const [ex, theme, what] of [[0, "light", "xs"], [1, "light", "md fill"], [0, "dark", "xs"], [1, "dark", "md fill"], [4, "light", "rounded"]]) {
    await open(fw, ex, theme);
    const frames = await press("[data-slot=segmented-control-option]:nth-of-type(2)");
    const moved = new Set(frames.map((f) => f.thumb.x)).size > 2;
    check(`press + 300ms after release (${what}, ${theme}): only the thumb changes background or position; no focus ring`, [changes(frames), moved], [[], true]);
    check(`label colours run straight between their two colours (${what}, ${theme})`, detours(frames), []);
  }
  await open(fw, 0);
  const sel = '[data-slot=segmented-control-option][data-state="checked"]';
  const r = await p.rect(sel);
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.cx, y: r.cy });
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", clickCount: 1 });
  await sleep(260);
  const held = await p.eval(`[getComputedStyle(document.querySelector("[data-slot=segmented-control-thumb]"),"::before").scale, getComputedStyle(document.querySelector(${JSON.stringify(sel)})).scale, getComputedStyle(document.querySelector(${JSON.stringify(sel)})).backgroundColor, getComputedStyle(document.querySelector("[data-slot=segmented-control-thumb]")).transform]`);
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.cx, y: r.cy, button: "left", clickCount: 1 });
  await sleep(300);
  const released = await p.eval(`getComputedStyle(document.querySelector("[data-slot=segmented-control-thumb]"),"::before").scale`);
  check("pressing the selected segment scales the thumb (scale, translate untouched) and its content, no background", [held[0], held[1], held[2], held[3] === "none" ? "none" : "matrix", ["none", "1"].includes(released)], ["0.97", "0.97", "rgba(0, 0, 0, 0)", "matrix", true]);

  /* shape */
  await open(fw, 0);
  check("no shape named, the app's: a pill, fully round track and concentric thumb", [await radii()], [["999px", "997px", "997px", "997px"]]);
  await open(fw, 4);
  check("rounded md: track radius.control (8px), thumb and segments 6px (concentric)", [await radii()], [["8px", "6px", "6px", "6px"]]);
  check("rounded: thumb covers the selected segment", await drift(), near(0.6));
  /* xs and md and fill take the shape too (examples 0 and 1 with shape: "rounded"): the radius of
   * a field of the same height, radius.chip up to 28px and radius.control from 32px */
  for (const [ex, what, track, thumb] of [[0, "xs", "6px", "4px"], [1, "md fill", "8px", "6px"]]) {
    await mountWith(fw, ex, { shape: "rounded" }); await sleep(300);
    check(`rounded ${what}: track ${track}, thumb and segments ${thumb}, thumb on the segment`, [await radii(), (await drift()) <= 0.6], [[track, thumb, thumb, thumb], true]);
  }
  /* the app's shape: <html data-shape="rounded"> rounds a control that names no shape (a field's
   * corners at its height); one that names pill stays a pill */
  await open(fw, 0);
  await p.eval(`document.documentElement.dataset.shape="rounded"`); await sleep(60);
  check("in a rounded app an xs control that names no shape: track radius.chip (6px), thumb 4px, thumb on the segment", [await radii(), (await drift()) <= 0.6], [["6px", "4px", "4px", "4px"], true]);
  await mountWith(fw, 1, { shape: "pill" }); await sleep(300);
  check("in a rounded app a control that names pill stays a pill", (await radii())[0], "999px");
  await p.eval(`delete document.documentElement.dataset.shape`);
  check("no console errors (press and shape)", p.errors.slice(0, 2), []);

  /* variant="chips" (example 5) */
  await open(fw, 5);
  const chipsLook = () => p.eval(`(()=>{const r=document.querySelector("[data-slot=segmented-control]");const os=[...r.querySelectorAll("[data-slot=segmented-control-option]")];
    return {track:getComputedStyle(r).backgroundColor,heights:[...new Set(os.map((o)=>o.getBoundingClientRect().height))],
      gaps:[...new Set(os.slice(1).map((o,i)=>Math.round(o.getBoundingClientRect().left-os[i].getBoundingClientRect().right)))],
      painted:os.filter((o)=>o.dataset.state!=="checked").map((o)=>[getComputedStyle(o).backgroundColor,getComputedStyle(o).boxShadow]).filter(([b,s])=>b!=="rgba(0, 0, 0, 0)"||s!=="none").length}})()`);
  check("chips: no track, 26px chips 4px apart, unselected chips paint nothing", await chipsLook(), { track: "rgba(0, 0, 0, 0)", heights: [26], gaps: [4], painted: 0 });
  check("chips: the thumb covers the selected chip on mount, no slide-in", [(await drift()) <= 0.6, await thumbStyle("transitionProperty")], [true, "none"]);
  check("chips: the label holds the dot, the text and the count, and names the radio", await p.eval(`(()=>{const o=document.querySelectorAll("[data-slot=segmented-control-option]")[1];const l=o.querySelector("[data-slot=segmented-control-label]");const i=o.querySelector("input");const named=i.getAttribute("aria-labelledby")?document.getElementById(i.getAttribute("aria-labelledby"))?.textContent.trim():o.textContent.trim();return [!!l.querySelector("[data-slot=segmented-control-dot][aria-hidden=true]"),l.querySelector("[data-slot=count]")?.textContent,named]})()`), [true, "2", "To do 2"]);
  await p.clickSel("[data-slot=segmented-control-option]:nth-of-type(3)"); await sleep(40);
  check("chips: a click slides the one thumb (transform), never a per-chip fade", [await checked(), (await thumbStyle("transitionProperty")).includes("transform"), parseFloat(await thumbStyle("transitionDuration")) > 0, (await chipsLook()).painted], ["In progress 2", true, true, 0]);
  await sleep(450);
  check("chips: the thumb lands on the clicked chip", (await drift()) <= 0.6, true);
  await p.key("ArrowRight"); await sleep(80);
  check("chips: arrow keys select instantly", [await checked(), (await thumbStyle("transitionDuration")).split(",").every((d) => parseFloat(d) === 0), (await drift()) <= 0.6], ["Completed 1", true, true]);
  {
    const frames = await press("[data-slot=segmented-control-option]:nth-of-type(2)");
    check("chips: press + 300ms after release: only the thumb changes background or position", changes(frames), []);
  }
  await p.eval(`document.querySelector("[data-slot=segmented-control]").style.width = "200px"`); await sleep(100);
  check("chips: the row scrolls sideways when the chips do not fit", await p.eval(`(()=>{const r=document.querySelector("[data-slot=segmented-control]");return [getComputedStyle(r).overflowX, r.scrollWidth > r.clientWidth, Math.round(r.getBoundingClientRect().height)]})()`), ["auto", true, 34]);
  await p.key("Home"); await sleep(120);
  await p.key("End"); await sleep(120);
  check("chips: End selects the last chip; the thumb sits on it inside the scrolled row", [await checked(), (await drift()) <= 0.6], ["Completed 1", true]);
  check("no console errors (chips)", p.errors.slice(0, 2), []);

  /* right to left: arrows move in the visual direction, the thumb sits on the selection */
  for (const ex of [0, 5]) {
    await open(fw, ex, "light", "&dir=rtl");
    const xs = await p.eval(`[...document.querySelectorAll("[data-slot=segmented-control-option]")].map((o)=>Math.round(o.getBoundingClientRect().x))`);
    await p.key("Tab"); await sleep(60);
    const start = await focused();
    await p.key("ArrowLeft"); await sleep(80);
    const left = await p.eval(`(()=>{const o=document.querySelector('[data-slot=segmented-control-option][data-state="checked"]');return Math.round(o.getBoundingClientRect().x)})()`);
    check(`right to left (${ex ? "chips" : "segments"}): first segment at the right, ArrowLeft selects the one to its left, the thumb sits on it`, [xs[0] > xs[1], start !== (await focused()), left < xs[0], (await drift()) <= 0.6, await p.eval(`document.querySelector("[data-slot=segmented-control]").getAttribute("dir")`)], [true, true, true, true, "rtl"]);
    await p.key("ArrowRight"); await sleep(80);
    check(`right to left (${ex ? "chips" : "segments"}): ArrowRight goes back to the right`, [await focused(), (await drift()) <= 0.6], [start, true]);
  }

  } catch (e) { failed++; checks.push(`✗ crashed: ${String(e?.message ?? e).split("\n")[0]}`); }

  if (failed > before && attempt < 2) { console.log(`${fw}: attempt ${attempt + 1} failed, retrying — ${checks.filter((c) => c.startsWith("✗")).join(" | ")}`); failed = before; continue; }
  console.log(`${fw}${attempt ? ` (attempt ${attempt + 1})` : ""}\n  ${checks.join("\n  ")}`);
  break;
 }
}
/* options that do not fit: the row scrolls sideways (data-overflow), labels whole, height kept,
 * veils on the side(s) with more, the selection kept in view (End from the keyboard: instant), the
 * thumb still on it; back to the fitting layout (no data-overflow, nothing clipped) when it fits */
for (const fw of targets) {
  await p.goto(`${BASE}/harness.html?c=segmented-control&fw=${fw}&ex=0`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset && !!document.querySelector("[data-slot=segmented-control][data-scope] > [data-slot=segmented-control-thumb]:not([hidden])")`).catch(() => false)) break; await sleep(100); }
  await sleep(300);
  const R = `document.querySelector("#stage [data-slot=segmented-control]")`;
  const state = () => p.eval(`(()=>{const r=${R};const cs=getComputedStyle(r);const rr=r.getBoundingClientRect();const o=r.querySelector('[data-slot=segmented-control-option][data-state="checked"]').getBoundingClientRect();const veil=(w)=>+getComputedStyle(r,w).opacity;
    return {over:r.hasAttribute("data-overflow"),ox:cs.overflowX,h:Math.round(rr.height),whole:[...r.querySelectorAll("[data-slot=segmented-control-option]")].every((op)=>{const l=op.querySelector("[data-slot=segmented-control-label]");return l.scrollWidth<=Math.ceil(l.getBoundingClientRect().width)+0.5&&op.getBoundingClientRect().width>=l.getBoundingClientRect().width}),
      inView:o.left>=rr.left+15&&o.right<=rr.right-15||o.left>=rr.left&&o.right<=rr.right&&(r.scrollLeft<=0||Math.abs(r.scrollLeft)>=r.scrollWidth-r.clientWidth-1),scroll:Math.round(Math.abs(r.scrollLeft)),veils:[veil("::before"),veil("::after")],
      drift:(()=>{const t=r.querySelector("[data-slot=segmented-control-thumb]").getBoundingClientRect();return Math.max(Math.abs(t.x-o.x),Math.abs(t.width-o.width))})()}})()`);
  const fit = await state();
  await p.eval(`${R}.style.width = "130px"`); await sleep(200);
  const squeezed = await state();
  await p.eval(`${R}.querySelector('[data-slot=segmented-control-option][data-state="checked"] input').focus()`);
  await p.key("End"); await sleep(120);
  const end = await state();
  await p.eval(`${R}.style.width = ""`); await sleep(200);
  const back = await state();
  const got = [[fit.over, fit.ox, fit.h], [squeezed.over, squeezed.ox, squeezed.h, squeezed.whole, squeezed.veils], [end.inView, end.scroll > 0, end.drift <= 0.6, end.veils], [back.over, back.ox, back.whole]];
  const want = [[false, "visible", 24], [true, "auto", 24, true, [0, 1]], [true, true, true, [1, 0]], [false, "visible", true]];
  let ok = JSON.stringify(got) === JSON.stringify(want);
  /* mount: a control that mounts too narrow, with its last option selected, starts scrolled to it */
  let mount = "skipped";
  {
    /* mounted 130px wide with its last option selected (into a narrow box) */
    await p.eval(`(()=>{const b=document.createElement("div");b.id="qa-narrow";b.style.width="130px";document.querySelector("#stage").replaceChildren(b);return true})()`);
    await mountWith(fw, 0, { value: "coding" }, "#qa-narrow"); await sleep(400);
    mount = await p.eval(`(()=>{const c=document.querySelector("#qa-narrow [data-slot=segmented-control]");const o=c.querySelector('[data-slot=segmented-control-option][data-state="checked"]').getBoundingClientRect(),rr=c.getBoundingClientRect();return [c.hasAttribute("data-overflow"),Math.abs(c.scrollLeft)>0,o.right<=rr.right+0.5]})()`).catch((e) => String(e.message).slice(0, 120));
    if (JSON.stringify(mount) !== JSON.stringify([true, true, true])) ok = false;
  }
  if (!ok) failed++;
  console.log(`${fw}\n  ${ok ? "✓" : "✗"} options that do not fit scroll (labels whole, veils, selection kept in view, thumb on it); fitting is unchanged; mounts scrolled to the selection${ok ? "" : ` — got ${JSON.stringify(got)} mount ${JSON.stringify(mount)}, want ${JSON.stringify(want)}`}`);
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
