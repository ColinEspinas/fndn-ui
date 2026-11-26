<script setup lang="ts">
/** The Menu, opened by a right-click or a long press on an area. Behaviour by Ark UI (Zag menu). */
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import { ref, useAttrs, watch } from "vue";
import MenuPanel, { type MenuHandlers } from "../menu/MenuPanel.vue";
import type { MenuEntry } from "../menu/Menu.vue";
import { contextMenu } from "./context-menu.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

defineProps<{
  /** The Menu's entries: actions, checkbox options, groups, radio groups, separators, sub-menus. */
  items: ReadonlyArray<MenuEntry>;
  /** The area keeps the browser's own context menu. */
  disabled?: boolean;
  /** The area's accessible name (it is focusable: Shift+F10 or the Menu key opens the menu from it). */
  label?: string;
}>();
/** v-model:open — falls back to local state when unbound. It opens at the last pointer position;
 * before any right-click there is none: it stays closed and says so (update:open false). */
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{
  select: [value: string];
  checkedChange: [value: string, checked: boolean];
  radioChange: [name: string, value: string];
  openChange: [open: boolean];
}>();
/** default: the area that is right-clicked (or long-pressed) */
defineSlots<{ default?: () => unknown }>();

const handlers: MenuHandlers = {
  onCheckedChange: (value, checked) => emit("checkedChange", value, checked),
  onRadioChange: (name, value) => emit("radioChange", name, value),
  onSelect: (value) => emit("select", value),
};

/* the element that had focus in the area when the menu opened: the menu has no trigger of its
 * own, so on close the engine leaves focus on the closing panel or nowhere; it goes back here */
let back: HTMLElement | null = null;
function remember(event: Event) {
  const area = event.currentTarget as HTMLElement;
  const a = document.activeElement;
  back = a instanceof HTMLElement && area.contains(a) ? a : area;
}
function restore() {
  requestAnimationFrame(() => {
    const a = document.activeElement;
    if (back?.isConnected && (!a || a === document.body || a.closest("[data-scope=menu][data-part=content]"))) back.focus({ preventScroll: true });
    back = null;
  });
}
function onOpen(next: boolean) {
  if (next) placed.value = true;
  else restore();
  open.value = next;
  emit("openChange", next);
}
/* the menu opens at the pointer: until a right-click (or a long press, or Shift+F10) has given
 * the engine a position, an `open` from the host is refused, and the host is told it is closed */
const placed = ref(false);
watch(open, (next) => {
  if (!next || placed.value) return;
  open.value = false;
  emit("openChange", false);
}, { immediate: true });
/* its corner at the pointer, as the system's own context menus */
const positioning = { placement: "bottom-start", gutter: 0 } as const;
</script>

<template>
  <ArkMenu.Root :open="open && placed":positioning="positioning" @open-change="(details) => onOpen(details.open)" @select="(details) => emit('select', details.value)">
    <div v-if="disabled" v-bind="attrs" data-slot="context-menu" :class="contextMenu({ class: attrs.class as string | undefined })"><slot /></div>
    <!-- focusable by itself, so a keyboard user can reach it and open the menu with Shift+F10 or the
         Menu key (the browser's contextmenu event); Escape brings focus back here -->
    <ArkMenu.ContextTrigger v-else as-child>
      <div
        v-bind="attrs"
        data-slot="context-menu"
        role="group"
        :aria-label="label"
        aria-keyshortcuts="Shift+F10"
        tabindex="0"
        :class="contextMenu({ class: attrs.class as string | undefined })"
        @contextmenu.capture="remember"
      ><slot /></div>
    </ArkMenu.ContextTrigger>
    <MenuPanel :items="items" :handlers="handlers" />
  </ArkMenu.Root>
</template>
