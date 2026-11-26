<script setup lang="ts">
/** The menu's popup: positioner, content, the gliding highlight and the rows, sub-menus included.
 * Render it inside an Ark Menu.Root. Used by Menu and by the components built on it (context-menu). */
import { Menu as ArkMenu, useMenuContext } from "@ark-ui/vue/menu";
import { PhCaretRight, PhCheck } from "@phosphor-icons/vue";
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import MenuPanel from "./MenuPanel.vue";
import { glide } from "../lib/glide";
import { menu } from "./menu.recipe";
import { checkbox } from "../checkbox/checkbox.recipe";
import { radioGroup } from "../radio-group/radio-group.recipe";
import { trackModality } from "../lib/modality";
import type { MenuCheckbox, MenuEntry, MenuRadioGroup } from "./Menu.vue";

/** What the rows of a menu (and of its sub-menus) need from the menu that owns them. */
export type MenuHandlers = {
  onSelect?: (value: string) => void;
  onCheckedChange?: (value: string, checked: boolean) => void;
  onRadioChange?: (name: string, value: string) => void;
};
/** Options remember their own state, seeded from the entries: one store for the whole tree, so a
 * sub-menu that closes and reopens keeps its options. */
export type MenuOptionState = { checks: Record<string, boolean>; radios: Record<string, string> };

const props = defineProps<{
  items: ReadonlyArray<MenuEntry>;
  handlers?: MenuHandlers;
  /** The tree's option state (reactive). Omitted: the panel keeps its own. */
  options?: MenuOptionState;
}>();

const r = menu();
const cb = checkbox();
const rg = radioGroup();
const own = reactive<MenuOptionState>({ checks: {}, radios: {} });
const state = () => props.options ?? own;
/* open when it mounted: drawn at once (the popup recipe skips the entrance) until it first closes.
 * Read from the menu that owns this panel; a sub-menu always mounts closed. */
const api = useMenuContext();
const mountedOpen = ref(api.value.open);
watch(() => api.value.open, (next) => { if (!next) mountedOpen.value = false; });

function onChecked(item: MenuCheckbox, next: boolean) {
  state().checks[item.value] = next;
  props.handlers?.onCheckedChange?.(item.value, next);
}
function onRadio(group: MenuRadioGroup, next: string) {
  state().radios[group.name] = next;
  props.handlers?.onRadioChange?.(group.name, next);
}
/* a nested Ark menu: the engine opens it to the side (left-start under rtl; 4px up, so its first
 * row lines up with the row that opened it), moves focus into it with ArrowRight (ArrowLeft under
 * rtl) and back with the opposite arrow or Escape */
const subPositioning = { offset: { mainAxis: 8, crossAxis: -4 } };

const content = ref<{ $el: HTMLElement } | null>(null);
const highlight = ref<HTMLElement | null>(null);
let stopGlide: (() => void) | undefined;
onMounted(() => {
  trackModality();
  if (content.value?.$el && highlight.value) stopGlide = glide(content.value.$el, highlight.value, { rows: "[data-slot=menu-item]", follow: "highlighted" });
});
onBeforeUnmount(() => stopGlide?.());
</script>

<template>
  <Teleport to="body">
    <ArkMenu.Positioner data-slot="menu-positioner" :class="r.positioner()">
      <ArkMenu.Content ref="content" data-slot="menu-content" :data-mounted-open="mountedOpen ? '' : undefined" :class="r.content()">
        <span ref="highlight" data-slot="menu-highlight" :class="r.highlight()" aria-hidden="true" />
        <template v-for="(entry, index) in items" :key="index">
          <ArkMenu.Separator v-if="entry.type === 'separator'" data-slot="menu-separator" :class="r.separator()" />
          <ArkMenu.RadioItemGroup
            v-else-if="entry.type === 'radio-group'"
            data-slot="menu-group" :class="r.group()"
            :model-value="state().radios[entry.name] ?? entry.value"
            @update:model-value="(next: string) => onRadio(entry, next)"
          >
            <ArkMenu.ItemGroupLabel v-if="entry.label" data-slot="menu-label" :class="r.label()">{{ entry.label }}</ArkMenu.ItemGroupLabel>
            <ArkMenu.RadioItem v-for="option in entry.items" :key="option.value" :value="option.value" :disabled="option.disabled" :close-on-select="!!entry.closeOnSelect" data-slot="menu-item" :class="r.item()">
              <div data-slot="radio-group-control" :class="rg.control()" :data-state="(state().radios[entry.name] ?? entry.value) === option.value ? 'checked' : 'unchecked'" aria-hidden="true" />
              <span data-slot="menu-item-text" :class="r.itemText()">{{ option.label }}</span>
            </ArkMenu.RadioItem>
          </ArkMenu.RadioItemGroup>
          <ArkMenu.ItemGroup v-else-if="entry.type === 'group'" data-slot="menu-group" :class="r.group()">
            <ArkMenu.ItemGroupLabel v-if="entry.label" data-slot="menu-label" :class="r.label()">{{ entry.label }}</ArkMenu.ItemGroupLabel>
            <template v-for="child in entry.items" :key="child.value">
              <ArkMenu.CheckboxItem
                v-if="child.type === 'checkbox'"
                :value="child.value"
                :disabled="child.disabled"
                :close-on-select="false"
                data-slot="menu-item" :class="r.item()"
                :checked="state().checks[child.value] ?? !!child.checked"
                @update:checked="(next: boolean) => onChecked(child, next)"
              >
                <div data-slot="checkbox-control" :class="cb.control()" :data-state="(state().checks[child.value] ?? !!child.checked) ? 'checked' : 'unchecked'" aria-hidden="true"><span data-slot="checkbox-mark" :class="cb.mark()" data-mark="check"><PhCheck data-slot="icon" weight="bold" /></span></div>
                <span data-slot="menu-item-text" :class="r.itemText()">{{ child.label }}</span>
              </ArkMenu.CheckboxItem>
              <ArkMenu.Item v-else :value="child.value" :disabled="child.disabled" data-slot="menu-item" :class="r.item({ tone: child.tone })">
                <span v-if="child.icon" data-slot="menu-item-icon" :class="r.itemIcon({ tone: child.tone })" aria-hidden="true"><component :is="child.icon" data-slot="icon" weight="bold" /></span>
                <span data-slot="menu-item-text" :class="r.itemText()">{{ child.label }}</span>
                <span v-if="child.meta" data-slot="menu-item-meta" :class="r.itemMeta()">{{ child.meta }}</span>
              </ArkMenu.Item>
            </template>
          </ArkMenu.ItemGroup>
          <ArkMenu.CheckboxItem
            v-else-if="entry.type === 'checkbox'"
            :value="entry.value"
            :disabled="entry.disabled"
            :close-on-select="false"
            data-slot="menu-item" :class="r.item()"
            :checked="state().checks[entry.value] ?? !!entry.checked"
            @update:checked="(next: boolean) => onChecked(entry, next)"
          >
            <div data-slot="checkbox-control" :class="cb.control()" :data-state="(state().checks[entry.value] ?? !!entry.checked) ? 'checked' : 'unchecked'" aria-hidden="true"><span data-slot="checkbox-mark" :class="cb.mark()" data-mark="check"><PhCheck data-slot="icon" weight="bold" /></span></div>
            <span data-slot="menu-item-text" :class="r.itemText()">{{ entry.label }}</span>
          </ArkMenu.CheckboxItem>
          <ArkMenu.Root v-else-if="entry.type === 'submenu'" :positioning="subPositioning" @select="(details) => handlers?.onSelect?.(details.value)">
            <ArkMenu.TriggerItem data-slot="menu-item" :class="r.item()">
              <span v-if="entry.icon" data-slot="menu-item-icon" :class="r.itemIcon()" aria-hidden="true"><component :is="entry.icon" data-slot="icon" weight="bold" /></span>
              <span data-slot="menu-item-text" :class="r.itemText()">{{ entry.label }}</span>
              <span data-slot="menu-item-caret" :class="r.itemCaret()" aria-hidden="true"><PhCaretRight data-slot="icon" weight="bold" /></span>
            </ArkMenu.TriggerItem>
            <MenuPanel :items="entry.items" :handlers="handlers" :options="state()" />
          </ArkMenu.Root>
          <ArkMenu.Item v-else :value="entry.value" :disabled="entry.disabled" data-slot="menu-item" :class="r.item({ tone: entry.tone })">
            <span v-if="entry.icon" data-slot="menu-item-icon" :class="r.itemIcon({ tone: entry.tone })" aria-hidden="true"><component :is="entry.icon" data-slot="icon" weight="bold" /></span>
            <span data-slot="menu-item-text" :class="r.itemText()">{{ entry.label }}</span>
            <span v-if="entry.meta" data-slot="menu-item-meta" :class="r.itemMeta()">{{ entry.meta }}</span>
          </ArkMenu.Item>
        </template>
      </ArkMenu.Content>
    </ArkMenu.Positioner>
  </Teleport>
</template>
