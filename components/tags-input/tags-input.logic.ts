/* tags-input — the tone of each tag, its key, the end of a leaving tag's motion and what a
 * duplicate does (shared by the React, Vue and Svelte adapters). Plain TypeScript, no framework imports.
 *
 * A tag takes its tone from `tones` (a map from the tag's text to a tone: labels with their own
 * colours, "bug" red, "billing" purple), else from `tone`: one tone for every tag, or "auto", which
 * gives the same word the same tag hue every time (the hash the records table uses for its tags). */

export type TagsInputTone = "neutral" | "accent" | "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "yellow" | "pink";
const HUES: TagsInputTone[] = ["blue", "green", "orange", "red", "purple", "cyan", "yellow", "pink"];

/** The tone of one tag. */
export function toneOf(tag: string, tone: TagsInputTone | "auto" = "neutral", tones?: Readonly<Record<string, TagsInputTone>>): TagsInputTone {
  const own = tones?.[tag] ?? tones?.[tag.trim().toLowerCase()];
  if (own) return own;
  if (tone !== "auto") return tone;
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return HUES[hash % HUES.length]!;
}

/** The tags with a key each that stays the same when another tag is removed (an index would
 * shift, and a tag on its way out would be drawn anew): the tag's text, numbered only if the host
 * passed the same text twice. */
export function keyed(tags: readonly string[]): { tag: string; index: number; key: string }[] {
  const seen = new Map<string, number>();
  return tags.map((tag, index) => {
    const n = seen.get(tag) ?? 0;
    seen.set(tag, n + 1);
    return { tag, index, key: n ? `${tag}\u0000${n}` : tag };
  });
}

/* one tag is removed at a time: the engine finds a tag by its place in the row, so the row is
 * drawn again before the next one goes. Two frames: a callback asked for while a transition ends
 * still runs in that same frame, before a framework that renders in a task of its own has */
let turn: Promise<void> = Promise.resolve();
const drawn = () => new Promise<void>((next) => requestAnimationFrame(() => requestAnimationFrame(() => next())));

/** Calls `done` when a leaving tag's motion is over: the fade of the tag and the closing of its
 * cell (the leaving variant). It waits for their own transitions, so no time is written here; with
 * none running (no transition at all, or the cell's under reduced motion) it does not wait for it.
 * Two tags leaving together are removed one after the other. */
export function afterLeaving(preview: HTMLElement, done: () => void) {
  /* the next frame: the leaving classes are on the elements, and asking for their animations
   * starts the transitions */
  requestAnimationFrame(() => {
    const moving = [preview, preview.parentElement].flatMap((el) => el?.getAnimations() ?? []);
    void Promise.all(moving.map((a) => a.finished.catch(() => undefined))).then(() => {
      turn = turn.then(() => { done(); return drawn(); });
    });
  });
}

/** The engine's `validate`: a text that is already a tag is not added a second time. The tag it
 * names is selected instead, so the user sees it is there, and the engine empties the field. */
export function notTwice({ inputValue, value }: { inputValue: string; value: string[] }): boolean {
  if (!value.includes(inputValue)) return true;
  selectExisting(inputValue);
  return false;
}

/* Selects the tag with that text in the field the text was typed in: where the focus is, and
 * still is a frame later (text left in a field the user is clicking away from is dropped quietly;
 * the engine hears of that press before the focus has moved). The engine has no call that selects
 * a tag, so the tag is given the press that does, once the engine is done with the key. */
function selectExisting(tag: string) {
  const input = document.activeElement;
  if (!(input instanceof HTMLElement) || !input.matches("[data-slot=tags-input-input]")) return;
  requestAnimationFrame(() => {
    if (document.activeElement === input) press(input, tag);
  });
}

/* gives the tag with that text (the first one outside `except`) the press that selects it */
function press(inside: Element, tag: string, except?: Element | null) {
  const tags = inside.closest("[data-slot=tags-input]")?.querySelectorAll<HTMLElement>("[data-tags-input=item-preview]") ?? [];
  [...tags].find((el) => el.dataset.value === tag && !except?.contains(el))?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
}

/** The keydown of a tag's edit field (the native event). On Enter, an edit that would give the tag
 * the text of another tag is not taken: the engine keeps the tag as it was and selects it, and
 * this selects the tag that already has that text instead, the sign a text typed twice gives. An
 * edit that leaves the tag's own text, or empties it (which removes the tag), is not a duplicate.
 * The engine runs no `validate` on an edit and has no call that selects a tag, so the tag is given
 * the press that does, in the frame after the engine's own: the engine puts the focus back in the
 * field and selects the edited tag in a frame it asks for while it ends the edit, and some
 * frameworks run the engine a little after the key, so this frame is asked for once the edit has
 * ended (the edit field is hidden again). */
export function editKeyDown(event: KeyboardEvent) {
  const edit = event.target;
  if (event.key !== "Enter" || event.isComposing || !(edit instanceof HTMLInputElement)) return;
  const item = edit.closest("[data-slot=tags-input-item]");
  const text = edit.value;
  if (!item || !text || text === item.getAttribute("data-value")) return;
  const root = item.closest("[data-slot=tags-input]");
  const taken = [...(root?.querySelectorAll<HTMLElement>("[data-tags-input=item-preview]") ?? [])].some((el) => el.dataset.value === text && !item.contains(el));
  if (!root || !taken) return;
  const ended = new MutationObserver(() => {
    if (!edit.hidden) return;
    ended.disconnect();
    requestAnimationFrame(() => {
      if (root.contains(document.activeElement)) press(root, text, item);
    });
  });
  ended.observe(edit, { attributes: true, attributeFilter: ["hidden"] });
}

/** What `editBlur` needs of the engine's api. */
export type TagsInputEditApi = { setValueAtIndex(index: number, value: string): void; clearValue(id?: string): void };

/** The blur of a tag's edit field (the native event): focus leaving it (a click elsewhere, Tab,
 * Shift+Tab) commits the edit as Enter does, where the engine would drop it. Text left unchanged
 * changes nothing; text that is empty once trimmed removes the tag, as Enter does; text that is
 * another tag's is not taken (the engine refuses it) and the tag keeps its former text, with no
 * tag selected, since the user is leaving the field. The engine's own blur handling still ends the
 * edit; this only sets the value through the api, which moves no focus, so the focus stays where
 * the user put it. The text is read from the field itself, which still holds it at blur.
 * Enter and Escape end the edit first and then move the focus to the field's input, so the field
 * is already hidden when that blur comes: a hidden field's blur is not a commit (after Escape the
 * text must not be taken, after Enter it already was). */
export function editBlur(event: FocusEvent, api: TagsInputEditApi) {
  const edit = event.target;
  if (!(edit instanceof HTMLInputElement) || edit.hidden) return;
  const item = edit.closest("[data-slot=tags-input-item]");
  const root = item?.closest("[data-slot=tags-input]");
  const preview = item?.querySelector<HTMLElement>("[data-tags-input=item-preview]");
  if (!item || !root || !preview) return;
  const text = edit.value;
  if (text === item.getAttribute("data-value")) return;
  /* once the engine has ended the edit (the field is hidden again): changing the value while the
   * engine is still in its edit would re-draw the tag under it before it has heard of the blur */
  const ended = new MutationObserver(() => {
    if (!edit.hidden) return;
    ended.disconnect();
    if (!text.trim()) api.clearValue(preview.id);
    else api.setValueAtIndex([...root.querySelectorAll("[data-slot=tags-input-item]")].indexOf(item), text);
  });
  ended.observe(edit, { attributes: true, attributeFilter: ["hidden"] });
}
