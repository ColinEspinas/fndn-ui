// Trigger menu, condition rows, reorder without drag, add / remove and motion contract of the
// Flowchart, run against every target through the harness.
//   node components/flowchart/flowchart.test.mjs            all four targets
//   node components/flowchart/flowchart.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=flowchart]";
const CARD = `${R} button[data-slot=flowchart-card]`;
const p = await launch({ hover: true });
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };
/* mount a worstCase entry through the harness module */
const mountWorst = (fw, i) => p.eval(`(async()=>{const spec=(await (await import("/src/harness/specs.ts")).specOf("flowchart"));const {mountExample}=await import("/src/harness/mount.ts");await mountExample(document.querySelector("#stage"),{...spec,examples:spec.worstCase},"${fw}",${i});return true})()`);

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  /* the rows as "property=value" pairs, read from the select triggers */
  const rows = () => q(`[...document.querySelectorAll("${R} [data-slot=flowchart-row]")].map((r)=>[...r.querySelectorAll("[data-slot=select-value]")].map((v)=>v.textContent.trim()).join("="))`);
  const labels = () => q(`[...document.querySelectorAll("${R} [data-slot=flowchart-row]")].map((r)=>[r.querySelector("[data-slot=flowchart-handle]").getAttribute("aria-label"),r.querySelector("[data-slot=flowchart-joiner]").textContent.trim(),...[...r.querySelectorAll("[data-slot=select-trigger]")].map((t)=>t.getAttribute("aria-label"))].join("|"))`);
  const focused = () => q(`document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent.trim() ?? null`);
  /* the popup a trigger controls (portaled out of the component) */
  const popupOf = (sel) => `document.getElementById(document.querySelector(${JSON.stringify(sel)}).getAttribute("aria-controls"))`;
  const items = (sel) => q(`[...${popupOf(sel)}.querySelectorAll("[role^=menuitem], [role=option]")].map((n)=>(n.textContent.trim())+(n.hasAttribute("data-disabled")?" (disabled)":""))`);
  const clickItem = async (sel, text) => {
    const r = await q(`(()=>{const n=[...${popupOf(sel)}.querySelectorAll("[role^=menuitem], [role=option]")].find((n)=>n.textContent.trim().startsWith(${JSON.stringify(text)}));const b=n.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
    await p.click(r.x, r.y);
  };
  const handle = (n) => `${R} [data-slot=flowchart-row]:nth-child(${n}) [data-slot=flowchart-handle]`;
  const propSel = (n) => `${R} [data-slot=flowchart-row]:nth-child(${n}) [data-slot=select]:nth-of-type(1) [data-slot=select-trigger]`;
  const valueSel = (n) => `${R} [data-slot=flowchart-row]:nth-child(${n}) [data-slot=select]:nth-of-type(2) [data-slot=select-trigger]`;
  const focus = (sel) => q(`(document.querySelector(${JSON.stringify(sel)}).focus({focusVisible:true}), document.documentElement.dataset.fndnInput="keyboard", true)`);

  p.errors.length = 0;
  await p.media([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto(`${BASE}/harness.html?c=flowchart&fw=${fw}&ex=0`, 300); await ready();

  check("trigger card is a menu button; conditions are a labelled group of an ordered list", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CARD)});const g=document.querySelector("${R} [data-slot=flowchart-card][role=group]");return [c.tagName,c.getAttribute("aria-haspopup"),c.getAttribute("aria-expanded"),g.getAttribute("role"),g.getAttribute("aria-label"),g.querySelector("[data-slot=flowchart-conditions]").tagName]})()`), ["BUTTON", "menu", "false", "group", "Conditions", "OL"]);
  check("rows read as sentences, every control labelled with its row", [await rows(), await labels()], [["plan=Enterprise", "region=Asia Pacific (Sydney, Singapore, Tokyo)"], ["Condition 1 options|If|Condition 1 property|Condition 1 value", "Condition 2 options|and|Condition 2 property|Condition 2 value"]]);
  check("connector: decorative, centred under the trigger card, from its bottom to the condition card's top", await q(`(()=>{const e=document.querySelector("${R} [data-slot=flowchart-edge]");const a=document.querySelector(${JSON.stringify(CARD)}).getBoundingClientRect();const c=document.querySelector("${R} [data-slot=flowchart-card][role=group]").getBoundingClientRect();const b=e.getBoundingClientRect();return [e.getAttribute("aria-hidden"),Math.abs((b.left+b.right)/2-(a.left+a.right)/2)<1,Math.round(b.top-a.bottom),Math.round(b.bottom-c.top)]})()`), ["true", true, 0, 0]);
  check("nothing animates at rest", await q(`document.querySelector("${R}").getAnimations({subtree:true}).length`), 0);
  check("hover on the trigger card is gated", await q(`(()=>{const rules=[];const walk=(list,media)=>{for(const r of list){if(r.media)walk(r.cssRules,media+" "+r.media.mediaText);else if(r.selectorText)rules.push([r.selectorText,media]);else if(r.cssRules)walk(r.cssRules,media)}};for(const s of document.styleSheets){try{walk(s.cssRules,"")}catch{}}const els=[...document.querySelectorAll("${R} button[data-slot=flowchart-card], ${R} [data-slot=flowchart-handle]")];const hits=(sel)=>{if(!sel.includes(":hover"))return false;try{return els.some((el)=>el.matches(sel.replace(/:hover/g,"")))}catch{return false}};const hover=rules.filter(([s])=>hits(s));return hover.length>0&&hover.every(([,m])=>/hover: hover/.test(m)&&/pointer: fine/.test(m))})()`), true);

  /* trigger menu, pointer */
  await p.clickSel(CARD); await sleep(300);
  check("click on the trigger card opens the trigger menu", [await q(`document.querySelector(${JSON.stringify(CARD)}).getAttribute("aria-expanded")`), await items(CARD)], ["true", ["New order created", "Order paid", "Stock running low"]]);
  check("the open trigger menu paints above the nodes (topmost at its centre)", await q(`(()=>{const c=${popupOf(CARD)};const b=c.getBoundingClientRect();const t=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return c.contains(t)})()`), true);
  check("the canvas no longer isolates its nodes", await q(`getComputedStyle(document.querySelector("${R}")).isolation`), "auto");
  await clickItem(CARD, "Order paid"); await sleep(300);
  /* the trigger list is a menu radio group with closeOnSelect: a pick closes the menu */
  check("picking a trigger updates the card, checks it and closes the menu", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CARD)});return [c.querySelector("[data-slot=flowchart-title]").textContent,c.querySelector("[data-slot=flowchart-caption]")?.textContent,${popupOf(CARD)}.querySelector("[aria-checked=true]")?.textContent.trim(),c.getAttribute("aria-expanded")]})()`), ["Order paid", "Runs when payment for an order clears", "Order paid", "false"]);
  /* trigger menu, keyboard */
  await focus(CARD); await p.key("Enter"); await sleep(250);
  await p.key("End"); await sleep(60); await p.key("Enter"); await sleep(250);
  check("keyboard: Enter opens, End + Enter picks the last trigger, closes and returns focus to the card", [await q(`document.querySelector(${JSON.stringify(CARD + " [data-slot=flowchart-title]")}).textContent`), await q(`document.querySelector(${JSON.stringify(CARD)}).getAttribute("aria-expanded")`), await q(`document.activeElement===document.querySelector(${JSON.stringify(CARD)})`)], ["Stock running low", "false", true]);
  await p.key("Enter"); await sleep(250);
  await p.key("Escape"); await sleep(250);
  check("Escape closes and returns focus to the card", [await q(`document.querySelector(${JSON.stringify(CARD)}).getAttribute("aria-expanded")`), await q(`document.activeElement===document.querySelector(${JSON.stringify(CARD)})`)], ["false", true]);

  /* reorder without a drag, from the keyboard */
  await focus(handle(1)); await p.key("Enter"); await sleep(250);
  check("row 1 handle menu: Move up disabled, Move down, Remove", await items(handle(1)), ["Move up (disabled)", "Move down", "Remove"]);
  await p.key("Escape"); await sleep(200);
  await focus(handle(1)); await p.key("ArrowDown"); await sleep(250);
  const hl = () => q(`${popupOf(handle(1))}.querySelector("[data-highlighted]")?.textContent.trim() ?? null`);
  check("ArrowDown opens the handle menu on its first enabled action", await hl(), "Move down");
  await p.key("Enter"); await sleep(400);
  check("Move down swaps the rows and renumbers them", [await rows(), await labels()], [["region=Asia Pacific (Sydney, Singapore, Tokyo)", "plan=Enterprise"], ["Condition 1 options|If|Condition 1 property|Condition 1 value", "Condition 2 options|and|Condition 2 property|Condition 2 value"]]);
  check("focus follows the moved row's handle", await focused(), "Condition 2 options");
  check("a reorder does not animate", await q(`document.querySelector("${R}").getAnimations({subtree:true}).length`), 0);
  await p.key("Enter"); await sleep(250); await p.key("Home"); await sleep(60);
  check("last row: Move down disabled, Home lands on Move up", [await items(handle(2)), await q(`${popupOf(handle(2))}.querySelector("[data-highlighted]")?.textContent.trim() ?? null`)], [["Move up", "Move down (disabled)", "Remove"], "Move up"]);
  await p.key("Enter"); await sleep(400);
  check("Move up puts it back; focus follows", [await rows(), await focused()], [["plan=Enterprise", "region=Asia Pacific (Sydney, Singapore, Tokyo)"], "Condition 1 options"]);

  /* property and value selects */
  await p.clickSel(propSel(2)); await sleep(300);
  await clickItem(propSel(2), "size"); await sleep(350);
  check("a new property resets the value to its first choice", await rows(), ["plan=Enterprise", "size=Small"]);
  await p.clickSel(valueSel(2)); await sleep(300);
  check("the value select offers the new property's choices", await items(valueSel(2)), ["Small", "Medium", "Large"]);
  await clickItem(valueSel(2), "Large"); await sleep(350);
  check("picking a value updates the row", await rows(), ["plan=Enterprise", "size=Large"]);

  /* add from the keyboard: instant, focus on the new property select */
  await focus(`${R} [data-flowchart=add]`); await p.key("Enter"); await sleep(400);
  check("keyboard add: new row on the first property, no reveal, focus on its property", [await rows(), await q(`document.querySelector("${R} [data-slot=flowchart-row]:nth-child(3)").hasAttribute("data-entering")`), await focused()], [["plan=Enterprise", "size=Large", "plan=Enterprise"], false, "Condition 3 property"]);

  /* remove from the keyboard: focus lands on the next row's handle */
  await focus(handle(2)); await p.key("Enter"); await sleep(250);
  await p.key("End"); await sleep(60); await p.key("Enter"); await sleep(400);
  check("Remove deletes the row; focus moves to the row now in its place", [await rows(), await focused()], [["plan=Enterprise", "plan=Enterprise"], "Condition 2 options"]);
  await focus(handle(2)); await p.key("Enter"); await sleep(250); await p.key("End"); await sleep(60); await p.key("Enter"); await sleep(400);
  check("removing the last row moves focus to the row above", [await rows(), await focused()], [["plan=Enterprise"], "Condition 1 options"]);

  /* add with the pointer: the row reveals once */
  await q(`document.documentElement.dataset.fndnInput="pointer"`);
  await p.clickSel(`${R} [data-flowchart=add]`); await sleep(60);
  const reveal = await q(`(()=>{const r=document.querySelector("${R} [data-slot=flowchart-row]:nth-child(2)");/* entrances are keyframe animations; the Add button's own press and hover transitions are not entrances */ const a=document.querySelector("${R}").getAnimations({subtree:true}).filter((x)=>x instanceof CSSAnimation);return [r.hasAttribute("data-entering"),a.length,a.map((x)=>x.animationName).join()]})()`);
  check("pointer add reveals the new row, and only it", reveal, [true, 1, "fndn-fade-up"]);
  check("…and opens its room as it fades (its row track grows, the card does not snap)", await q(`document.querySelector("${R} [data-slot=flowchart-row]:nth-child(2)").getAnimations().some((x)=>x.transitionProperty==="grid-template-rows")`), true);
  await sleep(500);
  check("the reveal runs once (data-entering is gone afterwards)", await q(`[...document.querySelectorAll("${R} [data-slot=flowchart-row]")].some((r)=>r.hasAttribute("data-entering"))`), false);


  /* reduced motion: the reveal is a plain fade */
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  check("reduced motion: the reveal does not travel", await q(`getComputedStyle(document.documentElement).getPropertyValue("--fndn-motion-enter-shift").trim()`), "0px");
  await p.media([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* worst cases (spec.worstCase) */
  await mountWorst(fw, 0); await sleep(500);
  check("long names stay inside the canvas", await q(`(()=>{const r=document.querySelector("${R}").getBoundingClientRect();return [...document.querySelectorAll("${R} *")].filter((n)=>n.getClientRects().length).every((n)=>{const b=n.getBoundingClientRect();return b.left>=r.left-0.5&&b.right<=r.right+0.5})})()`), true);
  check("long source name truncates with an ellipsis, its full name in a title", await q(`(()=>{const s=document.querySelector("${R} [data-slot=flowchart-source]");return [getComputedStyle(s.querySelector("[data-slot=flowchart-source-text]")).textOverflow, s.getAttribute("title")]})()`), ["ellipsis", "wholesale-order-line-item"]);
  await mountWorst(fw, 2); await sleep(400);
  check("zero conditions: no rows, Add condition still offered", await q(`[document.querySelectorAll("${R} [data-slot=flowchart-row]").length, !!document.querySelector("${R} [data-flowchart=add]")]`), [0, true]);
  await mountWorst(fw, 4); await sleep(400);
  check("labels: every fixed string comes from the labels prop", await q(`(()=>{const r=document.querySelector("${R}");const row=r.querySelector("[data-slot=flowchart-row]");return [...r.querySelectorAll("[data-slot=flowchart-kind]")].map((n)=>n.textContent.trim()).concat([r.querySelector("[data-slot=flowchart-card][role=group]").getAttribute("aria-label"),row.querySelector("[data-slot=flowchart-joiner]").textContent.trim(),row.querySelector("[data-slot=flowchart-operator]").textContent.trim(),row.querySelector("[data-slot=flowchart-handle]").getAttribute("aria-label"),r.querySelectorAll("[data-slot=flowchart-row]")[1].querySelector("[data-slot=flowchart-joiner]").textContent.trim(),r.querySelector("[data-flowchart=add]").textContent.trim()])})()`), ["المُشغِّل", "إذا / وإلا", "الشروط", "إذا", "هو", "خيارات الشرط 1", "و", "إضافة شرط"]);
  await q(`document.documentElement.dir="rtl"`); await sleep(100);
  check("right-to-left: the row reads from the right (handle rightmost)", await q(`(()=>{const r=document.querySelector("${R} [data-slot=flowchart-row]");const h=r.querySelector("[data-slot=flowchart-handle]").getBoundingClientRect();const j=r.querySelector("[data-slot=flowchart-joiner]").getBoundingClientRect();return h.left>j.left})()`), true);
  await q(`document.documentElement.dir="ltr"`);
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
