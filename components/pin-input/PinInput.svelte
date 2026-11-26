<!-- A code typed one character per cell. Behaviour by Ark UI (Zag pin-input). -->
<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { PinInput as ArkPinInput } from "@ark-ui/svelte/pin-input";
  import Input from "../input/Input.svelte";
  import { pinInput } from "./pin-input.recipe";
  import { trackModality } from "../lib/modality";

  export type PinInputSize = "xs" | "sm" | "md" | "lg";

  type Props = {
    /** Number of cells. */
    length?: number;
    /** Two-way bindable: one character per cell ("" for an empty one), <PinInput bind:value />. */
    value?: string[];
    onvaluechange?: (value: string[]) => void;
    /** Every cell is filled: the code as one string. */
    onvaluecomplete?: (code: string) => void;
    /** What a cell accepts. */
    type?: "numeric" | "alphanumeric" | "alphabetic";
    /** A one-time code: autocomplete="one-time-code", so the keyboard can offer the code it received. */
    otp?: boolean;
    /** Shows dots instead of the characters (a PIN). */
    mask?: boolean;
    /** Square cells at the Input's heights: xs 24px, sm 28px, md 32px (default), lg 36px. */
    size?: PinInputSize;
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    /** Visible label above the cells. */
    label?: string;
    /** Shown in an empty cell that does not have focus. Default: none. */
    placeholder?: string;
    /** Leaves the last cell when the code is complete. */
    blurOnComplete?: boolean;
    autoFocus?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    /** Form field name (one hidden input with the whole code). */
    name?: string;
    /** Name of the group when there is no visible label; each cell is "<name>, 2 of 6". */
    "aria-label"?: string;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    length = 6, value = $bindable([]), onvaluechange, onvaluecomplete, type = "numeric", otp, mask, size = "md", variant = "outline", label, placeholder = "",
    blurOnComplete, autoFocus, invalid, disabled, name, "aria-label": ariaLabel, class: className, ...rest
  }: Props = $props();

  const r = $derived(pinInput({ size }));
  const groupName = $derived(ariaLabel ?? label);
  const cells = $derived(Array.from({ length }, (_, index) => index));

  $effect(() => trackModality());

  /* the engine's props for the control, typed as the Input's attributes (its listeners stay the engine's) */
  const engine = (p: object) => p as Omit<HTMLInputAttributes, "size" | "value" | "oninput">;
</script>

<ArkPinInput.Root
  data-slot="pin-input"
  class={r.base({ class: className })}
  count={length}
  bind:value
  onValueChange={(d: { value: string[] }) => onvaluechange?.(d.value)}
  onValueComplete={(d: { valueAsString: string }) => onvaluecomplete?.(d.valueAsString)}
  {type}
  {otp}
  {mask}
  {placeholder}
  {blurOnComplete}
  {autoFocus}
  {invalid}
  {disabled}
  {name}
  translations={groupName ? { inputLabel: (index: number, count: number) => `${groupName}, ${index + 1} of ${count}` } : undefined}
  {...rest}
>
  {#if label}<ArkPinInput.Label data-slot="pin-input-label" class={r.label()}>{label}</ArkPinInput.Label>{/if}
  <ArkPinInput.Control data-slot="pin-input-control" class={r.control()} role="group" aria-label={groupName}>
    {#each cells as index (index)}
      <ArkPinInput.Input {index}>
        {#snippet asChild(inputProps)}<Input {...engine(inputProps())} data-pin-input="input" {size} {variant} class={r.input()} />{/snippet}
      </ArkPinInput.Input>
    {/each}
  </ArkPinInput.Control>
  <ArkPinInput.HiddenInput data-slot="pin-input-hidden-input" />
</ArkPinInput.Root>
