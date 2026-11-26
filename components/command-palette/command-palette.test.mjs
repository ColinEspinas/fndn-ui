// Keyboard and pointer contract of the command palette (Dialog + Search), run against every target.
//   node components/command-palette/command-palette.test.mjs            all targets
//   node components/command-palette/command-palette.test.mjs vue        one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ hover: true });
let failed = 0;
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const q = (js) => p.eval(js);
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const isOpen = () => q(`!!document.querySelector("[data-command-palette=search]")`);
  const groups = () => q(`[...document.querySelectorAll("[data-command-palette=search] [data-slot=search-group]")].map((g)=>g.querySelector("[data-slot=search-group-label]").textContent.trim()+": "+[...g.querySelectorAll("[data-slot=search-item-text]")].map((e)=>e.textContent.trim()).join(", "))`);
  const focusInField = () => q(`document.activeElement?.matches?.("[data-command-palette=search] [data-slot=search-input]") ?? false`);
  try {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=command-palette&fw=${fw}&ex=0`, 300);
  for (let t = 0; t < 80; t++) { if (await q(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(400);
  check("open: the Search is the one surface of a bare dialog at the top, the field focused", await q(`(()=>{const s=document.querySelector("[data-command-palette=search]"),c=s?.closest("[data-slot=dialog-content]"),panel=s?.querySelector("[data-slot=search-panel]");const cs=getComputedStyle(c);return [!!c, c?.getAttribute("role"), cs.backgroundColor, cs.boxShadow==="none"||cs.boxShadow.split("rgba(0, 0, 0, 0) 0px 0px 0px 0px").join("").replace(/[, ]/g,"")==="", getComputedStyle(panel).boxShadow!=="none", document.querySelector("[data-slot=command-palette]")?.getBoundingClientRect().width]})()`), [true, "dialog", "rgba(0, 0, 0, 0)", true, true, 0]);
  check("…with focus in the field", await focusInField(), true);
  check("an empty query lists the recent commands first, each once", await groups(), ["Recent: Deploy to Production, billing-api", "Projects: web-app, docs-site", "Actions: Invite teammates", "Settings: Billing, API keys", "Preferences: Switch to dark theme"]);
  check("the first row is highlighted, so Enter runs it", await q(`document.querySelector("[data-command-palette=search] [data-slot=search-item][data-highlighted] [data-slot=search-item-text]")?.textContent.trim() ?? null`), "Deploy to Production");
  check("shortcuts are Kbd at the end of their rows", await q(`[...document.querySelectorAll("[data-command-palette=search] [data-search=item-shortcut]")].map((k)=>k.textContent.replace(/\\s/g,""))`), ["⌘D", "⌘I"]);
  await p.type("billing"); await sleep(250);
  check("a query searches every command in its own group (recent ones go back to theirs)", await groups(), ["Projects: billing-api", "Settings: Billing"]);
  await p.type("x"); await sleep(250);
  await p.key("Escape"); await sleep(200);
  check("Escape clears the query first; the palette stays open", [await isOpen(), await q(`document.querySelector("[data-command-palette=search] [data-slot=search-input]").value`)], [true, ""]);
  await p.key("Escape"); await sleep(200);
  check("a second Escape closes it", await isOpen(), false);
  await p.key("k", { ctrl: true }); await sleep(200);
  check("Ctrl K opens it from anywhere, field focused, query empty", [await isOpen(), await focusInField(), await q(`document.querySelector("[data-command-palette=search] [data-slot=search-input]")?.value`)], [true, true, ""]);
  check("…at once: no transition or animation on the window or the backdrop", await q(`[...document.querySelectorAll("[data-slot=dialog-content],[data-slot=dialog-backdrop]")].every((e)=>{const cs=getComputedStyle(e);return cs.animationName==="none"&&cs.transitionDuration.split(",").every((d)=>parseFloat(d)===0)})`), true);
  await p.key("k", { ctrl: true }); await sleep(200);
  check("Ctrl K again closes it", await isOpen(), false);
  await p.key("k", { meta: true }); await sleep(200);
  check("⌘K opens it too", await isOpen(), true);
  await p.type("ship"); await sleep(250);
  await p.key("Enter"); await sleep(250);
  check("a keyword finds the command; Enter runs it and closes the palette", await isOpen(), false);
  await p.key("k", { ctrl: true }); await sleep(250);
  const row = await p.rect("[data-command-palette=search] [data-slot=search-group]:nth-of-type(2) [data-slot=search-item]");
  await p.click(row.cx, row.cy); await sleep(250);
  check("a click runs a command and closes the palette", await isOpen(), false);
  await q(`(()=>{window.__qaTake=(e)=>{if(e.key==="k")e.preventDefault()};document.body.addEventListener("keydown",window.__qaTake)})()`);
  await p.key("k", { ctrl: true }); await sleep(200);
  await q(`document.body.removeEventListener("keydown",window.__qaTake)`);
  check("a Ctrl K another handler already took (defaultPrevented) is left alone", await isOpen(), false);
  check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ crashed after "${checks.at(-1)?.slice(2, 50)}": ${String(e.message).split("\n")[0]}`); }
  if (failed > before && attempt < 2) { console.log(`${fw}: attempt ${attempt + 1} failed (retrying): ${checks.filter((c) => c.startsWith("✗")).slice(0, 3).join(" | ")}`); failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
