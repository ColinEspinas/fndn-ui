// Avatar: initials, image over initials, broken image falls back, sizes and shapes, names.
//   node components/avatar/avatar.test.mjs [react|vue|svelte …]
const C = "avatar";
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

const R = "#stage [data-slot=avatar]";
/* an example with props changed, mounted in this target through the harness module */
const mountWith = (fw, ex, props) => q(`(async()=>{const spec=(await (await import("/src/harness/specs.ts")).specOf("avatar"));const e=spec.examples[${ex}];const {mountExample}=await import("/src/harness/mount.ts");await mountExample(document.querySelector("#stage"),{...spec,examples:[{...e,props:{...e.props,...${JSON.stringify(props)}}}]},"${fw}",0);return true})()`);
const info = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=e.getBoundingClientRect();const cs=getComputedStyle(e);const img=e.querySelector("[data-slot=avatar-image]");return {w:r.width,h:r.height,radius:cs.borderRadius,role:e.getAttribute("role"),label:e.getAttribute("aria-label"),initials:e.querySelector("[data-slot=avatar-initials]").textContent,img:!!img,ring:getComputedStyle(e,"::after").boxShadow.includes("inset"),loaded:!!img&&img.complete&&img.naturalWidth>0,bg:cs.backgroundColor}})()`);
async function run(fw, check) {
  await open(fw, 0);
  const a = await info();
  check("initials: 16px circle, KC from the name, role=img named, the colour prop fills it", [a.w, a.h, a.radius, a.initials, a.role, a.label, a.bg], [16, 16, "50%", "KC", "img", "Kumo Capital", await token("--fndn-tag-orange", "backgroundColor")]);
  check("initials are centred (±0.5px)", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=document.createRange();r.selectNodeContents(e.querySelector("[data-slot=avatar-initials]"));const t=r.getBoundingClientRect(),b=e.getBoundingClientRect();return Math.abs((t.x+t.width/2)-(b.x+b.width/2))<=0.5})()`), true);
  await open(fw, 1); await sleep(200);
  const img = await info();
  check("image: 20px, loaded, a hairline over it, covers the initials", [img.w, img.img, img.ring, img.loaded, await q(`(()=>{const i=document.querySelector("${R} [data-slot=avatar-image]").getBoundingClientRect();return [i.width,i.height]})()`)], [20, true, true, true, [20, 20]]);
  await open(fw, 2);
  const sq = await info();
  check("square 14: 4px corners, one letter, no hairline without an image", [sq.w, sq.radius, sq.initials, sq.ring], [14, "4px", "N", false]);
  await open(fw, 3); await sleep(300);
  const broken = await info();
  check("broken image: removed, the initials show", [broken.img, broken.initials, broken.radius, broken.w], [false, "MO", "5px", 20]);
  /* every size, round then square (example 0 with size and shape changed) */
  const sizes = [];
  for (const shape of ["round", "square"]) for (const size of ["12", "14", "16", "20", "24", "28", "32", "40"]) {
    await mountWith(fw, 0, { size, shape }); await sleep(100);
    sizes.push(await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return e.getBoundingClientRect().width+":"+getComputedStyle(e).borderRadius})()`));
  }
  check("sizes 12–40, round then square (corners a quarter of the edge)", sizes, ["12:50%", "14:50%", "16:50%", "20:50%", "24:50%", "28:50%", "32:50%", "40:50%", "12:3px", "14:4px", "16:4px", "20:5px", "24:6px", "28:7px", "32:8px", "40:10px"]);
  /* two wide letters stay clear of the rim at every size: about two thirds of the edge */
  const share = [];
  for (const size of ["16", "20", "24", "28", "32", "40"]) {
    await mountWith(fw, 0, { size, initials: "MC" }); await sleep(100);
    share.push(await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=document.createRange();r.selectNodeContents(e.querySelector("[data-slot=avatar-initials]"));const s=r.getBoundingClientRect().width/e.getBoundingClientRect().width;return s>=0.58&&s<=0.72})()`));
  }
  check("two wide initials (MC) take about two thirds of the edge at every size from 16 to 40", share, [true, true, true, true, true, true]);
  /* the row sizes line up with the control scale: a 28px avatar beside an sm button */
  for (const [ex, edge, font, letters] of [[5, 28, "12px", "MC"], [6, 40, "15px", "DO"]]) {
    await open(fw, ex);
    check(`${edge}px: ${letters} at ${font}, centred both ways (±0.5px)`, await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=document.createRange();r.selectNodeContents(e.querySelector("[data-slot=avatar-initials]"));const t=r.getBoundingClientRect(),b=e.getBoundingClientRect();return [b.width,b.height,getComputedStyle(e).fontSize,e.textContent.trim(),Math.abs((t.x+t.width/2)-(b.x+b.width/2))<=0.5,Math.abs((t.y+t.height/2)-(b.y+b.height/2))<=0.75]})()`), [edge, edge, font, letters, true, true]);
  }
  const s = `?c=avatar&fw=${fw}&ex=3&data=worst`; await p.goto(`${BASE}/harness.html${s}`, 300); await ready(s);
  check("worst: no name is decorative (aria-hidden, no role), empty initials", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.getAttribute("aria-hidden"),e.getAttribute("role"),e.textContent.trim()]})()`), ["true", null, ""]);
  const s2 = `?c=avatar&fw=${fw}&ex=1&data=worst`; await p.goto(`${BASE}/harness.html${s2}`, 300); await ready(s2);
  check("worst: a long name still gives two letters inside 16px", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.textContent.trim(),e.getBoundingClientRect().width]})()`), ["LI", 16]);
  await open(fw, 0, "&theme=dark");
  check("dark: renders, initials on the colour", (await info()).initials, "KC");
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

