<script setup lang="ts">
/** A centred window over a dimmed page. Behaviour by Ark UI (Zag dialog). */
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";
import { PhX } from "@phosphor-icons/vue";
import { computed, onMounted, ref, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { trackModality } from "../lib/modality";
import { submittedAction } from "./dialog.logic";
import { dialog } from "./dialog.recipe";

export type DialogActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type DialogAction = {
  label: string;
  /** Passed to the `action` event. Defaults to the label. */
  value?: string;
  variant?: DialogActionVariant;
  /** false keeps the dialog open after the press (or the form's submit). */
  close?: boolean;
  /** The id of a form in the body that this button submits (type="submit" form="<id>"). The
   * browser checks the form first; its submit event, not the click, emits `action` and closes. */
  form?: string;
};

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Names the dialog. Required (or the `title` slot). */
    title?: string;
    description?: string;
    /** alertdialog is for destructive confirms: a click outside does not close it and focus starts on the first action. */
    role?: "dialog" | "alertdialog";
    /** Footer buttons in order, least destructive first. Or use the `footer` slot. */
    actions?: ReadonlyArray<DialogAction>;
    /** Show the close button in the header. */
    closable?: boolean;
    /** Bare: the dialog is only the frame (position, focus trap, motion). No fill, no shadow, no padding, no header; the title still names it for assistive technology. Its one child is the surface, as in a command palette. */
    bare?: boolean;
    /** Width: sm 360px, md 440px (default), lg 880px (a large preview). */
    size?: "sm" | "md" | "lg";
    /** Where the window sits: center (at the bottom on a phone), or top: pinned near the top and growing downward (a command palette). */
    placement?: "center" | "top";
    /** Opens and closes at once from the pointer too (a command palette): no fade or scale. */
    instant?: boolean;
    /** What takes focus when it opens: an element, a selector (looked up inside the window first), or a
     * function returning the element. Default: the first control (the first action for alertdialog). */
    initialFocus?: HTMLElement | string | (() => HTMLElement | null);
    /** Renders a default Button trigger with this label. Use the `trigger` slot for your own element. */
    triggerLabel?: string;
  }>(),
  { role: "dialog", closable: true, size: "md", placement: "center" },
);
/** v-model:open — falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ openChange: [open: boolean]; action: [value: string] }>();
const slots = defineSlots<{ default?: () => unknown; trigger?: () => unknown; title?: () => unknown; footer?: () => unknown }>();

const footer = ref<HTMLElement | null>(null);
const header = ref<HTMLElement | null>(null);
const initialFocusEl = () => {
  const f = props.initialFocus;
  if (typeof f === "function") return f();
  if (typeof f === "string") return header.value?.parentElement?.querySelector<HTMLElement>(f) ?? document.querySelector<HTMLElement>(f);
  if (f) return f;
  return footer.value?.querySelector<HTMLElement>("button") ?? null;
};
function setOpen(next: boolean) {
  open.value = next;
  emit("openChange", next);
}
/* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
const mountedOpen = ref(open.value);
watch(open, (next) => { if (!next) mountedOpen.value = false; });
function keepFocus(e: MouseEvent) {
  if (e.target === e.currentTarget) e.preventDefault();
}
function press(action: DialogAction) {
  emit("action", action.value ?? action.label);
  if (action.close !== false) setOpen(false);
}
/* an action that names a form acts on the form's submit, which the browser fires only for a valid form */
function submitted(event: Event) {
  const action = slots.footer ? undefined : submittedAction(props.actions, footer.value, event);
  if (action) press(action);
}
onMounted(() => trackModality());
const r = computed(() => dialog({ size: props.size, bare: props.bare, placement: props.placement, instant: props.instant }));
</script>

<template>
  <div v-bind="attrs" data-slot="dialog" :class="r.base({ class: attrs.class as string | undefined })">
    <ArkDialog.Root
      :open="open"
      :role="props.role"
      :close-on-interact-outside="props.role !== 'alertdialog'"
      :initial-focus-el="props.initialFocus || props.role === 'alertdialog' ? initialFocusEl : undefined"
      @open-change="(details) => setOpen(details.open)"
    >
      <ArkDialog.Trigger v-if="$slots.trigger" as-child><slot name="trigger" /></ArkDialog.Trigger>
      <ArkDialog.Trigger v-else-if="triggerLabel" as-child><Button data-dialog="trigger" size="sm" :class="r.trigger()">{{ triggerLabel }}</Button></ArkDialog.Trigger>
      <Teleport to="body">
        <ArkDialog.Backdrop data-slot="dialog-backdrop" :data-mounted-open="mountedOpen ? '' : undefined" :class="r.backdrop()" />
        <!-- a press on the dimmed area must not pull focus out of the window -->
        <ArkDialog.Positioner data-slot="dialog-positioner" :class="r.positioner()" @mousedown="keepFocus">
          <ArkDialog.Content data-slot="dialog-content" :data-mounted-open="mountedOpen ? '' : undefined" :class="r.content()" @submit="submitted">
            <div ref="header" data-slot="dialog-header" :class="r.header()">
              <ArkDialog.Title data-slot="dialog-title" :class="r.title()"><slot name="title">{{ title }}</slot></ArkDialog.Title>
              <!-- the close trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
              <ArkDialog.CloseTrigger v-if="closable && !bare" as-child>
                <Tooltip content="Close">
                  <Button data-dialog="close" :class="r.close()" variant="ghost" size="sm" shape="rounded" square muted aria-label="Close">
                    <template #icon><PhX data-slot="icon" weight="bold" /></template>
                  </Button>
                </Tooltip>
              </ArkDialog.CloseTrigger>
            </div>
            <ArkDialog.Description v-if="description" data-slot="dialog-description" :class="r.description()">{{ description }}</ArkDialog.Description>
            <div v-if="$slots.default" data-slot="dialog-body" :class="r.body()"><slot /></div>
            <div v-if="$slots.footer || (actions && actions.length)" ref="footer" data-slot="dialog-footer" :class="r.footer()">
              <slot name="footer">
                <Button
                  v-for="action in actions"
                  :key="action.value ?? action.label"
                  :variant="action.variant ?? 'outline'"
                  size="sm"
                  v-bind="action.form ? { type: 'submit', form: action.form } : { onClick: () => press(action) }"
                >{{ action.label }}</Button>
              </slot>
            </div>
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Teleport>
    </ArkDialog.Root>
  </div>
</template>
