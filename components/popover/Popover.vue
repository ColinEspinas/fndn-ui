<script setup lang="ts">
/** A small raised surface anchored to its trigger. Behaviour by Ark UI (Zag popover). */
import { Popover as ArkPopover } from "@ark-ui/vue/popover";
import { PhX } from "@phosphor-icons/vue";
import { computed, onMounted, ref, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import { popover } from "./popover.recipe";
import Tooltip from "../tooltip/Tooltip.vue";
import { trackModality } from "../lib/modality";

export type PopoverPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = popover();

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    /** Show the close button in the header. */
    closable?: boolean;
    placement?: PopoverPlacement;
    /** Renders a default Button trigger with this label. Use the `trigger` slot for your own element. */
    triggerLabel?: string;
  }>(),
  { closable: true, placement: "bottom-start" },
);
/** v-model:open — falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ openChange: [open: boolean] }>();
const slots = defineSlots<{ default?: () => unknown; trigger?: () => unknown; title?: () => unknown; description?: () => unknown }>();

const positioning = computed(() => ({ placement: props.placement, gutter: 6 }));
const hasTitle = computed(() => !!(props.title || slots.title));
function onOpen(next: boolean) {
  open.value = next;
  emit("openChange", next);
}
/* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
const mountedOpen = ref(open.value);
watch(open, (next) => { if (!next) mountedOpen.value = false; });
onMounted(() => trackModality());
</script>

<template>
  <div v-bind="attrs" data-slot="popover" :class="r.base({ class: attrs.class as string | undefined })">
    <ArkPopover.Root :open="open" :positioning="positioning" @open-change="(details) => onOpen(details.open)">
      <ArkPopover.Trigger v-if="$slots.trigger" as-child><slot name="trigger" /></ArkPopover.Trigger>
      <ArkPopover.Trigger v-else as-child><Button data-popover="trigger" :class="r.trigger()" variant="outline" size="sm">{{ triggerLabel }}</Button></ArkPopover.Trigger>
      <Teleport to="body">
        <ArkPopover.Positioner data-slot="popover-positioner" :class="r.positioner()">
          <ArkPopover.Content data-slot="popover-content" :data-mounted-open="mountedOpen ? '' : undefined" :class="r.content()">
            <div v-if="hasTitle || closable" data-slot="popover-header" :class="r.header()">
              <ArkPopover.Title v-if="hasTitle" data-slot="popover-title" :class="r.title()"><slot name="title">{{ title }}</slot></ArkPopover.Title>
              <!-- the close trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
              <ArkPopover.CloseTrigger v-if="closable" as-child>
                <Tooltip content="Close">
                  <Button variant="ghost" size="xs" shape="rounded" square muted aria-label="Close" data-popover="close" :class="r.close()">
                    <template #icon><PhX data-slot="icon" weight="bold" /></template>
                  </Button>
                </Tooltip>
              </ArkPopover.CloseTrigger>
            </div>
            <ArkPopover.Description v-if="description || $slots.description" data-slot="popover-description" :class="r.description()"><slot name="description">{{ description }}</slot></ArkPopover.Description>
            <div v-if="$slots.default" data-slot="popover-body" :class="r.body()"><slot /></div>
          </ArkPopover.Content>
        </ArkPopover.Positioner>
      </Teleport>
    </ArkPopover.Root>
  </div>
</template>
