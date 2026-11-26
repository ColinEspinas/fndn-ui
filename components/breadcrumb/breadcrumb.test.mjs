// Breadcrumb: the landmark and list, links and the current page, separators hidden, hover and hit
// area, keyboard stops, the folded trail and its Menu, worst cases, right-to-left, dark.
//   node components/breadcrumb/breadcrumb.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "breadcrumb";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
/* hover: true makes headless Chromium report a mouse, so the gated hover rules apply */
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);
const away = async () => { await p.hover(1200, 860); await sleep(300); };

const R = "#stage [data-slot=breadcrumb]";
const E = `${R} [data-breadcrumb=ellipsis]`;
const trail = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [...e.querySelectorAll("[data-slot=breadcrumb-list] > li")].map((li)=>{const s=li.dataset.slot;if(s==="breadcrumb-separator")return ["sep",li.getAttribute("aria-hidden"),li.getAttribute("role")];const k=li.firstElementChild;return [k.dataset.slot??k.dataset.breadcrumb??k.tagName,k.textContent.trim(),k.getAttribute("href"),k.getAttribute("aria-current")]})})()`);
const color = (sel) => q(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).color`);
const focusedText = () => q(`(()=>{const a=document.activeElement;return a?.dataset.slot==="breadcrumb-link"?a.textContent.trim():a?.dataset.breadcrumb??a?.tagName})()`);
const link = (i) => `${R} [data-slot=breadcrumb-item]:nth-child(${2 * i + 1}) > *`;

async function run(fw, check) {
  await open(fw, 0);
  const ink = { ink: await token("--fndn-ink", "color"), ink2: await token("--fndn-ink-2", "color"), ink3: await token("--fndn-ink-3", "color") };
  check("a navigation landmark named Breadcrumb around an ordered list", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.tagName,e.getAttribute("aria-label"),e.firstElementChild.tagName]})()`), ["NAV", "Breadcrumb", "OL"]);
  check("links, hidden separators, the page last with aria-current", await trail(), [["breadcrumb-link", "Home", "#home", null], ["sep", "true", "presentation"], ["breadcrumb-link", "Projects", "#projects", null], ["sep", "true", "presentation"], ["breadcrumb-page", "Launch plan", null, "page"]]);
  check("13px on a 20px line; links ink-2, the page ink, the caret 12px ink-3", await q(`(()=>{const l=document.querySelector(${JSON.stringify(R + " [data-slot=breadcrumb-list]")});const s=document.querySelector(${JSON.stringify(R + " [data-slot=breadcrumb-separator] svg")}).getBoundingClientRect();return [getComputedStyle(l).fontSize,l.getBoundingClientRect().height,s.width]})()`).then(async (v) => [...v, await color(link(0)), await color(`${R} [data-slot=breadcrumb-page]`), await color(`${R} [data-slot=breadcrumb-separator]`)]), ["13px", 20, 12, ink.ink2, ink.ink, ink.ink3]);
  check("text baselines: links and page on one line (±0.5px)", await q(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(R + " [data-slot=breadcrumb-item] > *")})].map((e)=>e.getBoundingClientRect().bottom);return Math.max(...b)-Math.min(...b)<=0.5})()`), true);
  let r = await p.rect(link(0));
  await p.hover(r.cx, r.cy); await sleep(250);
  check("hover: a link turns ink (fine pointer), the page does not react", await color(link(0)), ink.ink);
  check("a link's hit area is 6px taller each side than its text (::after)", await q(`(()=>{const a=document.querySelector(${JSON.stringify(link(0))});const s=getComputedStyle(a,"::after");return [s.position,s.top,s.bottom]})()`), ["absolute", "-6px", "-6px"]);
  await away();
  /* keyboard: the links, not the page */
  await p.click(5, 5); await p.key("Tab");
  check("Tab: Home", await focusedText(), "Home");
  await p.key("Tab");
  check("Tab: Projects", await focusedText(), "Projects");
  await p.key("Tab");
  check("Tab: leaves the trail (the page is not a stop)", await q(`!document.querySelector(${JSON.stringify(R)}).contains(document.activeElement)`), true);
  await p.clickSel(link(1)); await sleep(200);
  check("a click follows the link", await q(`location.hash`), "#projects");

  /* folded */
  await open(fw, 1);
  /* the ⋯ is the Menu (its root wraps the trigger) */
  check("maxItems 3: the first, the ⋯ menu, the last two", await trail(), [["breadcrumb-link", "Home", "#home", null], ["sep", "true", "presentation"], ["menu", "", null, null], ["sep", "true", "presentation"], ["breadcrumb-link", "Launch", "#launch", null], ["sep", "true", "presentation"], ["breadcrumb-page", "Email draft", null, "page"]]);
  check("the ⋯ is the ghost 24px square Button, named by its tooltip, and the trail stays 20px tall", await q(`(()=>{const b=document.querySelector(${JSON.stringify(E)});const r=b.getBoundingClientRect();return [b.dataset.slot,r.width,r.height,b.getAttribute("aria-label"),b.getAttribute("aria-haspopup"),document.querySelector(${JSON.stringify(R + " [data-slot=breadcrumb-list]")}).getBoundingClientRect().height]})()`), ["button", 24, 24, "Show hidden pages", "menu", 20]);
  await p.clickSel(E); await sleep(400);
  check("a click opens the Menu of the folded pages, in order", await q(`[...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")].map((n)=>n.textContent.trim())`), ["Workspace", "Projects", "Q3"]);
  await q(`(()=>{const n=[...document.querySelectorAll("[data-slot=menu-content] [data-slot=menu-item]")].find((n)=>n.textContent.trim()==="Projects");n.click()})()`); await sleep(300);
  check("picking one goes to its page", await q(`location.hash`), "#projects");
  await open(fw, 1);
  await p.click(5, 5); await p.key("Tab"); await p.key("Tab");
  check("Tab: Home, then the ⋯ button", await focusedText(), "ellipsis");
  await p.key("Enter"); await sleep(300);
  check("Enter opens its menu with focus inside", await q(`(()=>{const c=document.querySelector("[data-slot=menu-content]");return !!c&&(c===document.activeElement||c.contains(document.activeElement))})()`), true);
  await p.key("Escape"); await sleep(300);
  check("Escape closes it, focus back on ⋯", await focusedText(), "ellipsis");

  await open(fw, 2);
  check("a step without an href is text, not a link (no tab stop)", await q(`(()=>{const s=document.querySelector(${JSON.stringify(link(1))});return [s.tagName,s.tabIndex,s.dataset.slot]})()`), ["SPAN", -1, "breadcrumb-link"]);
  await open(fw, 3);
  check("one item: only the page, no separator", await trail(), [["breadcrumb-page", "Home", null, "page"]]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long and unbreakable names wrap whole in 220px: nothing cut, nothing overflows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const parts=[...e.querySelectorAll("[data-slot=breadcrumb-item] > *")];return [parts.every((x)=>x.scrollWidth<=x.clientWidth+1),e.scrollWidth<=e.clientWidth+1,e.getBoundingClientRect().height>40]})()`), [true, true, true]);
  await open(fw, 1, "&data=worst");
  check("ten items in 320px wrap onto more lines, nothing overflows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return [e.getBoundingClientRect().height>20,e.scrollWidth<=e.clientWidth+1]})()`), [true, true]);
  await open(fw, 3, "&data=worst");
  check("no items: an empty list, no error", await q(`document.querySelectorAll(${JSON.stringify(R + " li")}).length`), 0);
  await open(fw, 2, "&data=worst&dir=rtl");
  check("rtl: the trail runs right to left, the carets point left, names in their own direction", await q(`(()=>{const its=[...document.querySelectorAll(${JSON.stringify(R + " [data-slot=breadcrumb-item]")})].map((e)=>e.getBoundingClientRect().x);const s=getComputedStyle(document.querySelector(${JSON.stringify(R + " [data-slot=breadcrumb-separator] svg")})).transform;return [its[0]>its[1]&&its[1]>its[2],s,getComputedStyle(document.querySelector(${JSON.stringify(link(0))})).unicodeBidi]})()`), [true, "matrix(-1, 0, 0, 1, 0, 0)", "plaintext"]);
  await open(fw, 0, "&theme=dark");
  check("dark: the page in the dark ink, links in the dark ink-2", [await color(`${R} [data-slot=breadcrumb-page]`), await color(link(0))], [await token("--fndn-ink", "color"), await token("--fndn-ink-2", "color")]);
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
