// Tiny CDP driver for headless Chromium (no dependencies). Used for QA of the docs site.
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
// Chromium: $CHROME_BIN, else the newest Playwright-cached build.
const CHROME = process.env.CHROME_BIN ?? (() => { const dir = `${process.env.HOME}/.cache/ms-playwright`; const builds = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1])) : []; if (!builds.length) throw new Error("No Chromium found. Set CHROME_BIN or run: npx playwright install chromium"); return `${dir}/${builds[0]}/chrome-linux64/chrome`; })();
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A port the OS says is free, so parallel runs never attach to each other's browser.
const freePort = () => new Promise((resolve, reject) => { const s = net.createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); }); });
// Headless Chromium reports `(hover: none)`; these make it report a mouse so gated hover rules can be exercised.
const HOVER_FLAGS = "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4";

/* A page that stops answering (a script that never yields, a renderer that died) would leave the
 * command sent to it waiting until the browser's MAX_LIFE, with nothing to say which page it was.
 * A command not answered within ANSWER_WITHIN fails instead, naming the page, and so does every
 * command after it: a script can tell this failure from the page's own errors by its class. */
const ANSWER_WITHIN = 120_000;
export class PageGone extends Error {}

const MAX_LIFE = 1800;
const SUPERVISE = `p="$1"; c="$2"; shift 2; "$c" "$@" & b=$!; trap 'kill $b 2>/dev/null' TERM INT HUP; n=0; while kill -0 "$PPID" 2>/dev/null && kill -0 $b 2>/dev/null && [ $n -lt ${MAX_LIFE} ]; do sleep 1; n=$((n+1)); done; kill $b 2>/dev/null; sleep 1; kill -9 $b 2>/dev/null; rm -rf "$p"`;

/* The motion utilities (motion-colors-fast, motion-transform-press) write one transition list from
 * a slot per kind of property; a slot that is not used leaves a no-op entry for the property "_".
 * The tests were written against plain lists ("the first duration is 0.25s"), so in test pages
 * getComputedStyle shows the transition lists without those entries. Nothing else is changed. */
const TRANSITION_VIEW = `(() => {
  const real = window.getComputedStyle;
  const NAMES = { transitionProperty: "transition-property", transitionDuration: "transition-duration", transitionTimingFunction: "transition-timing-function", transitionDelay: "transition-delay" };
  const LONG = new Set(Object.values(NAMES));
  const split = (v) => { const out = []; let depth = 0, cur = ""; for (const ch of v) { if (ch === "(") depth++; if (ch === ")") depth--; if (ch === "," && !depth) { out.push(cur.trim()); cur = ""; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  window.getComputedStyle = function (el, pseudo) {
    const cs = real.call(window, el, pseudo);
    let props;
    try { props = split(cs.getPropertyValue("transition-property")); } catch { return cs; }
    if (!props.includes("_") && !(props.includes("transform") && props.some((p) => /^(translate|scale|rotate)$/.test(p)))) return cs;
    /* motion-transform-* lists transform, translate, scale and rotate with one timing: the tests
     * mean "the transform", so the three companions are left out when they share its timing */
    const part = (name, i) => { const list = split(cs.getPropertyValue(name)); return list[i % list.length]; };
    const timing = (i) => part("transition-duration", i) + " " + part("transition-timing-function", i) + " " + part("transition-delay", i);
    const t = props.indexOf("transform");
    const kept = props.map((p, i) => (p === "_" || (t >= 0 && /^(translate|scale|rotate)$/.test(p) && timing(i) === timing(t)) ? -1 : i)).filter((i) => i >= 0);
    const view = (name) => {
      if (!kept.length) return name === "transition-property" ? "all" : name === "transition-timing-function" ? "ease" : "0s";
      const list = split(cs.getPropertyValue(name));
      return kept.map((i) => list[i % list.length]).join(", ");
    };
    return new Proxy(cs, {
      get(target, key) {
        if (typeof key === "string" && key in NAMES) return view(NAMES[key]);
        if (key === "getPropertyValue") return (name) => (LONG.has(name) ? view(name) : target.getPropertyValue(name));
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  };
})();`;

export async function launch({ port, width = 1280, height = 900, dpr = 1, hover = false } = {}) {
  port ??= await freePort();
  // Own profile per run: two Chromiums sharing a profile hand off to one process.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "fndn-qa-"));
  // The browser must never outlive the script that started it: a script that throws, times out or
  // is killed would otherwise leave it running (hundreds of them once filled memory and swap).
  // A small shell supervises it: it ends the browser when this process is gone, when asked to
  // (TERM from close()), or after MAX_LIFE seconds, then removes the profile.
  const chrome = spawn("sh", ["-c", SUPERVISE, "sh", profile, CHROME, ...["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, `--window-size=${width},${height}`, `--force-device-scale-factor=${dpr}`, ...(hover ? [HOVER_FLAGS] : []), "about:blank"]], { stdio: "ignore" });
  const end = () => { try { chrome.kill(); } catch {} };
  process.once("exit", end);
  /* the browser answers on its port a moment before it lists its first page: wait for the page */
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {}
    if (!target) await sleep(150);
  }
  if (!target) { end(); throw new Error("Chromium did not open a page"); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const errors = []; const listeners = new Map();
  /* the address last navigated to, and why the page is gone once it is (ANSWER_WITHIN, above) */
  let at = "about:blank", gone = null;
  const lose = (why) => {
    gone ??= new PageGone(`${why}: ${at}`);
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject(gone); }
    pending.clear();
  };
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id) { const p = pending.get(d.id); pending.delete(d.id); if (p) { clearTimeout(p.timer); p.resolve(d.error ? { __error: d.error } : d.result); } }
    if (d.method === "Inspector.targetCrashed") lose("the page crashed");
    if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.text + " " + (d.params.exceptionDetails.exception?.description ?? ""));
    if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" "));
    listeners.get(d.method)?.forEach((fn) => fn(d.params));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    if (gone) { reject(gone); return; }
    const timer = setTimeout(() => lose(`no answer to ${method} within ${ANSWER_WITHIN / 1000}s`), ANSWER_WITHIN);
    pending.set(++id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send("Runtime.enable"); await send("Page.enable"); await send("Animation.enable"); await send("Inspector.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: TRANSITION_VIEW });
  const page = {
    errors, send,
    on(method, fn) { (listeners.get(method) ?? listeners.set(method, []).get(method)).push(fn); },
    async goto(url, wait = 1200) { at = url; await send("Page.navigate", { url }); await sleep(wait); },
    async eval(expression) { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result?.value; },
    async shot(file, clip) { const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { scale: 1, ...clip } } : {}) }); fs.writeFileSync(file, Buffer.from(r.data, "base64")); return file; },
    async key(key, { shift = false, ctrl = false, alt = false, meta = false, text } = {}) {
      const codes = { Enter: 13, Tab: 9, Escape: 27, " ": 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, Backspace: 8, PageDown: 34, PageUp: 33, Delete: 46 };
      const modifiers = (alt ? 1 : 0) | (ctrl ? 2 : 0) | (meta ? 4 : 0) | (shift ? 8 : 0);
      const code = key === " " ? "Space" : key.length === 1 ? `Key${key.toUpperCase()}` : key;
      const vk = codes[key] ?? key.toUpperCase().charCodeAt(0);
      const t = text ?? (key.length === 1 ? key : key === "Enter" ? "\r" : undefined);
      await send("Input.dispatchKeyEvent", { type: t ? "keyDown" : "rawKeyDown", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers, ...(t ? { text: t } : {}) });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
      await sleep(30);
    },
    async type(str) { for (const ch of str) { await send("Input.insertText", { text: ch }); await sleep(10); } },
    async click(x, y) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }); await sleep(30); },
    async hover(x, y) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); await sleep(30); },
    /* a real mouse drag: move to the start, press, move in `steps` even steps with the button held, release */
    async drag(x1, y1, x2, y2, { steps = 8, stepDelay = 16 } = {}) {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x1, y: y1 });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: x1, y: y1, button: "left", buttons: 1, clickCount: 1 });
      for (let i = 1; i <= steps; i++) {
        const x = x1 + ((x2 - x1) * i) / steps, y = y1 + ((y2 - y1) * i) / steps;
        await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "left", buttons: 1 });
        await sleep(stepDelay);
      }
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x2, y: y2, button: "left", buttons: 0, clickCount: 1 });
      await sleep(30);
    },
    async clickSel(sel) { const r = await page.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'center'}); const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}})()`); if (!r) throw new Error("no element " + sel); await page.click(r.x, r.y); },
    async rect(sel) { return page.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2}})()`); },
    async active() { return page.eval(`(()=>{const a=document.activeElement; if(!a) return null; return (a.tagName.toLowerCase())+(a.id?'#'+a.id:'')+(a.className&&typeof a.className==='string'?'.'+a.className.split(' ').join('.'):'')+' | '+(a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,40)})()`); },
    async media(features) { await send("Emulation.setEmulatedMedia", { features }); },
    async rate(playbackRate) { await send("Animation.setPlaybackRate", { playbackRate }); },
    async viewport(width, height, dpr = 1, mobile = false) { await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile }); },
    async close() { try { ws.close(); } catch {} process.off("exit", end); end(); },
  };
  return page;
}
