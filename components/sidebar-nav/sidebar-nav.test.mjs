// Keyboard and pointer contract of the Sidebar nav, run against every target through the harness.
//   node components/sidebar-nav/sidebar-nav.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const R = "#stage [data-slot=sidebar-nav]";
/* hover: true makes headless Chromium report a mouse, so the gated highlight is really shown */
const p = await launch({ hover: true });
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };

/* glyph centres relative to the root's inline-start edge */
const GLYPHS = `(()=>{const root=document.querySelector(${JSON.stringify(R)});const rb=root.getBoundingClientRect();const rtl=getComputedStyle(root).direction==="rtl";
  const x=(sel)=>[...root.querySelectorAll(sel)].map((n)=>{const b=n.getBoundingClientRect();const c=b.x+b.width/2;return +(rtl?rb.right-c:c-rb.x).toFixed(2)});
  return {items:x("[data-slot=sidebar-nav-item-icon] [data-slot=icon]"),logo:x("[data-slot=sidebar-nav-logo] [data-slot=icon]")[0],toggle:x("[data-sidebar-nav=toggle] [data-slot=icon]")[0],width:+rb.width.toFixed(2)}})()`;
const close = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= 0.5);
/* a token's computed value, through a probe element */
const token = (name, prop) => p.eval(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  try {
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js);
  const focused = () => q(`(()=>{const a=document.activeElement;if(!a||a===document.body)return null;const s=a.dataset.slot??"";const c=s.startsWith("sidebar-nav-")?s.slice(12):a.dataset.sidebarNav??(a.matches("[data-sidebar-nav=section] > [data-slot=collapsible-trigger]")?"section-trigger":s);return c+":"+(a.getAttribute("aria-label")??a.textContent.trim())})()`);
  const tabs = async (n) => { const out = []; for (let i = 0; i < n; i++) { await p.key("Tab"); out.push(await focused()); } return out; };
  const attr = (sel, name) => q(`document.querySelector(${JSON.stringify(sel)})?.getAttribute(${JSON.stringify(name)}) ?? null`);
  const tipText = () => q(`(()=>{const t=[...document.querySelectorAll("[data-slot=tooltip]")].find((n)=>n.getAttribute("data-state")==="open");return t?t.querySelector("[data-slot=tooltip-label]").textContent.trim():null})()`);
  const currentText = () => q(`[...document.querySelectorAll("${R} [aria-current=page]")].map((n)=>n.textContent.trim())`);

  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=sidebar-nav&fw=${fw}&ex=0`, 300); await ready();

  // landmarks and names
  check("a named nav landmark with lists of links", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});return [r.tagName,r.getAttribute("aria-label"),r.querySelectorAll("ul > li > a[href]").length]})()`), ["NAV", "Workspace navigation", 9]);

  // Tab order
  await p.click(5, 5);
  check("Tab order: switcher, toggle, links, Chats, chats", await tabs(8), ["workspace:Platform Ops", "toggle:Collapse sidebar", "item:New chat", "item:Home", "item:Invite users3/10", "section-trigger:Chats", "item:Supplier records", "item:Urgent to-dos this morning"]);

  // the hover highlight: gated rule in the stylesheet, and glide() under real pointer moves
  check("the highlight is shown only under (hover: hover) and (pointer: fine)", await q(`(()=>{const h=document.querySelector("#stage [data-slot=sidebar-nav-highlight]");const sel=(r)=>r.selectorText??(r.parentRule&&sel(r.parentRule));const walk=(l,gated)=>[...l].some((r)=>{const g=gated||(r.media&&/hover: hover/.test(r.media.mediaText)&&/pointer: fine/.test(r.media.mediaText));if(g&&r.style&&r.style.visibility==="visible"){const x=sel(r);try{if(x&&h.matches(x))return true}catch{}}return r.cssRules?walk(r.cssRules,g):false});return getComputedStyle(h).visibility==="visible"&&[...document.styleSheets].some((s)=>{try{return walk(s.cssRules,false)}catch{return false}})})()`), true);
  const home = await p.rect(`${R} [data-slot=sidebar-nav-item][data-value=home]`);
  await p.hover(home.cx, home.cy); await sleep(60);
  const invite = await p.rect(`${R} [data-slot=sidebar-nav-item][data-value=invite]`);
  await p.hover(invite.cx, invite.cy); await sleep(400);
  check("pointer: the highlight lands on the hovered row, painted", await q(`(()=>{const h=document.querySelector("${R} [data-slot=sidebar-nav-highlight]");const a=document.querySelector("${R} [data-value=invite]");const cs=getComputedStyle(h);return [h.hasAttribute("data-visible"),h.style.transform===\`translateY(\${a.offsetTop}px)\`,Math.abs(h.getBoundingClientRect().y-a.getBoundingClientRect().y)<0.5,h.style.height,cs.visibility,+cs.opacity>0]})()`), [true, true, true, "32px", "visible", true]);
  check("pointer: the highlight travels (transition on transform)", await q(`getComputedStyle(document.querySelector("${R} [data-slot=sidebar-nav-highlight]")).transitionDuration.split(",").some((d)=>parseFloat(d)>0)`), true);
  await sleep(500);
  check("expanded: an icon link shows no tooltip (its label is visible)", await tipText(), null);
  await p.hover(1000, 5); await sleep(100);
  check("pointer leaving the list hides the highlight", await q(`document.querySelector("${R} [data-slot=sidebar-nav-highlight]").hasAttribute("data-visible")`), false);

  // Enter on a link follows it and makes it current
  await p.click(5, 5);
  await tabs(5);
  await p.key("Enter"); await sleep(150);
  check("Enter on a link: it becomes the only aria-current=page", await currentText(), ["Invite users3/10"]);
  await sleep(250);
  check("keyboard focus: the highlight glides too (transform at duration.move) and lands on the row", await q(`(()=>{const g=document.querySelector("${R} [data-slot=sidebar-nav-highlight]");const row=document.activeElement.closest("${R} [data-value]") ?? document.activeElement;const cs=getComputedStyle(g);const props=cs.transitionProperty.split(",").map((s)=>s.trim());const durs=cs.transitionDuration.split(",").map((s)=>parseFloat(s)*(s.trim().endsWith("ms")?1:1000));const move=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fndn-duration-move"));return [document.documentElement.dataset.fndnInput, durs[props.indexOf("transform")]===move, !!row && Math.abs(g.getBoundingClientRect().top-row.getBoundingClientRect().top)<1]})()`), ["keyboard", true, true]);

  // workspace switcher: the menu, by keyboard
  await p.click(5, 5); await p.key("Tab");
  check("switcher announces a menu", [await attr(`${R} [data-slot=sidebar-nav-workspace]`, "aria-haspopup"), await attr(`${R} [data-slot=sidebar-nav-workspace]`, "aria-expanded")], ["menu", "false"]);
  await p.key("ArrowDown"); await sleep(200);
  const hl = () => q(`document.querySelector("[data-slot=menu-content] [data-highlighted] [data-slot=menu-item-text]")?.textContent.trim() ?? null`);
  check("ArrowDown opens the menu on the first workspace", [await attr(`${R} [data-slot=sidebar-nav-workspace]`, "data-state"), await hl()], ["open", "Platform Ops"]);
  check("the menu paints above the rail (topmost at its centre)", await q(`(()=>{const c=document.querySelector("[data-slot=menu-content]");const b=c.getBoundingClientRect();const t=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return c.contains(t)})()`), true);
  check("current workspace is the checked radio", await q(`[...document.querySelectorAll("[data-slot=menu-content] [role=menuitemradio]")].map((n)=>n.getAttribute("aria-checked"))`), ["true", "false", "false"]);
  await p.key("ArrowDown"); await sleep(60);
  await p.key("Enter"); await sleep(300);
  check("Enter picks the workspace, closes the menu, focus returns to the switcher", [await attr(`${R} [data-slot=sidebar-nav-workspace]`, "data-state"), await focused(), await q(`document.querySelector("${R} [data-slot=sidebar-nav-workspace-name]").textContent.trim()`)], ["closed", "workspace:Aurora Health", "Aurora Health"]);
  await p.key("Enter"); await sleep(250);
  check("reopened: the new workspace is checked", await q(`[...document.querySelectorAll("[data-slot=menu-content] [role=menuitemradio]")].map((n)=>n.getAttribute("aria-checked"))`), ["false", "true", "false"]);
  await p.key("Escape"); await sleep(200);
  check("Escape closes and returns focus", [await attr(`${R} [data-slot=sidebar-nav-workspace]`, "data-state"), await focused()], ["closed", "workspace:Aurora Health"]);

  // collapse with the pointer: animated, glyphs stay put
  const expanded = await q(GLYPHS);
  await p.clickSel(`${R} [data-sidebar-nav=toggle]`); await sleep(70);
  const mid = await q(`document.querySelector(${JSON.stringify(R)}).getBoundingClientRect().width`);
  check("pointer collapse animates the width (mid-flight between 52 and 224)", mid > 52 && mid < 224, true);
  await sleep(400);
  const collapsedG = await q(GLYPHS);
  check("collapsed: 52px wide", collapsedG.width, 52);
  check("rail glyphs keep their x between states (±0.5px)", [close(expanded.items, collapsedG.items), Math.abs(expanded.logo - collapsedG.toggle) <= 0.5, collapsedG.items[0]], [true, true, 26]);
  check("collapsed: labels hidden from AT, links named", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});return [[...r.querySelectorAll("[data-slot=sidebar-nav-item] [data-sidebar-nav=copy]")].every((n)=>n.getAttribute("aria-hidden")==="true"),[...r.querySelectorAll("[data-slot=sidebar-nav-item]:has([data-slot=sidebar-nav-item-icon])")].map((a)=>a.getAttribute("aria-label"))]})()`), [true, ["New chat", "Home", "Invite users"]]);
  check("collapsed toggle is named for its action", await attr(`${R} [data-sidebar-nav=toggle]`, "aria-label"), "Expand sidebar");
  check("the toggle is a Button (ghost md square rounded muted)", await q(`(()=>{const b=document.querySelector("${R} [data-sidebar-nav=toggle]");const r=b.getBoundingClientRect();return [b.dataset.slot==="button",r.width,r.height]})()`), [true, 32, 32]);
  const homeC = await p.rect(`${R} [data-slot=sidebar-nav-item][data-value=home] [data-slot=icon]`);
  await p.hover(homeC.cx, homeC.cy); await sleep(700);
  check("collapsed: an icon link shows our tooltip with its name, on the inline-end side", [await tipText(), await q(`(()=>{const t=[...document.querySelectorAll("[data-slot=tooltip]")].find((n)=>n.getAttribute("data-state")==="open");const a=document.querySelector("${R} [data-value=home]");const g=t?t.getBoundingClientRect().left-a.getBoundingClientRect().right:-1;return g>=0&&g<=12})()`)], ["Home", true]);
  check("collapsed: the highlight is a 36px square around the glyph", await q(`(()=>{const h=document.querySelector("${R} [data-slot=sidebar-nav-highlight]").getBoundingClientRect();const g=document.querySelector("${R} [data-value=home] [data-slot=icon]").getBoundingClientRect();return [Math.round(h.width),Math.abs((h.x+h.width/2)-(g.x+g.width/2))<=0.5]})()`), [36, true]);
  const tg = await p.rect(`${R} [data-sidebar-nav=toggle]`);
  await p.hover(1000, 400); await sleep(500);
  await p.hover(tg.cx, tg.cy); await sleep(700);
  check("collapsed: the toggle's tooltip names its action", await tipText(), "Expand sidebar");
  await p.hover(1000, 5); await sleep(300);
  await p.click(5, 5);
  check("collapsed Tab order: toggle, icon links, then out", await tabs(5), ["toggle:Expand sidebar", "item:New chat", "item:Home", "item:Invite users", null]);

  // expand from the keyboard: instant, focus stays on the toggle
  await p.click(5, 5); await p.key("Tab"); await p.key("Enter");
  check("keyboard expand is instant and focus stays on the toggle", [await q(`document.querySelector(${JSON.stringify(R)}).getBoundingClientRect().width`), await q(`getComputedStyle(document.querySelector("${R} [data-sidebar-nav=copy]")).transitionDuration.split(",").every((d)=>parseFloat(d)===0)`), await focused()], [224, true, "toggle:Collapse sidebar"]);
  await sleep(300);
  check("expanded again: names come from the content", await q(`[...document.querySelectorAll("${R} [data-slot=sidebar-nav-item]")].some((a)=>a.hasAttribute("aria-label"))`), false);
  await p.key(" "); await sleep(20);
  check("Space on the toggle collapses instantly", await q(`document.querySelector(${JSON.stringify(R)}).getBoundingClientRect().width`), 52);
  await p.key("Enter"); await sleep(300);

  // chats disclosure: a Collapsible
  const T = `${R} [data-sidebar-nav=section] > [data-slot=collapsible-trigger]`;
  const REGION = `${R} [data-sidebar-nav=section] > [data-slot=collapsible-content]`;
  check("Chats is a collapsible (section) wired to its region", await q(`(()=>{const s=document.querySelector("${R} [data-sidebar-nav=section]");const t=document.querySelector(${JSON.stringify(T)});const r=document.getElementById(t.getAttribute("aria-controls"));return [s.dataset.slot==="collapsible",Math.round(t.getBoundingClientRect().height),t.getAttribute("aria-expanded"),!!r&&r.matches("[data-slot=collapsible-content]"),r?.hidden]})()`), [true, 28, "true", true, false]);
  check("the Chats trigger presses with hover-2 (not the hover colour)", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});const probe=document.createElement("div");probe.style.background="var(--fndn-hover-2)";document.body.append(probe);const want=getComputedStyle(probe).backgroundColor;probe.remove();return [...document.styleSheets].some((s)=>{try{const flat=(l)=>[...l].flatMap((r)=>r.selectorText?[r]:r.cssRules?flat(r.cssRules):[]);return flat(s.cssRules).some((r)=>r.selectorText&&/:active/.test(r.selectorText)&&t.matches(r.selectorText.replace(/:active/g,""))&&/hover-2/.test(r.style.background||r.style.backgroundColor))}catch{return false}})&&!!want})()`), true);
  await p.click(5, 5); await tabs(6);
  await p.key("Enter"); await sleep(350);
  check("Enter hides the chats; focus stays on the trigger", [await attr(T, "aria-expanded"), await q(`document.querySelector(${JSON.stringify(REGION)}).hidden`), await focused()], ["false", true, "section-trigger:Chats"]);
  check("hidden chats leave the tab order", await tabs(1), [null]);
  await p.click(5, 5); await tabs(6);
  await p.key(" "); await sleep(350);
  check("Space shows them again", [await attr(T, "aria-expanded"), await tabs(1)], ["true", ["item:Supplier records"]]);

  // the collapsed example and right-to-left
  await p.goto(`${BASE}/harness.html?c=sidebar-nav&fw=${fw}&ex=1`, 300); await ready();
  const c = await q(GLYPHS);
  check("Collapsed example: 52px, glyphs at 26px", [c.width, c.items, c.toggle], [52, [26, 26, 26], 26]);
  await p.goto(`${BASE}/harness.html?c=sidebar-nav&fw=${fw}&ex=0&dir=rtl`, 300); await ready();
  const rtlE = await q(GLYPHS);
  await p.clickSel(`${R} [data-sidebar-nav=toggle]`); await sleep(450);
  const rtlC = await q(GLYPHS);
  check("right-to-left: glyphs at 26px from the right in both states", [rtlE.items, rtlE.logo, rtlC.items, rtlC.toggle, rtlC.width], [[26, 26, 26], 26, [26, 26, 26], 26, 52]);
  const homeR = await p.rect(`${R} [data-slot=sidebar-nav-item][data-value=home] [data-slot=icon]`);
  await p.hover(homeR.cx, homeR.cy); await sleep(700);
  check("right-to-left: the collapsed link's tooltip sits on the inline-end (left) side, next to the rail", await q(`(()=>{const t=[...document.querySelectorAll("[data-slot=tooltip]")].find((n)=>n.getAttribute("data-state")==="open");const a=document.querySelector("${R} [data-value=home]");const g=t?a.getBoundingClientRect().left-t.getBoundingClientRect().right:-1;return [t?.textContent.trim()??null,g>=0&&g<=12,getComputedStyle(a).direction]})()`), ["Home", true, "rtl"]);

  /* sections: each labelled and folding on its own, in one scroller; one text edge for every link */
  await p.goto(`${BASE}/harness.html?c=sidebar-nav&fw=${fw}&ex=3`, 300); await ready();
  check("sections: Projects and Saved views, each a section collapsible with its own label; no Chats (none given); one scroller", await q(`(()=>{const r=document.querySelector(${JSON.stringify(R)});const w=r.querySelector("[data-slot=sidebar-nav-sections]");return [[...r.querySelectorAll("[data-sidebar-nav=section] > [data-slot=collapsible-trigger]")].map((t)=>t.textContent.trim()),getComputedStyle(w).overflowY,r.querySelector("[data-slot=sidebar-nav-logo] svg")!==null]})()`), [["Projects", "Saved views"], "auto", true]);
  check("one text edge: every link's label starts at the same x, with or without an icon", await q(`(()=>{const xs=[...document.querySelectorAll("${R} [data-slot=sidebar-nav-label]")].map((l)=>Math.round(l.getBoundingClientRect().x*4)/4);return [new Set(xs).size,xs.length]})()`), [1, 6]);
  check("current: the section link billing-api is aria-current=page", await currentText(), ["billing-api"]);
  const projects = `${R} [data-sidebar-nav=section]:first-of-type > [data-slot=collapsible-trigger]`;
  await p.clickSel(projects); await sleep(450);
  check("folding Projects leaves Saved views open", await q(`[...document.querySelectorAll("${R} [data-sidebar-nav=section] > [data-slot=collapsible-trigger]")].map((t)=>t.getAttribute("aria-expanded"))`), ["false", "true"]);
  await q(`(()=>{window.__nav=[];document.querySelector(${JSON.stringify(R)}).addEventListener("click",(e)=>{const a=e.target.closest("a");if(a)window.__nav.push(a.getAttribute("href"))})})()`);
  await p.clickSel(`${R} [data-slot=sidebar-nav-item][data-value=triage]`); await sleep(150);
  check("a click on a section link follows it and makes it current", [await q(`window.__nav`), await currentText()], [["#triage"], ["Needs triage"]]);

  /* size sm (example 4) against md (example 0): 28px rows, 13px text, 16px glyphs; the glyph centre and the label column do not move */
  const geo = () => q(`(()=>{const r=document.querySelector(${JSON.stringify(R)}).getBoundingClientRect();const it=document.querySelector("${R} [data-slot=sidebar-nav-item]");const g=it.querySelector("[data-slot=sidebar-nav-item-icon] svg").getBoundingClientRect();const l=it.querySelector("[data-slot=sidebar-nav-label]").getBoundingClientRect();return [Math.round(it.getBoundingClientRect().height),getComputedStyle(it).fontSize,Math.round(g.width),Math.round(g.left+g.width/2-r.left),Math.round(l.left-r.left),[getComputedStyle(it,"::before").borderRadius,getComputedStyle(document.querySelector("${R} [data-slot=sidebar-nav-highlight]")).borderRadius,getComputedStyle(document.querySelector("${R} [data-slot=sidebar-nav-workspace]")).borderRadius]]})()`);
  await p.goto(`${BASE}/harness.html?c=sidebar-nav&fw=${fw}&ex=0`, 300); await ready();
  const md = await geo();
  await p.goto(`${BASE}/harness.html?c=sidebar-nav&fw=${fw}&ex=4`, 300); await ready();
  const sm = await geo();
  check("size sm: 28px rows, 13px text, 16px glyphs; glyph centre and label column as at md", [sm.slice(0, 3), sm[3] === md[3], sm[4] === md[4], md.slice(0, 3)], [[28, "13px", 16], true, true, [32, "14px", 18]]);
  const radius = async (name) => { const v = await token(name, "borderRadius"); return [v, v, v]; };
  check("radius steps with the row: chip at sm (28px: the row's fill and ring, the highlight, the switcher), control at md", [sm[5], md[5]], [await radius("--fndn-radius-chip"), await radius("--fndn-radius-control")]);

  check("no console errors", p.errors.slice(0, 2), []);
  } catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
