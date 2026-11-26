// Keyboard and pointer contract of the PromptBar, run against every target through the harness.
//   node components/prompt-bar/prompt-bar.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const IN = "#stage [data-slot=prompt-bar-input]";
const SEND = "#stage [data-prompt-bar=send]";
const p = await launch();
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  /* a page reload mid-run turns into a failed check (and a retry), not a crash */
  const q = (js) => p.eval(js).catch((e) => `error: ${String(e.message).split("\n")[0]}`);
  const value = () => q(`document.querySelector(${JSON.stringify(IN)}).value`);
  const focusIn = () => q(`document.activeElement === document.querySelector(${JSON.stringify(IN)})`);
  /* the open list as the textarea announces it */
  const combo = () => q(`(()=>{const t=document.querySelector(${JSON.stringify(IN)});const lb=t.getAttribute("aria-controls")?document.getElementById(t.getAttribute("aria-controls")):null;const ad=t.getAttribute("aria-activedescendant");const opt=ad?document.getElementById(ad):null;
    return {expanded:t.getAttribute("aria-expanded"), kind:lb?.closest("[data-slot=prompt-bar-list]")?.dataset.kind ?? null, open:!!lb && !lb.closest("[data-slot=prompt-bar-list]").hidden, active:opt?.querySelector("[data-slot=prompt-bar-option-label]")?.textContent.trim() ?? null, activeMarked:!!opt && opt.hasAttribute("data-highlighted") && opt.getAttribute("aria-selected")==="true", shown:lb?[...lb.querySelectorAll("[data-slot=prompt-bar-option]")].filter((o)=>!o.hidden).length:0}})()`);
  const sendState = () => q(`(()=>{const b=document.querySelector(${JSON.stringify(SEND)});return [b.getAttribute("aria-label"), b.disabled]})()`);

  try {
  p.errors.length = 0;
  await p.media([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.goto(`${BASE}/harness.html?c=prompt-bar&fw=${fw}&ex=0`, 300); await ready();
  check("textarea is a combobox, collapsed; send disabled while empty", [await q(`(()=>{const t=document.querySelector(${JSON.stringify(IN)});return [t.getAttribute("role"),t.getAttribute("aria-autocomplete"),t.getAttribute("aria-expanded")]})()`), await sendState()], [["combobox", "list", "false"], ["Send", true]]);
  check("suggestion lists are portaled out of the component", await q(`!document.querySelector("#stage [data-slot=prompt-bar-positioner]") && document.querySelectorAll("body [data-slot=prompt-bar-positioner]").length === 2`), true);
  /* a field inside a composite surface shows the caret and nothing else */
  const look = () => q(`(()=>{const c=getComputedStyle(document.querySelector("#stage [data-slot=prompt-bar-composer]"));return [c.borderTopColor,c.borderBottomColor,c.boxShadow,c.outlineStyle+" "+c.outlineColor]})()`);
  const rest = await look();
  await p.clickSel(IN); await sleep(300);
  check("focus changes no border, shadow or outline colour of the composer (pointer)", await look(), rest);
  await q(`document.activeElement.blur()`);
  for (let i = 0; i < 8 && !(await focusIn()); i++) { await p.key("Tab"); await sleep(60); }
  await sleep(300);
  check("…nor from the keyboard", [await focusIn(), await look()], [true, rest]);
  await p.clickSel(IN); await sleep(100);
  await p.type("Hello"); await sleep(100);
  check("typing updates the value and enables send", [await value(), await sendState()], ["Hello", ["Send", false]]);
  const h1 = (await p.rect(IN)).h;
  await p.key("Enter", { shift: true }); await p.type("there"); await sleep(150);
  check("Shift+Enter inserts a newline", await value(), "Hello\nthere");
  check("a second line grows the textarea and drops the controls to their own row", [(await p.rect(IN)).h > h1, await q(`document.querySelector(${JSON.stringify(SEND)}).getBoundingClientRect().top >= document.querySelector(${JSON.stringify(IN)}).getBoundingClientRect().bottom - 1`)], [true, true]);
  await q(`document.querySelector(${JSON.stringify(IN)}).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }))`); await sleep(100);
  check("Enter during an IME composition does not send", await value(), "Hello\nthere");
  await p.key("Enter"); await sleep(60);
  const sweepSeen = await q(`document.querySelector("#stage [data-slot=prompt-bar-sweep]").hasAttribute("data-sweeping")`);
  await sleep(150);
  check("Enter sends: text clears, focus stays, send disabled again", [await value(), await focusIn(), await sendState()], ["", true, ["Send", true]]);
  const webgl = await q(`(()=>{try{const c=document.createElement("canvas");return !!(c.getContext("webgl2")||c.getContext("webgl"))}catch{return false}})()`);
  checks.push(`· send sweep: ${sweepSeen ? "played" : "not seen"} (WebGL ${webgl ? "available" : "missing → skipped by design"})`);
  if (webgl) check("the send sweep plays once per send", sweepSeen, true);

  // grows to a maximum, then scrolls
  await p.type("x".repeat(10)); for (let i = 0; i < 9; i++) { await p.key("Enter", { shift: true }); await p.type("line"); } await sleep(200);
  check("the textarea stops at its max height and scrolls", await q(`(()=>{const t=document.querySelector(${JSON.stringify(IN)});const max=parseFloat(getComputedStyle(t).maxHeight);return [Math.round(t.getBoundingClientRect().height)<=max, t.scrollHeight>t.clientHeight]})()`), [true, true]);
  await q(`(()=>{const t=document.querySelector(${JSON.stringify(IN)});t.select()})()`); await p.key("Backspace"); await sleep(150);
  check("clearing the text shrinks it back to one line", [await value(), Math.round((await p.rect(IN)).h) === Math.round(h1)], ["", true]);

  // the / list
  await p.type("/"); await sleep(120);
  check("/ opens the command list with the first option active", await combo(), { expanded: "true", kind: "command", open: true, active: "/compare", activeMarked: true, shown: 5 });
  check("the list opens without animation and focus stays in the textarea", [await q(`(()=>{const l=document.querySelector('[data-slot=prompt-bar-list][data-kind="command"]');const s=getComputedStyle(l);return s.animationName==="none" && s.transitionDuration.split(",").every((d)=>parseFloat(d)===0)})()`), await focusIn()], [true, true]);
  check("the list sits above the composer, same width, 8px gap", await q(`(()=>{const c=document.querySelector("#stage [data-slot=prompt-bar-composer]").getBoundingClientRect();const l=document.querySelector('[data-slot=prompt-bar-list][data-kind="command"]').getBoundingClientRect();return [Math.round(c.top-l.bottom), Math.abs(c.width-l.width)<1]})()`), [8, true]);
  /* the shared popup surface and option row; the positioner stacks like every popup */
  check("the list is the shared popup surface, its rows the shared option row (lg: 36px, 12.5px, gap 8), stacked at --fndn-z-popup", await q(`(()=>{const l=document.querySelector('[data-slot=prompt-bar-list][data-kind="command"]');const o=l.querySelector("[data-slot=prompt-bar-option]:not([hidden])");const os=getComputedStyle(o);return [l.classList.contains("origin-(--transform-origin)"), o.classList.contains("min-h-[var(--option-height,30px)]"), Math.round(o.getBoundingClientRect().height), os.fontSize, os.columnGap, getComputedStyle(l.parentElement).zIndex]})()`), [true, true, 36, "12.5px", "8px", "50"]);
  await p.key("ArrowDown"); await sleep(60);
  check("ArrowDown moves the active option", (await combo()).active, "/billing-plan");
  await p.key("ArrowUp"); await p.key("ArrowUp"); await sleep(60);
  check("ArrowUp wraps to the last option", (await combo()).active, "/summarize");
  await sleep(250);
  check("keyboard moves glide too (transform at duration.move) and land on the row", await q(`(()=>{const g=document.querySelector('[data-slot=prompt-bar-list][data-kind="command"] [data-slot=prompt-bar-highlight]');const row=document.querySelector('[data-slot=prompt-bar-list][data-kind="command"] [data-highlighted]');const cs=getComputedStyle(g);const props=cs.transitionProperty.split(",").map((s)=>s.trim());const durs=cs.transitionDuration.split(",").map((s)=>parseFloat(s)*(s.trim().endsWith("ms")?1:1000));const move=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fndn-duration-move"));return [document.documentElement.dataset.fndnInput, durs[props.indexOf("transform")]===move, !!row && Math.abs(g.getBoundingClientRect().top-row.getBoundingClientRect().top)<1]})()`), ["keyboard", true, true]);
  await p.type("re"); await sleep(100);
  check("typing filters from the start of the command", [(await combo()).shown, (await combo()).active], [1, "/restock"]);
  await p.key("Enter"); await sleep(120);
  check("Enter accepts: inserts the command, closes, does not send", [await value(), (await combo()).expanded], ["/restock ", "false"]);

  // the @ list, Tab accepts
  await p.type("@we"); await sleep(120);
  check("@ opens the source list, matched anywhere in the label", await combo(), { expanded: "true", kind: "source", open: true, active: "Web search", activeMarked: true, shown: 1 });
  await p.key("Tab"); await sleep(120);
  check("Tab accepts and keeps focus", [await value(), (await combo()).expanded, await focusIn()], ["/restock @Web search ", "false", true]);

  // Escape closes until the text changes
  await p.type("/"); await sleep(100);
  await p.key("Escape"); await sleep(100);
  check("Escape closes the list and leaves the text", [(await combo()).expanded, await value(), await focusIn()], ["false", "/restock @Web search /", true]);
  await p.type("s"); await sleep(100);
  check("typing again reopens it", [(await combo()).expanded, (await combo()).active], ["true", "/summarize"]);
  const opt = await q(`(()=>{const o=[...document.querySelectorAll('[data-slot=prompt-bar-list][data-kind="command"] [data-slot=prompt-bar-option]')].find((n)=>!n.hidden);const b=o.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  await p.click(opt.x, opt.y); await sleep(150);
  check("clicking an option accepts it and keeps focus in the textarea", [await value(), (await combo()).expanded, await focusIn()], ["/restock @Web search /summarize ", "false", true]);

  // model picker (our select) by keyboard: Tab from the textarea reaches it
  await p.key("Tab"); await sleep(100);
  check("Tab moves from the textarea to the model picker", await q(`document.activeElement === document.querySelector("#stage [data-slot=prompt-bar-row] > [data-slot=select] [data-slot=select-trigger]")`), true);
  await p.key("Enter"); await sleep(300);
  const selState = () => q(`document.querySelector("#stage [data-slot=prompt-bar-row] > [data-slot=select] [data-slot=select-trigger]").getAttribute("data-state")`);
  check("Enter opens the model picker on the current model", [await selState(), await q(`document.querySelector("[data-slot=select-content] [data-highlighted] [data-slot=select-item-text]")?.textContent.trim() ?? null`)], ["open", "Lite 1"]);
  await p.key("ArrowUp"); await sleep(60); await p.key("Enter"); await sleep(300);
  check("ArrowUp + Enter picks a model and closes", [await q(`document.querySelector("#stage [data-slot=select-value]").textContent.trim()`), await selState()], ["Nimbus 5", "closed"]);

  // attach menu (our menu) by keyboard: choosing a source inserts it and hands focus to the textarea
  await q(`document.querySelector("#stage [data-prompt-bar=attach-trigger]").focus()`);
  await p.key("Enter"); await sleep(300);
  const menuState = () => q(`document.querySelector("#stage [data-prompt-bar=attach-trigger]").getAttribute("data-state")`);
  check("Enter opens the attach menu", [await menuState(), await q(`document.querySelector("[data-slot=menu-content] [data-highlighted] [data-slot=menu-item-text]")?.textContent.trim() ?? null`)], ["open", "Add photos & files"]);
  await p.key("End"); await sleep(60); await p.key("Enter"); await sleep(300);
  check("choosing a source inserts it and focus returns to the textarea", [await menuState(), await value(), await focusIn()], ["closed", "/restock @Web search /summarize @Web search ", true]);

  // the layout switch: typing past the room beside the controls drops them to a second row, and they travel
  await q(`(()=>{const t=document.querySelector(${JSON.stringify(IN)});t.focus();t.select()})()`); await p.key("Backspace"); await sleep(300);
  await q(`(()=>{window.__flips=[];const c=document.querySelector("#stage [data-slot=prompt-bar-composer]");new MutationObserver(()=>{if(c.getAttribute("data-flip")==="to")__flips.push([c.style.height,document.querySelector("#stage [data-prompt-bar=send]").getAnimations().some((a)=>a.transitionProperty==="translate")])}).observe(c,{attributes:true,attributeFilter:["data-flip"]})})()`);
  for (const ch of "Compare enterprise and starter plan sales for both summers") await p.type(ch);
  await sleep(500);
  check("typing past the room: the controls travel to the second row and the composer grows with them (translate + height), then rest", await q(`(()=>{const c=document.querySelector("#stage [data-slot=prompt-bar-composer]");const s=document.querySelector("#stage [data-prompt-bar=send]").getBoundingClientRect();const i=document.querySelector(${JSON.stringify(IN)}).getBoundingClientRect();return [__flips.length>0, __flips.some((f)=>f[1]), c.hasAttribute("data-flip"), c.style.height, s.top>=i.bottom-1]})()`), [true, true, false, "", true]);
  await q(`(()=>{const t=document.querySelector(${JSON.stringify(IN)});t.focus();t.select()})()`); await p.key("Backspace"); await sleep(400);

  // tooltips: every icon-only button names itself with its aria-label, and follows it when it changes
  const tip = async (sel) => {
    const r = await q(`(()=>{const b=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
    await p.hover(5, 5); await sleep(250); await p.hover(r.x - 2, r.y); await p.hover(r.x, r.y); await sleep(800);
    const text = await q(`[...document.querySelectorAll("[data-slot=tooltip][data-state=open]")].map((n)=>n.textContent.trim()).join("|")`);
    await p.hover(5, 5); await sleep(300);
    return text;
  };
  check("tooltips: attach and dictate show their aria-label", [await tip("#stage [data-prompt-bar=attach-trigger]"), await tip("#stage [data-prompt-bar=dictate]")], ["Add attachments and sources", "Start dictation"]);

  // dictation
  await p.clickSel("#stage [data-prompt-bar=dictate]"); await sleep(100);
  check("dictation toggles aria-pressed and shows the level bars", await q(`(()=>{const b=document.querySelector("#stage [data-prompt-bar=dictate]");return [b.getAttribute("aria-pressed"), b.getAttribute("aria-label"), getComputedStyle(b.querySelector("[data-slot=prompt-bar-bars]")).display]})()`), ["true", "Stop dictation", "flex"]);
  check("the dictate tooltip follows its label", await tip("#stage [data-prompt-bar=dictate]"), "Stop dictation");

  // busy: send is stop, Enter does not send
  await p.goto(`${BASE}/harness.html?c=prompt-bar&fw=${fw}&ex=1`, 300); await ready();
  check("busy: send becomes an enabled stop button", await sendState(), ["Stop generating", false]);
  check("busy: the send tooltip says Stop generating", await tip(SEND), "Stop generating");
  check("shape=pill: no attribute repeats the prop, a fully round composer", await q(`(()=>{const r=document.querySelector("#stage [data-slot=prompt-bar]");return [r.hasAttribute("data-shape"), r.hasAttribute("data-variant"), parseFloat(getComputedStyle(r.querySelector("[data-slot=prompt-bar-composer]")).borderTopLeftRadius) >= 24]})()`), [false, false, true]);
  await p.clickSel(IN); await sleep(80); await p.key("End", {}); await p.key("Enter"); await sleep(150);
  check("busy: Enter does not send", await value(), "Compare enterprise signups to last summer");

  // attachments: remove keeps focus in the bar
  await p.goto(`${BASE}/harness.html?c=prompt-bar&fw=${fw}&ex=2`, 300); await ready();
  await q(`document.querySelector("#stage [data-prompt-bar=attachment-remove]").focus()`);
  await p.key("Enter"); await sleep(200);
  check("removing a chip moves focus to the next chip's remove button", [await q(`document.querySelectorAll("#stage [data-prompt-bar=attachment]").length`), await q(`document.activeElement?.getAttribute("aria-label")`)], [2, "Remove summer-plan.pdf"]);
  check("attachments are Tags; remove is an xs Button with a tooltip", await q(`(()=>{const a=document.querySelector("#stage [data-prompt-bar=attachment]");const b=a.querySelector("[data-prompt-bar=attachment-remove]");return [a.dataset.slot, b.dataset.tag, b.dataset.slot==="button", Math.round(b.getBoundingClientRect().height)]})()`), ["tag", "remove", true, 24]);
  check("the remove tooltip names the file", await tip("#stage [data-prompt-bar=attachment-remove]"), "Remove summer-plan.pdf");

  // right-to-left: the portaled list carries the direction and lines up with the composer
  await p.goto(`${BASE}/harness.html?c=prompt-bar&fw=${fw}&ex=0&dir=rtl`, 300); await ready();
  await p.clickSel(IN); await sleep(80); await p.type("/"); await sleep(150);
  check("rtl: the list is right-to-left and aligned to the composer's start (right) edge", await q(`(()=>{const c=document.querySelector("#stage [data-slot=prompt-bar-composer]").getBoundingClientRect();const l=document.querySelector('[data-slot=prompt-bar-list][data-kind="command"]');const b=l.getBoundingClientRect();return [l.closest("[dir]")?.getAttribute("dir"), getComputedStyle(l).direction, Math.abs(b.right-c.right)<1]})()`), ["rtl", "rtl", true]);
  await p.key("ArrowDown"); await sleep(80);
  check("rtl: ArrowDown moves to the option below", (await combo()).active, "/billing-plan");
  await p.key("Escape"); await sleep(80);

  // reduced motion: no sweep
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await p.goto(`${BASE}/harness.html?c=prompt-bar&fw=${fw}&ex=0`, 300); await ready();
  await p.clickSel(IN); await p.type("Hi"); await p.key("Enter"); await sleep(60);
  check("reduced motion: sends without the sweep", [await value(), await q(`document.querySelector("#stage [data-slot=prompt-bar-sweep]").hasAttribute("data-sweeping")`)], ["", false]);
  await p.media([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  // a placeholder that does not fit beside the controls takes the two-row layout, as typed text would
  await p.goto(`${BASE}/harness.html?c=prompt-bar&fw=${fw}&ex=4`, 300); await ready();
  const fitsHint = () => q(`(()=>{const t=document.querySelector(${JSON.stringify(IN)});const c=document.createElement("canvas").getContext("2d");const s=getComputedStyle(t);c.font=s.fontStyle+" "+s.fontWeight+" "+s.fontSize+" "+s.fontFamily;const room=t.clientWidth-parseFloat(s.paddingInlineStart)-parseFloat(s.paddingInlineEnd);return [t.value, c.measureText(t.placeholder).width<=room+1, t.getBoundingClientRect().width>document.querySelector("#stage [data-slot=prompt-bar-row]").getBoundingClientRect().width*0.8]})()`);
  check("narrow, empty: the long placeholder is shown whole, the controls on their own row", await fitsHint(), ["", true, true]);
  await p.goto(`${BASE}/harness.html?c=prompt-bar&fw=${fw}&ex=0`, 300); await ready();
  check("wide, empty: the placeholder fits beside the controls, one row", await q(`document.querySelector(${JSON.stringify(IN)}).getBoundingClientRect().width<document.querySelector("#stage [data-slot=prompt-bar-row]").getBoundingClientRect().width*0.8`), true);
  check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ crashed: ${String(e.message).split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { console.error(`${fw}: attempt ${attempt + 1} failed (retrying): ${checks.filter((c) => c.startsWith("✗")).join(" | ").slice(0, 400)}`); failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
/* a pressed option darkens to --fndn-hover-2 over the glide, not the glide's own colour */
{
  const h = await launch({ hover: true });
  await h.goto(`${BASE}/harness.html?c=prompt-bar&fw=react&ex=0`, 300);
  for (let t = 0; t < 60; t++) { if (await h.eval(`"harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); }
  await sleep(400);
  await h.clickSel(IN); await sleep(80); await h.type("/"); await sleep(200);
  const r = await h.rect('[data-slot=prompt-bar-list][data-kind="command"] [data-slot=prompt-bar-option]:nth-of-type(2)');
  const bg = () => h.eval(`getComputedStyle(document.querySelectorAll('[data-slot=prompt-bar-list][data-kind="command"] [data-slot=prompt-bar-option]')[1]).backgroundColor`);
  const token = (n) => h.eval(`(()=>{const d=document.createElement("div");d.style.background="var(${n})";document.body.append(d);const c=getComputedStyle(d).backgroundColor;d.remove();return c})()`);
  await h.hover(r.cx, r.cy); await sleep(250);
  const rest = await bg();
  await h.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", buttons: 1, clickCount: 1 }); await sleep(200);
  const pressed = await bg();
  await h.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.cx, y: r.cy, button: "left", buttons: 0, clickCount: 1 }); await sleep(100);
  const ok = rest === "rgba(0, 0, 0, 0)" && pressed === await token("--fndn-hover-2");
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} option press: row ${rest} under the glide, pressed ${pressed} (want transparent, then --fndn-hover-2)`);
  await h.close();
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
