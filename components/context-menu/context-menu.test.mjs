// Context menu: a right-click on the area opens the Menu at the pointer (the Menu's popup and
// rows), the highlight glides, an action closes it; sub-menus open on hover and with ArrowRight,
// close with ArrowLeft, and their first row lines up with the row that opened them; a pick in a
// sub-menu closes the whole menu; the area is focusable and Shift+F10 / the Menu key open the menu
// from the keyboard, Escape returns focus to it; disabled keeps the browser's menu; worst cases, rtl, dark.
//   node components/context-menu/context-menu.test.mjs [react …]   (default: the spec's targets)
const C = "context-menu";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const A = "#stage [data-slot=context-menu]";
const ready = async (search) => { for (let t = 0; t < 80; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(A)})`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
/* a right-click: the contextmenu event at a point, as the browser sends it */
const rightClick = (x, y) => q(`(()=>{const el=document.elementFromPoint(${x},${y});const e=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:${x},clientY:${y},button:2});el.dispatchEvent(e);return e.defaultPrevented})()`);
/* the open popups, outermost first: [highlighted row text] */
const menus = () => q(`[...document.querySelectorAll("[data-slot=menu-content][data-state=open]")].sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left).map((c)=>c.querySelector(":scope > [data-highlighted] [data-slot=menu-item-text]")?.textContent ?? "-")`);
const row = (text) => q(`(()=>{const r=[...document.querySelectorAll("[data-slot=menu-content][data-state=open] [data-slot=menu-item]")].find((e)=>e.querySelector("[data-slot=menu-item-text]").textContent===${JSON.stringify(text)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,top:r.top,left:r.left,right:r.right}})()`);

async function run(fw, check) {
  await open(fw, 0);
  const a = await p.rect(A);
  const px = Math.round(a.x + 30), py = Math.round(a.y + 20);
  check("a right-click on the area is taken (the browser's menu does not open)", await rightClick(px, py), true);
  await sleep(350);
  check("the Menu opens with its corner at the pointer (within the popup's 4px padding): its popup, its rows", await q(`(()=>{const c=document.querySelector("[data-slot=menu-content][data-state=open]");const b=c.getBoundingClientRect();return [c.getAttribute("role"),Math.abs(b.left-${px})<=4,Math.abs(b.top-${py})<=1,c.querySelectorAll("[data-slot=menu-item]").length]})()`), ["menu", true, true, 4]);
  check("the same popup as the Menu (recipe: radius.card, the raised shadow)", await q(`(()=>{const cs=getComputedStyle(document.querySelector("[data-slot=menu-content][data-state=open]"));return [cs.borderRadius,cs.padding]})()`), ["10px", "4px"]);
  const dup = await row("Duplicate");
  await p.hover(dup.x, dup.y); await sleep(300);
  check("hover highlights a row; the glide layer travels to it", [await menus(), await q(`document.querySelector("[data-slot=menu-content][data-state=open] [data-slot=menu-highlight]").hasAttribute("data-visible")`)], [["Duplicate"], true]);
  await p.click(dup.x, dup.y); await sleep(300);
  check("an action closes it", (await menus()).length, 0);
  await rightClick(px, py); await sleep(300);
  await p.key("ArrowDown"); await sleep(60); await p.key("ArrowDown"); await sleep(60); await p.key("ArrowDown"); await sleep(60);
  check("keyboard: ArrowDown moves the highlight and skips the disabled row", await menus(), ["Delete"]);
  await p.key("Escape"); await sleep(250);
  check("Escape closes", (await menus()).length, 0);

  /* keyboard only: the area is focusable by itself; Shift+F10 and the Menu key open the menu, Escape
   * brings focus back to the area */
  const sendKey = async (key, code, vk, modifiers = 0) => { await p.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers }); await p.send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers }); };
  const where = () => q(`document.activeElement?.dataset.slot ?? document.activeElement?.tagName`);
  await p.click(5, 5); await sleep(60);
  await p.key("Tab"); await sleep(80);
  check("Tab reaches the area: focusable, a named group with its shortcut, the focus ring", [await where(), await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});return [a.getAttribute("role"),a.getAttribute("aria-keyshortcuts"),getComputedStyle(a).outlineStyle]})()`)], ["context-menu", ["group", "Shift+F10", "solid"]]);
  await sendKey("F10", "F10", 121, 8); await sleep(300);
  check("Shift+F10 on the area opens the menu, focus in it", [(await menus()).length, await where()], [1, "menu-content"]);
  await p.key("Escape"); await sleep(250);
  check("Escape closes it and focus is back on the area", [(await menus()).length, await where()], [0, "context-menu"]);
  await sendKey("ContextMenu", "ContextMenu", 93); await sleep(300);
  check("the Menu key opens it too", (await menus()).length, 1);
  await p.key("Escape"); await sleep(250);

  /* sub-menus */
  await open(fw, 1);
  await rightClick(px, py); await sleep(350);
  const move = await row("Move to");
  await p.hover(move.x, move.y); await sleep(450);
  check("hovering a sub-menu row opens its menu beside it; the row keeps the highlight", await menus(), ["Move to", "-"]);
  check("the sub-menu row ends with a caret", await q(`!!document.querySelector("[data-slot=menu-content][data-state=open] [data-slot=menu-item-caret] svg")`), true);
  const first = await row("Summer menu");
  check("the sub-menu sits at the row's end, its first row level with the row", [Math.abs(first.left - move.right) <= 14, Math.abs(first.top - move.top) <= 1], [true, true]);
  /* the sub-menu panel stands 4px clear of the parent panel, which it never overlaps */
  check("the sub-menu panel stands 4px clear of the parent panel (no overlap)", await q(`(()=>{const ps=[...document.querySelectorAll("[data-slot=menu-content][data-state=open]")].map((e)=>e.getBoundingClientRect());const [a,b]=ps.length===2?(ps[0].left<ps[1].left?ps:[ps[1],ps[0]]):[null,null];if(!a)return null;const gap=document.documentElement.dir==="rtl"?a.right-b.left:b.left-a.right;return Math.round(Math.abs(gap))})()`), 4);
  const winter = await row("Winter menu");
  await p.hover(first.x, move.y); await sleep(60); await p.hover(winter.x, winter.y); await sleep(300);
  check("moving into the sub-menu highlights there; the parent row stays highlighted", await menus(), ["Move to", "Winter menu"]);
  const arch = await row("Archive");
  await p.hover(arch.x, arch.y); await sleep(450);
  check("a sub-menu inside a sub-menu", (await menus()).length, 3);
  await p.click(winter.x, winter.y); await sleep(350);
  check("a pick in a sub-menu closes every level", (await menus()).length, 0);
  await rightClick(px, py); await sleep(300);
  await p.key("ArrowDown"); await sleep(60); await p.key("ArrowDown"); await sleep(60);
  await p.key("ArrowRight"); await sleep(300);
  check("ArrowRight on a sub-menu row opens it on its first row, at once", [await menus(), await q(`getComputedStyle([...document.querySelectorAll("[data-slot=menu-content][data-state=open]")].at(-1)).transitionDuration.split(", ").every((d)=>parseFloat(d)===0)`)], [["Move to", "Summer menu"], true]);
  await p.key("ArrowLeft"); await sleep(250);
  check("ArrowLeft closes the sub-menu and returns to its row", await menus(), ["Move to"]);
  await p.key("Escape"); await sleep(250);

  await open(fw, 2);
  const d = await p.rect(A);
  check("disabled: the browser's own menu (the event is left alone), nothing opens", [await rightClick(d.x + 20, d.y + 20), (await sleep(250), (await menus()).length)], [false, 0]);

  /* no pointer position, no menu: mounted open (the fixture, as the harness renders it) shows nothing
   * and moves no focus */
  await open(fw, 3);
  check("mounted open: nothing opens, focus stays where it was", [(await menus()).length, await q(`document.querySelector("[data-slot=menu-content]")?.getAttribute("data-state") !== "open"`), await q(`document.activeElement === document.body`)], [0, true, true]);
  /* the same fixture mounted controlled, its host following openChange: it is told the menu is
   * closed; after a real right-click and a close, open=true opens the menu at that pointer */
  if (fw === "react") {
    /* the harness mounts React props uncontrolled (open → defaultOpen): a small host holds `open`
     * instead, with the page's own React and adapter modules (the URLs the harness loaded) */
    await open(fw, 3);
    await q(`(async()=>{const url=(s)=>performance.getEntriesByType("resource").map((e)=>e.name).find((n)=>n.includes(s));const R=(await import(url("/deps/react.js"))).default;const D=(await import(url("/deps/react-dom_client.js"))).default;const M=await import(url("context-menu.tsx"));const spec=await (await import("/src/harness/specs.ts")).specOf("context-menu");const ex=spec.examples.find((e)=>e.name==="Mounted open");window.__harnessMounted();window.__reports=[];const Host=()=>{const [open,setOpen]=R.useState(true);window.__set=setOpen;return R.createElement(M.ContextMenu,{...ex.props,open,onOpenChange:(v)=>{window.__reports.push(["open",v]);setOpen(v)}},ex.text)};D.createRoot(document.querySelector("#stage")).render(R.createElement(Host));window.__m={update:async(p)=>window.__set(p.open)};})()`);
  } else {
    await p.goto(`${BASE}/harness.html?c=none`, 300);
    const mod = { vue: ["mount-vue.ts", "mountVue"], svelte: ["mount-svelte.ts", "mountSvelte"] }[fw];
    await q(`(async()=>{const m=await import("/src/lib/${mod[0]}");const spec=await (await import("/src/harness/specs.ts")).specOf("context-menu");const ex=spec.examples.find((e)=>e.name==="Mounted open");window.__reports=[];window.__m=await m.${mod[1]}(document.querySelector("#stage"),spec,ex,{...ex.props},"ltr",(k,v)=>{window.__reports.push([k,v]);void window.__m?.update?.({[k]:v})});})()`);
  }
  await sleep(400);
  check("controlled, mounted open: stays closed, moves no focus, reports closed", [(await menus()).length, await q(`document.activeElement === document.body`), await q(`window.__reports`)], [0, true, [["open", false]]]);
  const c = await p.rect(A);
  const cx = Math.round(c.x + 40), cy = Math.round(c.y + 16);
  await rightClick(cx, cy); await sleep(350);
  const placedAt = `(()=>{const c=document.querySelector("[data-slot=menu-content][data-state=open]");if(!c)return "closed";const b=c.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top)]})()`;
  const at = await q(placedAt);
  check("controlled: a right-click opens it at the pointer", [(await menus()).length, await q(`window.__reports.at(-1)`), Math.abs(at[0] - cx) <= 5 && Math.abs(at[1] - cy) <= 1], [1, ["open", true], true]);
  await p.key("Escape"); await sleep(300);
  check("controlled: Escape closes it", [(await menus()).length, await q(`window.__reports.at(-1)`)], [0, ["open", false]]);
  await q(`window.__m.update({open:true})`); await sleep(350);
  check("controlled: then open=true opens it where it was right-clicked, focus in it", [await q(placedAt), await q(`!!document.querySelector("[data-slot=menu-content][data-state=open]")?.contains(document.activeElement)`)], [at, true]);
  await p.key("Escape"); await sleep(300);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  const w = await p.rect(A);
  await rightClick(w.x + 20, w.y + 20); await sleep(350);
  const sub = await row("Move to a workspace with a very long name that wraps onto a second line");
  await p.hover(sub.x, sub.y); await sleep(450);
  check("worst: long rows wrap; the sub-menu opens and stays on screen", await q(`[...document.querySelectorAll("[data-slot=menu-content][data-state=open]")].map((c)=>{const b=c.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&c.scrollWidth<=c.clientWidth})`), [true, true]);
  await open(fw, 1, "&data=worst&dir=rtl");
  const rr = await p.rect(A);
  await rightClick(rr.x + rr.w - 30, rr.y + 20); await sleep(350);
  const mv = await row("نقل إلى");
  await p.hover(mv.x, mv.y); await sleep(450);
  check("rtl: the sub-menu opens to the left; its caret points left", await q(`(()=>{const all=[...document.querySelectorAll("[data-slot=menu-content][data-state=open]")];const sub=all.find((e)=>e.textContent.includes("قائمة الصيف")).getBoundingClientRect();const top=all.find((e)=>e.textContent.includes("فتح")).getBoundingClientRect();const caret=document.querySelector("[data-slot=menu-content][data-state=open] [data-slot=menu-item-caret]");return [all.length,sub.right<=top.left+6,getComputedStyle(caret).scale]})()`), [2, true, "-1 1"]);
  await open(fw, 0, "&theme=dark");
  await rightClick(px, py); await sleep(350);
  check("dark: the dark surface", await q(`getComputedStyle(document.querySelector("[data-slot=menu-content][data-state=open]")).backgroundColor`), await q(`(()=>{const d=document.createElement("div");d.style.backgroundColor="var(--fndn-surface)";document.body.append(d);const v=getComputedStyle(d).backgroundColor;d.remove();return v})()`));
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
