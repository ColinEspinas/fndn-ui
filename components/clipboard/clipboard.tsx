"use client";
import { Clipboard as ArkClipboard, useClipboard } from "@ark-ui/react/clipboard";
import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { trackModality } from "../lib/modality";
import { Button } from "../button/button";
import { button } from "../button/button.recipe";
import { clipboard } from "./clipboard.recipe";
import { Input } from "../input/input";
import { Tooltip } from "../tooltip/tooltip";

export type ClipboardLabels = { copy: string; copied: string };

export type ClipboardProps = {
  /** The text placed on the clipboard (and shown in the field). */
  value: string;
  /** button: the code block's Copy button. field: a read-only Input showing the value, with a Copy button inside its end. */
  variant?: "button" | "field";
  /** field only: the Input's sizes (xs 24px, sm 28px, md 32px, lg 36px). */
  size?: "xs" | "sm" | "md" | "lg";
  /** Visible label of the field. Without one, the field is named by aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  /** Button labels and the announcement; copy also names the icon-only button of the field. */
  labels?: Partial<ClipboardLabels>;
  /** How long Copied shows, in ms. */
  timeout?: number;
  /** Called with the text once it is on the clipboard. */
  onCopy?: (text: string) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/* the two labels of Copy are label parts of the button (the code block's) */
const twoLabels = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

/** Copy a value: a two-state Copy button, alone or in a read-only field. Behaviour by Ark UI (Zag clipboard). */
export function Clipboard({
  value, variant = "button", size = "md", label, "aria-label": ariaLabel, labels, timeout = 1500, onCopy, disabled, className, style, ...data
}: ClipboardProps) {
  useEffect(() => trackModality(), []);
  const text: ClipboardLabels = { copy: "Copy", copied: "Copied", ...labels };
  const api = useClipboard({ value, timeout, onStatusChange: (details) => { if (details.copied) onCopy?.(value); } });
  const field = variant === "field";
  const r = clipboard({ variant, size, copied: api.copied });
  const icons = <><Copy data-slot="icon" weight="bold" /><Check data-slot="icon" weight="bold" /></>;
  const trigger = (
    <ArkClipboard.Trigger asChild>
      {field ? (
        <Tooltip content={api.copied ? text.copied : text.copy}>
          <Button
            data-clipboard="trigger" className={r.trigger()} variant="ghost" size="xs" square muted swapped={api.copied}
            aria-label={text.copy} disabled={disabled || !value} icon={icons}
          />
        </Tooltip>
      ) : (
        <Button
          data-clipboard="trigger" className={r.trigger()} variant="ghost" size="xs" shape="rounded" muted swapped={api.copied}
          aria-label={ariaLabel ?? text.copy} disabled={disabled || !value} icon={icons}
        >
          <span data-slot="button-label" className={twoLabels} aria-hidden="true">{text.copy}</span>
          <span data-slot="button-label" className={twoLabels} aria-hidden="true">{text.copied}</span>
        </Button>
      )}
    </ArkClipboard.Trigger>
  );
  return (
    <ArkClipboard.RootProvider value={api} {...data} data-slot="clipboard" className={r.base({ class: className })} style={style}>
      {field && label && <ArkClipboard.Label data-slot="clipboard-label" className={r.label()}>{label}</ArkClipboard.Label>}
      {field ? (
        <ArkClipboard.Control data-slot="clipboard-control" className={r.control()}>
          <ArkClipboard.Input asChild>
            <Input data-clipboard="input" className={r.input()} size={size} aria-label={label ? undefined : ariaLabel} disabled={disabled} />
          </ArkClipboard.Input>
          {trigger}
        </ArkClipboard.Control>
      ) : trigger}
      <span data-slot="clipboard-status" className={r.status()} role="status">{api.copied ? text.copied : ""}</span>
    </ArkClipboard.RootProvider>
  );
}
