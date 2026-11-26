import { Field as ArkField } from "@ark-ui/react/field";
import { forwardRef, type LabelHTMLAttributes } from "react";
import { label } from "./label.recipe";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

/** The name of a form control. Inside a Field it is wired to the control by Ark UI's field
 * context; on its own, point it at the control with htmlFor. */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label({ className, ...rest }, ref) {
  return <ArkField.Label ref={ref} data-slot="label" className={label({ class: className })} {...rest} />;
});
