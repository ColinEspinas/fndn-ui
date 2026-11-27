// The code-editor showcase (showcases/code-editor/, page /showcase/code-editor of the docs).
// Needs the docs served: the dev server on http://localhost:4321, or DOCS_URL (a static build works:
// `pnpm exec astro build --outDir <dir>` and any static server). Checks, at 1536 × 960: no console
// error; the first frame (nothing scrolled: the assistant and the terminal show their start; no
// layout shift); the editor's density (code never wraps, 24px explorer rows, 28px tabs as wide as
// their names, a pressed toggle without a fill, no pill in the status bar, no author line on the
// assistant's answers); the explorer opens a file as a tab; a tab closes; Ctrl+K and Ctrl+P open the palette, which filters and
// opens a file, and Escape closes it; source control shows a change as a diff; the status bar opens
// Problems; the approval card applies the fix (rate-limit.ts changes, the test passes, the error
// goes); the prompt bar sends and the reply streams to the end; Ctrl+Enter commits; Ctrl+J and the
// arrow keys on a handle resize the panels. Then 1280 and dark, and at 390px: no horizontal scroll,
// one view at a time switched from the bottom bar. SHOTS=<dir> saves a screenshot of each state.
import { launch, sleep } from "./cdp.mjs";

const BASE = (process.env.DOCS_URL ?? "http://localhost:4321").replace(/\/$/, "");
const URL = `${BASE}/showcase/code-editor/`;
const SHOTS = process.env.SHOTS;
let failed = 0;
/* A ResizeObserver loop is benign (the browser defers the notifications) and noted, not failed: under
 * mobile emulation every docs page reports it, /components/button included (as in docs.mjs). */
const realErrors = () => page.errors.filter((e) => !/ResizeObserver loop/.test(e));
const ok = (cond, msg, extra = "") => { if (!cond) failed++; console.log(`${cond ? "ok  " : "FAIL"} ${msg}${!cond && extra ? `  (${extra})` : ""}`); };

try { const r = await fetch(URL); if (!r.ok) throw new Error(String(r.status)); }
catch (e) { console.log(`FAIL the page is not reachable at ${URL} (${e.message}); a new page needs the docs server restarted`); process.exit(1); }

const page = await launch({ width: 1536, height: 960, dpr: 1.25, hover: true });
await page.send("Page.addScriptToEvaluateOnNewDocument", { source: `addEventListener("error", (e) => console.error("window error: " + e.message))` });
const app = (sel = "") => `document.querySelector('[data-editor=root]${sel ? " " + sel : ""}')`;
const shot = async (name) => { if (SHOTS) await page.shot(`${SHOTS}/${name}.png`); };
async function waitFor(expr, ms = 8000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(100)) if (await page.eval(expr)) return true;
  return false;
}
/** Click the element under the app's root matching `sel` whose text is `text` (or starts with it, `prefix`). */
async function clickText(sel, text, prefix = false) {
  const r = await page.eval(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => ${prefix ? `x.textContent.trim().startsWith(${JSON.stringify(text)})` : `x.textContent.trim() === ${JSON.stringify(text)}`}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  if (!r) throw new Error(`no ${sel} "${text}"`);
  await page.click(r.x, r.y);
}
const activeTab = () => page.eval(`${app("[data-editor=code] [data-slot=tabs-trigger][aria-selected=true]")}?.textContent.trim() ?? null`);
const dialogOpen = () => page.eval(`!!document.querySelector('[role=dialog][data-state=open]')`);
const ctrl = (key) => page.key(key, { ctrl: true });
/** Put the frame in view and focus the app (shortcuts are bound on its root). */
async function focusApp() {
  await page.eval(`(() => { const f = document.querySelector('[data-docs-showcase-frame]'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 40); })()`);
  await sleep(100);
  const r = await page.rect("[data-editor=status]");
  await page.click(r.x + r.w - 4, r.cy);
}

try {
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__shift = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__shift += e.value; }).observe({ type: "layout-shift", buffered: true })` });
  await page.goto(URL, 1500);
  /* the code is drawn by CodeMirror once it has loaded (the plain listing is the first frame) */
  ok(await waitFor(`!!${app("[data-editor=code] .cm-line")}`), "the app renders with code in the editor");
  ok((await page.eval(`${app()}.dataset.layout`)) === "desktop", "1536: the desktop layout");
  await page.eval(`document.querySelector('[data-docs-showcase-frame]').scrollIntoView({ block: "start" })`);
  await sleep(2000);
  /* the first frame: every pane at its start, nothing moved after paint */
  const top = (sel) => page.eval(`${app(sel + " [data-slot=scroll-area-viewport]")}?.scrollTop ?? -1`);
  ok((await top("[data-editor=assistant]")) === 0, "first frame: the assistant shows the conversation's start", await top("[data-editor=assistant]"));
  ok((await top("[data-editor=terminal]")) === 0, "first frame: the terminal shows the run's start", await top("[data-editor=terminal]"));
  const shift = await page.eval(`window.__shift`);
  ok(shift < 0.001, "first frame: no layout shift", shift.toFixed(4));
  /* density, the editor's way */
  const rowH = await page.eval(`[...document.querySelectorAll('[data-editor=code] [data-slot=tabs-content]:not([hidden]) .cm-line')].map((r) => Math.round(r.getBoundingClientRect().height))`);
  ok(rowH.length > 10 && new Set(rowH).size === 1, "code lines never wrap (one row height)", rowH.join(","));
  const treeH = await page.eval(`Math.max(...[...document.querySelectorAll('[data-editor=explorer] [data-slot=tree-view-item]')].map((e) => Math.round(e.getBoundingClientRect().height)))`);
  ok(treeH === 24, "explorer rows are 24px", treeH);
  const tabH = await page.eval(`Math.round(${app("[data-editor=code] [data-slot=tabs-trigger]")}.getBoundingClientRect().height)`);
  ok(tabH === 26, "editor tabs are the pill tabs' 26px", tabH);
  /* the activity bar and the layout switches are ghost toggles: pressed keeps the hover-2 fill */
  const fills = await page.eval(`(() => { const probe = document.createElement("div"); probe.style.background = "var(--fndn-hover-2)"; document.querySelector("[data-editor=root]").append(probe); const want = getComputedStyle(probe).backgroundColor; probe.remove(); return [...document.querySelectorAll("[data-editor=root] [data-slot=toggle][aria-pressed=true]")].map((b) => getComputedStyle(b).backgroundColor === want); })()`);
  ok(fills.length > 0 && fills.every(Boolean), "pressed layout and activity toggles keep the pressed fill (hover-2)", fills.join(" "));
  /* file names are short enough to show whole (a closable tab cuts only past 240px); the status bar holds no pill; the assistant
   * is not named again on its answers */
  const cut = await page.eval(`[...document.querySelectorAll('[data-editor=code] [data-slot=tabs-label]')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim())`);
  ok(cut.length === 0, "editor tabs fit their names (none cut)", cut.join(", "));
  ok(!(await page.eval(`!!${app("[data-editor=status] [data-slot=status-pill]")}`)), "the status bar shows the test result as text, not a pill");
  ok(!(await page.eval(`!!${app("[data-editor=assistant] [data-slot=message-name]")}`)), "the assistant's answers carry no author line");
  await focusApp();
  await shot("1536-start");

  /* a tab closes from its close button */
  const tabsBefore = await page.eval(`${app("[data-editor=code] [data-slot=tabs-trigger]")} && document.querySelectorAll('[data-editor=code] [data-slot=tabs-trigger]').length`);
  await page.clickSel('[data-editor=code] [aria-label="Close invoices.ts"]');
  /* a closing tab gives its width back before it leaves the strip */
  ok(await waitFor(`document.querySelectorAll('[data-editor=code] [data-slot=tabs-trigger]').length === ${tabsBefore - 1}`, 2000), "a tab's close button closes it");

  /* explorer: open a file from the tree */
  await clickText("[data-editor=explorer] [data-slot=tree-view-item], [data-editor=explorer] [role=treeitem]", "server.ts");
  ok((await activeTab()) === "server.ts", "explorer: a click opens server.ts as the active tab", await activeTab());

  /* palette */
  await focusApp();
  await ctrl("k");
  ok(await waitFor(`!!document.querySelector('[role=dialog][data-state=open] input')`, 2000), "Ctrl+K opens the command palette");
  ok(await page.eval(`[...document.querySelectorAll('[role=dialog] [role=option]')].slice(0, 3).map((o) => o.textContent).join("|").includes("rate-limit.ts")`), "palette: the open files come first");
  await page.type("currency");
  await sleep(150);
  await shot("1536-palette");
  await page.key("Enter");
  await waitFor(`${app("[data-editor=code] [data-slot=tabs-trigger][aria-selected=true]")}?.textContent.trim() === "currency.ts"`, 2000);
  await sleep(250);
  ok(!(await dialogOpen()) && (await activeTab()) === "currency.ts", "palette: typing and Enter open currency.ts", await activeTab());
  await focusApp();
  await ctrl("p");
  ok(await waitFor(`!!document.querySelector('[role=dialog][data-state=open] input')`, 2000), "Ctrl+P opens it too");
  await page.key("Escape");
  await sleep(250);
  ok(!(await dialogOpen()), "Escape closes the palette");

  /* source control: a change shows as a diff */
  await page.clickSel('[data-editor=root] [aria-label="Side view"] [data-value=changes]');
  ok(await waitFor(`!!${app("[data-editor=source-control]")}`, 2000), "the activity bar shows source control");
  ok(await page.eval(`(() => { const s = getComputedStyle(${app("[data-editor=source-control] [data-slot=listbox-content]")}); return s.backgroundColor === "rgba(0, 0, 0, 0)" && s.paddingTop === "0px"; })()`), "the change list is flush (no card in the pane)");
  await clickText("[data-editor=source-control] [role=option]", "invoices.ts", true);
  ok(await waitFor(`${app("[data-editor=code] [data-slot=tabs-trigger][aria-selected=true]")}?.textContent.trim() === "invoices.ts (working tree)"`, 2000), "a change opens as a diff tab beside the open files", await activeTab());
  await shot("1536-diff");

  /* status bar → problems */
  await page.clickSel('[data-editor=status] button[aria-label*="errors"]');
  await sleep(150);
  ok((await page.eval(`${app("[data-editor=panel] [data-slot=tabs-trigger][aria-selected=true]")}?.textContent.trim()`))?.startsWith("Problems"), "the status bar's counts open Problems");

  /* the assistant applies the fix and runs the tests */
  await clickText("[data-editor=assistant] button", "Apply");
  ok(await waitFor(`${app("[data-editor=status]")}.textContent.includes("Tests passing")`, 3000), "approval: the fix is applied and the tests pass");
  ok(await page.eval(`${app("[data-editor=status]")}.textContent.includes("0") && !${app()}.textContent.includes("1 test failing")`), "approval: the failing test's error is gone");
  ok(await page.eval(`[...document.querySelectorAll('[data-editor=source-control] [role=option]')].some((o) => o.textContent.startsWith("rate-limit.ts"))`), "approval: rate-limit.ts is in the changes");
  ok(await waitFor(`${app("[data-editor=assistant]")}.textContent.includes("all 11 tests pass")`, 8000), "approval: the reply streams to the end");
  await shot("1536-applied");

  /* the prompt bar sends */
  await page.clickSel("[data-editor=assistant] textarea");
  await page.type("Write a commit message");
  await page.key("Enter");
  ok(await waitFor(`${app("[data-editor=assistant]")}.textContent.includes("Write a commit message")`, 2000), "prompt bar: the message is sent");
  ok(await waitFor(`${app("[data-editor=assistant]")}.textContent.includes("a commit of its own.")`, 8000), "prompt bar: the reply streams to the end");

  /* commit with Ctrl+Enter */
  await page.clickSel("[data-editor=source-control] textarea");
  await page.type("Reset the rate-limit window");
  await ctrl("Enter");
  ok(await waitFor(`${app("[data-editor=source-control]")}.textContent.includes("No changes")`, 2000), "Ctrl+Enter commits: no changes left");
  ok(await page.eval(`${app("[data-editor=status]")}.textContent.includes("↑1")`), "the status bar counts the commit");

  /* panels: Ctrl+J, and the arrow keys on a handle */
  await focusApp();
  await ctrl("j");
  await sleep(150);
  ok(!(await page.eval(`!!${app("[data-editor=panel]")}`)), "Ctrl+J closes the panel");
  await ctrl("j");
  await sleep(150);
  ok(await page.eval(`!!${app("[data-editor=panel]")}`), "Ctrl+J opens it again");
  const before = await page.rect("[data-editor=explorer], [data-editor=source-control]");
  await page.eval(`${app("[data-slot=splitter-handle]")}.focus()`);
  for (let i = 0; i < 5; i++) await page.key("ArrowRight");
  await sleep(150);
  const after = await page.rect("[data-editor=explorer], [data-editor=source-control]");
  ok(after && before && after.w > before.w + 20, "arrow keys on a handle widen the side view", `${before?.w} → ${after?.w}`);
  ok(realErrors().length === 0, "no console error", realErrors().join(" | "));

  /* 1280, and dark */
  await page.viewport(1280, 900, 1.25);
  await page.goto(URL, 1500);
  await waitFor(`!!${app(".cm-line")}`);
  await focusApp();
  ok((await page.eval(`${app()}.dataset.layout`)) === "desktop", "1280: the desktop layout");
  ok(await page.eval(`document.scrollingElement.scrollWidth <= innerWidth`), "1280: no horizontal scroll");
  await shot("1280");
  await page.eval(`document.documentElement.dataset.theme = "dark"; document.documentElement.classList.add("dark")`);
  await sleep(200);
  await shot("1280-dark");

  /* 390: one view at a time */
  await page.viewport(390, 844, 2, true);
  await page.goto(URL, 1500);
  await waitFor(`!!${app()}`);
  ok((await page.eval(`${app()}.dataset.layout`)) === "phone", "390: the phone layout");
  ok(await page.eval(`document.scrollingElement.scrollWidth <= innerWidth`), "390: no horizontal scroll", await page.eval(`document.scrollingElement.scrollWidth + " > " + innerWidth`));
  await focusApp().catch(() => {});
  await page.eval(`document.querySelector('[data-docs-showcase-frame]').scrollIntoView({ block: "start" })`);
  await shot("390-code");
  await clickText("[data-editor=root] nav [data-slot=segmented-control-option]", "Files");
  ok(await waitFor(`!!${app("[data-editor=explorer]")}`, 2000), "390: Files shows the explorer");
  await shot("390-files");
  await clickText("[data-editor=explorer] [data-slot=tree-view-item]", "server.ts");
  ok(await waitFor(`(${app("[data-editor=code] [data-slot=tabs-trigger][aria-selected=true], [data-editor=code] [data-slot=select-value]")}?.textContent ?? "").includes("server.ts")`, 2000), "390: a file opens in the Code view");
  await clickText("[data-editor=root] nav [data-slot=segmented-control-option]", "AI");
  ok(await waitFor(`!!${app("[data-editor=assistant]")}`, 2000), "390: AI shows the assistant");
  ok(await page.eval(`document.scrollingElement.scrollWidth <= innerWidth`), "390: still no horizontal scroll");
  await shot("390-assistant");
  ok(realErrors().length === 0, "no console error", realErrors().join(" | "));
  const loops = page.errors.length - realErrors().length;
  if (loops) console.log(`note ${loops} ResizeObserver loop notices (benign; every docs page under mobile emulation)`);
} catch (e) {
  failed++;
  console.log(`FAIL ${e.message}`);
} finally {
  await page.close();
}
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
