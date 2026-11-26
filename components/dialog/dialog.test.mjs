// Keyboard and pointer contract of the Dialog, run against every target through the harness.
//   node components/dialog/dialog.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const T = "#stage [data-dialog=trigger]";
const C = "[data-slot=dialog-content]";
const p = await launch();
let failed = 0;
const ready = async () => { for (let t = 0; t < 60; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); } await sleep(300); };
for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
  const q = (js) => p.eval(js).catch((e) => `error: ${e.message.split("\n")[0].slice(0, 120)}`);
  const state = () => q(`document.querySelector(${JSON.stringify(C)}).getAttribute("data-state")`);
  const focusOnTrigger = () => q(`document.activeElement === document.querySelector(${JSON.stringify(T)})`);
  const focused = () => q(`(()=>{const a=document.activeElement;const c=document.querySelector(${JSON.stringify(C)});return c.contains(a)?(a.getAttribute("aria-label")||a.textContent.trim()):"outside"})()`);

  /* Message: an ordinary dialog */
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=dialog&fw=${fw}&ex=1`, 300); await ready();
  check("trigger announces a dialog", await q(`(()=>{const t=document.querySelector(${JSON.stringify(T)});return [t.getAttribute("aria-haspopup"),t.getAttribute("aria-expanded")]})()`), ["dialog", "false"]);
  await p.clickSel(T).catch(() => {}); await sleep(450);
  check("click opens; focus moves to the first control", [await state(), await focused()], ["open", "Close"]);
  check("modal, labelled and described", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return [c.getAttribute("role"),c.getAttribute("aria-modal"),document.getElementById(c.getAttribute("aria-labelledby"))?.textContent.trim(),!!document.getElementById(c.getAttribute("aria-describedby"))]})()`), ["dialog", "true", "Rollout plan for this weekend", true]);
  check("window is centred, at most 440px wide", await q(`(()=>{const b=document.querySelector(${JSON.stringify(C)}).getBoundingClientRect();return [Math.abs(b.left+b.width/2-innerWidth/2)<=1,Math.abs(b.top+b.height/2-innerHeight/2)<=1,b.width<=440]})()`), [true, true, true]);
  check("page behind is hidden from assistive tech and does not scroll", await q(`[document.querySelector("#stage").closest("[aria-hidden='true'],[inert]")!==null, getComputedStyle(document.body).overflow]`), [true, "hidden"]);
  check("backdrop is open behind the window", await q(`document.querySelector("[data-slot=dialog-backdrop]").getAttribute("data-state")`), "open");
  const seen = [];
  for (let i = 0; i < 5; i++) { await p.key("Tab"); await sleep(40); seen.push(await focused()); }
  check("Tab cycles inside the window", seen, ["Not now", "Approve plan", "Close", "Not now", "Approve plan"]);
  await p.key("Tab", { shift: true }); await sleep(40); await p.key("Tab", { shift: true }); await sleep(40); await p.key("Tab", { shift: true }); await sleep(40);
  check("Shift+Tab wraps backwards", await focused(), "Approve plan");
  await p.key("Escape"); await sleep(350);
  check("Escape closes and returns focus to the trigger", [await state(), await focusOnTrigger()], ["closed", true]);
  check("page is interactive again and scrolls", await q(`[document.querySelector("#stage").closest("[aria-hidden='true'],[inert]")===null, getComputedStyle(document.body).overflow]`), [true, "visible"]);
  await p.key("Enter"); await sleep(300);
  check("Enter on the trigger opens; keyboard open is instant", [await state(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(C)})).transitionDuration.split(",").every((d)=>parseFloat(d)===0)`)], ["open", true]);
  await p.click(12, 12); await sleep(350);
  check("backdrop click closes; focus returns", [await state(), await focusOnTrigger()], ["closed", true]);
  await p.clickSel(T).catch(() => {}); await sleep(450);
  check("pointer open animates (duration.slow)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(C)})).transitionDuration.split(",")[0]`), "0.25s");
  check("backdrop dims with the scrim token", await q(`getComputedStyle(document.querySelector("[data-slot=dialog-backdrop]")).backgroundColor === getComputedStyle(document.documentElement).getPropertyValue("--fndn-scrim").trim() || getComputedStyle(document.querySelector("[data-slot=dialog-backdrop]")).backgroundColor`), true);
  await p.clickSel(`${C} [data-slot=dialog-footer] > [data-slot=button]:last-child`).catch(() => {}); await sleep(350);
  check("an action closes it and returns focus", [await state(), await focusOnTrigger()], ["closed", true]);
  /* the close button is a Button (ghost, sm, square, rounded, muted) with a tooltip */
  await p.clickSel(T).catch(() => {}); await sleep(450);
  check("close is a 28px square rounded ghost Button (radius.chip, as a 28px field)", await q(`(()=>{const b=document.querySelector("[data-dialog=close]");const r=b.getBoundingClientRect();return [b.dataset.slot==="button",r.width,r.height,getComputedStyle(b).borderRadius]})()`), [true, 28, 28, "6px"]);
  const cb = await q(`(()=>{const r=document.querySelector("[data-dialog=close]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await p.hover(cb.x, cb.y); await sleep(800);
  check("hovering the close button shows its tooltip", await q(`[...document.querySelectorAll("[data-slot=tooltip][data-state=open] [data-slot=tooltip-label]")].map((t)=>t.textContent)`), ["Close"]);
  await p.click(cb.x, cb.y); await sleep(350);
  check("clicking it closes and returns focus", [await state(), await focusOnTrigger()], ["closed", true]);

  /* the trigger and footer Buttons the dialog renders are in the app's shape; the close button keeps its own */
  const shapes = (sel) => q(`(()=>{const d=document.createElement("i");d.style.borderRadius="var(--fndn-radius-chip)";document.body.append(d);const chip=getComputedStyle(d).borderTopLeftRadius;d.remove();return [...document.querySelectorAll(${JSON.stringify(sel)})].map((b)=>{const r=getComputedStyle(b).borderTopLeftRadius;return r===chip?"rounded":parseFloat(r)>=b.getBoundingClientRect().height/2-0.5?"pill":r})})()`);
  const own = `${T}, ${C} [data-slot=dialog-footer] > [data-slot=button]`;
  await p.clickSel(T).catch(() => {}); await sleep(450);
  const closeShape = await q(`getComputedStyle(document.querySelector("[data-dialog=close]")).borderRadius`);
  check("the trigger and footer actions are in the app's shape: pills", await shapes(own), ["pill", "pill", "pill"]);
  await q(`document.documentElement.dataset.shape="rounded"`); await sleep(60);
  check("in a rounded app (data-shape on <html>) they are rounded; the close button is unchanged", [await shapes(own), await q(`getComputedStyle(document.querySelector("[data-dialog=close]")).borderRadius`)], [["rounded", "rounded", "rounded"], closeShape]);
  await q(`delete document.documentElement.dataset.shape`);
  await p.key("Escape"); await sleep(350);

  /* initialFocus: the Message example mounted alone with a selector for its last action */
  await p.goto(`${BASE}/harness.html?c=none`, 300);
  await q(`(async()=>{const m=await import("/src/harness/mount.ts");const spec=(await (await import("/src/harness/specs.ts")).specOf("dialog"));const ex=spec.examples[1];await m.mountExample(document.querySelector("#stage"),{...spec,examples:[{...ex,props:{...ex.props,initialFocus:"[data-slot=dialog-footer] > [data-slot=button]:last-child"}}]},${JSON.stringify(fw)},0);})()`);
  await sleep(400);
  await p.clickSel(T).catch(() => {}); await sleep(450);
  check("initialFocus: the selector's element takes focus when it opens", [await state(), await focused()], ["open", "Approve plan"]);
  await p.key("Escape"); await sleep(350);
  check("initialFocus: Escape still returns focus to the trigger", [await state(), await focusOnTrigger()], ["closed", true]);

  /* placement top (a command palette): pinned min(15vh, 120px) below the top, scaling from its top
   * edge, so a window whose height changes keeps its top where it is */
  await p.goto(`${BASE}/harness.html?c=none`, 300);
  await q(`(async()=>{const m=await import("/src/harness/mount.ts");const spec=(await (await import("/src/harness/specs.ts")).specOf("dialog"));const ex=spec.examples[1];await m.mountExample(document.querySelector("#stage"),{...spec,examples:[{...ex,props:{...ex.props,placement:"top"}}]},${JSON.stringify(fw)},0);})()`);
  await sleep(400);
  await p.clickSel(T).catch(() => {}); await sleep(450);
  const topOf = `(()=>{const c=document.querySelector(${JSON.stringify(C)});const b=c.getBoundingClientRect();return Math.round(b.top)})()`;
  const top1 = await q(topOf);
  await q(`document.querySelector("${C} [data-slot=dialog-body], ${C} [data-slot=dialog-description]").style.minHeight="200px"`); await sleep(50);
  check("placement top: pinned at min(15vh, 120px), top edge kept as it grows, scales from the top", [top1, await q(topOf), await q(`getComputedStyle(document.querySelector(${JSON.stringify(C)})).transformOrigin.split(" ")[1]`)], [Math.round(Math.min(900 * 0.15, 120)), Math.round(Math.min(900 * 0.15, 120)), "0px"]);
  await p.key("Escape"); await sleep(350);

  /* instant (a command palette): a pointer open and close have no transition at all */
  await p.goto(`${BASE}/harness.html?c=none`, 300);
  await q(`(async()=>{const m=await import("/src/harness/mount.ts");const spec=(await (await import("/src/harness/specs.ts")).specOf("dialog"));const ex=spec.examples[1];await m.mountExample(document.querySelector("#stage"),{...spec,examples:[{...ex,props:{...ex.props,instant:true}}]},${JSON.stringify(fw)},0);})()`);
  await sleep(400);
  await p.clickSel(T).catch(() => {}); await sleep(150);
  const still = `["${C}","[data-slot=dialog-backdrop]"].map((s)=>{const e=document.querySelector(s);return e?getComputedStyle(e).transitionProperty==="none"&&e.getAnimations().length===0:"none"})`;
  check("instant: a pointer open is at rest at once, window and backdrop", [await state(), await q(still), await q(`getComputedStyle(document.querySelector(${JSON.stringify(C)})).opacity`)], ["open", [true, true], "1"]);
  await p.clickSel(`${C} [data-dialog=close]`).catch(() => {}); await sleep(100);
  check("instant: a pointer close leaves at once", await q(`(()=>{const c=document.querySelector(${JSON.stringify(C)});return !c||getComputedStyle(c).display==="none"||c.hidden})()`), true);

  /* a phone at 320px: the actions share the footer row, each grows to fill it. Headless Chromium
   * cannot report a coarse pointer, so the recipe's phone rules (pointer: coarse and max-width:
   * 480px) are found in the page's stylesheets and applied unconditionally */
  await p.viewport(320, 640, 1, true);
  await p.goto(`${BASE}/harness.html?c=dialog&fw=${fw}&ex=0`, 300); await ready();
  await p.clickSel(T).catch(() => {}); await sleep(450);
  check("320px phone: footer buttons share the row and fill it, inside the window", await q(`(()=>{const phone=[];const walk=(rules)=>{for(const r of rules){if(r.conditionText?.includes("coarse")&&r.conditionText.includes("480px"))phone.push(...[...r.cssRules].map((x)=>x.cssText));else if(r.cssRules)walk(r.cssRules)}};for(const s of document.styleSheets){try{walk(s.cssRules)}catch{}}const st=document.createElement("style");st.textContent=phone.join("\\n");document.head.append(st);const f=document.querySelector("[data-slot=dialog-footer]");const fb=f.getBoundingClientRect();const pad=parseFloat(getComputedStyle(f).paddingLeft);const b=[...f.querySelectorAll(":scope > [data-slot=button]")].map((e)=>e.getBoundingClientRect());const out=[phone.some((c)=>c.includes("data-slot")&&c.includes("flex: 1 1 auto")),b.length,Math.abs(b[0].top-b[1].top)<1,Math.abs(b[0].left-fb.left-pad)<1&&Math.abs(fb.right-pad-b[1].right)<1,b.every((r)=>r.right<=320&&r.left>=0)];st.remove();return out})()`), [true, 2, true, true, true]);
  await p.key("Escape"); await sleep(300);
  await p.viewport(1280, 900, 1, false);

  /* Confirm: alertdialog */
  await p.goto(`${BASE}/harness.html?c=dialog&fw=${fw}&ex=0`, 300); await ready();
  await p.clickSel(T).catch(() => {}); await sleep(450);
  check("alertdialog: role, focus on the first (safest) action", [await q(`document.querySelector(${JSON.stringify(C)}).getAttribute("role")`), await focused()], ["alertdialog", "Cancel"]);
  await p.click(12, 12); await sleep(350);
  check("alertdialog: backdrop click does not close it", [await state(), await focused()], ["open", "Cancel"]);
  await p.key("Tab"); await sleep(40); const a1 = await focused(); await p.key("Tab"); await sleep(40); const a2 = await focused();
  check("alertdialog: Tab cycles between the two actions", [a1, a2], ["Delete project", "Cancel"]);
  await p.key("Escape"); await sleep(350);
  check("alertdialog: Escape closes and returns focus", [await state(), await focusOnTrigger()], ["closed", true]);

  /* Mounted open: nothing animates because it mounted. The example is mounted in the page and its
   * first frames are read there: window and backdrop at their final opacity and scale, no transition
   * running. Its close and a later open from the pointer still animate. */
  const frames = (mount) => q(`(async()=>{${mount}const out=[];for(let i=0;i<4;i++){await new Promise((r)=>requestAnimationFrame(r));const c=document.querySelector(${JSON.stringify(C)}),b=document.querySelector("[data-slot=dialog-backdrop]");out.push([c?.dataset.state,getComputedStyle(c).opacity,getComputedStyle(c).transform,getComputedStyle(b).opacity,c.getAnimations().length+b.getAnimations().length])}return out})()`);
  const moving = (out) => out.some(([, o, t, bo, n]) => o !== "1" || t !== "matrix(1, 0, 0, 1, 0, 0)" || bo !== "1" || n > 0);
  await p.goto(`${BASE}/harness.html?c=none`, 300);
  const first = await frames(`const m=await import("/src/harness/mount.ts");const spec=await (await import("/src/harness/specs.ts")).specOf("dialog");await m.mountExample(document.querySelector("#stage"),spec,${JSON.stringify(fw)},spec.examples.findIndex((e)=>e.name==="Mounted open"));`);
  check("mounted open: drawn at once, window and backdrop at rest from the first frame", [first[0]?.[0], moving(first)], ["open", false]);
  await p.clickSel(`${C} [data-dialog=close]`).catch(() => {});
  const leaving = await frames("");
  check("mounted open: its close from the pointer still animates", [leaving[0]?.[0], moving(leaving), await q(`document.querySelector(${JSON.stringify(C)}).hasAttribute("data-mounted-open")`)], ["closed", true, false]);
  await sleep(350);
  const reopen = await frames(`document.querySelector(${JSON.stringify(T)}).click();`);
  check("mounted open: opened again from the pointer, it animates", [reopen[reopen.length - 1]?.[0], moving(reopen)], ["open", true]);
  await sleep(350);

  /* An action that names a form: the Rename project example (examples/rename-project), mounted in
   * this framework. Its Rename button submits the form in the body; the browser checks the required
   * field, and the form's submit (not the click) closes the dialog. */
  const FIELD = `${C} form input`;
  const RENAME = `${C} [data-slot=dialog-footer] > [data-slot=button]:last-child`;
  const urlText = () => q(`[...document.querySelectorAll("#stage div")].find((d)=>d.children.length===0&&d.textContent.startsWith("northwind.dev/"))?.textContent`);
  await p.goto(`${BASE}/harness.html?c=none`, 300);
  const mountFn = { react: "mountReactExample", vue: "mountVueExample", svelte: "mountSvelteExample" }[fw];
  const mountFile = { react: "mount-react.tsx", vue: "mount-vue.ts", svelte: "mount-svelte.ts" }[fw];
  await q(`(async()=>{const m=await import("/src/lib/${mountFile}");await m.${mountFn}(document.querySelector("#stage"),"dialog","rename-project","ltr");})()`);
  await sleep(400);
  await p.clickSel(T).catch(() => {}); await sleep(450);
  check("form action: Rename is type=submit form=<id>; Cancel stays a plain button", await q(`[...document.querySelectorAll("${C} [data-slot=dialog-footer] > [data-slot=button]")].map((b)=>[b.textContent.trim(),b.type,b.getAttribute("form")])`), [["Cancel", "button", null], ["Rename", "submit", "rename-project-form"]]);
  check("form action: the field takes focus and is required", await q(`[document.activeElement===document.querySelector(${JSON.stringify(FIELD)}),document.querySelector(${JSON.stringify(FIELD)}).required]`), [true, true]);
  await q(`document.querySelector(${JSON.stringify(FIELD)}).select()`); await p.key("Backspace"); await sleep(60);
  await p.key("Enter"); await sleep(350);
  check("form action: Enter in an empty required field is refused; the dialog stays open", [await state(), await q(`document.querySelector(${JSON.stringify(FIELD)}).validity.valueMissing`), await urlText()], ["open", true, "northwind.dev/billing-api"]);
  await p.clickSel(RENAME).catch(() => {}); await sleep(350);
  check("form action: a click on Rename with the field empty is refused too", [await state(), await urlText()], ["open", "northwind.dev/billing-api"]);
  await q(`document.querySelector(${JSON.stringify(FIELD)}).focus()`);
  await p.type("billing-v2"); await sleep(60);
  await p.key("Enter"); await sleep(450);
  check("form action: Enter in the field submits it, renames, closes and returns focus", [await state(), await urlText(), await focusOnTrigger()], ["closed", "northwind.dev/billing-v2", true]);
  await p.clickSel(T).catch(() => {}); await sleep(450);
  await q(`document.querySelector(${JSON.stringify(FIELD)}).select()`); await p.type("ledger"); await sleep(60);
  await p.clickSel(RENAME).catch(() => {}); await sleep(450);
  check("form action: a click on Rename with a valid field submits and closes", [await state(), await urlText()], ["closed", "northwind.dev/ledger"]);

  /* the fixture "Submits a form", with close: false and a form put in its body by the test: a
   * valid submit calls the action and leaves the dialog open */
  await p.goto(`${BASE}/harness.html?c=none`, 300);
  await q(`(async()=>{const m=await import("/src/harness/mount.ts");const spec=await (await import("/src/harness/specs.ts")).specOf("dialog");const ex=spec.examples.find((e)=>e.name==="Submits a form");await m.mountExample(document.querySelector("#stage"),{...spec,examples:[{...ex,props:{...ex.props,actions:ex.props.actions.map((a)=>a.form?{...a,close:false}:a),[${JSON.stringify(fw === "svelte" ? "onaction" : "onAction")}]:(v)=>(window.__actions??=[]).push(v)}}]},${JSON.stringify(fw)},0);})()`);
  await sleep(400);
  await p.clickSel(T).catch(() => {}); await sleep(450);
  await q(`(()=>{const f=document.createElement("form");f.id="rename-project-form";f.innerHTML='<input name="name" required value="ledger">';f.addEventListener("submit",(e)=>{e.preventDefault();window.__submits=(window.__submits??0)+1});document.querySelector("${C} [data-slot=dialog-body]").append(f)})()`);
  await p.clickSel(RENAME).catch(() => {}); await sleep(350);
  check("form action with close: false: a valid submit calls the action once and the dialog stays open", [await q(`window.__submits`), await q(`window.__actions`), await state()], [1, ["rename"], "open"]);
  await q(`document.querySelector(${JSON.stringify(FIELD)}).focus()`); await p.key("Enter"); await sleep(350);
  check("form action with close: false: Enter submits again, still open", [await q(`window.__submits`), await q(`window.__actions`), await state()], [2, ["rename", "rename"], "open"]);
  await q(`document.querySelector(${JSON.stringify(FIELD)}).value=""`);
  await p.clickSel(RENAME).catch(() => {}); await sleep(350);
  check("form action: a refused form calls no action", [await q(`window.__submits`), await q(`window.__actions?.length`), await state()], [2, 2, "open"]);
  await p.key("Escape"); await sleep(350);

  /* a dialog without form is unchanged: its actions are plain buttons (they close on click, above) */
  await p.goto(`${BASE}/harness.html?c=dialog&fw=${fw}&ex=1`, 300); await ready();
  await p.clickSel(T).catch(() => {}); await sleep(450);
  check("no form: the actions are type=button with no form attribute", await q(`[...document.querySelectorAll("${C} [data-slot=dialog-footer] > [data-slot=button]")].map((b)=>[b.type,b.hasAttribute("form")])`), [["button", false], ["button", false]]);
  await p.key("Enter"); await sleep(350);
  check("no form: Enter on the focused first control does what it did (the close button closes)", await state(), "closed");
  check("no console errors", p.errors.slice(0, 2), []);
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
