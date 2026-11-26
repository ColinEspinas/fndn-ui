<!-- The name of a form control. Inside a Field it is wired to the control by Ark UI's field
     context; on its own, point it at the control with for. -->
<script lang="ts">
  import { Field as ArkField } from "@ark-ui/svelte/field";
  import type { HTMLLabelAttributes } from "svelte/elements";
  import { label } from "./label.recipe";

  type Props = HTMLLabelAttributes & {
    /** React's name for `for`, accepted so the same props work in every target. */
    htmlFor?: string;
  };

  let { class: className, htmlFor, children, ...rest }: Props = $props();
</script>

<ArkField.Label data-slot="label" class={label({ class: className as string | undefined })} {...(htmlFor ? { for: htmlFor } : {})} {...rest}>
  {@render children?.()}
</ArkField.Label>
