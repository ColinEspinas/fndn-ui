import type { HTMLAttributes } from "react";
import { count } from "./count.recipe";

export type CountVariant = "plain" | "boxed";
export type CountProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: CountVariant;
  /** md (default): plain in the surrounding size, boxed 20px. sm: plain 12px, boxed 18px. */
  size?: "sm" | "md";
  /** Selected look; automatic inside a selected chip, tab or segment. */
  selected?: boolean;
};

/** Number badge with tabular numbers. */
export function Count({ variant = "plain", size = "md", selected, className, ...rest }: CountProps) {
  return <span data-slot="count" className={count({ variant, size, selected: !!selected, class: className })} {...rest} />;
}
