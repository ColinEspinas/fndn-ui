// Tag: hues, border, radius, sizes, dark, the dot, the remove button (the real Button: hover and
// press tint, keyboard, tooltip, the caller's attributes), right-to-left, truncation. Every target.
//   node components/tag/tag.test.mjs [react|vue|svelte …]
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset`).catch(() => false)) break; await sleep(100); } await sleep(250); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; const search = `?c=tag&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const R = "#stage [data-slot=tag]";
const pill = () => q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {h:r.height,w:r.width,radius:cs.borderRadius,border:cs.borderTopWidth,font:cs.fontSize,weight:cs.fontWeight,bg:cs.backgroundColor,color:cs.color,borderColor:cs.borderTopColor}})()`);
const press = async (x, y) => { await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 }); await sleep(260); };
const release = async (x, y) => { await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 }); await sleep(30); };

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try {
      await open(fw, 0);
      const tag = await pill();
      check("tag: 24px, radius.control, 1px tinted border, 13px regular, tinted fill", [tag.h, tag.radius, tag.border, tag.font, tag.weight, tag.bg !== "rgba(0, 0, 0, 0)", tag.borderColor !== tag.bg], [24, "8px", "1px", "13px", "400", true, true]);
      check("tag: no dot by default", await q(`!!document.querySelector("${R} [data-slot=tag-dot]")`), false);
      await open(fw, 1);
      check("tag with dot: the dot takes the hue", await q(`(()=>{const d=document.querySelector("${R} [data-slot=tag-dot]");return !!d&&getComputedStyle(d).backgroundColor!=="rgba(0, 0, 0, 0)"})()`), true);
      /* outline (example 6): a neutral box, the hue only in the dot; light and dark */
      for (const theme of ["", "&theme=dark"]) {
        await open(fw, 6, theme);
        const tok = (n, prop = "color") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${n})";document.querySelector("#stage").append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);
        const o = await pill();
        const dot = await q(`(()=>{const d=document.querySelector("${R} [data-slot=tag-dot]");return d?getComputedStyle(d).backgroundColor:null})()`);
        check(`outline${theme ? " (dark)" : ""}: no fill, the strong hairline, ink-2 text; the dot shows in the hue`, [o.bg, o.borderColor, o.color, dot], ["rgba(0, 0, 0, 0)", await tok("--fndn-line-strong", "borderColor"), await tok("--fndn-ink-2"), await tok("--fndn-tag-orange", "backgroundColor")]);
      }
      await open(fw, 3);
      const smTag = await pill();
      check("small tag: 22px, radius.chip", [smTag.h, smTag.radius], [22, "6px"]);

      // removable: the real Button inside, 26px tag, keyboard and pointer
      await open(fw, 2);
      const rm = await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const b=e.querySelector("[data-tag=remove]");const r=b.getBoundingClientRect(),pr=e.getBoundingClientRect();return [pr.height,r.width,r.height,b.tagName,b.dataset.slot==="button",b.getAttribute("aria-label"),Math.round((pr.right-1)-r.right),Math.round(r.top-pr.top)]})()`);
      check("removable: 26px tag holding a 24px ghost xs Button flush with the inline end, named", rm, [26, 24, 24, "BUTTON", true, "Remove supplier-list.csv", 0, 1]);
      const b = await p.rect(`${R} [data-tag=remove]`);
      const rest = await q(`getComputedStyle(document.querySelector("${R} [data-tag=remove]")).backgroundColor`);
      await p.hover(b.cx, b.cy); await sleep(260);
      const hov = await q(`getComputedStyle(document.querySelector("${R} [data-tag=remove]")).backgroundColor`);
      await press(b.cx, b.cy);
      const prs = await q(`(()=>{const cs=getComputedStyle(document.querySelector("${R} [data-tag=remove]"));return [cs.backgroundColor,cs.transform]})()`);
      await release(b.cx, b.cy);
      check("remove: rest clear, hover tints, press tints darker and scales", [rest, hov !== rest, prs[0] !== hov && prs[0] !== rest, prs[1]], ["rgba(0, 0, 0, 0)", true, true, "matrix(0.97, 0, 0, 0.97, 0, 0)"]);
      await q(`(()=>{window.__n=0;document.querySelector("${R} [data-tag=remove]").addEventListener("click",()=>window.__n++)})()`);
      await p.click(5, 5); await p.key("Tab");
      check("Tab reaches the remove button; Enter activates it", [await q(`document.activeElement?.matches("[data-tag=remove]")`), (await p.key("Enter"), await q("window.__n"))], [true, 1]);

      // removable with a tooltip: the caller's attribute lands on the button, its shape follows the pill's, the real Tooltip names it
      await open(fw, 5);
      check("removeProps on the remove button; a pill tag's remove button is round", await q(`(()=>{const b=document.querySelector("${R} [data-tag=remove]");return [b.getAttribute("data-attachment"),getComputedStyle(b).borderTopLeftRadius]})()`), ["0", "999px"]);
      const tb = await p.rect(`${R} [data-tag=remove]`);
      await p.hover(tb.cx, tb.cy); await sleep(900);
      check("hovering the remove button opens its tooltip", await q(`[...document.querySelectorAll("[data-slot=tooltip]")].some((t)=>t.textContent.trim()==="Remove"&&t.getBoundingClientRect().height>0)`), true);
      await p.hover(5, 5);

      // dark: the tag uses its richer dark mix
      await open(fw, 0, "&theme=dark");
      const dark = await pill();
      check("dark tag: different fill and text from light", [dark.bg !== tag.bg, dark.color !== tag.color], [true, true]);
      // rtl: the remove button sits at the inline end (left)
      await open(fw, 2, "&dir=rtl");
      check("rtl: remove button at the left end, label to its right", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});return e.querySelector("[data-tag=remove]").getBoundingClientRect().x<e.querySelector("[data-slot=tag-label]").getBoundingClientRect().x})()`), true);

      // worst case: a long tag truncates inside its width and keeps the title
      p.errors.length = 0; const s = `?c=tag&fw=${fw}&ex=0&data=worst`; await p.goto(`${BASE}/harness.html${s}`, 300); await ready(s);
      check("worst case: long tag truncates with an ellipsis at 140px, title kept, one line", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const l=e.querySelector("[data-slot=tag-label]");return [Math.round(e.getBoundingClientRect().width),l.scrollWidth>l.clientWidth,getComputedStyle(l).textOverflow,!!e.getAttribute("title"),e.getBoundingClientRect().height]})()`), [140, true, "ellipsis", true, 24]);
      p.errors.length = 0; const s2 = `?c=tag&fw=${fw}&ex=1&data=worst`; await p.goto(`${BASE}/harness.html${s2}`, 300); await ready(s2);
      check("worst case: long removable tag keeps the remove button whole", await q(`(()=>{const e=document.querySelector(${JSON.stringify(R)});const b=e.querySelector("[data-tag=remove]").getBoundingClientRect();return [b.width,b.right<=e.getBoundingClientRect().right+0.5]})()`), [24, true]);
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
  await p.goto(`${BASE}/harness.html?c=tag&fw=${fw}&ex=0`, 1500);
  const got = await p.eval(`(async () => {
    const root = document.querySelector("#stage [data-slot=tag]"), label = root.querySelector("[data-slot=tag-label]");
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
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
