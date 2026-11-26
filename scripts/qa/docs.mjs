// Smoke test of the Astro docs site (apps/docs). Needs its dev server: `pnpm --filter docs dev`
// (http://localhost:4321, or DOCS_URL). Checks: the overview, three component pages, Installation,
// a foundations page and a guide render with no console error; the Worst case switch and a prop
// change the playground's stage and code, which starts at the defaults; one line per prop in the inspector; every example file of button, card, select and
// streaming-text renders in React, Vue and Svelte with no console error and the same DOM; a component's files are what `add` writes (its folder:
// index, adapter, recipe, logic; the lib/ files they import; no CSS), the components it is built from are links, and the example code imports
// from the component folders; Vue and Svelte render button and select on the stage; the anatomy tab
// outlines a part; the search palette opens on Ctrl K, filters and navigates; the motion samples
// play; the theme toggle and the view options work and survive navigation; a two-way prop (the
// carousel's page) set in the panel travels on the mounted component and the component's own change
// comes back to the panel, in the three frameworks; no horizontal scroll at
// 390px on each kind of page; the menu button opens the tree on a phone.
import { launch, sleep } from "./cdp.mjs";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const BASE = (process.env.DOCS_URL ?? "http://localhost:4321").replace(/\/$/, "");
const PAGES = ["/", "/components/button", "/components/select", "/components/records-table", "/installation", "/foundations/motion", "/foundations/colour", "/guides/design/motion"];
let failed = 0;
const ok = (cond, msg, extra = "") => { if (!cond) failed++; console.log(`${cond ? "ok  " : "FAIL"} ${msg}${!cond && extra ? `  (${extra})` : ""}`); };

try { const r = await fetch(BASE + "/"); if (!r.ok) throw new Error(String(r.status)); }
catch (e) { console.log(`FAIL the docs server is not reachable at ${BASE} (${e.message}); start it with: pnpm --filter docs dev`); process.exit(1); }

const page = await launch({ width: 1440, height: 900, dpr: 1.25, hover: true });
/* uncaught errors and error events reach the console too (a ResizeObserver loop is only an event) */
await page.send("Page.addScriptToEvaluateOnNewDocument", { source: `addEventListener("error", (e) => console.error("window error: " + e.message))` });
/* A ResizeObserver loop is benign (the browser defers the notifications); it is noted, not failed.
 * (The 13 on the overview were the segmented control's overflow measure flipping every frame
 * under the preview's zoom; fixed in the segmented control's own logic. A new note is a new loop to find.) */
const isRoLoop = (e) => /ResizeObserver loop/.test(e);
const errorsSince = (n) => page.errors.slice(n);
/* per animation frame, from the first paint of every load: a visible React render on the stage, a
 * framework switch showing another framework than the stored one, and the layout shift */
await page.send("Page.addScriptToEvaluateOnNewDocument", { source: `(() => {
  const s = window.__fwSamples = { frames: 0, react: 0, label: 0, cls: 0 };
  const LABEL = { vue: "Vue", svelte: "Svelte", react: "React" };
  const seen = (e) => e && e.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) s.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  const tick = () => {
    let want = null; try { want = localStorage.getItem("fndn-docs-fw"); } catch {}
    if (want && want !== "react" && document.body) {
      s.frames++;
      if ([...document.querySelectorAll('[data-docs-mount] [data-docs-fw="react"]')].some(seen)) s.react++;
      const on = [...document.querySelectorAll('[data-docs-control="fw"] [data-state="checked"]')].filter(seen);
      if (on.some((e) => e.textContent.trim() !== LABEL[want])) s.label++;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})()` });
const exceptions = [];
page.on("Runtime.exceptionThrown", (p) => exceptions.push(p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text));
const hydrated = () => page.eval(`[...document.querySelectorAll("astro-island[ssr]")].filter(i => i.getAttribute("client") === "load").length === 0`);
/** Click the element matching `sel` whose text is `text` (or the first match). */
async function clickText(sel, text) {
  const r = await page.eval(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find(x => ${text === undefined ? "true" : `x.textContent.trim() === ${JSON.stringify(text)}`}); if (!e) return null; e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  if (!r) throw new Error(`no ${sel} ${text ?? ""}`);
  await page.click(r.x, r.y);
}
/** Poll `expr` until it is truthy or `ms` pass (a framework's first load compiles its adapter). */
async function waitFor(expr, ms = 8000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(150)) if (await page.eval(expr)) return true;
  return false;
}
const stage = () => page.eval(`document.querySelector("[data-docs-mount]")?.innerHTML ?? ""`);
const usage = () => page.eval(`(() => { const p = [...document.querySelectorAll("[data-docs-code] [data-slot=tabs-content]")].find(x => !x.hidden); return p ? p.innerText : ""; })()`);

try {
  // 1. pages render, islands hydrate, no console error
  for (const path of PAGES) {
    const n = page.errors.length, x = exceptions.length;
    await page.goto(BASE + path, 2500);
    if (path === "/") { // bring every live example near the viewport so all of them hydrate
      const h = await page.eval("document.documentElement.scrollHeight");
      for (let y = 0; y < h; y += 700) { await page.eval(`window.scrollTo(0, ${y})`); await sleep(120); }
      await sleep(800);
      const pending = await page.eval(`[...document.querySelectorAll("astro-island[ssr]")].length`);
      ok(pending === 0, `${path}: every live example hydrated`, `${pending} pending`);
      /* each card loads its example file and that component's adapter: a first visit compiles them */
      await waitFor(`[...document.querySelectorAll('[data-docs-preview] > div')].every(e => e.style.visibility !== "hidden")`, 6000);
      const hidden = await page.eval(`[...document.querySelectorAll('[data-docs-preview] > div')].filter(e => e.style.visibility === "hidden").length`);
      ok(hidden === 0, `${path}: every live example fitted and shown`, `${hidden} hidden`);
    }
    ok(await hydrated(), `${path}: islands hydrated`);
    /* every page names its Markdown twin, and the twin is served */
    const twin = await page.eval(`document.querySelector('link[rel="alternate"][type="text/markdown"]')?.getAttribute("href") ?? ""`);
    const want = path === "/" ? "/index.md" : `${path}.md`;
    ok(twin === want && (await fetch(BASE + twin)).ok, `${path}: links its Markdown twin ${want}`, twin);
    const all = [...errorsSince(n), ...exceptions.slice(x)];
    const errs = all.filter((e) => !isRoLoop(e));
    ok(errs.length === 0, `${path}: no console error`, errs.slice(0, 2).join(" | ").slice(0, 300));
    if (all.length > errs.length) console.log(`note ${path}: ${all.length - errs.length} "ResizeObserver loop" error events`);
  }

  // 2. button: the playground starts from components/button/examples/index.json with its looks at the spec's
  //    defaults, and Usage prints only what differs from them; the Worst case switch and a prop
  //    change the stage and the code
  await page.goto(BASE + "/components/button", 2500);
  const s0 = await stage(), u0 = await usage();
  ok(/<button/.test(s0) && /import \{ Button \}/.test(u0) && u0.includes("Save changes"), "button: stage and code show the playground");
  ok(!/\b(variant|size|shape|disabled|busy|square|muted)\b/.test(u0.replace(/^import.*$/m, "")), "button: the playground starts at the defaults and Usage prints no default prop", u0);
  /* one line per prop; the description opens on demand */
  const propRows = await page.eval(`[...document.querySelectorAll("[data-docs-panel=props] [data-prop]")].map((r) => [r.dataset.prop, Math.round(r.getBoundingClientRect().height)])`);
  ok(propRows.length > 5 && propRows.every(([, h]) => h <= 44), "button: the inspector shows each prop on one line", JSON.stringify(propRows.filter(([, h]) => h > 44)));
  ok(!(await page.eval(`document.querySelector('[data-prop="variant"] [data-slot=collapsible-text]')?.checkVisibility() ?? true`)), "button: a prop's description is closed at first");
  await clickText('[data-prop="variant"] [data-slot=collapsible-trigger]');
  await sleep(500);
  ok(await page.eval(`document.querySelector('[data-prop="variant"] [data-slot=collapsible-text]')?.checkVisibility() ?? false`), "button: the prop's name opens its description");
  await clickText('[data-prop="variant"] [data-slot=collapsible-trigger]');
  await sleep(400);
  await clickText("[data-docs-worst]");
  await sleep(500);
  const s1 = await stage(), u1 = await usage();
  ok(s1 !== s0 && (await page.eval(`!!document.querySelector("[data-docs-examples]")`)), "button: Worst case changes the stage and shows the worst cases", `${s0.length} → ${s1.length}, checked ${await page.eval(`document.querySelector("[data-docs-worst]")?.getAttribute("aria-checked")`)}`);
  ok(u1 !== u0, "button: Worst case changes the code");
  await clickText("[data-docs-worst]");
  await sleep(400);
  await clickText('[data-prop="size"] [data-slot=segmented-control-option]', "sm");
  await sleep(400);
  /* size sm is 28px tall (the markup carries no size attribute in its final shape) */
  const h = await page.eval(`document.querySelector("[data-docs-mount] [data-slot=button]")?.getBoundingClientRect().height`);
  ok(Math.round(h) === 28, "button: prop size=sm reaches the stage", h);
  /* the tree's gliding highlight passes behind headings and group titles, never over them */
  const titles = await page.eval(`(() => { const g = document.querySelector("[data-docs-tree]"); const layer = g.querySelector("span[aria-hidden]"); const z = (e) => getComputedStyle(e).position === "static" ? -Infinity : +getComputedStyle(e).zIndex || 0; const heads = [...g.querySelectorAll("[data-docs-group] > [role=presentation], [data-docs-group] [role=group] > [aria-hidden]")]; return { n: heads.length, bad: heads.filter((e) => z(e) <= z(layer)).map((e) => e.textContent) }; })()`);
  ok(titles.n > 5 && titles.bad.length === 0, "tree: headings and group titles sit above the gliding highlight", JSON.stringify(titles));
  ok((await usage()).includes('size="sm"'), "button: prop size=sm reaches the Usage");
  await clickText("[data-docs-reset]");
  await sleep(300);
  ok(!(await usage()).includes('size="sm"'), "button: Reset drops the override");

  // 2b. the file tabs are what `fndn add button` writes: its folder (index, adapter, recipe, logic)
  //     and the lib/ files they import; spinner, which it is built from, is a link, not files
  /* the files the island was given (the code block shows them as tabs, or as a pager and a select
   * when the tabs do not fit) */
  const tabs = [...(await (await fetch(BASE + "/components/button")).text()).matchAll(/\/source\/react\/([^&"]+)/g)].map((m) => m[1]);
  ok(["button/index.ts", "button/button.tsx", "button/button.recipe.ts", "lib/tv.ts"].every((f) => tabs.includes(f)), "button: files are its folder and the lib/ files they import", tabs.join(", "));
  ok(!tabs.some((t) => t.endsWith(".css") || t.startsWith("spinner/")), "button: no CSS and no other component among the files", tabs.join(", "));
  ok(await page.eval(`!!document.querySelector('[data-docs-setup] a[href="/components/spinner"]')`), "button: it is built from spinner, a link");
  ok(/import \{ Button \} from "@\/components\/ui\/button";/.test(u0), "button: Usage imports from the component's folder", u0.split("\n")[0]);
  ok(await page.eval(`!!document.querySelector('[data-docs-setup] a[href="/installation"]')`), "button: the line under the files links to Installation");

  // 2c. Vue and Svelte on the stage (the framework switch in the top bar)
  for (const [path, slot] of [["/components/button", "button"], ["/components/select", "select"]]) {
    for (const [fw, label] of [["vue", "Vue"], ["svelte", "Svelte"]]) {
      await page.goto(BASE + path, 2500);
      const n = page.errors.length, x = exceptions.length;
      await clickText('[aria-label="Framework"] [data-slot=segmented-control-option]', label);
      const found = await waitFor(`!!document.querySelector('[data-docs-mount] [data-docs-fw="${fw}"] [data-slot="${slot}"]')`);
      ok(found, `${path}: ${label} renders the example on the stage`);
      const u = await usage();
      ok(fw === "vue" ? u.includes("<template>") : u.includes("<script lang=\"ts\">"), `${path}: Usage follows ${label}`);
      const errs = [...errorsSince(n), ...exceptions.slice(x)].filter((e) => !isRoLoop(e));
      ok(errs.length === 0, `${path}: ${label}, no console error`, errs.slice(0, 2).join(" | ").slice(0, 300));
    }
    await clickText('[aria-label="Framework"] [data-slot=segmented-control-option]', "React");
    await sleep(500);
  }

  // 2d. the anatomy tab outlines a part on the stage
  await page.goto(BASE + "/components/select", 2500);
  await clickText('[data-docs-inspector] [data-slot=tabs-trigger]', "Anatomy");
  await sleep(300);
  const part = await page.rect('[data-docs-part="trigger"]');
  if (part) await page.hover(part.cx, part.cy);
  await sleep(200);
  const outline = await page.eval(`(() => { const b = document.querySelector("[data-docs-outline] > div"); const t = document.querySelector('[data-docs-mount] [data-slot="select-trigger"]'); if (!b || !t) return null; const r = b.getBoundingClientRect(), s = t.getBoundingClientRect(); return Math.abs(r.x - s.x) < 1 && Math.abs(r.width - s.width) < 1; })()`);
  ok(outline === true, "select: pointing at the trigger part outlines it on the stage", String(outline));

  // 2d'. the example code imports from the component folders, one line per component, in every framework
  const code = await (await fetch(BASE + "/example-code/card.json")).json();
  const lines = Object.entries(code).flatMap(([fw, files]) => Object.values(files).flatMap((c) => c.split("\n").filter((l) => /^\s*import\b.*\bfrom\s+"[@$]/.test(l)).map((l) => [fw, l.trim()])));
  const want = { react: /from "@\/components\/ui\/[a-z-]+";$/, vue: /from "@\/components\/ui\/[a-z-]+";$/, svelte: /from "\$lib\/components\/ui\/[a-z-]+";$/ };
  ok(lines.length > 6 && lines.every(([fw, l]) => want[fw].test(l)), "card: the example code imports from the component folders", JSON.stringify(lines.filter(([fw, l]) => !want[fw].test(l)).slice(0, 3)));
  ok(lines.some(([, l]) => l.startsWith("import { Card, ") && l.includes("CardFooter")), "card: one import line names every part of the card", JSON.stringify(lines.slice(0, 3)));

  // 2e. the search palette: Ctrl K opens it, typing filters, Enter navigates
  await page.goto(BASE + "/installation", 2500);
  ok(await waitFor(`document.querySelectorAll("[data-docs-step]").length === 7 && !!document.querySelector('[data-docs-control="theme"]')`), "installation: seven steps");
  ok(await page.eval(`["init", "add", "check", "agents"].every((id) => document.querySelector('[data-docs-step="' + id + '"]')?.textContent.includes("fndn"))`), "installation: init, add, check and the MCP server use the tool");
  ok(await page.eval(`(() => { const t = document.querySelector("[data-docs-added]")?.textContent ?? ""; return ["button/", "select/", "spinner/", "lib/", "index.ts", "button.recipe.ts", "tv.ts"].every((x) => t.includes(x)); })()`), "installation: what add writes, a folder per component and lib/");
  ok(await page.eval(`(document.querySelector("[data-docs-usage]")?.textContent ?? "").includes('import { Button } from "@/components/ui/button"')`), "installation: the usage example imports from the component's folder");
  ok(await page.eval(`!!document.querySelector("[data-docs-mcp]")?.textContent.includes("mcpServers")`), "installation: the MCP configuration");
  await page.key("k", { ctrl: true });
  await sleep(500);
  ok(await page.eval(`document.activeElement?.matches("[data-slot=search-input]") ?? false`), "palette: Ctrl K opens it with the field focused");
  await page.type("record");
  await sleep(400);
  const rows = await page.eval(`[...document.querySelectorAll("[data-slot=search-item]")].map(e => e.textContent)`);
  ok(rows.length > 0 && rows.every((r) => /record/i.test(r)), "palette: typing filters", rows.join(" | "));
  await page.key("Enter");
  await sleep(2500);
  ok(await page.eval(`location.pathname`) === "/components/records-table", "palette: Enter opens the first match");

  // 2f. foundations: a motion sample plays when pressed
  await page.goto(BASE + "/foundations/motion", 2500);
  const before = await page.eval(`getComputedStyle(document.querySelector('[data-docs-sample="timing slow"] [data-docs-dot]')).translate`);
  await clickText('[data-docs-sample="timing slow"] button');
  await sleep(700);
  const after = await page.eval(`getComputedStyle(document.querySelector('[data-docs-sample="timing slow"] [data-docs-dot]')).translate`);
  ok(before !== after, "motion: a timing sample plays", `${before} → ${after}`);
  await page.goto(BASE + "/guides/design/motion", 2000);
  ok(await page.eval(`document.querySelectorAll("[data-docs-guide] article h3").length > 2`), "guide: docs/design/motion.md renders");

  // 2f'. nothing scrolls sideways on a component page (a list that keeps ring room with a negative
  //      margin once made the inspector scroll), in light and dark; code listings are meant to
  const sideways = () => page.eval(`[...document.querySelectorAll("*")].filter((e) => { const o = getComputedStyle(e).overflowX; return (o === "auto" || o === "scroll") && e.scrollWidth > e.clientWidth + 1 && !e.closest("[data-slot=code-block]") && e.checkVisibility(); }).map((e) => e.tagName.toLowerCase() + (e.dataset.slot ? "[" + e.dataset.slot + "]" : "") + (e.hasAttribute("data-docs-inspector") ? "[inspector]" : "") + " " + e.scrollWidth + ">" + e.clientWidth)`);
  for (const theme of ["light", "dark"]) {
    await page.eval(`localStorage.setItem("fndn-theme", "${theme}"); true`);
    await page.goto(BASE + "/components/select", 2500);
    for (const tab of ["Props", "Anatomy", "A11y", "Motion", "Tokens"]) {
      await clickText("[data-docs-inspector] [data-slot=tabs-trigger]", tab);
      await sleep(250);
      const hits = await sideways();
      ok(hits.length === 0, `select, ${theme}, ${tab}: nothing scrolls sideways`, hits.slice(0, 3).join(" | "));
    }
  }
  await page.eval(`localStorage.removeItem("fndn-theme"); true`);

  // 2f2. a two-way prop is driven live in the three frameworks: the carousel's page set in the
  //      panel travels on the mounted carousel (intermediate scroll positions, the same root node,
  //      no remount), and Next on the stage comes back to the panel's field
  for (const fw of ["react", "vue", "svelte"]) {
    await page.eval(`localStorage.setItem("fndn-docs-fw", "${fw}"); true`);
    await page.goto(BASE + "/components/carousel", 2500);
    const M = `[data-docs-mount] [data-docs-fw="${fw}"]`;
    if (!(await waitFor(`!!document.querySelector('${M} [data-slot=carousel-item-group]')`))) { ok(false, `carousel, ${fw}: the stage mounts`); continue; }
    await sleep(400);
    await page.eval(`(() => { window.__root = document.querySelector('${M} [data-slot=carousel]'); const g = document.querySelector('${M} [data-slot=carousel-item-group]'); window.__pos = []; const t0 = performance.now(); const tick = () => { window.__pos.push(Math.round(g.scrollLeft)); if (performance.now() - t0 < 1500) requestAnimationFrame(tick); }; requestAnimationFrame(tick); return true; })()`);
    await clickText('[data-prop="page"] input');
    await page.key("a", { ctrl: true });
    await page.type("2");
    await sleep(1400);
    const pos = await page.eval("window.__pos");
    const mid = new Set(pos.filter((x) => x !== pos[0] && x !== pos.at(-1))).size;
    const same = await page.eval(`window.__root === document.querySelector('${M} [data-slot=carousel]') && window.__root.isConnected`);
    ok(pos.at(-1) > pos[0] && mid >= 3 && same, `carousel, ${fw}: page set in the panel travels on the mounted carousel (no remount)`, `${mid} intermediate positions, ${pos[0]} → ${pos.at(-1)}, same root ${same}`);
    await clickText(`${M} [data-slot=carousel-control] button[aria-label="Next slide"]`);
    await sleep(700);
    const field = await page.eval(`document.querySelector('[data-prop="page"] input')?.value`);
    ok(field === "3", `carousel, ${fw}: Next on the stage comes back to the panel's page`, field);
  }
  await page.eval(`localStorage.removeItem("fndn-docs-fw"); true`);

  // 2g. the stored framework is in force from the first paint: overview → Select → Button → back
  //     (client router), then a reload. Every animation frame: no visible React render on the stage,
  //     no other framework checked in the switch; the layout shift stays zero.
  for (const [fw, label] of [["vue", "Vue"], ["svelte", "Svelte"]]) {
    await page.eval(`localStorage.setItem("fndn-docs-fw", "${fw}"); true`);
    const read = () => page.eval(`JSON.stringify(window.__fwSamples ?? null)`).then(JSON.parse);
    const runs = [];
    await page.goto(BASE + "/", 2000);
    await clickText(`a[data-row][href="/components/select"]`);
    await waitFor(`!!document.querySelector('[data-docs-mount] [data-docs-fw="${fw}"] [data-slot="select"]')`);
    await clickText(`a[data-row][href="/components/button"]`);
    await waitFor(`location.pathname === "/components/button" && !!document.querySelector('[data-docs-mount] [data-docs-fw="${fw}"] [data-slot="button"]')`);
    await page.eval("history.back()");
    await waitFor(`location.pathname === "/components/select" && !!document.querySelector('[data-docs-mount] [data-docs-fw="${fw}"]')`);
    await sleep(600);
    runs.push(await read());
    await page.goto(BASE + "/components/select", 2500);
    runs.push(await read());
    const bad = runs.filter(Boolean).reduce((a, r) => ({ frames: a.frames + r.frames, react: a.react + r.react, label: a.label + r.label, cls: a.cls + r.cls }), { frames: 0, react: 0, label: 0, cls: 0 });
    ok(bad.frames > 30 && bad.react === 0, `${label} kept across pages: no frame shows the React render (${bad.frames} frames, shift ${bad.cls.toFixed(4)})`, JSON.stringify(bad));
    ok(bad.label === 0, `${label} kept across pages: the switch never shows another framework`, JSON.stringify(bad));
    ok(bad.cls < 0.001, `${label} kept across pages: no layout shift`, JSON.stringify(bad));
  }
  await page.eval(`localStorage.removeItem("fndn-docs-fw"); true`);

  // 2h. the Examples: every example file of these components renders in the three frameworks, with
  //     no console error, and the same DOM in each (ids, classes order, Phosphor's svg insides and
  //     the frameworks' own attributes aside, as scripts/qa/parity.mjs compares)
  const OUTLINE = `(() => {
    const SKIP = /^(id|style|for|name|form|value|data-v-.*|data-svelte.*|data-reactroot|data-ownedby|data-controls|data-uid|dir|tabindex|autocomplete)$/;
    const REF = /^(aria-controls|aria-labelledby|aria-describedby|aria-activedescendant|aria-owns|data-activedescendant)$/;
    const out = {};
    for (const ex of document.querySelectorAll("[data-docs-example]")) {
      const host = ex.querySelector("[data-docs-example-mount] [data-docs-fw]");
      if (!host) { out[ex.dataset.docsExample] = null; continue; }
      const lines = [];
      const walk = (n, d) => {
        if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, " ").trim(); if (t) lines.push(d + JSON.stringify(t)); return; }
        if (n.nodeType !== 1) return;
        if (n.getAttribute("data-slot") === "icon" || (n.tagName === "svg" && n.getAttribute("viewBox") === "0 0 256 256")) { lines.push(d + "<icon>"); return; }
        const cls = [...n.classList].sort().join(".");
        const at = [...n.attributes].filter((a) => !SKIP.test(a.name) && a.name !== "class").map((a) => REF.test(a.name) ? a.name + "=#" : a.value === "" || a.value === "true" ? a.name : a.name + "=" + a.value).sort();
        lines.push(d + n.tagName.toLowerCase() + (cls ? "." + cls : "") + (at.length ? " [" + at.join(" ") + "]" : ""));
        for (const c of n.childNodes) walk(c, d + 1);
      };
      for (const c of host.childNodes) walk(c, 0);
      out[ex.dataset.docsExample] = lines.join("\\n");
    }
    return JSON.stringify(out);
  })()`;
  for (const name of ["button", "card", "select", "streaming-text"]) {
    const dom = {};
    for (const fw of ["react", "vue", "svelte"]) {
      await page.eval(`localStorage.setItem("fndn-docs-fw", "${fw}"); true`);
      const n = page.errors.length, x = exceptions.length;
      await page.goto(BASE + `/components/${name}`, 2500);
      const total = await page.eval(`document.querySelectorAll("[data-docs-example]").length`);
      /* every example comes near the viewport once, so each mounts */
      const h = await page.eval("document.documentElement.scrollHeight");
      for (let y = 0; y < h; y += 500) { await page.eval(`window.scrollTo(0, ${y})`); await sleep(150); }
      const all = await waitFor(`[...document.querySelectorAll("[data-docs-example]")].every((e) => e.querySelector("[data-docs-example-mount] [data-docs-fw]")?.childElementCount > 0) && [...document.querySelectorAll("[data-docs-example-code]")].every((c) => c.getAttribute("aria-busy") !== "true")`, 15000);
      /* an example that plays steps is compared once it has finished: the outline holds still */
      let prev = "", now = await page.eval(OUTLINE);
      for (const end = Date.now() + 25000; now !== prev && Date.now() < end; ) { prev = now; await sleep(1500); now = await page.eval(OUTLINE); }
      dom[fw] = JSON.parse(now);
      const alerts = await page.eval(`[...document.querySelectorAll("[data-docs-example] [role=alert]")].map((e) => e.textContent).join(" | ")`);
      ok(total > 0 && all && !alerts, `${name}, ${fw}: all ${total} example files render with their source`, alerts || "some did not mount");
      if (fw === "react") {
        /* the source is one click away: in the page but closed, and the toggle opens it */
        const codes = await page.eval(`[...document.querySelectorAll("[data-docs-example]")].map((e) => { const c = e.querySelector("[data-docs-example-code]"); return c ? (c.checkVisibility() ? "open" : "closed") : "none"; })`);
        ok(codes.length === total && codes.every((c) => c === "closed"), `${name}: every example's source is in the page, closed`, codes.join(","));
        await clickText("[data-docs-example-toggle] [data-slot=collapsible-trigger]");
        await sleep(600);
        ok(await page.eval(`document.querySelector("[data-docs-example-code]").checkVisibility()`), `${name}: Code opens the first example's source`);
      }
      const errs = [...errorsSince(n), ...exceptions.slice(x)].filter((e) => !isRoLoop(e));
      ok(errs.length === 0, `${name}, ${fw}: examples, no console error`, errs.slice(0, 2).join(" | ").slice(0, 300));
    }
    const differ = Object.keys(dom.react).filter((f) => dom.vue[f] !== dom.react[f] || dom.svelte[f] !== dom.react[f]);
    if (differ.length) {
      const f = differ[0];
      const [a, b] = [dom.react[f] ?? "", (dom.vue[f] !== dom.react[f] ? dom.vue[f] : dom.svelte[f]) ?? ""].map((t) => t.split("\n"));
      const i = a.findIndex((l, k) => l !== b[k]);
      console.log(`     ${f}: react «${a[i]}» vs ${dom.vue[f] !== dom.react[f] ? "vue" : "svelte"} «${b[i]}»`);
    }
    ok(differ.length === 0, `${name}: every example renders the same DOM in React, Vue and Svelte`, differ.join(", "));
  }
  await page.eval(`localStorage.removeItem("fndn-docs-fw"); true`);

  // 3. theme toggle, kept across navigation
  await clickText('[data-docs-control="theme"] [data-slot=segmented-control-option]', "Dark");
  await sleep(200);
  ok(await page.eval(`document.documentElement.dataset.theme === "dark" && document.documentElement.classList.contains("dark")`), "theme: Dark applies to <html>");
  await page.goto(BASE + "/components/select", 2000);
  ok(await page.eval(`document.documentElement.dataset.theme === "dark"`), "theme: kept after navigation");
  await clickText('[data-docs-control="theme"] [data-slot=segmented-control-option]', "Light");
  await sleep(200);
  ok(await page.eval(`document.documentElement.dataset.theme === "light"`), "theme: Light applies to <html>");

  // 4. view options: direction, speed, reduced motion
  await clickText('button[aria-label="View options"]');
  await sleep(500);
  ok(await page.eval(`!!document.querySelector("[data-docs-view]")?.checkVisibility()`), "view options: the popover opens");
  await clickText('[data-docs-control="dir"] [data-slot=segmented-control-option]', "RTL");
  await sleep(200);
  ok(await page.eval(`document.documentElement.dir === "rtl"`), "view options: RTL applies to <html>");
  await clickText('[data-docs-control="speed"] [data-slot=segmented-control-option]', "0.5×");
  await sleep(200);
  ok(await page.eval(`document.documentElement.style.getPropertyValue("--fndn-duration-fast") !== ""`), "view options: speed 0.5× scales the duration tokens");
  await clickText('[data-docs-control="reduced"]');
  await sleep(200);
  ok(await page.eval(`document.querySelector('[data-docs-control="reduced"]').getAttribute("aria-checked") === "true"`), "view options: reduced motion switches on");
  await page.goto(BASE + "/", 2000);
  ok(await page.eval(`document.documentElement.dir === "rtl"`), "view options: direction kept after navigation");
  await clickText('button[aria-label="View options"]');
  await sleep(500);
  await clickText('[data-docs-control="dir"] [data-slot=segmented-control-option]', "LTR");
  await clickText('[data-docs-control="speed"] [data-slot=segmented-control-option]', "1×");
  await clickText('[data-docs-control="reduced"]');
  await sleep(200);
  ok(await page.eval(`document.documentElement.dir === "ltr" && document.documentElement.style.getPropertyValue("--fndn-duration-fast") === ""`), "view options: back to LTR, 1×");

  // 4b. the main column of a component page is capped (880px) at every desktop width
  const widths = [];
  for (const [w, h, d] of [[1280, 720, 1], [1536, 740, 1.25], [1920, 950, 1.25], [2560, 1080, 1], [2752, 1100, 1.25]]) {
    await page.viewport(w, h, d, false);
    await page.goto(BASE + "/components/select", 2000);
    widths.push([w, await page.eval(`Math.round(document.querySelector("[data-docs-column]").getBoundingClientRect().width)`)]);
  }
  ok(widths.every(([, c]) => c <= 900), `the main column of a component page is never wider than 900px (${widths.map(([w, c]) => `${w}: ${c}`).join(", ")})`);

  // 5. phones: no horizontal scroll; the menu button opens the tree
  await page.viewport(390, 844, 1.25, true);
  for (const path of [...PAGES, "/foundations/icons", "/foundations/type"]) {
    await page.goto(BASE + path, 2500);
    const [sw, iw] = await page.eval(`[document.documentElement.scrollWidth, innerWidth]`);
    ok(sw <= iw, `390px ${path}: no horizontal scroll`, `${sw} > ${iw}`);
    /* a wide component (a 560px table) keeps to the stage and scrolls inside its own frame */
    if (path === "/components/records-table") {
      const fit = await page.eval(`(() => { const m = document.querySelector("[data-docs-mount]"), c = m?.querySelector("[data-docs-fw] > *"); if (!c) return null; const a = m.getBoundingClientRect(), b = c.getBoundingClientRect(); return [Math.round(b.left - a.left), Math.round(a.right - b.right), m.scrollWidth - m.clientWidth]; })()`);
      ok(fit && fit[0] >= 0 && fit[1] >= 0 && fit[2] <= 1, "390px records-table: the playground's table stays inside the stage", JSON.stringify(fit));
    }
  }
  ok(!(await page.eval(`document.getElementById("docs-tree").checkVisibility()`)), "390px: the tree is closed");
  await clickText('button[aria-controls="docs-tree"]');
  await sleep(300);
  ok(await page.eval(`document.getElementById("docs-tree").checkVisibility()`), "390px: the menu button opens the tree");
} catch (e) {
  failed++;
  console.log(`FAIL ${e.message}`);
} finally {
  await page.close();
}

// 6. budget, on a production build of its own (.cache/docs-budget, never apps/docs/dist, which
//    a preview on :4323 may be serving: rebuilding it under a running preview breaks the pages
//    it serves), served by scripts/qa/static-server.mjs on port 4322 and stopped after.
//    A component page's HTML ≤ 120 KB; overview → select → button → records-table, each
//    navigation ≤ 300 ms from the click to the stage showing the component and ≤ 400 KB transferred
//    (the link is pointed at first, as a reader does: the router prefetches on hover); no layout shift.
if (!process.env.DOCS_NO_BUDGET) {
  const app = fileURLToPath(new URL("../../apps/docs/", import.meta.url));
  const out = fileURLToPath(new URL("../../.cache/docs-budget/", import.meta.url));
  const PROD = "http://localhost:4322";
  let preview, own = true;
  try {
    execSync(`pnpm exec astro build --outDir "${out}"`, { cwd: app, stdio: "ignore", detached: true });
    preview = spawn(process.execPath, [fileURLToPath(new URL("./static-server.mjs", import.meta.url)), out, "4322"], { stdio: "ignore", detached: true });
    for (let i = 0; i < 100; i++) { try { if ((await fetch(PROD + "/")).ok) break; } catch {} await sleep(150); }
    for (const name of ["select", "button", "records-table"]) {
      const kb = Math.round((await (await fetch(`${PROD}/components/${name}/`)).arrayBuffer()).byteLength / 1024);
      ok(kb <= 120, `budget: /components/${name} HTML is ${kb} KB (≤ 120)`);
    }
    const p = await launch({ width: 1536, height: 740, dpr: 1.25, hover: true });
    try {
      await p.goto(PROD + "/", 2500);
      for (const name of ["select", "button", "records-table"]) {
        const href = `/components/${name}`;
        const at = await p.eval(`(() => { const a = document.querySelector('#docs-tree a[href="${href}"]'); a.scrollIntoView({ block: "center" }); const b = a.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
        await p.hover(at.x, at.y);
        await sleep(400);
        await p.eval(`performance.clearResourceTimings(); window.__navT0 = performance.now(); window.__navT = 0; (function tick() { if (location.pathname.replace(/\\/$/, "") === "${href}" && document.querySelector('[data-docs-mount] [data-slot="${name}"]')) window.__navT = performance.now() - window.__navT0; else requestAnimationFrame(tick); })(); true`);
        await p.click(at.x, at.y);
        let ms = 0;
        for (let i = 0; i < 200 && !ms; i++) { await sleep(25); ms = await p.eval("window.__navT"); }
        const kb = await p.eval(`Math.round(performance.getEntriesByType("resource").reduce((n, e) => n + (e.transferSize || 0), 0) / 1024)`);
        ok(ms > 0 && ms <= 300 && kb <= 400, `budget: → ${name} in ${Math.round(ms)} ms, ${kb} KB (≤ 300 ms, ≤ 400 KB)`);
      }
      const cls = await p.eval("window.__fwSamples?.cls ?? 0");
      ok(cls < 0.001, `budget: no layout shift over the three navigations (${cls.toFixed(4)})`);
    } finally { await p.close(); }
  } catch (e) {
    failed++;
    console.log(`FAIL budget: ${e.message}`);
  } finally {
    if (preview) { try { process.kill(-preview.pid, "SIGKILL"); } catch { preview.kill("SIGKILL"); } }
    /* astro preview serves from a process of its own: stop whatever still listens on 4322 */
    if (own) try { for (const pid of execSync("ss -ltnp", { encoding: "utf8" }).split("\n").filter((l) => l.includes(":4322 ")).flatMap((l) => [...l.matchAll(/pid=(\d+)/g)].map((m) => Number(m[1])))) process.kill(pid, "SIGKILL"); } catch {}
  }
}
console.log(failed ? `docs: ${failed} failed` : "docs: all passed");
process.exit(failed ? 1 : 0);
