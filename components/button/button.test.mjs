// Button: sizes, shapes, icon-only squares, ghost + muted hover and press, the two-states cell,
// keyboard activation. Every target through the harness.
//   node components/button/button.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
/* hover: true makes headless Chromium report a mouse, so the gated hover rules apply */
const p = await launch({ hover: true });
let failed = 0;
/* ready = this URL's document has mounted (the previous page can still answer right after goto) */
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await p.eval(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const q = (js) => p.eval(js);
/* a token's computed colour, through a probe element */
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);
const box = (sel) => q(`[...document.querySelectorAll(${JSON.stringify(sel)})].map((b)=>{const r=b.getBoundingClientRect();const cs=getComputedStyle(b);const i=b.querySelector("[data-slot=button-icon]");return [Math.round(r.width*100)/100,Math.round(r.height*100)/100,cs.borderRadius,i?getComputedStyle(i).fontSize:null]})`);
const style = (sel, props) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(props)}.map((k)=>cs[k])})()`);
const press = async (x, y) => { await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 }); await sleep(260); };
const release = async (x, y) => { await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 }); await sleep(30); };
/* one more example, with changed props, in a host of its own after the stage */
const mountWith = (fw, ex, props, id) => q(`(async()=>{const spec=(await (await import("/src/harness/specs.ts")).specOf("button"));const e=spec.examples[${ex}];const {mountExample}=await import("/src/harness/mount.ts");const host=document.createElement("div");host.id=${JSON.stringify(id)};document.querySelector("#stage").after(host);await mountExample(host,{...spec,examples:[{...e,props:{...e.props,...${JSON.stringify(props)}}}]},"${fw}",0);return true})()`);
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=button&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };

const ink = await (async () => { await open("react", 0); return { hover: await token("--fndn-hover"), hover2: await token("--fndn-hover-2"), ink: await token("--fndn-ink", "color"), ink2: await token("--fndn-ink-2", "color"), ink3: await token("--fndn-ink-3", "color"), clear: "rgba(0, 0, 0, 0)" }; })();

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try {
      // the existing examples keep their sizes and the pill radius
      const heights = [];
      for (let ex = 0; ex < 8; ex++) { await open(fw, ex); const [b] = await box("#stage [data-slot=button]"); heights.push([b[1], b[2]]); }
      check("existing examples: heights and pill radius unchanged", heights, [[32, "999px"], [32, "999px"], [32, "999px"], [28, "999px"], [28, "999px"], [28, "999px"], [28, "999px"], [32, "999px"]]);

      /* danger-outline (example 19): the surface, red text and a red edge; hovered, filled red */
      await open(fw, 19);
      { const sel = "#stage [data-slot=button]"; const rest = await style(sel, ["backgroundColor", "color", "height"]);
        const red = await token("--fndn-red"), redText = await token("--fndn-red", "color"), surf = await token("--fndn-surface"), on = await token("--fndn-on-accent", "color");
        const edge = await q(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).boxShadow.includes("0px 0px 0px 1px")`);
        const r = await p.rect(sel); await p.hover(r.cx, r.cy); await sleep(300);
        const hov = await style(sel, ["backgroundColor", "color"]); await p.hover(1000, 800); await sleep(260);
        check("danger-outline: the surface with red text and a 1px edge at rest (28px sm); hovered it fills red with white text", [rest, edge, hov], [[surf, redText, "28px"], true, [red, on]]); }
      await open(fw, 8 + 2);
      check("xs: 24px high, 12px/500 text, 6px inline padding, pill", [(await box("#stage [data-slot=button]"))[0][1], ...(await style("#stage [data-slot=button]", ["fontSize", "fontWeight", "paddingInlineStart", "borderRadius"]))], [24, "12px", "500", "6px", "999px"]);
      await open(fw, 3);
      check("sm: 28px high, 13px/500 text, 12px inline padding (the one sm: no lighter 28px size)", [(await box("#stage [data-slot=button]"))[0][1], ...(await style("#stage [data-slot=button]", ["fontSize", "fontWeight", "paddingInlineStart"]))], [28, "13px", "500", "12px"]);
      await open(fw, 16);
      check("lg: 36px high, 14px/500 text, 18px inline padding, pill", [(await box("#stage [data-slot=button]"))[0][1], ...(await style("#stage [data-slot=button]", ["fontSize", "fontWeight", "paddingInlineStart", "borderRadius"]))], [36, "14px", "500", "18px", "999px"]);
      /* a popup trigger opened from the keyboard fills at once: no transition on an aria-expanded
       * Button while the last input was a key (kbd-instant) */
      check("keyboard: a popup trigger (aria-expanded) has no transition while the last input was a key", await q(`(()=>{const h=document.documentElement;const was=h.dataset.fndnInput;h.dataset.fndnInput="keyboard";const b=document.querySelector("#stage [data-slot=button]");b.setAttribute("aria-expanded","false");const d=getComputedStyle(b).transitionDuration;b.removeAttribute("aria-expanded");if(was===undefined)delete h.dataset.fndnInput;else h.dataset.fndnInput=was;return d.split(",").every((x)=>parseFloat(x)===0)})()`), true);
      await open(fw, 11);
      check("shape rounded at sm: radius.chip (6px), as an sm field; 28px high", (await box("#stage [data-slot=button]")).map((b) => [b[1], b[2]]), [[28, "6px"]]);
      /* the app's shape: <html data-shape="rounded"> rounds a button that names no shape (a field's
       * corners at its height); one that names pill stays a pill */
      await open(fw, 0);
      await q(`document.documentElement.dataset.shape="rounded"`);
      await mountWith(fw, 3, {}, "app-sm"); await mountWith(fw, 3, { shape: "pill" }, "app-pill"); await sleep(200);
      const corner = async (sel) => (await box(`${sel} [data-slot=button]`)).map((b) => [b[1], b[2]])[0];
      check("in a rounded app a button that names no shape: 8px at md, 6px at sm; one that names pill stays a pill", [await corner("#stage"), await corner("#app-sm"), await corner("#app-pill")], [[32, "8px"], [28, "6px"], [28, "999px"]]);
      await q(`delete document.documentElement.dataset.shape`);

      // ghost + muted: rest, hover, press, release
      await open(fw, 12);
      const r = await p.rect("#stage [data-slot=button]");
      check("ghost muted xs rounded, with a label: radius.chip, transparent, ink-2 at rest", await style("#stage [data-slot=button]", ["borderRadius", "backgroundColor", "color"]), ["6px", ink.clear, ink.ink2]);
      await p.hover(r.cx, r.cy); await sleep(260);
      const hovered = await style("#stage [data-slot=button]", ["backgroundColor", "color"]);
      check("hover: fill hover, text ink", hovered, [ink.hover, ink.ink]);
      await press(r.cx, r.cy);
      const pressed = await style("#stage [data-slot=button]", ["backgroundColor", "color", "transform"]);
      check("press: fill hover-2 (not the hover colour), ink, scaled to 0.97", [pressed[0], pressed[0] !== hovered[0], pressed[1], pressed[2]], [ink.hover2, true, ink.ink, "matrix(0.97, 0, 0, 0.97, 0, 0)"]);
      await release(r.cx, r.cy);
      await p.hover(1000, 800); await sleep(260);
      check("pointer gone: back to rest", await style("#stage [data-slot=button]", ["backgroundColor", "color"]), [ink.clear, ink.ink2]);
      check("open (aria-expanded=true): hover-2 and ink without the pointer", await q(`(()=>{const b=document.querySelector("#stage [data-slot=button]");b.setAttribute("aria-expanded","true");return new Promise((res)=>setTimeout(()=>{const cs=getComputedStyle(b);res([cs.backgroundColor,cs.color]);b.removeAttribute("aria-expanded")},260))})()`), [ink.hover2, ink.ink]);

      // keyboard: Tab reaches it, Enter and Space activate it (native button)
      await q(`(()=>{window.__clicks=0;document.querySelector("#stage [data-slot=button]").addEventListener("click",()=>window.__clicks++)})()`);
      await p.click(5, 5); await p.key("Tab");
      check("Tab focuses the button", await q(`document.activeElement?.dataset.slot==="button"`), true);
      await p.key("Enter"); await p.key(" "); await sleep(50);
      check("Enter and Space each activate it once", await q(`window.__clicks`), 2);

      // busy: the spinner covers the label (no leading icon), the width holds, a press is dropped
      await open(fw, 18, "&step=0");
      const idle = (await box("#stage [data-slot=button]"))[0];
      await open(fw, 18, "&step=1");
      const busyBox = (await box("#stage [data-slot=button]"))[0];
      check("busy: same width and height as idle", [busyBox[0], busyBox[1]], [idle[0], idle[1]]);
      await open(fw, 17);
      const B = "#stage [data-slot=button]";
      check("busy: aria-busy, one decorative spinner centred over the button, the label kept but transparent", await q(`(()=>{const b=document.querySelector(${JSON.stringify(B)});const s=b.querySelectorAll("[data-button=spinner]");const sr=s[0]?.getBoundingClientRect(),br=b.getBoundingClientRect();const l=b.querySelector("[data-slot=button-label]");return [b.getAttribute("aria-busy"),s.length,s[0]?.getAttribute("aria-hidden"),Math.abs(sr.x+sr.width/2-(br.x+br.width/2))<0.6&&Math.abs(sr.y+sr.height/2-(br.y+br.height/2))<0.6,s[0].offsetWidth+"px",getComputedStyle(l).opacity,b.disabled]})()`), ["true", 1, "true", true, "14px", "0", false]);
      check("busy: the spinner is drawn in the button's ink (on the primary fill)", await q(`(()=>{const b=document.querySelector(${JSON.stringify(B)});const s=b.querySelector("[data-button=spinner]");return getComputedStyle(s).borderTopColor===getComputedStyle(b).color})()`), true);
      const rb = await p.rect(B);
      await q(`(()=>{window.__busy=[];document.addEventListener("click",(e)=>{if(e.target.closest?.("[data-slot=button]"))window.__busy.push(e.defaultPrevented)})})()`);
      await press(rb.cx, rb.cy);
      check("busy: a press does not scale", await style(B, ["transform"]), ["none"]);
      await release(rb.cx, rb.cy); await sleep(50);
      await p.click(5, 5); await p.key("Tab"); await p.key("Enter"); await sleep(50);
      check("busy: pointer and Enter clicks are dropped (default prevented); focus stays on it", [await q(`window.__busy`), await q(`document.activeElement?.dataset.slot`)], [[true, true], "button"]);
      await open(fw, 17, "&theme=dark");
      check("dark: the busy spinner follows the button's ink", await q(`(()=>{const b=document.querySelector(${JSON.stringify(B)});return getComputedStyle(b.querySelector("[data-button=spinner]")).borderTopColor===getComputedStyle(b).color})()`), true);

      if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []);
    } catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
/* a label cut by its ellipsis carries its full text as a title while it is cut, and only then
 * (lib/truncate.ts): squeeze the root to 40px, then let it go */
for (const fw of targets) {
  await p.goto(`${BASE}/harness.html?c=button&fw=${fw}&ex=0`, 1500);
  const got = await p.eval(`(async () => {
    const root = document.querySelector("#stage [data-slot=button]"), label = root.querySelector("[data-slot=button-label]");
    const wait = () => new Promise((r) => setTimeout(r, 250));
    const text = label.textContent.replace(/\\s+/g, " ").trim();
    const before = label.getAttribute("title");
    root.style.width = "40px"; root.style.maxWidth = "40px"; root.style.minWidth = "0";
    await wait();
    const cut = label.getAttribute("title") === text;
    root.style.width = root.style.maxWidth = root.style.minWidth = "";
    await wait();
    return [before, cut, label.getAttribute("title")];
  })()`);
  const ok = JSON.stringify(got) === JSON.stringify([null, true, null]);
  if (!ok) failed++;
  console.log(`${fw}\n  ${ok ? "✓" : "✗"} truncated label: title only while cut${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
}
/* trailing icon: menu's default trigger is a Button with a caret after its label (React adapter;
 * the harness passes no rich children, so this reads it through the component that uses it). The
 * caret sits in an icon part after the label: 1em of the text, one gap from the label. */
if (targets.includes("react")) {
  const search = "?c=menu&fw=react&ex=0";
  await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search);
  for (let t = 0; t < 30 && !(await q(`!!document.querySelector("#stage [data-slot=menu] [data-trailing]")`).catch(() => false)); t++) await sleep(100);
  const got = await q(`(()=>{const b=document.querySelector("#stage [data-slot=menu] [data-slot=button]");if(!b)return "no trigger";
    const kids=[...b.children].map((c)=>c.dataset.slot+(c.hasAttribute("data-trailing")?"+trailing":""));
    const l=b.querySelector("[data-slot=button-label]").getBoundingClientRect(),i=b.querySelector("[data-trailing]"),ir=i.getBoundingClientRect(),g=i.querySelector("svg").getBoundingClientRect(),cs=getComputedStyle(b);
    return [b.dataset.slot,kids,i.getAttribute("aria-hidden"),Math.round(g.width*100)/100+"px",Math.round((ir.left-l.right)*100)/100+"px",cs.fontSize,cs.columnGap]})()`);
  const ok = Array.isArray(got) && JSON.stringify(got.slice(0, 3)) === JSON.stringify(["button", ["button-label", "button-icon+trailing"], "true"]) && got[3] === got[5] && got[4] === got[6];
  if (!ok) failed++;
  console.log(`react\n  ${ok ? "✓" : "✗"} trailing icon (menu trigger): after the label, aria-hidden, 1em, one gap${ok ? "" : ` — got ${JSON.stringify(got)}`}`);
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
