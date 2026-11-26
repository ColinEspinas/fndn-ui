"use client";
import { TagsInput as ArkTagsInput, useTagsInputContext } from "@ark-ui/react/tags-input";
import { useEffect, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { trackModality } from "../lib/modality";
import { afterLeaving, keyed, editBlur, editKeyDown, notTwice, toneOf, type TagsInputTone } from "./tags-input.logic";
import { Tag } from "../tag/tag";
import { tagsInput } from "./tags-input.recipe";

export type { TagsInputTone } from "./tags-input.logic";

export type TagsInputProps = {
  /** Controlled tags. Omit for uncontrolled (defaultValue). */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  /** Visible label. Without one, pass aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  /** One row at the shared control's heights: xs 24px, sm 28px, md 32px, lg 36px. Tags are 22px at every size. */
  size?: "xs" | "sm" | "md" | "lg";
  /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
  variant?: "outline" | "subtle" | "ghost";
  /** The tags' tone: one Tag tone for every tag, or "auto" (the same word, the same hue). Default neutral. */
  tone?: TagsInputTone | "auto";
  /** A tone per tag text ({ bug: "red", billing: "purple" }); wins over tone. */
  tones?: Readonly<Record<string, TagsInputTone>>;
  /** The tags' look (Tag's variant): tint (the hue fills the tag) or outline (a neutral tag, the hue only in its dot). Default tint. */
  tagVariant?: "tint" | "outline";
  /** Most tags; past it nothing is added. */
  max?: number;
  /** A double click (or Enter on a highlighted tag) edits a tag. */
  editable?: boolean;
  /** Typing it adds the text as a tag, as Enter does. */
  delimiter?: string;
  /** Pasted text is split on the delimiter into tags. */
  addOnPaste?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Form field name: a hidden input carries the tags, comma-separated. */
  name?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/* one tag: its cell, the Tag and its edit field. The Tag's remove Button takes the engine's
 * delete-trigger props. The engine hides the tag while it is edited; hidden={false} keeps it in the
 * row, holding the edit field's place (the recipe draws it as the edit box). Removed with the
 * pointer (its × is not a tab stop, so a click is always the pointer's), the tag fades while its
 * cell closes (the leaving variant, on the item and the tag) and leaves when that is over, so the
 * tags after it are already in place. Backspace and Delete go straight to the engine: instant. */
function TagItem({ value, index, recipe, tone, look }: { value: string; index: number; recipe: ReturnType<typeof tagsInput>; tone: TagsInputTone; look: "tint" | "outline" }) {
  const api = useTagsInputContext();
  const [leaving, setLeaving] = useState(false);
  const remove = api.getItemDeleteTriggerProps({ index, value });
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (leaving) return;
    const el = event.currentTarget.closest<HTMLElement>("[data-tags-input=item-preview]");
    if (!el || event.detail === 0) { remove.onClick?.(event); return; }
    setLeaving(true);
    /* by its id as it is then: the id says the tag's place in the row, which may have changed */
    afterLeaving(el, () => api.clearValue(el.id));
  };
  /* a press on the × is not a press on the tag: it does not select it (the tag would flash in the
   * accent before it goes) and it leaves the focus where it is */
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => { event.preventDefault(); event.stopPropagation(); };
  return (
    <ArkTagsInput.Item index={index} value={value} data-slot="tags-input-item" className={recipe.item({ leaving })}>
      <ArkTagsInput.ItemPreview asChild>
        <Tag
          hidden={false}
          data-tags-input="item-preview"
          className={recipe.itemPreview({ leaving })}
          size="sm"
          tone={tone}
          variant={look}
          removable
          removeLabel={`Remove ${value}`}
          removeProps={{ ...remove, onClick, onPointerDown }}
        >
          {value}
        </Tag>
      </ArkTagsInput.ItemPreview>
      <ArkTagsInput.ItemInput data-slot="tags-input-item-input" className={recipe.itemInput()} onKeyDown={(event) => editKeyDown(event.nativeEvent)} onBlur={(event) => editBlur(event.nativeEvent, api)} />
    </ArkTagsInput.Item>
  );
}

/** A field that collects values as tags. Behaviour by Ark UI (Zag tags-input). */
export function TagsInput({
  value, defaultValue, onValueChange, placeholder = "Add a tag", label, "aria-label": ariaLabel, size = "md", variant = "outline", tone = "neutral", tones, tagVariant = "tint", max, editable = true,
  delimiter = ",", addOnPaste = true, disabled, invalid, name, className, style, ...data
}: TagsInputProps) {
  useEffect(() => trackModality(), []);
  const r = tagsInput({ size, variant, tagVariant });
  return (
    <ArkTagsInput.Root
      {...data} data-slot="tags-input"
      className={r.base({ class: className })}
      style={style}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(details) => onValueChange?.(details.value)}
      max={max}
      editable={editable}
      delimiter={delimiter}
      addOnPaste={addOnPaste}
      disabled={disabled}
      invalid={invalid}
      name={name}
      blurBehavior="add"
      validate={notTwice}
    >
      {label && <ArkTagsInput.Label data-slot="tags-input-label" className={r.label()}>{label}</ArkTagsInput.Label>}
      <ArkTagsInput.Context>
        {(api) => (
          <ArkTagsInput.Control data-slot="tags-input-control" className={r.control()}>
            {keyed(api.value).map(({ tag, index, key }) => (
              <TagItem key={key} value={tag} index={index} recipe={r} tone={toneOf(tag, tone, tones)} look={tagVariant} />
            ))}
            <ArkTagsInput.Input data-slot="tags-input-input" className={r.input()} placeholder={api.value.length ? undefined : placeholder} aria-label={ariaLabel} dir="auto" />
          </ArkTagsInput.Control>
        )}
      </ArkTagsInput.Context>
      {name && <ArkTagsInput.HiddenInput />}
    </ArkTagsInput.Root>
  );
}
