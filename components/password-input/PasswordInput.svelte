<!-- Password field with a show / hide Button. Behaviour by Ark UI (password-input). -->
<script lang="ts">
  import { PasswordInput as ArkPasswordInput, usePasswordInput } from "@ark-ui/svelte/password-input";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import Eye from "phosphor-svelte/lib/EyeIcon";
  import EyeSlash from "phosphor-svelte/lib/EyeSlashIcon";
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import InputGroup from "../input-group/InputGroup.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { passwordInput } from "./password-input.recipe";
  import { trackModality } from "../lib/modality";

  type Props = Omit<HTMLInputAttributes, "size" | "type" | "autocomplete" | "value" | "oninput"> & {
    /** Two-way bindable: the password shown as text. */
    visible?: boolean;
    onvisiblechange?: (visible: boolean) => void;
    /** Two-way bindable: the Input's value. */
    value?: string;
    oninput?: (value: string) => void;
    /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    /** Absent: a surrounding Field decides. */
    invalid?: boolean;
    /** current-password (default) to sign in, new-password to create one. */
    autoComplete?: "current-password" | "new-password";
    /** Ask password managers not to fill or offer this field (a one-time code, an API key). */
    ignorePasswordManagers?: boolean;
    /** Name of the trigger while the password is hidden (its aria-label and tooltip). */
    showLabel?: string;
    /** Name of the trigger while the password is shown. */
    hideLabel?: string;
    /** Addon before the field (a lock icon). */
    start?: Snippet | string;
    /** Bindable: the input element. */
    ref?: HTMLInputElement | null;
  };

  let {
    visible = $bindable(false), onvisiblechange, value = $bindable(""), size = "md", variant = "outline", invalid, autoComplete = "current-password", ignorePasswordManagers,
    showLabel = "Show password", hideLabel = "Hide password", start, disabled, readonly, required, name, id, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props();

  $effect(() => trackModality());
  /* Ark's Svelte hook spreads these over the Field's values, so a prop not given is left out (a
   * Field around it decides) */
  const api = usePasswordInput(() => ({
    ...(id ? { ids: { input: id } } : {}),
    visible,
    onVisibilityChange: (details) => { visible = details.visible; onvisiblechange?.(details.visible); },
    ...(invalid !== undefined ? { invalid } : {}),
    ...(disabled != null ? { disabled: !!disabled } : {}),
    ...(readonly != null ? { readOnly: !!readonly } : {}),
    ...(required != null ? { required: !!required } : {}),
    ...(name ? { name } : {}),
    autoComplete,
    ignorePasswordManagers,
    translations: { visibilityTrigger: (shown: boolean) => (shown ? hideLabel : showLabel) },
  }));
  /* the engine's input props (type, autocomplete, aria-invalid…), typed loosely: its attribute
   * types are wider than the InputGroup's props */
  const inputProps = $derived(api().getInputProps() as object);
  const r = passwordInput();
  const label = $derived(api().visible ? hideLabel : showLabel);
</script>

{#snippet eye()}{#if api().visible}<EyeSlash data-slot="icon" weight="bold" />{:else}<Eye data-slot="icon" weight="bold" />{/if}{/snippet}
{#snippet end()}
  <Tooltip content={label}>
    {#snippet trigger(props)}
      <Button
        {...mergeProps(props(), api().getVisibilityTriggerProps())}
        data-password-input="visibility-trigger"
        variant="ghost"
        size="xs"
        square
        muted
        icon={eye}
      />
    {/snippet}
  </Tooltip>
{/snippet}
<ArkPasswordInput.RootProvider value={api} data-slot="password-input" class={r.base({ class: className as string | undefined })} {style}>
  <InputGroup bind:ref bind:value data-password-input="input" {size} {variant} {start} {...rest} {...inputProps} {end} />
</ArkPasswordInput.RootProvider>
