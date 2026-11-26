import type { HTMLAttributes } from "react";
import { kbd } from "./kbd.recipe";

export type KbdVariant = "boxed" | "plain";
export type KbdProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** The keys in order, e.g. ["⌘", "K"]. */
  keys: string[];
  variant?: KbdVariant;
};

/** Keyboard hint: one or more keys. */
export function Kbd({ keys = [], variant = "boxed", className, ...rest }: KbdProps) {
  const r = kbd({ variant });
  return (
    <kbd data-slot="kbd" dir="ltr" className={r.base({ class: className })} {...rest}>
      {keys.map((key, i) => <kbd key={i} data-slot="kbd-key" className={r.key()}>{key}</kbd>)}
    </kbd>
  );
}
