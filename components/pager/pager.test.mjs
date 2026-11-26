// Keyboard and pointer contract of the Pager, run against every target through the harness.
//   node components/pager/pager.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=pager]";
const PREV = `${R} > [data-pager=prev]`;
const NEXT = `${R} > [data-pager=next]`;
const POS = `${R} > [data-slot=pager-position]`;
/* the figure a reel shows (at rest: the one at full opacity); the digit is a recipe variant, not an attribute */
const SHOWN = `((reel)=>String([...reel.children].findIndex((s)=>getComputedStyle(s).opacity==="1")))`;
const p = await launch({ hover: true });
let failed = 0;
const ready = async () => { await sleep(300); for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  const pos = () => q(`document.querySelector(${JSON.stringify(POS)}).textContent.replace(/\\s+/g," ").trim()`);
  const sr = () => q(`document.querySelector("${POS} .sr-only")?.textContent ?? null`);
  const ends = () => q(`[${JSON.stringify(PREV)},${JSON.stringify(NEXT)}].map((s)=>document.querySelector(s).getAttribute("aria-disabled"))`);
  const focused = () => q(`(()=>{const a=document.activeElement;return a?.dataset.pager??a?.tagName})()`);
  const open = async (ex, extra = "") => { p.errors.length = 0; await p.goto(`${BASE}/harness.html?c=pager&fw=${fw}&ex=${ex}${extra}`, 300); await ready(); };
  try {
    // plain, looping, position first
    await open(0);
    check("a labelled group of two labelled buttons and a status", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const b=[...r.querySelectorAll("button")];return [r.getAttribute("role"),r.getAttribute("aria-label"),b.map((x)=>x.getAttribute("aria-label")),document.querySelector(${JSON.stringify(POS)}).getAttribute("role")]})()`), ["group", "Choose insight", ["Previous insight", "Next insight"], "status"]);
    check("layout start: the position sits before the buttons", await q(`(()=>{const x=(s)=>document.querySelector(s).getBoundingClientRect().left;return x(${JSON.stringify(POS)})<x(${JSON.stringify(PREV)})&&x(${JSON.stringify(PREV)})<x(${JSON.stringify(NEXT)})})()`), true);
    check("buttons are 28px ghost (transparent) square Buttons", await q(`(()=>{const b=document.querySelector(${JSON.stringify(NEXT)});const r=b.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),b.dataset.slot,getComputedStyle(b).backgroundColor]})()`), [28, 28, "button", "rgba(0, 0, 0, 0)"]);
    check("starts at 1 of 3, nothing disabled (loops)", [await pos(), await ends()], ["1 of 3", [null, null]]);
    await p.clickSel(NEXT); await sleep(120);
    check("pointer: next → 2 of 3", await pos(), "2 of 3");
    await p.clickSel(PREV); await sleep(120); await p.clickSel(PREV); await sleep(120);
    check("pointer: prev past the first page wraps to 3 of 3", await pos(), "3 of 3");
    await q(`document.querySelector(${JSON.stringify(NEXT)}).focus()`);
    await p.key("ArrowRight"); await sleep(80);
    check("ArrowRight pages forward (wraps to 1 of 3)", await pos(), "1 of 3");
    await p.key("ArrowLeft"); await sleep(80);
    check("ArrowLeft pages back", await pos(), "3 of 3");
    await p.key("Home"); await sleep(80);
    check("Home → first page", await pos(), "1 of 3");
    await p.key("End"); await sleep(80);
    check("End → last page", await pos(), "3 of 3");
    await p.key("Enter"); await sleep(80);
    check("Enter on next pages once and keeps focus", [await pos(), await focused()], ["1 of 3", "next"]);

    // rolling, vertical, stops at the ends
    await open(1);
    check("rolling: status reads the unit, digits are hidden from it", [await sr(), await q(`document.querySelector("${POS} [data-slot=pager-digits]").getAttribute("aria-hidden")`), await q(`${SHOWN}(document.querySelector("${POS} [data-slot=pager-reel]"))`)], ["Question 2 of 3", "true", "2"]);
    check("vertical: up and down carets, between layout", await q(`(()=>{const x=(s)=>document.querySelector(s).getBoundingClientRect().left;return x(${JSON.stringify(PREV)})<x(${JSON.stringify(POS)})&&x(${JSON.stringify(POS)})<x(${JSON.stringify(NEXT)})})()`), true);
    await p.clickSel(PREV); await sleep(40);
    check("pointer: the digit rolls (the outgoing and the incoming figure move by transform and opacity at duration.move)", await q(`(()=>{const reel=document.querySelector("${POS} [data-slot=pager-reel]");const move=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fndn-duration-move"));const of=(i)=>reel.children[i].getAnimations().map((a)=>a.transitionProperty+":"+a.effect.getTiming().duration).sort().join(",");const want="opacity:"+move+",transform:"+move;return [of(1)===want,of(2)===want,reel.getAnimations().length]})()`), [true, true, 0]);
    await sleep(350);
    /* at rest the current figure is in normal layout: no transform on it or on the reel, so it shares
     * the pixel rows of the text beside it at any display scale (a parked translate did not at 125%) */
    check("at rest the current figure is untransformed and fills its cell; the others are unseen", await q(`(()=>{const reel=document.querySelector("${POS} [data-slot=pager-reel]");const d=Number(${SHOWN}(reel));const cell=reel.parentElement.getBoundingClientRect();const cur=reel.children[d];const b=cur.getBoundingClientRect();return [getComputedStyle(reel).transform,getComputedStyle(cur).transform,Math.abs(b.top-cell.top)<0.01&&Math.abs(b.height-cell.height)<0.01,[...reel.children].filter((s,i)=>i!==d&&getComputedStyle(s).opacity!=="0").length]})()`), ["none", "none", true, 0]);
    await sleep(300);
    check("first page: prev disabled, next enabled", [await sr(), await ends()], ["Question 1 of 3", ["true", null]]);
    await q(`document.querySelector(${JSON.stringify(NEXT)}).focus()`);
    await p.key("ArrowDown"); await sleep(30);
    check("ArrowDown pages forward; from the keyboard the reel is instant", [await sr(), await q(`[...document.querySelector("${POS} [data-slot=pager-reel]").children].flatMap((s)=>s.getAnimations()).filter((a)=>a.playState==="running").length`)], ["Question 2 of 3", 0]);
    await p.key("ArrowRight"); await sleep(60);
    check("ArrowRight reaches the last page: next disabled, focus stays on it", [await sr(), await ends(), await focused()], ["Question 3 of 3", [null, "true"], "next"]);
    await p.key("Enter"); await sleep(60); await p.key("ArrowRight"); await sleep(60);
    check("Enter and ArrowRight at the end do nothing", await sr(), "Question 3 of 3");
    await p.key("ArrowUp"); await sleep(60);
    check("ArrowUp pages back", await sr(), "Question 2 of 3");

    // many pages: 9 → 10 adds a reel
    await open(2);
    await p.clickSel(NEXT); await sleep(300);
    check("9 of 12 → 10 of 12: two reels", [await sr(), await q(`[...document.querySelectorAll("${POS} [data-slot=pager-reel]")].map(${SHOWN}).join("")`), await pos().then((t) => t.endsWith("of 12"))], ["10 of 12", "10", true]);

    // last page: the disabled next ignores the pointer
    await open(3);
    check("last page: next disabled", await ends(), [null, "true"]);
    await p.clickSel(NEXT); await sleep(120);
    check("pointer on the disabled next does nothing", await pos(), "3 of 3");

    // a visible "/" is spoken "of": the visible text is aria-hidden beside a visually hidden spoken one
    await open(4);
    check("slash: shows 1 / 3, reads 1 of 3", await q(`(()=>{const p=document.querySelector(${JSON.stringify(POS)});const t=p.querySelector("[data-slot=pager-text]");return [t?.textContent, t?.getAttribute("aria-hidden"), p.querySelector(".sr-only")?.textContent]})()`), ["1 / 3", "true", "1 of 3"]);
    check("prevProps / nextProps reach the two buttons; the pager's own aria-label wins", await q(`[...document.querySelectorAll(${JSON.stringify(`${PREV}, ${NEXT}`)})].map((b)=>[b.tagName,b.getAttribute("aria-controls"),b.dataset.test??null,b.getAttribute("aria-label")])`), [["BUTTON", "pager-slides", null, "Previous"], ["BUTTON", "pager-slides", "next", "Next"]]);
    await p.clickSel(NEXT); await sleep(120);
    check("slash: next updates both", await q(`(()=>{const p=document.querySelector(${JSON.stringify(POS)});return [p.querySelector("[data-slot=pager-text]").textContent, p.querySelector(".sr-only").textContent]})()`), ["2 / 3", "2 of 3"]);
    // our tooltip on the two buttons: the same text as their aria-label
    await open(0);
    const nb = await p.rect(NEXT);
    await p.hover(nb.cx, nb.cy); await sleep(700);
    check("next shows our tooltip with its aria-label", await q(`[...document.querySelectorAll("[data-slot=tooltip]")].filter((t)=>getComputedStyle(t).display!=="none"&&t.getBoundingClientRect().width>0).map((t)=>t.textContent.trim())`), ["Next insight"]);
    await p.hover(1, 1); await sleep(300);

    // right-to-left: arrows follow the reading direction, horizontal carets mirror, vertical do not
    await open(0, "&dir=rtl");
    await q(`document.querySelector(${JSON.stringify(PREV)}).focus()`);
    await p.key("ArrowLeft"); await sleep(80);
    check("right-to-left: ArrowLeft pages forward", await pos(), "2 of 3");
    check("right-to-left: horizontal carets mirror, the position still reads 2 of 3", [await q(`getComputedStyle(document.querySelector("${PREV} [data-slot=icon]")).transform`), await q(`getComputedStyle(document.querySelector(${JSON.stringify(POS)})).direction`)], ["matrix(-1, 0, 0, 1, 0, 0)", "ltr"]);
    await open(1, "&dir=rtl");
    check("right-to-left: vertical carets do not mirror", await q(`getComputedStyle(document.querySelector("${PREV} [data-slot=icon]")).transform`), "none");

    check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ threw: ${e.message.split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { console.log(`  (retrying ${fw}: ${checks.filter((c) => c.startsWith("✗")).join("; ").slice(0, 200)})`); failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
