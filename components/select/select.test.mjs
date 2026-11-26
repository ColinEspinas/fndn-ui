// Keyboard and pointer contract of the Select, run against every target through the harness.
//   node components/select/select.test.mjs            all four targets
//   node components/select/select.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const T = "#stage [data-slot=select-trigger]";
const p = await launch();
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  try {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=select&fw=${fw}&ex=0`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
  const q = (js) => p.eval(js);
  const state = () => q(`document.querySelector(${JSON.stringify(T)}).getAttribute("data-state")`);
  const highlighted = () => q(`document.querySelector("[data-slot=select-content] [data-highlighted]")?.textContent.trim() ?? null`);
  const focusOnTrigger = () => q(`document.activeElement === document.querySelector(${JSON.stringify(T)})`);
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };

  check("trigger is a combobox with a listbox popup", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});return [t.getAttribute("role"),t.getAttribute("aria-haspopup"),t.getAttribute("aria-expanded")]})()`), ["combobox", "listbox", "false"]);
  check("popup is portaled out of the component", await q(`!document.querySelector("#stage [data-slot=select-positioner]") && !!document.querySelector("[data-slot=select-positioner]")`), true);
  await p.clickSel(T); await sleep(350);
  check("click opens", await state(), "open");
  const geo = await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const c=document.querySelector("[data-slot=select-content]");const b=c.getBoundingClientRect();return {gap:Math.round(b.top-t.bottom), sameWidth:Math.abs(b.width-t.width)<1, focusInside:c===document.activeElement||c.contains(document.activeElement)}})()`);
  check("popup sits 4px under the trigger, same width, holds focus", geo, { gap: 4, sameWidth: true, focusInside: true });
  const row2 = await p.rect("[data-slot=select-content] [data-slot=select-item]:nth-of-type(2)");
  await p.hover(row2.cx, row2.cy); await sleep(300);
  check("highlight glides to the hovered option", await q(`(()=>{const g=document.querySelector("[data-slot=select-highlight]");return [g.hasAttribute("data-visible"), g.style.transform]})()`), [true, "translateY(34px)"]);
  await p.key("ArrowDown"); await sleep(80);
  check("ArrowDown moves the highlight", await highlighted(), "Order summary");
  await sleep(250);
  check("keyboard moves glide too (transform at duration.move) and land on the row", await q(`(()=>{const g=document.querySelector("[data-slot=select-highlight]");const row=document.querySelector("[data-slot=select-content] [data-highlighted]");const cs=getComputedStyle(g);const props=cs.transitionProperty.split(",").map((s)=>s.trim());const durs=cs.transitionDuration.split(",").map((s)=>parseFloat(s)*(s.trim().endsWith("ms")?1:1000));const move=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fndn-duration-move"));return [document.documentElement.dataset.fndnInput, durs[props.indexOf("transform")]===move, !!row && Math.abs(g.getBoundingClientRect().top-row.getBoundingClientRect().top)<1]})()`), ["keyboard", true, true]);
  await p.key("Enter"); await sleep(300);
  check("Enter selects and closes", [await q(`document.querySelector("#stage [data-slot=select-value]").textContent.trim()`), await state()], ["Order summary", "closed"]);
  check("focus returns to the trigger", await focusOnTrigger(), true);
  await p.key("ArrowDown"); await sleep(150);
  check("ArrowDown on the trigger opens", await state(), "open");
  await p.key("f", { text: "f" }); await sleep(150);
  check("type-ahead jumps to the match", await highlighted(), "Feature card");
  await p.key("End"); await sleep(80);
  check("End stops at the last enabled option", await highlighted(), "Order summary");
  await p.key("Home"); await sleep(80);
  check("Home goes to the first option", await highlighted(), "Feature card");
  await p.key("Escape"); await sleep(200);
  check("Escape closes and returns focus", [await state(), await focusOnTrigger()], ["closed", true]);
  await p.clickSel(T); await sleep(250); await p.click(20, 20); await sleep(250);
  check("click outside closes", await state(), "closed");
  /* a pointer that closes the popup on its trigger leaves no ring; a key brings it back */
  const ring = () => q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});const probe=document.createElement("i");probe.style.color="var(--fndn-accent)";document.body.append(probe);const accent=getComputedStyle(probe).color;probe.remove();const cs=getComputedStyle(t);return cs.outlineStyle!=="none"||cs.boxShadow.includes(accent)})()`);
  await p.clickSel(T); await sleep(350); await p.clickSel(T); await sleep(350);
  check("pointer close on the trigger: focus stays on it, no ring", [await state(), await focusOnTrigger(), await ring()], ["closed", true, false]);
  await p.key("Tab"); await sleep(100); await p.key("Tab", { shift: true }); await sleep(150);
  check("…Tab away and back: the ring shows at once", [await focusOnTrigger(), await ring()], [true, true]);
  /* the caret is instant when the popup opens from the keyboard, animated from the pointer */
  /* the duration of the caret's turn: the transition list may hold several properties (the motion
   * utilities list one entry per kind), so read the entry of the transform */
  const caret = () => q(`(()=>{const cs=getComputedStyle(document.querySelector("#stage [data-slot=select-indicator]"));const props=cs.transitionProperty.split(",").map((x)=>x.trim());const durs=cs.transitionDuration.split(",").map((x)=>x.trim());const i=props.findIndex((x)=>x==="transform"||x==="rotate"||x==="all");return i<0?durs[0]:durs[i%durs.length]})()`);
  await q(`document.querySelector(${JSON.stringify(T)}).focus()`); await p.key("ArrowDown"); await sleep(30);
  check("keyboard open: the caret flips at once", [await state(), await caret()], ["open", "0s"]);
  await p.key("Escape"); await sleep(200);
  await p.clickSel(T); await sleep(30);
  check("pointer open: the caret turns over duration.move", [await state(), await caret()], ["open", "0.2s"]);
  await p.click(20, 20); await sleep(250);
  /* right-to-left: the quiet select is not as wide as the popup, so the start edge shows */
  await p.goto(`${BASE}/harness.html?c=select&fw=${fw}&ex=2&dir=rtl`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
  await p.clickSel(T); await sleep(350);
  check("rtl: popup is dir=rtl and aligned to the trigger's right edge", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const c=document.querySelector("[data-slot=select-content]");const b=c.getBoundingClientRect();return [c.closest("[dir]")?.getAttribute("dir"), getComputedStyle(c).direction, Math.abs(b.right-t.right)<=1, b.width>t.width]})()`), ["rtl", "rtl", true, true]);
  await p.key("ArrowDown"); await sleep(80);
  check("rtl: ArrowDown moves to the next row below", await q(`document.querySelector("[data-slot=select-content] [data-highlighted] [data-slot=select-item-text]")?.textContent.trim()`), "Heron 2");
  await p.key("Escape"); await sleep(200);
  /* ghost: content-sized with no width (the caret right after the value); given a width it fills
   * it and the caret sits at the end, as the ghost combobox's does */
  const caretGap = async (ex) => {
    await p.goto(`${BASE}/harness.html?c=select&fw=${fw}&ex=${ex}`, 300);
    for (let t = 0; t < 60; t++) { if (await p.eval(`location.search.endsWith("ex=${ex}") && "harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
    await sleep(300);
    return q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}),v=t.querySelector("[data-slot=select-value]").getBoundingClientRect(),i=t.querySelector("[data-slot=select-indicator]").getBoundingClientRect(),b=t.getBoundingClientRect(),root=t.closest("[data-slot=select]").getBoundingClientRect();return [Math.round(i.left-v.right), Math.round(b.right-i.right), Math.round(b.width)===Math.round(root.width)]})()`);
  };
  check("ghost, no width: as wide as its value, the caret 6px after it", await caretGap(2), [6, 6, true]);
  { const g = await caretGap(4);
    check("ghost given a width (220px): the trigger fills it, the caret at its end (6px in), as the combobox's", [g[0] > 20, g[1], g[2]], [true, 6, true]); }
  /* ghost, open: it stays a label (the darker fill an open ghost button keeps, no field fill, no
   * ring); the ring is for keyboard focus */
  { const tok = (name) => q(`(()=>{const d=document.createElement("i");d.style.background="var(${name})";document.body.append(d);const c=getComputedStyle(d).backgroundColor;d.remove();return c})()`);
    const look = () => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(T)}));return [cs.backgroundColor, cs.boxShadow]})()`);
    const t = await p.rect(T);
    await p.click(t.cx, t.cy); await sleep(400);
    check("ghost, open: the hover-2 fill of an open ghost button, no ring", [await state(), ...(await look())], ["open", await tok("--fndn-hover-2"), "none"]);
    await p.key("Escape"); await sleep(250);
    await p.click(5, 5); await p.key("Tab"); await sleep(150);
    check("ghost, keyboard focus: the field's ring on the surface fill", [await focusOnTrigger(), (await look())[0], (await look())[1].includes(await q(`(()=>{const d=document.createElement("i");d.style.color="var(--fndn-accent)";document.body.append(d);const c=getComputedStyle(d).color;d.remove();return c})()`))], [true, await tok("--fndn-surface"), true]); }
  check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ crashed after "${checks.at(-1)?.slice(2, 50)}": ${String(e.message).split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { console.log(`${fw}: attempt ${attempt + 1} failed (retrying): ${checks.filter((c) => c.startsWith("✗")).slice(0, 3).join(" | ")}`); failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
/* a press is never the hover colour, the small trigger's gated hover included */
{
  const h = await launch({ hover: true });
  await h.goto(`${BASE}/harness.html?c=select&fw=react&ex=1`, 300);
  for (let t = 0; t < 60; t++) { if (await h.eval(`"harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); }
  for (let t = 0; t < 60; t++) { if (await h.eval(`!!document.querySelector("#stage [data-slot=select-trigger]")`).catch(() => false)) break; await sleep(100); }
  await sleep(400);
  const r = await h.rect("#stage [data-slot=select-trigger]");
  const bg = () => h.eval(`getComputedStyle(document.querySelector("#stage [data-slot=select-trigger]")).backgroundColor`);
  const token = (n) => h.eval(`(()=>{const d=document.createElement("div");d.style.background="var(${n})";document.body.append(d);const c=getComputedStyle(d).backgroundColor;d.remove();return c})()`);
  await h.hover(r.cx, r.cy); await sleep(200);
  const hover = await bg();
  await h.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", buttons: 1, clickCount: 1 }); await sleep(200);
  const pressed = await bg();
  await h.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.cx, y: r.cy, button: "left", buttons: 0, clickCount: 1 }); await sleep(200);
  const ok = hover === await token("--fndn-hover") && pressed === await token("--fndn-hover-2");
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} size="sm" trigger: hover ${hover}, pressed ${pressed} (want --fndn-hover then --fndn-hover-2)`);
  await h.close();
}
/* The list is sized by its options: never narrower than the trigger, then as wide as the longest
 * option up to 360px, and an option longer than that wraps. Nothing in the list is ever cut with
 * an ellipsis. Example 3 is a 140px trigger with a short, a medium and a very long option. */
{
  const h = await launch({ hover: true });
  const measure = () => h.eval(`(() => {
    const t = document.querySelector("#stage [data-slot=select-trigger]").getBoundingClientRect();
    const c = [...document.querySelectorAll("[data-slot=select-content]")].find((e) => !e.hidden && e.getBoundingClientRect().height > 0);
    if (!c) return null;
    const b = c.getBoundingClientRect(), rtl = document.documentElement.dir === "rtl";
    const items = [...c.querySelectorAll("[data-slot=select-item]")];
    return { trigger: Math.round(t.width), content: Math.round(b.width), cut: items.filter((i) => { const x = i.querySelector("[data-slot=select-item-text]"); return x.scrollWidth > x.clientWidth + 1 || getComputedStyle(x).textOverflow === "ellipsis"; }).length,
      rows: items.map((i) => Math.round(i.getBoundingClientRect().height)), startEdge: Math.round(Math.abs(rtl ? b.right - t.right : b.left - t.left)), inView: b.left >= 0 && b.right <= innerWidth };
  })()`);
  const open = async (url) => {
    await h.goto(url, 300);
    for (let t = 0; t < 60; t++) { if (await h.eval(`"harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); }
    await sleep(350);
    await h.clickSel(T); await sleep(400);
  };
  const report = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  for (const fw of targets) {
    await open(`${BASE}/harness.html?c=select&fw=${fw}&ex=3`);
    report(`${fw}: a list of long options grows past its 140px trigger to the 360px cap, the longest option wraps, none is cut`, await measure(), { trigger: 140, content: 360, cut: 0, rows: [26, 26, 40, 26], startEdge: 0, inView: true });
    /* the one highlight covers the taller row too */
    const tall = await h.rect("[data-slot=select-content] [data-slot=select-item]:nth-of-type(3)");
    await h.hover(tall.cx, tall.cy); await sleep(450);
    report(`${fw}: the highlight takes the wrapped option's height`, await h.eval(`(() => { const g = document.querySelector("[data-slot=select-highlight]").getBoundingClientRect(), r = document.querySelector("[data-slot=select-content] [data-slot=select-item]:nth-of-type(3)").getBoundingClientRect(); return [Math.round(g.height), Math.round(Math.abs(g.top - r.top))]; })()`), [40, 0]);
    await open(`${BASE}/harness.html?c=select&fw=${fw}&ex=3&dir=rtl`);
    report(`${fw}: right-to-left, the wider list starts at the trigger's right edge`, await measure(), { trigger: 140, content: 360, cut: 0, rows: [26, 26, 40, 26], startEdge: 0, inView: true });
    await open(`${BASE}/harness.html?c=select&fw=${fw}&ex=1`);
    const small = await measure();
    report(`${fw}: short options keep the list as wide as its trigger`, [small.trigger, small.content, small.cut], [120, 120, 0]);
    /* nothing to choose from: the trigger is disabled, a click opens no empty list */
    await open(`${BASE}/harness.html?c=select&fw=${fw}&ex=4&data=worst`);
    report(`${fw}: no options — the trigger is disabled and a click opens nothing`, await h.eval(`(() => { const t = document.querySelector(${JSON.stringify(T)}); return [t.disabled || t.hasAttribute("data-disabled"), t.getAttribute("data-state"), !!document.querySelector("[data-slot=select-content][data-state='open']")]; })()`), [true, "closed", false]);
  }
  await h.close();
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
