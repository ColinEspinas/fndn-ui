// Status pill: sizes, the mark (no motion on first paint; pops in when it appears later), the dot
// tone, truncation. Every target. (The tag is its own component: components/tag/tag.test.mjs.)
//   node components/status-pill/status-pill.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ hover: true });
/* every animation and transition that starts, from the first frame of each page */
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__motionEls=[];window.__motion=window.__motionEls;for(const t of ["animationstart","transitionrun"])addEventListener(t,(e)=>window.__motionEls.push(e.target),true);` });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=status-pill&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const R = "#stage [data-slot=status-pill]";
const pill = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {h:r.height,w:r.width,radius:cs.borderRadius,border:cs.borderTopWidth,font:cs.fontSize,weight:cs.fontWeight,bg:cs.backgroundColor,color:cs.color,borderColor:cs.borderTopColor}})()`);

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try {
      await open(fw, 0);
      const base = await pill();
      check("default (Active): 24px, pill radius, 13px/500, no border", [base.h, base.radius, base.font, base.weight, base.border], [24, "999px", "13px", "500", "0px"]);

      await open(fw, 6);
      const sm = await pill();
      check("size sm: 22px, 11.5px, 8px inline padding", [sm.h, sm.font, await q(`getComputedStyle(document.querySelector(${JSON.stringify(R)})).paddingInlineStart`)], [22, "11.5px", "8px"]);

      await open(fw, 7);
      const mark = await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const m=e.querySelector("[data-slot=status-pill-mark]");const r=m.getBoundingClientRect(),pr=e.getBoundingClientRect();const cs=getComputedStyle(m);return [r.width,r.height,cs.borderRadius,cs.backgroundColor===getComputedStyle(e).color,Math.round(r.y-pr.y),Math.round(r.x-pr.x),!!e.querySelector("[data-slot=status-pill-dot]")]})()`);
      check("mark: 18px green circle in place of the dot, 3px inset", mark, [18, 18, "50%", true, 3, 3, false]);
      /* nothing plays on first paint, and data-enter (set after it) starts nothing; a mark that
       * appears later (a status change: here a fresh mark element) pops in */
      await sleep(200);
      check("first paint: no animation or transition ran in the pill; data-enter set after paint", [await q(`window.__motion.filter((n)=>n.closest?.("[data-slot=status-pill]"))`).then((a) => a.length), await q(`document.querySelector(${JSON.stringify(R)}).hasAttribute("data-enter")`)], [0, true]);
      const pop = await q(`(async()=>{const e=document.querySelector(${JSON.stringify(R)});const m=e.querySelector("[data-slot=status-pill-mark]");const c=m.cloneNode(true);m.remove();e.prepend(c);await new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r)));const a=c.getAnimations().map((x)=>[x.transitionProperty,x.effect.getTiming().duration]).sort();const o=+getComputedStyle(c).opacity;await new Promise((r)=>setTimeout(r,300));return [a,o<1,+getComputedStyle(c).opacity,getComputedStyle(c).transform]})()`);
      check("status change: a mark that appears later pops in (opacity + scale, duration.popup), then rests at 1 with no transform", pop, [[["opacity", 180], ["transform", 180]], true, 1, "none"]);

      await open(fw, 8);
      check("dot tone: a neutral pill whose dot alone takes the accent", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const d=e.querySelector("[data-slot=status-pill-dot]");return [getComputedStyle(d).backgroundColor!==getComputedStyle(e).color, getComputedStyle(e).height]})()`), [true, "22px"]);
      if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []);
    } catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
/* a label cut by its ellipsis carries its full text as a title while it is cut, and only then
 * (lib/truncate.ts): squeeze the root to 40px, then let it go */
for (const fw of targets) {
  await p.goto(`${BASE}/harness.html?c=status-pill&fw=${fw}&ex=0`, 1500);
  const got = await p.eval(`(async () => {
    const root = document.querySelector("#stage [data-slot=status-pill]"), label = root.querySelector("[data-slot=status-pill-label]");
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
