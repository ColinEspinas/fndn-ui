/* Input modality — <html data-fndn-input="keyboard" | "pointer" data-fndn-focus-input="keyboard" | "pointer">.
 *
 * Keyboard-initiated changes are instant (see `docs motion`): base.css zeroes the
 * transitions of every kbd-instant element while the last input came from the keyboard.
 * data-fndn-focus-input is the last input that can move focus: a key or a press, never a pointer
 * that only moves. base.css hides the ring on a popup trigger that the engine refocused after a
 * pointer closed its popup, while this says "pointer"; a key press shows it again at once, and a
 * mouse nudged while tabbing does not hide it.
 * Call trackModality() once; it is idempotent and safe during server rendering. */
let installed = false;

export function trackModality(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;
  const root = document.documentElement;
  const set = (value: "keyboard" | "pointer") => {
    if (root.dataset.fndnInput !== value) root.dataset.fndnInput = value;
  };
  const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);
  const focusBy = (value: "keyboard" | "pointer") => {
    if (root.dataset.fndnFocusInput !== value) root.dataset.fndnFocusInput = value;
  };
  document.addEventListener("keydown", (e) => { if (!MODIFIERS.has(e.key)) { set("keyboard"); focusBy("keyboard"); } }, { capture: true });
  document.addEventListener("pointerdown", () => { set("pointer"); focusBy("pointer"); }, { capture: true, passive: true });
  document.addEventListener("pointermove", () => set("pointer"), { capture: true, passive: true });
}
