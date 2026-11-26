// Input group: the group is the field (compared with a real Input: height, radius, hairline,
// fill, the focus and invalid rings), the Input inside draws nothing; text addons in ink-2 at the
// Input's padding; a press on addon text focuses the field; Tab; sizes; disabled; cut addons
// carry a title; worst cases, right-to-left, dark.
//   node components/input-group/input-group.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "input-group";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
/* hover: true makes headless Chromium report a mouse, so the gated hover rules apply */
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);
const shadowOf = (value) => q(`(()=>{const d=document.createElement("div");d.style.boxShadow=${JSON.stringify(value)};document.body.append(d);const v=getComputedStyle(d).boxShadow;d.remove();return v})()`);
const css = (sel, keys) => q(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const cs=getComputedStyle(e);return ${JSON.stringify(keys)}.map((k)=>cs[k])})()`);
const away = async () => { await p.hover(1200, 860); await sleep(300); };

const G = "#stage [data-slot=input-group]";
const I = `${G} [data-slot=input]`;
const LOOK = ["height", "borderRadius", "boxShadow", "backgroundColor"];
const focused = () => q(`document.activeElement===document.querySelector(${JSON.stringify(I)})`);

async function run(fw, check) {
  await open(fw, 0);
  const ring = await shadowOf("0 0 0 1px var(--fndn-accent), 0 0 0 4px var(--fndn-accent-tint)");
  const ink2 = await token("--fndn-ink-2", "color");
  check("root > start addon, the Input (data-input-group=input)", await q(`[...document.querySelector(${JSON.stringify(G)}).children].map((c)=>c.dataset.slot+(c.dataset.inputGroup?":"+c.dataset.inputGroup:""))`), ["input-group-start", "input:input"]);
  const group = await css(G, LOOK);
  const inner = await css(I, ["backgroundColor", "boxShadow", "height", "paddingInlineStart", "fontSize"]);
  const addon = await q(`(()=>{const g=document.querySelector(${JSON.stringify(G)}).getBoundingClientRect();const a=document.querySelector("${G} [data-slot=input-group-start]");const range=document.createRange();range.selectNodeContents(a);return {gap:Math.round((range.getBoundingClientRect().left-g.left)*100)/100,color:getComputedStyle(a).color,size:getComputedStyle(a).fontSize}})()`);
  /* the Input's own text starts as far from the group's edge as a plain Input's does from its own */
  await open(fw, 0, "", "input");
  check("the group looks as an Input at rest (32px, radius, hairline, field fill)", group, await css("#stage [data-slot=input]", LOOK));
  check("the Input inside is transparent, has no hairline, 32px, 14px, 8px from the addon", [inner[0], inner[1].replace(/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, )?/g, "") || "none", ...inner.slice(2)], ["rgba(0, 0, 0, 0)", "none", "32px", "8px", "14px"]);
  check("the addon: ink-2, 14px, 10px from the edge (the Input's padding)", [addon.color, addon.size, addon.gap], [ink2, "14px", 10]);

  /* keyboard: Tab focuses the Input; the group shows the Input's focus ring, the Input none */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab"); await sleep(300);
  check("Tab focuses the Input; the group carries the accent ring, the Input none", [await focused(), (await css(G, ["boxShadow"]))[0], (await css(I, ["boxShadow"]))[0].replace(/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, )?/g, "") || "none"], [true, ring, "none"]);
  await p.type("northwind.example");
  check("typing lands in the Input", await q(`document.querySelector(${JSON.stringify(I)}).value`), "northwind.example");

  /* pointer: hover fills the group; a press on the addon's text focuses the Input */
  await open(fw, 0);
  const a = await p.rect(`${G} [data-slot=input-group-start]`);
  await p.hover(a.cx, a.cy); await sleep(300);
  check("hovered (pointer): the group fills hover; the Input stays transparent", [(await css(G, ["backgroundColor"]))[0], (await css(I, ["backgroundColor"]))[0]], [await token("--fndn-hover"), "rgba(0, 0, 0, 0)"]);
  await p.click(a.cx, a.cy); await sleep(300);
  check("a press on the addon's text focuses the Input; the ring shows on the group", [await focused(), (await css(G, ["boxShadow"]))[0]], [true, ring]);
  await away();

  await open(fw, 2);
  check("both addons: start, Input, end; the Input 8px from each", [await q(`[...document.querySelector(${JSON.stringify(G)}).children].map((c)=>c.dataset.slot)`), ...(await css(I, ["paddingInlineStart", "paddingInlineEnd"]))], [["input-group-start", "input", "input-group-end"], "8px", "8px"]);
  await open(fw, 3);
  check("sm: 28px, 13px text, addon 8px from the edge", [(await p.rect(G)).h, (await css(I, ["fontSize"]))[0], await q(`(()=>{const g=document.querySelector(${JSON.stringify(G)}).getBoundingClientRect();const a=document.querySelector("${G} [data-slot=input-group-start]");const range=document.createRange();range.selectNodeContents(a);return Math.round((range.getBoundingClientRect().left-g.left)*100)/100})()`)], [28, "13px", 8]);
  await open(fw, 4);
  check("invalid: aria-invalid on the Input, the red ring on the group", [await q(`document.querySelector(${JSON.stringify(I)}).getAttribute("aria-invalid")`), (await css(G, ["boxShadow"]))[0]], ["true", await shadowOf("0 0 0 1px var(--fndn-red)")]);
  await p.click(5, 5); await p.key("Tab"); await sleep(300);
  check("invalid and focused: the red focus ring", (await css(G, ["boxShadow"]))[0], await shadowOf("0 0 0 1px var(--fndn-red), 0 0 0 4px var(--fndn-red-tint)"));
  await open(fw, 5);
  await p.click(5, 5); await p.key("Tab"); await sleep(100);
  check("disabled: the group at half opacity (the Input not again), Tab skips it", [(await css(G, ["opacity"]))[0], (await css(I, ["opacity"]))[0], await focused()], ["0.5", "1", false]);

  /* worst cases */
  const fits = () => q(`(()=>{const g=document.querySelector(${JSON.stringify(G)});const b=g.getBoundingClientRect();return [...g.children].every((e)=>{const x=e.getBoundingClientRect();return x.right<=b.right+0.5&&x.left>=b.left-0.5})})()`);
  await open(fw, 0, "&data=worst");
  check("worst long addons: cut at their ends with a title, the Input keeps room, nothing outside", [await fits(), await q(`[...document.querySelectorAll("${G} [data-slot^=input-group-]")].map((a)=>a.getAttribute("title")===a.textContent)`), (await p.rect(I)).w > 20], [true, [true, true], true]);
  for (const [i, name] of [[1, "long value"], [2, "one character (120px)"], [4, "narrow (120px)"]]) {
    await open(fw, i, "&data=worst");
    check(`worst ${name}: nothing outside the group`, await fits(), true);
  }
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the start addon on the right", await q(`(()=>{const g=document.querySelector(${JSON.stringify(G)}).getBoundingClientRect(),a=document.querySelector("${G} [data-slot=input-group-start]").getBoundingClientRect();return a.right>g.right-20})()`), true);
  await open(fw, 2, "&theme=dark");
  check("dark: the dark field fill, addon ink-2", [(await css(G, ["backgroundColor"]))[0], (await css(`${G} [data-slot=input-group-end]`, ["color"]))[0]], [await token("--fndn-field"), await token("--fndn-ink-2", "color")]);
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
