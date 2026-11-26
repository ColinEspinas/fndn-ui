"use client";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { trackModality } from "../lib/modality";
import { switchRecipe } from "./switch.recipe";

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "children"> & {
  /** Controlled value. Omit for uncontrolled (use defaultChecked). */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** md: 40×24 (default). sm: 32×18. */
  size?: "sm" | "md";
  /** Accessible name when there is no visible label. */
  label?: string;
  /** Visible label. The switch is wrapped in a <label>, so the text toggles and names it.
   * `className` and `style` then land on that wrapper (the outermost element: what a caller sizes
   * and places); every other attribute stays on the button. */
  children?: ReactNode;
};

/** On/off toggle; a native button with role=switch. */
export function Switch({ checked, defaultChecked = false, onCheckedChange, size = "md", label, className, style, disabled, onClick, children, ...rest }: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const value = checked ?? inner;
  useEffect(() => trackModality(), []);
  const labelled = !(children === undefined || children === null || children === false);
  const r = switchRecipe({ size });

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      data-slot="switch" className={r.base({ class: labelled ? undefined : className })}
      style={labelled ? undefined : style}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const next = !value;
        if (checked === undefined) setInner(next);
        onCheckedChange?.(next);
      }}
      {...rest}
    >
      <span data-slot="switch-thumb" className={r.thumb()} aria-hidden />
    </button>
  );
  if (!labelled) return control;
  return (
    <label data-slot="switch-label" className={r.label({ class: className })} style={style}>
      {control}
      <span data-slot="switch-label-text" className={r.labelText()}>{children}</span>
    </label>
  );
}
