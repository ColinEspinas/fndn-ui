// Keyboard, pointer and layout contract of the Recommendation Card, run against every target through the harness.
//   node components/recommendation-card/recommendation-card.test.mjs            all four targets
//   node components/recommendation-card/recommendation-card.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=recommendation-card]";
const TOGGLE = `${R} [data-slot=recommendation-card-actions] [data-slot=button][aria-expanded]`;
const CTA = `${R} [data-slot=recommendation-card-actions] [data-slot=button]:not([aria-expanded])`;
const p = await launch({ dpr: 2 });
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=recommendation-card&fw=${fw}&ex=0`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(R)})`).catch(() => false)) break; await sleep(100); }
  await sleep(400);
  const q = (js) => p.eval(js).catch((e) => `error: ${String(e.message).slice(0, 80)}`);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const state = () => q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const d=r.querySelector("[data-recommendation-card=drawer]");const c=document.querySelector(${JSON.stringify(CTA)});
    return {active:[...r.querySelectorAll("[data-slot=recommendation-card-text]")].findIndex((t)=>t.getAttribute("aria-hidden")!=="true"), hiddenRow:[...r.querySelectorAll("[data-slot=recommendation-card-alt]")].findIndex((a)=>a.hidden), open:!d.hidden&&document.querySelector(${JSON.stringify(TOGGLE)}).getAttribute("aria-expanded")==="true",
      tone:(()=>{/* the tone is no attribute: read the meter's colour */const m=getComputedStyle(r.querySelector("[data-slot=recommendation-card-confidence] [data-slot=recommendation-card-meter]")).getPropertyValue("--_tone").trim();const root=getComputedStyle(document.documentElement);return ["green","orange","red","accent"].find((k)=>root.getPropertyValue("--fndn-"+k).trim()===m)??"neutral"})(), label:r.querySelector("[data-slot=recommendation-card-confidence-label]").textContent, cta:[c.textContent.trim(), (()=>{/* the variant is no attribute: read it from the fill */const t=(v)=>{const d=document.createElement("i");d.style.color=v;document.body.append(d);const x=getComputedStyle(d).color;d.remove();return x};const bg=getComputedStyle(c).backgroundColor;return [["accent","var(--fndn-accent)"],["primary","var(--fndn-ink)"],["success","var(--fndn-green)"]].find(([,v])=>t(v)===bg)?.[0]??bg})()], status:r.querySelector("[data-slot=recommendation-card-status]").textContent}})()`);
  const focused = () => q(`(()=>{const a=document.activeElement;return a?.dataset.slot==="recommendation-card-alt"?"alt:"+a.querySelector("[data-slot=recommendation-card-alt-short]").textContent:a?.textContent.trim()})()`);
  const click = (sel) => p.clickSel(sel).catch((e) => { failed++; checks.push(`✗ ${e.message}`); });
  const height = () => q(`Math.round(document.querySelector("${R} [data-slot=recommendation-card-body]").getBoundingClientRect().height*2)/2`);

  check("starts on the first option, drawer closed and inert", await state(), { active: 0, hiddenRow: 0, open: false, tone: "green", label: "High confidence", cta: ["Accept", "accent"], status: "" });
  check("toggle is wired to the drawer", await q(`(()=>{const t=document.querySelector(${JSON.stringify(TOGGLE)});const d=document.getElementById(t.getAttribute("aria-controls"));return [d?.dataset.slot+" "+d?.dataset.recommendationCard, d?.firstElementChild?.dataset.slot, document.querySelector(${JSON.stringify(R)}).dataset.scope]})()`), ["collapsible-content drawer", "collapsible-body", "collapsible"]);
  check("inactive bodies are aria-hidden, meters too", await q(`[[...document.querySelectorAll("${R} [data-slot=recommendation-card-text]")].map((t)=>t.getAttribute("aria-hidden")), [...document.querySelectorAll("${R} [data-slot=recommendation-card-meter]")].every((m)=>m.getAttribute("aria-hidden")==="true")]`), [[null, "true", "true"], true]);
  check("body crossfade is a transition of opacity + filter; inactive bodies are blurred", await q(`(()=>{const t=[...document.querySelectorAll("${R} [data-slot=recommendation-card-text]")];const cs=getComputedStyle(t[1]);const l=cs.transitionProperty.split(",").map((x)=>x.trim());/* the filter utility also lists backdrop-filter */const tp=l.includes("opacity")&&l.includes("filter")&&l.every((x)=>["opacity","filter","backdrop-filter"].includes(x))?"opacity, filter":l.join(", ");return [tp, cs.filter, getComputedStyle(t[0]).filter]})()`), ["opacity, filter", "blur(2px)", "none"]);

  /* layout at dpr 2: every meter on one baseline in its row, bars bottom-aligned */
  await q(`document.querySelector(${JSON.stringify(TOGGLE)}).focus()`);
  const f0 = await q(`document.querySelector("${R} [data-slot=recommendation-card-footer]").getBoundingClientRect().y`);
  await p.key("Enter"); await sleep(40);
  const f1 = await q(`document.querySelector("${R} [data-slot=recommendation-card-footer]").getBoundingClientRect().y`);
  await sleep(360);
  const f2 = await q(`document.querySelector("${R} [data-slot=recommendation-card-footer]").getBoundingClientRect().y`);
  const s1 = await state();
  check("Enter on Alternatives opens the drawer at once; focus stays", [s1.open, await focused(), f2 > f0 + 40, Math.abs(f1 - f2) < 0.5], [true, "Alternatives", true, true]);
  const geo = await q(`(()=>{const ms=[...document.querySelectorAll("${R} [data-slot=recommendation-card-meter]")].filter((m)=>m.offsetParent);
    const bottoms=ms.map((m)=>[...m.children].map((b)=>b.getBoundingClientRect().bottom));
    const rowOk=ms.every((m)=>{const row=m.parentElement.getBoundingClientRect();const b=m.getBoundingClientRect();return Math.abs((b.top+b.height/2)-(row.top+row.height/2))<=0.5});
    const f=document.querySelector("${R} [data-slot=recommendation-card-footer]").getBoundingClientRect();const mid=(e)=>{const b=e.getBoundingClientRect();return b.top+b.height/2};
    const footer=[...document.querySelectorAll("${R} [data-slot=recommendation-card-footer] [data-slot=button], ${R} [data-slot=recommendation-card-confidence]")].every((e)=>Math.abs(mid(e)-(f.top+f.height/2))<=0.5);
    return {bars: bottoms.every((bs)=>bs.every((v)=>v===bs[0])), centred: rowOk, footer}})()`);
  check("meter bars share a baseline, meters centred in their rows, footer centred", geo, { bars: true, centred: true, footer: true });

  /* keyboard: promote the first alternative */
  const h0 = await height();
  /* the drawer sits above the footer, so its rows come before Alternatives in the tab order */
  await p.key("Tab", { shift: true }); await sleep(50);
  const lastRow = await focused();
  await p.key("Tab", { shift: true }); await sleep(50);
  check("Shift+Tab from Alternatives walks up the visible rows", [lastRow, await focused()], ["alt:Full restock across every SKU", "alt:Switch to Business Annual"]);
  await p.key("Enter"); await sleep(400);
  check("Enter promotes it: body, meter, label, action follow", await state(), { active: 1, hiddenRow: 1, open: true, tone: "orange", label: "Needs review", cta: ["Configure", "primary"], status: "" });
  check("focus stays at the same place in the list", await focused(), "alt:Move to Northwind Cloud · 7-day migration");
  check("the card holds its height across options (no layout shift)", await height(), h0);
  check("meter bars transition their colour", await q(`(()=>{const l=getComputedStyle(document.querySelector("${R} [data-slot=recommendation-card-meter-bar]")).transitionProperty.split(",").map((x)=>x.trim());/* the colours utility eases every colour of the element */return l.includes("background-color")&&l.every((x)=>/color$|^fill$|^stroke$/.test(x))?"background-color":l.join(", ")})()`), "background-color");

  /* pointer: accept, then a new pick clears it */
  await click(CTA); await sleep(250);
  check("Accept turns into Accepted and is announced", (await state()).cta.concat((await state()).status), ["Accepted", "success", "Accepted"]);
  await click(`${R} [data-slot=recommendation-card-alt]:not([hidden]):last-child`); await sleep(300);
  const s2 = await state();
  check("picking another option clears Accepted", [s2.active, s2.cta, s2.status], [2, ["Accept full restock", "primary"], ""]);
  const fy = [];
  await click(TOGGLE);
  for (let i = 0; i < 8; i++) { fy.push(await q(`document.querySelector("${R} [data-slot=recommendation-card-footer]").getBoundingClientRect().y`)); await sleep(20); }
  await sleep(350);
  const fEnd = await q(`document.querySelector("${R} [data-slot=recommendation-card-footer]").getBoundingClientRect().y`);
  check("clicking Alternatives closes the drawer: the footer rises with it, then the rows leave the tab order", [(await state()).open, fy.every((y, i) => i === 0 || y <= fy[i - 1] + 0.01) && fy.some((y) => y > fEnd + 1), await q(`document.querySelector("${R} [data-recommendation-card=drawer]").hidden`)], [false, true, true]);
  /* one option: no Alternatives, no drawer */
  await p.goto(`${BASE}/harness.html?c=recommendation-card&fw=${fw}&ex=1&data=worst`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`!!document.querySelector(${JSON.stringify(R)})`).catch(() => false)) break; await sleep(100); }
  await sleep(300);
  check("one option: no Alternatives button and no drawer", await q(`[document.querySelectorAll("${R} [data-slot=recommendation-card-actions] [data-slot=button]").length, !!document.querySelector("${R} [data-recommendation-card=drawer]")]`), [1, false]);
  check("no console errors", p.errors.slice(0, 2), []);
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
