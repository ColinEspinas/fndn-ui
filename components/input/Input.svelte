<!-- Text field on the field color with a hairline ring.
     Inside a Field it is wired to the field's label, helper and error
     through Ark UI's field context (Field.Input / Field.Textarea); on its own it is a plain control. -->
<script lang="ts">
  import { Field as ArkField } from "@ark-ui/svelte/field";
  import type { HTMLInputAttributes, HTMLTextareaAttributes } from "svelte/elements";
  import { input } from "./input.recipe";

  export type InputSize = "xs" | "sm" | "md" | "lg";
  export type InputVariant = "outline" | "subtle" | "ghost";
  type Shared = {
    size?: InputSize;
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: InputVariant;
    mono?: boolean;
    /** aria-invalid and the red ring. Absent: a surrounding Field decides. */
    invalid?: boolean;
    /** Two-way bindable */
    value?: string;
    /** The value as the user types. As the as-child control of an engine part (it passes its
     * data-scope: a number input's, an editable's), the listener is the engine's and receives the
     * native event, as React's does. */
    oninput?: (value: string) => void;
    /** Bindable: the control element. */
    ref?: HTMLInputElement | HTMLTextAreaElement | null;
  };
  type Props =
    | (Omit<HTMLInputAttributes, "size" | "value" | "oninput"> & Shared & { multiline?: false })
    | (Omit<HTMLTextareaAttributes, "value" | "oninput"> & Shared & { multiline: true });

  let { size = "md", variant = "outline", mono, invalid, class: className, value = $bindable(""), oninput, multiline, ref = $bindable(null), ...rest }: Props = $props();

  const cls = $derived(input({ size, variant, mono: !!mono, multiline: !!multiline }).base({ class: className as string | undefined }));
  /* only when set: an absent prop leaves the Field's aria-invalid in place (undefined never
   * overrides in Ark's mergeProps); a caller's dir wins over "auto" */
  const own = $derived({ class: cls, dir: "auto" as const, ...(invalid ? { "aria-invalid": true as const } : {}) });
  /* the as-child control of an engine part: it passes its data-scope and its own input listener, which
   * goes to the control as is (it reads the native event) */
  const hosted = $derived((rest as Record<string, unknown>)["data-scope"] !== undefined && oninput !== undefined);
  const onInput = $derived(hosted ? (oninput as unknown as (event: Event) => void) : (event: Event) => oninput?.((event.currentTarget as HTMLInputElement).value));
</script>

{#if multiline}
  <ArkField.Textarea bind:ref={() => ref as HTMLTextAreaElement | null, (el) => (ref = el)} bind:value data-slot="input" {...own} {...(rest as HTMLTextareaAttributes)} oninput={onInput} />
{:else}
  <ArkField.Input bind:ref={() => ref as HTMLInputElement | null, (el) => (ref = el)} bind:value data-slot="input" {...own} {...(rest as HTMLInputAttributes)} oninput={onInput} />
{/if}
