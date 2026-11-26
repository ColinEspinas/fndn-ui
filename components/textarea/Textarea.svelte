<!-- Multiline text field that grows with its text. Behaviour by Ark UI (Field.Textarea). -->
<script lang="ts">
  import { Field as ArkField } from "@ark-ui/svelte/field";
  import { untrack } from "svelte";
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { textarea } from "./textarea.recipe";

  type Props = Omit<HTMLTextareaAttributes, "value" | "oninput"> & {
    /** md: text-sm, 10px padding. sm: text-xs, 8px. Both start at 72px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    mono?: boolean;
    /** aria-invalid and the red ring. Absent: a surrounding Field decides. */
    invalid?: boolean;
    /** Grow with the text (default). Cap it with a max-height class; past it the text scrolls. */
    autoResize?: boolean;
    /** Two-way bindable */
    value?: string;
    oninput?: (value: string) => void;
    /** Bindable: the textarea element. */
    ref?: HTMLTextAreaElement | null;
  };

  let { size = "md", variant = "outline", mono, invalid, autoResize = true, class: className, value = $bindable(""), oninput, ref = $bindable(null), ...rest }: Props = $props();

  const own = $derived({ class: textarea({ size, variant, mono: !!mono, autoResize, class: className as string | undefined }), dir: "auto" as const, ...(invalid ? { "aria-invalid": true as const } : {}) });
  const onInput = (event: Event) => oninput?.((event.currentTarget as HTMLTextAreaElement).value);

  /* the engine sizes the field a frame after mount; a long first value is sized before the first
   * paint instead, so the field never jumps */
  /* the first value is also the default (a form reset returns to it), as React's defaultValue */
  const initial = untrack(() => value);
  $effect(() => {
    if (!ref) return;
    ref.defaultValue = initial;
    if (!autoResize) return;
    ref.style.height = "auto";
    ref.style.height = `${ref.scrollHeight}px`;
  });
</script>

<ArkField.Textarea bind:ref bind:value autoresize={autoResize} data-slot="textarea" {...own} {...rest} oninput={onInput} />
