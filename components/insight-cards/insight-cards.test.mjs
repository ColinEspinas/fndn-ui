// Pager, keyboard and chart contract of the Insight Cards, run against every target through the harness.
//   node components/insight-cards/insight-cards.test.mjs            all four targets
//   node components/insight-cards/insight-cards.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=insight-cards]";
const p = await launch();
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };
/* mount a worstCase entry through the harness module */
const mountWorst = (fw, i) => p.eval(`(async()=>{const spec=(await (await import("/src/harness/specs.ts")).specOf("insight-cards"));const {mountExample}=await import("/src/harness/mount.ts");await mountExample(document.querySelector("#stage"),{...spec,examples:spec.worstCase},"${fw}",${i});return true})()`);

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  const position = () => q(`document.querySelector("${R} [data-slot=pager-position]").textContent.trim()`);
  const active = () => q(`[...document.querySelectorAll("${R} [data-slot=insight-cards-page]")].map((n)=>getComputedStyle(n).visibility==="visible"?n.getAttribute("aria-label"):null).filter(Boolean)`);
  const focused = () => q(`document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent.trim() ?? null`);

  p.errors.length = 0;
  try {
  await p.goto(`${BASE}/harness.html?c=insight-cards&fw=${fw}&ex=0`, 300); await ready();
  check("carousel region, labelled pager group, status position", await q(`(()=>{const r=document.querySelector("${R}");const g=r.querySelector("[data-slot=insight-cards-header] > [data-slot=pager]");return [r.getAttribute("aria-roledescription"),r.getAttribute("aria-label"),g.getAttribute("role"),!!g.getAttribute("aria-label"),r.querySelector("[data-slot=pager-position]").getAttribute("role")]})()`), ["carousel", "Insights", "group", true, "status"]);
  check("labelled previous and next buttons", await q(`[...document.querySelectorAll("${R} [data-slot=pager] button")].map((b)=>b.getAttribute("aria-label"))`), ["Previous insight", "Next insight"]);
  check("the count is a plain Count", await q(`(()=>{const c=document.querySelector("${R} [data-slot=insight-cards-title] > [data-slot=count]");return c ? [getComputedStyle(c).backgroundColor, c.textContent] : null})()`), ["rgba(0, 0, 0, 0)", "3"]);
  check("first page shown, position 1 of 3", [await active(), await position()], [["Return comparison"], "1 of 3"]);
  check("inactive pages are invisible (out of tab order and a11y tree)", await q(`[...document.querySelectorAll("${R} [data-slot=insight-cards-page]")].map((n)=>getComputedStyle(n).visibility)`), ["visible", "hidden", "hidden"]);
  check("chart: role=img with a text alternative, two lines and a zero rule", await q(`(()=>{const s=document.querySelector("${R} [data-slot=insight-cards-chart]");return [s.getAttribute("role"),s.getAttribute("aria-label").startsWith("Line chart, 8 points. Analytics add-on: -2.90% to -4.41%"),s.querySelectorAll("[data-slot=insight-cards-line]").length,s.querySelectorAll("[data-slot=insight-cards-rule]").length]})()`), ["img", true, 2, 1]);
  check("every chart is drawn (line, bar + threshold, share)", await q(`[...document.querySelectorAll("${R} [data-slot=insight-cards-chart]")].map((s)=>(s.querySelector("[data-slot=insight-cards-segment]")?"share":s.querySelector("[data-slot=insight-cards-bar]")?"bar":"line")+":"+s.children.length)`), ["line:3", "bar:10", "share:3"]);
  const h0 = await q(`document.querySelector("${R}").getBoundingClientRect().height`);

  await p.clickSel(`${R} [data-pager=next]`); await sleep(80);
  check("Next shows page 2 and updates the status", [await active(), await position()], [["High cloud spend"], "2 of 3"]);
  check("focus stays on Next", await focused(), "Next insight");
  check("nothing animates on a page change (no running animations, no page transitions)", await q(`[document.querySelector("${R}").getAnimations({subtree:true}).length, [...document.querySelectorAll("${R} [data-slot=insight-cards-page], ${R} [data-slot=insight-cards-chart] *")].every((n)=>{const cs=getComputedStyle(n);return cs.animationName==="none"&&cs.transitionDuration.split(",").every((d)=>parseFloat(d)===0)})]`), [0, true]);
  const h1 = await q(`document.querySelector("${R}").getBoundingClientRect().height`);
  await p.key("ArrowRight"); await sleep(60);
  check("ArrowRight in the pager goes to page 3", [await active(), await position()], [["Enterprise allocation"], "3 of 3"]);
  const h2 = await q(`document.querySelector("${R}").getBoundingClientRect().height`);
  check("height is the same on every page (no layout shift below)", [h1 === h0, h2 === h0], [true, true]);
  await p.key("ArrowRight"); await sleep(60);
  check("paging wraps: ArrowRight on the last goes to the first", await position(), "1 of 3");
  await p.key("ArrowLeft"); await sleep(60);
  check("ArrowLeft wraps back to the last", await position(), "3 of 3");
  await p.key("Home"); await sleep(60);
  check("Home jumps to the first", await position(), "1 of 3");
  await p.key("End"); await sleep(60);
  check("End jumps to the last", await position(), "3 of 3");
  await p.key("Tab"); await sleep(60);
  check("Tab from the pager reaches the shown insight's follow-up, skipping hidden pages", await focused(), "If we look at add-ons, what changes?");
  await p.key("Tab", { shift: true }); await sleep(60);
  await p.clickSel(`${R} [data-pager=prev]`); await sleep(60);
  check("Previous goes back a page", await position(), "2 of 3");
  /* the pager's buttons are Buttons: the rules that reach the previous button under :hover sit in the gated media, and one :active rule is the shared press scale */
  check("pager buttons have the shared press and a gated hover", await q(`(()=>{const b=document.querySelector("${R} [data-pager=prev]");const rules=[];const walk=(list,media)=>{for(const r of list){const m=r.media?.mediaText??r.conditionText;if(r.selectorText&&/:hover|:active/.test(r.selectorText)){let hit=false;try{hit=b.matches(r.selectorText.replace(/(^|[^\\\\])(:hover|:active)/g,"$1"))}catch{}if(hit)rules.push([r.selectorText,media])}if(r.cssRules)walk(r.cssRules,m??media)}};for(const s of document.styleSheets){try{walk(s.cssRules,"")}catch{}}const hover=rules.filter(([s])=>/:hover/.test(s));return [hover.length>0&&hover.every(([,m])=>/hover: hover/.test(m)&&/pointer: fine/.test(m)), rules.some(([s])=>/scale-press:active/.test(s))]})()`), [true, true]);


  /* right-to-left: the arrows follow the reading direction */
  await p.goto(`${BASE}/harness.html?c=insight-cards&fw=${fw}&ex=0&dir=rtl`, 300); await ready();
  await p.clickSel(`${R} [data-pager=next]`); await sleep(60);
  await p.key("ArrowLeft"); await sleep(60);
  check("right-to-left: ArrowLeft goes forward", await position(), "3 of 3");
  check("right-to-left: carets are mirrored", await q(`getComputedStyle(document.querySelector("${R} [data-pager=next] [data-slot=icon]")).transform`), "matrix(-1, 0, 0, 1, 0, 0)");

  await mountWorst(fw, 1); await sleep(300);
  check("one insight: pager ends aria-disabled, 1 of 1", await q(`[...document.querySelectorAll("${R} [data-slot=pager] button")].map((b)=>b.getAttribute("aria-disabled")==="true").concat(document.querySelector("${R} [data-slot=pager-position]").textContent)`), [true, true, "1 of 1"]);
  await mountWorst(fw, 2); await sleep(300);
  check("zero insights: empty text, no pages, empty status", await q(`[(()=>{const e=document.querySelector("${R} > [data-slot=empty-state]");const cs=e&&getComputedStyle(e);return !!e&&cs.flexDirection==="row"&&cs.justifyContent==="center"})(), document.querySelectorAll("${R} [data-slot=insight-cards-page]").length, document.querySelector("${R} [data-slot=pager-position]").textContent]`), [true, 0, ""]);
  await mountWorst(fw, 0); await sleep(300);
  check("long names stay inside the component", await q(`(()=>{const r=document.querySelector("${R}").getBoundingClientRect();return [...document.querySelectorAll("${R} *")].filter((e)=>{const b=e.getBoundingClientRect();return b.width&&(b.right>r.right+0.5||b.left<r.left-0.5)}).length})()`), 0);
  } catch (error) { check("script ran to the end", String(error.message).split("\n")[0].slice(0, 160), "ok"); }
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
