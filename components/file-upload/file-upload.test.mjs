// File upload: Ark's file-upload (the drop zone is a button that opens the file dialog from the
// pointer and the keyboard; dropped files are checked against type, size and count), the empty
// state inside the zone, files as real tags with their size, refused files in red with the
// reason, removal, the fade of a file added later (never at first paint), disabled, worst cases,
// right-to-left, dark.
//   node components/file-upload/file-upload.test.mjs [react …]   (default: the spec's targets)
const C = "file-upload";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search) => { for (let t = 0; t < 60; t++) { if (await q(`!window.__stale && location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector("#stage [data-slot=file-upload]")`).catch(() => false)) break; await sleep(100); } await sleep(300); };
const open = async (fw, ex, extra = "") => { p.errors.length = 0; await q("window.__stale = true").catch(() => {}); const search = `?c=${C}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const S = (part) => `#stage [data-slot=${part}]`;
const ZONE = S("file-upload-dropzone");
/* files dragged over the zone (a scripted drop carries no file entries, so files are added
 * through the hidden input, as the dialog does): [[name, size, type], …] */
const files = (list) => `(()=>{const dt=new DataTransfer();for(const [n,s,t] of ${JSON.stringify(list)})dt.items.add(new File([new Uint8Array(s)],n,{type:t}));return dt})()`;
const drop = (list, type = "drop") => type === "over"
  ? q(`(()=>{const z=document.querySelector(${JSON.stringify(ZONE)});const dt=${files(list)};for(const ev of ["dragenter","dragover"])z.dispatchEvent(new DragEvent(ev,{dataTransfer:dt,bubbles:true,cancelable:true}));return true})()`)
  : q(`(()=>{const i=document.querySelector(${JSON.stringify(S("file-upload-hidden-input"))});i.files=${files(list)}.files;i.dispatchEvent(new Event("input",{bubbles:true}));return true})()`);
const rows = () => q(`[...document.querySelectorAll(${JSON.stringify(S("file-upload-item"))})].map((i)=>{const t=i.querySelector("[data-file-upload=file]");return [t?.querySelector("[data-slot=tag-label]")?.textContent,i.querySelector("[data-slot=file-upload-item-size]")?.textContent]})`);

async function run(fw, check) {
  await open(fw, 0);
  check("drop zone: role=button, focusable; the label names the input; the input accepts PDF",
    await q(`(()=>{const z=document.querySelector(${JSON.stringify(ZONE)});const l=document.querySelector(${JSON.stringify(S("file-upload-label"))});const i=document.querySelector(${JSON.stringify(S("file-upload-hidden-input"))});return [z.getAttribute("role"),z.tabIndex,l.textContent,l.htmlFor===i.id,i.type,i.accept]})()`),
    ["button", 0, "Attachment", true, "file", "application/pdf"]);
  check("inside: the real EmptyState (block) with the upload glyph, the title and the hint",
    await q(`(()=>{const e=document.querySelector(${JSON.stringify(ZONE)}+" [data-slot=empty-state]");return [!!e,!!e?.querySelector("[data-slot=empty-state-icon] svg"),e?.querySelector("[data-slot=empty-state-title]")?.textContent,e?.querySelector("[data-slot=empty-state-hint]")?.textContent]})()`),
    [true, true, "Drop files here", "or click to choose · PDF up to 5 MB"]);
  check("frame: 1px (one device pixel row) dashed line-strong, card radius, surface",
    await q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(ZONE)}));return [cs.borderTopStyle,parseFloat(cs.borderTopWidth)<=1&&parseFloat(cs.borderTopWidth)>0.5,cs.borderTopColor,cs.backgroundColor]})()`),
    ["dashed", true, await token("--fndn-line-strong", "borderTopColor"), await token("--fndn-surface")]);
  const z = await p.rect(ZONE);
  await p.hover(z.cx, z.cy); await sleep(250);
  check("hovered by a mouse: the hover colour", await q(`getComputedStyle(document.querySelector(${JSON.stringify(ZONE)})).backgroundColor`), await token("--fndn-hover"));
  await p.hover(1, 1);

  /* the dialog: a click and Enter both open it (the hidden input is clicked) */
  await q(`(()=>{window.__picks=0;const i=document.querySelector(${JSON.stringify(S("file-upload-hidden-input"))});i.click=()=>{window.__picks++}})()`);
  await p.click(z.cx, z.cy); await sleep(100);
  check("a click on the zone opens the file dialog", await q(`window.__picks`), 1);
  await p.click(5, 5); await p.key("Tab");
  check("Tab focuses the zone (the shared ring)", await q(`(()=>{const a=document.activeElement;const cs=getComputedStyle(a);return [a.dataset.slot,cs.outlineStyle]})()`), ["file-upload-dropzone", "solid"]);
  await p.key("Enter"); await sleep(100);
  await p.key(" "); await sleep(100);
  check("Enter and Space open the file dialog", await q(`window.__picks`), 3);

  /* dragging over it */
  await drop([["a.pdf", 10, "application/pdf"]], "over"); await sleep(150);
  check("files dragged over: data-dragging, an accent frame on accent-tint", await q(`(()=>{const e=document.querySelector(${JSON.stringify(ZONE)});const cs=getComputedStyle(e);return [e.hasAttribute("data-dragging"),cs.borderTopColor,cs.backgroundColor]})()`), [true, await token("--fndn-accent", "borderTopColor"), await token("--fndn-accent-tint")]);

  /* drop: accepted, then refused for type and size */
  await open(fw, 0);
  await sleep(200);
  const h0 = (await p.rect(S("file-upload"))).h;
  /* the root's height on every frame while the file arrives */
  const grow = q(`new Promise((res)=>{const r=document.querySelector(${JSON.stringify(S("file-upload"))});const out=[];const t0=performance.now();const f=()=>{out.push(r.getBoundingClientRect().height);if(performance.now()-t0<400)requestAnimationFrame(f);else res(out)};requestAnimationFrame(f)})`);
  await drop([["report.pdf", 2048, "application/pdf"]]); await sleep(60);
  check("a file added after the first paint fades in (an opacity transition is running)", await q(`(()=>{const i=document.querySelector(${JSON.stringify(S("file-upload-item"))});return !!i&&i.getAnimations().some((a)=>a.transitionProperty==="opacity")})()`), true);
  /* arrivals make room as they fade; the line opens from 0fr, it does not push the page in one frame */
  const hs = await grow, h1 = hs.at(-1);
  check("an added file makes its room as it fades: the list opens over several frames (no jump to the full height)", [h1 > h0 + 20, hs.filter((h) => h > h0 + 8 && h < h1 - 2).length >= 2], [true, true]);
  await sleep(300);
  check("a dropped PDF: one line, the tag with its name and the size", await rows(), [["report.pdf", "2.05 kB"]]);
  check("the file is the real Tag (data-file-upload=file) with the file glyph and a remove button named after it",
    await q(`(()=>{const t=document.querySelector("#stage [data-file-upload=file]");return [t.dataset.slot,!!t.querySelector("[data-slot=tag-icon] svg"),t.querySelector("[data-tag=remove]")?.getAttribute("aria-label")]})()`),
    ["tag", true, "Remove report.pdf"]);
  check("size: xs, tabular figures, ink-2, at the end of the line", await q(`(()=>{const s=document.querySelector(${JSON.stringify(S("file-upload-item-size"))});const cs=getComputedStyle(s);const r=s.getBoundingClientRect();const root=document.querySelector(${JSON.stringify(S("file-upload"))}).getBoundingClientRect();return [cs.fontSize,cs.fontVariantNumeric,cs.color,Math.abs(r.right-root.right)<=0.5]})()`), ["12px", "tabular-nums", await token("--fndn-ink-2", "color"), true]);
  await open(fw, 0);
  await drop([["photo.png", 10, "image/png"]]); await sleep(300);
  check("a PNG is refused: a red tag with the reason in red", [await rows(), await q(`(()=>{const i=document.querySelector(${JSON.stringify(S("file-upload-item"))});return [getComputedStyle(i.querySelector("[data-slot=file-upload-item-size]")).color]})()`)], [[["photo.png", "Not an accepted type"]], [await token("--fndn-red", "color")]]);
  await open(fw, 0);
  await drop([["huge.pdf", 6_000_000, "application/pdf"]]); await sleep(300);
  check("a 6 MB PDF is refused: Too large", await rows(), [["huge.pdf", "Too large"]]);
  const rm = await p.rect("#stage [data-tag=remove]");
  await p.click(rm.cx, rm.cy); await sleep(200);
  check("its remove button clears it", await rows(), []);

  /* seeded files, removal from the keyboard */
  await open(fw, 1);
  check("seeded files: two lines with their sizes", await rows(), [["header.png", "248 kB"], ["avatar.jpg", "51.2 kB"]]);
  check("files there at first paint do not fade in", await q(`[...document.querySelectorAll(${JSON.stringify(S("file-upload-item"))})].every((i)=>getComputedStyle(i).opacity==="1"&&!i.getAnimations().length)`), true);
  await q(`document.querySelector("#stage [data-tag=remove]").focus()`);
  await p.key("Enter"); await sleep(20);
  /* a file is keyed by itself: the files after a removed one stay, they do not arrive again */
  check("removing the first file: the one after it does not fade in again (no transition, opacity 1)", await q(`[...document.querySelectorAll(${JSON.stringify(S("file-upload-item"))})].map((i)=>[getComputedStyle(i).opacity,i.getAnimations().length])`), [["1", 0]]);
  await sleep(180);
  check("Enter on a remove button removes that file", await rows(), [["avatar.jpg", "51.2 kB"]]);
  await drop([["a.png", 1, "image/png"], ["b.png", 1, "image/png"], ["c.png", 1, "image/png"], ["d.png", 1, "image/png"]]); await sleep(300);
  check("more than four: the extra files are refused (Too many files)", (await rows()).filter(([, s]) => s === "Too many files").length > 0, true);

  /* disabled */
  await open(fw, 3);
  check("disabled: half opacity, inert, the zone out of the tab order", await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("file-upload"))});const z=r.querySelector("[data-slot=file-upload-dropzone]");return [getComputedStyle(r).opacity,getComputedStyle(r).pointerEvents,z.tabIndex>=0&&!z.hasAttribute("aria-disabled")]})()`), ["0.5", "none", false]);

  /* worst cases */
  for (const [i, name] of [[0, "long names"], [1, "narrow"], [2, "many files"], [3, "right-to-left"], [4, "long hint"]]) {
    await open(fw, i, "&data=worst");
    check(`worst ${name}: nothing overflows the component`, await q(`(()=>{const r=document.querySelector(${JSON.stringify(S("file-upload"))});const b=r.getBoundingClientRect();return [...r.querySelectorAll("*")].every((e)=>{if(e.matches("input"))return true;const x=e.getBoundingClientRect();return x.width===0||(x.right<=b.right+0.5&&x.left>=b.left-0.5)})})()`), true);
  }
  await open(fw, 0, "&data=worst");
  await sleep(200);
  check("worst long name: the name is cut at the end with a title, the size stays whole",
    await q(`(()=>{const i=document.querySelector(${JSON.stringify(S("file-upload-item"))});const l=i.querySelector("[data-slot=tag-label]");const s=i.querySelector("[data-slot=file-upload-item-size]");return [l.scrollWidth>l.clientWidth,l.title===l.textContent,s.textContent,s.scrollWidth<=s.clientWidth+1]})()`),
    [true, true, "12.5 MB", true]);
  check("worst long label: it wraps", await q(`document.querySelector(${JSON.stringify(S("file-upload-label"))}).getBoundingClientRect().height>24`), true);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: the size sits at the left end of its line", await q(`(()=>{const s=document.querySelector(${JSON.stringify(S("file-upload-item-size"))}).getBoundingClientRect();const r=document.querySelector(${JSON.stringify(S("file-upload"))}).getBoundingClientRect();return Math.abs(s.left-r.left)<=0.5})()`), true);

  /* dark */
  await open(fw, 1, "&theme=dark");
  check("dark: the zone on the dark surface, the frame line-strong", await q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(ZONE)}));return [cs.backgroundColor,cs.borderTopColor]})()`), [await token("--fndn-surface"), await token("--fndn-line-strong", "borderTopColor")]);
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
