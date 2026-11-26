import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties, type InputHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { Input } from "../input/input";
import { inputGroup } from "./input-group.recipe";
import { truncationTitles } from "../lib/truncate";

export type InputGroupProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** Addon before the field: text (https://), an icon, a Kbd, or a Button (ghost, xs). */
  start?: ReactNode;
  /** Addon after the field: text (.com, USD), an icon, a Kbd, or a Button (ghost, xs). */
  end?: ReactNode;
  /** The shared control's sizes: xs 24px, sm 28px, md 32px, lg 36px. */
  size?: "xs" | "sm" | "md" | "lg";
  /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
  variant?: "outline" | "subtle" | "ghost";
  mono?: boolean;
  invalid?: boolean;
};

/** An Input with addons joined to it. class and style go to the group; every other prop to the
 * Input. */
export const InputGroup = forwardRef<HTMLInputElement, InputGroupProps>(function InputGroup(
  { start, end, size = "md", variant = "outline", mono, invalid, className, style, ...rest },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  /* addon text cut by its ellipsis carries its full text as a title */
  useEffect(() => truncationTitles(root.current, "[data-slot=input-group-start], [data-slot=input-group-end]"), []);
  const r = inputGroup({ size, variant });
  /* a press on an addon's text or icon puts the caret in the field; controls in an addon keep theirs */
  const focusField = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, button, a, select, textarea, [tabindex]")) return;
    event.preventDefault();
    input.current?.focus();
  };
  const has = (node: ReactNode) => node != null && node !== false && node !== "";
  return (
    <div ref={root} data-slot="input-group" className={r.base({ class: className })} style={style as CSSProperties | undefined} onMouseDown={focusField}>
      {has(start) && <span data-slot="input-group-start" className={r.start()}>{start}</span>}
      <Input ref={input} data-input-group="input" size={size} mono={mono} invalid={invalid} className={r.input()} {...rest} />
      {has(end) && <span data-slot="input-group-end" className={r.end()}>{end}</span>}
    </div>
  );
});
