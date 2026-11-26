// Keyboard and pointer contract of the Diff Table, run against every target through the harness.
//   node components/diff-table/diff-table.test.mjs            all four targets
//   node components/diff-table/diff-table.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2, hover: true });
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=diff-table&fw=${fw}&ex=0`, 100);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(25); }
  const q = (js) => p.eval(js);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  try {
  /* nothing plays on a row from the first paint; the root is marked painted (data-enter) after it */
  const rowAnims = `document.getAnimations().filter((a)=>a.effect?.target?.closest?.("#stage [data-slot=diff-table-row]")).map((a)=>a.transitionProperty??a.animationName)`;
  check("no transition or animation runs on a row from the first paint", await q(rowAnims), []);
  const rectsJs = `[...document.querySelectorAll("#stage [data-slot=diff-table-bar], #stage [data-slot=diff-table-th], #stage [data-slot=diff-table-row], #stage [data-slot=diff-table-footer]")].map((e)=>{const b=e.getBoundingClientRect();return [b.x,b.width,b.height].map((n)=>Math.round(n*2)/2).join(",")}).join(" ")`;
  await sleep(500);
  const settled1 = await q(rectsJs);
  await sleep(300);
  check("nothing moves after mount; the root is marked painted", [settled1 === await q(rectsJs), await q(`document.querySelector("#stage [data-slot=diff-table]").hasAttribute("data-enter")`)], [true, true]);
  /* a row added once the table is painted reveals (a copy of the added row, inserted, then removed) */
  check("a row added later reveals (grid-template-rows transition)", await q(`(async()=>{const tr=document.querySelector('#stage tr:has([data-slot=diff-table-reveal])').cloneNode(true);tr.dataset.key="later";tr.querySelectorAll("input").forEach((i)=>i.removeAttribute("aria-label"));document.querySelector("#stage tbody").append(tr);await new Promise((r)=>requestAnimationFrame(()=>r()));const on=document.getAnimations().some((a)=>a.transitionProperty==="grid-template-rows"&&tr.contains(a.effect?.target));tr.remove();return on})()`), true);

  const marks = () => q(`[...document.querySelectorAll("#stage [data-slot=diff-table] [data-slot=checkbox-input]")].map((m)=>[m.type, m.getAttribute("aria-label"), String(m.checked), m.getAttribute("tabindex")])`);
  check("native table, include boxes are named checkboxes, one tab stop", [await q(`[document.querySelector("#stage table[data-slot=diff-table-table]") !== null, document.querySelectorAll("#stage th[scope=col]").length, document.querySelectorAll("#stage tbody > tr").length]`), await marks()],
    [[true, 3, 4], [["checkbox", "Remove Audit log export", "true", "0"], ["checkbox", "Remove Legacy SSO", "true", "-1"], ["checkbox", "Add Data residency", "true", "-1"]]]);
  const footer = () => q(`[document.querySelector("#stage [data-slot=diff-table-summary]")?.textContent.trim(), document.querySelector("#stage [data-slot=diff-table-footer] button")?.textContent.trim(), document.querySelector("#stage [data-slot=diff-table-footer] button")?.disabled]`);
  check("summary and Apply follow the selection", await footer(), ["2 removals · 1 addition", "Apply 3 changes", false]);

  /* alignment at device pixel ratio 2 */
  const align = await q(`(()=>{
    const r=(e)=>e.getBoundingClientRect();
    const th=[...document.querySelectorAll("#stage [data-slot=diff-table-th]")];
    const edges=[...document.querySelectorAll("#stage tbody > tr")].every((tr)=>[...tr.children].every((td,i)=>Math.abs(r(td).left-r(th[i]).left)<0.01&&Math.abs(r(td).right-r(th[i]).right)<0.01));
    const mid=(b)=>(b.top+b.bottom)/2;
    const marks=[...document.querySelectorAll("#stage [data-slot=diff-table] [data-slot=checkbox-control]")].map((m)=>Math.abs(mid(r(m))-mid(r(m.closest("td")))));
    const pills=[...document.querySelectorAll("#stage [data-slot=diff-table] [data-slot=status-pill]")].map((m)=>Math.abs(mid(r(m))-mid(r(m.closest("td")))));
    const icons=[...document.querySelectorAll("#stage [data-slot=diff-table] [data-slot=checkbox-mark][data-mark=check]")].map((i)=>{const a=r(i),b=r(i.parentElement);return Math.max(Math.abs(mid(a)-mid(b)),Math.abs((a.left+a.right)/2-(b.left+b.right)/2))});
    const dots=[...document.querySelectorAll("#stage [data-slot=diff-table] [data-slot=status-pill-dot]")].map((d)=>Math.abs(mid(r(d))-mid(r(d.parentElement))));
    const button=(()=>{const b=document.querySelector("#stage [data-slot=diff-table-footer] button"),f=document.querySelector("#stage [data-slot=diff-table-footer]");return Math.abs(mid(r(b))-mid(r(f)))})();
    return {edges, mark:Math.max(...marks)<=0.5, pill:Math.max(...pills)<=0.5, icon:Math.max(...icons)<=0.5, dot:Math.max(...dots)<=0.5, button:button<=0.5};
  })()`);
  check("column edges align; marks, pills, checks, dots and the button centred (±0.5px)", align, { edges: true, mark: true, pill: true, icon: true, dot: true, button: true });
  /* the background eases, and every transitioned property is a colour (no size, no transform) */
  check("row tint changes are colour only", await q(`(() => { const cs = getComputedStyle(document.querySelector("#stage [data-slot=diff-table-row]")); const props = cs.transitionProperty.split(", "), durs = cs.transitionDuration.split(", "); const moving = props.filter((_, i) => parseFloat(durs[i % durs.length]) > 0); return { background: moving.includes("background-color"), colourOnly: moving.every((x) => /(^|-)color$|^fill$|^stroke$/.test(x)) }; })()`), { background: true, colourOnly: true });

  /* row hover: lit and unlit at once (the tables' one hover is instant) */
  {
    const hr = await p.rect(`#stage [data-slot=diff-table-row]`);
    const paint = () => q(`(()=>{const e=document.querySelector("#stage [data-slot=diff-table-row]");const cs=getComputedStyle(e);return [cs.backgroundColor+"|"+cs.backgroundImage, e.getAnimations().filter((a)=>/background/.test(a.transitionProperty)).length]})()`);
    await p.hover(2, 2); await sleep(200); const rest = await paint();
    await p.hover(hr.x + 40, hr.cy); await q(`new Promise((r)=>requestAnimationFrame(r))`); const on = await paint();
    await p.hover(2, 2); await q(`new Promise((r)=>requestAnimationFrame(r))`); const off = await paint();
    check("row hover: lit at once, unlit at once (no background transition)", [on[0] !== rest[0], on[1], off[0] === rest[0], off[1]], [true, 0, true, 0]);
  }

  /* keyboard */
  await p.click(5, 5);
  await p.key("Tab");
  const focused = () => q(`document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.dataset.slot ?? null`);
  check("Tab lands on the first include box", await focused(), "Remove Audit log export");
  check("the include box shows the checkbox's focus ring", await q(`getComputedStyle(document.activeElement.closest("[data-slot=checkbox]").querySelector("[data-slot=checkbox-control]")).outlineStyle`), "solid");
  await p.key(" ");
  /* from the keyboard the row, its text and its pill change at once, like its box */
  check("Space: the row's tint, text and pill change at once (no transition running)", await q(`document.getAnimations().filter((a)=>a.effect?.target?.closest?.("#stage [data-slot=diff-table-row]")).map((a)=>a.transitionProperty)`), []);
  await sleep(250);
  check("Space excludes the row", [await q(`[String(document.activeElement.checked), getComputedStyle(document.activeElement.closest("tr")).backgroundColor !== getComputedStyle(document.querySelector("#stage [data-slot=diff-table-card]")).backgroundColor]`), await footer()], [["false", false], ["1 removal · 1 addition", "Apply 2 changes", false]]);
  check("the box empties: unchecked, the check faded", await q(`(()=>{const c=document.activeElement.closest("[data-slot=checkbox]").querySelector("[data-slot=checkbox-control]");return [c.dataset.state, getComputedStyle(c.querySelector("[data-slot=checkbox-mark][data-mark=check]")).opacity]})()`), ["unchecked", "0"]);
  await p.key("Enter"); await sleep(250);
  check("Enter includes it again", await q(`String(document.activeElement.checked)`), "true");
  await p.key("ArrowDown");
  check("ArrowDown moves to the next changed row", await focused(), "Remove Legacy SSO");
  await p.key("ArrowDown");
  check("ArrowDown skips unchanged rows", await focused(), "Add Data residency");
  await p.key("ArrowDown");
  check("ArrowDown stops at the last", await focused(), "Add Data residency");
  check("roving tabindex follows focus", (await marks()).map((m) => m[3]), ["-1", "-1", "0"]);
  await p.key("Home");
  check("Home goes to the first", await focused(), "Remove Audit log export");
  await p.key("End");
  check("End goes to the last", await focused(), "Add Data residency");
  await p.key("ArrowUp");
  check("ArrowUp moves back", await focused(), "Remove Legacy SSO");
  await p.key("Tab");
  check("Tab leaves the boxes for Apply", await q(`document.activeElement?.textContent.trim()`), "Apply 3 changes");

  /* pointer */
  await p.clickSel(`#stage tr[data-key="sso"] td:nth-child(1)`); await sleep(250);
  check("click on a changed row toggles it and focuses its box without a ring", [await q(`String(document.querySelector('#stage tr[data-key="sso"] [data-slot=checkbox-input]').checked)`), await focused(), await q(`getComputedStyle(document.querySelector('#stage tr[data-key="sso"] [data-slot=checkbox-control]')).outlineStyle`)], ["false", "Remove Legacy SSO", "none"]);
  await p.clickSel(`#stage tr[data-key="alerts"] td:nth-child(1)`); await sleep(100);
  check("unchanged rows do not toggle", await footer(), ["1 removal · 1 addition", "Apply 2 changes", false]);
  await p.clickSel(`#stage tr[data-key="audit"] td:nth-child(3)`);
  await p.clickSel(`#stage tr[data-key="residency"] td:nth-child(2)`); await sleep(100);
  check("nothing included disables Apply", await footer(), ["0 removals · 0 additions", "Apply 0 changes", true]);
  await p.clickSel(`#stage tr[data-key="residency"] [data-slot=checkbox-control]`); await sleep(100);
  check("clicking the box itself toggles once", await footer(), ["0 removals · 1 addition", "Apply 1 change", false]);

  /* apply */
  await p.clickSel("#stage [data-slot=diff-table-footer] button"); await sleep(40);
  check("Apply shows the accepted pill (its mark pops in) and moves focus to it", await q(`(()=>{const a=document.querySelector("#stage [data-diff-table=applied]");return [a?.textContent.trim(), document.activeElement===a, document.getAnimations().some((x)=>x.effect?.target===a?.querySelector("[data-slot=status-pill-mark]")&&x.transitionProperty==="transform")]})()`), ["1 edit applied", true, true]);
  check("after Apply the boxes are disabled, out of the tab order, and the hint is gone", await q(`[[...document.querySelectorAll("#stage [data-slot=diff-table] [data-slot=checkbox-input]")].every((m)=>m.disabled&&!m.hasAttribute("tabindex")), [...document.querySelectorAll("#stage [data-slot=diff-table-row]")].filter((r)=>getComputedStyle(r).cursor==="pointer").length, !!document.querySelector("#stage [data-slot=diff-table-hint]")]`), [true, 0, false]);
  await p.clickSel(`#stage tr[data-key="audit"] td:nth-child(1)`); await sleep(100);
  check("rows no longer toggle", await q(`String(document.querySelector('#stage tr[data-key="audit"] [data-slot=checkbox-input]').checked)`), "false");
  /* a phone-width card (288px): the category column takes a little more room and every pill is whole */
  await p.viewport(320, 900, 2);
  await p.goto(`${BASE}/harness.html?c=diff-table&fw=${fw}&ex=0`, 300);
  for (let t = 0; t < 60; t++) { if (await q(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await q(`(() => { const s = document.createElement("style"); s.textContent = "body{grid-template-columns:minmax(0,1fr) !important} #stage{box-sizing:border-box;width:100%;min-width:0;padding:16px !important}"; document.head.append(s); })()`);
  await sleep(300);
  check("at 320px every category pill is whole and no name is split mid-word", await q(`[[...document.querySelectorAll("#stage [data-slot=status-pill-label]")].filter((e) => e.scrollWidth > e.clientWidth).length, [...document.querySelectorAll('#stage td:nth-child(1)')].filter((td) => { const w = document.createTreeWalker(td, NodeFilter.SHOW_TEXT); let n, lines = 0; while ((n = w.nextNode())) { const r = document.createRange(); r.selectNodeContents(n); lines += r.getClientRects().length; } return lines > td.textContent.trim().split(/\\s+/).length; }).length]`), [0, 0]);
  await p.viewport(1280, 900, 2);
  /* zero rows: an empty-state block in the body, no Apply and no hint */
  await p.goto(`${BASE}/harness.html?c=diff-table&fw=${fw}&data=worst&ex=3`, 300);
  for (let t = 0; t < 60; t++) { if (await q(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  check("zero rows: an empty-state block across the columns, no Apply, no hint", await q(`(()=>{const e=document.querySelector("#stage tbody [data-slot=diff-table-empty][colspan='3'] > [data-slot=empty-state]");return [e && getComputedStyle(e).flexDirection==="column" ? "block" : "row", e?.textContent.trim(), !!document.querySelector("#stage [data-slot=diff-table-footer] button"), !!document.querySelector("#stage [data-slot=diff-table-hint]")]})()`), ["block", "No changes proposed", false, false]);
  } catch (error) { check("script ran to the end", String(error.message).split("\n")[0].slice(0, 160), "ok"); }
  check("no console errors", p.errors.slice(0, 2), []);
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
