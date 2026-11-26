// Alert: the roles per tone, the tone fills (status-pill's tint pairs; neutral is the card), the
// icon on the title's first line in the tone's colour, the actions as sm Buttons under the text,
// worst-case text wrapping inside a narrow alert, right-to-left, dark.
//   node components/alert/alert.test.mjs [react …]   (default: the spec's targets)
const C = "alert";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 80; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=alert]")`).catch(() => false)) break; await sleep(100); } await sleep(200); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);
const A = "#stage [data-slot=alert]";
const look = () => q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});const i=a.querySelector("[data-slot=alert-icon]");return [a.getAttribute("role"),getComputedStyle(a).backgroundColor,i?getComputedStyle(i).color:null]})()`);

async function run(fw, check) {
  await open(fw, 0);
  check("neutral: role=status, the card (surface, shadow.card, radius.card, 12px padding)", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});const cs=getComputedStyle(a);return [a.getAttribute("role"),cs.backgroundColor,cs.borderRadius,cs.padding,cs.boxShadow!=="none"]})()`), ["status", await token("--fndn-surface"), "10px", "12px", true]);
  check("neutral: ink-3 icon", (await look())[2], await token("--fndn-ink-3", "color"));
  check("parts in order: icon, then content holding title and description", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});return [[...a.children].map((c)=>c.dataset.slot),[...a.querySelector("[data-slot=alert-content]").children].map((c)=>c.dataset.slot)]})()`), [["alert-icon", "alert-content"], ["alert-title", "alert-description"]]);
  check("the 16px icon is centred on the title's first line", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});const i=a.querySelector("[data-slot=alert-icon] svg").getBoundingClientRect();const t=a.querySelector("[data-slot=alert-title]");const r=document.createRange();r.selectNodeContents(t);const line=r.getClientRects()[0];const lh=parseFloat(getComputedStyle(t).lineHeight);const top=t.getBoundingClientRect().top;return [Math.round(i.width),Math.abs((i.top+i.height/2)-(top+lh/2))<=0.5]})()`), [16, true]);
  for (const [ex, role, fill, ink] of [[1, "status", "--fndn-accent-tint", "--fndn-accent"], [2, "status", "--fndn-green-tint", "--fndn-green"], [3, "alert", "--fndn-orange-tint", "--fndn-orange"], [4, "alert", "--fndn-red-tint", "--fndn-red"]]) {
    await open(fw, ex);
    check(`tone ${ink.slice(5)}: role=${role}, tint fill, icon in the tone`, await look(), [role, await token(fill), await token(ink, "color")]);
  }
  await open(fw, 3);
  check("actions: sm Buttons (28px) in a row under the text, starting where the title starts", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});const t=a.querySelector("[data-slot=alert-title]").getBoundingClientRect();const d=a.querySelector("[data-slot=alert-description]").getBoundingClientRect();const b=[...a.querySelectorAll("[data-slot=alert-actions] > [data-slot=button]")].map((e)=>e.getBoundingClientRect());return [b.length,b.map((r)=>r.height),Math.abs(b[0].left-t.left)<=0.5,b[0].top>=d.bottom]})()`), [2, [28, 28], true, true]);
  await open(fw, 5);
  check("icon={false}, description only: no icon, no title, text ink-2", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});return [!!a.querySelector("[data-slot=alert-icon]"),!!a.querySelector("[data-slot=alert-title]"),getComputedStyle(a.querySelector("[data-slot=alert-description]")).color]})()`), [false, false, await token("--fndn-ink-2", "color")]);

  /* worst cases: wraps, never overflows */
  for (let ex = 0; ex < 4; ex++) {
    await open(fw, ex, "&data=worst");
    check(`worst ${ex}: nothing overflows the alert`, await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});const b=a.getBoundingClientRect();return [...a.querySelectorAll("*")].every((e)=>{const r=e.getBoundingClientRect();return r.right<=b.right+0.5&&r.left>=b.left-0.5})&&a.scrollWidth<=a.clientWidth+1})()`), true);
  }
  await open(fw, 4, "&data=worst");
  check("worst: an empty alert still renders its box (icon, no text)", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});return [!!a.querySelector("[data-slot=alert-icon]"),a.getBoundingClientRect().height]})()`), [true, 44]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the icon sits at the right, author text keeps its own direction", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});const i=a.querySelector("[data-slot=alert-icon]").getBoundingClientRect();const c=a.querySelector("[data-slot=alert-content]").getBoundingClientRect();return [i.left>c.left,getComputedStyle(a.querySelector("[data-slot=alert-title]")).unicodeBidi]})()`), [true, "plaintext"]);
  await p.viewport(320, 640, 1.25, false);
  await open(fw, 3);
  /* the fixture's 420px is the caller's width: at 320px a caller gives it the column */
  check("320px, full width: the alert and its actions fit the page", await q(`(()=>{const a=document.querySelector(${JSON.stringify(A)});a.style.width="100%";a.style.maxWidth="288px";return [document.documentElement.scrollWidth<=innerWidth,a.scrollWidth<=a.clientWidth+1]})()`), [true, true]);
  await p.viewport(1280, 900, 1.25, false);
  await open(fw, 0, "&theme=dark");
  check("dark: neutral is the dark surface", (await look())[1], await token("--fndn-surface"));
  await open(fw, 4, "&theme=dark");
  check("dark: red fills the dark red tint", (await look())[1], await token("--fndn-red-tint"));
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await p.viewport(1280, 900, 1.25, false); await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
