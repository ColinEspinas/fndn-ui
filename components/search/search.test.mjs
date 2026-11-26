// Keyboard and pointer contract of Search (Zag combobox kept open), run against every target.
//   node components/search/search.test.mjs            all four targets
//   node components/search/search.test.mjs vue        one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch();
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  try {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=search&fw=${fw}&ex=0`, 300);
  for (let t = 0; t < 80; t++) { if (await p.eval(`location.search.includes("fw=${fw}&") && "harnessReady" in document.documentElement.dataset && !!document.querySelector("[data-slot=search-input]")`).catch(() => false)) break; await sleep(100); }
  await sleep(300);
  const q = (js) => p.eval(js);
  const rows = () => q(`[...document.querySelectorAll("[data-slot=search-item]")].map((e) => e.textContent.trim())`);
  const highlighted = () => q(`document.querySelector("[data-slot=search-item][data-highlighted]")?.textContent.trim() ?? null`);
  const value = () => q(`document.querySelector("[data-slot=search-input]").value`);
  const focusInField = () => q(`document.activeElement === document.querySelector("[data-slot=search-input]")`);
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };

  /* focus shows nothing on the bar or the field (upstream: the caret is the indicator), both themes, pointer and keyboard */
  const look = `(()=>{const b=document.querySelector("[data-slot=search-bar]"),i=document.querySelector("[data-slot=search-input]");const cb=getComputedStyle(b),ci=getComputedStyle(i);return {border:[cb.borderTopColor,cb.borderRightColor,cb.borderBottomColor,cb.borderLeftColor,cb.borderBottomWidth].join(" "),ring:[ci.outlineStyle,cb.outlineStyle,ci.boxShadow,cb.boxShadow].join(" ")}})()`;
  for (const theme of ["light", "dark"]) {
    await q(`document.documentElement.classList.toggle("dark", ${theme === "dark"})`); await sleep(50);
    await q(`document.activeElement?.blur()`); await p.click(2, 2); await sleep(250);
    const rest = await q(look);
    await p.clickSel("[data-slot=search-input]"); await p.hover(2, 2); await sleep(250);
    const pointer = await q(look);
    await q(`document.activeElement?.blur()`); await p.click(2, 2); await sleep(50);
    await q(`(()=>{const b=document.createElement("button");b.id="qa-before";b.textContent="x";b.style.cssText="position:fixed;top:0;left:0;opacity:0";document.body.prepend(b);b.focus()})()`);
    await p.key("Tab"); await sleep(250);
    const keyboard = await q(look);
    const inField = await focusInField();
    await q(`document.getElementById("qa-before")?.remove()`);
    check(`${theme}: the bar's border colours are identical unfocused, pointer-focused and keyboard-focused; no ring on the field`, [inField, pointer.border === rest.border, keyboard.border === rest.border, rest.ring, pointer.ring, keyboard.ring], [true, true, true, "none none none none", "none none none none", "none none none none"]);
  }
  await q(`document.documentElement.classList.remove("dark")`);
  check("field is a combobox that controls a listbox of options", await q(`(()=>{const i=document.querySelector("[data-slot=search-input]"),l=document.querySelector("[data-slot=search-list]");return [i.getAttribute("role"),i.getAttribute("aria-expanded"),i.getAttribute("aria-controls")===l.id,l.getAttribute("role"),l.querySelector("[data-slot=search-item]").getAttribute("role"),!!i.getAttribute("aria-label")]})()`), ["combobox", "true", true, "listbox", "option", true]);
  check("an empty query shows the first `limit` rows", (await rows()).length, 5);
  check("clear button is hidden and out of the tab order", await q(`(()=>{const c=document.querySelector("[data-search=clear]");return [c.hidden,c.tabIndex]})()`), [true, -1]);
  await p.clickSel("[data-slot=search-input]"); await sleep(120);
  await p.key("ArrowDown"); await sleep(80);
  check("ArrowDown highlights the first option", await highlighted(), "Forecast Q4 demand");
  check("aria-activedescendant follows the highlight; focus stays in the field", await q(`[document.querySelector("[data-slot=search-input]").getAttribute("aria-activedescendant")===document.querySelector("[data-slot=search-item][data-highlighted]").id, document.activeElement===document.querySelector("[data-slot=search-input]")]`), [true, true]);
  /* keyboard moves glide too. Under keyboard input the layer travels over duration.move and lands on the active row */
  await p.key("ArrowDown"); await sleep(40);
  check("keyboard moves glide: duration.move on the layer while html[data-fndn-input=keyboard]", await q(`(()=>{const g=document.querySelector("[data-slot=search-highlight]");const move=getComputedStyle(document.documentElement).getPropertyValue("--fndn-duration-move").trim();return [document.documentElement.dataset.fndnInput, (()=>{const cs=getComputedStyle(g);const props=cs.transitionProperty.split(",").map((x)=>x.trim());return parseFloat(cs.transitionDuration.split(",")[props.indexOf("transform")])*1000 === parseFloat(move)})()]})()`), ["keyboard", true]);
  await sleep(350);
  check("…and the layer ends on the highlighted option", await q(`(()=>{const g=document.querySelector("[data-slot=search-highlight]"),a=document.querySelector("[data-slot=search-item][data-highlighted]");return g.hasAttribute("data-visible")&&Math.abs(g.getBoundingClientRect().y-a.getBoundingClientRect().y)<0.5})()`), true);
  await p.key("ArrowUp"); await sleep(80);
  await p.key("End"); await sleep(80);
  check("End jumps to the last option", await highlighted(), "Check connector status");
  await p.key("ArrowDown"); await sleep(80);
  check("ArrowDown wraps to the first option", await highlighted(), "Forecast Q4 demand");
  await p.key("End"); await sleep(60); await p.key("Home"); await sleep(80);
  check("Home jumps to the first option", await highlighted(), "Forecast Q4 demand");
  await p.type("co"); await sleep(250);
  check("typing filters, best match first (label starts with it, then a word does), and highlights the first", [await rows(), await highlighted()], [["Compare plan tiers", "Find contract renewals", "Check connector status", "Audit compute costs"], "Compare plan tiers"]);
  check("clear button appears with a query", await q(`document.querySelector("[data-search=clear]").hidden`), false);
  await p.key("Enter"); await sleep(250);
  check("Enter selects: the field takes the option's label", [await value(), await rows(), await focusInField()], ["Compare plan tiers", ["Compare plan tiers"], true]);
  await p.key("Escape"); await sleep(250);
  check("Escape clears the query", [await value(), (await rows()).length, await q(`document.querySelector("[data-search=clear]").hidden`), await focusInField()], ["", 5, true, true]);
  await p.type("zzzz"); await sleep(300);
  check("no match shows the empty state instead of the list", await q(`[document.querySelector("[data-slot=search-list]").hidden, document.querySelector("[data-search=empty]").hidden, document.querySelectorAll("[data-slot=search-item]").length]`), [true, false, 0]);
  await p.clickSel("[data-search=clear]"); await sleep(250);
  check("clear button empties the field and keeps focus in it", [await value(), (await rows()).length, await q(`document.querySelector("[data-search=empty]").hidden`), await focusInField()], ["", 5, true, true]);
  const third = await p.rect("[data-slot=search-item]:nth-of-type(3)");
  await p.hover(third.cx, third.cy); await sleep(350);
  check("pointer highlight glides to the hovered option", await q(`(()=>{const g=document.querySelector("[data-slot=search-highlight]");return [document.querySelector("[data-slot=search-item][data-highlighted]")?.textContent.trim(), g.hasAttribute("data-visible"), g.style.transform, getComputedStyle(g).transitionDuration.split(",").some((d) => parseFloat(d) > 0)]})()`), ["Compare plan tiers", true, "translateY(64px)", true]);  // 4px popup padding + two 30px rows
  await p.click(third.cx, third.cy); await sleep(250);
  check("click selects and focus stays in the field", [await value(), await focusInField()], ["Compare plan tiers", true]);
  check("no console errors", p.errors.slice(0, 2), []);
  /* worst-case data (rendered per framework): a result is never cut, it wraps like a select's option */
  await p.goto(`${BASE}/harness.html?c=search&fw=${fw}&ex=0&data=worst`, 300);
  for (let t = 0; t < 60; t++) { if (await q(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
  check("worst case: long results wrap, none is cut", await q(`[...document.querySelectorAll("[data-slot=search-item-text]")].filter((e) => e.scrollWidth > e.clientWidth + 1 || getComputedStyle(e).textOverflow === "ellipsis").length`), 0);
  await p.goto(`${BASE}/harness.html?c=search&fw=${fw}&ex=3&data=worst`, 300);
  for (let t = 0; t < 60; t++) { if (await q(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
  check("zero rows: the panel is the field alone (no empty band, no rule under it)", await q(`[Math.round(document.querySelector("[data-slot=search-panel]").getBoundingClientRect().height), getComputedStyle(document.querySelector("[data-slot=search-bar]")).borderBottomColor]`), [40, "rgba(0, 0, 0, 0)"]);
  /* groups, shortcuts and keywords (example 1) */
  await p.goto(`${BASE}/harness.html?c=search&fw=${fw}&ex=1`, 300);
  for (let t = 0; t < 60; t++) { if (await q(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
  check("groups: rows of a group are listed together under its label, groups in first-appearance order", await q(`[...document.querySelectorAll("[data-slot=search-group]")].map((g)=>[g.getAttribute("role"), g.querySelector("[data-slot=search-group-label]").textContent.trim(), g.getAttribute("aria-labelledby")===g.querySelector("[data-slot=search-group-label]").id, [...g.querySelectorAll("[data-slot=search-item-text]")].map((e)=>e.textContent.trim()).join(", ")])`), [["group", "Projects", true, "web-app, billing-api, docs-site"], ["group", "Actions", true, "Deploy to Production, Invite teammates"], ["group", "Preferences", true, "Switch to dark theme"]]);
  check("a shortcut is the real Kbd at the end of its row", await q(`(()=>{const k=document.querySelector("[data-search=item-shortcut]");const row=k.closest("[data-slot=search-item]");return [k.dataset.slot, [...k.querySelectorAll("[data-slot=kbd-key]")].map((e)=>e.textContent).join(" "), row.lastElementChild===k, Math.abs(k.getBoundingClientRect().right - (row.getBoundingClientRect().right - 8)) < 1]})()`), ["kbd", "⌘ D", true, true]);
  await p.clickSel("[data-slot=search-input]"); await sleep(100);
  await p.key("ArrowDown"); await sleep(60);
  await p.key("ArrowDown"); await sleep(60); await p.key("ArrowDown"); await sleep(60);
  check("arrows walk the rows as drawn (docs-site, listed third under Projects, comes before the actions)", await highlighted(), "docs-sitePreview");
  await p.key("ArrowDown"); await sleep(30);
  /* across a group label the highlight glides behind the label (above the layer); it is never drawn over the title */
  check("across a group label the highlight travels to the next row, behind the label (the label sits above it)", await q(`(()=>{const g=document.querySelector("[data-slot=search-highlight]"),a=document.querySelector("[data-slot=search-item][data-highlighted]"),l=document.querySelector("[data-slot=search-group-label]");const ls=l&&getComputedStyle(l),gs=getComputedStyle(g);return [a.textContent.trim(), !!l && ls.position!=="static" && (+ls.zIndex||0) > (+gs.zIndex||0)]})()`), ["Deploy to Production⌘D", true]);
  await p.type("ship"); await sleep(250);
  check("a keyword matches: 'ship' finds Deploy to Production, under its group", [await rows(), await q(`[...document.querySelectorAll("[data-slot=search-group-label]")].map((e)=>e.textContent.trim())`)], [["Deploy to Production⌘D"], ["Actions"]]);
  check("no console errors (groups)", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ crashed after "${checks.at(-1)?.slice(2, 50)}": ${String(e.message).split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { console.log(`${fw}: attempt ${attempt + 1} failed (retrying): ${checks.filter((c) => c.startsWith("✗")).slice(0, 3).join(" | ")}`); failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
