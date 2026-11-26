// Tree view: rows compared with the sidebar nav's, indentation and guides, the collapsible caret and
// reveal, pointer (click opens and selects, the gliding hover) and keyboard (arrows, Home, End,
// ArrowRight / ArrowLeft open, close and move, typeahead, instant toggles), selection, disabled,
// sizes (xs 24 · sm 28 · md 32 · lg 36: heights, text, indent, alignment; the look unchanged),
// worst cases, right-to-left, dark.
//   node components/tree-view/tree-view.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "tree-view";
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

const R = "#stage [data-slot=tree-view]";
const ROWS = `${R} :is([data-slot=tree-view-item],[data-slot=tree-view-branch-control])`;
const row = (value) => `${R} [data-value="${value}"]:is([data-slot=tree-view-item],[data-slot=tree-view-branch-control])`;
const branch = (value) => `${R} [data-slot=tree-view-branch][data-value="${value}"]`;
/* the rows that are laid out, by value */
const visible = () => q(`[...document.querySelectorAll(${JSON.stringify(ROWS)})].filter((e)=>e.getClientRects().length).map((e)=>e.dataset.value)`);
const focused = () => q(`document.activeElement?.dataset?.value ?? null`);
const ang = (sel) => q(`(()=>{const m=getComputedStyle(document.querySelector(${JSON.stringify(sel)})).transform;if(!m||m==="none")return 0;const [a,b]=m.slice(7,-1).split(",").map(Number);return Math.round(Math.atan2(b,a)*180/Math.PI)})()`);
const x = (sel) => q(`Math.round(document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().x*100)/100`);

async function run(fw, check) {
  await open(fw, 0);
  check("files: a tree labelled by its label, treeitems with levels; src open at mount, nothing animating", await q(`(()=>{const t=document.querySelector("${R} [data-slot=tree-view-tree]");const l=document.querySelector("${R} [data-slot=tree-view-label]");return [t.getAttribute("role"),t.getAttribute("aria-labelledby")===l.id,document.querySelector(${JSON.stringify(branch("src"))}).getAttribute("aria-expanded"),document.querySelector(${JSON.stringify(row("src/app.tsx"))}).getAttribute("aria-level"),document.getAnimations().length]})()`), ["tree", true, "true", "2", 0]);
  check("visible rows at mount (components closed)", await visible(), ["src", "src/app.tsx", "src/components", "src/main.tsx", "public", "package.json", "readme.md"]);
  /* the model: the sidebar nav's row (14px/500 ink-2, 32px, its fill at the control radius) */
  const mine = await q(`(()=>{const e=document.querySelector(${JSON.stringify(row("package.json"))});const s=getComputedStyle(e);return [s.fontSize,s.fontWeight,s.color,getComputedStyle(e,"::before").borderRadius,Math.round(parseFloat(s.height))]})()`);
  await open(fw, 0, "", "sidebar-nav");
  const model = await q(`(()=>{const e=document.querySelector("#stage [data-slot=sidebar-nav-item]");const s=getComputedStyle(e);return [s.fontSize,s.fontWeight,s.color,getComputedStyle(e,"::before").borderRadius,Math.round(parseFloat(s.height))]})()`);
  check("a row is the sidebar nav's row (14px/500 ink-2, control radius, 32px)", mine, model);
  await open(fw, 0);
  /* indentation: a leaf's name lines up with a sibling branch's; a child's caret sits under its parent's name */
  check("a leaf's name lines up with a sibling branch's name", await x(`${row("package.json")} [data-slot=tree-view-text]`), await x(`${row("public")} [data-slot=tree-view-text]`));
  check("a child's caret sits under its parent's name (26px a level)", await x(`${row("src/components")} [data-slot=tree-view-caret]`), await x(`${row("src")} [data-slot=tree-view-text]`));
  check("caret and name share one line: caret centred on the name's first line (±0.5px)", await q(`(()=>{const c=document.querySelector(${JSON.stringify(row("src") + " [data-slot=tree-view-caret]")}).getBoundingClientRect();const r=document.createRange();r.selectNodeContents(document.querySelector(${JSON.stringify(row("src") + " [data-slot=tree-view-text]")}));const t=r.getClientRects()[0];return Math.abs((c.y+c.height/2)-(t.y+t.height/2))<=0.5})()`), true);
  check("guide: one device pixel of line-strong (a border, so every level has the same weight at any scaling), under the parent's caret centre (±0.5px), from the top of the children to half a row padding short of their end", await q(`(()=>{const g=document.querySelector(${JSON.stringify(branch("src") + " [data-slot=tree-view-guide]")}).getBoundingClientRect();const c=document.querySelector(${JSON.stringify(row("src") + " [data-slot=tree-view-caret]")}).getBoundingClientRect();const b=document.querySelector(${JSON.stringify(branch("src") + " [data-slot=tree-view-body]")}).getBoundingClientRect();return [Math.round(g.width*devicePixelRatio),Math.abs((g.x+g.width/2)-(c.x+c.width/2))<=0.5,Math.abs(g.y-b.y)<0.5&&Math.abs(b.bottom-g.bottom-3)<0.5,getComputedStyle(document.querySelector(${JSON.stringify(branch("src") + " [data-slot=tree-view-guide]")})).borderInlineStartColor]})()`), [1, true, true, await token("--fndn-line-strong")]);
  /* the label starts where the top level's carets are drawn: the caret glyph's box */
  check("the label starts on the carets' column (±0.5px)", await q(`(()=>{const l=document.querySelector("${R} [data-slot=tree-view-label]");const g=document.querySelector(${JSON.stringify(row("src") + " [data-slot=tree-view-caret] svg")}).getBoundingClientRect();const s=getComputedStyle(l);const start=getComputedStyle(l).direction==="rtl"?l.getBoundingClientRect().right-parseFloat(s.paddingInlineStart):l.getBoundingClientRect().x+parseFloat(s.paddingInlineStart);return Math.abs(start-g.x)<=0.5})()`), true);
  check("the label is information: ink-2, quieter than the rows by size (12px)", await q(`(()=>{const s=getComputedStyle(document.querySelector("${R} [data-slot=tree-view-label]"));return [s.color,s.fontSize]})()`), [await token("--fndn-ink-2", "color"), "12px"]);
  check("caret: open points down (90), closed points right (0)", [await ang(`${row("src")} [data-slot=tree-view-caret]`), await ang(`${row("public")} [data-slot=tree-view-caret]`)], [90, 0]);

  /* pointer */
  await p.clickSel(row("src/components")); await sleep(450);
  check("click a closed branch: it opens (its children laid out), its caret turns, it is selected", [await q(`document.querySelector(${JSON.stringify(branch("src/components"))}).getAttribute("aria-expanded")`), (await visible()).includes("src/components/card.tsx"), await ang(`${row("src/components")} [data-slot=tree-view-caret]`), await q(`document.querySelector(${JSON.stringify(row("src/components"))}).hasAttribute("data-selected")`)], ["true", true, 90, true]);
  check("a pointer open reveals (the collapsible's transition)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(branch("src/components") + " > [data-slot=tree-view-content]")})).transitionDuration.split(", ").some((d)=>d!=="0s")`), true);
  await p.clickSel(row("package.json")); await sleep(250);
  const hover2 = await token("--fndn-hover-2"), ink = await token("--fndn-ink", "color");
  check("click a leaf: selected (aria-selected), filled hover-2 in ink; the branch is no longer selected", await q(`(()=>{const e=document.querySelector(${JSON.stringify(row("package.json"))});const s=getComputedStyle(e);return [e.getAttribute("aria-selected"),getComputedStyle(e,"::before").backgroundColor,s.color,document.querySelector(${JSON.stringify(row("src/components"))}).hasAttribute("data-selected")]})()`), ["true", hover2, ink, false]);
  await p.clickSel(row("src/components")); await sleep(450);
  check("click an open branch: it closes, its rows leave the layout", (await visible()).includes("src/components/card.tsx"), false);
  const rr = await p.rect(row("readme.md"));
  await p.hover(rr.cx, rr.cy); await sleep(350);
  check("hover: the gliding highlight lands on the row (fine pointer), hover colour", await q(`(()=>{const h=document.querySelector("${R} [data-slot=tree-view-highlight]");const a=h.getBoundingClientRect(),b=document.querySelector(${JSON.stringify(row("readme.md"))}).getBoundingClientRect();return [h.hasAttribute("data-visible"),Math.abs(a.y-b.y)<1&&Math.abs(a.height-b.height)<1,getComputedStyle(h).backgroundColor]})()`), [true, true, await token("--fndn-hover")]);
  check("a row invites the click and acts at once on touch (pointer cursor, touch-action manipulation)", await q(`(()=>{const s=getComputedStyle(document.querySelector(${JSON.stringify(row("readme.md"))}));return [s.cursor,s.touchAction]})()`), ["pointer", "manipulation"]);
  await away();
  check("the pointer leaves: the highlight hides", await q(`document.querySelector("${R} [data-slot=tree-view-highlight]").hasAttribute("data-visible")`), false);

  /* keyboard */
  await open(fw, 0);
  await p.click(5, 5); await p.key("Tab");
  check("Tab reaches the tree once, on the first row", await focused(), "src");
  await p.key("ArrowDown"); check("ArrowDown: the next visible row (a child)", await focused(), "src/app.tsx");
  await p.key("End"); check("End: the last visible row", await focused(), "readme.md");
  await p.key("Home"); check("Home: the first row", await focused(), "src");
  await p.key("ArrowLeft"); await sleep(40);
  check("ArrowLeft on an open branch closes it at once (rows gone 40ms in, caret already right)", [(await visible()).includes("src/app.tsx"), await ang(`${row("src")} [data-slot=tree-view-caret]`)], [false, 0]);
  await p.key("ArrowRight"); await sleep(40);
  check("ArrowRight opens it at once (caret already down)", [(await visible()).includes("src/app.tsx"), await ang(`${row("src")} [data-slot=tree-view-caret]`), await q(`getComputedStyle(document.querySelector(${JSON.stringify(branch("src") + " > [data-slot=tree-view-content]")})).opacity`)], [true, 90, "1"]);
  await p.key("ArrowRight"); check("ArrowRight on an open branch: its first child", await focused(), "src/app.tsx");
  await p.key("ArrowLeft"); check("ArrowLeft on a child: its parent", await focused(), "src");
  await p.key("p"); check("typeahead: p moves to the next row starting with p", await focused(), "public");
  await p.key("Enter"); await sleep(40);
  check("Enter on a branch: opens and selects it", [await q(`document.querySelector(${JSON.stringify(branch("public"))}).getAttribute("aria-expanded")`), await q(`document.querySelector(${JSON.stringify(row("public"))}).hasAttribute("data-selected")`)], ["true", true]);
  await sleep(300);
  check("keyboard focus: the ring inside the row's fill, the highlight on it", await q(`(()=>{const e=document.activeElement;const s=getComputedStyle(e,"::before");const h=document.querySelector("${R} [data-slot=tree-view-highlight]");return [s.outlineStyle,parseFloat(s.outlineOffset)<0,Math.abs(h.getBoundingClientRect().y-e.getBoundingClientRect().y)<1]})()`), ["solid", true, true]);
  await p.key("Tab");
  check("Tab leaves the tree", await q(`!!document.activeElement?.closest?.(${JSON.stringify(R)})`), false);

  /* selected at mount, nested open */
  await open(fw, 1);
  check("selected at mount: Roles (depth 3) is selected and visible; the tree takes aria-label", [await q(`document.querySelector(${JSON.stringify(row("workspace/members/roles"))}).getAttribute("aria-selected")`), await q(`document.querySelector(${JSON.stringify(row("workspace/members/roles"))}).getAttribute("aria-level")`), await q(`document.querySelector("${R} [data-slot=tree-view-tree]").getAttribute("aria-label")`)], ["true", "3", "Settings"]);
  /* a row's fill, ring and highlight start where its level starts, so no guide is ever under them
   * (the guides are still drawn above, taking no pointer); the level holding the selection draws its guide in ink-3 */
  check("a fill starts where its row's level starts: 26px a level (Roles, depth 3: 52px), clear of every guide crossing it", [await q(`parseFloat(getComputedStyle(document.querySelector(${JSON.stringify(row("workspace/members/roles"))}),"::before").insetInlineStart)`), await q(`(()=>{const sel=document.querySelector(${JSON.stringify(row("workspace/members/roles"))}).getBoundingClientRect();const start=sel.x+parseFloat(getComputedStyle(document.querySelector(${JSON.stringify(row("workspace/members/roles"))}),"::before").insetInlineStart);return [...document.querySelectorAll("${R} [data-slot=tree-view-guide]")].map((g)=>g.getBoundingClientRect()).filter((g)=>g.y<sel.bottom&&g.bottom>sel.y).every((g)=>g.right<=start-4)})()`)], [52, true]);
  const hv = await p.rect(row("workspace/members/people")); await p.hover(hv.cx, hv.cy); await sleep(400);
  check("the hover highlight follows the level: it starts and ends where the row's fill does", await q(`(()=>{const h=document.querySelector("${R} [data-slot=tree-view-highlight]").getBoundingClientRect();const e=document.querySelector(${JSON.stringify(row("workspace/members/people"))});const b=e.getBoundingClientRect();return [Math.abs(h.x-(b.x+52))<0.5,Math.abs(h.right-b.right)<0.5]})()`), [true, true]);
  const top = await p.rect(row("account")); await p.hover(top.cx, top.cy); await sleep(400);
  check("…and glides back out to a top-level row", await q(`(()=>{const h=document.querySelector("${R} [data-slot=tree-view-highlight]").getBoundingClientRect();const b=document.querySelector(${JSON.stringify(row("account"))}).getBoundingClientRect();return Math.abs(h.x-b.x)<0.5&&Math.abs(h.width-b.width)<0.5})()`), true);
  await away();
  check("guides over the highlight and the rows, taking no pointer; the point of the guide beside the selected row is the row (its hit area is the whole width)", await q(`(()=>{const g=document.querySelector(${JSON.stringify(branch("workspace") + " > [data-slot=tree-view-content] > [data-slot=tree-view-body] > [data-slot=tree-view-guide]")});const s=getComputedStyle(g);const sel=document.querySelector(${JSON.stringify(row("workspace/members/roles"))});const h=document.querySelector("${R} [data-slot=tree-view-highlight]");const a=g.getBoundingClientRect(),b=sel.getBoundingClientRect();return [Number(s.zIndex)>Number(getComputedStyle(sel).zIndex),Number(s.zIndex)>Number(getComputedStyle(h).zIndex),s.pointerEvents,document.elementFromPoint(a.x+a.width/2,b.y+b.height/2)?.closest("[data-slot=tree-view-item]")===sel]})()`), [true, true, "none", true]);
  check("active guide: the level holding the selected row is ink-3, its parent level line-strong", [await q(`getComputedStyle(document.querySelector(${JSON.stringify(branch("workspace/members") + " [data-slot=tree-view-guide]")})).borderInlineStartColor`), await q(`getComputedStyle(document.querySelector(${JSON.stringify(branch("workspace") + " > [data-slot=tree-view-content] > [data-slot=tree-view-body] > [data-slot=tree-view-guide]")})).borderInlineStartColor`)], [await token("--fndn-ink-3"), await token("--fndn-line-strong")]);
  /* multiple and disabled */
  await open(fw, 2);
  check("multiple: aria-multiselectable; disabled row half opacity, aria-disabled", await q(`(()=>{const d=document.querySelector(${JSON.stringify(row("q2"))});return [document.querySelector("${R} [data-slot=tree-view-tree]").getAttribute("aria-multiselectable"),getComputedStyle(d).opacity,d.getAttribute("aria-disabled")]})()`), ["true", "0.5", "true"]);
  await q(`document.querySelector(${JSON.stringify(row("q1"))}).focus()`);
  await p.key("ArrowDown");
  check("ArrowDown skips the disabled row", await focused(), "q3");

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("long names wrap whole (no ellipsis); nothing overflows 240px", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const t=document.querySelector(${JSON.stringify(row("a") + " [data-slot=tree-view-text]")});return [getComputedStyle(t).textOverflow,t.getBoundingClientRect().height>40,e.scrollWidth<=e.clientWidth+1,[...e.querySelectorAll("[data-slot=tree-view-text]")].every((n)=>n.scrollWidth<=n.clientWidth+1)]})()`), ["clip", true, true, true]);
  await open(fw, 1, "&data=worst");
  check("deep: six levels, each 26px further in", await q(`(()=>{const xs=["1","2","3","4","5"].map((v)=>document.querySelector('${R} [data-value="'+v+'"][data-slot=tree-view-branch-control] [data-slot=tree-view-caret]').getBoundingClientRect().x);return xs.slice(1).map((x,i)=>Math.round(Math.abs(x-xs[i])))})()`), [26, 26, 26, 26]);
  await open(fw, 3, "&data=worst");
  check("no items: an empty tree, no error", await q(`document.querySelectorAll(${JSON.stringify(ROWS)}).length`), 0);
  await open(fw, 4, "&data=worst");
  check("an open empty folder at 120px: nothing overflows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return e.scrollWidth<=e.clientWidth+1})()`), true);
  await open(fw, 2, "&data=worst&dir=rtl");
  check("rtl: an open caret points down (90); rows indent from the right", [await ang(`${row("a")} [data-slot=tree-view-caret]`), await q(`(()=>{const a=document.querySelector(${JSON.stringify(row("a") + " [data-slot=tree-view-text]")}).getBoundingClientRect();const c=document.querySelector(${JSON.stringify(row("a/1") + " [data-slot=tree-view-text]")}).getBoundingClientRect();return Math.round(a.right-c.right)})()`)], [90, 26]);
  const rh = await p.rect(row("a/1")); await p.hover(rh.cx, rh.cy); await sleep(400);
  check("rtl: a depth-2 row's fill and highlight start 26px in from the right", await q(`(()=>{const e=document.querySelector(${JSON.stringify(row("a/1"))});const b=e.getBoundingClientRect();const h=document.querySelector("${R} [data-slot=tree-view-highlight]").getBoundingClientRect();return [parseFloat(getComputedStyle(e,"::before").insetInlineStart),Math.abs(h.right-(b.right-26))<0.5,Math.abs(h.x-b.x)<0.5]})()`), [26, true, true]);
  await away();
  /* size: the control scale (xs 24 · sm 28 · md 32 · lg 36), dimensions only. Per size: the
   * height of every one-line row, the text size, one level of indent (caret box + gap), a leaf's
   * name on its sibling branch's, the caret on the first line, the guide under the caret; the look
   * (weight, colour, radius) is md's. */
  const look = (sel) => q(`(()=>{const s=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return [s.fontWeight,s.color]})()`);
  const radius = (sel) => q(`[getComputedStyle(document.querySelector(${JSON.stringify(sel)}),"::before").borderRadius,getComputedStyle(document.querySelector("${R} [data-slot=tree-view-highlight]")).borderRadius]`);
  const geometry = async ([parent, child, leaf]) => [
    await q(`[...new Set([...document.querySelectorAll(${JSON.stringify(ROWS)})].filter((e)=>e.getClientRects().length).map((e)=>Math.round(e.getBoundingClientRect().height*100)/100))]`),
    await q(`getComputedStyle(document.querySelector(${JSON.stringify(row(leaf))})).fontSize`),
    Math.round(((await x(`${row(child)} [data-slot=tree-view-caret]`)) - (await x(`${row(parent)} [data-slot=tree-view-caret]`))) * 100) / 100,
    Math.abs((await x(`${row(leaf)} [data-slot=tree-view-text]`)) - (await x(`${row(child)} [data-slot=tree-view-text]`))) < 0.5,
    await q(`(()=>{const c=document.querySelector(${JSON.stringify(row(parent) + " [data-slot=tree-view-caret]")}).getBoundingClientRect();const r=document.createRange();r.selectNodeContents(document.querySelector(${JSON.stringify(row(parent) + " [data-slot=tree-view-text]")}));const t=r.getClientRects()[0];const g=document.querySelector(${JSON.stringify(branch(parent) + " [data-slot=tree-view-guide]")}).getBoundingClientRect();return [Math.abs((c.y+c.height/2)-(t.y+t.height/2))<=0.5, Math.abs((g.x+g.width/2)-(c.x+c.width/2))<=0.5]})()`),
  ];
  const DENSE = ["src", "src/webhooks", "src/index.ts"];
  const mdLook = await (async () => { await open(fw, 0); return look(row("package.json")); })();
  check("md (default): control radius on the rows and the highlight", await radius(row("package.json")), [await token("--fndn-radius-control", "borderRadius"), await token("--fndn-radius-control", "borderRadius")]);
  check("md (default): 32px rows, 14px text, 26px a level, aligned", await geometry(["src", "src/components", "src/app.tsx"]), [[32], "14px", 26, true, [true, true]]);
  for (const [ex, size, want] of [[3, "xs", [[24], "12px", 20, true, [true, true]]], [4, "sm", [[28], "13px", 26, true, [true, true]]], [5, "lg", [[36], "14px", 26, true, [true, true]]]]) {
    await open(fw, ex);
    check(`${size}: ${want[0][0]}px rows, ${want[1]} text, ${want[2]}px a level, leaf and branch names aligned, caret on the first line, guide under the caret`, await geometry(DENSE), want);
    check(`${size}: the look is md's (weight, colour)`, await look(row("package.json")), mdLook);
    const r = await token(size === "lg" ? "--fndn-radius-control" : "--fndn-radius-chip", "borderRadius");
    check(`${size}: ${size === "lg" ? "control" : "chip"} radius on the rows and the highlight`, await radius(row("package.json")), [r, r]);
  }
  await open(fw, 3);
  check("xs: a 16px caret and icon box", await q(`Math.round(document.querySelector(${JSON.stringify(row("src") + " [data-slot=tree-view-caret]")}).getBoundingClientRect().width)`), 16);
  await open(fw, 5, "&data=worst");
  check("xs, 180px: a long name wraps whole, nothing overflows", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const t=document.querySelector(${JSON.stringify(row("a/1") + " [data-slot=tree-view-text]")});return [t.getBoundingClientRect().height>16,e.scrollWidth<=e.clientWidth+1,[...e.querySelectorAll("[data-slot=tree-view-text]")].every((n)=>n.scrollWidth<=n.clientWidth+1)]})()`), [true, true, true]);

  await open(fw, 1, "&theme=dark");
  check("dark: the selected row is the dark hover-2, its text the dark ink", await q(`(()=>{const e=document.querySelector(${JSON.stringify(row("workspace/members/roles"))});return [getComputedStyle(e,"::before").backgroundColor,getComputedStyle(e).color]})()`), [await token("--fndn-hover-2"), await token("--fndn-ink", "color")]);
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
