// Keyboard and pointer contract of the Menu, run against every target through the harness; item
// icons through the docs' example files when the docs server runs.
//   node components/menu/menu.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const T = "#stage [data-menu=trigger]";
const p = await launch();
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  const state = () => q(`document.querySelector(${JSON.stringify(T)}).getAttribute("data-state")`);
  const highlighted = () => q(`document.querySelector("[data-slot=menu-content] [data-highlighted] [data-slot=menu-item-text]")?.textContent.trim() ?? null`);
  const focusOnTrigger = () => q(`document.activeElement === document.querySelector(${JSON.stringify(T)})`);

  try {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=menu&fw=${fw}&ex=0`, 300); await ready();
  check("trigger announces a menu", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});return [t.getAttribute("aria-haspopup"),t.getAttribute("aria-expanded")]})()`), ["menu", "false"]);
  await p.clickSel(T); await sleep(350);
  check("click opens, focus moves into the menu", [await state(), await q(`(()=>{const c=document.querySelector("[data-slot=menu-content]");return c===document.activeElement||c.contains(document.activeElement)})()`)], ["open", true]);
  check("menu sits 4px under its trigger (±1px for pixel snapping)", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const b=document.querySelector("[data-slot=menu-content]").getBoundingClientRect();return Math.abs(b.top-t.bottom-4)<=1})()`), true);
  const row2 = await p.rect("[data-slot=menu-content] [data-slot=menu-item]:nth-of-type(2)");
  await p.hover(row2.cx, row2.cy); await sleep(300);
  check("hover highlights a row and the highlight glides to it", [await highlighted(), await q(`document.querySelector("[data-slot=menu-highlight]").hasAttribute("data-visible")`)], ["Duplicate", true]);
  await p.key("ArrowDown"); await sleep(80);
  check("ArrowDown skips the disabled item", await highlighted(), "Delete");
  await sleep(250);
  check("keyboard moves glide too (transform at duration.move) and land on the row", await q(`(()=>{const g=document.querySelector("[data-slot=menu-highlight]");const row=document.querySelector("[data-slot=menu-content] [data-highlighted]");const cs=getComputedStyle(g);const props=cs.transitionProperty.split(",").map((s)=>s.trim());const durs=cs.transitionDuration.split(",").map((s)=>parseFloat(s)*(s.trim().endsWith("ms")?1:1000));const move=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fndn-duration-move"));return [document.documentElement.dataset.fndnInput, durs[props.indexOf("transform")]===move, !!row && Math.abs(g.getBoundingClientRect().top-row.getBoundingClientRect().top)<1]})()`), ["keyboard", true, true]);
  await p.key("Home"); await sleep(80);
  check("Home goes to the first item", await highlighted(), "Rename");
  await p.key("d", { text: "d" }); await sleep(150);
  check("type-ahead jumps to the match", await highlighted(), "Duplicate");
  await p.key("Enter"); await sleep(300);
  check("Enter activates, closes and returns focus", [await state(), await focusOnTrigger()], ["closed", true]);
  await p.key("ArrowDown"); await sleep(200);
  check("ArrowDown on the trigger opens on the first item", [await state(), await highlighted()], ["open", "Rename"]);
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

  // options: checkbox and radio items keep the menu open and toggle their state
  await p.goto(`${BASE}/harness.html?c=menu&fw=${fw}&ex=1`, 300); await ready();
  await p.clickSel(T); await sleep(350);
  const optionState = (text) => q(`[...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")].find((n) => n.textContent.trim() === ${JSON.stringify(text)})?.getAttribute("data-state")`);
  const clickOption = async (text) => { const r = await q(`(()=>{const n=[...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")].find((n) => n.textContent.trim() === ${JSON.stringify(text)}); const b=n.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}})()`); await p.click(r.x, r.y); await sleep(150); };
  check("options render their initial state", [await optionState("Name"), await optionState("Date added"), await optionState("Supplier"), await optionState("Notes")], ["checked", "unchecked", "checked", "unchecked"]);
  await clickOption("Date added");
  check("a radio option moves the selection and the menu stays open", [await optionState("Name"), await optionState("Date added"), await state()], ["unchecked", "checked", "open"]);
  await clickOption("Notes"); await clickOption("Supplier");
  check("checkbox options toggle independently", [await optionState("Notes"), await optionState("Supplier"), await optionState("Category")], ["checked", "unchecked", "checked"]);
  check("option roles", await q(`[...new Set([...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")].map((n) => n.getAttribute("role")))].sort()`), ["menuitemcheckbox", "menuitemradio"]);
  /* the marks are the checkbox's and the radio's own controls, driven by the option's state */
  const controls = () => q(`[...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")].map((n) => { const c = n.firstElementChild; return [n.textContent.trim(), c?.dataset.slot, c?.dataset.state === n.getAttribute("data-state")]; })`);
  check("checkbox and radio options lead with the checkbox's and the radio's control, in step with the option", await controls(), [
    ["Name", "radio-group-control", true], ["Date added", "radio-group-control", true], ["Status", "radio-group-control", true],
    ["Supplier", "checkbox-control", true], ["Category", "checkbox-control", true], ["Notes", "checkbox-control", true]]);
  const markOf = (text) => `[...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")].find((n) => n.textContent.trim() === ${JSON.stringify(text)}).querySelector("[data-slot=checkbox-mark]")`;
  await clickOption("Notes"); await sleep(300);
  await clickOption("Notes"); await sleep(10);
  check("a pointer toggle draws the mark (clip-path transition, not a jump)", await q(`(()=>{const cs=getComputedStyle(${markOf("Notes")});const props=cs.transitionProperty.split(",").map((s)=>s.trim());const i=props.indexOf("clip-path");return [i>=0 && parseFloat(cs.transitionDuration.split(",")[i])>0, cs.clipPath!=="inset(0px)"]})()`), [true, true]);
  await sleep(400);
  check("…and the drawn mark ends whole", await q(`(()=>{const cs=getComputedStyle(${markOf("Notes")});return [cs.opacity, cs.clipPath]})()`), ["1", "inset(0px)"]);
  await p.key("End"); await sleep(100); await p.key(" "); await sleep(30);
  check("a keyboard toggle is instant (the checkbox is kbd-instant)", [await optionState("Notes"), await q(`getComputedStyle(${markOf("Notes")}).opacity`)], ["unchecked", "0"]);
  await p.key(" "); await sleep(30);
  await p.key("Escape"); await sleep(150);

  // a radio group with closeOnSelect closes the menu on a pick, from the pointer and the keyboard
  await p.goto(`${BASE}/harness.html?c=menu&fw=${fw}&ex=2`, 300); await ready();
  await p.clickSel(T); await sleep(350);
  await clickOption("Spacious"); await sleep(250);
  check("closeOnSelect: a pointer pick closes the menu", await state(), "closed");
  await p.key("ArrowDown"); await sleep(200);
  check("…and the pick stuck", await optionState("Spacious"), "checked");
  await p.key("Home"); await sleep(60); await p.key("Enter"); await sleep(250);
  check("closeOnSelect: Enter picks and closes, focus back on the trigger", [await optionState("Compact"), await state(), await focusOnTrigger()], ["checked", "closed", true]);

  // right-to-left: the popup carries dir=rtl and aligns to the trigger's start (right) edge
  await p.goto(`${BASE}/harness.html?c=menu&fw=${fw}&ex=0&dir=rtl`, 300); await ready();
  await p.clickSel(T); await sleep(350);
  check("rtl: popup is dir=rtl and aligned to the trigger's right edge", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)}).getBoundingClientRect();const c=document.querySelector("[data-slot=menu-content]");const b=c.getBoundingClientRect();return [c.closest("[dir]")?.getAttribute("dir"), getComputedStyle(c).direction, Math.abs(b.right-t.right)<=1]})()`), ["rtl", "rtl", true]);
  await p.key("ArrowDown"); await sleep(80);
  const order = await q(`(()=>{const rows=[...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")];const h=document.querySelector("[data-slot=menu-content] [data-highlighted]");return rows.indexOf(h)})()`);
  await p.key("ArrowDown"); await sleep(80);
  check("rtl: ArrowDown moves to the row below", (await q(`(()=>{const rows=[...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")];return rows.indexOf(document.querySelector("[data-slot=menu-content] [data-highlighted]"))})()`)) > order, true);
  await p.key("Escape"); await sleep(150);

  /* Mounted open: nothing animates because it mounted. The example is mounted in the page and its
   * first frames are read there: the popup at its final opacity and scale, no transition running.
   * Its close and a later open from the pointer still animate. */
  const C = "[data-slot=menu-content]";
  const frames = (mount, want) => q(`(async()=>{${mount}const c=()=>document.querySelector(${JSON.stringify(C)});for(let t=0;t<120&&c()?.dataset.state!==${JSON.stringify(want)};t++)await new Promise((r)=>requestAnimationFrame(r));const out=[];for(let i=0;i<4;i++){await new Promise((r)=>requestAnimationFrame(r));out.push([c().dataset.state,getComputedStyle(c()).opacity,getComputedStyle(c()).transform,c().getAnimations().length])}return out})()`);
  const moving = (out) => !Array.isArray(out) || out.some(([, o, t, n]) => o !== "1" || t !== "matrix(1, 0, 0, 1, 0, 0)" || n > 0);
  await p.goto(`${BASE}/harness.html?c=none`, 300); await sleep(300);
  const mFirst = await frames(`const m=await import("/src/harness/mount.ts");const spec=await (await import("/src/harness/specs.ts")).specOf("menu");await m.mountExample(document.querySelector("#stage"),spec,${JSON.stringify(fw)},spec.examples.findIndex((e)=>e.name==="Mounted open"));`, "open");
  check("mounted open: drawn at once, at rest from the first frame", [mFirst[0]?.[0], moving(mFirst)], ["open", false]);
  await p.click(5, 5);
  const mLeaving = await frames("", "closed");
  check("mounted open: its close from the pointer still animates", [mLeaving[0]?.[0], moving(mLeaving), await q(`document.querySelector(${JSON.stringify(C)}).hasAttribute("data-mounted-open")`)], ["closed", true, false]);
  await sleep(300);
  const mReopen = await frames(`document.querySelector(${JSON.stringify(T)}).click();`, "open");
  check("mounted open: opened again from the pointer, it animates", [mReopen[0]?.[0], moving(mReopen)], ["open", true]);
  await sleep(300);
  check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ crashed after "${checks.at(-1)?.slice(2, 50)}": ${String(e.message).split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { console.log(`${fw}: attempt ${attempt + 1} failed (retrying): ${checks.filter((c) => c.startsWith("✗")).slice(0, 3).join(" | ")}`); failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
/* item icons: the JSON fixtures cannot carry an icon component, so the docs' example files are read
 * in each framework when the docs server runs (http://localhost:4321, or DOCS_URL): actions
 * (row-actions, one danger) and sub-menu rows (pull-request-actions) lead with an aria-hidden 14px
 * icon, ink-3 or the danger row's red. Without the docs server this is skipped, not failed. */
{
  const SITE = BASE.replace(/\/$/, "");
  const listed = await fetch(`${SITE}/components/menu`).then((r) => r.ok, () => false);
  const rows = `(()=>{const c=[...document.querySelectorAll("[data-slot=menu-content]")].find((e)=>e.getClientRects().length);if(!c)return null;return [...c.querySelectorAll(":scope > [data-slot=menu-item], :scope > [data-slot=menu-group] > [data-slot=menu-item]")].map((r)=>{const i=r.querySelector(":scope > [data-slot=menu-item-icon]");return i&&i===r.firstElementChild&&i.getAttribute("aria-hidden")==="true"?[Math.round(i.querySelector("svg").getBoundingClientRect().width), getComputedStyle(i).color===getComputedStyle(r).color ? "row" : "ink-3", !!r.querySelector("[data-slot=menu-item-caret]")]:null})})()`;
  for (const fw of listed ? targets : []) {
    await p.goto(SITE + "/", 800);
    await p.eval(`localStorage.setItem("fndn-docs-fw", "${fw}"); true`);
    await p.goto(`${SITE}/components/menu`, 2500);
    const got = [];
    for (const ex of ["row-actions", "pull-request-actions"]) {
      const trig = `[data-docs-example="${ex}"] [aria-haspopup=menu]`;
      await p.eval(`document.querySelector('[data-docs-example="${ex}"]')?.scrollIntoView({ block: "center" }); true`);
      for (let t = 0; t < 80 && !(await p.eval(`!!document.querySelector(${JSON.stringify(trig)})`)); t++) await sleep(100);
      await p.clickSel(trig); await sleep(400);
      got.push(await p.eval(rows));
      await p.key("Escape"); await sleep(250);
    }
    const want = [[[14, "ink-3", false], [14, "ink-3", false], [14, "ink-3", false], [14, "row", false]], [[14, "ink-3", true], [14, "ink-3", true], [14, "row", false]]];
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failed++;
    console.log(`${fw}\n  ${ok ? "✓" : "✗"} item icons (docs examples): actions and sub-menu rows lead with an aria-hidden 14px icon, ink-3, red on a danger action${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
  }
  if (listed) await p.eval(`localStorage.removeItem("fndn-docs-fw"); true`).catch(() => {});
  else console.log(`– item icons: the docs server is not running at ${SITE}; skipped`);
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
