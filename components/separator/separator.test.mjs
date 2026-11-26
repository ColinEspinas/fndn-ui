// Separator: the 1px rule (horizontal, vertical), roles, the label in the middle, worst cases,
// right-to-left, dark. Static: no pointer or keyboard path (it is not focusable).
//   node components/separator/separator.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "separator";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25 });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const R = "#stage [data-slot=separator]";
/* the root, its rules (the element itself, or ::before / ::after when labelled) and the label */
const measure = () => q(`(()=>{
  const e=document.querySelector(${JSON.stringify(R)}), r=e.getBoundingClientRect(), cs=getComputedStyle(e);
  const l=e.querySelector("[data-slot=separator-label]"), lr=l?.getBoundingClientRect();
  const pseudo=(w)=>{const s=getComputedStyle(e,w);return {w:parseFloat(s.width),h:parseFloat(s.height),bg:s.backgroundColor}};
  const round=(n)=>Math.round(n*100)/100;
  return { role:e.getAttribute("role"), orientation:e.getAttribute("aria-orientation"), labelledby:e.getAttribute("aria-labelledby"),
    w:round(r.width), h:round(r.height), bg:cs.backgroundColor, x:r.x, y:r.y, cx:r.x+r.width/2, cy:r.y+r.height/2,
    label: l ? { id:l.id, text:l.textContent, color:getComputedStyle(l).color, size:getComputedStyle(l).fontSize, w:round(lr.width), h:round(lr.height), cx:lr.x+lr.width/2, cy:lr.y+lr.height/2, clipped:l.scrollWidth>l.clientWidth+1 } : null,
    before:pseudo("::before"), after:pseudo("::after"), overflow:e.scrollWidth>e.clientWidth+1, kids:e.children.length };
})()`);

async function run(fw, check) {
  await open(fw, 0);
  const line = await token("--fndn-line");
  let m = await measure();
  check("horizontal: role separator, aria-orientation horizontal, no children", [m.role, m.orientation, m.kids], ["separator", "horizontal", 0]);
  check("horizontal: 1px high, as wide as its container (240), line colour", [m.h, m.w, m.bg], [1, 240, line]);
  await open(fw, 1);
  m = await measure();
  check("vertical: aria-orientation vertical, 1px wide, 24px tall (its given height), line colour", [m.role, m.orientation, m.w, m.h, m.bg], ["separator", "vertical", 1, 24, line]);
  await open(fw, 2);
  m = await measure();
  check("labelled: named by its label (aria-labelledby → the label part)", [m.role, m.labelledby === m.label.id && !!m.label.id, m.label.text], ["separator", true, "or"]);
  check("labelled: the root draws no fill; its ::before / ::after are the 1px rules in the line colour", [m.bg, m.before.h, m.after.h, m.before.bg, m.after.bg], ["rgba(0, 0, 0, 0)", 1, 1, line, line]);
  check("labelled: label 12px ink-2, centred (±0.5px) between two equal rules", [m.label.size, m.label.color, Math.abs(m.label.cx - m.cx) <= 0.5, Math.abs(m.before.w - m.after.w) <= 0.5], ["12px", await token("--fndn-ink-2", "color"), true, true]);
  check("labelled: the rules sit on the label's middle (±0.5px)", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=e.getBoundingClientRect();const l=e.querySelector("[data-slot=separator-label]").getBoundingClientRect();return Math.abs((r.y+r.height/2)-(l.y+l.height/2))<=0.5})()`), true);
  await open(fw, 3);
  m = await measure();
  check("decorative: role none, no aria-orientation, still drawn", [m.role, m.orientation, m.h, m.bg], ["none", null, 1, line]);
  await open(fw, 4);
  m = await measure();
  check("vertical with a label: a column, the rules 1px wide above and below, label centred", [m.orientation, m.before.w, m.after.w, Math.abs(m.label.cy - m.cy) <= 0.5, m.h], ["vertical", 1, 1, true, 96]);

  /* worst cases: the label wraps whole (never cut), the rules share the 30% the label leaves, nothing pokes out */
  for (const [i, name] of [[0, "long label"], [1, "unbreakable label"], [2, "narrow (64px)"], [3, "right-to-left"], [4, "emoji"]]) {
    await open(fw, i, "&data=worst");
    m = await measure();
    check(`worst ${name}: label whole, rules keep their share, nothing overflows`, [m.label.clipped, Math.min(m.before.w, m.after.w) >= (m.w * 0.3 - 24) / 2 - 0.5, m.overflow], [false, true, false]);
  }
  await open(fw, 0, "&data=worst");
  check("worst long label: it wraps to more than one line", (await measure()).label.h > 16, true);
  await open(fw, 2, "&dir=rtl");
  m = await measure();
  check("rtl: label still centred between equal rules", [Math.abs(m.label.cx - m.cx) <= 0.5, Math.abs(m.before.w - m.after.w) <= 0.5], [true, true]);
  await open(fw, 2, "&theme=dark");
  m = await measure();
  check("dark: the rules use the dark line colour", [m.before.bg], [await token("--fndn-line")]);
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
