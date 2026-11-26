/* What the dialog's three adapters share: which footer action a form's submit belongs to. */

type FormAction = { form?: string };

/** The action a submit event in the window belongs to, or undefined when it is not one of the
 * actions' forms. The browser fires `submit` only for a form that passed its own checks; the
 * button that submitted it (`submitter`) names the action when it is a footer button, and
 * otherwise (Enter in a field, `requestSubmit()`) the first action that names the form does. */
export function submittedAction<A extends FormAction>(actions: ReadonlyArray<A> | undefined, footer: HTMLElement | null | undefined, event: Event): A | undefined {
  const form = event.target;
  if (!actions || !(form instanceof HTMLFormElement) || !form.id) return undefined;
  const submitter = (event as SubmitEvent).submitter;
  const index = submitter && footer ? Array.prototype.indexOf.call(footer.children, submitter) : -1;
  const pressed = index >= 0 ? actions[index] : undefined;
  return pressed?.form === form.id ? pressed : actions.find((action) => action.form === form.id);
}
