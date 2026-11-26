// Shimmer: ink and accent sweeps, speeds, reduced motion.
//   node components/shimmer/shimmer.test.mjs [react|vue|svelte …]
const C = "shimmer";
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

const R = "#stage [data-slot=shimmer]";
const look = () => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(R)}));return {anim:cs.animationName,dur:cs.animationDuration,img:cs.backgroundImage,color:cs.color}})()`);
async function run(fw, check) {
  await open(fw, 0);
  const ink = await look();
  check("normal: ink sweep, 1.8s, transparent text", [ink.anim, ink.dur, ink.color], ["fndn-shimmer-text", "1.8s", "rgba(0, 0, 0, 0)"]);
  await open(fw, 2);
  const acc = await look();
  const [accent, accentInk] = [await token("--fndn-accent"), await token("--fndn-accent-ink")];
  check("accent: 1.4s sweep whose gradient runs accent → accent-ink → accent", [acc.dur, acc.img.includes(accent), acc.img.includes(accentInk), acc.img !== ink.img], ["1.4s", true, true, true]);
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await sleep(100);
  check("reduced motion: accent stops and reads as plain accent text", [(await look()).anim, (await look()).color], ["none", accent]);
  await p.media([]);
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

