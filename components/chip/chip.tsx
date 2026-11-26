import type { HTMLAttributes } from "react";
import { chip } from "./chip.recipe";

export type ChipTone = "neutral" | "accent" | "green" | "orange" | "red";
export type ChipProps = HTMLAttributes<HTMLElement> & { tone?: ChipTone };

/** Monospace token chip for code values. */
export function Chip({ tone = "neutral", className, ...rest }: ChipProps) {
  return <code data-slot="chip" className={chip({ tone, class: className })} {...rest} />;
}
