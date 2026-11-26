/* Prompt bar — layout and send-sweep helpers shared by every target.
 *
 *   wideLayout  does the text need the full width (controls drop to a second row)?
 *   autosize    the textarea grows with its content up to its CSS max-height, then scrolls.
 *               CSS `field-sizing: content` does this where supported; elsewhere this measures
 *               a hidden twin, so the real field never collapses (no page jump while typing).
 *   flipRow     when the layout switches (the controls drop to a second row, or come back), the
 *               controls and the input travel from where they were to their new place and the
 *               composer's height follows, as one motion over duration.move (FLIP: translate and
 *               height transitions, so typing back and forth across the threshold retargets
 *               from wherever things are). Not on first paint.
 *   sweep       one glimm sweep across the composer per send. Feature-detected (WebGL, the
 *               module loading), skipped under reduced motion, never two at once.
 * Plain TypeScript, DOM only, no framework imports. */

let ctx: CanvasRenderingContext2D | null | undefined;

/** True when the text wraps or has a newline at the width the input gets beside the controls. */
export function wideLayout(row: HTMLElement | null, input: HTMLTextAreaElement | null, value: string): boolean {
  if (!row || !input) return false;
  if (value.includes("\n")) return true;
  /* the placeholder counts as much as typed text: a hint cut by the controls ("Ask about this cod…")
   * moves them to their own row as typed text would */
  const shown = value || input.placeholder;
  if (!shown) return false;
  if (ctx === undefined) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return false;
  const style = getComputedStyle(input);
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const text = ctx.measureText(shown).width;
  /* the room beside the controls is the same in both layouts: the controls keep their widths */
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const others = Array.from(row.children).filter((c) => c !== input) as HTMLElement[];
  const room = row.clientWidth - others.reduce((w, c) => w + c.offsetWidth, 0) - gap * others.length
    - (parseFloat(style.paddingInlineStart) || 0) - (parseFloat(style.paddingInlineEnd) || 0);
  return text + 2 > room;
}

const fieldSizing = (): boolean => typeof CSS !== "undefined" && !!CSS.supports?.("field-sizing", "content");

/** Grow the textarea with its content. Returns a function to call after each value change. */
export function autosize(input: HTMLTextAreaElement): { update: () => void; stop: () => void } {
  if (fieldSizing()) return { update: () => {}, stop: () => {} };
  const twin = document.createElement("textarea");
  twin.setAttribute("aria-hidden", "true");
  twin.tabIndex = -1;
  twin.rows = 1;
  Object.assign(twin.style, { position: "absolute", visibility: "hidden", pointerEvents: "none", insetInlineStart: "-9999px", top: "0", height: "0", minHeight: "0", overflow: "hidden" });
  const update = () => {
    const style = getComputedStyle(input);
    if (!twin.isConnected) document.body.append(twin);
    for (const p of ["font", "letterSpacing", "lineHeight", "paddingTop", "paddingBottom", "paddingInlineStart", "paddingInlineEnd", "boxSizing", "overflowWrap", "wordBreak", "whiteSpace", "tabSize"] as const) {
      (twin.style as any)[p] = (style as any)[p];
    }
    twin.style.width = `${input.clientWidth}px`;
    twin.value = input.value || input.placeholder;
    const min = parseFloat(style.minHeight) || 0;
    const max = parseFloat(style.maxHeight) || Infinity;
    const border = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
    const content = twin.scrollHeight + border;
    input.style.height = `${Math.min(Math.max(content, min), max)}px`;
    input.style.overflowY = content > max ? "auto" : "hidden";
  };
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => update());
  observer?.observe(input);
  update();
  return { update, stop: () => { observer?.disconnect(); twin.remove(); } };
}

/* ── layout switch (FLIP) ─────────────────────────────────── */

type Spot = { x: number; y: number };
const translateOf = (el: HTMLElement): Spot => {
  const t = getComputedStyle(el).translate;
  if (!t || t === "none") return { x: 0, y: 0 };
  const [x = "0", y = "0"] = t.split(" ");
  return { x: parseFloat(x) || 0, y: parseFloat(y) || 0 };
};

/**
 * Watch `row` (the grid of attach | input | model | dictate | send) inside `composer`. When a class
 * change moves its children (the expanded layout switching), each child is put back where it was
 * seen (translate, data-flip="from": no transition) and then released (data-flip="to": the recipe's
 * move transition), and the composer's height goes from the old value to the new one the same way.
 * Returns a cleanup.
 */
export function flipRow(row: HTMLElement, composer: HTMLElement): () => void {
  if (typeof window === "undefined") return () => {};
  const spots = new Map<HTMLElement, Spot>();
  let ready = false;
  /* the composer's last laid-out height (the new one is already in place when a switch is seen) */
  let height = composer.offsetHeight;
  let timer = 0;
  const kids = () => Array.from(row.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
  /* where each child sits in the layout (its transform taken out), relative to the row */
  const layoutSpot = (el: HTMLElement, box = row.getBoundingClientRect()): Spot => {
    const r = el.getBoundingClientRect();
    const t = translateOf(el);
    return { x: r.left - box.left - t.x, y: r.top - box.top - t.y };
  };
  const flipping = () => composer.hasAttribute("data-flip");
  const remember = () => {
    if (flipping()) return;
    const box = row.getBoundingClientRect();
    spots.clear();
    for (const el of kids()) spots.set(el, layoutSpot(el, box));
    height = composer.offsetHeight;
  };
  const settle = () => {
    window.clearTimeout(timer);
    for (const el of kids()) { el.removeAttribute("data-flip"); el.style.translate = ""; }
    composer.removeAttribute("data-flip");
    composer.style.height = "";
    remember();
  };
  const play = () => {
    if (!ready) { remember(); return; }
    const box = row.getBoundingClientRect();
    /* the layout now (transforms taken out): did anything change place since the last one? */
    const next = new Map<HTMLElement, Spot>();
    for (const el of kids()) next.set(el, layoutSpot(el, box));
    const moved = kids().filter((el) => {
      const a = spots.get(el), b = next.get(el);
      return a && b && (Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5);
    });
    if (!moved.length) { if (!flipping()) remember(); return; }
    /* where they are seen: the old layout plus any translate still on its way */
    const seen = new Map<HTMLElement, Spot>();
    for (const el of moved) {
      const at = spots.get(el)!, t = translateOf(el);
      seen.set(el, { x: at.x + t.x, y: at.y + t.y });
    }
    /* mid-way the inline height is where it is seen; at rest, the last laid-out height */
    const fromHeight = flipping() ? composer.offsetHeight : height;
    composer.style.height = "";
    const toHeight = composer.offsetHeight;
    /* back to where they were seen, at once */
    composer.setAttribute("data-flip", "from");
    composer.style.height = `${fromHeight}px`;
    for (const el of moved) {
      const a = seen.get(el)!, b = next.get(el)!;
      el.setAttribute("data-flip", "from");
      el.style.translate = `${a.x - b.x}px ${a.y - b.y}px`;
    }
    void composer.offsetHeight;
    /* then to their new place, together */
    composer.setAttribute("data-flip", "to");
    composer.style.height = `${toHeight}px`;
    for (const el of moved) { el.setAttribute("data-flip", "to"); el.style.translate = ""; }
    spots.clear();
    for (const [el, at] of next) spots.set(el, at);
    height = toHeight;
    /* the end: the height transition's own end, or the move's duration (0 under reduced motion) */
    window.clearTimeout(timer);
    const ms = Math.max(0, ...getComputedStyle(composer).transitionDuration.split(",").map((d) => (d.trim().endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000) || 0));
    timer = window.setTimeout(settle, ms + 50);
  };
  const end = (e: TransitionEvent) => { if (e.target === composer && e.propertyName === "height") settle(); };
  remember();
  const observer = new MutationObserver(play);
  observer.observe(row, { attributes: true, attributeFilter: ["class"], subtree: true, childList: true });
  const sizes = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(remember);
  sizes?.observe(row);
  composer.addEventListener("transitionend", end);
  /* nothing travels on first paint */
  const frame = requestAnimationFrame(() => requestAnimationFrame(() => { remember(); ready = true; }));
  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    observer.disconnect();
    sizes?.disconnect();
    composer.removeEventListener("transitionend", end);
  };
}

/**
 * After chip `index` was removed (and the view re-rendered), keep focus in the bar: the remove
 * button of the chip now at that position, else the one before it, else `fallback` (the textarea).
 * Looked up afresh because adapters key chips by position, so the old nodes may have been replaced.
 */
export function focusAfterRemove(root: HTMLElement | null, index: number, fallback: HTMLElement | null): void {
  const buttons = root ? Array.from(root.querySelectorAll<HTMLElement>("[data-prompt-bar=attachment-remove]")) : [];
  (buttons[index] ?? buttons[index - 1] ?? fallback)?.focus();
}

/* ── send sweep ─────────────────────────────────────────── */

const sweeping = new WeakSet<HTMLCanvasElement>();
let webgl: boolean | undefined;
const hasWebGL = (): boolean => {
  if (webgl === undefined) {
    try {
      const c = document.createElement("canvas");
      const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext | null;
      webgl = !!gl;
      (gl?.getExtension("WEBGL_lose_context") as { loseContext?: () => void } | null)?.loseContext?.();
    } catch { webgl = false; }
  }
  return webgl;
};

const token = (name: string, fallback: number): number => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? (raw.endsWith("ms") ? n : raw.endsWith("s") ? n * 1000 : n) : fallback;
};

/**
 * One rainbow sweep across `canvas` (the composer's interior). Resolves when it is done or
 * skipped. While it plays the canvas carries data-sweeping.
 */
export async function sweep(canvas: HTMLCanvasElement | null, rtl = false): Promise<"played" | "skipped"> {
  if (!canvas || sweeping.has(canvas)) return "skipped";
  if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "skipped";
  if (!hasWebGL()) return "skipped";
  sweeping.add(canvas);
  try {
    const glimm = await import("glimm").catch(() => null);
    if (!glimm || !canvas.isConnected) return "skipped";
    const { createShader, playSweep, accentChain, ACCENTS } = glimm;
    const palette = accentChain([ACCENTS.red, ACCENTS.orange, ACCENTS.yellow, ACCENTS.green, ACCENTS.cyan, ACCENTS.blue, ACCENTS.purple]);
    const direction = rtl ? "rtl" : "ltr";
    /* createShader seeds its hue phase from Math.random(); pin it so every sweep looks the same */
    const random = Math.random;
    let shader: ReturnType<typeof createShader>;
    Math.random = () => 0;
    try { shader = createShader({ canvas, palette, direction, bandTight: 10, swellAmount: 0.85 }); }
    finally { Math.random = random; }
    if (!shader) return "skipped";
    canvas.setAttribute("data-sweeping", "");
    /* timing from the tokens, so a slowed-down --fndn-duration-* reaches it too */
    const run = playSweep(shader, {
      /* a band travelling across the composer: on-screen movement, so ease-in-out at an even pace
       * (easeOutExpo over 600ms crossed in about 150ms, far too fast), over
       * duration.sweep, and a fade-out at duration.slow */
      palette, direction, bandTight: 10, peakAlpha: 1.3, brightness: 1.4, swellAmount: 1, waveSpeed: 1.8, easing: "easeInOutCubic",
      sweepMs: token("--fndn-duration-sweep", 1000),
      outroMs: token("--fndn-duration-slow", 250),
    });
    await run.done.catch(() => {});
    shader.destroy();
    return "played";
  } catch {
    return "skipped";
  } finally {
    canvas.removeAttribute("data-sweeping");
    sweeping.delete(canvas);
  }
}
