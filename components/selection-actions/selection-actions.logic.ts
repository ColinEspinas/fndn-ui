/* Selection actions — the parts every target shares, so React, Vue and Svelte behave
 * the same. Positioning is the Zag popover machine's (anchorRect is its getAnchorRect); this file
 * only knows about text and focus.
 *
 *   splitText        the passage cut around the selection (the mark shows the original or the result)
 *   watchSelection   a selection made inside the passage: by pointer (on release) or keyboard (on
 *                    releasing Shift). Reports character offsets into the passage text.
 *   anchorRect       the box the toolbar hangs under: centred on the whole mark, under its last line
 *   restoreSelection put the native selection back over a range (after Escape, Keep, Discard)
 *   rovingToolbar    one tab stop; arrows / Home / End move between the buttons; focus survives the
 *                    buttons being replaced (idle → busy → result); Tab returns to the passage.
 *                    It also keeps two attributes on the content for the recipe: data-overflow while
 *                    the controls are wider than the bar (arms the edge veils), data-swapped once the
 *                    mode has changed while open (the new controls fade; opening alone does not)
 * Plain TypeScript, DOM only, no framework imports. */

export type TextRange = { start: number; end: number };
export type SelectionActionsMode = "idle" | "busy" | "result";
export type SelectionActionIcon = "question" | "sparkle" | "corners-in" | "chat-text" | "text-aa" | "magic-wand" | "pencil-simple" | "list-bullets";
export type SelectionAction = { value: string; label: string; icon?: SelectionActionIcon; busyLabel?: string };

export const modeOf = (busy: boolean, result: string): SelectionActionsMode => (busy ? "busy" : result ? "result" : "idle");

/** A valid range inside `text`, or null. */
export function clampRange(text: string, sel: TextRange | null | undefined): TextRange | null {
  if (!sel) return null;
  const start = Math.max(0, Math.min(sel.start, text.length));
  const end = Math.max(start, Math.min(sel.end, text.length));
  return end > start ? { start, end } : null;
}

/** The passage around the selection: before, the marked part (original or result), after. */
export function splitText(text: string, sel: TextRange | null | undefined, result: string) {
  const range = clampRange(text, sel);
  if (!range) return null;
  return { before: text.slice(0, range.start), inner: result || text.slice(range.start, range.end), after: text.slice(range.end) };
}

/** Keep: the passage with the result in place of the selection, and the range it now covers. */
export function spliceResult(text: string, sel: TextRange, result: string): { text: string; selection: TextRange } {
  return { text: text.slice(0, sel.start) + result + text.slice(sel.end), selection: { start: sel.start, end: sel.start + result.length } };
}

/** Character offsets of `range` in `root`'s text, trimmed of surrounding whitespace. */
export function offsetsOf(root: HTMLElement, range: Range): TextRange | null {
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.startContainer, range.startOffset);
  let start = pre.toString().length;
  let end = start + range.toString().length;
  const all = root.textContent ?? "";
  while (start < end && /\s/.test(all[start]!)) start++;
  while (end > start && /\s/.test(all[end - 1]!)) end--;
  return end > start ? { start, end } : null;
}

function rangeAt(root: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let pos = 0;
  let started = false;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const len = node.data.length;
    if (!len) continue;
    if (!started && start <= pos + len) { range.setStart(node, start - pos); started = true; }
    if (started && end <= pos + len) { range.setEnd(node, end - pos); return range; }
    pos += len;
  }
  return null;
}

export function clearNativeSelection(): void {
  const s = window.getSelection();
  if (s && s.rangeCount) s.removeAllRanges();
}

/** After the view has re-rendered: focus the passage and select `sel` in it again. */
export function restoreSelection(root: HTMLElement | null, sel: TextRange | null): void {
  requestAnimationFrame(() => {
    if (!root?.isConnected) return;
    root.focus({ preventScroll: true });
    const range = sel ? rangeAt(root, sel.start, sel.end) : null;
    const s = window.getSelection();
    if (!s || !range) return;
    s.removeAllRanges();
    s.addRange(range);
  });
}

/** Zag positioning's getAnchorRect: centred on the whole mark, attached under its last line. */
export function anchorRect(root: HTMLElement | null): { x: number; y: number; width: number; height: number } | null {
  const mark = root?.querySelector("[data-slot=selection-actions-mark]");
  if (!mark) return null;
  const lines = Array.from(mark.getClientRects()).filter((r) => r.width > 0);
  const last = lines[lines.length - 1];
  if (!last) return null;
  const box = mark.getBoundingClientRect();
  return { x: box.left, y: last.top, width: box.width, height: last.height };
}

export type SelectVia = "pointer" | "keyboard";

/**
 * Report selections made inside `root`. Pointer: when the button is released (a press inside the
 * passage that ends collapsed reports null). Keyboard: when Shift is released over a selection.
 * `pressedInside()` tells a dismiss caused by pressing in the passage from any other.
 */
export function watchSelection(root: HTMLElement, onSelect: (sel: TextRange | null, via: SelectVia) => void): { stop: () => void; pressedInside: () => boolean } {
  let inside = false;
  const read = () => {
    const s = window.getSelection();
    if (!s || !s.rangeCount || s.isCollapsed) return null;
    return offsetsOf(root, s.getRangeAt(0));
  };
  const down = (e: PointerEvent) => { inside = e.button === 0 && root.contains(e.target as Node); };
  const up = () => {
    if (!inside) return;
    /* the selection settles after pointerup */
    setTimeout(() => { inside = false; onSelect(read(), "pointer"); }, 0);
  };
  const keyup = (e: KeyboardEvent) => {
    if (e.key !== "Shift") return;
    const sel = read();
    if (sel) onSelect(sel, "keyboard");
  };
  document.addEventListener("pointerdown", down, true);
  document.addEventListener("pointerup", up, true);
  document.addEventListener("keyup", keyup, true);
  return {
    pressedInside: () => inside,
    stop: () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("keyup", keyup, true);
    },
  };
}

/**
 * The toolbar pattern on `content`: one tab stop (roving tabindex), ArrowLeft / ArrowRight (mirrored
 * right-to-left) and Home / End move focus. When the buttons are replaced while focus is inside
 * (idle → busy → result), focus moves to the first new button, or the toolbar itself. Tab returns
 * to the passage (onLeave runs first, so the caller can give the selection back).
 */
export function rovingToolbar(content: HTMLElement, passage: () => HTMLElement | null, onLeave?: () => void): () => void {
  /* Runs once, at mount. A toolbar (and its mark) already open then was not opened by anyone: it
   * is the state the page starts in, so it lands without its entrance (nothing plays on first
   * paint). The engines open it a few frames after mount, so anything it starts in that window
   * (before any input) is landed as well. */
  const land = () => {
    for (const a of content.getAnimations({ subtree: true })) if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
    for (const a of passage()?.getAnimations({ subtree: true }) ?? []) if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
  };
  land();
  const mounting = new MutationObserver(() => requestAnimationFrame(land));
  mounting.observe(content, { attributes: true, childList: true, subtree: true });
  const settle = () => { mounting.disconnect(); window.removeEventListener("pointerdown", settle, true); window.removeEventListener("keydown", settle, true); };
  window.addEventListener("pointerdown", settle, true);
  window.addEventListener("keydown", settle, true);
  setTimeout(settle, 1000);
  const buttons = () => Array.from(content.querySelectorAll<HTMLButtonElement>("button")).filter((b) => !b.disabled);
  let current = 0;
  let within = false;
  const sync = () => {
    const list = buttons();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (i >= 0) current = i;
    current = Math.min(current, Math.max(list.length - 1, 0));
    list.forEach((b, n) => { b.tabIndex = n === current ? 0 : -1; });
  };
  const keydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    /* the toolbar sits at the end of <body>: Tab would only come back to it. Return to the passage
     * instead (the popover closes as focus leaves it); the next Tab moves on from there. */
    if (e.key === "Tab") { e.preventDefault(); within = false; onLeave?.(); passage()?.focus({ preventScroll: true }); return; }
    const list = buttons();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0 || !list.length) return;
    const rtl = getComputedStyle(passage() ?? content).direction === "rtl";
    let next: number;
    if (e.key === "ArrowRight") next = rtl ? i - 1 : i + 1;
    else if (e.key === "ArrowLeft") next = rtl ? i + 1 : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else return;
    e.preventDefault();
    current = (next + list.length) % list.length;
    list[current]!.focus();
    sync();
  };
  const focusin = () => { within = true; sync(); };
  const focusout = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (to && content.contains(to)) return;
    /* a button being removed takes focus with it: that is not leaving */
    const from = e.target as Node;
    queueMicrotask(() => { if (from.isConnected) within = false; });
  };
  const observer = new MutationObserver((records) => {
    /* every opening starts on the first button: reset as it closes (and again as it opens), before
     * the popover moves focus in */
    if (records.some((r) => r.type === "attributes")) {
      current = 0;
      buttons().forEach((b, n) => { b.tabIndex = n === 0 ? 0 : -1; });
      if (content.dataset.state !== "open") return;
    }
    sync();
    if (!within || content.hidden || content.dataset.state !== "open" || content.contains(document.activeElement)) return;
    const active = document.activeElement;
    if (active && active !== document.body) { within = false; return; }
    current = 0;
    sync();
    (buttons()[0] ?? content).focus({ preventScroll: true });
  });
  observer.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
  /* data-swapped: the controls were replaced while the bar is open (a mode change). Opening is the
   * popup's one entrance; only a swap fades the new controls. Cleared as the bar closes. */
  /* The bar's width eases between modes (171 → 111 → 194px) instead of snapping: on a swap it is held
   * at the width it had, then set to its new natural width, and the recipe's width transition
   * (duration.base, out-strong, the controls' fade timing) carries it. A swap during the move starts
   * from where the bar is (a transition retargets). From the keyboard (kbd-instant) and on closing
   * there is no move; the inline width goes once the transition ends. */
  let painted = content.offsetWidth;
  const release = (e?: TransitionEvent) => {
    if (e && (e.target !== content || e.propertyName !== "width")) return;
    content.style.width = "";
    measure();
  };
  const resize = () => {
    const from = painted;
    content.style.width = "";
    const to = content.offsetWidth;
    if (!from || !to || Math.abs(to - from) < 1 || document.documentElement.dataset.fndnInput === "keyboard") { measure(); return; }
    /* The engine follows a size change a frame late, so a bar resizing every frame would drift off
     * centre. The positioner holds the widest width of this opening instead (reset on close); the
     * bar is centred inside it (mx-auto), so it stays under the selection while it eases. */
    const positioner = content.parentElement;
    if (positioner) {
      const held = parseFloat(positioner.style.minWidth) || 0;
      positioner.style.minWidth = `${Math.max(from, to, held)}px`;
    }
    content.style.width = `${from}px`;
    void content.offsetWidth;
    content.style.width = `${to}px`;
  };
  const swaps = new MutationObserver((records) => {
    const open = content.dataset.state === "open";
    if (!open) {
      content.removeAttribute("data-swapped");
      release();
      const positioner = content.parentElement;
      if (positioner?.style.minWidth.endsWith("px")) positioner.style.minWidth = "max-content";
      return;
    }
    if (records.some((r) => r.type === "childList" && r.target === content && r.addedNodes.length)) {
      content.setAttribute("data-swapped", "");
      resize();
    }
  });
  swaps.observe(content, { childList: true, attributes: true, attributeFilter: ["data-state"] });
  content.addEventListener("transitionend", release);
  /* data-overflow: the veils are armed only while the controls do not fit (a bar that fits shows
   * none); not judged while the bar is held at a width on its way to its natural one */
  function measure() {
    if (content.style.width) return;
    const over = content.scrollWidth > content.clientWidth + 1;
    if (over !== content.hasAttribute("data-overflow")) content.toggleAttribute("data-overflow", over);
  }
  const sizes = new ResizeObserver(() => { painted = content.offsetWidth; measure(); });
  sizes.observe(content);
  const grow = new MutationObserver(measure);
  grow.observe(content, { childList: true, subtree: true, characterData: true });
  measure();
  content.addEventListener("keydown", keydown);
  content.addEventListener("focusin", focusin);
  content.addEventListener("focusout", focusout);
  sync();
  return () => {
    observer.disconnect();
    swaps.disconnect();
    content.removeEventListener("transitionend", release);
    sizes.disconnect();
    grow.disconnect();
    content.removeEventListener("keydown", keydown);
    content.removeEventListener("focusin", focusin);
    content.removeEventListener("focusout", focusout);
  };
}
