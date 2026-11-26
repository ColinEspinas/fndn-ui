<script setup lang="ts">
/** A list of actions that opens from a button. Behaviour by Ark UI (Zag menu). */
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import { PhCaretDown } from "@phosphor-icons/vue";
import { computed, reactive, useAttrs, watch, type Component } from "vue";
import Button from "../button/Button.vue";
import MenuPanel, { type MenuHandlers, type MenuOptionState } from "./MenuPanel.vue";
import { menu } from "./menu.recipe";

export type MenuAction = { type?: "item"; value: string; label: string; meta?: string; tone?: "default" | "danger"; disabled?: boolean; icon?: Component };
export type MenuCheckbox = { type: "checkbox"; value: string; label: string; checked?: boolean; disabled?: boolean };
export type MenuGroup = { type: "group"; label?: string; items: ReadonlyArray<MenuAction | MenuCheckbox> };
export type MenuRadioGroup = {
  type: "radio-group"; name: string; label?: string; value?: string;
  /** Close the menu when an option is picked. Default false: the menu stays open. */
  closeOnSelect?: boolean;
  items: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
};
export type MenuSeparator = { type: "separator" };
/** A row that opens a nested menu to its side. */
export type MenuSubmenu = { type: "submenu"; label: string; icon?: Component; items: ReadonlyArray<MenuEntry> };
export type MenuEntry = MenuAction | MenuCheckbox | MenuGroup | MenuRadioGroup | MenuSeparator | MenuSubmenu;
export type MenuPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end" | "right-start" | "left-start";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = menu();

const props = withDefaults(
  defineProps<{
    /** Entries in order: actions, checkbox options, labelled groups, radio groups, separators, sub-menus. */
    items: ReadonlyArray<MenuEntry>;
    /** Label of the default trigger. Use the `trigger` slot for your own element. */
    triggerLabel?: string;
    placement?: MenuPlacement;
  }>(),
  { placement: "bottom-start" },
);

/** v-model:open — falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{
  select: [value: string];
  checkedChange: [value: string, checked: boolean];
  radioChange: [name: string, value: string];
  openChange: [open: boolean];
}>();
defineSlots<{ trigger?: () => unknown }>();

/* Options remember their own state, seeded from the entries (one store for the whole tree, sub-menus
 * included). When the entries' own checked/value fields change (the parent took control), that state is dropped. */
const options = reactive<MenuOptionState>({ checks: {}, radios: {} });
const flat = (entries: ReadonlyArray<MenuEntry>): unknown[] =>
  entries.flatMap((e) => (e.type === "group" || e.type === "submenu" ? flat(e.items) : e.type === "radio-group" ? [[e.name, e.value]] : e.type === "checkbox" ? [[e.value, !!e.checked]] : []));
watch(
  () => JSON.stringify(flat(props.items)),
  () => {
    options.checks = {};
    options.radios = {};
  },
);
const positioning = computed(() => ({ placement: props.placement, gutter: 4 }));

const handlers: MenuHandlers = {
  onCheckedChange: (value, checked) => emit("checkedChange", value, checked),
  onRadioChange: (name, value) => emit("radioChange", name, value),
  onSelect: (value) => emit("select", value),
};
function onOpen(next: boolean) {
  open.value = next;
  emit("openChange", next);
}
</script>

<template>
  <ArkMenu.Root :open="open" :positioning="positioning" @open-change="(details) => onOpen(details.open)" @select="(details) => emit('select', details.value)">
    <div v-bind="attrs" data-slot="menu" :class="r.base({ class: attrs.class as string | undefined })">
      <ArkMenu.Trigger v-if="$slots.trigger" as-child><slot name="trigger" /></ArkMenu.Trigger>
      <ArkMenu.Trigger v-else as-child>
        <Button data-menu="trigger" :class="r.trigger()" variant="outline" size="sm">
          {{ triggerLabel }}
          <template #trailingIcon><PhCaretDown data-slot="icon" weight="bold" /></template>
        </Button>
      </ArkMenu.Trigger>
    </div>
    <MenuPanel :items="items" :handlers="handlers" :options="options" />
  </ArkMenu.Root>
</template>
