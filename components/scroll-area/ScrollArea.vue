<script setup lang="ts">
/** A region that scrolls with a thin overlay scrollbar. Behaviour by Ark UI (Zag scroll-area). */
import { ScrollArea as ArkScrollArea } from "@ark-ui/vue/scroll-area";
import { computed, useAttrs } from "vue";
import { scrollArea } from "./scroll-area.recipe";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Which scrollbars it draws (the viewport scrolls whichever way its content overflows). */
    orientation?: ScrollAreaOrientation;
  }>(),
  { orientation: "vertical" },
);
defineSlots<{ default?: () => unknown }>();

const r = computed(() => scrollArea({ orientation: props.orientation }));
const bars = computed(() => (props.orientation === "both" ? (["vertical", "horizontal"] as const) : [props.orientation]));
</script>

<template>
  <ArkScrollArea.Root v-bind="attrs" data-slot="scroll-area" :class="r.base({ class: attrs.class as string | undefined })">
    <ArkScrollArea.Viewport data-slot="scroll-area-viewport" :class="r.viewport()">
      <ArkScrollArea.Content data-slot="scroll-area-content" v-bind="r.content() ? { class: r.content() } : {}"><slot /></ArkScrollArea.Content>
    </ArkScrollArea.Viewport>
    <ArkScrollArea.Scrollbar v-for="o in bars" :key="o" :orientation="o" data-slot="scroll-area-scrollbar" :class="r.scrollbar()">
      <ArkScrollArea.Thumb data-slot="scroll-area-thumb" :class="r.thumb()" />
    </ArkScrollArea.Scrollbar>
    <ArkScrollArea.Corner v-if="orientation === 'both'" data-slot="scroll-area-corner" :class="r.corner()" />
  </ArkScrollArea.Root>
</template>
