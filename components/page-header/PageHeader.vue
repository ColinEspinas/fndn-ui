<script setup lang="ts">
/** The strip at the top of a screen's content: back link, title, description, actions. */
import { PhArrowLeft } from "@phosphor-icons/vue";
import { computed, useAttrs, useSlots } from "vue";
import Button from "../button/Button.vue";
import { pageHeader } from "./page-header.recipe";

export type PageHeaderBack = { label: string; href?: string };
export type PageHeaderActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type PageHeaderAction = {
  label: string;
  /** Passed to the `action` event. Defaults to the label. */
  value?: string;
  variant?: PageHeaderActionVariant;
};

/* the caller's class goes through the recipe; anything else (id, aria-*) lands on the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The screen's title, a real heading. Or the `title` slot. */
    title?: string;
    /** One line or two under the title (beside it in a pane). Or the `description` slot. */
    description?: string;
    /** Where "back" goes: a link with an href, a button that emits `back` without one. */
    back?: PageHeaderBack;
    /** `@back`: called by the back button; given with an href, it replaces the browser's navigation
     * (client routers), and a click with a modifier key keeps the browser's. A prop, so the
     * component knows whether a listener is bound. */
    onBack?: (back: PageHeaderBack) => void;
    /** The heading's level, h1 to h6. The size does not change with it. */
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    /** page: a page's title. pane: the one-row header of a pane above a list. */
    size?: "page" | "pane";
    /** Buttons from data at the end of the title's line (sm, outline unless given). Or the `actions` slot. */
    actions?: ReadonlyArray<PageHeaderAction>;
  }>(),
  { title: undefined, description: undefined, back: undefined, onBack: undefined, level: 1, size: "page", actions: undefined },
);
const emit = defineEmits<{ action: [value: string] }>();
/** title, description: rich content; actions: your own Buttons in place of `actions` */
defineSlots<{ title?: () => unknown; description?: () => unknown; actions?: () => unknown }>();
const slots = useSlots();

const r = computed(() => pageHeader({ size: props.size }));
/* a level outside 1 to 6 falls back to the nearest one (h7 is not an element) */
const heading = computed(() => `h${Math.min(6, Math.max(1, Math.round(Number(props.level) || 1)))}`);
/* read at render, not cached: slots are not reactive, and a slot given under a v-if comes and goes */
const hasDescription = () => !!slots.description || (props.description != null && props.description !== "");
const hasActions = () => !!slots.actions || (props.actions != null && props.actions.length > 0);

function follow(e: MouseEvent) {
  if (!props.onBack || !props.back || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  props.onBack(props.back);
}
</script>

<template>
  <div v-bind="attrs" data-slot="page-header" :class="r.base({ class: attrs.class as string | undefined })">
    <template v-if="back">
      <a v-if="back.href != null" data-slot="page-header-back" :class="r.back()" :href="back.href" @click="follow"><PhArrowLeft data-slot="icon" weight="bold" aria-hidden="true" />{{ back.label }}</a>
      <button v-else type="button" data-slot="page-header-back" :class="r.back()" @click="onBack?.(back)"><PhArrowLeft data-slot="icon" weight="bold" aria-hidden="true" />{{ back.label }}</button>
    </template>
    <div data-slot="page-header-row" :class="r.row()">
      <div data-slot="page-header-text" :class="r.text()">
        <component :is="heading" data-slot="page-header-title" :class="r.title()"><slot name="title">{{ title }}</slot></component>
        <p v-if="hasDescription()" data-slot="page-header-description" :class="r.description()"><slot name="description">{{ description }}</slot></p>
      </div>
      <div v-if="hasActions()" data-slot="page-header-actions" :class="r.actions()">
        <slot name="actions">
          <Button v-for="a in actions" :key="a.value ?? a.label" size="sm" :variant="a.variant ?? 'outline'" @click="emit('action', a.value ?? a.label)">{{ a.label }}</Button>
        </slot>
      </div>
    </div>
  </div>
</template>
