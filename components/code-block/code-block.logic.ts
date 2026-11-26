/* code-block — framework-neutral pieces shared by the React, Vue and Svelte adapters. */

export type CodeToken = { text: string; tok?: "kw" | "str" | "fn" };

/* light syntax colouring — keywords / imports / conditionals, strings and numbers, function calls */
const KEYWORDS = new Set(["import", "from", "export", "default", "async", "function", "const", "let", "var", "await", "return", "if", "else", "for", "while", "new", "throw", "try", "catch", "null", "true", "false", "undefined"]);
const TOKEN = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b(?:import|from|export|default|async|function|const|let|var|await|return|if|else|for|while|new|throw|try|catch|null|true|false|undefined)\b|[A-Za-z_$][\w$]*(?=\s*\())/g;

/** Split one line into plain runs and coloured tokens. Every target renders the same runs. */
export function tokenize(text: string): CodeToken[] {
  const out: CodeToken[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    const t = m[0];
    if (idx > last) out.push({ text: text.slice(last, idx) });
    out.push({ text: t, tok: /^["'`]/.test(t) || /^\d/.test(t) ? "str" : KEYWORDS.has(t) ? "kw" : "fn" });
    last = idx + t.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** How long the Copy button says "Copied". */
export const CODE_BLOCK_COPIED_MS = 1500;

/** Put text on the clipboard; falls back to a hidden textarea where the async API is refused. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;inset-block-start:0;inset-inline-start:0;opacity:0;pointer-events:none";
    const active = document.activeElement as HTMLElement | null;
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    area.remove();
    active?.focus({ preventScroll: true });
    return ok;
  }
}

/** The copy flow: copy, report `copied`, and reset after CODE_BLOCK_COPIED_MS (a repeat click restarts it). */
export function createCopier(onState: (copied: boolean) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    async copy(text: string): Promise<boolean> {
      const ok = await copyText(text);
      if (!ok) return false;
      clearTimeout(timer);
      onState(true);
      timer = setTimeout(() => onState(false), CODE_BLOCK_COPIED_MS);
      return true;
    },
    stop() { clearTimeout(timer); },
  };
}

/** Whether the file tabs of a block with files fit its header row. Names of
 * choices are shown whole, so when the tabs do not fit (five files at 320px) they give way to a
 * pager and a select that lists every file; they come back once they fit. The tabs fit when their
 * natural width (nothing shortened) fits the header beside Copy, the path shrinking to nothing.
 * Measured with the tab list laid out off-flow, so it works whether the list shows or not. */
export function fileTabsFit(root: HTMLElement): boolean {
  const header = root.querySelector<HTMLElement>("[data-slot=code-block-header], [data-slot=tabs-header]");
  const list = header?.querySelector<HTMLElement>("[data-slot=tabs-list]");
  if (!header || !list || header.clientWidth === 0) return true;
  const saved = list.style.cssText;
  list.style.cssText = "display: flex; position: absolute; visibility: hidden; width: max-content; max-width: none; overflow: visible";
  const natural = list.offsetWidth;
  list.style.cssText = saved;
  const cs = getComputedStyle(header);
  const gap = parseFloat(cs.columnGap) || 0;
  let room = header.clientWidth - parseFloat(cs.paddingInlineStart) - parseFloat(cs.paddingInlineEnd);
  /* what stays beside the tabs: the path's padding (its text may shrink to nothing) and Copy */
  const path = header.querySelector<HTMLElement>(":scope > [data-slot=code-block-path]");
  if (path) room -= gap + parseFloat(getComputedStyle(path).paddingInlineStart) + parseFloat(getComputedStyle(path).paddingInlineEnd);
  const copy = header.querySelector<HTMLElement>(":scope > [data-code-block=copy]");
  if (copy) {
    const c = getComputedStyle(copy);
    room -= gap + copy.offsetWidth + Math.min(0, parseFloat(c.marginInlineEnd) || 0);
  }
  return natural <= room + 0.5;
}

/** Call `onFit` with fileTabsFit(root) now and whenever the block's width changes (and once the web
 * fonts have loaded). Only a change of width refits, so the switch itself cannot loop. */
export function watchFileTabs(root: HTMLElement, onFit: (fits: boolean) => void): () => void {
  let width = -1;
  let last: boolean | undefined;
  let live = true;
  const check = (force = false) => {
    if (!live) return;
    const w = Math.round(root.clientWidth);
    if (!force && w === width) return;
    width = w;
    const fits = fileTabsFit(root);
    if (fits !== last) { last = fits; onFit(fits); }
  };
  check(true);
  document.fonts?.ready.then(() => check(true));
  if (typeof ResizeObserver === "undefined") return () => { live = false; };
  const ro = new ResizeObserver(() => check());
  ro.observe(root);
  return () => { live = false; ro.disconnect(); };
}

/** While the code overflows its box (a max height is set), the body becomes a focusable, named
 * scroll region so keyboard users can scroll it; otherwise it is a plain container. */
export function watchOverflow(body: HTMLElement, label: string): () => void {
  const update = () => {
    const overflows = body.scrollHeight > body.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1;
    if (overflows) {
      if (body.getAttribute("tabindex") !== "0") body.setAttribute("tabindex", "0");
      if (body.getAttribute("role") !== "region") body.setAttribute("role", "region");
      if (body.getAttribute("aria-label") !== label) body.setAttribute("aria-label", label);
    } else {
      body.removeAttribute("tabindex");
      body.removeAttribute("role");
      body.removeAttribute("aria-label");
    }
  };
  update();
  if (typeof ResizeObserver === "undefined") return () => {};
  const ro = new ResizeObserver(update);
  ro.observe(body);
  if (body.firstElementChild) ro.observe(body.firstElementChild);
  return () => ro.disconnect();
}

/** Keep the current line in view: when it changes, the open body scrolls (at once, it follows the
 * caret) just enough to show that row, a line's height clear of the edge; the page never scrolls. */
export function revealCurrentLine(root: HTMLElement | null): void {
  if (!root) return;
  const row = Array.from(root.querySelectorAll<HTMLElement>("[data-slot=code-block-row][aria-current=true]")).find((r) => r.offsetParent);
  const body = row?.closest<HTMLElement>("[data-slot=code-block-body]");
  if (!row || !body || body.scrollHeight <= body.clientHeight) return;
  const b = body.getBoundingClientRect();
  const r = row.getBoundingClientRect();
  const margin = r.height;
  if (r.top < b.top + margin) body.scrollTop -= b.top + margin - r.top;
  else if (r.bottom > b.bottom - margin) body.scrollTop += r.bottom - (b.bottom - margin);
}
