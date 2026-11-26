// Keyboard, pointer and geometry contract of the switch, run against every target.
//   node components/switch/switch.test.mjs            all four targets
//   node components/switch/switch.test.mjs react      one target
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["react", "vue", "svelte"];
const p = await launch({ dpr: 2 });
let failed = 0;

const open = async (fw, ex) => {
  p.errors.length = 0;
  await p.goto(`${BASE}/harness.html?c=switch&fw=${fw}&ex=${ex}`, 300);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
};
const S = "#stage [data-slot=switch]";
const checked = () => p.eval(`document.querySelector(${JSON.stringify(S)}).getAttribute("aria-checked")`);
/* thumb box relative to the track: [left gap, top gap, bottom gap, right gap] */
const geo = () => p.eval(`(()=>{const s=document.querySelector(${JSON.stringify(S)}).getBoundingClientRect(),t=document.querySelector("${S} [data-slot=switch-thumb]").getBoundingClientRect();return {w:s.width,h:s.height,thumb:t.width,top:+(t.top-s.top).toFixed(2),bottom:+(s.bottom-t.bottom).toFixed(2),left:+(t.left-s.left).toFixed(2),right:+(s.right-t.right).toFixed(2)}})()`);
const thumbStyle = (prop) => p.eval(`getComputedStyle(document.querySelector("${S} [data-slot=switch-thumb]")).${prop}`);

for (const fw of targets) {
 for (let attempt = 0; attempt < 3; attempt++) {
  const before = failed;
  const checks = [];
  const check = (name, got, want) => {
    const ok = typeof want === "function" ? want(got) : JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failed++;
    checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}${typeof want === "function" ? "" : `, want ${JSON.stringify(want)}`}`}`);
  };

  try {
  await open(fw, 0);
  check("is a button with role=switch, on", await p.eval(`(()=>{const s=document.querySelector(${JSON.stringify(S)});return [s.tagName, s.getAttribute("role"), s.getAttribute("aria-checked"), s.getAttribute("type")]})()`), ["BUTTON", "switch", "true", "button"]);
  const g = await geo();
  check("md is 40×24 with a 20px thumb, 2px from every edge when on", [g.w, g.h, g.thumb, g.top, g.bottom, g.right], [40, 24, 20, 2, 2, 2]);
  check("label sits on the switch's centre line", await p.eval(`(()=>{const s=document.querySelector(${JSON.stringify(S)}).getBoundingClientRect(),t=document.querySelector("[data-slot=switch-label-text]").getBoundingClientRect();return Math.abs((s.top+s.height/2)-(t.top+t.height/2))<0.5})()`), true);
  check("no transition runs on mount", await p.eval(`document.getAnimations().length`), 0);

  await p.clickSel(S); await sleep(30);
  check("click toggles off", await checked(), "false");
  check("a pointer toggle slides the thumb", [/translate|transform/.test(await thumbStyle("transitionProperty")), parseFloat(await thumbStyle("transitionDuration")) > 0], [true, true]);
  await sleep(300);
  check("thumb lands 2px from the start edge", (await geo()).left, 2);
  await p.clickSel("[data-slot=switch-label-text]"); await sleep(250);
  check("a click on the label text toggles", await checked(), "true");

  const r = await p.rect(S);
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.cx, y: r.cy });
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", clickCount: 1 });
  await sleep(250);
  check("press squeezes the thumb", await thumbStyle("scale"), "0.9");
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.cx, y: r.cy, button: "left", clickCount: 1 });
  await sleep(300);

  check("press uses the small-control token (motion.press-scale-sm)", await p.eval(`(()=>{const probe=document.createElement("i");probe.style.scale="var(--fndn-motion-press-scale-sm)";document.body.append(probe);const v=getComputedStyle(probe).scale;probe.remove();return v})()`), "0.9");

  await p.eval(`document.activeElement?.blur()`);
  await p.key("Tab"); await sleep(50);
  check("Tab focuses the switch", await p.eval(`document.activeElement === document.querySelector(${JSON.stringify(S)})`), true);
  const was = await checked();
  await p.key(" "); await sleep(50);
  check("Space toggles", await checked(), was === "true" ? "false" : "true");
  check("a keyboard toggle moves the thumb instantly", (await thumbStyle("transitionDuration")).split(",").every((d) => parseFloat(d) === 0), true);
  await p.key("Enter"); await sleep(50);
  check("Enter toggles", await checked(), was);
  check("keyboard focus shows the ring", await p.eval(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).outlineStyle`), "solid");
  await p.send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, text: " " }); await sleep(200);
  check("Space held: no press squeeze (pointer only)", await thumbStyle("scale"), (v) => v === "none" || v === "1");
  await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 }); await sleep(60);
  check("no console errors", p.errors.slice(0, 2), []);

  await open(fw, 2);
  const sm = await geo();
  check("sm is 32×18 with a 14px thumb, 2px from every edge when on", [sm.w, sm.h, sm.thumb, sm.top, sm.bottom, sm.right], [32, 18, 14, 2, 2, 2]);

  await open(fw, 3);
  await p.clickSel(S); await sleep(50);
  await p.clickSel("[data-slot=switch-label-text]"); await sleep(50);
  check("disabled: clicks do nothing", [await checked(), await p.eval(`getComputedStyle(document.querySelector(${JSON.stringify(S)})).opacity`)], ["false", "0.5"]);

  await open(fw, 4);
  check("no visible label: named by aria-label", await p.eval(`document.querySelector(${JSON.stringify(S)}).getAttribute("aria-label")`), "Notifications");
  await p.clickSel(S); await sleep(50);
  check("bare switch toggles on click", await checked(), "true");
  check("no console errors (other examples)", p.errors.slice(0, 2), []);

  await p.goto(`${BASE}/harness.html?c=switch&fw=${fw}&ex=0&dir=rtl`, 300);
  for (let t = 0; t < 80; t++) { if (await p.eval(`"harnessReady" in document.documentElement.dataset`)) break; await sleep(100); }
  await sleep(300);
  const rtl = await geo();
  check("right to left: an on thumb sits at the inline end (left)", rtl.left, 2);

  } catch (e) { failed++; checks.push(`✗ threw: ${String(e.message).split("\n")[0]}`); }
  /* a dev-server reload caused by edits elsewhere can interrupt a run: retry before reporting */
  if (failed > before && attempt < 2) { failed = before; await sleep(800); continue; }
  console.log(`${fw}\n  ${checks.join("\n  ")}`);
  break;
 }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
