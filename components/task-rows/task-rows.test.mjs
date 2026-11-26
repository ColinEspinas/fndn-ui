// Keyboard, pointer, semantics, status-swap and alignment contract of Task Rows, every target.
//   node components/task-rows/task-rows.test.mjs            all four targets
//   node components/task-rows/task-rows.test.mjs react      one target
// Measured at device pixel ratio 2.
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2 });
let failed = 0;

async function open(fw, ex = 0, extra = "") {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=task-rows&fw=${fw}&ex=${ex}${extra}`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(700);
}
const q = (js) => p.eval(js);
const rows = `[...document.querySelectorAll("#stage [data-slot=task-rows] > [data-slot=collapsible]")]`;
const trig = (i) => `${rows}[${i}].querySelector(":scope > [data-slot=collapsible-trigger]")`;
const region = (i) => `${rows}[${i}].querySelector(":scope > [data-slot=collapsible-content]")`;
const pills = `${rows}.map((r)=>r.querySelector("[data-slot=status-pill]")).filter(Boolean)`;
/* vertical (and horizontal) centre offset of a child inside a reference box, CSS px */
const centre = (child, parent) => q(`(()=>{const c=${child},b=${parent};if(!c||!b)return null;const r=c.getBoundingClientRect(),s=b.getBoundingClientRect();return [Math.round((r.x+r.width/2-(s.x+s.width/2))*4)/4, Math.round((r.y+r.height/2-(s.y+s.height/2))*4)/4]})()`);
const textCentre = (el, box) => q(`(()=>{const e=${el},b=${box};const r=document.createRange();r.selectNodeContents(e);const l=r.getBoundingClientRect(),s=b.getBoundingClientRect();return Math.round(((l.y+l.height/2)-(s.y+s.height/2))*4)/4})()`);

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  try {
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  await open(fw);
  check("each row is a collapsible (row): trigger with aria-expanded + aria-controls → its region; data-state on the row", await q(`${rows}.map((r)=>{const t=r.querySelector(":scope > [data-slot=collapsible-trigger]");const d=document.getElementById(t.getAttribute("aria-controls"));return t.tagName+":"+t.getAttribute("aria-expanded")+":"+(d&&r.contains(d)&&d.dataset.slot==="collapsible-content")+":"+r.dataset.slot+":"+r.dataset.state})`),
    ["BUTTON:false:true:collapsible:closed", "BUTTON:true:true:collapsible:open", "BUTTON:false:true:collapsible:closed"]);
  check("closed regions are hidden (out of the tab order)", await q(`${rows}.map((r)=>r.querySelector(":scope > [data-slot=collapsible-content]").hidden)`), [true, false, true]);
  check("every row has one role=status region holding its status text", await q(`${rows}.map((r)=>{const s=r.querySelectorAll("[role=status]");return s.length+":"+s[0].textContent.trim()})`), ["1:Completed", "1:Running", "1:Failed"]);
  check("badges are aria-hidden", await q(`${rows}.every((r)=>r.querySelector("[data-slot=task-rows-badge]").getAttribute("aria-hidden")==="true")`), true);
  check("capsule radius: 22 closed, 14 open", await q(`${rows}.map((r)=>getComputedStyle(r).borderTopLeftRadius)`), ["22px", "14px", "22px"]);
  check("ring number centred in the ring", await centre(`document.querySelector("#stage [data-slot=task-rows-step]")`, `document.querySelector("#stage [data-slot=task-rows-ring]")`).then((c) => c && c.every((v) => Math.abs(v) <= 0.5)), true);
  check("mark glyphs centred in their circles", await q(`${rows}.filter((r)=>r.querySelector("[data-slot=task-rows-mark]")).map((r)=>{const m=r.querySelector("[data-slot=task-rows-mark]"),i=m.querySelector("[data-slot=icon]");const a=i.getBoundingClientRect(),b=m.getBoundingClientRect();return Math.abs(a.x+a.width/2-b.x-b.width/2)<=0.5&&Math.abs(a.y+a.height/2-b.y-b.height/2)<=0.5})`), [true, true]);
  check("badges centred on the trigger", await centre(`document.querySelector("#stage [data-slot=task-rows-badge]")`, trig(0)).then((c) => c && Math.abs(c[1]) <= 0.5), true);
  check("done and failed pills are status-pills, sm (22px), in two tones", await q(`(()=>{const p=${pills};return [...p.map((x)=>x.dataset.slot+":"+x.getBoundingClientRect().height), getComputedStyle(p[0]).color!==getComputedStyle(p[1]).color]})()`), ["status-pill:22", "status-pill:22", true]);
  check("pill labels centred in their pills", await q(`${pills}.map((p)=>{const r=document.createRange();r.selectNodeContents(p.querySelector("[data-slot=status-pill-label]"));const l=r.getBoundingClientRect(),b=p.getBoundingClientRect();return Math.abs((l.y+l.height/2)-(b.y+b.height/2))<=1})`), [true, true]);
  check("pills centred on the row label", await q(`${pills}.map((p)=>{const t=p.closest("[data-slot=collapsible-trigger]").querySelector("[data-slot=task-rows-label]").getBoundingClientRect(),b=p.getBoundingClientRect();return Math.abs((t.y+t.height/2)-(b.y+b.height/2))<=0.5})`), [true, true]);
  check("label text centred on the trigger", Math.abs(await textCentre(`document.querySelector("#stage [data-slot=task-rows-label]")`, trig(0))) <= 1, true);
  check("running status is sr-only but present", await q(`(()=>{const p=${rows}[1].querySelector("[role=status] > .sr-only");const b=p.getBoundingClientRect();return [p.textContent.trim(), b.width<=1]})()`), ["Running", true]);
  check("retry glyph on the failed pill does not spin", await q(`getComputedStyle(${pills}[1].querySelector("[data-slot=icon]")).animationName`), "none");
  check("caret is the collapsible's right caret, turned down on the open row", await q(`${rows}.map((r)=>{const t=getComputedStyle(r.querySelector(":scope > [data-slot=collapsible-trigger] > [data-slot=collapsible-caret]")).transform;if(t==="none")return 0;const m=new DOMMatrix(t);return Math.round(Math.atan2(m.b,m.a)*180/Math.PI)})`), [0, 90, 0]);
  check("running ring spins", await q(`getComputedStyle(document.querySelector("#stage [data-slot=task-rows-ring] svg")).animationName`), "fndn-spin");
  const tops = await q(`${rows}.map((r)=>r.offsetTop)`);
  await sleep(400);
  check("no layout shift after the entrance", await q(`${rows}.map((r)=>r.offsetTop)`), tops);

  /* keyboard */
  await q(`${trig(0)}.focus()`);
  const below = await q(`${rows}[1].getBoundingClientRect().y`);
  const ys = [];
  await p.key("Enter");
  for (let i = 0; i < 12; i++) { ys.push(await q(`${rows}[1].getBoundingClientRect().y`)); await sleep(25); }
  await sleep(250);
  const settled = await q(`${rows}[1].getBoundingClientRect().y`);
  check("Enter expands the row; focus stays", await q(`[${trig(0)}.getAttribute("aria-expanded"), ${rows}[0].dataset.state, ${region(0)}.hidden, document.activeElement === ${trig(0)}]`), ["true", "open", false, true]);
  check("keyboard toggle is instant: the row below lands at once", Math.abs(ys[0] - settled) < 1, true);
  check("row radius morphs to 14 with it", await q(`getComputedStyle(${rows}[0]).borderTopLeftRadius`), "14px");
  check("the row below moves with the reveal, never backwards", ys.every((y, i) => i === 0 || y >= ys[i - 1] - 0.01) && settled > below && Math.abs(ys[ys.length - 1] - settled) < 1, true);
  await p.key(" "); await sleep(350);
  check("Space collapses it; details hidden", await q(`[${trig(0)}.getAttribute("aria-expanded"), ${region(0)}.hidden, getComputedStyle(${rows}[0]).borderTopLeftRadius]`), ["false", true, "22px"]);
  await p.key("Tab");
  check("Tab moves to the next trigger", await q(`document.activeElement === ${trig(1)}`), true);
  check("focus ring sits inside the clipped row", await q(`getComputedStyle(document.activeElement).outlineOffset`), "-2px");

  /* pointer: the reveal plays and the row below moves with it, never backwards, no jump at either end */
  for (const phase of ["open", "close"]) {
    /* the harness centres the block, so the trigger moves when a row grows: aim each time */
    const t0 = await q(`(()=>{const b=${trig(0)}.getBoundingClientRect();return {x:b.x+40,y:b.y+b.height/2}})()`);
    const start = await q(`${rows}[1].getBoundingClientRect().y - ${rows}[0].getBoundingClientRect().y`);
    await p.click(t0.x, t0.y);
    const seq = [];
    for (let i = 0; i < 14; i++) { seq.push(await q(`${rows}[1].getBoundingClientRect().y - ${rows}[0].getBoundingClientRect().y`)); await sleep(20); }
    await sleep(300);
    const end = await q(`${rows}[1].getBoundingClientRect().y - ${rows}[0].getBoundingClientRect().y`);
    const mono = seq.every((y, i) => i === 0 || (phase === "open" ? y >= seq[i - 1] - 0.01 : y <= seq[i - 1] + 0.01));
    const steps = [start, ...seq, end].slice(1).map((y, i, a) => Math.abs(y - (i ? a[i - 1] : start)));
    check(`pointer ${phase}: row below moves with the reveal (measured from the row above), monotonic, no step over 60% of the travel`, [mono, Math.max(...steps) < 0.6 * Math.abs(end - start), Math.abs(end - start) > 20], [true, true, true]);
  }

  /* status swap: a new mark scales in from 0.5 with opacity; a new pill fades out of a blur */
  const swap = await q(`(()=>{const b=${rows}[2].querySelector("[data-slot=task-rows-badge]");const old=b.querySelector("[data-slot=task-rows-mark]");const m=old.cloneNode(true);m.dataset.tone="green";old.remove();b.append(m);
    const s=${rows}[2].querySelector("[role=status]");const op=s.querySelector("[data-slot=status-pill]");const np=op.cloneNode(false);np.dataset.tone="green";np.innerHTML='<span data-slot="status-pill-label">Completed</span>';op.remove();s.append(np);
    return new Promise((res)=>requestAnimationFrame(()=>{const cs=getComputedStyle(m),ps=getComputedStyle(np);res([Number(cs.opacity)<1, cs.transform!=="none"&&cs.transform!=="matrix(1, 0, 0, 1, 0, 0)", Number(ps.opacity)<1, ps.filter!=="none"&&ps.filter!=="blur(0px)"])}))})()`);
  check("status swap: mark enters from scale 0.5 + opacity, pill out of a blur", swap, [true, true, true, true]);
  await sleep(300);
  check("status swap settles", await q(`(()=>{const m=getComputedStyle(${rows}[2].querySelector("[data-slot=task-rows-mark]"));return [m.opacity, m.transform]})()`), ["1", "matrix(1, 0, 0, 1, 0, 0)"]);

  /* reduced motion: the ring keeps spinning */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(fw);
  check("reduced motion: ring keeps spinning", await q(`getComputedStyle(document.querySelector("#stage [data-slot=task-rows-ring] svg")).animationName`), "fndn-spin");
  await p.media([]);

  /* defect: the amount must not move when the running row's pill arrives (scenario step 1 → 2) */
  const amountX = async (step) => { await open(fw, 0, `&step=${step}`); return q(`${rows}[1].querySelector("[data-slot=task-rows-amount]").getBoundingClientRect().right`); };
  const a1 = await amountX(1), a2 = await amountX(2);
  check("running → done: the amount stays where it was", Math.abs(a1 - a2) < 0.5, true);

  /* list variant + right-to-left */
  await open(fw, 1, "&dir=rtl");
  check("rtl list: badge on the right, caret on the left", await q(`(()=>{const t=${trig(0)}.getBoundingClientRect(),b=${rows}[0].querySelector("[data-slot=task-rows-badge]").getBoundingClientRect(),c=${rows}[0].querySelector("[data-slot=collapsible-caret]").getBoundingClientRect();return b.x>t.x+t.width/2&&c.x<t.x+t.width/2})()`), true);
  check("list rows keep a flat radius", await q(`getComputedStyle(${rows}[1]).borderTopLeftRadius`), "0px");
  /* a mount is not an arrival: the rows present at mount are still; appear opts in; a row added after mount enters */
  const entrances = () => q(`${rows}.map((r)=>getComputedStyle(r).animationName)`);
  await open(fw, 0);
  check("plain mount (appear off by default): no row enters", await entrances(), ["none", "none", "none"]);
  await open(fw, 0, "&step=5");
  check("a row added after mount fades up; the rows present at mount do not", await entrances(), ["none", "none", "none", "fndn-fade-up"]);
  await open(fw, 2);
  check("appear: the rows present at mount fade up", await entrances(), ["fndn-fade-up", "fndn-fade-up", "fndn-fade-up"]);
  check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ run aborted — ${String(e.message ?? e).slice(0, 160)}`); }
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
