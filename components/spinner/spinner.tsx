import type { HTMLAttributes } from "react";
import { spinner } from "./spinner.recipe";

export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: SpinnerSize;
  label?: string;
  /** Purely visual, inside something that is already a status region: aria-hidden, no role or label. */
  decorative?: boolean;
};

/** Hairline ring with a single ink arc. */
export function Spinner({ size = "sm", label = "Loading", decorative, className, ...rest }: SpinnerProps) {
  const a11y = decorative ? { "aria-hidden": true } : { role: "status", "aria-label": label };
  return <span {...a11y} data-slot="spinner" className={spinner({ size, class: className })} {...rest} />;
}
