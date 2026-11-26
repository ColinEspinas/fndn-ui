// Field: label, control (an Input when no children are given), helper and error wired by Ark's
// field (for / id, aria-describedby, aria-invalid, required, disabled); the Input field's metrics
// (6px gap, 12px ink-2 helper, red error); click on the label focuses the control; Tab; the
// error replaces the helper; worst cases, right-to-left, dark.
//   node components/field/field.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "field";
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

const F = "#stage [data-slot=field]";
const I = `${F} [data-slot=input]`;
const wiring = () => q(`(()=>{const f=document.querySelector(${JSON.stringify(F)});const l=f.querySelector("[data-slot=label]"),i=f.querySelector("[data-slot=input]"),h=f.querySelector("[data-slot=field-helper]"),e=f.querySelector("[data-slot=field-error]"),ri=f.querySelector("[data-slot=field-required-indicator]");
  return {role:f.getAttribute("role"), forId:l?.htmlFor===i.id&&!!i.id, mark:l?.dataset.field, describedby:i.getAttribute("aria-describedby"), helper:h?.id??null, error:e?.id??null, errorLive:e?.getAttribute("aria-live")??null,
    invalid:i.getAttribute("aria-invalid"), required:i.required, disabled:i.disabled, indicator:ri?[ri.textContent,ri.getAttribute("aria-hidden")]:null}})()`);
const gaps = () => q(`(()=>{const f=document.querySelector(${JSON.stringify(F)});const kids=[...f.children].map((c)=>c.getBoundingClientRect());return kids.slice(1).map((r,i)=>Math.round((r.top-kids[i].bottom)*100)/100)})()`);

async function run(fw, check) {
  await open(fw, 0);
  const tone = { ink2: await token("--fndn-ink-2", "color"), red: await token("--fndn-red", "color"), ink: await token("--fndn-ink", "color") };
  let w = await wiring();
  check("root: role group; label (data-field=label) for the control's id", [w.role, w.forId, w.mark], ["group", true, "label"]);
  check("the control is an Input (no children given), described by the helper", [await q(`document.querySelector(${JSON.stringify(I)})?.tagName`), w.describedby === w.helper && !!w.helper], ["INPUT", true]);
  check("the Input field's column: 6px between label, control and helper", await gaps(), [6, 6]);
  check("label 13px 500 ink; helper 12px ink-2", [...await css(`${F} [data-slot=label]`, ["fontSize", "fontWeight", "color"]), ...await css(`${F} [data-slot=field-helper]`, ["fontSize", "color"])], ["13px", "500", tone.ink, "12px", tone.ink2]);
  check("the label is only as wide as its text", await q(`(()=>{const f=document.querySelector(${JSON.stringify(F)}).getBoundingClientRect();const l=document.querySelector("${F} [data-slot=label]").getBoundingClientRect();return l.width<f.width/2})()`), true);

  /* pointer: a click on the label focuses the control */
  const lr = await p.rect(`${F} [data-slot=label]`);
  await p.click(lr.cx, lr.cy); await sleep(150);
  check("a click on the label focuses the control", await q(`document.activeElement===document.querySelector(${JSON.stringify(I)})`), true);
  /* keyboard: Tab reaches the control, typing lands in it, the focus ring shows */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab"); await sleep(250);
  check("Tab focuses the control", await q(`document.activeElement===document.querySelector(${JSON.stringify(I)})`), true);
  await p.type("Lantern");
  check("typing lands in it; its ring is the Input's accent ring", [await q(`document.querySelector(${JSON.stringify(I)}).value`), (await css(I, ["boxShadow"]))[0]], ["Lantern", await shadowOf("0 0 0 1px var(--fndn-accent), 0 0 0 4px var(--fndn-accent-tint)")]);

  await open(fw, 1);
  w = await wiring();
  check("required: the control is required; the label's asterisk is aria-hidden and red", [w.required, w.indicator, (await css(`${F} [data-slot=field-required-indicator]`, ["color"]))[0]], [true, ["*", "true"], tone.red]);

  await open(fw, 2);
  w = await wiring();
  check("invalid: aria-invalid on the control, the error replaces the helper, aria-live polite", [w.invalid, w.helper, !!w.error, w.errorLive, w.describedby === w.error], ["true", null, true, "polite", true]);
  check("invalid: error 12px red; the control's red ring", [...await css(`${F} [data-slot=field-error]`, ["fontSize", "color"]), (await css(I, ["boxShadow"]))[0]], ["12px", tone.red, await shadowOf("0 0 0 1px var(--fndn-red)")]);

  await open(fw, 3);
  w = await wiring();
  check("disabled: the control is disabled, the label at half opacity", [w.disabled, (await css(`${F} [data-slot=label]`, ["opacity"]))[0]], [true, "0.5"]);
  await p.click(5, 5); await p.key("Tab"); await sleep(100);
  check("disabled: Tab skips the control", await q(`document.activeElement===document.querySelector(${JSON.stringify(I)})`), false);

  await open(fw, 4);
  w = await wiring();
  check("label only: nothing describes the control", [w.describedby, w.helper, w.error], [null, null, null]);

  /* the error's arrival: on first paint it is simply there; turning invalid later fades its ink in
   * (it takes its line at once); from the keyboard it is instant */
  await open(fw, 2);
  check("invalid at first paint: nothing animates", await q(`document.getAnimations().length`), 0);
  await open(fw, 5, "&play=1");
  await q(`new Promise((res)=>{const t0=performance.now();const tick=()=>{if(document.documentElement.dataset.harnessStep==="1"||performance.now()-t0>3000)return res();requestAnimationFrame(tick)};tick()})`);
  check("turns invalid after first paint: the error takes its line at once and fades its ink in", await q(`(()=>{const e=document.querySelector("${F} [data-slot=field-error]");return [!!e && e.getBoundingClientRect().height>0, document.getAnimations().filter((a)=>a.effect?.target===e).map((a)=>a.transitionProperty), !document.querySelector("${F} [data-slot=field-helper]")]})()`), [true, ["opacity"], true]);
  await open(fw, 5, "&play=1");
  await q(`document.documentElement.dataset.fndnInput="keyboard"`);
  await q(`new Promise((res)=>{const t0=performance.now();const tick=()=>{if(document.documentElement.dataset.harnessStep==="1"||performance.now()-t0>3000)return res();requestAnimationFrame(tick)};tick()})`);
  check("turns invalid from the keyboard: no fade", await q(`(()=>{const e=document.querySelector("${F} [data-slot=field-error]");return [!!e, getComputedStyle(e).transitionDuration.split(", ").every((d)=>parseFloat(d)===0)]})()`), [true, true]);

  /* worst cases: text wraps whole, nothing overflows */
  const fits = () => q(`(()=>{const f=document.querySelector(${JSON.stringify(F)});const fr=f.getBoundingClientRect();return [...f.querySelectorAll("*")].every((e)=>{const r=e.getBoundingClientRect();return r.right<=fr.right+0.5&&r.left>=fr.left-0.5})&&f.scrollWidth<=f.clientWidth+1})()`);
  for (const [i, name] of [[0, "long label and helper"], [1, "long error"], [2, "unbreakable label and helper (200px)"], [4, "narrow (120px)"]]) {
    await open(fw, i, "&data=worst");
    check(`worst ${name}: everything inside the field, nothing cut`, await fits(), true);
  }
  await open(fw, 0, "&data=worst");
  check("worst long label: it wraps (more than one line)", (await p.rect(`${F} [data-slot=label]`)).h > 25, true);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the label and the helper start at the right edge", await q(`(()=>{const f=document.querySelector(${JSON.stringify(F)}).getBoundingClientRect();const l=document.querySelector("${F} [data-slot=label]").getBoundingClientRect();const h=document.querySelector("${F} [data-slot=field-helper]");const range=document.createRange();range.selectNodeContents(h);const t=range.getBoundingClientRect();return [Math.abs(l.right-f.right)<1,Math.abs(t.right-f.right)<1]})()`), [true, true]);
  await open(fw, 2, "&theme=dark");
  check("dark: the error in the dark red", (await css(`${F} [data-slot=field-error]`, ["color"]))[0], await token("--fndn-red", "color"));
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
