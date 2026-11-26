<!-- Text that turns into a field when edited. Behaviour by Ark UI (Zag editable). -->
<script lang="ts">
  import type { HTMLInputAttributes, HTMLTextareaAttributes } from "svelte/elements";
  import { Editable as ArkEditable } from "@ark-ui/svelte/editable";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import type { Snippet } from "svelte";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
  import X from "phosphor-svelte/lib/XIcon";
  import Button from "../button/Button.svelte";
  import Input from "../input/Input.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { trackModality } from "../lib/modality";
  import { truncationTitles } from "../lib/truncate";
  import { editable } from "./editable.recipe";

  export type EditableLabels = { edit: string; submit: string; cancel: string };

  type Props = {
    /** Two-way bindable: the text, <Editable bind:value />. */
    value?: string;
    /** Every change while editing. */
    onvaluechange?: (value: string) => void;
    /** The text saved (Enter, a click away, the save button). */
    onvaluecommit?: (value: string) => void;
    /** Called with the text restored when an edit is cancelled (Escape, the cancel button). */
    onvaluerevert?: (value: string) => void;
    /** Shown while the text is empty, in the preview and in the field. */
    placeholder?: string;
    /** Visible label. Without one, pass aria-label. */
    label?: string;
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
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value = $bindable(""), onvaluechange, onvaluecommit, onvaluerevert, placeholder = "Empty", label, "aria-label": ariaLabel,
    variant = "field", size = "md", activationMode = "focus", controls = false, multiline = false, labels, maxLength, disabled = false, invalid = false, name,
    class: className, style, ...data
  }: Props = $props();

  const text = $derived<EditableLabels>({ edit: "Edit", submit: "Save", cancel: "Cancel", ...labels });
  const ml = $derived(multiline && variant === "field");
  const r = $derived(editable({ variant, size, controls: !!controls, multiline: ml }));
  /* the engine's props for the textarea */
  const engineArea = (p: object) => p as Omit<HTMLTextareaAttributes, "value" | "oninput">;

  /* a preview cut by its ellipsis carries its full text as a title */
  let preview = $state<HTMLElement | null>(null);
  $effect(() => truncationTitles(preview));
  $effect(() => trackModality());

  /* the engine's props for the control, typed as the Input's attributes (its listeners stay the engine's) */
  const engine = (p: object) => p as Omit<HTMLInputAttributes, "size" | "value" | "oninput">;
</script>

<!-- one control: the engine's trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
{#snippet control(Trigger: typeof ArkEditable.EditTrigger, glyph: Snippet, what: string, slot: string)}
  <Trigger>
    {#snippet asChild(triggerProps)}
      <Tooltip content={what} triggerId={(triggerProps().id as string | undefined) ?? undefined}>
        {#snippet trigger(tip)}
          <Button {...mergeProps(tip(), triggerProps())} data-editable={slot} variant="ghost" size="xs" square muted aria-label={what} icon={glyph} />
        {/snippet}
      </Tooltip>
    {/snippet}
  </Trigger>
{/snippet}
{#snippet editIcon()}<PencilSimple data-slot="icon" weight="bold" />{/snippet}
{#snippet submitIcon()}<Check data-slot="icon" weight="bold" />{/snippet}
{#snippet cancelIcon()}<X data-slot="icon" weight="bold" />{/snippet}

<ArkEditable.Root
  {...data} data-slot="editable"
  class={r.base({ class: className })}
  {style}
  {value}
  onValueChange={(details) => { value = details.value; onvaluechange?.(details.value); }}
  onValueCommit={(details) => onvaluecommit?.(details.value)}
  onValueRevert={(details) => onvaluerevert?.(details.value)}
  {placeholder}
  {activationMode}
  {maxLength}
  {disabled}
  {invalid}
  {name}
  translations={{ edit: ariaLabel ?? text.edit, input: ariaLabel, submit: text.submit, cancel: text.cancel }}
>
  {#if label}<ArkEditable.Label data-slot="editable-label" class={r.label()}>{label}</ArkEditable.Label>{/if}
  <ArkEditable.Area data-slot="editable-area" class={r.area()}>
    <ArkEditable.Input>
      {#snippet asChild(inputProps)}
        {#if ml}<Input {...engineArea(inputProps())} data-editable="input" class={r.input()} {size} {invalid} multiline rows={1} {...{ autoresize: true }} />
        {:else}<Input {...engine(inputProps())} data-editable="input" class={r.input()} {size} {invalid} />{/if}
      {/snippet}
    </ArkEditable.Input>
    <ArkEditable.Preview bind:ref={preview} data-slot="editable-preview" class={r.preview()} />
  </ArkEditable.Area>
  {#if controls}
    <ArkEditable.Control data-slot="editable-control" class={r.control()}>
      {@render control(ArkEditable.EditTrigger, editIcon, text.edit, "edit-trigger")}
      {@render control(ArkEditable.SubmitTrigger, submitIcon, text.submit, "submit-trigger")}
      {@render control(ArkEditable.CancelTrigger, cancelIcon, text.cancel, "cancel-trigger")}
    </ArkEditable.Control>
  {/if}
</ArkEditable.Root>
