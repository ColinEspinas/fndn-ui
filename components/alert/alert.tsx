import { CheckCircle, Info, Warning, WarningCircle } from "@phosphor-icons/react";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "../button/button";
import { alert } from "./alert.recipe";

export type AlertTone = "neutral" | "accent" | "green" | "orange" | "red";
export type AlertActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type AlertAction = {
  label: string;
  /** Passed to onAction. Defaults to the label. */
  value?: string;
  variant?: AlertActionVariant;
};

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title" | "role"> & {
  /** status-pill's status tones: neutral is the card; the others fill with their tint. */
  tone?: AlertTone;
  title?: ReactNode;
  /** The tone's icon (default), your own glyph, or false for none. */
  icon?: boolean | ReactNode;
  /** Default: alert for orange and red, status otherwise. none: never announced. */
  role?: "alert" | "status" | "none";
  /** Buttons under the text, in order. */
  actions?: ReadonlyArray<AlertAction>;
  onAction?: (value: string) => void;
  /** Your own controls in place of `actions`. */
  action?: ReactNode;
};

const ICONS = { neutral: Info, accent: Info, green: CheckCircle, orange: Warning, red: WarningCircle } as const;

/** A message that sits in the page. */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = "neutral", title, icon = true, role, actions, onAction, action, className, children, ...rest },
  ref,
) {
  const r = alert({ tone });
  const Glyph = ICONS[tone];
  const glyph = icon === true ? <Glyph data-slot="icon" weight="bold" /> : icon || null;
  const hasActions = action != null || (actions && actions.length > 0);
  const resolvedRole = role ?? (tone === "orange" || tone === "red" ? "alert" : "status");
  return (
    <div ref={ref} data-slot="alert" role={resolvedRole === "none" ? undefined : resolvedRole} className={r.base({ class: className })} {...rest}>
      {glyph && <span data-slot="alert-icon" className={r.icon()} aria-hidden>{glyph}</span>}
      <div data-slot="alert-content" className={r.content()}>
        {title != null && title !== false && <div data-slot="alert-title" className={r.title()}>{title}</div>}
        {children != null && children !== false && <div data-slot="alert-description" className={r.description()}>{children}</div>}
        {hasActions && (
          <div data-slot="alert-actions" className={r.actions()}>
            {action ??
              actions!.map((a) => (
                <Button key={a.value ?? a.label} size="sm" variant={a.variant ?? "outline"} onClick={() => onAction?.(a.value ?? a.label)}>
                  {a.label}
                </Button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
});
