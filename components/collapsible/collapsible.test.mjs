// Keyboard and pointer contract of the Collapsible, run against every target through the harness.
//   node components/collapsible/collapsible.test.mjs [react|vue|svelte …]
//   FRAMES=<dir> node components/collapsible/collapsible.test.mjs   also saves slowed-down frames of the reveal
// The reveal is sampled every animation frame at a tenth of its speed: the region must grow from
// nothing and shrink back to nothing without a jump, and the exit must play before it is hidden.
import fs from "node:fs";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const FRAMES = process.env.FRAMES;
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=collapsible]";
const T = `${R} > [data-slot=collapsible-trigger]`;
const C = `${R} > [data-slot=collapsible-content]`;
const p = await launch({ hover: true });
let failed = 0;
const ready = async () => { await sleep(300); for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };

/* records, every frame, the region's height and opacity, the caret's angle, the root's height (where
 * the rows below start) and whether the region is hidden */
const RECORD = `(()=>{const root=document.querySelector(${JSON.stringify(R)});const c=document.querySelector(${JSON.stringify(C)});const car=document.querySelector("${T} [data-slot=collapsible-caret]");window.__rec=[];const t0=performance.now();
  const ang=()=>{const m=getComputedStyle(car).transform;if(!m||m==="none")return 0;const [a,b]=m.slice(7,-1).split(",").map(Number);return Math.round(Math.atan2(b,a)*180/Math.PI)};
  const loop=()=>{const r=c.getBoundingClientRect();window.__rec.push({t:Math.round(performance.now()-t0),h:+r.height.toFixed(2),o:+(+getComputedStyle(c).opacity).toFixed(3),hidden:c.hidden,caret:ang(),below:+root.getBoundingClientRect().height.toFixed(2)});if(performance.now()-t0<3200)requestAnimationFrame(loop)};loop();return true})()`;
const analyse = (rec, dir) => {
  const hs = rec.filter((r) => !r.hidden).map((r) => r.h);
  const full = Math.max(...rec.map((r) => r.h));
  let maxStep = 0, monotonic = true;
  for (let i = 1; i < hs.length; i++) { const d = hs[i] - hs[i - 1]; maxStep = Math.max(maxStep, Math.abs(d)); if (dir === "open" ? d < -0.5 : d > 0.5) monotonic = false; }
  const shown = rec.filter((r) => !r.hidden);
  return {
    full,
    frames: shown.length,
    starts: dir === "open" ? (shown[0]?.h ?? 0) <= full * 0.12 : (shown[0]?.h ?? 0) >= full * 0.88,
    ends: dir === "open" ? rec.at(-1).h === full && !rec.at(-1).hidden : rec.at(-1).hidden,
    monotonic,
    smooth: maxStep <= full * 0.15,
    belowFollows: rec.every((r) => Math.abs((r.below - r.h) - (rec[0].below - rec[0].h)) < 1.5),
    hiddenOnlyAtZero: dir === "close" ? rec.every((r, i) => !r.hidden || i === 0 || rec[i - 1].hidden || rec[i - 1].h < 1) : true,
    caret: [rec[0].caret, rec.at(-1).caret],
  };
};

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  try {
    p.errors.length = 0;
    await p.rate(1);
    await p.goto(`${BASE}/harness.html?c=collapsible&fw=${fw}&ex=0`, 300); await ready();
    const wiring = () => q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});const c=document.querySelector(${JSON.stringify(C)});return {tag:t.tagName,type:t.type,expanded:t.getAttribute("aria-expanded"),controls:t.getAttribute("aria-controls")===c.id&&!!c.id,state:t.dataset.state,hidden:c.hidden,display:getComputedStyle(c).display}})()`);
    check("closed: a button that controls a hidden region", await wiring(), { tag: "BUTTON", type: "button", expanded: "false", controls: true, state: "closed", hidden: true, display: "none" });
    check("closed: nothing in the region is in the layout or the tab order", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return c.getBoundingClientRect().height===0&&c.checkVisibility()===false})()`), true);

    // pointer open, slowed to a tenth, sampled every frame
    await p.rate(0.1);
    await q(RECORD);
    await p.clickSel(T); await sleep(3400);
    const open = analyse(await q(`window.__rec`), "open");
    check("pointer: opens (aria-expanded, data-state, not hidden)", await wiring().then((w) => [w.expanded, w.state, w.hidden, w.display]), ["true", "open", false, "grid"]);
    check("pointer open: grows from nothing to full, every frame, no jump", { starts: open.starts, ends: open.ends, monotonic: open.monotonic, smooth: open.smooth, animated: open.frames > 20 }, { starts: true, ends: true, monotonic: true, smooth: true, animated: true });
    check("pointer open: the row below moves with the region", open.belowFollows, true);
    check("pointer open: the caret turns from right to down", open.caret, [0, 90]);
    if (FRAMES) { fs.mkdirSync(FRAMES, { recursive: true }); fs.writeFileSync(`${FRAMES}/${fw}-open.json`, JSON.stringify(await q(`window.__rec`))); }

    await q(RECORD);
    await p.clickSel(T); await sleep(3400);
    const close = analyse(await q(`window.__rec`), "close");
    check("pointer: closes (aria-expanded false, hidden at the end)", await wiring().then((w) => [w.expanded, w.state, w.hidden]), ["false", "closed", true]);
    check("pointer close: the exit plays back to nothing before the region is hidden", { starts: close.starts, ends: close.ends, monotonic: close.monotonic, smooth: close.smooth, animated: close.frames > 20, hiddenOnlyAtZero: close.hiddenOnlyAtZero }, { starts: true, ends: true, monotonic: true, smooth: true, animated: true, hiddenOnlyAtZero: true });
    check("pointer close: the caret turns back", close.caret, [90, 0]);
    if (FRAMES) fs.writeFileSync(`${FRAMES}/${fw}-close.json`, JSON.stringify(await q(`window.__rec`)));

    // frames to look at: open and close at a tenth of the speed
    if (FRAMES) {
      const clip = await q(`(()=>{const b=document.querySelector(${JSON.stringify(R)}).getBoundingClientRect();return {x:Math.max(0,b.x-12),y:Math.max(0,b.y-40),width:b.width+24,height:200}})()`);
      for (const dir of ["open", "close"]) {
        await p.clickSel(T);
        for (let i = 0; i < 6; i++) { await p.shot(`${FRAMES}/${fw}-${dir}-${i}.png`, clip); await sleep(120); }
        await sleep(1600);
      }
    }
    await p.rate(1);

    // keyboard: Enter and Space toggle, instantly
    await q(`document.querySelector(${JSON.stringify(T)}).focus()`);
    await p.key("Enter"); await sleep(40);
    check("Enter opens at once: full height and the caret already down", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});const b=c.querySelector("[data-slot=collapsible-body]");const car=getComputedStyle(document.querySelector("${T} [data-slot=collapsible-caret]")).transform;return [document.documentElement.dataset.fndnInput,c.getBoundingClientRect().height===b.scrollHeight,getComputedStyle(c).opacity,car]})()`), ["keyboard", true, "1", "matrix(0, 1, -1, 0, 0, 0)"]);
    await p.key(" "); await sleep(60);
    check("Space closes at once and the region is hidden", await wiring().then((w) => [w.expanded, w.hidden]), ["false", true]);
    check("focus stays on the trigger", await q(`document.activeElement===document.querySelector(${JSON.stringify(T)})`), true);

    // interrupted: open and close again before the reveal ends, then settle
    await p.clickSel(T); await sleep(60); await p.clickSel(T); await sleep(500);
    check("interrupted reveal settles closed and hidden", await wiring().then((w) => [w.expanded, w.hidden]), ["false", true]);

    // open at first paint: nothing plays
    await p.goto(`${BASE}/harness.html?c=collapsible&fw=${fw}&ex=1`, 300); await ready();
    check("open at mount: no data-state on the region, no running animation", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return [c.hidden,c.hasAttribute("data-state"),document.getAnimations().length]})()`), [false, false, 0]);
    check("inline trigger fits its text and bleeds 6px", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const r=document.querySelector(${JSON.stringify(R)}).getBoundingClientRect();return [Math.round(r.left-t.left), t.width<r.width]})()`), [6, true]);

    // section: the caret leads
    await p.goto(`${BASE}/harness.html?c=collapsible&fw=${fw}&ex=2`, 300); await ready();
    check("section: caret first, 28px header, open caret points down", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});return [t.firstElementChild?.dataset.slot, Math.round(t.getBoundingClientRect().height), getComputedStyle(t.firstElementChild).transform]})()`), ["collapsible-caret", 28, "matrix(0, 1, -1, 0, 0, 0)"]);

    // disabled: clicks and keys do nothing, the trigger stays focusable
    await p.goto(`${BASE}/harness.html?c=collapsible&fw=${fw}&ex=3`, 300); await ready();
    await p.clickSel(T); await sleep(250);
    await q(`document.querySelector(${JSON.stringify(T)}).focus()`);
    await p.key("Enter"); await sleep(100);
    check("disabled: stays closed, trigger marked and focusable", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});return [t.getAttribute("aria-expanded"),t.hasAttribute("data-disabled"),document.querySelector(${JSON.stringify(C)}).hidden,document.activeElement===t]})()`), ["false", true, true, true]);

    // right-to-left: the closed caret points left, the open one down
    await p.goto(`${BASE}/harness.html?c=collapsible&fw=${fw}&ex=0&dir=rtl`, 300); await ready();
    const caret = `getComputedStyle(document.querySelector("${T} [data-slot=collapsible-caret]")).transform`;
    const closedRtl = await q(caret);
    await p.clickSel(T); await sleep(400);
    check("right-to-left: caret points left closed, down open", [closedRtl, await q(caret)], ["matrix(-1, 0, 0, -1, 0, 0)", "matrix(0, 1, -1, 0, 0, 0)"]);

    check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ threw: ${e.message.split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { console.log(`  (retrying ${fw}: ${checks.filter((c) => c.startsWith("✗")).join("; ").slice(0, 200)})`); failed = before; await p.rate(1); await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
/* a row's label wraps, never cut: at 160px it runs onto more lines, keeps no title, and the caret
 * and the meta stay centred on its first line (the 24px first line, 10px in); one line is 44px */
for (const fw of targets) {
  await p.goto(`${BASE}/harness.html?c=collapsible&fw=${fw}&ex=0`, 1500);
  const got = await p.eval(`(async () => {
    const root = document.querySelector("#stage [data-slot=collapsible]"), trigger = root.querySelector("[data-slot=collapsible-trigger]");
    const label = trigger.querySelector("[data-slot=collapsible-label]"), caret = trigger.querySelector("[data-slot=collapsible-caret]"), meta = trigger.querySelector("[data-slot=collapsible-meta]");
    const mid = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; };
    const one = Math.round(trigger.getBoundingClientRect().height);
    const top = trigger.getBoundingClientRect().top;
    const centred = [Math.round(mid(caret) - top), Math.round(mid(meta) - top)];
    root.style.width = "160px";
    await new Promise((r) => setTimeout(r, 250));
    const t = trigger.getBoundingClientRect().top;
    const tn = document.createTreeWalker(label, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.data.trim() ? 1 : 3 }).nextNode(); const at = tn.data.search(/\\S/); const line = document.createRange(); line.setStart(tn, at); line.setEnd(tn, at + 1);
    const first = line.getClientRects()[0];
    return [one, centred, label.getBoundingClientRect().height > 30, label.scrollWidth <= label.clientWidth, label.getAttribute("title"),
      Math.round(mid(caret) - t), Math.round(mid(meta) - t), Math.abs((first.top + first.height / 2) - (mid(caret))) < 1.5];
  })()`);
  const ok = JSON.stringify(got) === JSON.stringify([44, [22, 22], true, true, null, 22, 22, true]);
  if (!ok) failed++;
  console.log(`${fw}\n  ${ok ? "✓" : "✗"} row: the label wraps (no cut, no title); caret and meta stay on its first line${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
}
/* inline and section: a label cut by its ellipsis carries its full text as a title while it is
 * cut, and only then (lib/truncate.ts): squeeze the root to 40px, then let it go */
for (const fw of targets) {
  await p.goto(`${BASE}/harness.html?c=collapsible&fw=${fw}&ex=1`, 1500);
  const got = await p.eval(`(async () => {
    const root = document.querySelector("#stage [data-slot=collapsible]"), label = root.querySelector("[data-slot=collapsible-label]");
    const wait = () => new Promise((r) => setTimeout(r, 250));
    const text = label.textContent.replace(/\\s+/g, " ").trim();
    const before = label.getAttribute("title");
    root.style.width = "40px"; root.style.maxWidth = "40px"; root.style.minWidth = "0";
    await wait();
    const cut = label.getAttribute("title") === text;
    root.style.width = root.style.maxWidth = root.style.minWidth = "";
    await wait();
    return [before, cut, label.getAttribute("title")];
  })()`);
  const ok = JSON.stringify(got) === JSON.stringify([null, true, null]);
  if (!ok) failed++;
  console.log(`${fw}\n  ${ok ? "✓" : "✗"} truncated label: title only while cut${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
