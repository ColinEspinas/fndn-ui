<!-- Turn one option on or off. Behaviour by Ark UI (Zag checkbox). -->
<script lang="ts">
  import { Checkbox as ArkCheckbox } from "@ark-ui/svelte/checkbox";
  import type { Snippet } from "svelte";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Minus from "phosphor-svelte/lib/MinusIcon";
  import { trackModality } from "../lib/modality";
  import { checkbox } from "./checkbox.recipe";

  export type CheckboxChecked = boolean | "indeterminate";

  type Props = {
    /** Two-way bindable: <Checkbox bind:checked /> */
    checked?: CheckboxChecked;
    oncheckedchange?: (checked: CheckboxChecked) => void;
    /** Visible label. Without one, pass aria-label. */
    label?: string;
    "aria-label"?: string;
    /** sm: the 16px box (default). md: an 18px box, for table rows. */
    size?: "sm" | "md";
    /** Colour of the checked fill: ink (default), or red / green for a change to remove / add. */
    tone?: "ink" | "red" | "green";
    /** inline: box and label sized to the text (default). row: fills an option row (the shared option recipe) in a list that owns the glide. */
    layout?: "inline" | "row";
    disabled?: boolean;
    /** tabindex of the input (the focusable part), for a host that runs a roving tab stop. */
    tabIndex?: number;
    invalid?: boolean;
    /** Form field name. */
    name?: string;
    /** Form value when checked. */
    value?: string;
    /** Visible label as markup; takes the place of `label`. */
    children?: Snippet;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    checked = $bindable(false), oncheckedchange, label, "aria-label": ariaLabel, size = "sm", tone = "ink", layout = "inline", disabled = false, invalid = false, tabIndex, name, value,
    children, class: className, style, ...data
  }: Props = $props();

  const r = $derived(checkbox({ size, tone, layout }));

  $effect(() => trackModality());

  /* Svelte sets `checked` as a property only; mirror it into the attribute like the other targets */
  let input = $state<HTMLInputElement | null>(null);
  $effect(() => {
    if (input) input.defaultChecked = checked === true;
  });
</script>

<ArkCheckbox.Root
  {...data} data-slot="checkbox" class={r.base({ class: className })}
  {style}
  {checked}
  onCheckedChange={(details) => { checked = details.checked; oncheckedchange?.(details.checked); }}
  {disabled}
  {invalid}
  {name}
  {value}
>
  <ArkCheckbox.Control data-slot="checkbox-control" class={r.control()}>
    <span data-slot="checkbox-mark" class={r.mark()} data-mark="check"><Check data-slot="icon" weight="bold" /></span>
    <span data-slot="checkbox-mark" class={r.mark()} data-mark="indeterminate"><Minus data-slot="icon" weight="bold" /></span>
  </ArkCheckbox.Control>
  {#if children}
    <ArkCheckbox.Label data-slot="checkbox-label" class={r.label()}>{@render children()}</ArkCheckbox.Label>
  {:else if label}
    <ArkCheckbox.Label data-slot="checkbox-label" class={r.label()}>{label}</ArkCheckbox.Label>
  {/if}
  <ArkCheckbox.HiddenInput bind:ref={input} data-slot="checkbox-input" class={r.input()} aria-label={ariaLabel} tabindex={tabIndex} />
</ArkCheckbox.Root>
