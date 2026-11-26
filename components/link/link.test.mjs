// Link: inline (underlined in a softer shade, full colour on hover), standalone (line on hover),
// neutral tone, external (new tab, arrow, hidden label), press (colour, never a scale), a pasted
// URL in a narrow column, right-to-left, dark.
//   node components/link/link.test.mjs [react|vue|svelte …]
const C = "link";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(300); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "color") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const A = "#stage [data-slot=link]";
const look = `(()=>{const a=document.querySelector(${JSON.stringify(A)});const cs=getComputedStyle(a);return [cs.color,cs.textDecorationLine,cs.textDecorationColor,cs.fontWeight,cs.transform]})()`;
const away = () => p.hover(2, 2);
async function center() { const r = await p.rect(A); return [r.x + Math.min(r.w / 2, 20), r.cy]; }

async function run(fw, check) {
  /* inline */
  await open(fw, 0);
  const accentInk = await token("--fndn-accent-ink");
  const rest = await q(look);
  check("inline: an <a href> named by its text, accent-ink, underlined in a softer shade", [await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});return [a.tagName,a.getAttribute("href"),a.textContent,a.hasAttribute("target")]})()`), rest[0], rest[1], rest[2] !== rest[0]], [["A", "#dpl_7f3a9c", "deploy dpl_7f3a9c", false], accentInk, "underline", true]);
  const [x, y] = await center();
  await p.hover(x, y); await sleep(250);
  check("inline hover: the line takes the full colour", (await q(look))[2], accentInk);
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }); await sleep(40);
  const pressed = await q(look);
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }); await sleep(30);
  check("press: the text turns accent at once; nothing scales", [pressed[0], pressed[4]], [await token("--fndn-accent"), "none"]);
  await away(); await sleep(250);
  /* standalone */
  await open(fw, 1);
  const s = await q(look);
  check("standalone: medium weight, no line at rest", [s[0], s[3], s[2]], [accentInk, "500", "rgba(0, 0, 0, 0)"]);
  const [sx, sy] = await center();
  await p.hover(sx, sy); await sleep(250);
  check("standalone hover: the line shows in the link's colour", (await q(look))[2], accentInk);
  await away();
  /* external */
  await open(fw, 2);
  check("external: new tab, noopener noreferrer, an aria-hidden arrow and a hidden label", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});const m=a.querySelector("[data-slot=link-external]");return [a.target,a.rel,!!m.querySelector("svg[aria-hidden=true]"),m.querySelector(".sr-only")?.textContent.trim(),getComputedStyle(m).textDecorationLine]})()`), ["_blank", "noopener noreferrer", true, "(opens in a new tab)", "none"]);
  /* neutral */
  await open(fw, 3);
  const n = await q(look);
  check("neutral: ink text, an ink-3 line", [n[0], n[1], n[2]], [await token("--fndn-ink"), "underline", await token("--fndn-ink-3")]);
  /* worst: a pasted URL in a 180px column wraps inside it; the arrow stays with the last word */
  await open(fw, 0, "&data=worst");
  check("a pasted URL wraps inside its 180px column (the stage blockifies it); the arrow stays on the last line", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});const b=a.getBoundingClientRect();const m=a.querySelector("[data-slot=link-external] svg").getBoundingClientRect();const lh=parseFloat(getComputedStyle(a).lineHeight)||20;return [Math.round(b.width), b.height>lh*1.5, a.scrollWidth<=a.clientWidth+0.5, m.right<=b.right+0.5, b.bottom-m.bottom<lh]})()`), [180, true, true, true, true]);
  /* right to left: the arrow mirrors */
  await open(fw, 2, "&dir=rtl");
  check("rtl: the external arrow mirrors", await q(`getComputedStyle(document.querySelector("${A} [data-slot=link-external] svg")).transform`), "matrix(-1, 0, 0, 1, 0, 0)");
  /* dark */
  await open(fw, 0, "&theme=dark");
  check("dark: accent-ink of the dark theme", (await q(look))[0], await token("--fndn-accent-ink"));
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
