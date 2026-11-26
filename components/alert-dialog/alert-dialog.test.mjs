// Alert dialog: the Dialog with role=alertdialog (compared with the Dialog's own window), focus on
// Cancel, a click outside does nothing, Tab cycles the two actions, Escape and Cancel cancel, the
// action closes, keyboard open instant, the neutral tone's primary action, worst cases, rtl, dark.
//   node components/alert-dialog/alert-dialog.test.mjs [react …]   (default: the spec's targets)
const C = "alert-dialog";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const T = "#stage [data-dialog=trigger]";
const W = "[data-slot=dialog-content]";
const ready = async (search) => { for (let t = 0; t < 80; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(T)})`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const state = () => q(`document.querySelector(${JSON.stringify(W)})?.getAttribute("data-state") ?? null`);
const focused = () => q(`(()=>{const a=document.activeElement;const c=document.querySelector(${JSON.stringify(W)});return c&&c.contains(a)?(a.dataset.alertDialog??a.textContent.trim()):a===document.querySelector(${JSON.stringify(T)})?"trigger":"outside"})()`);
/* each matched Button's corners: "pill" (fully round), "rounded" (radius.chip, a 28px rounded Button), or the radius itself */
const shapes = (sel) => q(`(()=>{const d=document.createElement("i");d.style.borderRadius="var(--fndn-radius-chip)";document.body.append(d);const chip=getComputedStyle(d).borderTopLeftRadius;d.remove();return [...document.querySelectorAll(${JSON.stringify(sel)})].map((b)=>{const r=getComputedStyle(b).borderTopLeftRadius;return r===chip?"rounded":parseFloat(r)>=b.getBoundingClientRect().height/2-0.5?"pill":r})})()`);
const LOOK = ["width", "borderRadius", "boxShadow", "backgroundColor"];
const look = () => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(W)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("root is a contents hook around the Dialog; the trigger is the Dialog's Button", await q(`(()=>{const r=document.querySelector("#stage [data-slot=alert-dialog]");return [getComputedStyle(r).display,r.firstElementChild?.dataset.slot,document.querySelector(${JSON.stringify(T)}).getAttribute("aria-haspopup")]})()`), ["contents", "dialog", "dialog"]);
  await p.clickSel(T); await sleep(450);
  check("click opens an alertdialog, modal, labelled and described; focus on Cancel", [await state(), await q(`(()=>{const c=document.querySelector(${JSON.stringify(W)});return [c.getAttribute("role"),c.getAttribute("aria-modal"),document.getElementById(c.getAttribute("aria-labelledby"))?.textContent,!!document.getElementById(c.getAttribute("aria-describedby"))]})()`), await focused()], ["open", ["alertdialog", "true", "Delete the staging project?", true], "cancel"]);
  check("no close button; footer is Cancel (ghost) then the action (danger)", await q(`(()=>{const c=document.querySelector(${JSON.stringify(W)});return [!!c.querySelector("[data-dialog=close]"),[...c.querySelectorAll("[data-slot=dialog-footer] > [data-slot=button]")].map((b)=>[b.dataset.alertDialog,b.textContent.trim()])]})()`), [false, [["cancel", "Cancel"], ["action", "Delete project"]]]);
  check("the action is the danger Button (red fill)", await q(`(()=>{const b=document.querySelector("[data-alert-dialog=action]");const d=document.createElement("i");d.style.color="var(--fndn-red)";document.body.append(d);const red=getComputedStyle(d).color;d.remove();return getComputedStyle(b).backgroundColor===red})()`), true);
  const mine = await look();
  await p.click(12, 12); await sleep(350);
  check("a click on the dimmed page does nothing; focus stays inside", [await state(), await focused()], ["open", "cancel"]);
  const seen = [];
  for (let i = 0; i < 3; i++) { await p.key("Tab"); await sleep(40); seen.push(await focused()); }
  check("Tab cycles Cancel ↔ action", seen, ["action", "cancel", "action"]);
  await p.key("Escape"); await sleep(350);
  check("Escape cancels; focus back on the trigger", [await state(), await focused()], ["closed", "trigger"]);
  await p.key("Enter"); await sleep(250);
  check("Enter on the trigger opens it, instantly (kbd-instant)", [await state(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(W)})).transitionDuration.split(",").every((d)=>parseFloat(d)===0)`), await focused()], ["open", true, "cancel"]);
  await p.key("Enter"); await sleep(300);
  check("Enter on Cancel (where focus starts) cancels, nothing destroyed by habit", [await state(), await focused()], ["closed", "trigger"]);
  await p.clickSel(T); await sleep(450);
  check("pointer open animates (the Dialog's duration.slow)", await q(`getComputedStyle(document.querySelector(${JSON.stringify(W)})).transitionDuration.split(",")[0]`), "0.25s");
  await p.clickSel("[data-alert-dialog=action]"); await sleep(400);
  check("the action closes it and returns focus", [await state(), await focused()], ["closed", "trigger"]);
  /* the window is the Dialog's: same width, radius, shadow and fill as the Dialog's Confirm */
  await open(fw, 0, "", "dialog"); await p.clickSel(T); await sleep(450);
  check("the window is the Dialog's (width, radius, shadow, surface)", mine, await look());

  await open(fw, 1); await p.clickSel(T); await sleep(450);
  check("neutral: the action is primary (ink fill), labels from the props", await q(`(()=>{const b=document.querySelector("[data-alert-dialog=action]");const d=document.createElement("i");d.style.color="var(--fndn-ink)";document.body.append(d);const ink=getComputedStyle(d).color;d.remove();return [getComputedStyle(b).backgroundColor===ink,b.textContent.trim(),document.querySelector("[data-alert-dialog=cancel]").textContent.trim()]})()`), [true, "Leave", "Stay"]);
  await open(fw, 2); await p.clickSel(T); await sleep(450);
  check("size sm: 360px", Math.round((await p.rect(W)).w), 360);
  check("the trigger, Cancel and the action are in the app's shape: pills", await shapes(`${T}, ${W} [data-slot=dialog-footer] > [data-slot=button]`), ["pill", "pill", "pill"]);
  await q(`document.documentElement.dataset.shape="rounded"`); await sleep(60);
  check("in a rounded app (data-shape on <html>) they are rounded", await shapes(`${T}, ${W} [data-slot=dialog-footer] > [data-slot=button]`), ["rounded", "rounded", "rounded"]);
  await q(`delete document.documentElement.dataset.shape`);

  await open(fw, 0, "&data=worst"); await p.clickSel(T); await sleep(450);
  check("worst: long labels wrap inside the window", await q(`(()=>{const c=document.querySelector(${JSON.stringify(W)});const b=c.getBoundingClientRect();return [...c.querySelectorAll("*")].every((e)=>{const r=e.getBoundingClientRect();return r.right<=b.right+0.5&&r.left>=b.left-0.5})})()`), true);
  await open(fw, 2, "&data=worst&dir=rtl"); await p.clickSel(T); await sleep(450);
  check("rtl: Cancel sits right of the action (row order follows the page)", await q(`(()=>{const c=document.querySelector("[data-alert-dialog=cancel]").getBoundingClientRect();const a=document.querySelector("[data-alert-dialog=action]").getBoundingClientRect();return c.left>a.left})()`), true);
  await open(fw, 0, "&theme=dark"); await p.clickSel(T); await sleep(450);
  check("dark: the window is the dark surface", (await look())[3], await q(`(()=>{const d=document.createElement("div");d.style.backgroundColor="var(--fndn-surface)";document.body.append(d);const v=getComputedStyle(d).backgroundColor;d.remove();return v})()`));
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
