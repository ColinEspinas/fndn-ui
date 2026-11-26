// Contract of the Page header, run against every target through the harness: the title is a real
// heading at its level, the back link is a link with an href and a button without one, the sizes'
// metrics and inks, the actions on the title's line (and under the text when they do not fit),
// nothing cut or overflowing, the arrow mirrored right-to-left, nothing moving on first paint.
//   node components/page-header/page-header.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=page-header]";
const p = await launch({ hover: true });
let failed = 0;
const ready = async () => { await sleep(300); for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };

/* helpers run in the page: a part by slot, its box, and the colour a token resolves to */
const HELP = `const root=document.querySelector(${JSON.stringify(R)});const part=(s)=>root.querySelector("[data-slot=page-header-"+s+"]");const box=(n)=>n.getBoundingClientRect();const ink=(t)=>{const d=document.createElement("span");d.style.color="var(--fndn-"+t+")";root.append(d);const c=getComputedStyle(d).color;d.remove();return c};`;

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(`(()=>{${HELP}${js}})()`);
  const open = async (ex, extra = "") => { p.errors.length = 0; await p.goto(`${BASE}/harness.html?c=page-header&fw=${fw}&ex=${ex}${extra}`, 300); await ready(); };
  try {
    await open(0);
    check("nothing moves on first paint", await q(`return root.getAnimations({subtree:true}).filter((a)=>a.playState==="running").length`), 0);
    check("title: an h1, 20px/600 on a 28px line, ink", await q(`const t=part("title");const cs=getComputedStyle(t);return [t.tagName,cs.fontSize,cs.fontWeight,cs.lineHeight,cs.color===ink("ink")]`), ["H1", "20px", "600", "28px", true]);
    check("description: a p, 13px on a 20px line, ink-2", await q(`const d=part("description");const cs=getComputedStyle(d);return [d.tagName,cs.fontSize,cs.lineHeight,cs.color===ink("ink-2")]`), ["P", "13px", "20px", true]);
    check("back: a link with its href, 13px ink-2, the arrow hidden and first", await q(`const b=part("back");const cs=getComputedStyle(b);const i=b.querySelector("svg");return [b.tagName,b.getAttribute("href"),cs.fontSize,cs.color===ink("ink-2"),i?.getAttribute("aria-hidden"),b.firstElementChild===i,b.textContent.trim()]`), ["A", "#projects", "13px", true, "true", true, "Projects"]);
    check("back above the title, both on one start edge", await q(`const b=box(part("back")),t=box(part("title"));return [b.bottom<=t.top,Math.abs(b.left-t.left)<1]`), [true, true]);
    check("actions: sm Buttons on the title's line, at the end", await q(`const a=part("actions"),t=box(part("title")),bs=[...a.querySelectorAll("[data-slot=button]")];const ab=box(a),rb=box(root);return [bs.length,bs.map((b)=>Math.round(box(b).height)),Math.abs(ab.top-t.top)<1,Math.abs(ab.right-rb.right)<1]`), [2, [28, 28], true, true]);
    check("Tab: the back link, then the actions; the title is not a stop", await q(`return [...root.querySelectorAll("a[href],button,[tabindex]")].map((n)=>n.dataset.slot)`), ["page-header-back", "button", "button"]);
    await p.eval(`document.querySelector(${JSON.stringify(R)}).querySelector("[data-slot=page-header-back]").focus()`);
    check("the back link takes focus", await q(`return document.activeElement===part("back")`), true);

    await open(1);
    check("title only: no back, description or actions part", await q(`return ["back","description","actions"].map((s)=>!!part(s))`), [false, false, false]);

    await open(2);
    check("back without an href: a button of type button", await q(`const b=part("back");return [b.tagName,b.getAttribute("type"),b.hasAttribute("href")]`), ["BUTTON", "button", false]);

    await open(3);
    check("pane: ≥44px row, 16px in at both ends, a line hairline under it", await q(`const cs=getComputedStyle(root);return [Math.round(box(root).height)>=44,cs.paddingInlineStart,cs.paddingInlineEnd,cs.borderBottomWidth,cs.borderBottomColor===(()=>{const d=document.createElement("span");d.style.color="var(--fndn-line)";root.append(d);const c=getComputedStyle(d).color;d.remove();return c})()]`), [true, "16px", "16px", "1px", true]);
    check("pane: 13px/600 title, 12px ink-2 description beside it on its baseline", await q(`const t=part("title"),d=part("description");const tc=getComputedStyle(t),dc=getComputedStyle(d);return [tc.fontSize,tc.fontWeight,dc.fontSize,dc.color===ink("ink-2"),box(d).left>box(t).right,Math.abs(box(d).bottom-box(t).bottom)<2]`), ["13px", "600", "12px", true, true, true]);
    check("pane: the action centred in the row", await q(`const a=box(part("actions")),rb=box(root);return Math.abs((a.top+a.bottom)/2-(rb.top+rb.bottom-1)/2)<1.5`), true);

    await open(4);
    check("level 2: an h2 that looks like the h1", await q(`const t=part("title");return [t.tagName,getComputedStyle(t).fontSize]`), ["H2", "20px"]);

    await open(5);
    check("pane at phone width: the action stays on the title's row (the text keeps 8rem, not 10)", await q(`const a=box(part("actions")),t=box(part("title"));return a.top<t.bottom&&a.bottom>t.top`), true);

    await open(2, "&dir=rtl");
    check("right-to-left, a Latin label: the arrow at the page's start, before the label", await q(`const b=part("back");const i=box(b.querySelector("svg"));const rb=box(root);const r=document.createRange();r.selectNodeContents(b.lastChild);const l=r.getBoundingClientRect();return [Math.abs(i.right-rb.right)<1,l.right<=i.left]`), [true, true]);

    /* worst cases: nothing cut, nothing overflowing, the actions under the text when they do not fit */
    const fits = `const all=[root,...root.querySelectorAll("*")];const rb=box(root);return [all.every((n)=>n.scrollWidth<=n.clientWidth+1||getComputedStyle(n).display==="contents"||n.tagName==="svg"||n.closest("svg")),all.filter((n)=>n.tagName!=="svg"&&!n.closest("svg")).every((n)=>{const b=box(n);return b.width===0||(b.left>=rb.left-1&&b.right<=rb.right+1)}),[...root.querySelectorAll("*")].every((n)=>getComputedStyle(n).textOverflow!=="ellipsis"||n.scrollWidth<=n.clientWidth)]`;
    await open(0, "&data=worst");
    check("long, 358px: nothing overflows, nothing cut", await q(fits), [true, true, true]);
    check("long, 358px: the actions drop under the description, at its start, wrapping", await q(`const a=box(part("actions")),d=box(part("description")),t=box(part("title"));return [a.top>=d.bottom,Math.abs(a.left-t.left)<1]`), [true, true]);
    await open(1, "&data=worst");
    check("unbroken title, many actions: nothing overflows", await q(fits), [true, true, true]);
    check("…the title keeps at least 10rem", await q(`return box(part("text")).width>=160`), true);
    await open(4, "&data=worst");
    check("pane, long and narrow: nothing overflows", await q(fits), [true, true, true]);
    check("…the back link stays on the title's first line", await q(`return Math.abs(box(part("back")).top-box(part("title")).top)<1.5`), true);
    await open(5, "&data=worst");
    check("empty description and no actions: neither part", await q(`return [!!part("description"),!!part("actions")]`), [false, false]);

    await open(2, "&data=worst&dir=rtl");
    check("right-to-left: the arrow mirrored, the back link and title at the right edge, actions at the left", await q(`const i=part("back").querySelector("svg");const rb=box(root);return [getComputedStyle(i).transform.startsWith("matrix(-1"),Math.abs(box(part("back")).right-rb.right)<1,Math.abs(box(part("title")).right-rb.right)<1,Math.abs(box(part("actions")).left-rb.left)<1]`), [true, true, true, true]);
    check("no console errors", p.errors.slice(0, 2), []);
  } catch (e) { failed++; checks.push(`✗ threw: ${e.message.split("\n")[0]}`); }
  if (failed > before && attempt < 2) { console.log(`  (retrying ${fw}: ${checks.filter((c) => c.startsWith("✗")).join("; ").slice(0, 200)})`); failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
