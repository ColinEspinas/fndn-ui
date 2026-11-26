// Clipboard: the code block's two-state Copy button, alone or inside a read-only Input (Zag
// clipboard). The Button's look, copying by pointer and keyboard (the text reaches the
// clipboard, the states swap and come back, the status region speaks), the field (value,
// read-only, the icon Button inside its end), sizes, disabled, worst cases (a long value is cut
// before the button, an empty value disables it), right-to-left, dark, 320px.
//   node components/clipboard/clipboard.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "clipboard";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search, sel) => {
  for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(sel)})`).catch(() => false)) break; await sleep(100); }
  await sleep(250);
};
/* the clipboard is stubbed so headless runs need no permission: what was written is kept */
const open = async (fw, ex, extra = "", c = C) => {
  p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search, `#stage [data-slot=${c}]`);
  await q(`Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (t) => { window.__copied = t; } } })`);
};
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const T = "#stage [data-clipboard=trigger]";
const INPUT = "#stage [data-clipboard=input]";
const st = () => q(`(()=>{const b=document.querySelector(${JSON.stringify(T)});return [window.__copied ?? null, document.querySelector("#stage [data-slot=clipboard-status]").textContent, getComputedStyle(b).color]})()`);
const LOOK = ["height", "borderRadius", "fontSize", "color", "backgroundColor"];
const look = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);

async function run(fw, check) {
  await open(fw, 0);
  const green = await token("--fndn-green", "color"), ink2 = await token("--fndn-ink-2", "color");
  check("button: the Button (ghost, xs: 24px, chip radius, muted with a label: ink-2), named Copy, its two labels hidden from the name", [...(await look(T)), await q(`document.querySelector(${JSON.stringify(T)}).getAttribute("aria-label")`), await q(`[...document.querySelectorAll(${JSON.stringify(`${T} [data-slot=button-label] [data-slot=button-label]`)})].every((l)=>l.getAttribute("aria-hidden")==="true")`)], ["24px", "6px", "12px", ink2, "rgba(0, 0, 0, 0)", "Copy", true]);
  const w0 = (await p.rect(T)).w;
  /* the width eases with the labels' cross-fade; it does not jump in one frame before it */
  await q(`(()=>{window.__w=[];let n=0;const b=document.querySelector(${JSON.stringify(T)});const tick=()=>{window.__w.push(b.offsetWidth+0);if(++n<40)requestAnimationFrame(tick)};requestAnimationFrame(tick);return true})()`);
  await p.clickSel(T); await sleep(250);
  const w1 = (await p.rect(T)).w;
  check("Copy → Copied: the width eases over several frames (no jump of more than 4px in a frame)", await q(`(()=>{const w=window.__w;let big=0,steps=0;for(let i=1;i<w.length;i++){const d=w[i]-w[i-1];if(Math.abs(d)>4)big++;if(d>0)steps++}return [big, steps>=3]})()`), [0, true]);
  check("a click copies the value: Copied shows (green), the status region says so", await st(), ["npm install @fndn/react", "Copied", green]);
  check("the Button is as wide as the label it shows", [w1 > w0, await q(`getComputedStyle(document.querySelector(${JSON.stringify(`${T} [data-slot=button-label] [data-slot=button-label]:nth-child(2)`)})).opacity`)], [true, "1"]);
  await p.hover(1200, 860); await sleep(1600);
  check("after the timeout it is Copy again", [await q(`document.querySelector("#stage [data-slot=clipboard-status]").textContent`), Math.round((await p.rect(T)).w) === Math.round(w0)], ["", true]);
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab"); await p.key("Enter"); await sleep(250);
  check("Tab and Enter copy too", (await st()).slice(0, 2), ["npm install @fndn/react", "Copied"]);

  /* field */
  await open(fw, 1);
  check("field: the real Input, read-only, showing the value; 32px", await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});return [i.dataset.slot, i.readOnly, i.value, Math.round(i.getBoundingClientRect().height)]})()`), ["input", true, "sk_live_51HcK2pL8x0VQ7rT", 32]);
  check("the icon Button sits 4px inside the field's end, centred; the field keeps 34px for it", await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)}).getBoundingClientRect(),b=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();return [Math.round(i.right-b.right), Math.round(b.width), Math.round((b.top+b.bottom)/2-(i.top+i.bottom)/2), getComputedStyle(document.querySelector(${JSON.stringify(INPUT)})).paddingInlineEnd]})()`), [4, 24, 0, "34px"]);
  const b = await p.rect(T);
  await p.hover(b.cx, b.cy); await sleep(900);
  check("its Tooltip names it", await q(`document.querySelector("[data-slot=tooltip]")?.textContent.trim()`), "Copy");
  await p.click(b.cx, b.cy); await sleep(250);
  check("a click copies; the check shows (green)", [...(await st()).slice(0, 3), await q(`getComputedStyle(document.querySelector(${JSON.stringify(`${T} [data-slot=button-icon] > :nth-child(2)`)})).opacity`)], ["sk_live_51HcK2pL8x0VQ7rT", "Copied", green, "1"]);
  await open(fw, 2);
  check("small field: the Input's 28px, the Button inside it", await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)}).getBoundingClientRect(),b=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();return [Math.round(i.height), b.top>=i.top-0.5 && b.bottom<=i.bottom+0.5]})()`), [28, true]);
  await open(fw, 4);
  check("disabled: the field and the Button are disabled", await q(`[document.querySelector(${JSON.stringify(INPUT)}).disabled, document.querySelector(${JSON.stringify(T)}).disabled]`), [true, true]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("a long value is cut before the Button (the field scrolls, the text never runs under it)", await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});const cs=getComputedStyle(i);return [i.scrollWidth>i.clientWidth, cs.textOverflow, document.querySelector(${JSON.stringify(T)}).getBoundingClientRect().left>=i.getBoundingClientRect().right-parseFloat(cs.paddingInlineEnd)]})()`), [true, "ellipsis", true]);
  await open(fw, 1, "&data=worst");
  check("an empty value: the Button is disabled", await q(`document.querySelector(${JSON.stringify(T)}).disabled`), true);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl field: the Button sits inside the left end", await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)}).getBoundingClientRect(),b=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();return Math.round(b.left-i.left)})()`), 4);
  await open(fw, 0, "&theme=dark");
  await p.clickSel(T); await sleep(250);
  check("dark: Copied in the dark green", (await st())[2], await token("--fndn-green", "color"));

  await p.viewport(320, 700, 1.25);
  await open(fw, 0, "&data=worst");
  check("320px: the page does not scroll sideways", await q(`document.documentElement.scrollWidth<=320`), true);
  await p.viewport(1280, 900, 1.25);
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await p.viewport(1280, 900, 1.25).catch(() => {}); await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
