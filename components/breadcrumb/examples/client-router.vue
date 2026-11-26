<script setup lang="ts">
import { computed, ref } from "vue";
import { Breadcrumb, Button } from "@fndn/vue";

const pages = [
  { label: "Northwind", href: "/northwind" },
  { label: "mobile", href: "/northwind/mobile" },
  { label: "Deploys", href: "/northwind/mobile/deploys" },
  { label: "dpl_2c81e4", href: "/northwind/mobile/deploys/dpl_2c81e4" },
];

/* @navigate takes over plain clicks (Cmd/Ctrl-click still opens a tab): hand them to your router */
const depth = ref(pages.length);
const trail = computed(() => pages.slice(0, depth.value).map((page, i) => (i === depth.value - 1 ? { label: page.label } : page)));
const child = computed(() => pages[depth.value]);
</script>

<template>
  <div class="flex w-80 flex-col items-start gap-3">
    <Breadcrumb
      :items="trail"
      @navigate="(href) => (depth = pages.findIndex((page) => page.href === href) + 1)"
    />
    <Button v-if="child" size="sm" @click="depth = depth + 1">Open {{ child.label }}</Button>
  </div>
</template>
