/* truncate — text cut by an ellipsis stays readable. While a part's text is cut (overflow hidden,
 * text-overflow: ellipsis, and wider than its box), the part carries a `title` with the full text;
 * once it fits again the title goes. A title the host set itself, on the part or around it, wins.
 * Shared by the React, Vue and Svelte adapters (button, status-pill,
 * segmented-control, collapsible; middle truncation: code-block, hover-card, prompt-bar). Plain TypeScript, no framework imports. */

const ours = new WeakSet<Element>();
/* parts whose text middleTruncation (below) manages: it keeps their title */
type Middle = { full: string; shown: string; titled: boolean; labelled: boolean };
const middles = new WeakMap<HTMLElement, Middle>();

function check(el: HTMLElement): void {
  if (el.closest(".sr-only")) return; /* a hidden name (icon-only segments) is not shown text */
  if (middles.has(el)) { ours.delete(el); return; }
  const s = getComputedStyle(el);
  const clips = (s.overflowX === "hidden" || s.overflowX === "clip") && s.textOverflow === "ellipsis";
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  /* a title on the part or around it (the host's own) already makes it readable */
  const cut = clips && text !== "" && el.scrollWidth > el.clientWidth + 1 && !el.parentElement?.closest("[title]");
  if (cut) {
    if (el.hasAttribute("title") && !ours.has(el)) return;
    if (el.getAttribute("title") !== text) el.setAttribute("title", text);
    ours.add(el);
  } else if (ours.has(el)) {
    el.removeAttribute("title");
    ours.delete(el);
  }
}

/** Watch `root` (and, with a selector, the parts inside it that match) and keep a `title` on each
 * while its text is truncated. Follows size changes and text changes; returns a cleanup. */
export function truncationTitles(root: HTMLElement | null | undefined, selector?: string): () => void {
  if (!root || typeof ResizeObserver === "undefined") return () => {};
  const parts = (): HTMLElement[] => (selector ? [...(root.matches(selector) ? [root] : []), ...root.querySelectorAll<HTMLElement>(selector)] : [root]);
  const observed = new Set<HTMLElement>();
  const ro = new ResizeObserver(() => parts().forEach(check));
  const sync = () => {
    const now = parts();
    for (const el of now) if (!observed.has(el)) { observed.add(el); ro.observe(el); }
    for (const el of observed) if (!now.includes(el)) { observed.delete(el); ro.unobserve(el); }
    now.forEach(check);
  };
  /* attribute changes are not observed, so setting the title does not call back */
  const mo = new MutationObserver(sync);
  mo.observe(root, { childList: true, subtree: true, characterData: true });
  sync();
  return () => {
    ro.disconnect();
    mo.disconnect();
    for (const el of observed) if (ours.has(el)) { el.removeAttribute("title"); ours.delete(el); }
  };
}

/* ── middle truncation ──────────────────────────────────────────────────────────────────────────
 * A path or a file name cut at its end loses the part that names it (the file). Middle truncation
 * keeps the start and the end and puts the ellipsis between them: "packages/…/select.tsx",
 * "invoice-batch-…-scheduler.ts". The part keeps its one text node; while the text is shortened the
 * part carries the full text in `title`, and once it fits again the full text and no title come
 * back. A framework that renders new text into the part (a new path) is followed: whatever text
 * the part holds that this helper did not write is the new full text. */

/** Text that reads as a path or a file name: a slash, or one word ending in an extension. */
export const looksLikePath = (text: string): boolean => /[\\/]/.test(text) || /^[^\s]+\.[A-Za-z0-9]{1,8}$/.test(text.trim());

const ELLIPSIS = "…";

function writeText(el: HTMLElement, text: string): void {
  /* keep the nodes a framework rendered (Vue and Svelte keep empty text and comment anchors beside
   * the text): only the value of the one text node that holds the text changes */
  const texts = Array.from(el.childNodes).filter((n): n is Text => n.nodeType === 3 && n.nodeValue !== "");
  const node = texts.length === 1 ? texts[0]! : texts.length === 0 ? Array.from(el.childNodes).find((n): n is Text => n.nodeType === 3) : undefined;
  if (node) { if (node.nodeValue !== text) node.nodeValue = text; }
  else if (texts.length === 0) el.append(text);
  else if (el.textContent !== text) el.textContent = text;
}

/** `full` with `keep` characters kept: the end keeps the file name whole when there is room for it
 * and a few characters of the start, the start takes the rest. */
function middleOf(chars: string[], keep: number): string {
  const full = chars.join("");
  const at = Math.max(full.lastIndexOf("/"), full.lastIndexOf("\\"));
  /* in characters (code points, so an emoji is never split): the file name, or the extension */
  const name = at >= 0 ? Array.from(full.slice(at)).length : full.lastIndexOf(".") > 0 ? Array.from(full.slice(full.lastIndexOf("."))).length : chars.length;
  let tail = Math.ceil(keep / 2);
  if (keep >= name + 3) tail = Math.max(tail, name);
  tail = Math.min(tail, keep);
  return chars.slice(0, keep - tail).join("") + ELLIPSIS + chars.slice(chars.length - tail).join("");
}

function fitMiddle(el: HTMLElement, state: Middle): void {
  const cs = getComputedStyle(el);
  const edges = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((sum, k) => sum + (parseFloat(cs[k as "paddingLeft"]) || 0), 0);
  const range = document.createRange();
  /* the text's own width, not scrollWidth: text laid out right to left inside a left-to-right box
   * (unicode-bidi: plaintext) overflows on the side that does not scroll. Divided by the box's
   * scale, so a part in the middle of a scale transition measures as at rest. */
  const cuts = () => {
    if (el.scrollWidth > el.clientWidth + 1) return true;
    range.selectNodeContents(el);
    const box = el.getBoundingClientRect().width;
    /* the width at rest from the computed width, which keeps its fraction: offsetWidth is rounded
     * to whole pixels, and a box that hugs its text (171.31px read as 171) then looked scaled and
     * its whole text looked a few hundredths too wide, so a path that fitted was cut */
    const w = parseFloat(cs.width);
    const rest = Number.isFinite(w) ? (cs.boxSizing === "border-box" ? w : w + edges) : el.offsetWidth;
    const scale = (rest ? box / rest : 1) || 1;
    /* fractional: the ellipsis shows for any overflow, even a tenth of a pixel */
    return range.getBoundingClientRect().width / scale > box / scale - edges + 0.01;
  };
  const full = state.full;
  const chars = Array.from(full);
  let best = full;
  writeText(el, full);
  if (chars.length > 1 && el.clientWidth > 0 && cuts()) {
    /* the longest kept length whose text fits (widths grow with the length kept) */
    let lo = 0;
    let hi = chars.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      writeText(el, middleOf(chars, mid));
      if (cuts()) hi = mid - 1;
      else lo = mid;
    }
    best = middleOf(chars, lo);
  }
  state.shown = best;
  writeText(el, best);
  const cut = best !== full;
  if (cut) {
    if (!el.hasAttribute("title") || state.titled || el.getAttribute("title") === full) { if (el.getAttribute("title") !== full) el.setAttribute("title", full); state.titled = true; }
    /* a control named by its text (a trigger) keeps its full name */
    if (el.matches("button, a[href]") && (!el.hasAttribute("aria-label") || state.labelled)) { if (el.getAttribute("aria-label") !== full) el.setAttribute("aria-label", full); state.labelled = true; }
  } else {
    if (state.titled) { el.removeAttribute("title"); state.titled = false; }
    if (state.labelled) { el.removeAttribute("aria-label"); state.labelled = false; }
  }
}

/** Keep the text of `root` (or, with a selector, of each part inside it that matches) whole when it
 * fits and cut in the middle when it does not, with the full text in `title` while it is cut. The
 * part must be a one-line box that clips (overflow hidden, white-space nowrap). Re-measures when the
 * part, its container or its text changes; `when` limits it to some texts (looksLikePath: others
 * keep their end ellipsis). Returns a cleanup that puts the full text back. */
export function middleTruncation(
  root: HTMLElement | null | undefined,
  selector?: string,
  opts: { when?: (text: string) => boolean } = {},
): () => void {
  if (!root || typeof ResizeObserver === "undefined") return () => {};
  const parts = (): HTMLElement[] => (selector ? [...(root.matches(selector) ? [root] : []), ...root.querySelectorAll<HTMLElement>(selector)] : [root]);
  const observed = new Set<HTMLElement>();
  const fit = (el: HTMLElement) => {
    /* only a part that holds text alone (an icon or markup inside is the host's) */
    if (el.childElementCount > 0) return;
    const now = el.textContent ?? "";
    let state = middles.get(el);
    /* text this helper did not write is the new full text */
    if (!state) { state = { full: now, shown: now, titled: false, labelled: false }; middles.set(el, state); }
    else if (now !== state.shown) {
      state.full = now;
      state.shown = now;
    }
    if (opts.when && !opts.when(state.full)) {
      /* not a path: the whole text, cut at its end by CSS (truncationTitles keeps its title) */
      writeText(el, state.full);
      if (state.titled) el.removeAttribute("title");
      if (state.labelled) el.removeAttribute("aria-label");
      middles.delete(el);
      return;
    }
    fitMiddle(el, state);
  };
  let busy = false;
  const fitAll = () => {
    if (busy) return;
    busy = true;
    try { parts().forEach(fit); } finally { busy = false; }
    mo.takeRecords();
  };
  const ro = new ResizeObserver(fitAll);
  const sync = () => {
    const now = parts();
    for (const el of now) {
      if (observed.has(el)) continue;
      observed.add(el);
      ro.observe(el);
      /* the room is the container's: a part that shrank to its short text does not grow back by
       * itself (the nearest ancestor with a box: display: contents has none to observe) */
      let box = el.parentElement;
      while (box && box !== document.body && getComputedStyle(box).display === "contents") box = box.parentElement;
      if (box) ro.observe(box);
    }
    for (const el of observed) if (!now.includes(el)) { observed.delete(el); ro.unobserve(el); }
    fitAll();
  };
  const mo = new MutationObserver(sync);
  mo.observe(root, { childList: true, subtree: true, characterData: true });
  sync();
  /* the measure changes once the web fonts arrive */
  document.fonts?.ready.then(() => { if (observed.size) fitAll(); });
  return () => {
    ro.disconnect();
    mo.disconnect();
    for (const el of observed) {
      const state = middles.get(el);
      if (!state) continue;
      writeText(el, state.full);
      if (state.titled) el.removeAttribute("title");
      if (state.labelled) el.removeAttribute("aria-label");
      middles.delete(el);
    }
    observed.clear();
  };
}
