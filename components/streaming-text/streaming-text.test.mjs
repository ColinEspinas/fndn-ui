// Streaming / done contract of Streaming Text, run against every target through the harness,
// then the Streaming scenario (spec examples[0].steps): the state after every step (&step=<n>) and
// one real-time play (&play=1).
//   node components/streaming-text/streaming-text.test.mjs            all four targets
//   node components/streaming-text/streaming-text.test.mjs react      one target
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SCENARIO = JSON.parse(fs.readFileSync(path.join(ROOT, "components/streaming-text/streaming-text.fixtures.json"), "utf8")).examples[0];
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=streaming-text]";
const p = await launch({ dpr: 2, hover: true });
const T = `${R} [data-slot=streaming-text-actions] > [data-slot=collapsible] > [data-slot=collapsible-trigger]`;
let failed = 0;
const open = async (fw, ex) => {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=streaming-text&fw=${fw}&ex=${ex}`, 100);
  for (let t = 0; t < 80; t++) { if (await p.eval(`!!document.querySelector("${R} [data-slot=streaming-text-followup]")`).catch(() => false)) break; await sleep(50); }
};
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const q = (js) => p.eval(js).catch((e) => `error: ${String(e.message).slice(0, 80)}`);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const focusName = () => q(`(()=>{const a=document.activeElement;return a?.getAttribute("aria-label")??a?.dataset.slot})()`);

  /* streaming */
  await open(fw, 0); await sleep(400);
  check("streaming: aria-busy, nothing announced, caret shown", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const c=r.querySelector("[data-slot=streaming-text-caret]");return [r.getAttribute("aria-busy"), r.querySelector("[data-slot=streaming-text-status]").textContent, getComputedStyle(c).visibility, c.offsetWidth]})()`), ["true", "", "visible", 2]);
  await sleep(500);
  check("streaming: with no new word for duration.enter × 2 the caret blinks (a stalled stream does not look frozen)", await q(`document.querySelector("${R} [data-slot=streaming-text-caret]").getAnimations().some((a)=>a.animationName==="fndn-caret-blink")`), true);
  check("streaming: actions and follow-ups hold their space but are hidden", await q(`["actions","followups"].map((p)=>{const e=document.querySelector("${R} [data-slot=streaming-text-"+p+"]");return [getComputedStyle(e).visibility, e.offsetHeight>0]})`), [["hidden", true], ["hidden", true]]);
  await q(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(50);
  check("streaming: hidden buttons are out of the tab order", await q(`!!document.activeElement?.closest("[data-slot=streaming-text-actions], [data-slot=streaming-text-followups]")`), false);
  check("block reserves its height while streaming", await q(`document.querySelector(${JSON.stringify(R)}).getBoundingClientRect().height >= 248`), true);


  /* done, mounted done (an answer from history): nothing enters */
  await open(fw, 1);
  check("mounted done (appear off by default): the cite, the follow-ups title and rows do not enter", await q(`[...document.querySelectorAll("${R} :is([data-slot=streaming-text-cite], [data-slot=streaming-text-followups-title], [data-slot=streaming-text-followup])")].map((e)=>getComputedStyle(e).animationName)`), ["none", "none", "none", "none"]);
  /* done with appear: the answer the host's code adds live */
  await open(fw, 2);
  const anim = await q(`(()=>{const ms=(v)=>Math.round(parseFloat(v)*(v.endsWith("ms")?1:1000));const a=(e)=>{const c=getComputedStyle(e);return [c.animationName, ms(c.animationDuration), ms(c.animationDelay)]};
    return {cite: a(document.querySelector("${R} [data-slot=streaming-text-cite]")), title: a(document.querySelector("${R} [data-slot=streaming-text-followups-title]")), rows: [...document.querySelectorAll("${R} [data-slot=streaming-text-followup]")].map(a), actions: getComputedStyle(document.querySelector("${R} [data-slot=streaming-text-actions]")).transitionProperty}})()`);
  check("appear, done: cite pops in, follow-ups rise in a 40ms stagger with the title, actions fade", anim, { cite: ["fndn-pop-in", 180, 0], title: ["fndn-fade-in", 300, 0], rows: [["fndn-fade-up", 300, 0], ["fndn-fade-up", 300, 40]], actions: "opacity, visibility" });
  await sleep(600);
  check("done: no aria-busy, status says so, caret hidden but keeps its box", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const c=r.querySelector("[data-slot=streaming-text-caret]");return [r.getAttribute("aria-busy"), r.querySelector("[data-slot=streaming-text-status]").textContent, getComputedStyle(c).visibility, c.offsetWidth]})()`), [null, "Answer complete", "hidden", 2]);
  check("words keep their spaces", await q(`document.querySelector("${R} [data-slot=streaming-text-text]").textContent.startsWith("Annual is your fastest-growing plan")`), true);
  check("actions are Buttons (xs square ghost rounded muted), labelled", await q(`[...document.querySelectorAll("${R} [data-streaming-text=action]")].map((b)=>[b.dataset.slot==="button", b.getBoundingClientRect().width, b.getAttribute("aria-label")].join(":"))`), ["true:24:Copy", "true:24:Retry", "true:24:Good answer", "true:24:Bad answer"]);
  const tip = async (i) => { const b = await q(`(()=>{const r=document.querySelectorAll("${R} [data-streaming-text=action]")[${i}].getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`); await p.hover(b.x, b.y); await sleep(900); return q(`[...document.querySelectorAll("[data-slot=tooltip]")].filter((t)=>t.getAttribute("data-state")==="open").map((t)=>t.textContent.trim())`); };
  check("hovering an action shows a tooltip with its label", [await tip(0), await tip(3)], [["Copy"], ["Bad answer"]]);
  await p.hover(2, 2); await sleep(400);
  /* measured with a real pointer: hover, then
   * press and hold; the pointer leaves before the button is released so nothing is activated */
  const tone = (name) => q(`(()=>{const s=document.createElement("i");s.style.background="var(${name})";document.body.append(s);const c=getComputedStyle(s).backgroundColor;s.remove();return c})()`);
  const fills = async (sel) => {
    const r = await p.rect(sel);
    const bg = () => q(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).backgroundColor`);
    await p.hover(r.cx, r.cy); await sleep(260);
    const hovered = await bg();
    await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", buttons: 1, clickCount: 1 }); await sleep(260);
    const pressed = await bg();
    await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2, buttons: 1 });
    await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 2, y: 2, button: "left", clickCount: 1 }); await sleep(120);
    return [hovered, pressed];
  };
  const [hoverTone, pressTone] = [await tone("--fndn-hover"), await tone("--fndn-hover-2")];
  check("follow-up rows hover --fndn-hover and press --fndn-hover-2; the cite presses --fndn-hover-2", [await fills(`${R} [data-slot=streaming-text-followup]`), await fills(`${R} [data-slot=streaming-text-cite]`)], [[hoverTone, pressTone], [hoverTone, pressTone]]);
  check("images are Avatars (cite 12 square, stack 14 round, sources 16 square), decorative", await q(`["cite-avatar","avatar","source-avatar"].map((c)=>{const a=document.querySelector("${R} [data-streaming-text="+c+"]");return [a.dataset.slot==="avatar", {"size-3":12,"size-3.5":14,"size-4":16,"size-5":20}[(a.className.match(/(?<![\\w-])size-[0-9.]+(?![\\w-])/g)||[]).pop()], getComputedStyle(a).borderRadius==="50%"?"round":"square", a.getAttribute("aria-hidden")].join(":")})`), ["true:12:square:true", "true:14:round:true", "true:16:square:true"]);

  /* layout at dpr 2: the cite chip's text sits on the line's baseline */
  const base = await q(`(()=>{const cite=document.querySelector("${R} [data-slot=streaming-text-cite]");const probe=()=>{const s=document.createElement("span");s.style.cssText="display:inline-block;width:0;height:0";return s};
    const a=probe();cite.after(a);const b=probe();cite.querySelector(":scope > span:last-child").append(b);const d=Math.abs(a.getBoundingClientRect().top-b.getBoundingClientRect().top);a.remove();b.remove();return d<=0.5})()`);
  check("cite chip text on the paragraph baseline", base, true);
  check("cite avatar and text centred in the chip", await q(`(()=>{const c=document.querySelector("${R} [data-slot=streaming-text-cite]").getBoundingClientRect();const m=c.top+c.height/2;return [...document.querySelectorAll("${R} [data-slot=streaming-text-cite] > *")].every((e)=>{const b=e.getBoundingClientRect();return Math.abs(b.top+b.height/2-m)<=0.5})})()`), true);
  check("action buttons and sources toggle centred in their row", await q(`(()=>{const row=document.querySelector("${R} [data-slot=streaming-text-actions]").getBoundingClientRect();const m=row.top+row.height/2;return [...document.querySelectorAll("${R} [data-streaming-text=action], ${T}")].every((e)=>{const b=e.getBoundingClientRect();return Math.abs(b.top+b.height/2-m)<=0.5})})()`), true);

  /* keyboard: the sources disclosure */
  check("the sources toggle and list are a collapsible (inline, no caret)", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});const s=document.getElementById(t.getAttribute("aria-controls"));return [t.parentElement.dataset.slot, !!t.querySelector("[data-slot=collapsible-caret]"), s?.dataset.slot, s.hidden]})()`), ["collapsible", false, "collapsible-content", true]);
  await q(`document.querySelector(${JSON.stringify(T)}).focus()`);
  const fy = await q(`document.querySelector("${R} [data-slot=streaming-text-followups]").getBoundingClientRect().y`);
  await p.key("Enter"); await sleep(40);
  const fy1 = await q(`document.querySelector("${R} [data-slot=streaming-text-followups]").getBoundingClientRect().y`);
  await sleep(300);
  check("Enter on the sources toggle reveals the list at once; focus stays", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});const s=document.getElementById(t.getAttribute("aria-controls"));return [t.getAttribute("aria-expanded"), s.hidden, document.activeElement===t, Math.round(s.getBoundingClientRect().height)>0, ${fy1} > ${fy} + 40]})()`), ["true", false, true, true, true]);
  await p.key("Tab"); await sleep(50);
  check("Tab moves into the revealed sources", await focusName(), "streaming-text-source");
  await q(`document.querySelector(${JSON.stringify(T)}).focus()`);
  await p.key(" "); await sleep(350);
  check("Space closes it; the list is hidden again; the follow-ups are back where they were", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});const s=document.getElementById(t.getAttribute("aria-controls"));return [t.getAttribute("aria-expanded"), s.hidden, Math.abs(document.querySelector("${R} [data-slot=streaming-text-followups]").getBoundingClientRect().y - ${fy}) < 0.5]})()`), ["false", true, true]);
  await p.key("Tab"); await sleep(50);
  check("Tab skips the closed list to the first follow-up", await focusName(), "streaming-text-followup");
  check("no console errors", p.errors.slice(0, 2), []);
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
/* ── the Streaming scenario ── */
const STEPS = SCENARIO.steps;
let content = SCENARIO.props.content;
const expected = [{ words: 0, cites: 0, done: false }];
for (const s of STEPS) { if (s.props.content) content = s.props.content; expected.push({ words: content.filter((t) => t.cite === undefined).length, cites: content.filter((t) => t.cite !== undefined).length, done: !!(s.props.done ?? expected[expected.length - 1].done) }); }
const FRAME = `(()=>{const r=document.querySelector(${JSON.stringify(R)});const t=r.querySelector("[data-slot=streaming-text-text]");const c=r.querySelector("[data-slot=streaming-text-caret]");
  const items=[...t.children].filter((e)=>e!==c);const last=items[items.length-1];const lb=last?.getBoundingClientRect();const cb=c.getBoundingClientRect();const tb=t.getBoundingClientRect();const rb=r.getBoundingClientRect();
  const line=(b)=>Math.round((b.top-tb.top)/(parseFloat(getComputedStyle(t).lineHeight)));
  return {words:items.filter((e)=>e.dataset.slot!=="streaming-text-cite").length, cites:t.querySelectorAll("[data-slot=streaming-text-cite]").length, done:r.getAttribute("aria-busy")!=="true",
    caretLast:t.lastElementChild===c, caretGap: last ? Math.round(cb.left-lb.right) : 0, caretSameLine: last ? line(cb)===line(lb) : true,
    top:Math.round(rb.top*2)/2, textTop:Math.round(tb.top*2)/2, height:Math.round(rb.height), lineTops:[...t.querySelectorAll(":scope > span:not([data-slot=streaming-text-caret])")].map((e)=>Math.round(e.getBoundingClientRect().top-tb.top)).filter((v,i,a)=>a.indexOf(v)===i),
    actions:getComputedStyle(r.querySelector("[data-slot=streaming-text-actions]")).visibility}})()`;
for (const fw of targets) {
  const checks = [];
  let bad = 0;
  const check = (name, ok, detail = "") => { if (!ok) bad++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — ${detail}`}`); };
  let first = null;
  const lines = new Map();
  for (let n = 0; n <= STEPS.length; n++) {
    let f = null;
    for (let attempt = 0; attempt < 3 && !f; attempt++) {
      p.errors.length = 0;
      await p.goto(`${BASE}/harness.html?c=streaming-text&fw=${fw}&ex=0&step=${n}`, 100);
      for (let t = 0; t < 80; t++) { if (await p.eval(`document.documentElement.dataset.harnessStep === "${n}"`).catch(() => false)) break; await sleep(50); }
      await sleep(80);
      f = await p.eval(FRAME).catch(() => null);
    }
    if (!f) { check(`step ${n}: renders`, false, "nothing on the stage"); continue; }
    first ??= f;
    const e = expected[n];
    const ok = f.words === e.words && f.cites === e.cites && f.done === e.done && f.caretLast && f.caretSameLine && f.caretGap >= 0 && f.caretGap <= 10
      && f.top === first.top && f.textTop === first.textTop && f.height === first.height && f.actions === (e.done ? "visible" : "hidden") && !p.errors.length;
    for (const v of f.lineTops) lines.set(v, true);
    check(`step ${n}: ${e.words} words, ${e.cites} cite${e.done ? ", done" : ""}; caret after the last word; nothing above moves`, ok, JSON.stringify({ ...f, lineTops: undefined }) + (p.errors[0] ?? ""));
  }
  /* line boxes keep a 21px rhythm: the cite chip never makes its line taller */
  const tops = [...lines.keys()].sort((a, b) => a - b);
  check("lines keep their rhythm (the cite chip does not jump a line)", tops.every((v, i) => i === 0 || v - tops[i - 1] === tops[1] - tops[0]), JSON.stringify(tops));

  /* real time: the follow-ups and actions enter once, at done; the block never moves */
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=streaming-text&fw=${fw}&ex=0&play=1`, 100);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(50); }
  await p.eval(`window.__enter=[];document.addEventListener("animationstart",(e)=>{const c=e.target.dataset?.slot??"";if(/followup|actions/.test(c))window.__enter.push(e.animationName+":"+c.replace("streaming-text-",""))},true);window.__tops=new Set();(function tick(){const r=document.querySelector(${JSON.stringify(R)});if(r)window.__tops.add(Math.round(r.getBoundingClientRect().top)+"/"+Math.round(r.getBoundingClientRect().left)+"/"+Math.round(r.getBoundingClientRect().height));requestAnimationFrame(tick)})()`);
  const total = STEPS.reduce((a, s) => a + s.after, 0);
  for (let t = 0; t < (total + 3000) / 100; t++) { if (await p.eval(`"harnessPlayed" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(700);
  const played = await p.eval(`({played:"harnessPlayed" in document.documentElement.dataset, enter:window.__enter.sort(), tops:[...window.__tops]})`);
  check("play: reaches done by itself", played.played);
  check("play: the follow-ups enter once (title + 2 rows), nothing re-enters", JSON.stringify(played.enter) === JSON.stringify(["fndn-fade-in:followups-title", "fndn-fade-up:followup", "fndn-fade-up:followup"]), JSON.stringify(played.enter));
  check("play: the block never moves or resizes", played.tops.length === 1, JSON.stringify(played.tops));
  check("play: no console errors", !p.errors.length, p.errors[0]);
  failed += bad;
  console.log(`${fw} · scenario\n  ${checks.join("\n  ")}`);
}

console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
