import { Field as ArkField } from "@ark-ui/react/field";
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { textarea } from "./textarea.recipe";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** md: text-sm, 10px padding. sm: text-xs, 8px. Both start at 72px. */
  size?: "xs" | "sm" | "md" | "lg";
  /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
  variant?: "outline" | "subtle" | "ghost";
  mono?: boolean;
  invalid?: boolean;
  /** Grow with the text (default). Cap it with a max-height class; past it the text scrolls. */
  autoResize?: boolean;
};

/** Multiline text field that grows with its text. Behaviour by Ark UI (Field.Textarea). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = "md", variant = "outline", mono, invalid, autoResize = true, className, ...rest },
  ref,
) {
  const own = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => own.current!, []);
  /* the engine sizes the field a frame after mount; a long first value is sized before the first
   * paint instead, so the field never jumps */
  useLayoutEffect(() => {
    const el = own.current;
    if (!autoResize || !el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [autoResize]);
  return (
    <ArkField.Textarea
      ref={own}
      data-slot="textarea"
      autoresize={autoResize}
      className={textarea({ size, variant, mono: !!mono, autoResize, class: className })}
      /* the text keeps its own direction; the alignment stays on the page's side */
      dir="auto"
      {...(invalid ? { "aria-invalid": true as const } : {})}
      {...rest}
    />
  );
});
