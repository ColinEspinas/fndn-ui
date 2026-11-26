// Keyboard and pointer contract of the Code Block, run against every target through the harness.
//   node components/code-block/code-block.test.mjs            all four targets
//   node components/code-block/code-block.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const LINES = [
  "export async function sendInvoice() {",
  '  const account = await getAccount("northwind");',
  "  const base = await billing.fetch({ account });",
  '  await ledger.store(base, { terms: "net-30" });',
  "  if (!base.approved) return null;",
  "  return base.total;",
  "}",
].join("\n");
const p = await launch({ dpr: 2 });
await p.send("Browser.grantPermissions", { origin: new URL(BASE).origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
let failed = 0;
const open = async (fw, ex) => {
  await p.goto(`${BASE}/harness.html?c=code-block&fw=${fw}&ex=${ex}`, 150);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(25); }
};
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  p.errors.length = 0;
  const q = (js) => p.eval(js);
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  try {
  /* Code */
  await open(fw, 0);
  const rectsJs = `[...document.querySelectorAll("#stage [data-slot=code-block], #stage [data-code-block=copy], #stage [data-slot=code-block-row]")].map((e)=>{const b=e.getBoundingClientRect();return [b.x,b.y,b.width,b.height].map((n)=>Math.round(n*2)/2).join(",")}).join(" ")`;
  const r0 = await q(rectsJs);
  await sleep(600);
  check("no layout shift after mount", r0 === await q(rectsJs), true);
  check("every target renders the same code, whitespace included", await q(`[...document.querySelectorAll("#stage [data-slot=code-block-code]")].map((c)=>c.textContent).join("\\n")`), LINES);
  check("Copy is a named button with a polite status beside it", await q(`(()=>{const b=document.querySelector("#stage [data-code-block=copy]"),s=document.querySelector("#stage [data-slot=code-block-status]");return [b.tagName, b.getAttribute("aria-label"), s.getAttribute("role"), s.textContent]})()`), ["BUTTON", "Copy code", "status", ""]);
  check("a body that fits is not a tab stop", await q(`document.querySelector("#stage [data-slot=code-block-body]").hasAttribute("tabindex")`), false);

  const align = await q(`(()=>{
    const r=(e)=>e.getBoundingClientRect(), mid=(b)=>[(b.left+b.right)/2,(b.top+b.bottom)/2];
    const nums=[...document.querySelectorAll("#stage [data-slot=code-block-num]")];
    const textRight=nums.map((n)=>{const g=document.createRange();g.selectNodeContents(n);return r(g).right});
    const padRight=nums.map((n)=>r(n).right-parseFloat(getComputedStyle(n).paddingRight)-parseFloat(getComputedStyle(n).borderRightWidth));
    const icon=r(document.querySelector("#stage [data-slot=button-icon] > :first-child")), box=r(document.querySelector("#stage [data-slot=button-icon]"));
    const btn=r(document.querySelector("#stage [data-code-block=copy]")), head=r(document.querySelector("#stage :is([data-slot=code-block-header], [data-slot=tabs-header])"));
    const im=mid(icon), bm=mid(box), headMid=(head.top+head.bottom-parseFloat(getComputedStyle(document.querySelector("#stage :is([data-slot=code-block-header], [data-slot=tabs-header])")).borderBottomWidth))/2;
    return {numbers:textRight.every((x,i)=>Math.abs(x-padRight[i])<0.6), icon:Math.abs(im[0]-bm[0])<=0.25&&Math.abs(im[1]-bm[1])<=0.25, button:Math.abs(mid(btn)[1]-headMid)<=0.25};
  })()`);
  check("line numbers end on the gutter edge; copy icon and button centred", align, { numbers: true, icon: true, button: true });
  check("line numbers are not selectable", await q(`getComputedStyle(document.querySelector("#stage [data-slot=code-block-num]")).userSelect`), "none");
  check("a hand selection skips the line numbers", await q(`(()=>{const g=document.createRange();g.selectNodeContents(document.querySelector("#stage [data-slot=code-block-rows]"));const s=getSelection();s.removeAllRanges();s.addRange(g);const t=s.toString();s.removeAllRanges();return /^\\d/m.test(t.split("\\n").filter(Boolean)[0]??"")})()`), false);

  /* pointer copy */
  const w0 = await q(`document.querySelector("#stage [data-code-block=copy]").getBoundingClientRect().width`);
  const end0 = await q(`document.querySelector("#stage [data-code-block=copy]").getBoundingClientRect().right`);
  await q(`(()=>{window.__copied=null;const c=navigator.clipboard,w=c.writeText.bind(c);c.writeText=(t)=>{window.__copied=t;return w(t)}})()`);
  await p.clickSel("#stage [data-code-block=copy]");
  await sleep(40);
  check("the swap crossfades opacity and blur", await q(`document.getAnimations().filter((a)=>a.effect?.target?.closest?.("[data-code-block=copy]")).map((a)=>a.transitionProperty).filter((x)=>x==="opacity"||x==="filter").length>=4`), true);
  await sleep(260);
  check("click copies, says Copied and announces it", await q(`(()=>{const b=document.querySelector("#stage [data-code-block=copy]");return [(getComputedStyle(b.querySelector("[data-slot=button-label] > [data-slot=button-label]:first-child")).position==="absolute"), document.querySelector("#stage [data-slot=code-block-status]").textContent, getComputedStyle(b.querySelector("[data-slot=button-label] > [data-slot=button-label]:last-child")).opacity, getComputedStyle(b.querySelector("[data-slot=button-icon] > :last-child")).opacity]})()`), [true, "Copied", "1", "1"]);
  check("Copy is a Button (ghost, xs, rounded, muted); Copied is green", await q(`(()=>{const b=document.querySelector("#stage [data-code-block=copy]");const probe=document.createElement("span");probe.style.color="var(--fndn-green)";document.body.append(probe);const g=getComputedStyle(probe).color;probe.remove();return [b.dataset.slot==="button",b.getBoundingClientRect().height,getComputedStyle(b).color===g]})()`), [true, 24, true]);
  check("the clipboard holds the code without line numbers", await q(`window.__copied`), LINES);
  /* the button is as wide as the label it shows, and it grows away from the edge it sits against */
  check("Copied is wider than Copy; the button's end stays where it was", await q(`(()=>{const b=document.querySelector("#stage [data-code-block=copy]").getBoundingClientRect();return [b.width>${w0}+4, Math.abs(b.right-${end0})<0.5]})()`), [true, true]);
  await sleep(1400);
  check("after 1.5s it reverts and the status empties", await q(`[((b)=>(getComputedStyle(b.querySelector("[data-slot=button-label] > [data-slot=button-label]:first-child")).position==="absolute"))(document.querySelector("#stage [data-code-block=copy]")), document.querySelector("#stage [data-slot=code-block-status]").textContent]`), [false, ""]);

  /* keyboard copy */
  await p.click(5, 5);
  await p.key("Tab");
  check("Tab reaches Copy", await q(`[document.activeElement?.dataset.slot, document.activeElement?.dataset.codeBlock].join(" ")`), "button copy");
  check("Copy shows a focus ring", await q(`getComputedStyle(document.activeElement).outlineStyle`), "solid");
  await p.key("Enter"); await sleep(100);
  check("Enter copies; focus stays on the button", await q(`[[document.activeElement?.dataset.slot, document.activeElement?.dataset.codeBlock].join(" "), ((b)=>!!b&&(getComputedStyle(b.querySelector("[data-slot=button-label] > [data-slot=button-label]:first-child")).position==="absolute"))(document.activeElement)]`), ["button copy", true]);
  await sleep(1600);
  await p.key(" "); await sleep(100);
  check("Space copies", await q(`((b)=>!!b&&(getComputedStyle(b.querySelector("[data-slot=button-label] > [data-slot=button-label]:first-child")).position==="absolute"))(document.activeElement)`), true);

  /* wrapping */
  await q(`document.querySelector("#stage [data-slot=code-block]").style.width="240px"`); await sleep(100);
  check("long lines wrap inside the card", await q(`(()=>{const b=document.querySelector("#stage [data-slot=code-block-body]");return [b.scrollWidth<=b.clientWidth, [...document.querySelectorAll("#stage [data-slot=code-block-row]")].some((r)=>r.getBoundingClientRect().height>20)]})()`), [true, true]);

  /* Diff */
  await open(fw, 1);
  check("Diff: stat instead of Copy, no transitions on the rows", await q(`[!!document.querySelector("#stage [data-code-block=copy]"), document.querySelector("#stage [data-slot=code-block-stat]").textContent, [...document.querySelectorAll("#stage [data-slot=code-block-row], #stage [data-slot=code-block-code], #stage [data-slot=code-block-num]")].every((e)=>getComputedStyle(e).transitionDuration.split(",").every((d)=>parseFloat(d)===0))]`), [false, "+2-1", true]);

  /* Scrolling */
  await open(fw, 2);
  await sleep(150);
  check("an overflowing body is a named, focusable region", await q(`(()=>{const b=document.querySelector("#stage [data-slot=code-block-body]");return [b.getAttribute("tabindex"), b.getAttribute("role"), b.getAttribute("aria-label"), getComputedStyle(b).overscrollBehaviorY]})()`), ["0", "region", "invoice.ts", "auto"]);
  check("two-digit numbers share the right edge", await q(`(()=>{const xs=[...document.querySelectorAll("#stage [data-slot=code-block-num]")].map((n)=>{const g=document.createRange();g.selectNodeContents(n);return Math.round(g.getBoundingClientRect().right*2)/2});return new Set(xs).size})()`), 1);
  await p.click(5, 5);
  await p.key("Tab"); await p.key("Tab");
  check("Tab reaches the code region after Copy", await q(`document.activeElement?.dataset.slot`), "code-block-body");
  check("the region shows an inset focus ring", await q(`[getComputedStyle(document.activeElement).outlineStyle, getComputedStyle(document.activeElement).outlineOffset]`), ["solid", "-2px"]);
  await p.key("ArrowDown"); await p.key("ArrowDown"); await sleep(300);
  check("arrow keys scroll it", await q(`document.activeElement.scrollTop > 0`), true);

  /* Files: one 44px header row (tabs · path · Copy), one Copy acting on the active file; fixed body height */
  await open(fw, 3);
  await sleep(150);
  const spy = `(()=>{window.__copied=null;const c=navigator.clipboard,w=c.writeText.bind(c);c.writeText=(t)=>{window.__copied=t;return w(t)}})()`;
  await q(spy);
  const panel = `[...document.querySelectorAll("#stage [data-slot=tabs-content]")].find((c)=>!c.hidden)`;
  const path = `document.querySelector("#stage [data-slot=code-block-path]")`;
  check("Files: tabs list the files; one header row holds tabs, path and one Copy; panels hold only the body; fixed height", await q(`(()=>{const tabs=[...document.querySelectorAll("#stage [data-slot=tabs-trigger]")].map((t)=>t.textContent.trim());const h=document.querySelector("#stage :is([data-slot=code-block-header], [data-slot=tabs-header])");return [tabs, ${path}.textContent, ${path}.title, h.getBoundingClientRect().height, h.matches("[data-slot=tabs-header]"), !!h.querySelector("[data-slot=tabs-list]"), document.querySelectorAll("#stage [data-code-block=copy]").length, !!h.querySelector("[data-code-block=copy]"), [...document.querySelectorAll("#stage [data-slot=tabs-content]")].every((c)=>c.children.length===1&&c.firstElementChild.matches("[data-slot=code-block-body]")), ${panel}.querySelector("[data-slot=code-block-body]").getBoundingClientRect().height, !!document.querySelector("#stage [data-slot=code-block-file-bar]")]})()`), [["invoice.ts", "ledger.ts"], "src/invoice.ts", "", 44, true, true, 1, true, true, 120, false]);
  check("Files: the underline rests on the header's hairline; path, Copy and labels centred; Copy label ends 18px from the edge", await q(`(()=>{const r=(s)=>document.querySelector("#stage "+s).getBoundingClientRect();const h=r(":is([data-slot=code-block-header], [data-slot=tabs-header])"),i=r("[data-slot=tabs-indicator]"),c=r("[data-code-block=copy]"),p=r("[data-slot=code-block-path]"),root=r("[data-slot=code-block]"),lab=r("[data-code-block=copy] [data-slot=button-label] [data-slot=button-label]"),t=r("[data-slot=tabs-trigger][aria-selected=true]");const mid=(b)=>(b.top+b.bottom)/2,hm=(h.top+h.bottom-1)/2;return [Math.abs(i.bottom-(h.bottom-1))<0.6, Math.abs(mid(c)-hm)<=0.6, Math.abs(mid(p)-hm)<=0.6, Math.abs(mid(t)-hm)<=0.6, Math.round(root.right-lab.right), getComputedStyle(document.querySelector("#stage [data-slot=tabs-list]")).boxShadow]})()`), [true, true, true, true, 18, "none"]);
  await p.clickSel("#stage [data-code-block=copy]"); await sleep(150);
  check("Files: Copy takes the open file", await q(`window.__copied`), "export const invoice = (amount: number) => amount * 2;");
  await sleep(1500);
  const h0 = await q(`document.querySelector("#stage [data-slot=code-block]").getBoundingClientRect().height`);
  await q(`document.querySelector("#stage [data-slot=tabs-trigger][aria-selected=true]").focus()`);
  await p.key("ArrowRight"); await sleep(250);
  check("Files: ArrowRight opens the next file; the path follows; the block keeps its height", await q(`[${path}.textContent, ${path}.title, document.activeElement?.textContent.trim(), document.querySelector("#stage [data-slot=code-block]").getBoundingClientRect().height===${h0}]`), ["src/ledger.ts", "", "ledger.ts", true]);
  await p.clickSel("#stage [data-code-block=copy]"); await sleep(150);
  check("Files: the same Copy now takes that file (highlighted lines from outside, copied as plain text)", [await q(`window.__copied`), await q(`${panel}.querySelector("[data-slot=code-block-code]").innerHTML.includes("<span")`)], ["export const terms = 30;", true]);
  await q(`document.querySelector("#stage [data-slot=tabs-trigger][aria-selected=true]").focus()`);
  await p.key("ArrowLeft"); await sleep(250);
  check("Files: ArrowLeft goes back", await q(`${path}.textContent`), "src/invoice.ts");
  /* "Copied" belongs to the file that was copied, not to the next one shown */
  check("Files: another file right after a copy says Copy at once and announces nothing", await q(`(()=>{const b=document.querySelector("#stage [data-code-block=copy]");return [document.querySelector("#stage [data-slot=code-block-status]").textContent, getComputedStyle(b.querySelector("[data-slot=button-label] > [data-slot=button-label]:first-child")).opacity]})()`), ["", "1"]);

  /* Command: one line, no header, no numbers, a trailing copy */
  await open(fw, 4);
  await sleep(150);
  await q(spy);
  check("Command: no header and no line numbers; copy at the end of the row", await q(`(()=>{const r=document.querySelector("#stage [data-slot=code-block]");const row=r.querySelector("[data-slot=code-block-command]").getBoundingClientRect();const b=r.querySelector("[data-code-block=copy]").getBoundingClientRect();return [!!r.querySelector(":is([data-slot=code-block-header], [data-slot=tabs-header])"), !!r.querySelector("[data-slot=code-block-num]"), Math.round(row.right-b.right)]})()`), [false, false, 6]);
  await p.clickSel("#stage [data-code-block=copy]"); await sleep(150);
  check("Command: copy takes the command", await q(`window.__copied`), "npx shadcn add https://your-domain.com/r/react/code-block.json");
  /* five files at 320px: names of choices are shown whole, so the tabs give way to a pager and a
   * select of every file; the long path is cut in the middle (the file name stays) */
  const narrow = async (w) => {
    await p.viewport(w, 900, 2);
    await p.goto(`${BASE}/harness.html?c=code-block&fw=${fw}&ex=4&data=worst`, 300);
    for (let t = 0; t < 60; t++) { if (await q(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
    await q(`(() => { const s = document.createElement("style"); s.textContent = "body{grid-template-columns:minmax(0,1fr) !important} #stage{box-sizing:border-box;width:100%;min-width:0;padding:16px !important}"; document.head.append(s); })()`);
    await sleep(300);
  };
  await narrow(320);
  const LONG = "packages/core/src/behaviors/some/really/deeply/nested/directory/structure/invoice-batch-scheduler.ts";
  const sw = `document.querySelector("#stage [data-slot=code-block]")`;
  check("Files at 320px: the tabs are hidden; a pager and a select of every file stand in", await q(`(()=>{const r=${sw};const l=r.querySelector("[data-slot=tabs-list]");const s=r.querySelector("[data-slot=select]");const pg=r.querySelector("[data-slot=pager]");return [(getComputedStyle(r.querySelector("[data-slot=tabs-list]")).display==="none"?"select":undefined), getComputedStyle(l).display, !!pg && pg.parentElement.matches("[data-slot=tabs-header]"), pg?.querySelector("[data-slot=pager-position]")?.textContent.trim(), (()=>{const v=s?.querySelector("[data-slot=select-value]");return v?.title || v?.textContent.trim()})(), [...document.querySelectorAll("[data-slot=select-item-text]")].filter((t)=>t.closest("[data-slot=select-content]")).map((t)=>t.textContent.trim()).slice(-5)]})()`), ["select", "none", true, "File 1 of 5", "invoice-batch-scheduler.ts", ["invoice-batch-scheduler.ts", "ledger.ts", "billing.ts", "accounts.ts", "index.ts"]]);
  check("Files at 320px: nothing overflows the header; the path gives way; the select's value keeps the file's extension", await q(`(()=>{const r=${sw};const h=r.querySelector(":is([data-slot=code-block-header], [data-slot=tabs-header])").getBoundingClientRect();const kids=[...r.querySelectorAll(":is([data-slot=code-block-header], [data-slot=tabs-header]) > *")].filter((k)=>getComputedStyle(k).display!=="none"&&!k.classList.contains("sr-only")).map((k)=>k.getBoundingClientRect());const v=r.querySelector("[data-slot=select] [data-slot=select-value]");return [kids.every((b)=>b.left>=h.left-0.5&&b.right<=h.right+0.5), getComputedStyle(r.querySelector("[data-slot=code-block-path]")).display, v.textContent.includes("…") && v.textContent.endsWith(".ts"), v.title, v.scrollWidth<=v.clientWidth+1]})()`), [true, "none", true, "invoice-batch-scheduler.ts", true]);
  await q(`document.querySelector("#stage [data-slot=pager] [data-pager=next]").click()`); await sleep(250);
  check("Files at 320px: Next file opens the second file; the select and the path follow", await q(`(()=>{const r=${sw};const v=r.querySelector("[data-slot=select] [data-slot=select-value]");return [v.textContent.trim(), v.title, r.querySelector("[data-slot=code-block-path]").title || r.querySelector("[data-slot=code-block-path]").textContent, [...r.querySelectorAll("[data-slot=tabs-content]")].findIndex((c)=>!c.hidden), r.querySelector("[data-slot=pager] [data-slot=pager-position]").textContent.trim()]})()`), ["ledger.ts", "", "src/ledger.ts", 1, "File 2 of 5"]);
  /* two files: tabs at 280px give way at 240px and come back when it widens again */
  const twoAt = async (w) => { await p.viewport(w, 900, 2); await sleep(400); return q(`(()=>{const r=${sw};return [(getComputedStyle(r.querySelector("[data-slot=tabs-list]")).display==="none"?"select":null), !!r.querySelector("[data-slot=pager]"), !!r.querySelector("[data-slot=select]"), getComputedStyle(r.querySelector("[data-slot=tabs-list]")).display]})()`); };
  await p.viewport(1280, 900, 2);
  await open(fw, 3);
  await q(`(() => { const s = document.createElement("style"); s.textContent = "body{grid-template-columns:minmax(0,1fr) !important} #stage{box-sizing:border-box;width:100%;min-width:0;padding:16px !important}"; document.head.append(s); })()`);
  check("two files at 1280px: tabs", await twoAt(1280), [null, false, false, "flex"]);
  await q(`document.querySelector("#stage [data-slot=tabs-trigger][aria-selected=true]").focus()`);
  check("two files at 200px: pager and select", await twoAt(200), ["select", true, true, "none"]);
  check("focus that was on a tab moves to the select", await q(`document.activeElement?.dataset.slot==="select-trigger"`), true);
  check("wide again: the tabs come back, focus on the open file's tab", [await twoAt(1280), await q(`document.activeElement?.getAttribute("role")`)], [[null, false, false, "flex"], "tab"]);
  /* currentLine: one row tinted (hover) with aria-current, its number in ink; the others untouched */
  await p.viewport(1280, 900, 2);
  await open(fw, 5);
  const tok = (name, prop) => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d).${prop};d.remove();return v})()`);
  check("currentLine 11: that row alone is current, tinted hover, its number ink", await q(`(()=>{const rows=[...document.querySelectorAll("#stage [data-slot=code-block-row]")];const cur=rows.filter((r)=>r.getAttribute("aria-current")==="true");const r=cur[0];return [cur.length, rows.indexOf(r)+1, getComputedStyle(r).backgroundColor, getComputedStyle(r.querySelector("[data-slot=code-block-num]")).color, getComputedStyle(rows[0]).backgroundColor]})()`), [1, 11, await tok("--fndn-hover", "backgroundColor"), await tok("--fndn-ink", "color"), "rgba(0, 0, 0, 0)"]);
  check("currentLine below the fold: the body scrolls it into view at mount; the page does not scroll", await q(`(()=>{const b=document.querySelector("#stage [data-slot=code-block-body]");const r=b.querySelector("[aria-current=true]").getBoundingClientRect(),bb=b.getBoundingClientRect();return [b.scrollTop>0, r.top>=bb.top&&r.bottom<=bb.bottom, scrollY]})()`), [true, true, 0]);
  /* fill: the block takes its container's height (220px here) and the body the rest; nothing measured */
  await open(fw, 6);
  await sleep(200);
  check("fill: 220px tall, the body runs to the bottom edge and scrolls; no --fndn-code-block-height", await q(`(()=>{const r=document.querySelector("#stage [data-slot=code-block]");const b=[...r.querySelectorAll("[data-slot=code-block-body]")].find((e)=>e.offsetParent);const rb=r.getBoundingClientRect(),bb=b.getBoundingClientRect();return [Math.round(rb.height), Math.round(rb.bottom-bb.bottom), Math.round(bb.height), b.scrollHeight>b.clientHeight, r.style.getPropertyValue("--fndn-code-block-height")]})()`), [220, 0, 176, true, ""]);
  check("fill: the current line is the active file's only", await q(`[...document.querySelectorAll("#stage [data-slot=tabs-content]")].map((c)=>c.querySelectorAll("[aria-current=true]").length)`), [1, 0]);
  await q(`document.querySelector("#stage [data-slot=code-block]").style.height="300px"`); await sleep(100);
  check("fill: follows its container (300px) without measuring", await q(`(()=>{const r=document.querySelector("#stage [data-slot=code-block]");const b=[...r.querySelectorAll("[data-slot=code-block-body]")].find((e)=>e.offsetParent);return Math.round(r.getBoundingClientRect().bottom-b.getBoundingClientRect().bottom)})()`), 0);
  /* editor (example 7): the bare body of an editor pane; lines never wrap, the gutter stays */
  await open(fw, 7);
  await sleep(150);
  check("editor: no frame, no header, no copy, no path; fills its 220px box; the body is the pane", await q(`(()=>{const r=document.querySelector("#stage [data-slot=code-block]");const cs=getComputedStyle(r);const b=r.querySelector("[data-slot=code-block-body]");return [cs.boxShadow.split(", rgba").every((s)=>s.startsWith("rgba(0, 0, 0, 0)")||s.startsWith("(0, 0, 0, 0)")), cs.borderTopLeftRadius, !!r.querySelector("[data-slot=code-block-header], [data-code-block=copy], [data-slot=code-block-path]"), Math.round(r.getBoundingClientRect().height), Math.round(r.getBoundingClientRect().bottom-b.getBoundingClientRect().bottom), getComputedStyle(b).fontSize]})()`), [true, "0px", false, 220, 0, "13px"]);
  check("editor: a long line does not wrap (one row 20px tall); the body scrolls sideways and is a named region", await q(`(()=>{const b=document.querySelector("#stage [data-slot=code-block-body]");const rows=[...b.querySelectorAll("[data-slot=code-block-row]")];return [getComputedStyle(rows[5].querySelector("[data-slot=code-block-code]")).whiteSpace, Math.round(rows[5].getBoundingClientRect().height), b.scrollWidth>b.clientWidth, b.getAttribute("aria-label")]})()`), ["pre", 20, true, "rate-limit.ts"]);
  await q(`document.querySelector("#stage [data-slot=code-block-body]").scrollLeft=120`); await sleep(80);
  check("editor: scrolled sideways, the gutter stays at the start over an opaque surface; the current line's number keeps its tint", await q(`(()=>{const b=document.querySelector("#stage [data-slot=code-block-body]");const nums=[...b.querySelectorAll("[data-slot=code-block-num]")];const bl=b.getBoundingClientRect().left;return [Math.round(nums[0].getBoundingClientRect().left-bl), getComputedStyle(nums[0]).backgroundColor===getComputedStyle(document.querySelector("#stage [data-slot=code-block]")).backgroundColor, getComputedStyle(nums[6]).backgroundColor===getComputedStyle(nums[6].parentElement).backgroundColor]})()`), [0, true, true]);
  /* diff without wrapping (example 8): the accent bar sticks with the gutter */
  await open(fw, 8);
  await q(`document.querySelector("#stage [data-slot=code-block-body]").scrollLeft=200`); await sleep(80);
  check("wrap off (diff): rows stay one line, the bar and numbers stay at the start while the code scrolls", await q(`(()=>{const b=document.querySelector("#stage [data-slot=code-block-body]");const bl=b.getBoundingClientRect().left;const bar=b.querySelector("[data-slot=code-block-bar]").getBoundingClientRect();const row=b.querySelectorAll("[data-slot=code-block-row]")[5].getBoundingClientRect();return [Math.round(bar.left-bl), Math.round(bar.height), Math.round(row.height), b.scrollLeft>0]})()`), [0, 20, 20, true]);
  await open(fw, 3);
  check("nothing animates on first paint (no fade on the tab list)", await q(`document.getAnimations().filter((a)=>document.querySelector("#stage")?.contains(a.effect?.target)).map((a)=>a.animationName||a.transitionProperty)`), []);
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
