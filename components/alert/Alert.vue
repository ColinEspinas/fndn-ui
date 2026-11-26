<script setup lang="ts">
/** A message that sits in the page. */
import { PhCheckCircle, PhInfo, PhWarning, PhWarningCircle } from "@phosphor-icons/vue";
import { computed, useAttrs, useSlots } from "vue";
import Button from "../button/Button.vue";
import { alert } from "./alert.recipe";

export type AlertTone = "neutral" | "accent" | "green" | "orange" | "red";
export type AlertActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type AlertAction = {
  label: string;
  /** Passed to the `action` event. Defaults to the label. */
  value?: string;
  variant?: AlertActionVariant;
};

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** status-pill's status tones: neutral is the card; the others fill with their tint. */
    tone?: AlertTone;
    /** Or the `title` slot. */
    title?: string;
    /** The tone's icon (default) or false for none. Use the `icon` slot for your own glyph. */
    icon?: boolean;
    /** Default: alert for orange and red, status otherwise. none: never announced. */
    role?: "alert" | "status" | "none";
    /** Buttons under the text, in order. Or the `action` slot for your own controls. */
    actions?: ReadonlyArray<AlertAction>;
  }>(),
  { tone: "neutral", icon: true },
);
const emit = defineEmits<{ action: [value: string] }>();
/** default: the description; title: rich title; icon: your own glyph; action: your own controls in place of `actions` */
defineSlots<{ default?: () => unknown; title?: () => unknown; icon?: () => unknown; action?: () => unknown }>();
const slots = useSlots();

const ICONS = { neutral: PhInfo, accent: PhInfo, green: PhCheckCircle, orange: PhWarning, red: PhWarningCircle } as const;
const r = computed(() => alert({ tone: props.tone }));
const resolvedRole = computed(() => {
  const role = props.role ?? (props.tone === "orange" || props.tone === "red" ? "alert" : "status");
  return role === "none" ? undefined : role;
});
const hasTitle = computed(() => !!slots.title || (props.title != null && props.title !== ""));
const hasActions = computed(() => !!slots.action || (props.actions != null && props.actions.length > 0));
</script>

<template>
  <div v-bind="attrs" data-slot="alert" :role="resolvedRole" :class="r.base({ class: attrs.class as string | undefined })">
    <span v-if="$slots.icon || icon" data-slot="alert-icon" :class="r.icon()" aria-hidden="true">
      <slot name="icon"><component :is="ICONS[tone]" data-slot="icon" weight="bold" /></slot>
    </span>
    <div data-slot="alert-content" :class="r.content()">
      <div v-if="hasTitle" data-slot="alert-title" :class="r.title()"><slot name="title">{{ title }}</slot></div>
      <div v-if="$slots.default" data-slot="alert-description" :class="r.description()"><slot /></div>
      <div v-if="hasActions" data-slot="alert-actions" :class="r.actions()">
        <slot name="action">
          <Button
            v-for="a in actions"
            :key="a.value ?? a.label"
            size="sm"
            :variant="a.variant ?? 'outline'"
            @click="emit('action', a.value ?? a.label)"
          >{{ a.label }}</Button>
        </slot>
      </div>
    </div>
  </div>
</template>
