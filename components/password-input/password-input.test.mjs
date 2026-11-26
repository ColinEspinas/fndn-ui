// Password input: an InputGroup (the Input's look) with a real Button at its end (ghost, xs,
// square, muted: compared with Search's clear button's sizes), Ark's password-input: type
// password / text, the trigger's name and aria-controls; a pointer press keeps the caret in the
// field, the keyboard toggles from the Button; the Tooltip names it; sizes, invalid, disabled,
// worst cases, right-to-left, dark.
//   node components/password-input/password-input.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "password-input";
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

const R = "#stage [data-slot=password-input]";
const G = `${R} [data-slot=input-group]`;
const I = `${R} [data-password-input=input]`;
const B = `${R} [data-password-input=visibility-trigger]`;
const state = () => q(`(()=>{const i=document.querySelector(${JSON.stringify(I)}),b=document.querySelector(${JSON.stringify(B)});return [i.type,b.getAttribute("aria-label"),b.getAttribute("aria-controls")===i.id&&!!i.id]})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("root (Ark's password-input) > InputGroup > Input + Button", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});return [r.dataset.scope,r.dataset.part,r.firstElementChild.dataset.slot,document.querySelector(${JSON.stringify(I)}).dataset.slot,document.querySelector(${JSON.stringify(B)}).dataset.slot]})()`), ["password-input", "root", "input-group", "input", "button"]);
  check("hidden: type password; the Button is 'Show password' and controls the input", await state(), ["password", "Show password", true]);
  check("the Input: no spellcheck, no autocapitalize, autocomplete current-password", await q(`(()=>{const i=document.querySelector(${JSON.stringify(I)});return [i.spellcheck,i.getAttribute("autocapitalize"),i.getAttribute("autocomplete")]})()`), [false, "off", "current-password"]);
  const g = await p.rect(G), b = await p.rect(B);
  check("32px field; the Button 24×24, 4px from the end, centred", [g.h, b.w, b.h, Math.round((g.x + g.w - (b.x + b.w)) * 100) / 100, Math.abs(b.cy - g.cy) <= 0.5], [32, 24, 24, 4, true]);
  check("the Button is ghost and muted (transparent, ink-3), round", [...await css(B, ["backgroundColor", "color", "borderRadius"])], ["rgba(0, 0, 0, 0)", await token("--fndn-ink-3", "color"), "999px"]);

  /* pointer: type, then press the Button: shown as text, the caret stays in the field */
  await p.click(g.x + 20, g.cy); await sleep(150);
  await p.type("lantern");
  await p.hover(b.cx, b.cy); await sleep(900);
  check("hovering the Button opens its Tooltip with its name", await q(`(()=>{const t=document.querySelector("[data-slot=tooltip]");return t?[t.textContent.trim(),getComputedStyle(t).visibility]:null})()`), ["Show password", "visible"]);
  const icon = () => q(`document.querySelector(${JSON.stringify(B)}+" svg")?.innerHTML`);
  const eye = await icon();
  await p.click(b.cx, b.cy); await sleep(250);
  check("a press shows the password (type text, 'Hide password'); focus stays in the field", [...(await state()).slice(0, 2), await q(`document.activeElement===document.querySelector(${JSON.stringify(I)})`), await q(`document.querySelector(${JSON.stringify(I)}).value`)], ["text", "Hide password", true, "lantern"]);
  check("the icon swapped at once (another glyph while shown)", [!!eye, (await icon()) !== eye], [true, true]);
  await p.click(b.cx, b.cy); await sleep(250);
  check("a second press hides it again", (await state()).slice(0, 2), ["password", "Show password"]);
  await away();

  /* keyboard: Tab to the field, Tab to the Button, Space / Enter toggle; focus stays on the Button */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab"); await sleep(150);
  check("Tab focuses the field; the group shows the accent ring", [await q(`document.activeElement===document.querySelector(${JSON.stringify(I)})`), (await css(G, ["boxShadow"]))[0]], [true, await shadowOf("0 0 0 1px var(--fndn-accent), 0 0 0 4px var(--fndn-accent-tint)")]);
  await p.key("Tab"); await sleep(150);
  check("Tab again: the Button", await q(`document.activeElement===document.querySelector(${JSON.stringify(B)})`), true);
  await p.key(" "); await sleep(150);
  check("Space shows the password; focus stays on the Button", [...(await state()).slice(0, 2), await q(`document.activeElement===document.querySelector(${JSON.stringify(B)})`)], ["text", "Hide password", true]);
  await p.key("Enter"); await sleep(150);
  check("Enter hides it", (await state()).slice(0, 2), ["password", "Show password"]);

  await open(fw, 1);
  check("visible (the model prop, uncontrolled): shown at mount", (await state()).slice(0, 2), ["text", "Hide password"]);
  await open(fw, 2);
  check("sm: 28px field, the Button 24px, 2px from the end", await q(`(()=>{const g=document.querySelector(${JSON.stringify(G)}).getBoundingClientRect(),b=document.querySelector(${JSON.stringify(B)}).getBoundingClientRect();return [g.height,b.height,Math.round((g.right-b.right)*100)/100]})()`), [28, 24, 2]);
  await open(fw, 3);
  check("invalid: aria-invalid on the input, the red ring on the group", [await q(`document.querySelector(${JSON.stringify(I)}).getAttribute("aria-invalid")`), (await css(G, ["boxShadow"]))[0]], ["true", await shadowOf("0 0 0 1px var(--fndn-red)")]);
  await open(fw, 4);
  await p.click(5, 5); await p.key("Tab"); await sleep(100);
  check("disabled: input and Button disabled, half opacity, Tab skips both", await q(`(()=>{const i=document.querySelector(${JSON.stringify(I)}),b=document.querySelector(${JSON.stringify(B)});return [i.disabled,b.disabled,getComputedStyle(document.querySelector(${JSON.stringify(G)})).opacity,document.activeElement===i||document.activeElement===b]})()`), [true, true, "0.5", false]);
  await open(fw, 5);
  check("new password: autocomplete new-password", await q(`document.querySelector(${JSON.stringify(I)}).getAttribute("autocomplete")`), "new-password");

  /* worst cases */
  const fits = () => q(`(()=>{const g=document.querySelector(${JSON.stringify(G)});const r=g.getBoundingClientRect();return [...g.children].every((e)=>{const x=e.getBoundingClientRect();return x.right<=r.right+0.5&&x.left>=r.left-0.5})})()`);
  for (const [i, name] of [[0, "long password, shown"], [1, "long password, hidden"], [4, "narrow (96px)"]]) {
    await open(fw, i, "&data=worst");
    check(`worst ${name}: the Button stays whole inside the field`, [await fits(), (await p.rect(B)).w], [true, 24]);
  }
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the Button at the left end", await q(`(()=>{const g=document.querySelector(${JSON.stringify(G)}).getBoundingClientRect(),b=document.querySelector(${JSON.stringify(B)}).getBoundingClientRect();return Math.round((b.left-g.left)*100)/100})()`), 4);
  await open(fw, 3, "&theme=dark");
  check("dark: the dark field fill and red", [(await css(G, ["backgroundColor"]))[0], (await css(G, ["boxShadow"]))[0]], [await token("--fndn-field"), await shadowOf("0 0 0 1px var(--fndn-red)")]);
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
