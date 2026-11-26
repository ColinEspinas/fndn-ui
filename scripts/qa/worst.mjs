// Worst-case sweep: render every spec's `worstCase` entries through the docs harness and look for
// the failure signatures that can be measured (the break-ui skill's list): the page scrolling
// sideways, a part poking out of its component, a control that is clipped or off screen, a
// squished icon or avatar, a pill or button that wrapped, clipped text with no way to read it,
// text drawn over other text, raw values (NaN, undefined), wrong plurals, an example width that
// landed on an inner part, text parked on a fractional translate.
//
//   node scripts/qa/worst.mjs                 every component
//   node scripts/qa/worst.mjs search menu     some components
//   node scripts/qa/worst.mjs --json out.json also write the findings as JSON
//   node scripts/qa/worst.mjs --shots <dir>   screenshot every case that has a finding
//   node scripts/qa/worst.mjs --demo          the same checks on the spec's `examples` (demo data)
//
// Conditions per case: wide (1280px), half (640px: the layout of 200% zoom), narrow (a 320px
// phone with 16px gutters), and right-to-left at 1280px, in React. A case marked
// `"frameworks": false` (markup only, no props) cannot be rendered by an adapter: it is skipped and
// named in one summary line, not counted as a finding. Needs the dev server (pnpm docs).
// A finding is a lead, not a verdict: look at the screenshot before changing a component.
// Intended exceptions are listed in ALLOW below, each with its reason. Text clipped by a scrolling
// ancestor (scrolled out of a list, a panel, a tab strip) is not drawn, so it overlaps nothing.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch, sleep, PageGone } from "./cdp.mjs";
import { loadSpecs, targetsOf } from "../lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1]; };
const jsonOut = flag("--json");
const shotDir = flag("--shots");
const demo = args.includes("--demo");
const only = args.filter((a, i) => !a.startsWith("--") && !["--json", "--shots"].includes(args[i - 1]));
const allSpecs = loadSpecs().map((s) => s.spec);
const specs = allSpecs
  .filter((s) => (only.length ? only.includes(s.name) : true))
  /* the sweep renders React; a component whose spec does not list react (`targets`) is skipped */
  .filter((s) => targetsOf(s).includes("react"));

/* Intended exceptions: `${component}|${signature}|${selector fragment}` → reason. A finding whose
 * element path contains the fragment is dropped. Keep this list short and every reason true. */
const ALLOW = [
  ["*", "truncated-unreadable", "[data-slot=select-value]", "a select's trigger shows one line; its list shows every option whole"],
  ["insight-cards", "wrapped", "[data-insight-cards=action]", "a suggested question is a full sentence and wraps by design"],
  ["chip", "wrapped", "[data-slot=chip]", "an inline code token in prose wraps per line fragment rather than truncating a value"],
  ["value-pill", "wrapped", "[data-slot=value-pill]", "a value is never truncated; longer than its container it wraps inside the pill"],
];

const CONDITIONS = [
  { id: "wide", width: 1280, dir: "ltr" },
  { id: "half", width: 640, dir: "ltr" },
  { id: "narrow", width: 320, dir: "ltr", gutter: 16 },
  { id: "rtl", width: 1280, dir: "rtl" },
];

/* runs in the page */
const CHECK = (width) => `(() => {
  const out = [];
  const WIDTH = ${JSON.stringify(width ?? null)};
  const stage = document.querySelector("#stage");
  const vw = document.documentElement.clientWidth;
  const roots = [];
  for (const c of stage.children) { if (c.hasAttribute("data-harness-host")) roots.push(...c.children); else roots.push(c); }
  /* a component that shows itself only in a portal (an open dialog, the command palette) leaves
   * nothing with a box in the stage: its portalled parts (Ark's, children of body) are its roots
   * then, the backdrop aside, so the sweep measures what is on screen instead of nothing */
  const drawn = (r) => { const b = r.getBoundingClientRect(); if (b.width || b.height) return true; for (const c of r.querySelectorAll("*")) { const x = c.getBoundingClientRect(); if (x.width || x.height) return true; } return false; };
  if (roots.length && !roots.some(drawn)) for (const e of document.body.children) if (e !== stage && e.hasAttribute("data-scope") && !/backdrop/.test(e.getAttribute("data-part") || e.getAttribute("data-slot") || "")) roots.push(e);
  /* an element's names: its data-slot, and any data-<block>="<part>" a block puts on a part another
   * component renders; ALLOW and the reports use them */
  const BLOCKS = new Set(${JSON.stringify(allSpecs.map((s) => s.name))});
  const namesOf = (el) => { const out = []; const slot = el.getAttribute("data-slot"); if (slot) out.push("[data-slot=" + slot + "]"); for (const a of el.attributes) if (a.name.startsWith("data-") && BLOCKS.has(a.name.slice(5))) out.push("[" + a.name + "=" + a.value + "]"); return out; };
  const pathOf = (el) => { const parts = []; let n = el; while (n && n !== stage && parts.length < 3) { const c = namesOf(n).join(""); if (c) parts.unshift(c); else if (!parts.length) parts.unshift(n.tagName.toLowerCase()); n = n.parentElement; } return parts.join(" > "); };
  const textOf = (el) => (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 60);
  const add = (sig, el, detail) => out.push({ sig, path: pathOf(el), text: textOf(el), detail });
  const cs = (el) => getComputedStyle(el);
  const hiddenText = (el) => el.closest(".sr-only, [hidden], [inert]") !== null;
  const opacityOf = (el) => { let o = 1; for (let n = el; n && n !== document.documentElement; n = n.parentElement) { const s = cs(n); if (s.visibility === "hidden" || s.display === "none") return 0; o *= parseFloat(s.opacity); if (o < 0.02) return 0; } return o; };
  /* the part of a box that can be seen or scrolled to: cut by ancestors that clip without scrolling */
  const reach = (el, r) => {
    let box = { l: r.left, t: r.top, r: r.right, b: r.bottom }, scrollX = false, scrollY = false;
    /* what is drawn now: cut by every clipping ancestor, scrollers included (a scroller clips what
     * is scrolled out of it; it can be scrolled to, so it is reachable, but it is not drawn) */
    const vis = { l: r.left, t: r.top, r: r.right, b: r.bottom };
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const s = cs(n), b = n.getBoundingClientRect();
      const ox = s.overflowX, oy = s.overflowY;
      if (ox !== "visible") { vis.l = Math.max(vis.l, b.left); vis.r = Math.min(vis.r, b.right); }
      if (oy !== "visible") { vis.t = Math.max(vis.t, b.top); vis.b = Math.min(vis.b, b.bottom); }
      if (ox === "auto" || ox === "scroll") scrollX = true; else if ((ox === "hidden" || ox === "clip") && !scrollX) { box.l = Math.max(box.l, b.left); box.r = Math.min(box.r, b.right); }
      if (oy === "auto" || oy === "scroll") scrollY = true; else if ((oy === "hidden" || oy === "clip") && !scrollY) { box.t = Math.max(box.t, b.top); box.b = Math.min(box.b, b.bottom); }
    }
    return { ...box, vis, scrollX, scrollY, w: Math.max(0, box.r - box.l), h: Math.max(0, box.b - box.t) };
  };

  /* the harness could not render this case (rich children, or a missing example) */
  if (!roots.length) { out.push({ sig: "not-rendered", path: "", text: (stage.textContent || "").trim().slice(0, 80), detail: "nothing was rendered for this case" }); return out; }

  /* the example's width belongs on the outermost element (what a caller sizes), not on a part inside it */
  if (WIDTH) {
    const sized = [...stage.querySelectorAll("[style]")].filter((e) => parseFloat(e.style.width) === WIDTH);
    if (sized.length && !sized.some((e) => roots.includes(e))) add("width-inside", sized[0], "the example's width: " + WIDTH + "px landed on a part inside " + pathOf(roots[0]) + ", not on the outermost element");
    else if (!sized.length) add("width-dropped", roots[0] || stage, "the example's width: " + WIDTH + "px was not applied to any element");
  }

  /* A. the page scrolls sideways */
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) { let widest = roots[0]; for (const r of roots) if (r.getBoundingClientRect().width > widest.getBoundingClientRect().width) widest = r; add("page-overflow", widest || stage, "page " + sw + "px in a " + vw + "px viewport; widest root " + Math.round((widest || stage).getBoundingClientRect().width) + "px"); }

  const all = [];
  for (const root of roots) { all.push([root, root]); const list = root.querySelectorAll("*"); for (let i = 0; i < list.length && all.length < 4000; i++) all.push([list[i], root]); }
  const boxOf = (root) => {
    const r = root.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
    let l = Infinity, t = Infinity, rt = -Infinity, b = -Infinity;
    for (const c of root.querySelectorAll("*")) { const x = c.getBoundingClientRect(); if (!x.width || !x.height) continue; l = Math.min(l, x.left); t = Math.min(t, x.top); rt = Math.max(rt, x.right); b = Math.max(b, x.bottom); }
    return { left: l, top: t, right: rt, bottom: b, width: rt - l, height: b - t };
  };
  const rootBox = new Map(roots.map((r) => [r, boxOf(r)]));
  const INTERACTIVE = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="option"], [role="link"], [tabindex]:not([tabindex="-1"])';
  const SINGLE_LINE = "[data-slot=status-pill], [data-filter-table=status], [data-filter-table=tag], [data-slot=chip], [data-slot=value-pill], [data-slot=entity-chip], [data-slot=count], [data-slot=kbd], [data-slot=button], [data-slot=tabs-trigger]";
  const SQUARE = "[data-slot=icon], [data-slot=avatar], [data-slot=spinner], [data-slot=progress-ring], [data-slot=status-pill-dot], [data-slot=switch-thumb], [data-slot=radio-group-control]";
  const texts = [], spilled = new Set();
  for (const [el, root] of all) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    if (hiddenText(el)) continue;
    const s = cs(el);
    if (s.visibility === "hidden") continue;
    const rr = rootBox.get(root);
    const fixed = s.position === "fixed";
    const seen = reach(el, r);

    /* B. something drawn pokes out of its component: an icon, an image, a filled box. Text is
     * checked below, by its own rectangles. A transparent box that bleeds a few pixels to give a
     * row a wider hover area is not counted. */
    if (el !== root && !fixed && seen.w > 0 && seen.h > 0 && !seen.scrollX && el.matches("[data-slot=icon], img, svg, canvas, video, [data-slot=avatar], [data-slot=status-pill], [data-filter-table=status], [data-filter-table=tag], [data-slot=chip], [data-slot=button], [data-slot=count], [data-slot=kbd], input, textarea")) {
      const over = Math.max(seen.r - rr.right, rr.left - seen.l);
      if (over > 1.5 && opacityOf(el) > 0) add("spill", el, Math.round(over * 10) / 10 + "px past the edge of " + pathOf(root));
    }

    /* C. a control that is partly clipped or off screen */
    if (el.matches(INTERACTIVE) && !el.disabled && opacityOf(el) > 0 && s.pointerEvents !== "none") {
      const cutX = r.width - seen.w, cutY = r.height - seen.h;
      if ((cutX > 1.5 && !seen.scrollX) || (cutY > 1.5 && !seen.scrollY)) add("clipped-control", el, "clipped by " + Math.round(Math.max(cutX, cutY)) + "px (" + Math.round(r.width) + "×" + Math.round(r.height) + " drawn " + Math.round(seen.w) + "×" + Math.round(seen.h) + ")");
      else if (!seen.scrollX && (r.right > vw + 1.5 || r.left < -1.5)) add("offscreen-control", el, "x " + Math.round(r.left) + "…" + Math.round(r.right) + " in a " + vw + "px viewport");
    }

    /* D. a fixed-size box that is no longer square */
    if (el.matches(SQUARE) && Math.abs(r.width - r.height) > 0.75 && s.display !== "inline") add("squished", el, Math.round(r.width * 10) / 10 + "×" + Math.round(r.height * 10) / 10);

    /* E. a single-line part that wrapped */
    if (el.matches(SINGLE_LINE)) {
      const lines = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (!t.textContent.trim() || hiddenText(t.parentElement) || opacityOf(t.parentElement) === 0) continue;
        const range = document.createRange(); range.selectNodeContents(t);
        for (const q of range.getClientRects()) { if (q.width < 0.5) continue; const mid = q.top + q.height / 2; if (!lines.some((m) => Math.abs(m.mid - mid) < Math.max(m.h, q.height) * 0.6)) lines.push({ mid, h: q.height }); }
      }
      if (lines.length > 1) add("wrapped", el, lines.length + " lines, " + Math.round(r.width) + "×" + Math.round(r.height));
    }

    /* F. clipped text with no way to read the rest */
    const clampOn = s.webkitLineClamp && s.webkitLineClamp !== "none";
    const cutX = (s.overflowX === "hidden" || s.overflowX === "clip") && s.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1;
    const cutY = clampOn && el.scrollHeight > el.clientHeight + 1;
    if ((cutX || cutY) && el.textContent.trim()) {
      const readable = el.closest('[title], [aria-describedby], [data-scope="tooltip"], [data-scope="hover-card"]');
      const txt = el.textContent.trim();
      if (/^[\\s$€£¥+\\-−±]?[\\d][\\d.,\\s]*\\s?(%|[kKMB]|ms|s|px)?$/.test(txt)) add("truncated-number", el, "a number is cut: " + el.scrollWidth + "px in " + el.clientWidth + "px");
      else if (!readable) add("truncated-unreadable", el, (cutY ? "clamped" : "ellipsis") + ", no title or tooltip (" + (cutY ? el.scrollHeight + "px in " + el.clientHeight : el.scrollWidth + "px in " + el.clientWidth) + "px)");
    }

    /* text that spills out of a box that neither clips nor scrolls it */
    if (s.overflowX === "visible" && s.display !== "inline" && s.display !== "contents" && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && el.children.length === 0 && el.textContent.trim()) add("text-overflow", el, el.scrollWidth + "px of text in a " + el.clientWidth + "px box");

    /* text at rest on a translate: at 125% or 175% display scaling a parked offset is a fraction
     * of a device pixel and the text renders a pixel off the text beside it (the pager's digits
     * did). Text rests in normal layout; a transform is for while it moves. Popups placed by the
     * engine are rounded to device pixels and are not counted. */
    {
      const own = [...el.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim());
      if (own && opacityOf(el) > 0.05) {
        for (let n = el; n && n !== stage; n = n.parentElement) {
          const tf = cs(n).transform;
          if (tf === "none") continue;
          if (n.matches('[data-part="positioner"]')) break;
          if (n.getAnimations().some((a) => a.playState === "running")) break;
          const m = new DOMMatrixReadOnly(tf);
          const off = [m.e, m.f].filter((v) => Math.abs(v) > 0.01 && Math.abs(v * 1.25 - Math.round(v * 1.25)) > 0.01);
          if (off.length) add("text-on-transform", el, "rests on translate(" + Math.round(m.e * 100) / 100 + "px, " + Math.round(m.f * 100) / 100 + "px)" + (n === el ? "" : " of " + pathOf(n)) + ": a fraction of a device pixel at 125%");
          break;
        }
      }
    }

    /* collect text boxes for G, H, I */
    if (texts.length < 500) for (const t of el.childNodes) {
      if (t.nodeType !== 3 || !t.textContent.trim()) continue;
      if (opacityOf(el) < 0.05) continue;
      const range = document.createRange(); range.selectNodeContents(t);
      for (const q of range.getClientRects()) {
        if (q.width < 1 || q.height < 1) continue;
        const b = reach(el, q);
        let l = Math.max(q.left, b.l), rgt = Math.min(q.right, b.r), top = Math.max(q.top, b.t), bot = Math.min(q.bottom, b.b);
        /* the element's own clip: text cut by its box (ellipsis, clamp) is not drawn past it */
        if (s.overflowX !== "visible") { l = Math.max(l, r.left); rgt = Math.min(rgt, r.right); }
        if (s.overflowY !== "visible") { top = Math.max(top, r.top); bot = Math.min(bot, r.bottom); }
        if (rgt - l > 1 && bot - top > 1) {
          /* for overlaps, only what is drawn: an element clipped by a scrolling ancestor is not over anything */
          const v = { l: Math.max(l, b.vis.l), r: Math.min(rgt, b.vis.r), t: Math.max(top, b.vis.t), b: Math.min(bot, b.vis.b) };
          texts.push({ el, l, r: rgt, t: top, b: bot, v, s: t.textContent.trim() });
          const over = Math.max(rgt - rr.right, rr.left - l);
          if (over > 1.5 && !fixed && !b.scrollX && !spilled.has(el)) { spilled.add(el); add("spill", el, "text drawn " + Math.round(over * 10) / 10 + "px past the edge of " + pathOf(root)); }
        }
      }
    }
  }

  /* G. raw values */
  const seenRaw = new Set();
  for (const x of texts) { if (x.el.closest("pre, code, [data-slot=code-block], [data-slot=chip], [data-slot=diff-table]")) continue; const m = x.s.match(/(^|[^\\w.])(NaN|undefined|\\[object Object\\]|Invalid Date)($|[^\\w.])/); if (m && !seenRaw.has(x.el)) { seenRaw.add(x.el); add("raw-value", x.el, JSON.stringify(m[2])); } }
  /* I. plurals */
  const seenPl = new Set();
  for (const x of texts) { const m = x.s.match(/(^|[^\\d.,:])(1 (members|items|files|rows|results|sources|tasks|steps|changes|edits|records|columns|options|matches|errors|warnings|lines|seconds|minutes|hours|days|questions|replies|comments|attachments|tools|agents)|0 (member|item|file|row|result|source|task|step|change|edit|record|column|option|match|error|warning|line))\\b/i); if (m && !seenPl.has(x.el)) { seenPl.add(x.el); add("plural", x.el, JSON.stringify(m[2])); } }
  /* H. text drawn over other text */
  const seenOv = new Set();
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j];
    if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const w = Math.min(a.v.r, b.v.r) - Math.max(a.v.l, b.v.l), h = Math.min(a.v.b, b.v.b) - Math.max(a.v.t, b.v.t);
    if (w > 3 && h > 4) { const key = pathOf(a.el) + "|" + pathOf(b.el); if (seenOv.has(key)) continue; seenOv.add(key); add("overlap", a.el, JSON.stringify(a.s.slice(0, 30)) + " over " + JSON.stringify(b.s.slice(0, 30)) + " in " + pathOf(b.el) + " by " + Math.round(w) + "×" + Math.round(h) + "px"); }
  }
  return out;
})()`;

const ready = async (page) => {
  for (let i = 0; i < 60; i++) {
    /* a page that no longer answers ends the sweep, with its address: nothing after it can run */
    if (await page.eval(`document.documentElement.dataset.harnessReady !== undefined && document.querySelector("vite-error-overlay") === null`).catch((error) => { if (error instanceof PageGone) throw error; return false; })) return true;
    await sleep(100);
  }
  return false;
};

const page = await launch({ width: 1280, height: 900 });
const findings = [];
let cases = 0, missing = [];
const markupOnly = new Map(); // component → cases skipped because they are markup only
try {
  for (const spec of specs) {
    const list = (demo ? spec.examples : spec.worstCase) ?? [];
    if (!list.length) { if (!demo) missing.push(spec.name); continue; }
    for (let i = 0; i < list.length; i++) {
      if (list[i].frameworks === false) { markupOnly.set(spec.name, (markupOnly.get(spec.name) ?? 0) + 1); continue; }
      cases++;
      const byKey = new Map();
      for (const dir of ["ltr", "rtl"]) {
        const conds = CONDITIONS.filter((c) => c.dir === dir);
        await page.viewport(conds[0].width, 900);
        await page.goto(`${BASE}/harness.html?c=${spec.name}&fw=react&ex=${i}${demo ? "" : "&data=worst"}${dir === "rtl" ? "&dir=rtl" : ""}`, 150);
        if (!(await ready(page))) { findings.push({ component: spec.name, case: list[i].name, conditions: [dir], sig: "did-not-render", path: "", text: "", detail: "harness never became ready" }); continue; }
        /* a case the harness cannot render says so in the stage ("No react example…") */
        const notRendered = await page.eval(`(() => { const s = document.querySelector("#stage"); return s && !s.firstElementChild ? s.textContent.trim() : null; })()`);
        if (notRendered) { findings.push({ component: spec.name, case: list[i].name, conditions: [dir], sig: "did-not-render", path: "", text: "", detail: notRendered }); continue; }
        for (const cond of conds) {
          await page.viewport(cond.width, 900);
          /* The harness centres a shrink-to-fit stage, so nothing in it is ever short of room. Here
           * the stage is a real container: as wide as the viewport minus its gutters. Below the wide
           * condition an example's own width yields to it too (a caller's width, not the component's). */
          await page.eval(`(() => {
            let s = document.querySelector("#worst-stage"); if (!s) { s = document.createElement("style"); s.id = "worst-stage"; document.head.append(s); }
            s.textContent = "body{grid-template-columns:minmax(0,1fr) !important} #stage{box-sizing:border-box;width:100%;min-width:0${cond.gutter ? `;padding:${cond.gutter}px !important` : ""}}";
            const width = ${JSON.stringify(list[i].width ?? null)};
            if (width) for (const e of document.querySelectorAll("#stage [style]")) if (parseFloat(e.style.width) === width) e.style.maxWidth = ${JSON.stringify(cond.width < 1280 ? "100%" : "")};
          })()`);
          await sleep(180);
          let found = await page.eval(CHECK(list[i].width));
          /* an empty stage mid-run is the dev server reloading the page (another file changed), not
           * the component: wait for the harness to be ready again, restore this condition, check again */
          if (found.some((f) => f.sig === "not-rendered")) {
            await sleep(600);
            if (await ready(page)) {
              await page.eval(`(() => { let s = document.querySelector("#worst-stage"); if (!s) { s = document.createElement("style"); s.id = "worst-stage"; document.head.append(s); } s.textContent = "body{grid-template-columns:minmax(0,1fr) !important} #stage{box-sizing:border-box;width:100%;min-width:0${cond.gutter ? `;padding:${cond.gutter}px !important` : ""}}"; })()`);
              await sleep(300);
              found = await page.eval(CHECK(list[i].width));
            }
          }
          let hit = false;
          for (const f of found) {
            if (ALLOW.some(([c, sig, frag]) => (c === "*" || c === spec.name) && sig === f.sig && f.path.includes(frag))) continue;
            hit = true;
            const key = `${f.sig}|${f.path}|${f.text}`;
            const prev = byKey.get(key);
            if (prev) prev.conditions.push(cond.id); else byKey.set(key, { component: spec.name, case: list[i].name, index: i, conditions: [cond.id], ...f });
          }
          if (hit && shotDir) { fs.mkdirSync(shotDir, { recursive: true }); await page.shot(path.join(shotDir, `${spec.name}-${i}-${cond.id}.png`)); }
        }
      }
      findings.push(...byKey.values());
    }
  }
} finally {
  await page.close();
}

const bySig = {};
for (const f of findings) bySig[f.sig] = (bySig[f.sig] ?? 0) + 1;
let last = "";
for (const f of findings) {
  const head = `${f.component} / ${f.case}`;
  if (head !== last) { console.log(`\n✗ ${head}`); last = head; }
  console.log(`    ${f.sig} [${f.conditions.join(", ")}] ${f.path}${f.text ? ` “${f.text}”` : ""}: ${f.detail}`);
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(findings, null, 2));
if (missing.length) console.log(`\nno worstCase in the spec: ${missing.join(", ")}`);
if (markupOnly.size) console.log(`\nskipped, markup only ("frameworks": false): ${[...markupOnly].map(([n, k]) => `${n} (${k})`).join(", ")}`);
console.log(`\n${demo ? "demo-data" : "worst-case"} sweep: ${cases} cases × ${CONDITIONS.length} conditions · ${findings.length} findings${findings.length ? " — " + Object.entries(bySig).map(([k, v]) => `${k} ${v}`).join(", ") : ""}`);
process.exit(findings.length || missing.length ? 1 : 0);
