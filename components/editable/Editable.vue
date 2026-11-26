<script setup lang="ts">
/** Text that turns into a field when edited. Behaviour by Ark UI (Zag editable). */
import { Editable as ArkEditable } from "@ark-ui/vue/editable";
import { PhCheck, PhPencilSimple, PhX } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Input from "../input/Input.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";
import { editable } from "./editable.recipe";

export type EditableLabels = { edit: string; submit: string; cancel: string };

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Shown while the text is empty, in the preview and in the field. */
    placeholder?: string;
    /** Visible label. Without one, pass ariaLabel. */
    label?: string;
    ariaLabel?: string;
    /** field: the Input's box and sizes. inline: takes the text around it (a value in a TextRow). */
    variant?: "field" | "inline";
    /** field only: the Input's sizes (xs 24px, sm 28px, md 32px, lg 36px). */
    size?: "xs" | "sm" | "md" | "lg";
    /** What starts an edit: focus (Tab or a click), click, or double click. */
    activationMode?: "focus" | "click" | "dblclick";
    /** Edit, save and cancel buttons beside the text. */
    controls?: boolean;
    /** Several lines (a description): a textarea that grows with its text; Enter is a new line,
     * Cmd/Ctrl+Enter or a click away saves. field variant only. */
    multiline?: boolean;
    labels?: Partial<EditableLabels>;
    maxLength?: number;
    disabled?: boolean;
    invalid?: boolean;
    /** Form field name; the input carries it. */
    name?: string;
  }>(),
  { placeholder: "Empty", variant: "field", size: "md", activationMode: "focus", controls: false, multiline: false, maxLength: undefined, disabled: false, invalid: false },
);

/** v-model:value — the text; falls back to local state when unbound. */
const value = defineModel<string>("value", { default: "" });
const emit = defineEmits<{
  /** Every change while editing. */
  valueChange: [value: string];
  /** The text saved (Enter, a click away, the save button). */
  valueCommit: [value: string];
  /** The text restored when an edit is cancelled (Escape, the cancel button). */
  valueRevert: [value: string];
}>();
defineSlots<{ label?: () => unknown }>();

const text = computed<EditableLabels>(() => ({ edit: "Edit", submit: "Save", cancel: "Cancel", ...props.labels }));
const translations = computed(() => ({ edit: props.ariaLabel ?? text.value.edit, input: props.ariaLabel, submit: text.value.submit, cancel: text.value.cancel }));
const ml = computed(() => props.multiline && props.variant === "field");
const r = computed(() => editable({ variant: props.variant, size: props.size, controls: props.controls, multiline: ml.value }));

function onValue(next: string) {
  value.value = next;
  emit("valueChange", next);
}

/* a preview cut by its ellipsis carries its full text as a title */
const preview = ref<{ $el: HTMLElement } | null>(null);
let stop = () => {};
onMounted(() => {
  trackModality();
  stop = truncationTitles(preview.value?.$el);
});
onBeforeUnmount(() => stop());
</script>

<template>
  <ArkEditable.Root
    v-bind="attrs"
    data-slot="editable"
    :class="r.base({ class: attrs.class as string | undefined })"
    :model-value="value"
    :placeholder="placeholder"
    :activation-mode="activationMode"
    :max-length="maxLength"
    :disabled="disabled"
    :invalid="invalid"
    :name="name"
    :translations="translations"
    @update:model-value="onValue"
    @value-commit="(details) => emit('valueCommit', details.value)"
    @value-revert="(details) => emit('valueRevert', details.value)"
  >
    <ArkEditable.Label v-if="label || $slots.label" data-slot="editable-label" :class="r.label()"><slot name="label">{{ label }}</slot></ArkEditable.Label>
    <ArkEditable.Area data-slot="editable-area" :class="r.area()">
      <ArkEditable.Input as-child>
        <Input v-if="ml" data-editable="input" :class="r.input()" :size="size" :invalid="invalid" multiline :rows="1" autoresize />
        <Input v-else data-editable="input" :class="r.input()" :size="size" :invalid="invalid" />
      </ArkEditable.Input>
      <ArkEditable.Preview ref="preview" data-slot="editable-preview" :class="r.preview()" />
    </ArkEditable.Area>
    <ArkEditable.Control v-if="controls" data-slot="editable-control" :class="r.control()">
      <ArkEditable.EditTrigger as-child>
        <Tooltip :content="text.edit">
          <Button data-editable="edit-trigger" variant="ghost" size="xs" square muted :aria-label="text.edit">
            <template #icon><PhPencilSimple data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </ArkEditable.EditTrigger>
      <ArkEditable.SubmitTrigger as-child>
        <Tooltip :content="text.submit">
          <Button data-editable="submit-trigger" variant="ghost" size="xs" square muted :aria-label="text.submit">
            <template #icon><PhCheck data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </ArkEditable.SubmitTrigger>
      <ArkEditable.CancelTrigger as-child>
        <Tooltip :content="text.cancel">
          <Button data-editable="cancel-trigger" variant="ghost" size="xs" square muted :aria-label="text.cancel">
            <template #icon><PhX data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </ArkEditable.CancelTrigger>
    </ArkEditable.Control>
  </ArkEditable.Root>
</template>
