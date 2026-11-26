<script setup lang="ts">
/** A confirm that interrupts: the Dialog with role="alertdialog". */
import { useAttrs } from "vue";
import Button from "../button/Button.vue";
import Dialog from "../dialog/Dialog.vue";
import { alertDialog } from "./alert-dialog.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The question; names the window. */
    title: string;
    /** What happens, and whether it can be undone. */
    description?: string;
    /** Say what it does ("Delete project"). */
    actionLabel?: string;
    cancelLabel?: string;
    /** danger: a danger action (default). neutral: a primary action. */
    tone?: "danger" | "neutral";
    /** The Dialog's widths: sm 360px, md 440px (default). */
    size?: "sm" | "md";
    /** Renders the Dialog's default Button trigger with this label. Use the `trigger` slot for your own element. */
    triggerLabel?: string;
  }>(),
  { actionLabel: "Continue", cancelLabel: "Cancel", tone: "danger", size: "md" },
);
/** v-model:open — falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: false });
/** action: the action was pressed. cancel: Cancel, Escape, or any close that is not the action. */
const emit = defineEmits<{ openChange: [open: boolean]; action: []; cancel: [] }>();
/** default: body content under the description; trigger: your own trigger (one element) */
defineSlots<{ default?: () => unknown; trigger?: () => unknown }>();

function setOpen(next: boolean, acted = false) {
  if (!next && open.value && !acted) emit("cancel");
  open.value = next;
  emit("openChange", next);
}
function act() {
  emit("action");
  setOpen(false, true);
}
const r = alertDialog();
</script>

<template>
  <div v-bind="attrs" data-slot="alert-dialog" :class="r.base({ class: attrs.class as string | undefined })">
    <Dialog
      :open="open"
      role="alertdialog"
      :closable="false"
      :size="props.size"
      :title="title"
      :description="description"
      :trigger-label="triggerLabel"
      @open-change="(next: boolean) => setOpen(next)"
    >
      <template v-if="$slots.trigger" #trigger><slot name="trigger" /></template>
      <template v-if="$slots.default" #default><slot /></template>
      <template #footer>
        <Button data-alert-dialog="cancel" :class="r.cancel()" variant="ghost" size="sm" @click="setOpen(false)">{{ cancelLabel }}</Button>
        <Button data-alert-dialog="action" :class="r.action()" :variant="tone === 'danger' ? 'danger' : 'primary'" size="sm" @click="act">{{ actionLabel }}</Button>
      </template>
    </Dialog>
  </div>
</template>
