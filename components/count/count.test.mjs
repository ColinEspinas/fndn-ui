// Count: plain and boxed, tabular numbers, the selected look (prop and inherited), huge numbers.
//   node components/count/count.test.mjs [react|vue|svelte …]
const C = "count";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ hover: true });
let failed = 0;
const q = (js) => p.eval(js);
/* ready = this URL's document has mounted (the previous page can still answer right after goto) */
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(300); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "color") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const R = "#stage [data-slot=count]";
const look = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {h:r.height,w:r.width,bg:cs.backgroundColor,color:cs.color,num:cs.fontVariantNumeric,ws:cs.whiteSpace,radius:cs.borderRadius,font:cs.fontSize}})()`);
async function run(fw, check) {
  await open(fw, 0);
  const plain = await look();
  check("plain: ink-2 text, tabular numbers, no box", [plain.color, plain.num, plain.ws, plain.bg], [await token("--fndn-ink-2"), "tabular-nums", "nowrap", "rgba(0, 0, 0, 0)"]);
  await open(fw, 1);
  const boxed = await look();
  check("boxed: 20px high, at least 20px wide, radius.chip, inset fill, 11px", [boxed.h, boxed.w >= 20, boxed.radius, boxed.bg, boxed.font], [20, true, "6px", await token("--fndn-inset", "backgroundColor"), "11px"]);
  await open(fw, 3);
  const sel = await look();
  check("selected (prop): field fill, ink text", [sel.bg, sel.color], [await token("--fndn-field", "backgroundColor"), await token("--fndn-ink")]);
  await open(fw, 2, "&theme=dark");
  check("dark: boxed uses the dark inset fill", (await look()).bg, await token("--fndn-inset", "backgroundColor"));
  const s = `?c=count&fw=${fw}&ex=0&data=worst`; await p.goto(`${BASE}/harness.html${s}`, 300); await ready(s);
  check("worst: 12,480,000 stays one 20px line and widens the box", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.getBoundingClientRect().height,e.scrollWidth<=e.clientWidth+0.5]})()`), [20, true]);
  const s2 = `?c=count&fw=${fw}&ex=1&data=worst`; await p.goto(`${BASE}/harness.html${s2}`, 300); await ready(s2);
  check("worst: a huge plain number in a 24px box does not wrap", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length})()`), 1);
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

