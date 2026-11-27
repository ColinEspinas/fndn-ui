// Keyboard and pointer contract of the Code View, run against every target through the harness.
//   node components/code-view/code-view.test.mjs            all three targets
//   node components/code-view/code-view.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const INVOICE = [
  "export async function sendInvoice() {",
  '  const account = await getAccount("northwind");',
  "  const base = await billing.fetch({ account });",
  '  await ledger.store(base, { terms: "net-30" });',
  "  if (!base.approved) return null;",
  "  return base.total;",
  "}",
].join("\n");
/* a mouse, so the hover-gated fold markers can be checked */
const p = await launch({ dpr: 2, hover: true });
let failed = 0;
const open = async (fw, ex, extra = "") => {
  await p.goto(`${BASE}/harness.html?c=code-view&fw=${fw}&ex=${ex}${extra}`, 150);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(25); }
};
/* the editor is loaded on demand: wait until it has replaced the listing */
const editorReady = async () => {
  for (let t = 0; t < 120; t++) { if (await p.eval(`!!document.querySelector("#stage .cm-editor") && !document.querySelector("#stage [data-slot=code-view-body]")`)) return true; await sleep(25); }
  return false;
};
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  const q = (js) => p.eval(js);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  try {
  /* Listing */
  await open(fw, 0);
  check("every target renders the same code, whitespace included", await q(`[...document.querySelectorAll("#stage [data-slot=code-view-code]")].map((c)=>c.textContent).join("\\n")`), INVOICE);
  check("no frame of its own: no shadow, no radius, no border", await q(`(()=>{const cs=getComputedStyle(document.querySelector("#stage [data-slot=code-view]"));return [cs.boxShadow, cs.borderTopLeftRadius, cs.borderTopWidth]})()`), ["none", "0px", "0px"]);
  check("a listing that fits is not a tab stop and loads no editor", await q(`[document.querySelector("#stage [data-slot=code-view-body]").hasAttribute("tabindex"), !!document.querySelector("#stage .cm-editor")]`), [false, false]);
  check("line numbers are not selectable; rows are 20px; the code is 12.5px mono", await q(`(()=>{const n=document.querySelector("#stage [data-slot=code-view-num]"),c=document.querySelector("#stage [data-slot=code-view-code]");return [getComputedStyle(n).userSelect, Math.round(n.parentElement.getBoundingClientRect().height), getComputedStyle(c).fontSize, getComputedStyle(c).fontFamily.includes("JetBrains Mono")]})()`), ["none", 20, "12.5px", true]);
  check("syntax colours: keywords, strings, calls", await q(`[...new Set([...document.querySelectorAll("#stage [data-slot=code-view-tok]")].map((t)=>t.className))].length`), 3);

  /* Diff */
  await open(fw, 1);
  check("Diff: one row per line, kinds tinted, bars on add and del, no current line", await q(`(()=>{const rows=[...document.querySelectorAll("#stage [data-slot=code-view-row]")];return [rows.length, rows.filter((r)=>r.querySelector("[data-slot=code-view-bar]")).length, document.querySelectorAll("#stage [data-slot=code-view-piece]").length, !!document.querySelector("#stage [aria-current]")]})()`), [4, 2, 2, false]);

  /* Read-only with a current line, no wrap (ex 3): the same file as the editable example */
  await open(fw, 3);
  check("currentLine 7: that row alone is current", await q(`(()=>{const rows=[...document.querySelectorAll("#stage [data-slot=code-view-row]")];const cur=rows.filter((r)=>r.getAttribute("aria-current")==="true");return [cur.length, rows.indexOf(cur[0])+1]})()`), [1, 7]);
  check("an overflowing listing is a named, focusable region", await q(`(()=>{const b=document.querySelector("#stage [data-slot=code-view-body]");return [b.getAttribute("tabindex"), b.getAttribute("role"), b.getAttribute("aria-label")]})()`), ["0", "region", "src/middleware/rate-limit.ts"]);
  const geometry = `(()=>{const root=document.querySelector("#stage [data-slot=code-view]");const rb=root.getBoundingClientRect();const text=(e)=>{const g=document.createRange();g.selectNodeContents(e);const b=g.getBoundingClientRect();return [Math.round((b.left-rb.left)*4)/4, Math.round((b.top-rb.top)*4)/4]};
    const cm=root.querySelector(".cm-editor");
    const nums=cm?[...cm.querySelectorAll(".cm-lineNumbers .cm-gutterElement")].filter((e)=>e.offsetHeight):[...root.querySelectorAll("[data-slot=code-view-num]")];
    const lines=cm?[...cm.querySelectorAll(".cm-line")]:[...root.querySelectorAll("[data-slot=code-view-code]")];
    return {height: Math.round(rb.height), num: nums.slice(0,8).map(text), code: lines.slice(0,8).filter((l)=>l.textContent).map(text)}})()`;
  const readonly = await q(geometry);

  /* Editable (ex 2): the listing first, then the editor in its place, drawn the same */
  await open(fw, 2);
  const listing = await q(geometry);
  check("editable: the listing shown while the editor loads is the read-only one (no fold column)", listing, readonly);
  check("editable: the editor arrives and replaces the listing", await editorReady(), true);
  const editor = await q(geometry);
  check("editable: nothing moves when the editor arrives (numbers, code, height)", editor, listing);
  check("editable: a named, multi-line text box; the gutter is hidden from assistive tech", await q(`(()=>{const c=document.querySelector("#stage .cm-content");return [c.getAttribute("role"), c.getAttribute("aria-multiline"), c.getAttribute("aria-label"), document.querySelector("#stage .cm-gutters").getAttribute("aria-hidden")]})()`), ["textbox", "true", "src/middleware/rate-limit.ts", "true"]);
  const tint = `(()=>{const tok=(v,p)=>{const d=document.createElement("div");d.style[p]="var("+v+")";document.body.append(d);const c=getComputedStyle(d)[p];d.remove();return c};const hover=tok("--fndn-hover","backgroundColor"),ink=tok("--fndn-ink","color");
    const lines=[...document.querySelectorAll("#stage .cm-line")].map((l,i)=>getComputedStyle(l).backgroundColor===hover?i+1:0).filter(Boolean);
    const nums=[...document.querySelectorAll("#stage .cm-lineNumbers .cm-gutterElement")].filter((g)=>g.offsetHeight&&getComputedStyle(g).backgroundColor===hover&&getComputedStyle(g).color===ink).map((g)=>+g.textContent);
    return [lines, nums]})()`;
  check("editable at rest: only the host's line 7 is tinted (hover, number ink)", await q(tint), [[7], [7]]);
  check("editable: no CodeMirror default look (no focus outline, transparent editor, surface gutter, no gutter border)", await q(`(()=>{const e=document.querySelector("#stage .cm-editor"),g=document.querySelector("#stage .cm-gutters");return [getComputedStyle(e).backgroundColor, getComputedStyle(g).backgroundColor===getComputedStyle(document.querySelector("#stage [data-slot=code-view]")).backgroundColor, getComputedStyle(g).borderRightWidth]})()`), ["rgba(0, 0, 0, 0)", true, "0px"]);

  /* typing, undo, the caret's line */
  const line = (n) => `[...document.querySelectorAll("#stage .cm-line")][${n - 1}].textContent`;
  await p.clickSel("#stage .cm-line:nth-child(4)");
  await p.key("Home");
  check("editable: a click puts the caret there and makes that line current", await q(`document.querySelector("#stage .cm-lineNumbers .cm-activeLineGutter").textContent`), "4");
  await p.type("x");
  check("typing edits the line", await q(line(4)), "xconst LIMIT = 120;");
  await p.key("z", { ctrl: true });
  check("Ctrl+Z undoes it", await q(line(4)), "const LIMIT = 120;");
  await p.key("ArrowDown");
  check("ArrowDown moves the current line with the caret", await q(`document.querySelector("#stage .cm-lineNumbers .cm-activeLineGutter").textContent`), "5");
  await p.key("Tab");
  check("Tab indents inside the editor; focus stays", await q(`[${line(5)}.startsWith("  ") || ${line(5)}.startsWith("\\t"), document.activeElement?.classList.contains("cm-content")]`), [true, true]);
  await p.key("z", { ctrl: true });
  await p.key("Escape");
  await p.key("Tab");
  check("Escape, then Tab, moves focus out of the editor", await q(`!!document.activeElement && !document.activeElement.closest("#stage .cm-editor")`), true);

  /* find: a widget floating over the code; it never pushes or scrolls it */
  const W = `document.querySelector("#stage [data-slot=code-view-search]")`;
  const count = () => q(`${W}?.querySelector("[data-slot=code-view-search-count]")?.textContent ?? null`);
  const at = await q(`(()=>{const l=[...document.querySelectorAll("#stage .cm-line")][6].getBoundingClientRect();return {x:l.left+30,y:l.top+10}})()`);
  await p.click(at.x, at.y);
  const still = `(()=>{const s=document.querySelector("#stage .cm-scroller");return [s.scrollTop, s.scrollLeft, Math.round(document.querySelector("#stage .cm-line").getBoundingClientRect().top), Math.round(document.querySelector("#stage [data-slot=code-view]").getBoundingClientRect().height)]})()`;
  const rest = await q(still);
  await p.key("f", { ctrl: true });
  await sleep(120);
  check("Ctrl+F opens the find widget: one row, the field focused, the replace row hidden", await q(`(()=>{const w=${W};return [!!w, w?.querySelectorAll("[data-slot=code-view-search-row]").length, document.activeElement?.getAttribute("aria-label"), document.activeElement?.dataset.codeView]})()`), [true, 1, "Find", "search-field"]);
  check("opening it moves nothing: no scroll, no line shifted, same height", await q(still), rest);
  check("it floats at the top end corner, 8px clear, inside the view", await q(`(()=>{const w=${W}.getBoundingClientRect(),r=document.querySelector("#stage [data-slot=code-view]").getBoundingClientRect();return [Math.round(w.top-r.top), Math.round(r.right-w.right), w.left>=r.left+7.5]})()`), [8, 8, true]);
  check("the options are named toggles; Previous, Next and Close are named", await q(`[...${W}.querySelectorAll("button")].map((b)=>b.getAttribute("aria-label")||b.textContent.trim())`), ["Toggle replace", "Match case", "Match whole word", "Use regular expression", "Previous match", "Next match", "Close"]);
  await p.type("bucket");
  await sleep(100);
  check("typing marks the matches and counts them, politely announced", [await count(), await q(`${W}.querySelector("[data-slot=code-view-search-count]").getAttribute("role")`), await q(`document.querySelectorAll("#stage .cm-searchMatch").length > 3`)], ["10 results", "status", true]);
  await p.key("Enter");
  check("Enter: the next match, \"2 of 10\"; a match in view does not scroll", [await count(), (await q(still))[0]], ["2 of 10", rest[0]]);
  await p.key("Enter", { shift: true });
  check("Shift+Enter: the previous one", await count(), "1 of 10");
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Next match']");
  check("the Next button", await count(), "2 of 10");
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Previous match']");
  check("the Previous button", await count(), "1 of 10");
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Match case']");
  check("a toggle presses and narrows the query", await q(`${W}.querySelector("[aria-label='Match case']").getAttribute("aria-pressed")`), "true");
  await q(`${W}.querySelector("input[data-code-view=search-field]").focus()`);
  await p.type("zz");
  await sleep(80);
  check("no match: \"No results\"", await count(), "No results");
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Toggle replace']");
  check("the caret shows the replace row under the find field", await q(`(()=>{const rows=${W}.querySelectorAll("[data-slot=code-view-search-row]");const f=${W}.querySelector("input[data-code-view=search-field]").closest("[data-slot=input-group]").getBoundingClientRect(),r=${W}.querySelector("input[data-code-view=replace-field]").closest("[data-slot=input-group]").getBoundingClientRect();return [rows.length, ${W}.querySelector("[aria-label='Toggle replace']").getAttribute("aria-expanded"), Math.round(f.left)===Math.round(r.left)]})()`), [2, "true", true]);
  await q(`${W}.querySelector("input[data-code-view=search-field]").select()`);
  await q(`${W}.querySelector("input[data-code-view=search-field]").focus()`);
  await p.type("LIMIT");
  await q(`${W}.querySelector("input[data-code-view=replace-field]").focus()`);
  await p.type("MAX");
  await p.clickSel("#stage [data-slot=code-view-search] button:not([aria-label]):last-of-type");
  await sleep(80);
  check("Replace all replaces every match", await q(`[...document.querySelectorAll("#stage .cm-line")].map((l)=>l.textContent).filter((t)=>t.includes("MAX")).length`), 2);
  await q(`${W}.querySelector("input[data-code-view=search-field]").focus()`);
  await p.key("Escape");
  await sleep(50);
  check("Escape closes the widget and returns the focus to the code", await q(`[!!${W}, document.activeElement?.classList.contains("cm-content")]`), [false, true]);
  await p.key("f", { ctrl: true });
  await sleep(100);
  check("opened again, the replace row is hidden", await q(`${W}.querySelectorAll("[data-slot=code-view-search-row]").length`), 1);
  await p.clickSel("#stage [data-slot=code-view-search] [aria-label='Close']");
  await sleep(50);
  check("Close closes it", await q(`!!${W}`), false);
  await p.key("z", { ctrl: true });
  await q(`document.querySelector("#stage [data-slot=code-view]").style.width="900px"`);
  await q(`document.querySelector("#stage .cm-content").focus()`);
  await p.key("f", { ctrl: true });
  await sleep(100);
  check("in a wide view the widget stays compact, at the end", await q(`(()=>{const w=${W}.getBoundingClientRect(),r=document.querySelector("#stage [data-slot=code-view]").getBoundingClientRect();return [w.width<560, Math.round(r.right-w.right)]})()`), [true, 8]);
  await p.key("Escape");
  await q(`document.querySelector("#stage [data-slot=code-view]").style.width=""`);

  /* folding by indentation, from the gutter */
  /* folding: no column; a chevron over the hairline of a foldable line's number, shown on hover */
  const num6 = await q(`(()=>{const g=[...document.querySelectorAll("#stage .cm-lineNumbers .cm-gutterElement")].find((e)=>e.textContent==="6").getBoundingClientRect();return {x:g.left+g.width/2,y:g.top+g.height/2}})()`);
  const marker6 = `(()=>{const row=[...document.querySelectorAll("#stage .cm-line")][5].getBoundingClientRect();const m=[...document.querySelectorAll("#stage .cm-foldGutter [data-fold]")].find((e)=>{const r=e.getBoundingClientRect();return Math.abs(r.top-row.top)<3});if(!m) return null;const r=m.getBoundingClientRect(),n=[...document.querySelectorAll("#stage .cm-lineNumbers .cm-gutterElement")].find((e)=>e.textContent==="6").getBoundingClientRect();return [getComputedStyle(m).visibility, Math.round(r.width), Math.round((r.left+r.width/2)-n.right)]})()`;
  await p.hover(5, 5);
  check("a foldable line's marker is hidden at rest", (await q(marker6))?.[0], "hidden");
  const still6 = await q(geometry);
  await p.hover(num6.x, num6.y);
  await sleep(50);
  check("over its number the marker shows, 8px, centred on the hairline", await q(marker6), ["visible", 8, 0]);
  check("showing it moves nothing", await q(geometry), still6);
  await p.click(num6.x, num6.y);
  await sleep(80);
  check("a click on the number folds the indented body; the closing line stays", await q(`[!!document.querySelector("#stage .cm-foldPlaceholder"), [...document.querySelectorAll("#stage .cm-line")].some((l)=>l.textContent==="}")]`), [true, true]);
  await p.hover(5, 5);
  check("a folded line keeps its marker", (await q(marker6))?.[0], "visible");
  await p.click(num6.x, num6.y);
  await sleep(80);
  check("a second click unfolds it", await q(`!!document.querySelector("#stage .cm-foldPlaceholder")`), false);

  /* no host line: nothing tinted at rest; the caret's line while focused */
  await open(fw, 6);
  check("no current line given: the editor arrives", await editorReady(), true);
  check("at rest nothing is tinted", await q(tint), [[], []]);
  await q(`document.querySelector("#stage .cm-content").focus()`);
  await sleep(50);
  check("focused, the caret's line (1) is tinted", await q(tint), [[1], [1]]);
  await q(`document.activeElement.blur()`);
  await sleep(50);
  check("blurred, the tint goes", await q(tint), [[], []]);

  /* switching back to read-only brings the listing back */
  await q(`window.__harnessMounted.update({ editable: false })`);
  await sleep(150);
  check("editable off: the listing comes back, no editor left", await q(`[!!document.querySelector("#stage [data-slot=code-view-body]"), !!document.querySelector("#stage .cm-editor")]`), [true, false]);

  /* fill: as tall as its container, the code scrolls inside */
  await open(fw, 5);
  await sleep(100);
  check("fill: 200px tall, scrolls; the current line (40) is in view; the page does not scroll", await q(`(()=>{const r=document.querySelector("#stage [data-slot=code-view]"),b=r.querySelector("[data-slot=code-view-body]");const c=b.querySelector("[aria-current=true]").getBoundingClientRect(),bb=b.getBoundingClientRect();return [Math.round(r.getBoundingClientRect().height), b.scrollHeight>b.clientHeight, c.top>=bb.top&&c.bottom<=bb.bottom, scrollY]})()`), [200, true, true, 0]);

  /* highlighted lines: shown as given; editable would colour value instead */
  await open(fw, 4);
  check("highlighted lines are shown as given", await q(`document.querySelector("#stage [data-slot=code-view-code]").innerHTML.includes("<span")`), true);
  } catch (error) { check("script ran to the end", String(error.message).split("\n")[0].slice(0, 160), "ok"); }
  check("no console errors", p.errors.slice(0, 2), []);
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
