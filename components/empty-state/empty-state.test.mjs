// Contract of the Empty state, run against every target through the harness: metrics of the row and
// the block, the fade-in when it appears, nothing focusable.
//   node components/empty-state/empty-state.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=empty-state]";
const p = await launch({ hover: true });
let failed = 0;
const ready = async () => { await sleep(300); for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  const open = async (ex) => { p.errors.length = 0; await p.goto(`${BASE}/harness.html?c=empty-state&fw=${fw}&ex=${ex}`, 300); await ready(); };
  try {
    await open(0);
    check("row: 30px, 8px inline padding, 12px ink-2 text, starts the line", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const cs=getComputedStyle(r);const t=r.querySelector("[data-slot=empty-state-title]").getBoundingClientRect();return [Math.round(r.getBoundingClientRect().height),cs.paddingInlineStart,cs.fontSize,cs.color===getComputedStyle(document.documentElement).getPropertyValue("--fndn-ink-2").trim()||cs.color.startsWith("oklch"),Math.round(t.left-r.getBoundingClientRect().left)]})()`), [30, "8px", "12px", true, 8]);
    check("nothing focusable: Tab passes it", await q(`document.querySelector(${JSON.stringify(R)}).querySelectorAll("a,button,input,[tabindex]").length`), 0);

    // it fades in when it appears (out of hidden), at duration.base
    await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});r.hidden=true;r.getBoundingClientRect();r.hidden=false;return true})()`);
    check("appearing: an opacity transition at duration.base", await q(`(()=>{const a=document.querySelector(${JSON.stringify(R)}).getAnimations();const base=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fndn-duration-base"));return a.some((x)=>x.transitionProperty==="opacity"&&x.effect.getTiming().duration===base)})()`), true);
    await sleep(250);
    check("…and lands at full opacity", await q(`getComputedStyle(document.querySelector(${JSON.stringify(R)})).opacity`), "1");

    await open(1);
    check("row centred: icon and title centred in the row", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)}).getBoundingClientRect();const i=document.querySelector("${R} [data-slot=empty-state-icon]").getBoundingClientRect();const t=document.querySelector("${R} [data-slot=empty-state-title]").getBoundingClientRect();return Math.abs((i.left-r.left)-(r.right-t.right))<1.5})()`), true);

    await open(2);
    check("block: centred stack, 32px icon tile, 13px/500 title, 12px hint", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const rb=r.getBoundingClientRect();const parts=["[data-slot=empty-state-icon]","[data-slot=empty-state-title]","[data-slot=empty-state-hint]"].map((s)=>r.querySelector(s));const centred=parts.every((n)=>{const b=n.getBoundingClientRect();return Math.abs((b.left+b.width/2)-(rb.left+rb.width/2))<1});const i=parts[0].getBoundingClientRect();const t=getComputedStyle(parts[1]);return [centred,Math.round(i.width),Math.round(i.height),t.fontSize,t.fontWeight,getComputedStyle(parts[2]).fontSize]})()`), [true, 32, 32, "13px", "500", "12px"]);
    /* the tile is quiet in both themes: the hover grey with a soft hairline (an inset tile read as
     * a hole with a bright ring in dark mode) */
    const tile = () => q(`(()=>{const i=document.querySelector("${R} [data-slot=empty-state-icon]");const d=document.createElement("div");d.style.background="var(--fndn-hover)";d.style.boxShadow="0 0 0 1px var(--fndn-line-soft)";document.body.append(d);const want=[getComputedStyle(d).backgroundColor,getComputedStyle(d).boxShadow];d.remove();const cs=getComputedStyle(i);return [cs.backgroundColor===want[0],cs.boxShadow.includes(want[1])]})()`);
    check("block: the tile is the hover grey with a line-soft hairline", await tile(), [true, true]);
    await p.goto(`${BASE}/harness.html?c=empty-state&fw=${fw}&ex=2&theme=dark`, 300); await ready();
    check("dark: the same quiet tile (not an inset hole with a bright ring)", await tile(), [true, true]);
    await open(2);
    check("block: the icon is decorative", await q(`document.querySelector("${R} [data-slot=empty-state-icon]").getAttribute("aria-hidden")`), "true");

    /* icon names: a vocabulary name draws its glyph; any other string draws nothing, never the word */
    await open(6);
    check("icon \"bell\": the glyph (an svg), no text in the icon part", await q(`(()=>{const i=document.querySelector("${R} [data-slot=empty-state-icon]");return [!!i?.querySelector("svg"), i?.textContent.trim() ?? null]})()`), [true, ""]);
    await open(7);
    check("an unknown icon name: no icon part and the name is not shown", await q(`[!!document.querySelector("${R} [data-slot=empty-state-icon]"), document.querySelector("${R}").textContent.includes("not-an-icon")]`), [false, false]);
    check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ threw: ${e.message.split("\n")[0]}`); }
  if (failed > before && attempt < 2) { console.log(`  (retrying ${fw}: ${checks.filter((c) => c.startsWith("✗")).join("; ").slice(0, 200)})`); failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
