// Keyboard, pointer and layout contract of the Approval Card, run against every target through the harness.
//   node components/approval-card/approval-card.test.mjs            all four targets
//   node components/approval-card/approval-card.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=approval-card]";
const p = await launch({ dpr: 2, hover: true });
/* every transition that starts on a choice row, from the first paint on */
await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__rowRuns=[];document.addEventListener("transitionrun",(e)=>{if(e.target.closest?.("[data-slot=radio-group-item], [data-slot=checkbox]"))window.__rowRuns.push(String(e.target.dataset?.slot)+":"+e.propertyName)},true);` });
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=approval-card&fw=${fw}&ex=0`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=approval-card-step]")`).catch(() => false)) break; await sleep(100); }
  await sleep(500);
  const q = (js) => p.eval(js).catch((e) => `error: ${String(e.message).slice(0, 80)}`);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; (process.env.QA_TRACE && console.log(name, ok)), checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const index = () => q(`[...document.querySelectorAll("${R} [data-slot=approval-card-step]")].findIndex((s) => !s.inert)`);
  const view = () => q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});return !r.querySelector("[data-slot=approval-card-card]").hidden?"open":!r.querySelector("[data-slot=approval-card-sent]").hidden?"sent":"closed"})()`);
  const focused = () => q(`(()=>{const a=document.activeElement;const s=a?.closest("[data-slot=approval-card-step]");return a?[(/^(radio-group|checkbox)/.test(a.dataset.slot??"")?a.dataset.slot:(a.dataset.slot??a.className.split(" ")[0]))+(a.type?":"+a.type:""), s?[...s.parentElement.children].indexOf(s):-1, a.closest(":is([data-slot=checkbox], [data-slot=radio-group-item], [data-slot=radio-group-custom])")?[...a.closest(":is([data-slot=approval-card-options], [data-approval-card=options], [data-slot=approval-card-step] > [data-slot=radio-group])").querySelectorAll(":scope > :is([data-slot=checkbox], [data-slot=radio-group-item], [data-slot=radio-group-custom])")].indexOf(a.closest(":is([data-slot=checkbox], [data-slot=radio-group-item], [data-slot=radio-group-custom])")):-1]:null})()`);
  const checked = (step) => q(`[...document.querySelectorAll("${R} [data-slot=approval-card-step]")[${step}].querySelectorAll("[data-slot=radio-group-item], [data-slot=checkbox]")].map((o) => o.dataset.state === "checked" && o.querySelector("input").checked)`);
  const fitted = () => q(`(()=>{const v=document.querySelector("${R} [data-slot=approval-card-viewport]");const t=document.querySelector("${R} [data-slot=approval-card-track]");const s=t.querySelector(":scope > :not([inert])");const cs=getComputedStyle(t);return [Math.round(v.getBoundingClientRect().height)===s.offsetHeight, cs.transform==="none" && parseFloat(cs.marginTop)===-s.offsetTop]})()`);
  const clickText = async (sel) => p.clickSel(sel).catch((e) => { failed++; checks.push(`✗ ${e.message}`); });
  const buttonByText = (text) => `${R} [data-slot=approval-card-actions] [data-slot=button]:nth-child(${text === "skip" ? 1 : 2})`;

  /* first paint: the picked row is in its ink before the radio-group behaviour has written its state */
  check("no choice row recolours on first paint", await q(`window.__rowRuns`), []);
  /* a mount is not an arrival: a plain mount has no entrance */
  check("plain mount (appear off by default): no entrance (the card's animation is none)", await q(`getComputedStyle(document.querySelector("${R} [data-slot=approval-card-card]")).animationName`), "none");
  /* semantics */
  check("questions are a radiogroup / group labelled by the question", await q(`[...document.querySelectorAll("${R} :is([data-slot=approval-card-options], [data-approval-card=options], [data-slot=approval-card-step] > [data-slot=radio-group])")].map((g) => g.getAttribute("role") + ":" + (g.getAttribute("aria-label") === g.closest("[data-slot=approval-card-step]").querySelector("[data-slot=approval-card-question]").textContent))`), ["radiogroup:true", "group:true", "radiogroup:true"]);
  check("inactive questions are inert", await q(`[...document.querySelectorAll("${R} [data-slot=approval-card-step]")].map((s) => s.inert)`), [false, true, true]);
  check("status region and labelled nav buttons", await q(`[document.querySelector("${R} [data-slot=approval-card-status]").getAttribute("role"), ...[...document.querySelectorAll("${R} [data-pager=prev], ${R} [data-pager=next]")].map((b) => b.getAttribute("aria-label"))]`), ["status", "Previous question", "Next question"]);
  check("highlight layer is the shared glide that glides under the keyboard too", await q(`(()=>{const html=document.documentElement;const was=html.dataset.fndnInput;html.dataset.fndnInput="keyboard";const move=parseFloat(getComputedStyle(html).getPropertyValue("--fndn-duration-move"));const ok=[...document.querySelectorAll("${R} [data-slot=approval-card-step] :is([data-slot=approval-card-highlight], [data-slot=radio-group-highlight])")].every((h)=>{const cs=getComputedStyle(h);const props=cs.transitionProperty.split(",").map((s)=>s.trim());const d=cs.transitionDuration.split(",")[props.indexOf("transform")];return h.getAttribute("aria-hidden")!==null && parseFloat(d)*(d.trim().endsWith("ms")?1:1000)===move});if(was===undefined) delete html.dataset.fndnInput; else html.dataset.fndnInput=was;return ok})()`), true);
  check("card fits the first question", await fitted(), [true, true]);

  /* layout at dpr 2: control centred on the first text line, footer centred, counter digits fixed width */
  const geo = await q(`(()=>{const o=document.querySelector("${R} [data-slot=approval-card-step]:not([inert]) [data-slot=radio-group-item]");const c=o.querySelector("[data-slot=radio-group-control]").getBoundingClientRect();const l=o.querySelector("[data-slot=radio-group-item-text]");const lh=parseFloat(getComputedStyle(l).lineHeight);const lt=l.getBoundingClientRect().top;
    const f=document.querySelector("${R} [data-slot=approval-card-footer]").getBoundingClientRect();const mid=(e)=>{const b=e.getBoundingClientRect();return b.top+b.height/2};
    const items=[...document.querySelectorAll("${R} [data-pager=prev], ${R} [data-slot=pager-position], ${R} [data-pager=next], ${R} [data-slot=approval-card-actions] [data-slot=button]")];
    const counter=getComputedStyle(document.querySelector("${R} [data-slot=pager-position]")).fontVariantNumeric;
    const dw=[...document.querySelectorAll("${R} [data-slot=pager-reel] > span")].slice(0,10).map((s)=>s.getBoundingClientRect().width);
    return {control: Math.abs((c.top+c.height/2)-(lt+lh/2))<=0.5, footer: items.every((e)=>Math.abs(mid(e)-(f.top+f.height/2))<=0.5), tabular: counter.includes("tabular-nums"), digitWidths: new Set(dw.map((w)=>w.toFixed(2))).size===1}})()`);
  check("control centred on the first line, footer items centred, digits one width", geo, { control: true, footer: true, tabular: true, digitWidths: true });

  /* pointer: the highlight glides to the hovered row */
  const row2 = await p.rect(`${R} [data-slot=approval-card-step]:not([inert]) label:is([data-slot=checkbox], [data-slot=radio-group-item]):nth-of-type(2)`);
  await p.hover(row2.cx, row2.cy); await sleep(300);
  check("hover highlight glides to the row", await q(`(()=>{const s=document.querySelector("${R} [data-slot=approval-card-step]:not([inert])");const g=s.querySelector(":is([data-slot=approval-card-highlight], [data-slot=radio-group-highlight])");const r=s.querySelectorAll(":is([data-slot=checkbox], [data-slot=radio-group-item], [data-slot=radio-group-custom])")[1];return [g.hasAttribute("data-visible"), g.style.transform===\`translateY(\${r.offsetTop}px)\`]})()`), [true, true]);

  /* keyboard: one tab stop per radio question, arrows move and select, no auto-advance */
  await p.hover(5, 5);
  await q(`document.querySelector("${R} [data-slot=approval-card-step]:not([inert]) input:checked").focus()`);
  await p.key("ArrowDown"); await sleep(700);
  check("ArrowDown selects the next radio and does not auto-advance", [await checked(0), await index()], [[false, true, false], 0]);
  check("only the checked radio is in the tab order", await q(`[...document.querySelectorAll("${R} [data-slot=approval-card-step]:not([inert]) input[type=radio]")].map((i)=>i.checked)`), [false, true, false]);
  await p.key("Enter"); await sleep(400);
  check("Enter continues; focus follows into question 2", [await index(), (await focused())?.slice(0, 2)], [1, ["checkbox-input:checkbox", 1]]);
  check("pager shows 2 / 3 and reads Question 2 of 3 (spoken separator); digit reel at 2", await q(`[document.querySelector("${R} [data-slot=pager-position] .sr-only").textContent, String([...document.querySelector("${R} [data-slot=pager-reel]").children].findIndex((s)=>getComputedStyle(s).opacity==="1"))]`), ["Question 2 of 3", "2"]);
  check("keyboard move is instant (no transition on the track)", await q(`getComputedStyle(document.querySelector("${R} [data-slot=approval-card-track]")).transitionDuration.split(",").every((d)=>parseFloat(d)===0)`), true);
  await p.key(" "); await sleep(100);
  check("Space toggles a checkbox", await checked(1), [true, false, false]);
  await p.key(" "); await sleep(100);
  check("Space toggles it back", await checked(1), [false, false, false]);
  check("Continue is disabled without an answer", await q(`document.querySelector(${JSON.stringify(buttonByText("go"))}).disabled`), true);
  await q(`document.querySelector("${R} [data-slot=approval-card-step]:not([inert]) [data-slot=radio-group-custom-input]").focus()`);
  await p.type("Nuts"); await sleep(50);
  await p.key("Enter"); await sleep(400);
  check("Enter in the custom field continues", [await index(), (await focused())?.slice(0, 2)], [2, ["radio-group-input:radio", 2]]);
  check("last question offers Send; Next is disabled", await q(`[document.querySelector(${JSON.stringify(buttonByText("go"))}).textContent.trim(), document.querySelector("${R} [data-pager=next]").getAttribute("aria-disabled")]`), ["Send", "true"]);

  /* pointer: Previous / Next, then a rapid double Next must land exactly on question 3 */
  await clickText(`${R} [data-pager=prev]`); await sleep(60);
  await clickText(`${R} [data-pager=prev]`); await sleep(400);
  check("Previous twice goes back to question 1", [await index(), await fitted()], [0, [true, true]]);
  check("counter rolls back to 1", await q(`String([...document.querySelector("${R} [data-slot=pager-reel]").children].findIndex((s)=>getComputedStyle(s).opacity==="1"))`), "1");
  await clickText(`${R} [data-pager=next]`); await sleep(40);
  const mid = await q(`(()=>{const t=document.querySelector("${R} [data-slot=approval-card-track]");return new DOMMatrix(getComputedStyle(t).transform).m42})()`);
  await clickText(`${R} [data-pager=next]`); await sleep(450);
  /* at rest the track sits in layout (a negative margin), never on a transform; a move is a transform easing to none */
  check("rapid double Next: mid-slide, then lands on question 3 with the card fitted, the track at rest on no transform", [mid > 0, await index(), await fitted()], [true, 2, [true, true]]);
  await clickText(`${R} [data-pager=prev]`); await sleep(60);
  await clickText(`${R} [data-pager=prev]`); await sleep(400);

  /* pointer pick on a single choice auto-advances after ~480ms */
  await clickText(`${R} [data-slot=approval-card-step]:not([inert]) label:is([data-slot=checkbox], [data-slot=radio-group-item]):nth-of-type(3)`); await sleep(250);
  const early = await index();
  await sleep(500);
  check("pointer pick auto-advances after ~480ms", [early, await index()], [0, 1]);
  await clickText(buttonByText("skip")); await sleep(400);
  check("Skip moves on", await index(), 2);

  /* Send */
  await clickText(`${R} [data-slot=approval-card-step]:not([inert]) label:is([data-slot=checkbox], [data-slot=radio-group-item]):nth-of-type(2)`); await sleep(100);
  await clickText(buttonByText("go")); await sleep(400);
  check("Send: sent state, announced, focus on Start over", [await view(), await q(`document.querySelector("${R} [data-slot=approval-card-status]").textContent`), await q(`document.activeElement?.dataset.approvalCard`)], ["sent", "Answers sent", "reset"]);
  await p.key("Enter"); await sleep(400);
  check("Start over reopens at question 1, cleared", [await view(), await index(), await checked(0)], ["open", 0, [false, false, false]]);
  await clickText(`${R} [data-approval-card=dismiss]`);
  /* the fade is the running opacity transition; how far it has got when this reads depends on the machine */
  check("Dismiss with a pointer fades the card out first (opacity only, duration.fast), still shown", await q(`(()=>{const c=document.querySelector("${R} [data-slot=approval-card-card]");const o=+getComputedStyle(c).opacity;return [c.hidden,getComputedStyle(c).pointerEvents==="none",o>0,c.getAnimations().map((a)=>[a.transitionProperty,a.effect.getTiming().duration])]})()`), [false, true, true, [["opacity", 100]]]);
  await sleep(200);
  check("Dismiss closes; reopen button shown", [await view(), await q(`!document.querySelector("${R} [data-approval-card=reopen]").hidden`), await q(`getComputedStyle(document.querySelector("${R} [data-slot=approval-card-card]")).pointerEvents==="none"`)], ["closed", true, false]);
  check("after a pointer dismissal the reopen Button fades in where the card was", await q(`(()=>{const b=document.querySelector("${R} [data-approval-card=reopen]");const c=getComputedStyle(b);return [b.matches("[data-slot=button]"),c.transitionProperty.split(", ").includes("opacity")]})()`), [true, true]);
  await clickText(`${R} [data-approval-card=reopen]`);
  check("a reopen is an arrival: the card fades up", await q(`getComputedStyle(document.querySelector("${R} [data-slot=approval-card-card]")).animationName`), "fndn-fade-up");
  await sleep(400);
  check("Open approval brings the card back fitted", [await view(), await fitted()], ["open", [true, true]]);
  /* from the keyboard Dismiss is instant: no fade, closed on the next frame */
  await q(`document.querySelector("${R} [data-approval-card=dismiss]").focus()`);
  await p.key("Enter");
  check("Dismiss from the keyboard is instant (no fade): closed on the next frame", await q(`new Promise((r)=>requestAnimationFrame(()=>{const c=document.querySelector("${R} [data-slot=approval-card-card]");r([(()=>{const r=document.querySelector(${JSON.stringify(R)});return !r.querySelector("[data-slot=approval-card-card]").hidden?"open":!r.querySelector("[data-slot=approval-card-sent]").hidden?"sent":"closed"})(),c.hidden,getComputedStyle(c).pointerEvents==="none"])}))`), ["closed", true, false]);
  check("…and the reopen button is there at once (no fade from the keyboard)", await q(`new Promise((r)=>requestAnimationFrame(()=>r(getComputedStyle(document.querySelector("${R} [data-approval-card=reopen]")).opacity)))`), "1");
  await sleep(150);
  check("Dismiss from the keyboard: focus on the reopen button", await q(`document.activeElement?.dataset.approvalCard`), "reopen");
  await clickText(`${R} [data-approval-card=reopen]`); await sleep(400);
  /* composed parts: the dismiss button names itself with our tooltip; the pager pages with its arrows */
  const dm = await p.rect(`${R} [data-approval-card=dismiss]`);
  if (dm) await p.hover(dm.cx, dm.cy); await sleep(800);
  check("Dismiss is a ghost square Button with the tooltip \"Dismiss\"", await q(`[document.querySelector("${R} [data-approval-card=dismiss]").matches("[data-slot=button][aria-label=Dismiss]"), [...document.querySelectorAll("[data-slot=tooltip][data-state=open]")].map((t)=>t.textContent.trim())]`), [true, ["Dismiss"]]);
  await p.hover(5, 5); await sleep(300);
  await q(`document.querySelector("${R} [data-pager=next]").focus()`);
  await p.key("ArrowDown"); await sleep(400);
  const down = await index();
  await p.key("ArrowUp"); await sleep(400);
  check("ArrowDown / ArrowUp in the pager move between questions", [down, await index(), await fitted()], [1, 0, [true, true]]);
  /* approve mode: one action described, Always allow, Deny / Approve; settles into a pill */
  await p.goto(`${BASE}/harness.html?c=approval-card&fw=${fw}&ex=3`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=approval-card-action]")`).catch(() => false)) break; await sleep(100); }
  await sleep(400);
  check("approve: heading, description, command, details as a list; no pager, no question steps", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});return [r.querySelector("[data-slot=approval-card-question]").textContent, !!r.querySelector("[data-slot=approval-card-description]"), r.querySelector("[data-slot=approval-card-command]").tagName+":"+r.querySelector("[data-slot=approval-card-command]").textContent, [...r.querySelectorAll("[data-slot=approval-card-details] dt")].map((t)=>t.textContent), getComputedStyle(r.querySelectorAll("[data-slot=approval-card-detail-value]")[0]).fontFamily.includes("Mono")||/mono/i.test(getComputedStyle(r.querySelectorAll("[data-slot=approval-card-detail-value]")[0]).fontFamily), !!r.querySelector("[data-slot=pager]"), !!r.querySelector("[data-slot=approval-card-step]")]})()`), ["Run the database migration on Production?", true, "PRE:pnpm --filter billing-api db:migrate --env production", ["Branch", "Rows affected"], true, false, false]);
  check("approve: Always allow is the real Checkbox at the footer's start; Deny then Approve (accent) at its end", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const f=r.querySelector("[data-slot=approval-card-footer]");const a=[...f.querySelectorAll("[data-slot=approval-card-actions] [data-slot=button]")].map((b)=>b.textContent.trim());return [f.firstElementChild.matches("[data-slot=checkbox][data-approval-card=always]"), a, document.activeElement===document.body||!r.contains(document.activeElement)]})()`), [true, ["Deny", "Approve"], true]);
  await q(`window.__decisions=[]`);
  await clickText(`${R} [data-approval-card=always] [data-slot=checkbox-control]`); await sleep(150);
  await clickText(`${R} [data-slot=approval-card-actions] [data-slot=button]:nth-child(2)`); await sleep(400);
  check("approve with Always allow ticked: settles into 'Always allowed' (green, mark), announced; Change offered", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const s=r.querySelector("[data-slot=approval-card-sent]");return [s.hidden, s.querySelector("[data-slot=status-pill]").textContent.trim(), !!s.querySelector("[data-slot=status-pill-mark]"), r.querySelector("[data-slot=approval-card-status]").textContent, r.querySelector("[data-approval-card=reset]").textContent.trim(), document.activeElement?.dataset.approvalCard]})()`), [false, "Always allowed", true, "Always allowed", "Change", "reset"]);
  await clickText(`${R} [data-approval-card=reset]`); await sleep(300);
  check("Change reopens the card with Always allow cleared", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});return [r.querySelector("[data-slot=approval-card-card]").hidden, r.querySelector("[data-approval-card=always]").dataset.state]})()`), [false, "unchecked"]);
  await q(`document.querySelector("${R} [data-slot=approval-card-actions] [data-slot=button]:nth-child(1)").focus()`);
  await p.key("Enter"); await sleep(300);
  check("Deny from the keyboard: 'Denied' (neutral, no mark), focus on Change", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const pill=r.querySelector("[data-slot=approval-card-sent] [data-slot=status-pill]");return [pill.textContent.trim(), !!pill.querySelector("[data-slot=status-pill-mark]"), document.activeElement?.dataset.approvalCard]})()`), ["Denied", false, "reset"]);
  /* one question: no pager ("1/1"); the actions keep the footer's end */
  await p.goto(`${BASE}/harness.html?c=approval-card&fw=${fw}&ex=5`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=approval-card-footer]")`).catch(() => false)) break; await sleep(100); }
  await sleep(300);
  check("one question: no pager; Skip and Send at the footer's end", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const f=r.querySelector("[data-slot=approval-card-footer]").getBoundingClientRect(),a=r.querySelector("[data-slot=approval-card-actions]");return [!!r.querySelector("[data-slot=pager]"), Math.abs(f.right-a.getBoundingClientRect().right)<14, [...a.querySelectorAll("[data-slot=button]")].map((b)=>b.textContent.trim())[1]]})()`), [false, true, "Send"]);
  /* appear: the card the host's code adds live fades up on mount */
  await p.goto(`${BASE}/harness.html?c=approval-card&fw=${fw}&ex=6`, 300);
  for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=approval-card-card]")`).catch(() => false)) break; await sleep(100); }
  await sleep(300);
  check("appear: the card fades up on mount", await q(`getComputedStyle(document.querySelector("${R} [data-slot=approval-card-card]")).animationName`), "fndn-fade-up");
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
