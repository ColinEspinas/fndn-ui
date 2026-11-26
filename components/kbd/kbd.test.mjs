// Kbd: keys as nested <kbd>, boxed and plain looks, right-to-left.
//   node components/kbd/kbd.test.mjs [react|vue|svelte …]
const C = "kbd";
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

const R = "#stage [data-slot=kbd]";
async function run(fw, check) {
  await open(fw, 0);
  check("boxed ⌘ K: a <kbd> holding two <kbd> keys", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.tagName,...[...e.children].map((k)=>k.tagName+":"+k.dataset.slot+":"+k.textContent)]})()`), ["KBD", "KBD:kbd-key:⌘", "KBD:kbd-key:K"]);
  check("boxed key: 18px high, at least 18px wide, radius.chip, surface fill, mono 11px, ink-2", await q(`(()=>{const k=document.querySelector("${R} [data-slot=kbd-key]");const r=k.getBoundingClientRect();const cs=getComputedStyle(k);return [r.height,r.width>=18,cs.borderRadius,cs.fontSize,/JetBrains|mono/i.test(cs.fontFamily),cs.color]})()`), [18, true, "6px", "11px", true, await token("--fndn-ink-2")]);
  check("keys sit 2px apart", await q(`(()=>{const [a,b]=[...document.querySelectorAll("${R} [data-slot=kbd-key]")].map((k)=>k.getBoundingClientRect());return Math.round(b.x-a.right)})()`), 2);
  await open(fw, 2);
  check("plain: inherits the font and colour around it, 11px, no box", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const k=e.querySelector("[data-slot=kbd-key]");const cs=getComputedStyle(k),ps=getComputedStyle(e.parentElement);return [cs.color===ps.color,cs.fontFamily===ps.fontFamily,cs.fontSize,cs.backgroundColor]})()`), [true, true, "11px", "rgba(0, 0, 0, 0)"]);
  await open(fw, 0, "&dir=rtl");
  check("rtl: the key run is dir=ltr and keeps its reading order (⌘ left of K), as on the keyboard", await q(`(()=>{const r=document.querySelector("${R}");const [a,b]=[...r.querySelectorAll("[data-slot=kbd-key]")].map((k)=>k.getBoundingClientRect().x);return [r.getAttribute("dir"), a<b]})()`), ["ltr", true]);
  await open(fw, 0, "&theme=dark");
  check("dark: the key uses the dark surface", await q(`getComputedStyle(document.querySelector("${R} [data-slot=kbd-key]")).backgroundColor`), await token("--fndn-surface", "backgroundColor"));
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

