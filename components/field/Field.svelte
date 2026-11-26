<!-- Label, control, helper and error, wired together. Behaviour by Ark UI (field). -->
<script lang="ts">
  import { Field as ArkField } from "@ark-ui/svelte/field";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { afterPaint } from "../lib/paint";
  import { trackModality } from "../lib/modality";
  import { field } from "./field.recipe";
  import Input from "../input/Input.svelte";
  import Label from "../label/Label.svelte";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
    /** The control's name, shown above it (a Label wired to the control). */
    label?: Snippet | string;
    /** Help under the control, linked by aria-describedby. Replaced by the error while invalid. */
    helper?: Snippet | string;
    /** What to fix, shown in red under the control while invalid (aria-live polite). */
    error?: Snippet | string;
    /** Marks the control aria-invalid (red ring) and shows the error. */
    invalid?: boolean;
    /** The control is required; the label shows an asterisk (hidden from assistive technology). */
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** id of the control; generated when omitted. */
    id?: string;
    /** The control: Input, Textarea, InputGroup, PasswordInput (they read the field). An Input when omitted. */
    children?: Snippet;
  };

  let { label, helper, error, invalid, required, disabled, readOnly, id, class: className, children, ...rest }: Props = $props();

  const r = field();
  /* an error that arrives later fades in; nothing on the first paint (data-enter after it, lib/paint.ts) */
  let enter = $state(false);
  $effect(() => (enter ? undefined : afterPaint(() => { enter = true; })));
  $effect(() => trackModality());
  const showError = $derived(!!invalid && !!error);
</script>

{#snippet text(node: Snippet | string)}{#if typeof node === "string"}{node}{:else}{@render node()}{/if}{/snippet}
<ArkField.Root
  {id}
  invalid={!!invalid}
  required={!!required}
  disabled={!!disabled}
  readOnly={!!readOnly}
  data-slot="field"
  data-enter={enter ? "" : undefined}
  class={r.base({ class: className as string | undefined })}
  {...rest}
>
  {#if label}
    <Label data-field="label" class={r.label()}>
      {@render text(label)}<ArkField.RequiredIndicator data-slot="field-required-indicator" class={r.requiredIndicator()} />
    </Label>
  {/if}
  {#if children}{@render children()}{:else}<Input />{/if}
  {#if helper && !showError}<ArkField.HelperText data-slot="field-helper" class={r.helper()}>{@render text(helper)}</ArkField.HelperText>{/if}
  {#if showError && error}<ArkField.ErrorText data-slot="field-error" class={r.error()}>{@render text(error)}</ArkField.ErrorText>{/if}
</ArkField.Root>
