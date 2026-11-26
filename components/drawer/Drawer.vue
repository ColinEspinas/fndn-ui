<script setup lang="ts">
/** A sheet that slides in from an edge and is dragged away. Behaviour by Ark UI (Zag drawer). */
import { Drawer as ArkDrawer } from "@ark-ui/vue/drawer";
import { PhX } from "@phosphor-icons/vue";
import { computed, onMounted, ref, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { trackModality } from "../lib/modality";
import { drawer } from "./drawer.recipe";

export type DrawerSide = "bottom" | "end" | "start";
export type DrawerActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
export type DrawerAction = {
  label: string;
  /** Passed to the `action` event. Defaults to the label. */
  value?: string;
  variant?: DrawerActionVariant;
  /** false keeps the sheet open after the press. */
  close?: boolean;
};

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The edge it slides from and is dragged back to: bottom (default), end, start. */
    side?: DrawerSide;
    /** Names the sheet. Required (or the `title` slot). */
    title?: string;
    description?: string;
    /** Footer Buttons in order, least destructive first. Or use the `footer` slot. */
    actions?: ReadonlyArray<DrawerAction>;
    /** Show the close button in the header. */
    closable?: boolean;
    /** Renders a default Button trigger with this label. Use the `trigger` slot for your own element. */
    triggerLabel?: string;
  }>(),
  { side: "bottom", closable: true },
);
/** v-model:open — falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ openChange: [open: boolean]; action: [value: string] }>();
defineSlots<{ default?: () => unknown; trigger?: () => unknown; title?: () => unknown; footer?: () => unknown }>();

const SWIPE = { bottom: "down", end: "end", start: "start" } as const;
function setOpen(next: boolean) {
  open.value = next;
  emit("openChange", next);
}
/* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
const mountedOpen = ref(open.value);
watch(open, (next) => { if (!next) mountedOpen.value = false; });
function press(action: DrawerAction) {
  emit("action", action.value ?? action.label);
  if (action.close !== false) setOpen(false);
}
onMounted(() => trackModality());
const r = computed(() => drawer({ side: props.side }));
</script>

<template>
  <div v-bind="attrs" data-slot="drawer" :class="r.base({ class: attrs.class as string | undefined })">
    <ArkDrawer.Root :open="open" :swipe-direction="SWIPE[side]" @open-change="(details) => setOpen(details.open)">
      <ArkDrawer.Trigger v-if="$slots.trigger" as-child><slot name="trigger" /></ArkDrawer.Trigger>
      <ArkDrawer.Trigger v-else-if="triggerLabel" as-child><Button data-drawer="trigger" size="sm" :class="r.trigger()">{{ triggerLabel }}</Button></ArkDrawer.Trigger>
      <Teleport to="body">
        <ArkDrawer.Backdrop data-slot="drawer-backdrop" :data-mounted-open="mountedOpen ? '' : undefined" :class="r.backdrop()" />
        <ArkDrawer.Positioner data-slot="drawer-positioner" :class="r.positioner()">
          <ArkDrawer.Content data-slot="drawer-content" :data-mounted-open="mountedOpen ? '' : undefined" :class="r.content()">
            <ArkDrawer.Grabber v-if="side === 'bottom'" data-slot="drawer-grabber" :class="r.grabber()" aria-hidden="true">
              <ArkDrawer.GrabberIndicator data-slot="drawer-grabber-indicator" :class="r.grabberIndicator()" />
            </ArkDrawer.Grabber>
            <div data-slot="drawer-header" :class="r.header()">
              <ArkDrawer.Title data-slot="drawer-title" :class="r.title()"><slot name="title">{{ title }}</slot></ArkDrawer.Title>
              <!-- the close trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
              <ArkDrawer.CloseTrigger v-if="closable" as-child>
                <Tooltip content="Close">
                  <Button data-drawer="close" :class="r.close()" variant="ghost" size="sm" shape="rounded" square muted aria-label="Close">
                    <template #icon><PhX data-slot="icon" weight="bold" /></template>
                  </Button>
                </Tooltip>
              </ArkDrawer.CloseTrigger>
            </div>
            <ArkDrawer.Description v-if="description" data-slot="drawer-description" :class="r.description()">{{ description }}</ArkDrawer.Description>
            <div v-if="$slots.default" data-slot="drawer-body" :class="r.body()"><slot /></div>
            <div v-if="$slots.footer || (actions && actions.length)" data-slot="drawer-footer" :class="r.footer()">
              <slot name="footer">
                <Button
                  v-for="action in actions"
                  :key="action.value ?? action.label"
                  :variant="action.variant ?? 'outline'"
                  size="sm"
                  @click="press(action)"
                >{{ action.label }}</Button>
              </slot>
            </div>
          </ArkDrawer.Content>
        </ArkDrawer.Positioner>
      </Teleport>
    </ArkDrawer.Root>
  </div>
</template>
