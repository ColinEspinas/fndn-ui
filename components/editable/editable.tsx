"use client";
import { Editable as ArkEditable } from "@ark-ui/react/editable";
import { Check, PencilSimple, X } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";
import { Button } from "../button/button";
import { editable } from "./editable.recipe";
import { Input } from "../input/input";
import { Tooltip } from "../tooltip/tooltip";

export type EditableLabels = { edit: string; submit: string; cancel: string };

export type EditableProps = {
  /** Controlled text. Omit for uncontrolled (defaultValue). */
  value?: string;
  defaultValue?: string;
  /** Every change while editing. */
  onValueChange?: (value: string) => void;
  /** The text saved (Enter, a click away, the save button). */
  onValueCommit?: (value: string) => void;
  /** Called with the text restored when an edit is cancelled (Escape, the cancel button). */
  onValueRevert?: (value: string) => void;
  /** Shown while the text is empty, in the preview and in the field. */
  placeholder?: string;
  /** Visible label. Without one, pass aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  /** field: the Input's box and sizes. inline: takes the text around it (a value in a TextRow). */
  variant?: "field" | "inline";
  /** field only: the Input's sizes (xs 24px, sm 28px, md 32px, lg 36px). */
  size?: "xs" | "sm" | "md" | "lg";
  /** What starts an edit: focus (Tab or a click), click, or double click. */
  activationMode?: "focus" | "click" | "dblclick";
  /** Edit, save and cancel buttons beside the text. */
  controls?: boolean;
  /** Several lines (a description): a textarea that grows with its text; Enter is a new line,
   * Cmd/Ctrl+Enter or a click away saves. field variant only. */
  multiline?: boolean;
  labels?: Partial<EditableLabels>;
  maxLength?: number;
  disabled?: boolean;
  invalid?: boolean;
  /** Form field name; the input carries it. */
  name?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Text that turns into a field when edited. Behaviour by Ark UI (Zag editable). */
export function Editable({
  value, defaultValue, onValueChange, onValueCommit, onValueRevert, placeholder = "Empty", label, "aria-label": ariaLabel,
  variant = "field", size = "md", activationMode = "focus", controls, multiline = false, labels, maxLength, disabled, invalid, name, className, style, ...data
}: EditableProps) {
  const text: EditableLabels = { edit: "Edit", submit: "Save", cancel: "Cancel", ...labels };
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => trackModality(), []);
  /* a preview cut by its ellipsis carries its full text as a title */
  useEffect(() => truncationTitles(preview.current), []);
  const ml = multiline && variant === "field";
  /* React writes a textarea's first value as a text node inside it as well (Vue and Svelte set the
   * value only): drop the node, keep the value, so the three render the same DOM */
  useLayoutEffect(() => {
    const area = preview.current?.parentElement?.querySelector<HTMLTextAreaElement>("textarea[data-editable=input]");
    if (!ml || !area || !area.firstChild) return;
    const value = area.value;
    area.textContent = "";
    area.value = value;
  }, [ml]);
  const r = editable({ variant, size, controls: !!controls, multiline: ml });
  const icon = (glyph: ReactNode, what: string, slot: string, Trigger: typeof ArkEditable.EditTrigger) => (
    <Trigger asChild>
      <Tooltip content={what}>
        <Button data-editable={slot} variant="ghost" size="xs" square muted aria-label={what} icon={glyph} />
      </Tooltip>
    </Trigger>
  );
  return (
    <ArkEditable.Root
      {...data} data-slot="editable"
      className={r.base({ class: className })}
      style={style}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(details) => onValueChange?.(details.value)}
      onValueCommit={(details) => onValueCommit?.(details.value)}
      onValueRevert={(details) => onValueRevert?.(details.value)}
      placeholder={placeholder}
      activationMode={activationMode}
      maxLength={maxLength}
      disabled={disabled}
      invalid={invalid}
      name={name}
      translations={{ edit: ariaLabel ?? text.edit, input: ariaLabel, submit: text.submit, cancel: text.cancel }}
    >
      {label && <ArkEditable.Label data-slot="editable-label" className={r.label()}>{label}</ArkEditable.Label>}
      <ArkEditable.Area data-slot="editable-area" className={r.area()}>
        <ArkEditable.Input asChild>
          {ml
            ? <Input data-editable="input" className={r.input()} size={size} invalid={invalid} multiline rows={1} {...{ autoresize: true }} />
            : <Input data-editable="input" className={r.input()} size={size} invalid={invalid} />}
        </ArkEditable.Input>
        <ArkEditable.Preview ref={preview} data-slot="editable-preview" className={r.preview()} />
      </ArkEditable.Area>
      {controls && (
        <ArkEditable.Control data-slot="editable-control" className={r.control()}>
          {icon(<PencilSimple data-slot="icon" weight="bold" />, text.edit, "edit-trigger", ArkEditable.EditTrigger)}
          {icon(<Check data-slot="icon" weight="bold" />, text.submit, "submit-trigger", ArkEditable.SubmitTrigger)}
          {icon(<X data-slot="icon" weight="bold" />, text.cancel, "cancel-trigger", ArkEditable.CancelTrigger)}
        </ArkEditable.Control>
      )}
    </ArkEditable.Root>
  );
}
