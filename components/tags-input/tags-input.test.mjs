// Tags input: the Input's box holding Tag components and a text input (Zag tags-input). The box
// compared with the Input, adding (Enter, the delimiter, blur), duplicates, max, Backspace and the
// arrow keys over tags (one ring, the field's: a selected tag is a fill and the caret hides), a click
// on a tag, removing with the tag's Button, editing a tag in place (nothing moves), sizes, invalid, disabled,
// worst cases (many tags wrap, an unbreakable tag is cut with a title), right-to-left, dark, 320px.
//   node components/tags-input/tags-input.test.mjs [react|vue|svelte …]   (default: the spec's targets)
const C = "tags-input";
import { launch, sleep } from "../../scripts/qa/cdp.mjs";
import { qaTargets } from "../../scripts/lib.mjs";
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const targets = qaTargets(C);
const p = await launch({ dpr: 1.25, hover: true });
let failed = 0;
const q = (js) => p.eval(js);
const ready = async (search, sel) => {
  for (let t = 0; t < 60; t++) { if (await q(`location.search === ${JSON.stringify(search)} && "harnessReady" in document.documentElement.dataset && !!document.querySelector(${JSON.stringify(sel)})`).catch(() => false)) break; await sleep(100); }
  await sleep(250);
};
const open = async (fw, ex, extra = "", c = C) => { p.errors.length = 0; const search = `?c=${c}&fw=${fw}&ex=${ex}${extra}`; await p.goto(`${BASE}/harness.html${search}`, 300); await ready(search, `#stage [data-slot=${c}]`); };
const token = (name, prop = "backgroundColor") => q(`(()=>{const d=document.createElement("div");d.style.${prop}="var(${name})";document.body.append(d);const v=getComputedStyle(d)[${JSON.stringify(prop)}];d.remove();return v})()`);

const CTRL = "#stage [data-slot=tags-input-control]";
const INPUT = "#stage [data-slot=tags-input-input]";
const TAG = "#stage [data-tags-input=item-preview]";
const EDIT = "#stage [data-slot=tags-input-item-input]:not([hidden])";
/* the tags as they read: a tag being edited stays in the row (holding its place) but is not one */
const tags = () => q(`[...document.querySelectorAll(${JSON.stringify(TAG)})].filter((e)=>e.parentElement.querySelector("[data-part=item-input]").hidden).map((e)=>e.querySelector("[data-slot=tag-label]").textContent)`);
/* a selected tag: its fill, its label's and its ×'s colour, its outline; whether the field shows its
 * ring (the accent in its box-shadow); the input's caret */
const selectedLook = (accent) => q(`(()=>{const t=document.querySelector(${JSON.stringify(`${TAG}[data-highlighted]`)});const cs=getComputedStyle(t);return [cs.backgroundColor, getComputedStyle(t.querySelector("[data-slot=tag-label]")).color, getComputedStyle(t.querySelector("[data-tag=remove]")).color, cs.outlineStyle, getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).boxShadow.includes(${JSON.stringify(accent)}), getComputedStyle(document.querySelector(${JSON.stringify(INPUT)})).caretColor]})()`);
/* where the text of each tag starts (the edit field's, while it is edited) and each tag's box */
const layout = () => q(`[...document.querySelectorAll("#stage [data-part=item]")].map((it)=>{const i=it.querySelector("[data-part=item-input]");const b=it.getBoundingClientRect();let x;if(!i.hidden){const cs=getComputedStyle(i);x=i.getBoundingClientRect().left+parseFloat(cs.borderLeftWidth)+parseFloat(cs.paddingLeft)}else x=it.querySelector("[data-slot=tag-label]").getBoundingClientRect().left;return [Math.round(x*100)/100, Math.round(b.left*100)/100, Math.round(b.width*100)/100, Math.round(b.top)]})`);
const dblclick = async (r) => { for (const n of [1, 2]) { await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.cx, y: r.cy, button: "left", clickCount: n }); await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.cx, y: r.cy, button: "left", clickCount: n }); } await sleep(200); };
const lit = () => q(`document.querySelector(${JSON.stringify(`${TAG}[data-highlighted]`)})?.textContent.trim() ?? null`);
const inField = () => q(`document.activeElement === document.querySelector(${JSON.stringify(INPUT)})`);
const LOOK = ["borderRadius", "backgroundColor", "boxShadow", "fontSize"];
const look = (sel) => q(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(sel)}));return ${JSON.stringify(LOOK)}.map((k)=>cs[k])})()`);

async function run(fw, check) {
  await open(fw, 1);
  const mine = [...(await look(CTRL)), (await p.rect(CTRL)).h];
  const start = await q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect(),i=document.querySelector(${JSON.stringify(INPUT)});return Math.round(i.getBoundingClientRect().left+parseFloat(getComputedStyle(i).paddingInlineStart)-c.left)})()`);
  await open(fw, 0, "", "input");
  check("empty, the box is the Input's (radius, fill, hairline, type, 32px) and its text starts 10px in", [...mine, start], [...(await look("#stage [data-slot=input]")), 32, 10]);

  await open(fw, 0);
  check("tags are Tags (22px, chip radius) in a 32px row; their remove Buttons are named and not tab stops", await q(`(()=>{const t=[...document.querySelectorAll(${JSON.stringify(TAG)})];const b=t[0].querySelector("[data-tag=remove]");return [t.map((e)=>e.dataset.slot), Math.round(t[0].getBoundingClientRect().height), getComputedStyle(t[0]).borderRadius, Math.round(document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect().height), b.getAttribute("aria-label"), b.tabIndex]})()`), [["tag", "tag"], 22, "6px", 32, "Remove Billing", -1]);
  check("with tags, no placeholder (it would be cut beside them)", await q(`document.querySelector(${JSON.stringify(INPUT)}).placeholder`), "");
  await p.clickSel(INPUT); await sleep(300);
  check("a click focuses the field: the Input's accent ring", await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).boxShadow.includes(${JSON.stringify(await token("--fndn-accent", "color"))})`), true);
  await p.type("Security"); await p.key("Enter"); await sleep(150);
  check("Enter adds the text as a tag and empties the field; focus stays", [await tags(), await q(`document.querySelector(${JSON.stringify(INPUT)}).value`), await inField()], [["Billing", "Onboarding", "Security"], "", true]);
  await p.type("Search,"); await sleep(150);
  check("the delimiter adds too", await tags(), ["Billing", "Onboarding", "Security", "Search"]);
  await p.type("Billing"); await p.key("Enter"); await sleep(150);
  check("a duplicate is not added: the tag it names is selected, the field is emptied and keeps the focus", [(await tags()).length, await lit(), await q(`document.querySelector(${JSON.stringify(INPUT)}).value`), await inField()], [4, "Billing", "", true]);
  await p.type("Sea"); await sleep(80);
  check("typing on clears that selection", [await lit(), await q(`document.querySelector(${JSON.stringify(INPUT)}).value`)], [null, "Sea"]);
  await q(`document.querySelector(${JSON.stringify(INPUT)}).select()`); await p.type("Search"); await p.click(5, 5); await sleep(200);
  check("a duplicate left in the field when the focus leaves is dropped quietly: nothing selected, focus not taken back", [(await tags()).length, await lit(), await inField()], [4, null, false]);
  await p.clickSel(INPUT); await sleep(150);
  await q(`(()=>{const i=document.querySelector(${JSON.stringify(INPUT)});i.select()})()`); if (await q(`document.querySelector(${JSON.stringify(INPUT)}).value`)) { await p.key("Backspace"); await sleep(50); }
  await p.key("Backspace"); await sleep(100);
  const accent = await token("--fndn-accent", "color"), onAccent = await token("--fndn-on-accent", "color");
  check("Backspace in an empty field selects the last tag: the accent fill, its text and × on-accent, no outline; the field keeps its ring (the only one) and the caret hides", [await lit(), await selectedLook(accent)], ["Search", [await token("--fndn-accent"), onAccent, onAccent, "none", true, "rgba(0, 0, 0, 0)"]]);
  await p.key("ArrowLeft"); await sleep(80);
  check("ArrowLeft walks to the previous tag; focus stays in the field", [await lit(), await inField()], ["Security", true]);
  await p.key("Backspace");
  check("Backspace on a highlighted tag removes it at once (no fade)", await tags(), ["Billing", "Onboarding", "Search"]);
  await p.key("Escape"); await sleep(80);
  check("Escape clears the selection and the caret shows again", [await lit(), await q(`getComputedStyle(document.querySelector(${JSON.stringify(INPUT)})).caretColor`) !== "rgba(0, 0, 0, 0)"], [null, true]);
  const label0 = await p.rect(`${TAG} [data-slot=tag-label]`);
  await p.click(label0.cx, label0.cy); await sleep(120);
  check("a click on a tag selects it the same way; focus stays in the field", [await lit(), (await selectedLook(accent))[0], await inField()], ["Billing", await token("--fndn-accent"), true]);
  await p.key("Escape"); await sleep(80);
  /* removed with its ×: the press does not select the tag; the tag fades while its cell closes, so
   * the next tag slides into the room and is already in place when the tag leaves */
  const ITEM = "#stage [data-slot=tags-input-item]";
  const nextX = (i) => q(`Math.round(document.querySelectorAll(${JSON.stringify(ITEM)})[${i}].getBoundingClientRect().x*10)/10`);
  const remove = await p.rect(`${TAG}:not([hidden]) [data-tag=remove]`);
  const from = await nextX(1);
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: remove.cx, y: remove.cy });
  await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: remove.cx, y: remove.cy, button: "left", clickCount: 1 }); await sleep(80);
  check("a press on the × does not select its tag, and the focus stays in the field", [await lit(), await inField()], [null, true]);
  await p.rate(0.1);
  await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: remove.cx, y: remove.cy, button: "left", clickCount: 1 }); await sleep(60);
  check("removed with the pointer: the tag fades (opacity, duration.fast) while its cell closes (duration.reveal), still in the row", [await tags(), await q(`document.getAnimations().filter((a)=>a.transitionProperty==="opacity"&&a.effect?.target?.matches?.(${JSON.stringify(TAG)})).map((a)=>a.effect.getTiming().duration)`), await q(`document.getAnimations().filter((a)=>a.transitionProperty==="grid-template-columns"&&a.effect?.target?.matches?.(${JSON.stringify(ITEM)})).map((a)=>a.effect.getTiming().duration)`)], [["Billing", "Onboarding", "Search"], [100], [200]]);
  await sleep(300);
  const mid = await nextX(1);
  /* the last frames before it leaves, then after: where the next tag is */
  let lastX = mid;
  for (let t = 0; t < 60 && (await tags()).length === 3; t++) { lastX = await nextX(1); await sleep(50); }
  await p.rate(1); await sleep(120);
  const to = await nextX(0);
  check("the next tag slides into the room it leaves (on its way mid-motion) and does not move when the tag is removed", [mid < from && mid > to, Math.abs(lastX - to) <= 0.5, await tags()], [true, true, ["Onboarding", "Search"]]);
  /* two tags on their way out together: both leave, the others stay (each is removed by its id
   * as it is then, one at a time) */
  for (const word of ["Alpha", "Beta", "Gamma"]) { await p.clickSel(INPUT); await p.type(word); await p.key("Enter"); await sleep(80); }
  const removeAt = (i) => q(`(()=>{const b=document.querySelectorAll(${JSON.stringify(`${TAG} [data-tag=remove]`)})[${i}].getBoundingClientRect();return {cx:b.x+b.width/2,cy:b.y+b.height/2}})()`);
  await p.rate(0.02);
  const one = await removeAt(2); await p.click(one.cx, one.cy);
  const two = await removeAt(4); await p.click(two.cx, two.cy);
  await p.rate(1); await sleep(700);
  check("two tags removed in one go (the third and the fifth): both leave, the others stay", await tags(), ["Onboarding", "Search", "Beta"]);
  const tidy = await removeAt(2); await p.click(tidy.cx, tidy.cy); await sleep(450);

  /* reduced motion, on a tag added for it (the two tags above stay as they are) */
  await p.clickSel(INPUT); await p.type("Temp"); await p.key("Enter"); await sleep(120);
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const last = await q(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(`${TAG} [data-tag=remove]`)})].pop().getBoundingClientRect();return {cx:b.x+b.width/2,cy:b.y+b.height/2}})()`);
  await p.click(last.cx, last.cy); await sleep(30);
  check("reduced motion: nothing travels (the cell closes at once)", await q(`document.getAnimations().filter((a)=>a.transitionProperty==="grid-template-columns").length`), 0);
  await sleep(250);
  check("and the tag leaves", await tags(), ["Onboarding", "Search"]);
  /* (the page lays its text out again when the emulated media change: let it settle before measuring) */
  await p.media([]); await sleep(250);

  /* editing a tag in place: nothing moves when it starts, after select-all and one letter, or on
   * Escape; the edit field draws no ring of its own. Then Enter commits; the tag stays selected */
  const before = await layout();
  await dblclick(await p.rect(`${TAG} [data-slot=tag-label]`));
  check("a double click edits the tag in place: a 22px field with its text, all of it selected, focused, with no ring, outline or fill of its own", await q(`(()=>{const i=document.querySelector(${JSON.stringify(EDIT)});if(!i)return null;const cs=getComputedStyle(i);return [i.value, Math.round(i.getBoundingClientRect().height), i.selectionStart, i.selectionEnd, document.activeElement===i, cs.boxShadow, cs.outlineStyle, cs.backgroundColor]})()`), ["Onboarding", 22, 0, 10, true, "none", "none", "rgba(0, 0, 0, 0)"]);
  check("the tag being edited keeps its box (22px, chip radius, the accent-tint fill), its label and × not drawn", await q(`(()=>{const t=document.querySelector(${JSON.stringify(TAG)});const cs=getComputedStyle(t);return [Math.round(t.getBoundingClientRect().height), cs.borderRadius, cs.backgroundColor, getComputedStyle(t.querySelector("[data-slot=tag-label]")).visibility, getComputedStyle(t.querySelector("[data-tag=remove]")).visibility]})()`), [22, "6px", await token("--fndn-accent-tint"), "hidden", "hidden"]);
  check("editing starts without moving anything: the text on the label's pixels, the tags after it in place", await layout(), before);
  await p.type("O"); await sleep(120);
  check("select-all then one letter: the edited tag keeps its width, nothing moves", await layout(), before);
  await p.type("nboarding and setup guide"); await sleep(120);
  const grown = await layout();
  check("longer text widens the edited tag, from the same start", [grown[0][0], grown[0][2] > before[0][2]], [before[0][0], true]);
  await p.key("Escape"); await sleep(150);
  check("Escape restores the tag where it was, selected, focus back in the field", [await tags(), await layout(), await lit(), await inField()], [["Onboarding", "Search"], before, "Onboarding", true]);
  await p.key("Enter"); await sleep(200);
  await p.key("End"); await p.type(" flow"); await p.key("Enter"); await sleep(200);
  check("Enter on a selected tag edits it; Enter commits the edit; the tag stays selected, focus in the field", [await tags(), await lit(), await inField()], [["Onboarding flow", "Search"], "Onboarding flow", true]);
  /* an edit into another tag's text: the edited tag keeps its text, the other one is selected */
  await p.key("Enter"); await sleep(200); await p.type("Search"); await p.key("Enter"); await sleep(200);
  check("an edit committed with another tag's text is not taken: the tag keeps its text, the tag that has it is selected, focus in the field", [await tags(), await lit(), await inField()], [["Onboarding flow", "Search"], "Search", true]);
  await p.key("Enter"); await sleep(200); await p.key("Enter"); await sleep(200);
  check("an edit that keeps the tag's own text is no duplicate: the tag stays as it is, selected", [await tags(), await lit(), await inField()], [["Onboarding flow", "Search"], "Search", true]);
  await p.key("Escape"); await sleep(80);

  /* leaving an edit (a click away, Tab) commits it as Enter does; Escape cancels; the focus goes
   * where it was put, never back into the field */
  const tagAt = (text) => q(`(()=>{const l=[...document.querySelectorAll(${JSON.stringify(`${TAG} [data-slot=tag-label]`)})].find((e)=>e.textContent===${JSON.stringify(text)});if(!l)return null;const b=l.getBoundingClientRect();return {cx:b.x+b.width/2,cy:b.y+b.height/2}})()`);
  const outside = () => q(`!document.querySelector("#stage [data-slot=tags-input]").contains(document.activeElement) && !document.querySelector(${JSON.stringify(EDIT)})`);
  const editTag = async (text) => { await dblclick(await tagAt(text)); };
  await editTag("Search"); await p.type("Security"); await p.click(5, 5); await sleep(200);
  check("a click away commits the edit: the tag takes the new text, the focus stays outside, nothing selected", [await tags(), await outside(), await lit()], [["Onboarding flow", "Security"], true, null]);
  await editTag("Security"); await p.type("Settings"); await p.key("Escape"); await sleep(200);
  check("Escape cancels the edit: the tag keeps its text", [await tags(), await inField()], [["Onboarding flow", "Security"], true]);
  await p.key("Escape"); await sleep(80);
  await editTag("Security"); await p.type("Search"); await p.key("Tab"); await sleep(200);
  /* the next tab stop after a tag is the field's own input */
  check("Tab commits the edit and moves on to the next tab stop (the field's input)", [await tags(), await inField(), await q(`!document.querySelector(${JSON.stringify(EDIT)})`)],[["Onboarding flow", "Search"], true, true]);
  await p.key("Tab", { shift: true }); await sleep(80);
  check("from there Shift+Tab leaves the field: the focus is not taken back", await outside(), true);
  await editTag("Search"); await p.type("Onboarding flow"); await p.click(5, 5); await sleep(200);
  check("a click away with another tag's text: the tag keeps its former text, nothing selected, the focus stays outside", [await tags(), await lit(), await outside()], [["Onboarding flow", "Search"], null, true]);
  await editTag("Search"); await p.click(5, 5); await sleep(200);
  check("a click away with the text unchanged changes nothing", [await tags(), await outside()], [["Onboarding flow", "Search"], true]);
  await editTag("Search"); await p.key("Backspace"); await p.key("Enter"); await sleep(200);
  check("Enter on an emptied edit removes the tag", await tags(), ["Onboarding flow"]);
  await p.clickSel(INPUT); await p.type("Search"); await p.key("Enter"); await sleep(150);
  await editTag("Search"); await p.key("Backspace"); await p.click(5, 5); await sleep(200);
  check("a click away from an emptied edit removes the tag too, as Enter does", [await tags(), await outside()], [["Onboarding flow"], true]);
  await p.clickSel(INPUT); await p.type("Search"); await p.key("Enter"); await p.key("Escape"); await sleep(150);

  /* blur adds what was typed */
  await p.clickSel(INPUT); await p.type("API"); await p.click(1200, 860); await sleep(200);
  check("leaving the field adds the text left in it", await tags(), ["Onboarding flow", "Search", "API"]);

  await open(fw, 3);
  await p.clickSel(INPUT); await p.type("API"); await p.key("Enter"); await sleep(150);
  check("max 3: a fourth tag is not added", (await tags()).length, 3);
  await open(fw, 2);
  check("sm: a 28px row, 22px tags", await q(`[Math.round(document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect().height), Math.round(document.querySelector(${JSON.stringify(TAG)}).getBoundingClientRect().height)]`), [28, 22]);
  await open(fw, 4);
  check("invalid: a red hairline", await q(`getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).boxShadow.includes(${JSON.stringify(await token("--fndn-red", "color"))})`), true);
  await open(fw, 5);
  check("disabled: the field is disabled, half opacity", await q(`[document.querySelector(${JSON.stringify(INPUT)}).disabled, getComputedStyle(document.querySelector(${JSON.stringify(CTRL)})).opacity]`), [true, "0.5"]);

  /* worst cases */
  await open(fw, 0, "&data=worst");
  check("many tags wrap onto rows 4px apart; nothing spills sideways", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)});const tops=[...new Set([...c.querySelectorAll(${JSON.stringify("[data-tags-input=item-preview]")})].map((e)=>Math.round(e.getBoundingClientRect().top)))];return [tops.length>2, tops[1]-tops[0], c.scrollWidth<=c.clientWidth]})()`), [true, 26, true]);
  await open(fw, 1, "&data=worst");
  await sleep(200);
  check("an unbreakable tag is cut at the end inside the field and its title holds the whole text", await q(`(()=>{const c=document.querySelector(${JSON.stringify(CTRL)}).getBoundingClientRect();const l=document.querySelector(${JSON.stringify(`${TAG} [data-slot=tag-label]`)});const t=l.closest("[data-slot=tag]").getBoundingClientRect();return [t.right<=c.right+0.5, l.getAttribute("title")===l.textContent]})()`), [true, true]);
  await open(fw, 3, "&data=worst&dir=rtl");
  check("rtl: tags run right to left; each keeps its own direction", await q(`(()=>{const t=[...document.querySelectorAll(${JSON.stringify(TAG)})];return [t[0].getBoundingClientRect().left>t[1].getBoundingClientRect().left, getComputedStyle(t[0].querySelector("[data-slot=tag-label]")).unicodeBidi]})()`), [true, "plaintext"]);
  /* tones: a map wins (looked up lower-cased), the rest are hashed by word (auto), same word same hue */
  await open(fw, 6);
  const hues = await q(`(()=>{const d=document.createElement("div");document.body.append(d);const out=[...document.querySelectorAll("#stage [data-tags-input=item-preview]")].map((t)=>{d.style.backgroundColor=getComputedStyle(t).getPropertyValue("--_hue").trim()||"transparent";return getComputedStyle(d).backgroundColor});d.remove();return out})()`);
  check("tones: bug red, billing purple, Docs green (the map, lower-cased); webhooks a tag hue of its own (auto)", [hues[0], hues[1], hues[3], hues[2] !== "rgba(0, 0, 0, 0)"], [await token("--fndn-tag-red"), await token("--fndn-tag-purple"), await token("--fndn-tag-green"), true]);
  await open(fw, 0, "&theme=dark");
  check("dark: the box takes the dark field fill", (await look(CTRL))[1], await token("--fndn-field"));

  await p.viewport(320, 700, 1.25);
  await open(fw, 1, "&data=worst");
  check("320px: the page does not scroll sideways", await q(`document.documentElement.scrollWidth<=320`), true);
  await p.viewport(1280, 900, 1.25);
}

for (const fw of targets) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = failed;
    const checks = [];
    const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; checks.push(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`); };
    try { await run(fw, check); if (p.errors.length) check("no console errors", p.errors.slice(0, 1), []); }
    catch (err) { failed++; checks.push(`✗ threw: ${String(err.message ?? err).split("\n")[0]}`); }
    if (failed > before && attempt < 2) { failed = before; await p.viewport(1280, 900, 1.25).catch(() => {}); await sleep(800); continue; }
    console.log(`${fw}\n  ${checks.join("\n  ")}`);
    break;
  }
}
console.log(failed ? `${failed} failed` : "all targets pass");
await p.close();
process.exit(failed ? 1 : 0);
