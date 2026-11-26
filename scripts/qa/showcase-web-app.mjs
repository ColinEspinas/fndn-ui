// The issue tracker showcase (showcases/web-app): loads the page, no console error, no
// layout shift after the first paint, no sideways scroll at 390px, one-line rows in a flush list
// (no card, no wrap, beside the open issue too), a ghost "New issue", and drives the main
// interactions: the status filter and the assignee
// select, opening an issue (pointer and keyboard), changing its status and adding a comment, bulk
// selection with a status change and a delete behind an alert dialog (then Undo), search on Ctrl+K,
// a new issue on C, a project in the sidebar (loading, then its list), collapsing the sidebar, the
// inbox (unread dots, opening on the newest notification, the issue beside the list, mark all as
// read), settings (save, a switch, the
// danger zone), and the phone's list rows with select mode.
//   node scripts/qa/showcase-web-app.mjs            (the docs on http://localhost:4321)
//   SHOWCASE_URL=<page url> SHOTS=<dir> node scripts/qa/showcase-web-app.mjs
import { launch, sleep } from "./cdp.mjs";

const URL = process.env.SHOWCASE_URL ?? `${(process.env.DOCS_URL ?? "http://localhost:4321").replace(/\/$/, "")}/showcase/web-app`;
const SHOTS = process.env.SHOTS;
const R = "[data-showcase=web-app]";
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
const rows = () => q(`[...document.querySelectorAll("${R} [data-issue]")].map((r) => r.dataset.issue)`);
const detail = () => q(`document.querySelector("${R} [data-app=detail] header span.font-mono")?.textContent ?? null`);
const toastText = () => q(`[...document.querySelectorAll("[data-slot=toast-item]")].map((t) => t.textContent).join(" | ")`);
/** Click the first element matching `sel` whose text contains `text`. */
const clickText = async (sel, text) => {
  const r = await q(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.textContent.includes(${JSON.stringify(text)})); if (!e) return null; e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  if (!r) throw new Error(`no ${sel} with "${text}"`);
  await p.click(r.x, r.y);
};
const pick = async (trigger, option) => { await p.clickSel(trigger); await sleep(250); await clickText("[data-state=open] [role=option]", option); await sleep(250); };

const rowHeights = () => q(`[...new Set([...document.querySelectorAll("${R} [data-issue]")].map((r) => Math.round(r.getBoundingClientRect().height)))]`);

try {
  await p.goto(URL, 300);
  /* shifts of the app's own nodes (the docs page around it is checked by docs.mjs) */
  await q(`window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput && e.sources.some((s) => s.node?.closest?.("${R}"))) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); 1`);
  check("the app renders", await waitFor(`!!document.querySelector("${R} [data-issue]")`, 15000), true);
  await sleep(2500);
  await shot("1536-start");
  check("nothing in the app shifts after the first paint", await q(`window.__cls < 0.001`), true);
  check("the list opens on the active work (Linear's default)", await rows(), ["WEB-482", "WEB-479", "WEB-476", "WEB-471"]);
  check("rows are one line, 35-37px", (await rowHeights()).every((h) => h >= 35 && h <= 37), true);
  check("the list is flush: no card", await q(`(() => { const s = getComputedStyle(document.querySelector("${R} [data-slot=table]")); return s.backgroundColor === "rgba(0, 0, 0, 0)" && !/[1-9]px/.test(s.boxShadow); })()`), true);
  check("New issue is not a filled primary (its text is the page's ink)", await q(`getComputedStyle([...document.querySelectorAll("${R} [data-app=issues] button")].find((b) => b.textContent === "New issue")).color === getComputedStyle(document.querySelector("${R}")).color`), true);
  await clickText(`${R} [data-slot=segmented-control-option]`, "All"); await sleep(200);
  check("web-app's issues, all statuses", (await rows()).length, 7);
  check("the sidebar marks the project", await q(`document.querySelector("${R} [data-slot=sidebar-nav-item][aria-current=page]")?.textContent`), "web-app");

  // filters: a status segment, then an assignee
  await clickText(`${R} [data-slot=segmented-control-option]`, "Active");
  await sleep(200);
  check("Active keeps the open work", await rows(), ["WEB-482", "WEB-479", "WEB-476", "WEB-471"]);
  await clickText(`${R} [data-slot=segmented-control-option]`, "All"); await sleep(200);
  await pick(`${R} [data-app=issues] [data-slot=select-trigger]`, "Lucas Moreau");
  check("the assignee filter keeps Lucas's issues", await rows(), ["WEB-479"]);
  await pick(`${R} [data-app=issues] [data-slot=select-trigger]`, "Daniel Okafor");
  await clickText(`${R} [data-slot=segmented-control-option]`, "Backlog"); await sleep(200);
  check("no match shows the empty state", await q(`document.querySelector("${R} [data-app=issues] [data-slot=empty-state]")?.textContent.includes("No issues match")`), true);
  await clickText(`${R} [data-app=issues] button`, "Clear filters"); await sleep(200);
  check("Clear filters shows all again", (await rows()).length, 7);

  // open an issue: the panel beside the list
  await p.clickSel(`${R} [data-issue=WEB-482] a`); await sleep(300);
  check("a click opens the issue beside the list", [await detail(), await q(`document.querySelector("${R}").dataset.layout`)], ["WEB-482", "split"]);
  check("…and the rows stay one line", (await rowHeights()).every((h) => h >= 35 && h <= 37), true);
  await shot("1536-issue");
  await pick(`${R} [data-app=detail] [data-slot=select-trigger][aria-label=Status]`, "Done");
  check("changing the status updates the row", await q(`document.querySelector("${R} [data-issue=WEB-482] [data-slot=status-pill]").textContent`), "Done");
  check("…and records it in the activity", await q(`document.querySelector("${R} [data-app=detail] ol").textContent.includes("moved this to Done")`), true);
  await p.clickSel(`${R} [data-app=detail] textarea[aria-label^=Comment]`);
  await p.type("Shipped in dpl_7f3a9c.");
  await p.key("Enter", { ctrl: true }); await sleep(200);
  check("Ctrl+Enter posts the comment", await q(`document.querySelector("${R} [data-app=detail] ol").lastElementChild.textContent.includes("Shipped in dpl_7f3a9c.")`), true);
  await shot("1536-comment");
  // keyboard: Tab to another title and Enter opens it
  await q(`document.querySelector("${R} [data-issue=WEB-479] a").focus()`);
  await p.key("Enter"); await sleep(250);
  check("Enter on a title opens that issue", await detail(), "WEB-479");
  await p.clickSel(`${R} [data-app=detail] [aria-label="Close issue"]`); await sleep(200);
  check("Close hides the panel", await detail(), null);

  // bulk: select two, move them, delete one behind the alert dialog, undo
  await p.clickSel(`${R} [data-issue=WEB-476] [data-slot=checkbox-control]`);
  await p.clickSel(`${R} [data-issue=WEB-471] [data-slot=checkbox-control]`);
  await sleep(350);
  check("the bulk bar counts the selection", await q(`document.querySelector("${R} [data-app=bulk] [role=status]").textContent`), "2 selected");
  await shot("1536-bulk");
  await clickText(`${R} [data-app=bulk] button`, "Status"); await sleep(300);
  await clickText("[data-slot=menu-content][data-state=open] [data-slot=menu-item]", "In progress"); await sleep(300);
  check("bulk status moves both", await q(`["WEB-476", "WEB-471"].map((id) => document.querySelector("${R} [data-issue=" + id + "] [data-slot=status-pill]").textContent)`), ["In progress", "In progress"]);
  check("…and a toast says so", (await toastText()).includes("2 issues moved to In progress"), true);
  await p.clickSel(`${R} [data-issue=WEB-463] [data-slot=checkbox-control]`); await sleep(300);
  await clickText(`${R} [data-app=bulk] button`, "Delete"); await sleep(400);
  check("Delete asks first", await q(`document.querySelector("[role=alertdialog]")?.textContent.includes("Delete 1 issue?")`), true);
  await shot("1536-delete");
  await clickText("[role=alertdialog] button", "Delete 1 issue"); await sleep(400);
  check("the issue is gone", (await rows()).includes("WEB-463"), false);
  await clickText("[data-slot=toast-item] button", "Undo"); await sleep(300);
  check("Undo brings it back", (await rows()).includes("WEB-463"), true);

  // search: Ctrl+K, type, Enter opens the issue
  await q(`document.querySelector("${R}").focus()`);
  await p.key("k", { ctrl: true }); await sleep(300);
  check("Ctrl+K opens search", await q(`!!document.querySelector("[role=dialog] [data-slot=search]")`), true);
  check("…with the first row highlighted, under its group's label", await q(`(() => { const d = document.querySelector("[role=dialog] [data-slot=search]").closest("[role=dialog]"); return !!d.querySelector("[data-highlighted]") && d.textContent.includes("Actions"); })()`), true);
  await p.type("VAT"); await sleep(250);
  await shot("1536-search");
  await p.key("Enter"); await sleep(700);
  check("Enter opens the issue in its project (after loading)", [await detail(), await q(`document.querySelector("${R} [data-slot=breadcrumb]").textContent.includes("billing-api")`)], ["BIL-212", true]);

  // C creates an issue
  await q(`document.querySelector("${R}").focus()`);
  await p.key("c"); await sleep(400);
  check("C opens New issue with the title focused", await q(`document.activeElement?.name`), "title");
  await p.type("Refund emails show the wrong currency");
  await p.key("Enter"); await sleep(400);
  check("Enter creates and opens it", [await detail(), (await rows())[0]], ["BIL-213", "BIL-213"]);
  check("…with a toast", (await toastText()).includes("BIL-213 created"), true);

  // the sidebar: another project loads, then the rail collapses
  await clickText(`${R} [data-slot=sidebar-nav-item]`, "mobile");
  check("a project shows a loading state first", await q(`!!document.querySelector("${R} [data-slot=loading-state]")`), true);
  check("…then its issues", await waitFor(`document.querySelector("${R} [data-issue]")?.dataset.issue === "MOB-88"`), true);
  await p.clickSel(`${R} [aria-label="Collapse sidebar"]`); await sleep(500);
  check("the sidebar collapses to a rail", await q(`Math.round(document.querySelector("${R} [data-slot=sidebar-nav]").getBoundingClientRect().width) < 70`), true);
  await shot("1536-collapsed");
  await p.clickSel(`${R} [aria-label="Expand sidebar"]`); await sleep(500);

  // the inbox: unread dots; wide, it opens on the newest notification (Linear's), which is read
  await clickText(`${R} [data-slot=sidebar-nav-item]`, "Inbox"); await sleep(300);
  check("the inbox lists three notifications and opens the newest beside them (read), one left unread", [await q(`document.querySelectorAll("${R} [data-app=inbox] li").length`), await detail(), await q(`document.querySelectorAll("${R} [data-app=inbox] li[data-unread]").length`)], [3, "WEB-482", 1]);
  await shot("1536-inbox");
  await clickText(`${R} [data-app=inbox] button`, "Mark all as read"); await sleep(200);
  check("Mark all as read clears the dots and the badge", [await q(`document.querySelectorAll("${R} [data-app=inbox] li[data-unread]").length`), await q(`document.querySelector("${R} [data-slot=sidebar-nav-item][aria-current=page]")?.textContent`)], [0, "Inbox"]);
  await p.clickSel(`${R} [data-notification=n2] button`); await sleep(300);
  check("another notification opens its issue beside the list", await detail(), "BIL-212");
  await p.clickSel(`${R} [data-app=detail] [aria-label="Close issue"]`); await sleep(200);
  check("closed, the preview's empty state shows a bell glyph, not a word", await q(`(() => { const e = document.querySelector("${R} [data-app=inbox] ~ * [data-slot=empty-state], ${R} main [data-slot=empty-state]"); return !!e && !!e.querySelector("svg") && !e.textContent.includes("bell"); })()`), true);

  // settings: save, a switch, the danger zone
  await clickText(`${R} [data-slot=sidebar-nav-item]`, "web-app"); await waitFor(`!!document.querySelector("${R} [data-issue]")`);
  await clickText(`${R} [data-slot=sidebar-nav-item]`, "Project settings"); await sleep(300);
  await waitFor(`!!document.querySelector("${R} [data-app=settings] input")`);
  const name = `${R} [data-app=settings] input:not([maxlength])`;
  await p.clickSel(name);
  await q(`document.querySelector("${name}").select()`);
  await p.type("web-console"); await sleep(150);
  await clickText(`${R} [data-app=settings] button`, "Save changes"); await sleep(300);
  check("Save renames the project in the sidebar", await q(`[...document.querySelectorAll("${R} [data-slot=sidebar-nav-item]")].some((a) => a.textContent === "web-console")`), true);
  await shot("1536-settings");
  await clickText(`${R} [data-app=settings] [role=tab]`, "Notifications"); await sleep(300);
  const sw = `${R} [data-app=settings] [role=switch][aria-label="Status changes"]`;
  await p.clickSel(sw); await sleep(150);
  check("a notification switch turns on", await q(`document.querySelector('${sw}').getAttribute("aria-checked")`), "true");
  await clickText(`${R} [data-app=settings] [role=tab]`, "General"); await sleep(300);
  await clickText(`${R} [data-app=danger-zone] button`, "Delete project"); await sleep(400);
  check("Delete project asks first", await q(`document.querySelector("[role=alertdialog]")?.textContent.includes("Delete web-console?")`), true);
  await clickText("[role=alertdialog] button", "Delete project"); await sleep(400);
  check("…then the project leaves the sidebar", await q(`[...document.querySelectorAll("${R} [data-slot=sidebar-nav-item]")].some((a) => a.textContent === "web-console")`), false);

  check("no console error", p.errors, []);

  // narrower windows: the issue takes the list's place at 1280; a phone has one view at a time
  for (const [w, theme] of [[1280, "dark"], [390, "light"]]) {
    await p.viewport(w, w === 390 ? 844 : 860, 1.25, w === 390);
    await p.goto(URL, 300);
    if (theme === "dark") await q(`document.documentElement.dataset.theme = "dark"`); else await q(`delete document.documentElement.dataset.theme`);
    await waitFor(`!!document.querySelector("${R} [data-issue]")`, 15000); await sleep(500);
    check(`no sideways scroll at ${w}px`, await q(`document.documentElement.scrollWidth - innerWidth`), 0);
    await shot(`${w}-${theme}`);
    await p.clickSel(`${R} [data-issue=WEB-482] a`); await sleep(300);
    check(`at ${w}px the issue replaces the list`, [await detail(), await q(`!!document.querySelector("${R} [data-app=issues]")`)], ["WEB-482", false]);
    check(`no sideways scroll at ${w}px with the issue open`, await q(`document.documentElement.scrollWidth - innerWidth`), 0);
    await shot(`${w}-${theme}-issue`);
    await clickText(`${R} [data-app=detail] header button`, "Issues"); await sleep(200);
    check(`at ${w}px Back returns to the list`, await q(`!!document.querySelector("${R} [data-app=issues]")`), true);
  }
  // the phone's list: rows without checkboxes until Select; a tap then picks a row
  check("phone: list rows, no table", await q(`!!document.querySelector("${R} li[data-issue]") && !document.querySelector("${R} [data-slot=table]")`), true);
  check("phone: no checkbox before Select", await q(`document.querySelectorAll("${R} [data-app=issues] li [data-slot=checkbox-control]").length`), 0);
  await p.clickSel(`${R} [data-app=issues] button[aria-pressed=false]`); await sleep(200);
  await p.clickSel(`${R} li[data-issue=WEB-479]`); await sleep(400);
  check("phone: in select mode a tap picks the row", await q(`document.querySelector("${R} [data-app=bulk] [role=status]").textContent`), "1 selected");
  await shot("390-select");
  await p.clickSel(`${R} [data-app=issues] button[aria-pressed=true]`); await sleep(300);
  check("phone: the views are picked at the bottom", await q(`document.querySelector("${R}").dataset.layout === "phone" && !!document.querySelector("${R} nav[aria-label=Views]")`), true);
  await clickText(`${R} nav[aria-label=Views] [data-slot=segmented-control-option]`, "Settings"); await sleep(300);
  check("no sideways scroll on the phone's settings", await q(`document.documentElement.scrollWidth - innerWidth`), 0);
  await shot("390-settings");
  check("no console error after the resizes", p.errors, []);
} catch (e) {
  failed++;
  console.log(`FAIL ${e.message}`);
} finally {
  await p.close();
}
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
