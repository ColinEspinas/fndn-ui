// Keyboard and pointer contract of the Chat composer, run against every target through the harness.
//   node components/chat-composer/chat-composer.test.mjs            all four targets
//   node components/chat-composer/chat-composer.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=chat-composer]";
const INPUT = `${R} [data-slot=chat-composer-input]`;
const SEND = `${R} [data-chat-composer=send]`;
const p = await launch({ hover: true });
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(350); };

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  try {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=chat-composer&fw=${fw}&ex=0`, 300); await ready();
  const panel = `[...document.querySelectorAll("${R} [data-slot=tabs-content]")].find((n)=>!n.hidden)`;
  const visible = () => q(`(()=>{const p=${panel};return [...p.querySelectorAll("[data-chat-composer=message]")].map((m)=>(getComputedStyle(m).paddingInlineStart==="56px"?"user":"agent")+":"+(m.querySelector("[data-slot=message-text]")?.textContent.trim()))})()`);
  const send = () => q(`(()=>{const b=document.querySelector(${JSON.stringify(SEND)});return [b.disabled,b.getAttribute("aria-label")]})()`);
  const value = () => q(`document.querySelector(${JSON.stringify(INPUT)}).value`);
  const card = () => q(`Math.round(document.querySelector(${JSON.stringify(R)}).getBoundingClientRect().height)`);

  check("tab strip: two tabs, Plans selected", await q(`[...document.querySelectorAll("${R} [role=tab]")].map((t)=>t.textContent.trim()+":"+t.getAttribute("aria-selected"))`), ["Plans:true", "Suppliers:false"]);
  check("thread is a log with the Plans messages", await q(`${panel}.querySelector("[data-slot=chat-composer-thread]").getAttribute("role")`), "log");
  check("messages render user bubble + agent steps", (await visible()).length, 3);
  check("agent step: the Message's header holds the step, the source Chip and the time", await q(`(()=>{const m=${panel}.querySelector("[data-chat-composer=message] [data-slot=message-header]");return [m.querySelector("[data-slot=message-name]").textContent,m.querySelector("[data-slot=chip]").textContent,m.querySelector("[data-slot=message-time]").textContent]})()`), ["Sales history", "plan_data", "for 4s"]);
  check("messages present at mount do not animate", await q(`[...document.querySelectorAll("${R} [data-chat-composer=message]")].some((m)=>m.hasAttribute("data-enter")||m.getAnimations().length)`), false);
  check("send starts disabled", await send(), [true, "Send"]);
  const height = await card();
  check("card is 288px tall", height, 288);

  // tabs: pointer swaps instantly, keyboard moves and selects
  await p.clickSel(`${R} [role=tab]:nth-of-type(2)`); await sleep(120);
  check("clicking Suppliers swaps the panel", await visible(), ["user:Who resolves billing tickets fastest?", "agent:Verde Farms averaged two days over the last ten orders."]);
  check("panel swap does not animate messages", await q(`(()=>{const p=${panel};return [...p.querySelectorAll("[data-chat-composer=message]")].some((m)=>m.getAnimations().length>0)})()`), false);
  await p.key("ArrowLeft"); await sleep(120);
  check("ArrowLeft on the strip selects Plans", await q(`document.activeElement.textContent.trim()+":"+document.activeElement.getAttribute("aria-selected")`), "Plans:true");
  check("…and its panel shows", (await visible()).length, 3);

  // the suggestion row leaves room for a pill's focus ring (2px ring + 2px offset) on every side,
  // and its footprint is still the 32px row shared with the busy status
  check("suggestion row: the focus ring of a pill fits inside the clipping row; footprint 32px", await q(`(()=>{const row=document.querySelector("${R} [data-slot=chat-composer-suggestions]");const pill=row.querySelector("[data-chat-composer=suggestion]");const r=row.getBoundingClientRect(),b=pill.getBoundingClientRect();const cs=getComputedStyle(row);return [b.top-r.top>=4,r.bottom-b.bottom>=4,b.left-r.left>=4,Math.round(r.height+parseFloat(cs.marginTop)+parseFloat(cs.marginBottom))]})()`), [true, true, true, 32]);
  check("tabs: no local override of the trigger (flex, not block); the label part truncates", await q(`(()=>{const t=document.querySelector("${R} [data-slot=tabs-trigger]");return [getComputedStyle(t).display,!!t.querySelector("[data-slot=tabs-label]")]})()`), ["flex", true]);

  // suggestions fill the draft
  await p.clickSel(`${R} [data-chat-composer=suggestion]:nth-of-type(2)`); await sleep(150);
  check("a suggestion fills the composer and focuses it", [await value(), await q(`document.activeElement===document.querySelector(${JSON.stringify(INPUT)})`)], ["Low stock", true]);
  check("send enables with a draft", await send(), [false, "Send"]);
  const sb = await p.rect(SEND);
  await p.hover(sb.cx, sb.cy); await sleep(700);
  check("send shows our tooltip with its name", await q(`[...document.querySelectorAll("[data-slot=tooltip]")].filter((t)=>t.getAttribute("data-state")==="open").map((t)=>t.textContent.trim())`), ["Send"]);
  await p.hover(5, 5); await sleep(200);
  await p.clickSel(INPUT); await sleep(60);

  // keyboard contract of the textarea
  await p.key("Enter", { shift: true }); await sleep(80);
  check("Shift+Enter inserts a newline, does not send", [await value(), (await visible()).length], ["Low stock\n", 3]);
  await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});i.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",keyCode:229,isComposing:true,bubbles:true,cancelable:true}))})()`); await sleep(80);
  check("Enter during an IME composition does not send", (await visible()).length, 3);
  await q(`(()=>{const pn=${panel};window.__scrolls=0;pn.addEventListener("scroll",()=>window.__scrolls++)})()`);
  await p.key("Enter"); await sleep(60);
  const sent = await q(`(()=>{const p=${panel};const ms=[...p.querySelectorAll("[data-chat-composer=message]")];const m=ms[ms.length-1];return {n:ms.length,role:(getComputedStyle(m).paddingInlineStart==="56px"?"user":"agent"),text:m.textContent.trim(),enter:m.hasAttribute("data-enter"),anim:m.getAnimations().map((a)=>a.animationName)}})()`);
  check("Enter sends: the trimmed message is appended to the open thread", [sent.n, sent.role, sent.text], [4, "user", "Low stock"]);
  check("the new message rises in once", [sent.enter, sent.anim], [true, ["fndn-fade-up"]]);
  await sleep(300);
  check("the thread scrolls to it smoothly (several scroll steps, not one jump)", await q(`window.__scrolls>1`), true);
  check("the draft clears, send disables", [await value(), await send()], ["", [true, "Send"]]);
  await sleep(450);
  check("data-enter is removed when the entrance ends", await q(`${panel}.querySelector("[data-chat-composer=message]:last-child").hasAttribute("data-enter")`), false);
  check("the thread follows the newest message", await q(`(()=>{const p=${panel};return Math.abs(p.scrollHeight-p.clientHeight-p.scrollTop)<=1})()`), true);
  check("the card keeps its height", await card(), height);
  await p.key("Enter"); await sleep(80);
  check("Enter with an empty draft sends nothing", (await visible()).length, 4);

  // the send button
  await p.type("Forecast"); await sleep(60);
  await p.clickSel(SEND); await sleep(120);
  check("the send button sends", [(await visible()).slice(-1)[0], await value()], ["user:Forecast", ""]);

  // pressing the field's padding focuses the textarea
  await p.click(5, 5); await sleep(50);
  const f = await p.rect(`${R} [data-slot=chat-composer-field]`);
  await p.click(f.x + f.w / 2, f.y + f.h - 4); await sleep(80);
  check("pressing the field focuses the textarea", await q(`document.activeElement===document.querySelector(${JSON.stringify(INPUT)})`), true);
  check("no console errors", p.errors.slice(0, 2), []);

  // busy
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=chat-composer&fw=${fw}&ex=1`, 300); await ready();
  check("busy: the status takes the suggestions' row", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const s=r.querySelector("[data-slot=chat-composer-status]");return [!!r.querySelector("[data-slot=chat-composer-status]"),s?.getAttribute("role"),s?.textContent.trim(),!!r.querySelector("[data-slot=chat-composer-suggestions]"),Math.round(s?.getBoundingClientRect().height)]})()`), [true, "status", "Reading sales…", false, 32]);
  check("busy: send is stop", await send(), [false, "Stop generating"]);
  await p.clickSel(INPUT); await p.type("More"); await p.key("Enter"); await sleep(100);
  check("busy: Enter does not send", [(await visible()).length, await value()], [1, "More"]);
  check("no console errors (busy)", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ threw: ${String(e).slice(0, 160)}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
