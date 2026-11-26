/* Chat composer — DOM helpers shared by every target.
 *
 *   watchThreads  messages that arrive after mount rise in once (data-enter, removed when the
 *                 animation ends) and the open thread scrolls smoothly to the newest message
 *                 (at once under reduced motion). Messages that are there at mount, and panels
 *                 being shown again, never animate and jump straight to the end.
 *   pressField    pressing the field's padding puts the caret in the textarea.
 * The textarea's keyboard contract (Enter sends, Shift+Enter, IME) is prompt-bar's
 * `isSubmitKey` from prompt-bar/prompt-suggest.ts; its growth is `autosize` from prompt-bar/prompt-bar.logic.ts.
 * Plain TypeScript, DOM only, no framework imports. */

/** The fixed strings. {time} is a step's duration. Pass a partial object; the rest stays English. */
export type ChatComposerLabels = {
  /** Accessible name of the textarea. */
  message: string;
  /** The send button's name and tooltip, and the same button while busy. */
  send: string;
  stop: string;
  /** How long a step took. */
  time: string;
};
export const CHAT_COMPOSER_LABELS: ChatComposerLabels = { message: "Message", send: "Send", stop: "Stop generating", time: "for {time}" };
export const chatComposerLabels = (labels?: Partial<ChatComposerLabels>): ChatComposerLabels => ({ ...CHAT_COMPOSER_LABELS, ...labels });
export const timeText = (time: string, t: ChatComposerLabels = CHAT_COMPOSER_LABELS) => t.time.replace(/\{time\}/g, time);

const MESSAGE = "[data-chat-composer=message]";
const PANEL = "[data-slot=tabs-content]";

const toBottom = (panel: Element | null) => {
  if (panel instanceof HTMLElement && !panel.hidden) panel.scrollTop = panel.scrollHeight;
};
/* a message that arrives: the thread scrolls to it smoothly, so its rise is seen; at once under
 * reduced motion */
const glideToBottom = (panel: Element | null) => {
  if (!(panel instanceof HTMLElement) || panel.hidden) return;
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  panel.scrollTo({ top: panel.scrollHeight, behavior: reduce ? "auto" : "smooth" });
};

export function watchThreads(root: HTMLElement): () => void {
  root.querySelectorAll(PANEL).forEach(toBottom);
  const done = (e: AnimationEvent) => {
    const node = e.target as HTMLElement;
    if (node.matches?.(MESSAGE)) node.removeAttribute("data-enter");
  };
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") {
        /* a panel shown again opens at its newest message, without motion */
        const panel = r.target as HTMLElement;
        if (panel.matches(PANEL) && !panel.hidden) toBottom(panel);
        continue;
      }
      for (const node of Array.from(r.addedNodes)) {
        if (!(node instanceof HTMLElement)) continue;
        const added = node.matches(MESSAGE) ? [node] : Array.from(node.querySelectorAll<HTMLElement>(MESSAGE));
        for (const m of added) {
          m.setAttribute("data-enter", "");
          glideToBottom(m.closest(PANEL));
        }
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  root.addEventListener("animationend", done);
  root.addEventListener("animationcancel", done);
  return () => {
    observer.disconnect();
    root.removeEventListener("animationend", done);
    root.removeEventListener("animationcancel", done);
  };
}

/** Pressing the field outside the textarea and the buttons focuses the textarea (caret at the end). */
export function pressField(field: HTMLElement, input: HTMLTextAreaElement): () => void {
  const down = (e: PointerEvent) => {
    if (e.target !== field && (e.target as Element).getAttribute?.("data-slot") !== "chat-composer-footer") return;
    e.preventDefault();
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  };
  field.addEventListener("pointerdown", down);
  return () => field.removeEventListener("pointerdown", down);
}
