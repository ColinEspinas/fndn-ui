<script setup lang="ts">
/** A site's top navigation: links and triggers that open a panel of links. Behaviour by Ark UI (Zag navigation-menu). */
import { NavigationMenu as ArkNavigationMenu } from "@ark-ui/vue/navigation-menu";
import { useLocaleContext } from "@ark-ui/vue/locale";
import { PhCaretDown } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch, type Directive } from "vue";
import { afterPaint } from "../lib/paint";
import { anchorPanel, forwardPanelKeys, holdsCurrent, isCurrent } from "./navigation-menu.logic";
import Button from "../button/Button.vue";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { navigationMenu } from "./navigation-menu.recipe";

export type NavigationMenuLink = { label: string; href: string; description?: string; current?: boolean };
export type NavigationMenuItem = {
  value: string;
  label: string;
  /** A plain link in the row. */
  href?: string;
  /** A plain link: the current page. */
  current?: boolean;
  /** A trigger and its panel of links. */
  links?: ReadonlyArray<NavigationMenuLink>;
};

/* the caller's class goes through the recipe; other attributes (id, style, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The entries of the row in order: plain links (href) or triggers with a panel (links). */
    items: ReadonlyArray<NavigationMenuItem>;
    /** The current page's href: its link is aria-current="page", and the trigger whose panel holds it aria-current="true". */
    currentHref?: string;
    /** The nav landmark's accessible name. */
    label?: string;
    /** Milliseconds a mouse rests on a trigger before its panel opens. */
    openDelay?: number;
    /** Milliseconds after the mouse leaves before the panel closes. */
    closeDelay?: number;
  }>(),
  { label: "Main", openDelay: 200, closeDelay: 300, currentHref: undefined },
);

/** v-model:value — the open panel's item value ("" for none); falls back to local state when unbound. */
const value = defineModel<string>("value", { default: "" });
const emit = defineEmits<{ valueChange: [value: string]; linkSelect: [href: string] }>();

const r = navigationMenu();
const locale = useLocaleContext();

/* The engine measures the trigger and sizes the panel box only when its value changes, so a panel
 * open at mount would get no size. The engine is always driven from here: closed for the first
 * paint, then the open value. A panel open at mount is shown without its entrance (nothing plays on
 * first paint): its transitions are off until it has been painted once. */
const mounted = ref(false);
const settled = ref(false);
const current = computed(() => (mounted.value ? value.value : ""));
function onValue(next: string) {
  value.value = next;
  emit("valueChange", next);
}

/* the panel box lives in a portal, placed under the row while a panel is open (navigation-menu.logic.ts) */
const root = ref<{ $el: HTMLElement } | null>(null);
const positioner = ref<{ $el: HTMLElement } | null>(null);
watch(current, (open, _, onCleanup) => {
  if (open) onCleanup(anchorPanel(root.value?.$el ?? null, positioner.value?.$el ?? null));
}, { flush: "post" });

/* one panel: the gliding highlight follows the pointer and the focus between its links. The engine
 * moves the content into the panel box once that box exists (a new element): the highlight is
 * attached to whichever element is mounted. */
const stops = new WeakMap<HTMLElement, () => void>();
const vGlide: Directive<HTMLElement> = {
  mounted(el) { if (el.parentElement) stops.set(el, glide(el.parentElement, el, { rows: "[data-slot=navigation-menu-link]", follow: "hover" })); },
  unmounted(el) { stops.get(el)?.(); stops.delete(el); },
};

let cancel = () => {};
let stopKeys = () => {};
onMounted(() => {
  trackModality();
  /* the panel's keys reach its item, as React's tree delivers them (navigation-menu.logic.ts) */
  stopKeys = forwardPanelKeys(root.value?.$el ?? null, positioner.value?.$el ?? null);
  /* after the first paint: by then the engine has found the panel box and moved the contents into
   * it, so the content it measures is the one that stays */
  cancel = afterPaint(() => {
    mounted.value = true;
    cancel = afterPaint(() => { settled.value = true; });
  });
});
onBeforeUnmount(() => { cancel(); stopKeys(); });
</script>

<template>
  <ArkNavigationMenu.Root
    ref="root"
    v-bind="attrs"
    data-slot="navigation-menu"
    :class="r.base({ class: attrs.class as string | undefined })"
    :aria-label="label"
    :value="current"
    :open-delay="openDelay"
    :close-delay="closeDelay"
    @value-change="(d) => onValue(d.value)"
  >
    <ArkNavigationMenu.List data-slot="navigation-menu-list" :class="r.list()">
      <ArkNavigationMenu.Item v-for="item in items" :key="item.value" :value="item.value" data-slot="navigation-menu-item" :class="r.item()">
        <template v-if="item.links">
          <ArkNavigationMenu.Trigger as-child>
            <Button data-navigation-menu="trigger" :class="r.trigger()" :aria-current="holdsCurrent(item.links, props.currentHref) ? 'true' : undefined" variant="ghost" size="sm">
              <template #trailingIcon><PhCaretDown data-slot="navigation-menu-caret" :class="r.caret()" weight="bold" /></template>{{ item.label }}</Button>
          </ArkNavigationMenu.Trigger>
          <ArkNavigationMenu.Content data-slot="navigation-menu-content" :class="r.content()">
            <span v-glide data-slot="navigation-menu-highlight" :class="r.highlight()" aria-hidden="true" />
            <ArkNavigationMenu.Link
              v-for="link in item.links"
              :key="link.href + link.label"
              :href="link.href"
              :current="isCurrent(link, props.currentHref)"
              :on-select="() => emit('linkSelect', link.href)"
              data-slot="navigation-menu-link"
              :class="r.link()"
            >
              <span data-slot="navigation-menu-link-title" :class="r.linkTitle()">{{ link.label }}</span>
              <span v-if="link.description" data-slot="navigation-menu-link-description" :class="r.linkDescription()">{{ link.description }}</span>
            </ArkNavigationMenu.Link>
          </ArkNavigationMenu.Content>
        </template>
        <ArkNavigationMenu.Link
          v-else
          :href="item.href"
          :current="isCurrent(item, props.currentHref)"
          :on-select="() => item.href && emit('linkSelect', item.href)"
          data-slot="navigation-menu-bar-link"
          :class="r.barLink()"
        >{{ item.label }}</ArkNavigationMenu.Link>
      </ArkNavigationMenu.Item>
    </ArkNavigationMenu.List>
    <Teleport to="body">
      <ArkNavigationMenu.ViewportPositioner ref="positioner" data-slot="navigation-menu-viewport-positioner" :class="r.viewportPositioner()" :align="locale?.dir === 'rtl' ? 'end' : 'start'">
        <!-- the engine turns transitions off on a first open (meant for a box that animates its
             size); this box only grows as a popup, so its transition stays (but not at mount) -->
        <ArkNavigationMenu.Viewport data-slot="navigation-menu-viewport" :class="r.viewport()" :style="{ transition: settled ? undefined : 'none' }" />
      </ArkNavigationMenu.ViewportPositioner>
    </Teleport>
  </ArkNavigationMenu.Root>
</template>
