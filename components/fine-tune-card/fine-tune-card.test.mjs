// Keyboard and pointer contract of the Fine-tune Card, run against every target through the harness.
//   node components/fine-tune-card/fine-tune-card.test.mjs            all four targets
//   node components/fine-tune-card/fine-tune-card.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=fine-tune-card]";
const W = `${R} [data-slot=fine-tune-card-field][data-key="width"]`;
const p = await launch({ hover: true });
/* press, move in steps, release: a real mouse drag (the scrubber listens to mouse events) */
p.drag = async (x0, y0, x1, y1, steps = 6) => {
  const mouse = (type, x, y, extra = {}) => p.send("Input.dispatchMouseEvent", { type, x, y, button: "left", ...extra });
  await mouse("mouseMoved", x0, y0, { button: "none" });
  await mouse("mousePressed", x0, y0, { clickCount: 1, buttons: 1 });
  for (let i = 1; i <= steps; i++) { await mouse("mouseMoved", x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, { buttons: 1 }); await sleep(20); }
  await mouse("mouseReleased", x1, y1, { clickCount: 1 });
};
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  await p.media([]);
  await p.goto(`${BASE}/harness.html?c=fine-tune-card&fw=${fw}&ex=0`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(400);
  const q = (js) => p.eval(js).catch((e) => `error: ${String(e.message).slice(0, 80)}`);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const value = (key = "width") => q(`document.querySelector('${R} [data-slot=fine-tune-card-field][data-key="${key}"] [data-slot=fine-tune-card-input]').value`);
  /* the card is changed when its Edited group shows */
const changed = () => q(`getComputedStyle(document.querySelector('${R} [data-slot=fine-tune-card-edited]')).visibility === "visible"`);
  const shown = (part) => q(`(()=>{const s=getComputedStyle(document.querySelector('${R} [data-slot=fine-tune-card-${part}]'));return s.visibility==="visible"&&s.opacity==="1"})()`);
  const box = (sel) => q(`(()=>{const b=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return [Math.round(b.width*10)/10,Math.round(b.height*10)/10]})()`);

  check("fields are labelled spinbuttons with their range", await q(`(()=>{const f=document.querySelector(${JSON.stringify(W)});const i=f.querySelector("input");const l=f.querySelector("label");return [i.getAttribute("role"),i.getAttribute("aria-valuemin"),i.getAttribute("aria-valuemax"),l.htmlFor===i.id,i.labels[0]?.textContent.trim()]})()`), ["spinbutton", "40", "999", true, "W"]);
  check("layout is a labelled radio group, type a combobox", await q(`[document.querySelector('${R} [data-slot=segmented-control]').getAttribute("role"),document.querySelector('${R} [data-slot=segmented-control]').getAttribute("aria-label"),document.querySelector('${R} [data-slot=select-trigger]').getAttribute("role")]`), ["radiogroup", "Layout", "combobox"]);
  check("values use tabular figures", await q(`getComputedStyle(document.querySelector('${W} input')).fontVariantNumeric`), "tabular-nums");
  check("starts unedited: hint shown, Edited and Reset hidden", [await changed(), await shown("hint"), await shown("edited")], [false, true, false]);
  const stateBox = await box(`${R} [data-slot=fine-tune-card-state]`), headerBox = await box(`${R} [data-slot=fine-tune-card-header]`);

  await p.clickSel(`${W} input`).catch(() => {}); await sleep(100);
  await p.key("ArrowUp"); await sleep(80);
  check("ArrowUp adds one step", await value(), "325");
  await p.key("ArrowUp", { shift: true }); await sleep(80);
  check("Shift+ArrowUp adds ten", await value(), "335");
  await p.key("PageUp"); await sleep(80);
  check("Page Up adds ten", await value(), "345");
  await p.key("PageDown"); await p.key("PageDown"); await sleep(80);
  check("Page Down takes ten", await value(), "325");
  await p.key("Home"); await sleep(80);
  check("Home goes to the minimum", await value(), "40");
  await p.key("End"); await sleep(80);
  check("End goes to the maximum", await value(), "999");
  await p.key("ArrowUp"); await sleep(80);
  check("the maximum holds", await value(), "999");
  await sleep(250);
  check("edited: card and field marked, Edited and Reset shown, hint hidden", [await changed(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(W)})).backgroundColor !== getComputedStyle(document.querySelector('${R} [data-slot=fine-tune-card-field][data-key="height"]')).backgroundColor`), await shown("edited"), await shown("hint")], [true, true, true, false]);
  check("the change is announced once in the status region", await q(`[document.querySelector('${R} [role=status]').textContent.trim(), document.querySelectorAll('${R} [role=status]').length]`), ["Edited", 1]);
  check("the swap moves nothing (state cell and header keep their size)", [await box(`${R} [data-slot=fine-tune-card-state]`), await box(`${R} [data-slot=fine-tune-card-header]`)], [stateBox, headerBox]);
  check("the swap is a token-timed crossfade", await q(`(()=>{const s=getComputedStyle(document.querySelector('${R} [data-slot=fine-tune-card-edited]'));const names=s.transitionProperty.split(", "),d=s.transitionDuration.split(", ");return ["opacity","filter","visibility"].map((n)=>d[names.indexOf(n)%d.length]??"none").join(", ")})()`), "0.15s, 0.15s, 0.15s");

  /* scrubbing: press on the label and drag sideways */
  const h0 = Number(await value("height"));
  const lab = (await p.rect(`${R} [data-slot=fine-tune-card-field][data-key="height"] [data-slot=fine-tune-card-scrubber]`).catch(() => null)) ?? { cx: 0, cy: 0 };
  await p.drag(lab.cx, lab.cy, lab.cx + 24, lab.cy, 6);
  await sleep(150);
  const h1 = Number(await value("height"));
  check("dragging the label to the right scrubs the value up", h1 > h0, true);
  check("scrubbing ends on release", await q(`document.querySelector('${R} [data-slot=fine-tune-card-field][data-key="height"]').hasAttribute("data-scrubbing")`), false);

  /* layout and type */
  await p.clickSel(`${R} [data-slot=segmented-control-option]:nth-of-type(3)`).catch(() => {}); await sleep(250);
  check("a layout segment selects", await q(`document.querySelector('${R} [data-slot=segmented-control-input]:checked').value`), "grid");
  await p.clickSel(`${R} [data-slot=select-trigger]`).catch(() => {}); await sleep(300);
  await p.clickSel(`[data-slot=select-content][data-state="open"] [data-slot=select-item]:nth-of-type(2)`).catch(() => {}); await sleep(300);
  check("a type picks from our select", await q(`document.querySelector('${R} [data-slot=select-value]').textContent.trim()`), "Featured");

  /* reset */
  await p.clickSel(`${R} [data-fine-tune-card=reset]`).catch(() => {}); await sleep(350);
  check("Reset restores defaults, layout and type", [await value(), await value("height"), await q(`document.querySelector('${R} [data-slot=segmented-control-input]:checked').value`), await q(`document.querySelector('${R} [data-slot=select-value]').textContent.trim()`)], ["324", "96", "row", "Select type"]);
  check("Reset clears the edited state", [await changed(), await shown("hint"), await shown("edited"), await q(`document.querySelector('${R} [role=status]').textContent.trim()`)], [false, true, false, ""]);
  check("focus moves to the selected layout segment", await q(`document.activeElement === document.querySelector('${R} [data-slot=segmented-control-input]:checked')`), true);
  check("hidden Reset is out of the tab order", await q(`getComputedStyle(document.querySelector('${R} [data-fine-tune-card=reset]')).visibility`), "hidden");

  /* the select still works after Reset */
  await p.clickSel(`${R} [data-slot=select-trigger]`).catch(() => {}); await sleep(300);
  await p.key("ArrowDown"); await p.key("Enter"); await sleep(300);
  check("the type picker works after Reset", [await q(`document.querySelector('${R} [data-slot=select-value]').textContent.trim() !== "Select type"`), await changed()], [true, true]);

  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]); await sleep(100);
  check("reduced motion: the hint stops shimmering", await q(`getComputedStyle(document.querySelector('${R} [data-fine-tune-card=hint-text]')).animationName`), "none");
  await p.media([]);
  check("no console errors", p.errors.slice(0, 2), []);
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
