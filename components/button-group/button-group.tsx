import { forwardRef, type HTMLAttributes } from "react";
import { Button, type ButtonShape, type ButtonSize } from "../button/button";
import { buttonGroup } from "./button-group.recipe";

export type ButtonGroupItem = { value: string; label: string; disabled?: boolean };

export type ButtonGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  orientation?: "horizontal" | "vertical";
  /** The group's accessible name. */
  label?: string;
  /** Buttons as data, rendered before the children. */
  items?: ReadonlyArray<ButtonGroupItem>;
  onItemClick?: (value: string) => void;
  /** The Button variant of the items (children set their own). */
  variant?: "outline" | "primary" | "secondary" | "ghost";
  /** The Button size of the items. */
  size?: ButtonSize;
  /** The Button shape of the items. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
  shape?: ButtonShape;
};

/** Buttons joined into one control. */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { orientation = "horizontal", label, items, onItemClick, variant = "outline", size = "md", shape, className, children, ...rest },
  ref,
) {
  const r = buttonGroup({ orientation });
  return (
    <div ref={ref} role="group" aria-label={label} data-slot="button-group" className={r.base({ class: className })} {...rest}>
      {items?.map((item) => (
        <Button
          key={item.value}
          data-button-group="item"
          className={r.item()}
          variant={variant}
          size={size}
          shape={shape}
          disabled={item.disabled}
          onClick={() => onItemClick?.(item.value)}
        >
          {item.label}
        </Button>
      ))}
      {children}
    </div>
  );
});
