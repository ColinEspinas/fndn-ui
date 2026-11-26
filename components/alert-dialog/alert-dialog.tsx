"use client";
import { useState, type ReactElement, type ReactNode } from "react";
import { Button } from "../button/button";
import { Dialog } from "../dialog/dialog";
import { alertDialog } from "./alert-dialog.recipe";

export type AlertDialogProps = {
  /** Controlled open state. Omit for uncontrolled (use defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The question; names the window. */
  title: ReactNode;
  /** What happens, and whether it can be undone. */
  description?: ReactNode;
  /** Say what it does ("Delete project"). */
  actionLabel?: string;
  cancelLabel?: string;
  /** danger: a danger action (default). neutral: a primary action. */
  tone?: "danger" | "neutral";
  /** The Dialog's widths: sm 360px, md 440px (default). */
  size?: "sm" | "md";
  onAction?: () => void;
  /** Cancel, Escape, or any close that is not the action. */
  onCancel?: () => void;
  /** Your own trigger: one element. */
  trigger?: ReactElement;
  /** Renders the Dialog's default Button trigger with this label. */
  triggerLabel?: string;
  /** Body content under the description. */
  children?: ReactNode;
  className?: string;
  [data: `data-${string}`]: string | undefined;
};

/** A confirm that interrupts: the Dialog with role="alertdialog". */
export function AlertDialog({
  open, defaultOpen = false, onOpenChange, title, description, actionLabel = "Continue", cancelLabel = "Cancel", tone = "danger", size = "md",
  onAction, onCancel, trigger, triggerLabel, children, className, ...data
}: AlertDialogProps) {
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const setOpen = (next: boolean, acted = false) => {
    if (!next && isOpen && !acted) onCancel?.();
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  };
  const r = alertDialog();
  return (
    <div {...data} data-slot="alert-dialog" className={r.base({ class: className })}>
      <Dialog
        open={isOpen}
        onOpenChange={(next) => setOpen(next)}
        role="alertdialog"
        closable={false}
        size={size}
        title={title}
        description={description}
        trigger={trigger}
        triggerLabel={triggerLabel}
        footer={
          <>
            <Button data-alert-dialog="cancel" className={r.cancel()} variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {cancelLabel}
            </Button>
            <Button
              data-alert-dialog="action"
              className={r.action()}
              variant={tone === "danger" ? "danger" : "primary"}
              size="sm"
              onClick={() => { onAction?.(); setOpen(false, true); }}
            >
              {actionLabel}
            </Button>
          </>
        }
      >
        {children}
      </Dialog>
    </div>
  );
}
