<!-- A number field with minus and plus buttons. Behaviour by Ark UI (Zag number-input). -->
<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { NumberInput as ArkNumberInput } from "@ark-ui/svelte/number-input";
  import Minus from "phosphor-svelte/lib/MinusIcon";
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import Button from "../button/Button.svelte";
  import Input from "../input/Input.svelte";
  import { trackModality } from "../lib/modality";
  import { numberInput } from "./number-input.recipe";

  export type NumberInputSize = "xs" | "sm" | "md" | "lg";

  type Props = {
    /** Two-way bindable: the text of the field ("12", "" when empty), <NumberInput bind:value />. */
    value?: string;
    onvaluechange?: (value: string, valueAsNumber: number) => void;
    /** After Enter, a blur or a step: the value the field settled on. */
    onvaluecommit?: (value: string, valueAsNumber: number) => void;
    min?: number;
    max?: number;
    /** Arrow keys and the buttons move one step; Shift + arrow ten. */
    step?: number;
    /** The Input's heights: xs 24px, sm 28px, md 32px (default), lg 36px. */
    size?: NumberInputSize;
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    /** Visible label above the field. */
    label?: string;
    placeholder?: string;
    /** Intl number format of the shown value (currency, percent, grouping). */
    formatOptions?: Intl.NumberFormatOptions;
    /** The wheel steps the value while the field has focus. */
    allowMouseWheel?: boolean;
    /** Names of the buttons. Default: "Decrease", "Increase". */
    decrementLabel?: string;
    incrementLabel?: string;
    invalid?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    /** Form field name. */
    name?: string;
    "aria-label"?: string;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value = $bindable(""), onvaluechange, onvaluecommit, min, max, step = 1, size = "md", variant = "outline", label, placeholder, formatOptions, allowMouseWheel,
    decrementLabel = "Decrease", incrementLabel = "Increase", invalid, disabled, readOnly, required, name, "aria-label": ariaLabel,
    class: className, ...rest
  }: Props = $props();

  const r = $derived(numberInput({ size }));
  const button = $derived(size === "xs" ? 11 : size === "sm" ? 12 : 14);

  $effect(() => trackModality());

  /* the engine's props for the control, typed as the Input's attributes (its listeners stay the engine's) */
  const engine = (p: object) => p as Omit<HTMLInputAttributes, "size" | "value" | "oninput">;
</script>

<ArkNumberInput.Root
  data-slot="number-input"
  class={r.base({ class: className })}
  bind:value
  onValueChange={(d: { value: string; valueAsNumber: number }) => onvaluechange?.(d.value, d.valueAsNumber)}
  onValueCommit={(d: { value: string; valueAsNumber: number }) => onvaluecommit?.(d.value, d.valueAsNumber)}
  {min}
  {max}
  {step}
  {formatOptions}
  {allowMouseWheel}
  translations={{ decrementLabel, incrementLabel }}
  {invalid}
  {disabled}
  {readOnly}
  {required}
  {name}
  {...rest}
>
  {#if label}<ArkNumberInput.Label data-slot="number-input-label" class={r.label()}>{label}</ArkNumberInput.Label>{/if}
  <ArkNumberInput.Control data-slot="number-input-control" class={r.control()}>
    <ArkNumberInput.Input>
      {#snippet asChild(inputProps)}
        <Input {...engine(inputProps())} data-number-input="input" {size} {variant} class={r.input()} {placeholder} aria-label={ariaLabel} />
      {/snippet}
    </ArkNumberInput.Input>
    <ArkNumberInput.DecrementTrigger>
      {#snippet asChild(triggerProps)}
        <Button {...triggerProps()} data-number-input="decrement-trigger" class={r.decrementTrigger()} variant="ghost" size="xs" shape="rounded" square muted iconSize={button}>
          {#snippet icon()}<Minus data-slot="icon" weight="bold" />{/snippet}
        </Button>
      {/snippet}
    </ArkNumberInput.DecrementTrigger>
    <ArkNumberInput.IncrementTrigger>
      {#snippet asChild(triggerProps)}
        <Button {...triggerProps()} data-number-input="increment-trigger" class={r.incrementTrigger()} variant="ghost" size="xs" shape="rounded" square muted iconSize={button}>
          {#snippet icon()}<Plus data-slot="icon" weight="bold" />{/snippet}
        </Button>
      {/snippet}
    </ArkNumberInput.IncrementTrigger>
  </ArkNumberInput.Control>
</ArkNumberInput.Root>
