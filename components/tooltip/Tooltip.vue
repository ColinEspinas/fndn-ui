<script setup lang="ts">
/** A dark chip that names a control. Behaviour by Ark UI (Zag tooltip). */
import { Tooltip as ArkTooltip } from "@ark-ui/vue/tooltip";
import { computed, onMounted, ref, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Kbd from "../kbd/Kbd.vue";
import { tooltip } from "./tooltip.recipe";
import { trackModality } from "../lib/modality";

/* attributes and listeners from an outer as-child trigger (a menu's, a dialog's) go to the trigger,
 * so a tooltip can wrap the trigger of another component */
defineOptions({ inheritAttrs: false });

export type TooltipPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";

const props = withDefaults(
  defineProps<{
    /** The label. Keep it short; a tooltip never holds interactive content. Or use the `content` slot. */
    content?: string;
    /** Keyboard shortcut hint, e.g. "⌘C". */
    shortcut?: string;
    placement?: TooltipPlacement;
    /** Milliseconds before the first tooltip opens on hover. Neighbours open at once. */
    openDelay?: number;
    disabled?: boolean;
    /** Renders a default Button trigger with this label when the default slot is empty. */
    triggerLabel?: string;
    /** Machine id. Generated when omitted; set it when several Vue apps share a page. */
    id?: string;
    /** Id of a trigger that another component owns (a menu's), so the tooltip finds it. Set by itself when
     * the Tooltip is the as-child trigger of another component. */
    triggerId?: string;
  }>(),
  /* disabled stays undefined when not given, so a hosted Tooltip passes on only a disabled it received */
  { placement: "top", openDelay: 400, disabled: undefined },
);
const emit = defineEmits<{ openChange: [open: boolean] }>();
/** default: the trigger (one element); content: a rich label instead of the `content` prop */
defineSlots<{ default?: () => unknown; content?: () => unknown }>();

const positioning = computed(() => ({ placement: props.placement, gutter: 6 }));
/* as the as-child trigger of another component (it passes its data-scope), `id` is that trigger's id */
const attrs = useAttrs();
const hosted = computed(() => attrs["data-scope"] !== undefined);
const ownerId = computed(() => props.triggerId ?? (hosted.value ? props.id : undefined));
const ids = computed(() => (ownerId.value ? { trigger: ownerId.value } : undefined));
/* As another component's trigger, `disabled` is that trigger's state (the host engine passes it, a
 * date picker's calendar button for one): it goes on the button, and the tooltip of a disabled
 * control stays closed. Before, the tooltip took it as its own prop and the button never
 * disabled. */
const triggerAttrs = computed(() => ({
  ...attrs,
  ...(ownerId.value ? { id: ownerId.value } : {}),
  ...(hosted.value && props.disabled !== undefined ? { disabled: props.disabled } : {}),
}));
/* A press on the trigger cancels a tooltip still waiting out its delay, and none opens again until
 * the pointer leaves: a quick click does not bring the label up over what the click opened (the
 * engine ignores a close while it waits). The state is held here so the open can be refused. */
const open = ref(false);
let pressed = false;
const press = (on: boolean) => { pressed = on; };
const onOpenChange = (details: { open: boolean }) => {
  if (details.open && pressed) return;
  open.value = details.open;
  emit("openChange", details.open);
};
const r = tooltip();
onMounted(() => trackModality());
</script>

<template>
  <ArkTooltip.Root :id="hosted ? undefined : id" :ids="ids" :open-delay="openDelay" :disabled="disabled" :positioning="positioning" lazy-mount :open="open" @open-change="onOpenChange">
    <ArkTooltip.Trigger v-if="$slots.default" v-bind="triggerAttrs" as-child @pointerdown="press(true)" @pointerleave="press(false)"><slot /></ArkTooltip.Trigger>
    <ArkTooltip.Trigger v-else as-child @pointerdown="press(true)" @pointerleave="press(false)"><Button variant="outline" size="sm">{{ triggerLabel }}</Button></ArkTooltip.Trigger>
    <Teleport to="body">
      <ArkTooltip.Positioner data-slot="tooltip-positioner" :class="r.positioner()">
        <ArkTooltip.Content data-slot="tooltip" :class="r.base()">
          <span data-slot="tooltip-label" :class="r.label()"><slot name="content">{{ content }}</slot></span>
          <Kbd v-if="shortcut" data-tooltip="shortcut" :class="r.shortcut()" variant="plain" :keys="[shortcut]" />
        </ArkTooltip.Content>
      </ArkTooltip.Positioner>
    </Teleport>
  </ArkTooltip.Root>
</template>
