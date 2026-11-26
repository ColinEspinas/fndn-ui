// Message: the assistant's answer (avatar, header, text, actions on hover / focus), the person's
// bubble at the end, streaming (aria-busy, Thinking, no actions), a step with a source Chip, Copy,
// Good / Bad response, worst cases (narrow, long), right-to-left.
//   node components/message/message.test.mjs [react|vue|svelte …]
const C = "message";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ hover: true });
await p.send("Browser.grantPermissions", { origin: new URL(BASE).origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(300); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "color") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const M = "#stage [data-slot=message]";
const ACT = `${M} [data-slot=message-actions]`;
const opacity = () => q(`getComputedStyle(document.querySelector(${JSON.stringify(ACT)})).opacity`);

async function run(fw, check) {
  /* the assistant's answer */
  await open(fw, 0);
  check("assistant: an article with a 20px Avatar, the name and a <time>, then the text", await q(`(()=>{const m=document.querySelector(${JSON.stringify(M)});const a=m.querySelector("[data-message=avatar]");return [m.tagName, a?.matches("[data-slot=avatar]"), Math.round(a.getBoundingClientRect().width), m.querySelector("[data-slot=message-name]").textContent, m.querySelector("[data-slot=message-time]").tagName, m.querySelector("[data-slot=message-text]").textContent.slice(0, 16)]})()`), ["ARTICLE", true, 20, "Assistant", "TIME", "The deploy faile"]);
  check("actions: a named group of icon buttons in the fixed order, hidden at rest but taking their room", await q(`(()=>{const a=document.querySelector(${JSON.stringify(ACT)});return [a.getAttribute("role"), a.getAttribute("aria-label"), [...a.querySelectorAll("button")].map((b)=>b.getAttribute("aria-label")), getComputedStyle(a).opacity, a.getBoundingClientRect().height>0]})()`), ["group", "Message actions", ["Copy", "Retry", "Good response", "Bad response"], "0", true]);
  const text = await p.rect(`${M} [data-slot=message-text]`);
  await p.hover(text.cx, text.cy); await sleep(350);
  check("hover: the actions fade in (opacity over duration.fast)", [await opacity(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(ACT)})).transitionProperty.includes("opacity")`)], ["1", true]);
  await p.clickSel(`${ACT} button[aria-label="Copy"]`); await sleep(200);
  check("Copy: the text is on the clipboard; the button swaps and Copied is announced", await q(`(async()=>{const t=await navigator.clipboard.readText();const a=document.querySelector(${JSON.stringify(ACT)});return [t.startsWith("The deploy failed"), a.querySelector("[data-slot=message-announce]").textContent]})()`), [true, "Copied"]);
  await p.clickSel(`${ACT} button[aria-label="Good response"]`); await sleep(200);
  await p.hover(2, 2); await sleep(350);
  check("Good response: pressed (aria-pressed), the actions stay shown after the pointer leaves", await q(`(()=>{const a=document.querySelector(${JSON.stringify(ACT)});return [a.querySelector('button[aria-label="Good response"]').getAttribute("aria-pressed"), a.querySelector('button[aria-label="Bad response"]').getAttribute("aria-pressed"), getComputedStyle(a).opacity]})()`), ["true", "false", "1"]);
  await p.clickSel(`${ACT} button[aria-label="Bad response"]`); await sleep(200);
  check("Bad response replaces Good (at most one)", await q(`[...document.querySelectorAll(${JSON.stringify(ACT + " button[aria-pressed]")})].map((b)=>b.getAttribute("aria-pressed"))`), ["false", "true"]);
  /* keyboard: focus entering the actions shows them at once */
  await open(fw, 0);
  /* Tab in from the page, as a person does: the key is pressed before focus lands */
  await q(`document.activeElement?.blur()`);
  for (let i = 0; i < 12 && !(await q(`!!document.activeElement?.closest(${JSON.stringify(ACT)})`)); i++) await p.key("Tab");
  check("keyboard: Tab lands on Copy and the actions are there at once (no fade)", await q(`(()=>{const a=document.querySelector(${JSON.stringify(ACT)});return [document.activeElement.getAttribute("aria-label"), getComputedStyle(a).opacity]})()`), ["Copy", "1"]);
  await p.key("Tab");
  check("keyboard: Tab moves through the actions; they show at once (no fade)", await q(`(()=>{const a=document.querySelector(${JSON.stringify(ACT)});const cs=getComputedStyle(a);return [document.activeElement.getAttribute("aria-label"), cs.opacity, cs.transitionDuration.split(",").every((d)=>parseFloat(d)===0)]})()`), ["Retry", "1", true]);
  /* the person's message */
  await open(fw, 1);
  check("user: the bubble sits at the end, 56px clear of the start, field fill and 12px radius", await q(`(()=>{const m=document.querySelector(${JSON.stringify(M)});const b=m.querySelector("[data-slot=message-body]");const mb=m.getBoundingClientRect(),bb=b.getBoundingClientRect();const cs=getComputedStyle(b);return [Math.round(mb.right-bb.right), getComputedStyle(m).paddingInlineStart, cs.backgroundColor, cs.borderRadius, !m.querySelector("[data-message=avatar]")]})()`), [0, "56px", await token("--fndn-field", "backgroundColor"), "12px", true]);
  /* streaming */
  await open(fw, 2);
  check("streaming with nothing yet: aria-busy, a Thinking… status, no actions", await q(`(()=>{const m=document.querySelector(${JSON.stringify(M)});const s=m.querySelector("[data-slot=message-status]");return [m.getAttribute("aria-busy"), s?.getAttribute("role"), s?.textContent.trim(), !!m.querySelector("[data-slot=message-actions]")]})()`), ["true", "status", "Thinking…", false]);
  /* a step with a source */
  await open(fw, 3);
  check("source: the real Chip between the name and the time", await q(`[...document.querySelector("${M} [data-slot=message-header]").children].map((c)=>c.dataset.slot+(c.dataset.message?":"+c.dataset.message:""))`), ["message-name", "chip:source", "message-time"]);
  /* worst: a narrow column with a long name, source and URL */
  await open(fw, 0, "&data=worst");
  check("worst at 240px: nothing overflows; the time is whole; the source gives way first, to its 48px floor", await q(`(()=>{const m=document.querySelector(${JSON.stringify(M)});const mb=m.getBoundingClientRect();const all=[...m.querySelectorAll("*")].filter((e)=>e.getClientRects().length&&!e.closest(".sr-only")&&!e.closest("[data-slot=message-actions]"));const t=m.querySelector("[data-slot=message-time]");const n=m.querySelector("[data-slot=message-name]").getBoundingClientRect().width;const s=m.querySelector("[data-message=source]").getBoundingClientRect().width;return [all.every((e)=>e.getBoundingClientRect().right<=mb.right+0.5), t.scrollWidth<=t.clientWidth, Math.round(s), n>0]})()`), [true, true, 48, true]);
  /* right to left: the person's bubble at the end (the left) */
  await open(fw, 1, "&data=worst&dir=rtl");
  check("rtl: the bubble sits at the end (left), its text right to left", await q(`(()=>{const m=document.querySelector(${JSON.stringify(M)});const b=m.querySelector("[data-slot=message-body]");return [Math.round(b.getBoundingClientRect().left-m.getBoundingClientRect().left), getComputedStyle(m.querySelector("[data-slot=message-text]")).direction]})()`), [0, "rtl"]);
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
