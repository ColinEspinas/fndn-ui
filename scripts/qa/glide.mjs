// The gliding highlight must travel when a real pointer moves between rows. Engines clear the
// highlighted row for an instant between two rows; the highlight must not hide and reappear.
// Moves the pointer in 3px steps (a jump from centre to centre hides the bug).
import { launch, sleep } from "./cdp.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const p = await launch({ width: 1000, height: 800, hover: true });
const cases = [];
for (const fw of ["react", "vue", "svelte"]) { cases.push(["select/" + fw, `${BASE}/harness.html?c=select&fw=${fw}`, "[data-slot=select-trigger]", "[data-slot=select-item]", "[data-slot=select-highlight]"]); cases.push(["menu/" + fw, `${BASE}/harness.html?c=menu&fw=${fw}&ex=1`, "[data-menu=trigger]", "[data-slot=menu-item]", "[data-slot=menu-highlight]"]); }
// the prompt-bar suggestion lists (opened by typing "/" or "@"), and search
const typeIn = (text) => async () => { await p.clickSel("#stage [data-slot=prompt-bar-input]"); await sleep(150); await p.type(text); await sleep(200); };
for (const fw of ["react", "vue", "svelte"]) {
  cases.push(["prompt-bar commands/" + fw, `${BASE}/harness.html?c=prompt-bar&fw=${fw}`, typeIn("/"), "[data-slot=prompt-bar-list][data-kind=command] [data-slot=prompt-bar-option]", "[data-slot=prompt-bar-list][data-kind=command] [data-slot=prompt-bar-highlight]"]);
  cases.push(["prompt-bar sources/" + fw, `${BASE}/harness.html?c=prompt-bar&fw=${fw}`, typeIn("@"), "[data-slot=prompt-bar-list][data-kind=source] [data-slot=prompt-bar-option]", "[data-slot=prompt-bar-list][data-kind=source] [data-slot=prompt-bar-highlight]"]);
  cases.push(["search/" + fw, `${BASE}/harness.html?c=search&fw=${fw}`, "[data-slot=search-input]", "[role=option]", "[data-slot=search-highlight]"]);
}
let bad = 0;
for (const [name, url, open, rowSel, layerSel] of cases) {
  await p.goto(url); await sleep(1300); if (typeof open === "function") await open(); else await p.clickSel(open); await sleep(500);
  const rows = await p.eval(`[...document.querySelectorAll(${JSON.stringify(rowSel)})].filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, top: Math.round(r.y) }; })`);
  if (rows.length < 2) { console.log(name + ": fewer than two rows"); continue; }
  await p.eval(`(() => { const l = document.querySelector(${JSON.stringify(layerSel)}); window.__log = []; new MutationObserver(() => window.__log.push(l.hasAttribute('data-visible') ? 'V' : 'h')).observe(l, { attributes: true, attributeFilter: ['data-visible'] }); })()`);
  await p.hover(rows[0].x, rows[0].y); await sleep(300);
  const ys = new Set();
  for (let y = rows[0].y; y <= rows[1].y; y += 3) { await p.hover(rows[0].x, y); await sleep(10); ys.add(await p.eval(`Math.round(document.querySelector(${JSON.stringify(layerSel)}).getBoundingClientRect().y)`)); }
  await sleep(350); const end = await p.eval(`Math.round(document.querySelector(${JSON.stringify(layerSel)}).getBoundingClientRect().y)`);
  const hid = (await p.eval("window.__log.join('')")).includes("h");
  const travelled = [...ys].some((y) => y > rows[0].top + 1 && y < rows[1].top - 1);
  const ok = !hid && travelled && Math.abs(end - rows[1].top) <= 1; if (!ok) bad++;
  console.log(`${ok ? "✓" : "✗"} ${name}: hidden between rows=${hid} · seen in between=${travelled} · ends on row=${Math.abs(end - rows[1].top) <= 1}`);
  // leaving the list hides it
  await p.hover(20, 20); await sleep(400); const op = await p.eval(`getComputedStyle(document.querySelector(${JSON.stringify(layerSel)})).opacity`);
  if (name.startsWith("menu") || name.startsWith("select")) console.log(`   after the pointer leaves the list: opacity ${op}`);
}
console.log(bad ? `${bad} FAILED` : "all targets pass"); await p.close(); process.exit(bad ? 1 : 0);
