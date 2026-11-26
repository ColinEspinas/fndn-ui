"use client";
import { PasswordInput as ArkPasswordInput, usePasswordInput } from "@ark-ui/react/password-input";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { forwardRef, useEffect, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { Button } from "../button/button";
import { InputGroup } from "../input-group/input-group";
import { passwordInput } from "./password-input.recipe";
import { Tooltip } from "../tooltip/tooltip";
import { trackModality } from "../lib/modality";

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "autoComplete"> & {
  /** Controlled: the password shown as text, with onVisibleChange. Omit for uncontrolled (defaultVisible). */
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  /** The shared control's sizes: xs 24px, sm 28px, md 32px, lg 36px. */
  size?: "xs" | "sm" | "md" | "lg";
  /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
  variant?: "outline" | "subtle" | "ghost";
  invalid?: boolean;
  /** current-password (default) to sign in, new-password to create one. */
  autoComplete?: "current-password" | "new-password";
  /** Ask password managers not to fill or offer this field (a one-time code, an API key). */
  ignorePasswordManagers?: boolean;
  /** Name of the trigger while the password is hidden (its aria-label and tooltip). */
  showLabel?: string;
  /** Name of the trigger while the password is shown. */
  hideLabel?: string;
  /** Addon before the field (a lock icon). */
  start?: ReactNode;
};

/** Password field with a show / hide Button. Behaviour by Ark UI (password-input). */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  {
    visible, defaultVisible, onVisibleChange, size = "md", variant = "outline", invalid, autoComplete = "current-password", ignorePasswordManagers,
    showLabel = "Show password", hideLabel = "Hide password", start, disabled, readOnly, required, name, id,
    className, style, ...rest
  },
  ref,
) {
  useEffect(() => trackModality(), []);
  const api = usePasswordInput({
    ...(id ? { ids: { input: id } } : {}),
    visible,
    defaultVisible,
    onVisibilityChange: (details) => onVisibleChange?.(details.visible),
    /* left out when not given, so a Field around it decides */
    ...(invalid !== undefined ? { invalid } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
    ...(readOnly !== undefined ? { readOnly } : {}),
    ...(required !== undefined ? { required } : {}),
    name,
    autoComplete,
    ignorePasswordManagers,
    translations: { visibilityTrigger: (shown) => (shown ? hideLabel : showLabel) },
  });
  const r = passwordInput();
  const label = api.visible ? hideLabel : showLabel;
  return (
    <ArkPasswordInput.RootProvider value={api} data-slot="password-input" className={r.base({ class: className })} style={style as CSSProperties | undefined}>
      <InputGroup
        ref={ref}
        data-password-input="input"
        size={size}
        variant={variant}
        start={start}
        {...rest}
        {...(api.getInputProps() as Omit<InputHTMLAttributes<HTMLInputElement>, "size">)}
        end={
          <Tooltip content={label}>
            <Button
              data-password-input="visibility-trigger"
              {...(api.getVisibilityTriggerProps() as Record<string, unknown>)}
              variant="ghost"
              size="xs"
              square
              muted
              icon={api.visible ? <EyeSlash data-slot="icon" weight="bold" /> : <Eye data-slot="icon" weight="bold" />}
            />
          </Tooltip>
        }
      />
    </ArkPasswordInput.RootProvider>
  );
});
