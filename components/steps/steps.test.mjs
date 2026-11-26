// Steps: the task rows' badge, mark and rail (sizes, colours), the three marker states, horizontal and
// vertical geometry, pointer (a marker sets the step, Back / Next are Buttons) and keyboard (Tab
// order, Enter instant), linear, the completed panel, worst cases, right-to-left, dark.
//   node components/steps/steps.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "steps";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
/* hover: true makes headless Chromium report a mouse, so the gated hover rules apply */
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);
const away = async () => { await p.hover(1200, 860); await sleep(250); };

const R = "#stage [data-slot=steps]";
const ITEM = (i) => `${R} [data-slot=steps-item]:nth-child(${i + 1})`;
const TRIG = (i) => `${ITEM(i)} > [data-slot=steps-trigger]`;
const IND = (i) => `${TRIG(i)} [data-slot=steps-indicator]`;
const SEP = (i) => `${ITEM(i)} > [data-slot=steps-separator]`;
/* per step: state, marker fill, figure and check opacity */
const states = () => q(`[...document.querySelectorAll(${JSON.stringify(R + " [data-slot=steps-item]")})].map((it)=>{const t=it.querySelector("[data-slot=steps-trigger]");return t.hasAttribute("data-complete")?"done":t.hasAttribute("data-current")?"current":"todo"})`);
const panel = () => q(`(()=>{const v=[...document.querySelectorAll(${JSON.stringify(R + " :is([data-slot=steps-content],[data-slot=steps-completed])")})].filter((e)=>!e.hidden&&e.getClientRects().length);return v.map((e)=>e.textContent)})()`);
const rect = (sel) => q(`(()=>{const b=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2,r:b.right,b:b.bottom}})()`);
const style = (sel, keys) => q(`(()=>{const s=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(keys)}.map((k)=>s[k])})()`);
const focusedIndex = () => q(`(()=>{const it=document.activeElement?.closest?.("[data-slot=steps-item]");return it?[...it.parentElement.children].indexOf(it):document.activeElement?.dataset?.steps??document.activeElement?.dataset?.slot??null})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("tablist of three tab triggers; step 2 current (aria-selected, aria-current=step), nothing animating at mount", await q(`(()=>{const l=document.querySelector("${R} [data-slot=steps-list]");const t=[...l.querySelectorAll("[data-slot=steps-trigger]")];return [l.getAttribute("role"),t.map((x)=>x.getAttribute("role")+":"+x.getAttribute("aria-selected")+":"+(x.getAttribute("aria-current")??"")).join(" "),document.getAnimations().length]})()`), ["tablist", "tab:false: tab:true:step tab:false:", 0]);
  check("states: done, current, to do", await states(), ["done", "current", "todo"]);
  const [green, ink, line, lineStrong, onAccent, onInk, ink2] = [await token("--fndn-green"), await token("--fndn-ink"), await token("--fndn-line"), await token("--fndn-line-strong", "borderTopColor"), await token("--fndn-on-accent", "color"), await token("--fndn-on-ink", "color"), await token("--fndn-ink-2", "color")];
  check("markers are 24px circles", await q(`[...document.querySelectorAll("${R} [data-slot=steps-indicator]")].map((e)=>{const b=e.getBoundingClientRect();return [Math.round(b.width),Math.round(b.height),getComputedStyle(e).borderRadius]})`), [[24, 24, "50%"], [24, 24, "50%"], [24, 24, "50%"]]);
  check("done: the task rows' mark (green, white check shown, figure hidden)", [await style(IND(0), ["backgroundColor", "color"]), await style(`${IND(0)} [data-slot=steps-check]`, ["opacity"]), await style(`${IND(0)} [data-slot=steps-number]`, ["opacity"])], [[green, onAccent], ["1"], ["0"]]);
  check("current: ink fill, on-ink figure 10.5px/600", await style(IND(1), ["backgroundColor", "color"]).then(async (v) => [...v, ...(await style(`${IND(1)} [data-slot=steps-number]`, ["fontSize", "fontWeight"]))]), [ink, onInk, "10.5px", "600"]);
  check("to do: a 1px line-strong ring, ink-2 figure, no fill", await style(IND(2), ["borderTopColor", "color", "backgroundColor"]).then(async (v) => [...v, Math.round(parseFloat((await style(IND(2), ["borderTopWidth"]))[0]) * 1.25)]), [lineStrong, ink2, "rgba(0, 0, 0, 0)", 1]);
  /* the rail: 1px, at the markers' middle, 6px from each marker; green after a done step */
  const m0 = await rect(IND(0)), m1 = await rect(IND(1)), s0 = await rect(SEP(0)), s1 = await rect(SEP(1));
  check("horizontal rail: one device pixel tall, on the markers' middle (±0.5px), 6px from each marker", [Math.round(s0.h * 1.25), Math.abs(s0.cy - m0.cy) <= 0.5, Math.round(s0.x - m0.r), Math.round(m1.x - s0.r)], [1, true, 6, 6]);
  check("rail colours: green after a done step, line after the current one; none after the last", [await style(SEP(0), ["backgroundColor"]), await style(SEP(1), ["backgroundColor"]), await q(`!!document.querySelector(${JSON.stringify(SEP(2))})`)], [[green], [line], false]);
  check("each step's title is under its marker, starting on its edge", await q(`(()=>{const i=document.querySelector(${JSON.stringify(IND(1))}).getBoundingClientRect();const t=document.querySelector("${TRIG(1)} [data-slot=steps-title]").getBoundingClientRect();return [Math.round(t.x-i.x),t.y>=i.bottom]})()`), [0, true]);
  check("title 13px/500: ink when done or current, ink-2 to do; description 12px ink-2",[await style(`${TRIG(0)} [data-slot=steps-title]`, ["fontSize", "fontWeight", "color"]), await style(`${TRIG(2)} [data-slot=steps-title]`, ["color"]), await style(`${TRIG(0)} [data-slot=steps-description]`, ["fontSize", "color"])], [["13px", "500", await token("--fndn-ink", "color")], [await token("--fndn-ink-2", "color")], ["12px", await token("--fndn-ink-2", "color")]]);
  check("the current panel only", await panel(), ["Name your workspace and invite the team."]);

  /* pointer */
  await p.clickSel(TRIG(2)); const arrive = await q(`document.getAnimations().filter((a)=>a.effect.target.dataset.slot==="steps-check").map((a)=>a.transitionProperty+":"+a.effect.getTiming().duration+"+"+a.effect.getTiming().delay).sort()`); await sleep(350);
  check("click a later marker: it becomes current, the ones before are done, its panel shows", [await states(), await panel()], [["done", "done", "current"], ["Pick a plan."]]);
  check("the check arrives by transition (pointer): opacity at base, scale at press", arrive, ["opacity:150+0", "transform:160+0"]);
  check("the check arrives by transition (pointer)", await q(`getComputedStyle(document.querySelector("${IND(1)} [data-slot=steps-check]")).transitionDuration.split(", ").some((d)=>d!=="0s")`), true);
  const r0 = await rect(TRIG(0));
  await p.hover(r0.cx, r0.cy); await sleep(200);
  check("hover a marker: the trigger fills hover (fine pointer)", await style(TRIG(0), ["backgroundColor"]), [await token("--fndn-hover")]);
  await away();
  await p.clickSel(`${R} [data-steps=prev]`); const leave = await q(`document.getAnimations().filter((a)=>a.effect.target.dataset.slot==="steps-check").map((a)=>a.transitionProperty+":"+a.effect.getTiming().duration+"+"+a.effect.getTiming().delay).sort()`); await sleep(300);
  check("undone by Back: the check leaves shorter and simpler (opacity over fast; the scale resets after it)", leave, ["opacity:100+0", "transform:0+100"]);
  check("Back (a real Button): one step back", [await states(), await q(`document.querySelector("${R} [data-steps=prev]").dataset.slot`)], [["done", "current", "todo"], "button"]);
  await p.clickSel(`${R} [data-steps=next]`); await sleep(100); await p.clickSel(`${R} [data-steps=next]`); await sleep(300);
  check("Next past the last step: every step done, the completed panel shows, Next disabled", [await states(), await panel(), await q(`document.querySelector("${R} [data-steps=next]").disabled`)], [["done", "done", "done"], ["Your workspace is ready."], true]);

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab: the first marker", await focusedIndex(), 0);
  await p.key("Tab"); await p.key("Tab");
  check("Tab again: each marker in turn", await focusedIndex(), 2);
  await p.key("Enter"); await sleep(40);
  check("Enter: that step becomes current at once (check already shown 40ms in)", [await states(), await style(`${IND(1)} [data-slot=steps-check]`, ["opacity"])], [["done", "done", "current"], ["1"]]);
  await p.key("Tab");
  check("Tab from the markers: the current panel (focusable)", await focusedIndex(), "steps-content");
  await p.key("Tab");
  check("then Back", await focusedIndex(), "prev");

  /* vertical */
  await open(fw, 1);
  const v0 = await rect(IND(0)), vs = await rect(SEP(0)), v1 = await rect(IND(1));
  check("vertical: the rail runs down the marker column (centre ±0.5px), 4px under this marker to 4px above the next", [Math.round(vs.w * 1.25), Math.abs(vs.cx - v0.cx) <= 0.5, Math.round(vs.y - v0.b), Math.round(v1.y - vs.b)], [1, true, 4, 4]);
  check("vertical: the title beside the marker, its first line centred on it (±0.5px)", await q(`(()=>{const i=document.querySelector(${JSON.stringify(IND(0))}).getBoundingClientRect();const r=document.createRange();r.selectNodeContents(document.querySelector("${TRIG(0)} [data-slot=steps-title]"));const l=r.getClientRects()[0];return [l.x>i.right,Math.abs((l.y+l.height/2)-(i.y+i.height/2))<=0.5]})()`), [true, true]);

  /* linear */
  await open(fw, 2);
  await p.clickSel(TRIG(2)); await sleep(200);
  check("linear: a click on a marker does nothing; only the current one is in the tab order", [await states(), await q(`[...document.querySelectorAll("${R} [data-slot=steps-trigger]")].map((t)=>t.tabIndex)`)], [["current", "todo", "todo"], [0, -1, -1]]);
  const rl = await rect(TRIG(1));
  await p.hover(rl.cx, rl.cy); await sleep(200);
  check("linear: no hover fill", await style(TRIG(1), ["backgroundColor"]), ["rgba(0, 0, 0, 0)"]);
  await away();
  await p.clickSel(`${R} [data-steps=next]`); await sleep(300);
  check("linear: Next moves on", await states(), ["done", "current", "todo"]);
  check("Back is disabled on the first step only", await q(`document.querySelector("${R} [data-steps=prev]").disabled`), false);

  await open(fw, 3);
  check("all done at mount: every marker done, the completed panel", [await states(), await panel()], [["done", "done", "done"], ["All three steps are done."]]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long titles wrap whole in their columns; nothing overflows 360px", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.scrollWidth<=e.clientWidth+1,[...e.querySelectorAll("[data-slot=steps-title],[data-slot=steps-description]")].every((n)=>n.scrollWidth<=n.clientWidth+1),document.querySelector("${TRIG(0)} [data-slot=steps-title]").getBoundingClientRect().height>24]})()`), [true, true, true]);
  check("horizontal: a wrapped title keeps one leading (no 24px first line under the marker)", await q(`(()=>{const r=document.createRange();r.selectNodeContents(document.querySelector("${TRIG(0)} [data-slot=steps-title]"));const ys=[...r.getClientRects()].map((b)=>b.y);const gaps=ys.slice(1).map((y,i)=>Math.round((y-ys[i])*10)/10);return [gaps.length>1,new Set(gaps).size]})()`), [true, 1]);
  await open(fw, 1, "&data=worst");
  check("eight steps at 288px: markers do not overlap, nothing overflows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const m=[...e.querySelectorAll("[data-slot=steps-indicator]")].map((x)=>x.getBoundingClientRect());return [m.slice(1).every((b,i)=>b.x>=m[i].right),e.scrollWidth<=e.clientWidth+1]})()`), [true, true]);
  await open(fw, 2, "&data=worst&dir=rtl");
  const a = await rect(IND(0)), b = await rect(IND(1));
  check("rtl: the first step on the right, the rail between the markers, Next at the far (left) end", [a.x > b.x, await q(`(()=>{const s=document.querySelector(${JSON.stringify(SEP(0))}).getBoundingClientRect();return s.x>=${b.r}-0.5&&s.right<=${a.x}+0.5})()`), await q(`document.querySelector("${R} [data-steps=next]").getBoundingClientRect().x<document.querySelector("${R} [data-steps=prev]").getBoundingClientRect().x`)], [true, true, true]);
  await open(fw, 3, "&data=worst");
  check("vertical long text at 240px: wraps, nothing overflows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return e.scrollWidth<=e.clientWidth+1})()`), true);
  await open(fw, 4, "&data=worst");
  check("one step: no rail", await q(`document.querySelectorAll("${R} [data-slot=steps-separator]").length`), 0);
  await open(fw, 1, "&theme=dark");
  check("dark: current marker in the dark ink, done in the dark green", [await style(IND(2), ["backgroundColor"]), await style(IND(0), ["backgroundColor"])], [[await token("--fndn-ink")], [await token("--fndn-green")]]);
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
