// The web browser showcase (showcases/web-browser): loads the page, no console error, no
// sideways scroll at 390px, and drives the main interactions: attached tabs and a first frame where nothing moves, switching, opening and closing tabs
// (pointer and keyboard), typing an address, back, the site information and downloads popovers, the
// main menu with its sub-menu, the History page (filter, table) and Settings (switch → bookmarks bar).
//   node scripts/qa/showcase-web-browser.mjs            (the docs on http://localhost:4321)
//   SHOWCASE_URL=<page url> SHOTS=<dir> node scripts/qa/showcase-web-browser.mjs
import { launch, sleep } from "./cdp.mjs";

const URL = process.env.SHOWCASE_URL ?? `${(process.env.DOCS_URL ?? "http://localhost:4321").replace(/\/$/, "")}/showcase/web-browser`;
const SHOTS = process.env.SHOTS;
const R = "[data-showcase=web-browser]";
let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

const p = await launch({ width: 1536, height: 900, dpr: 1.25, hover: true });
const q = (js) => p.eval(js);
const shot = async (name) => { if (SHOTS) await p.shot(`${SHOTS}/${name}.png`); };
const waitFor = async (expr, ms = 6000) => { for (const end = Date.now() + ms; Date.now() < end; await sleep(100)) if (await q(expr)) return true; return false; };
const tabTitles = () => q(`[...document.querySelectorAll("${R} [data-slot=tabs-trigger]")].map((t) => t.querySelector("[title]").title)`);
const selected = () => q(`document.querySelector("${R} [data-slot=tabs-trigger][aria-selected=true] [title]")?.title`);
const address = () => q(`document.querySelector("${R} [data-slot=tabs-content]:not([hidden]) [data-slot=combobox-input]").value`);
const loaded = () => waitFor(`!document.querySelector("${R} [data-slot=tabs-trigger] [data-slot=spinner]")`);
/** Click the first element matching `sel` whose text contains `text`. */
const clickText = async (sel, text) => {
  const r = await q(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.textContent.includes(${JSON.stringify(text)})); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  if (!r) throw new Error(`no ${sel} with "${text}"`);
  await p.click(r.x, r.y);
};

try {
  await p.goto(URL, 300);
  check("the window renders", await waitFor(`!!document.querySelector("${R} [data-slot=tabs-trigger]")`, 15000), true);
  await sleep(600);
  await shot("1536-start");
  check("three tabs, the first selected", [await tabTitles(), await selected()], [["Getting started · Harbor Docs", "Harbor Status", "Q4 planning — Fieldnotes"], "Getting started · Harbor Docs"]);
  check("the address bar shows the page", await address(), "harbor.dev/docs/getting-started");

  // the first frame: attached tabs (the selected one is the toolbar's surface), nothing running
  check("attached tabs: the selected tab takes the toolbar's colour, the strip is darker", await q(`(() => {
    const bg = (e) => getComputedStyle(e).backgroundColor;
    const sel = document.querySelector("${R} [data-slot=tabs-trigger][aria-selected=true]"), other = document.querySelector("${R} [data-slot=tabs-trigger][aria-selected=false]");
    const panel = document.querySelector("${R} [data-slot=tabs-content]:not([hidden])");
    return [bg(sel) === bg(panel), bg(other) !== bg(sel), bg(document.querySelector("${R}")) !== bg(panel)];
  })()`), [true, true, true]);
  check("nothing moves on first paint (no download ring, no spinner)", await q(`document.querySelectorAll("${R} [data-slot=progress-ring], ${R} [data-slot=spinner]").length`), 0);
  check("the address bar: site information inside the field, no caret, the star at its end", await q(`(() => {
    const c = document.querySelector("${R} [data-slot=tabs-content]:not([hidden]) [data-slot=combobox-control]");
    return [!!c.querySelector("[data-slot=combobox-start] [aria-label='View site information']"), !!c.querySelector("[data-combobox=trigger]"), !!c.querySelector("[data-slot=combobox-end] [aria-pressed]")];
  })()`), [true, false, true]);

  // a download started from the page: the ring shows it arriving
  await clickText(`${R} article a`, "Download the CLI"); await sleep(300);
  check("a started download shows its ring in the toolbar", await q(`!!document.querySelector("${R} [aria-label=Downloads] [data-slot=progress-ring]")`), true);
  await p.clickSel(`${R} [aria-label=Downloads]`); await sleep(350);
  check("downloads: a running file with its progress, two done", await q(`(() => { const c = document.querySelector("[data-slot=popover-content][data-state=open]"); return c ? [c.querySelectorAll("[data-slot=progress]").length, c.textContent.split("Done").length - 1] : null })()`), [1, 2]);
  await p.clickSel("[data-slot=popover-content][data-state=open] [aria-label='Cancel download']"); await sleep(150);
  check("Cancel removes the running download", await q(`document.querySelector("[data-slot=popover-content][data-state=open]").textContent.includes("harbor-cli")`), false);
  await shot("1536-downloads");
  await p.key("Escape"); await sleep(200);


  // tabs: switch by pointer, close by its mark, open from the + button
  await clickText(`${R} [data-slot=tabs-trigger]`, "Harbor Status");
  await sleep(250);
  check("a click switches the tab and the address", [await selected(), await address()], ["Harbor Status", "status.harbor.dev"]);
  const mark = await p.rect(`${R} [data-slot=tabs-close][aria-label="Close tab Q4 planning — Fieldnotes"]`);
  await p.click(mark.cx, mark.cy); await sleep(200);
  check("the close mark closes its tab only", await tabTitles(), ["Getting started · Harbor Docs", "Harbor Status"]);
  await p.clickSel(`${R} [aria-label="New tab"]`); await sleep(400);
  check("+ opens a new tab page with the address bar focused", [await selected(), await q(`document.activeElement?.dataset.slot`)], ["New tab", "combobox-input"]);

  // the address bar: what Enter does comes first (a page that starts with the text, else a search)
  const rows = () => q(`[...document.querySelectorAll("[data-slot=combobox-content][data-state=open] [data-slot=combobox-item-text]")].map((e) => e.textContent)`);
  await p.type("stat"); await sleep(150);
  check("typing: the page it completes first, then the search", (await rows()).slice(0, 2), ["status.harbor.dev", "Search DuckDuckGo for “stat”"]);
  await shot("1536-suggestions");
  for (let i = 0; i < 4; i++) await p.key("Backspace");
  await p.type("harbor"); await sleep(150);
  check("typing shows the matching suggestions", await q(`(() => { const rows = [...document.querySelectorAll("[data-slot=combobox-content][data-state=open] [data-slot=combobox-item-text]")]; return rows.length > 1 && rows.every((e) => e.textContent.toLowerCase().includes("harbor")); })()`), true);
  for (let i = 0; i < 6; i++) await p.key("Backspace");
  await p.type("preview deploys"); await sleep(150);
  await p.key("Enter"); await sleep(100);
  check("Enter without a highlighted suggestion searches", await waitFor(`document.querySelector("${R} [data-slot=tabs-trigger][aria-selected=true] [title]")?.title === "preview deploys — DuckDuckGo"`), true);
  await loaded(); await sleep(200);
  check("the results page lists matching sites", await q(`[...document.querySelectorAll("${R} article a")].map((a) => a.textContent).includes("Preview deploys · Harbor Docs")`), true);
  await clickText(`${R} article a`, "Preview deploys · Harbor Docs");
  check("a link loads (spinner in the tab, progress over the page)", await q(`!!document.querySelector("${R} [data-slot=tabs-trigger] [data-slot=spinner]") && !!document.querySelector("${R} [data-slot=progress]")`), true);
  await loaded(); await sleep(200);
  check("…then shows the page", await address(), "harbor.dev/docs/preview-deploys");
  await p.clickSel(`${R} [aria-label=Back]`); await loaded(); await sleep(200);
  check("Back returns to the results", (await address()).startsWith("duckduckgo.com"), true);

  // keyboard: Alt+T, Ctrl+L, Alt+1, Delete on a focused tab, Alt+W
  await p.key("t", { alt: true }); await sleep(300);
  check("Alt+T opens a tab", (await tabTitles()).length, 4);
  await p.key("Escape");
  await p.key("1", { alt: true }); await sleep(200);
  check("Alt+1 switches to the first tab", await selected(), "Getting started · Harbor Docs");
  await p.key("l", { ctrl: true }); await sleep(200);
  check("Ctrl+L focuses the address bar and selects it", await q(`document.activeElement?.dataset.slot === "combobox-input" && document.activeElement.selectionEnd - document.activeElement.selectionStart === document.activeElement.value.length`), true);
  await p.key("Escape");
  await p.clickSel(`${R} [data-slot=tabs-trigger][aria-selected=true]`);
  await p.key("ArrowRight"); await sleep(150);
  await p.key("Delete"); await sleep(250);
  check("Delete closes the focused tab (once)", await tabTitles(), ["Getting started · Harbor Docs", "preview deploys — DuckDuckGo", "New tab"]);
  await p.key("w", { alt: true }); await sleep(250);
  check("Alt+W closes the current tab", (await tabTitles()).length, 2);

  // the site information and downloads popovers
  await p.clickSel(`${R} [data-slot=tabs-tab]:nth-child(3) [data-slot=tabs-trigger]`); await sleep(200);
  await p.key("1", { alt: true }); await sleep(200);
  await p.clickSel(`${R} [aria-label="View site information"]`); await sleep(300);
  check("the lock opens the site information", await q(`document.querySelector("[data-slot=popover-content][data-state=open]")?.textContent.includes("Connection is secure")`), true);
  await p.key("Escape"); await sleep(200);
  // the main menu: a sub-menu, then History
  await p.clickSel(`${R} [aria-label="Main menu"]`); await sleep(300);
  check("the menu opens", await q(`!!document.querySelector("[data-slot=menu-content][data-state=open]")`), true);
  await clickText("[data-slot=menu-content][data-state=open] [data-slot=menu-item]", "History"); await sleep(350);
  check("History opens its sub-menu with the closed tabs", await q(`[...document.querySelectorAll("[data-slot=menu-content][data-state=open] [data-slot=menu-item-text]")].map((e) => e.textContent).includes("Q4 planning — Fieldnotes")`), true);
  await shot("1536-menu");
  await clickText("[data-slot=menu-content][data-state=open] [data-slot=menu-item]", "Show full history"); await sleep(400);
  check("…and Show full history opens the History tab", await selected(), "History");
  check("the history table lists visits", await q(`document.querySelectorAll("${R} [data-slot=table-body] [data-slot=table-row]").length >= 8`), true);
  await p.clickSel(`${R} [aria-label="Search history"]`);
  await p.type("status"); await sleep(200);
  check("the search filters the rows", await q(`document.querySelectorAll("${R} [data-slot=table-body] [data-slot=table-row]").length`), 1);
  await shot("1536-history");

  // Settings: the bookmarks bar switch folds the bar away
  await p.clickSel(`${R} [aria-label="Main menu"]`); await sleep(300);
  await clickText("[data-slot=menu-content][data-state=open] [data-slot=menu-item]", "Settings"); await sleep(400);
  check("Settings opens in a new tab", await selected(), "Settings");
  await p.clickSel(`${R} [role=switch][aria-label="Show bookmarks bar"]`); await sleep(400);
  check("the switch hides the bookmarks bar", await q(`document.querySelector("${R} nav[aria-label=Bookmarks]").getBoundingClientRect().height < 1 || document.querySelector("${R} nav[aria-label=Bookmarks]").parentElement.getBoundingClientRect().height < 1`), true);
  await shot("1536-settings");

  check("no console error", p.errors, []);

  // a phone: nothing scrolls sideways, no tab strip, the tabs in a sheet; dark at 1280
  for (const [w, theme] of [[1280, "dark"], [1280, "light"], [390, "light"], [390, "dark"]]) {
    await p.viewport(w, w === 390 ? 844 : 860, 1.25, w === 390);
    if (theme === "dark") await q(`document.documentElement.dataset.theme = "dark"`); else await q(`delete document.documentElement.dataset.theme`);
    await p.goto(URL, 300);
    if (theme === "dark") await q(`document.documentElement.dataset.theme = "dark"`);
    await waitFor(`!!document.querySelector("${R} [data-slot=tabs-trigger]")`, 15000); await sleep(500);
    check(`no sideways scroll at ${w}px ${theme}`, await q(`document.documentElement.scrollWidth - innerWidth`), 0);
    check(`nothing moves on first paint at ${w}px ${theme}`, await q(`document.querySelectorAll("${R} [data-slot=progress-ring], ${R} [data-slot=spinner]").length`), 0);
    await shot(`${w}-${theme}`);
    if (w === 390 && theme === "light") {
      check("390: no tab strip", await q(`document.querySelector("${R} [data-slot=tabs-header]").getBoundingClientRect().height`), 0);
      await p.clickSel(`${R} [aria-label$="switch tabs"]`); await sleep(500);
      check("390: the tab button opens the tabs as a sheet", await q(`[...document.querySelectorAll("[data-slot=drawer-content] [aria-label='Open tabs'] li")].length`), 3);
      await shot("390-tabs");
      await clickText("[data-slot=drawer-content] li button", "Harbor Status"); await sleep(500);
      check("390: a card selects its tab and closes the sheet", [await selected(), await q(`!!document.querySelector("[data-slot=drawer-content][data-state=open]")`)], ["Harbor Status", false]);
    }
  }
  check("no console error after the resizes", p.errors, []);
} catch (e) {
  failed++;
  console.log(`FAIL ${e.message}`);
} finally {
  await p.close();
}
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
