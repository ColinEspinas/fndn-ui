<script setup lang="ts">
/** Password field with a show / hide Button. Behaviour by Ark UI (password-input). */
import { PasswordInput as ArkPasswordInput, usePasswordInput } from "@ark-ui/vue/password-input";
import { PhEye, PhEyeSlash } from "@phosphor-icons/vue";
import { computed, onMounted, useAttrs, useSlots } from "vue";
import Button from "../button/Button.vue";
import InputGroup from "../input-group/InputGroup.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { passwordInput } from "./password-input.recipe";
import { trackModality } from "../lib/modality";

/* class and style land on the root; every other attribute on the Input */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    /** Absent: a surrounding Field decides. */
    invalid?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    /** id of the input. */
    id?: string;
    /** current-password (default) to sign in, new-password to create one. */
    autoComplete?: "current-password" | "new-password";
    /** Ask password managers not to fill or offer this field (a one-time code, an API key). */
    ignorePasswordManagers?: boolean;
    /** Name of the trigger while the password is hidden (its aria-label and tooltip). */
    showLabel?: string;
    /** Name of the trigger while the password is shown. */
    hideLabel?: string;
    /** Addon before the field (a lock icon), or the `start` slot. */
    start?: string;
  }>(),
  {
    size: "md", variant: "outline", invalid: undefined, disabled: undefined, readOnly: undefined, required: undefined, name: undefined, id: undefined,
    autoComplete: "current-password", ignorePasswordManagers: false, showLabel: "Show password", hideLabel: "Hide password", start: undefined,
  },
);
defineSlots<{ start?: () => unknown }>();
const slots = useSlots();

/** v-model:visible — the password shown as text; falls back to local state when unbound. */
const visible = defineModel<boolean>("visible", { default: false });
/** v-model — the Input's value; falls back to local state when unbound. */
const value = defineModel<string>("value", { default: "" });
const emit = defineEmits<{ visibleChange: [visible: boolean] }>();

const api = usePasswordInput(() => ({
  ...(props.id ? { ids: { input: props.id } } : {}),
  visible: visible.value,
  onVisibilityChange: (details: { visible: boolean }) => {
    visible.value = details.visible;
    emit("visibleChange", details.visible);
  },
  /* left out when not given, so a Field around it decides */
  ...(props.invalid !== undefined ? { invalid: props.invalid } : {}),
  ...(props.disabled !== undefined ? { disabled: props.disabled } : {}),
  ...(props.readOnly !== undefined ? { readOnly: props.readOnly } : {}),
  ...(props.required !== undefined ? { required: props.required } : {}),
  name: props.name,
  autoComplete: props.autoComplete,
  ignorePasswordManagers: props.ignorePasswordManagers,
  translations: { visibilityTrigger: (shown: boolean) => (shown ? props.hideLabel : props.showLabel) },
}));
const r = passwordInput();
const label = computed(() => (api.value.visible ? props.hideLabel : props.showLabel));
/* the engine's props for the input and the trigger, typed loosely: Vue's attribute types (Numberish,
 * Booleanish) are wider than the Input's and the Button's props */
const inputProps = computed(() => api.value.getInputProps() as Record<string, unknown>);
const triggerProps = computed(() => api.value.getVisibilityTriggerProps() as Record<string, unknown>);
const inner = computed(() => { const { class: _class, style: _style, ...rest } = attrs; return rest; });
onMounted(() => trackModality());
</script>

<template>
  <ArkPasswordInput.RootProvider :value="api" data-slot="password-input" :class="r.base({ class: attrs.class as string | undefined })" :style="attrs.style as any">
    <InputGroup data-password-input="input" :size="size" :variant="variant" :start="start" v-model:value="value" v-bind="{ ...inner, ...inputProps }">
      <template v-if="slots.start" #start><slot name="start" /></template>
      <template #end>
        <Tooltip :content="label">
          <Button data-password-input="visibility-trigger" v-bind="triggerProps" variant="ghost" size="xs" square muted>
            <template #icon><PhEyeSlash v-if="api.visible" data-slot="icon" weight="bold" /><PhEye v-else data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </template>
    </InputGroup>
  </ArkPasswordInput.RootProvider>
</template>
