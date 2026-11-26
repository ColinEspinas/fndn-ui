<script setup lang="ts">
/** Copy a value: a two-state Copy button, alone or in a read-only field. Behaviour by Ark UI (Zag clipboard). */
import { Clipboard as ArkClipboard, useClipboard } from "@ark-ui/vue/clipboard";
import { PhCheck, PhCopy } from "@phosphor-icons/vue";
import { computed, onMounted, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Input from "../input/Input.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { trackModality } from "../lib/modality";
import { button } from "../button/button.recipe";
import { clipboard } from "./clipboard.recipe";

export type ClipboardLabels = { copy: string; copied: string };

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The text placed on the clipboard (and shown in the field). */
    value: string;
    /** button: the code block's Copy button. field: a read-only Input showing the value, with a Copy button inside its end. */
    variant?: "button" | "field";
    /** field only: the Input's sizes (xs 24px, sm 28px, md 32px, lg 36px). */
    size?: "xs" | "sm" | "md" | "lg";
    /** Visible label of the field. Without one, the field is named by ariaLabel. */
    label?: string;
    ariaLabel?: string;
    /** Button labels and the announcement; copy also names the icon-only button of the field. */
    labels?: Partial<ClipboardLabels>;
    /** How long Copied shows, in ms. */
    timeout?: number;
    disabled?: boolean;
  }>(),
  { variant: "button", size: "md", timeout: 1500, disabled: false },
);
/** copy: the text, once it is on the clipboard */
const emit = defineEmits<{ copy: [text: string] }>();
defineSlots<{ label?: () => unknown }>();

/* the two labels of Copy are label parts of the button (the code block's) */
const twoLabels = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

const text = computed<ClipboardLabels>(() => ({ copy: "Copy", copied: "Copied", ...props.labels }));
const api = useClipboard(computed(() => ({
  value: props.value,
  timeout: props.timeout,
  onStatusChange: (details: { copied: boolean }) => { if (details.copied) emit("copy", props.value); },
})));
const field = computed(() => props.variant === "field");
const r = computed(() => clipboard({ variant: props.variant, size: props.size, copied: api.value.copied }));
onMounted(() => trackModality());
</script>

<template>
  <ArkClipboard.RootProvider :value="api" v-bind="attrs" data-slot="clipboard" :class="r.base({ class: attrs.class as string | undefined })">
    <ArkClipboard.Label v-if="field && (label || $slots.label)" data-slot="clipboard-label" :class="r.label()"><slot name="label">{{ label }}</slot></ArkClipboard.Label>
    <ArkClipboard.Control v-if="field" data-slot="clipboard-control" :class="r.control()">
      <ArkClipboard.Input as-child>
        <Input data-clipboard="input" :class="r.input()" :size="size" :aria-label="label || $slots.label ? undefined : ariaLabel" :disabled="disabled" />
      </ArkClipboard.Input>
      <ArkClipboard.Trigger as-child>
        <Tooltip :content="api.copied ? text.copied : text.copy">
          <Button
            data-clipboard="trigger" :class="r.trigger()" variant="ghost" size="xs" square muted :swapped="api.copied"
            :aria-label="text.copy" :disabled="disabled || !value"
          >
            <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </ArkClipboard.Trigger>
    </ArkClipboard.Control>
    <ArkClipboard.Trigger v-else as-child>
      <Button
        data-clipboard="trigger" :class="r.trigger()" variant="ghost" size="xs" shape="rounded" muted :swapped="api.copied"
        :aria-label="ariaLabel ?? text.copy" :disabled="disabled || !value"
      >
        <template #icon><PhCopy data-slot="icon" weight="bold" /><PhCheck data-slot="icon" weight="bold" /></template>
        <span data-slot="button-label" :class="twoLabels" aria-hidden="true">{{ text.copy }}</span><span data-slot="button-label" :class="twoLabels" aria-hidden="true">{{ text.copied }}</span>
      </Button>
    </ArkClipboard.Trigger>
    <span data-slot="clipboard-status" :class="r.status()" role="status">{{ api.copied ? text.copied : "" }}</span>
  </ArkClipboard.RootProvider>
</template>
