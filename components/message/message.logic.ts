/* Message — pieces shared by the React, Vue and Svelte adapters.
 * Plain TypeScript, no framework imports. Copy reuses the code block's copier (clipboard, with a
 * fallback, and "Copied" for 1.5s). */
export { createCopier } from "../code-block/code-block.logic";

/** The actions a message can offer, in the order they are shown. */
export type MessageAction = "copy" | "retry" | "edit" | "good" | "bad";
export const MESSAGE_ACTIONS: MessageAction[] = ["copy", "retry", "edit", "good", "bad"];
/** Good / Bad response: at most one is pressed. */
export type MessageFeedback = "good" | "bad" | null;

/** The fixed strings; pass a partial object, the rest stays English. */
export type MessageLabels = {
  /** Name of the actions row (role=group). */
  actions: string;
  copy: string;
  copied: string;
  retry: string;
  edit: string;
  good: string;
  bad: string;
  /** The status of a streaming message with nothing yet (an ellipsis is added). */
  thinking: string;
};
export const MESSAGE_LABELS: MessageLabels = {
  actions: "Message actions",
  copy: "Copy",
  copied: "Copied",
  retry: "Retry",
  edit: "Edit",
  good: "Good response",
  bad: "Bad response",
  thinking: "Thinking",
};
export const messageLabels = (labels?: Partial<MessageLabels>): MessageLabels => ({ ...MESSAGE_LABELS, ...labels });

/** The actions to show, in the fixed order, without repeats. */
export const orderActions = (actions: readonly MessageAction[] = []): MessageAction[] => MESSAGE_ACTIONS.filter((a) => actions.includes(a));
