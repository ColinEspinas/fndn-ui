// Input: Tab reaches the field, focus shows the ring (box-shadow, never one recoloured edge), typing
// lands in it, invalid carries aria-invalid and the red ring, disabled is skipped by Tab.
//   node components/input/input.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ hover: true });
let failed = 0;
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await p.eval(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex) => { p.errors.length = 0; const search = `?c=input&fw=${fw}&ex=${ex}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const q = (js) => p.eval(js);
const edges = `(()=>{const cs=getComputedStyle(document.querySelector("#stage [data-slot=input]"));return [cs.borderTopColor,cs.borderRightColor,cs.borderBottomColor,cs.borderLeftColor,cs.borderTopWidth,cs.outlineStyle]})()`;
const shadow = `getComputedStyle(document.querySelector("#stage [data-slot=input]")).boxShadow`;

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try {
      await open(fw, 0);
      const rest = [await q(edges), await q(shadow)];
      await p.click(5, 5); await p.key("Tab"); await sleep(300);
      check("Tab focuses the field", await q(`document.activeElement === document.querySelector("#stage [data-slot=input]")`), true);
      const focused = [await q(edges), await q(shadow)];
      check("focus: the edges and outline do not change", focused[0], rest[0]);
      check("focus: a ring (box-shadow) appears", focused[1] !== rest[1] && focused[1] !== "none", true);
      await p.type("Lantern");
      check("typing lands in the field", await q(`document.querySelector("#stage [data-slot=input]").value`), "Lantern");

      await open(fw, 2);
      check("invalid: aria-invalid=true", await q(`document.querySelector("#stage [data-slot=input]").getAttribute("aria-invalid")`), "true");
      await p.click(5, 5); await p.key("Tab"); await sleep(300);
      check("invalid focus: the ring is red", /rgb|oklch|color/.test(await q(shadow)) && (await q(shadow)) === (await q(`(()=>{const d=document.createElement("div");d.style.boxShadow="0 0 0 1px var(--fndn-red), 0 0 0 4px var(--fndn-red-tint)";document.body.append(d);const v=getComputedStyle(d).boxShadow;d.remove();return v})()`)), true);

      await open(fw, 4);
      await p.click(5, 5); await p.key("Tab"); await sleep(100);
      check("disabled: Tab skips it", await q(`document.activeElement === document.querySelector("#stage [data-slot=input]")`), false);
      if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []);
    } catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
