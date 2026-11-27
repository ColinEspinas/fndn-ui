<script setup lang="ts">
import { ref } from "vue";
import { PhLock, PhStar } from "@phosphor-icons/vue";
import { Button, Combobox, Toggle } from "@fndn/vue";

const pages = [
  { value: "https://status.northwind.example", label: "status.northwind.example", meta: "Status · Northwind" },
  { value: "https://app.northwind.example/web-app/deploys", label: "app.northwind.example/web-app/deploys", meta: "Deploys · web-app" },
  { value: "https://app.northwind.example/billing-api/pull/482", label: "app.northwind.example/billing-api/pull/482", meta: "#482 Add retry to webhook delivery" },
];

const address = ref<string | null>("https://app.northwind.example/web-app/deploys");
const bookmarked = ref(false);
</script>

<!-- a browser's address bar: the site-information button in `start` (a button: it sits 2px from the
     edge, as the star does at the end), the bookmark star in `end` (a muted ghost Toggle:
     the filled star and the pressed fill when bookmarked); no caret, the suggestions open as you type -->
<template>
  <Combobox
    v-model:value="address"
    :items="pages"
    aria-label="Address and search"
    placeholder="Search or enter address"
    variant="subtle"
    :caret="false"
    style="width: 360px"
  >
    <template #start>
      <Button variant="ghost" size="xs" square muted aria-label="View site information">
        <template #icon><PhLock data-slot="icon" weight="bold" /></template>
      </Button>
    </template>
    <template #end>
      <Toggle
        v-model:pressed="bookmarked"
        variant="ghost"
        size="xs"
        square
        muted
        :tooltip="bookmarked ? 'Edit bookmark' : 'Bookmark this tab'"
      >
        <template #icon><PhStar data-slot="icon" :weight="bookmarked ? 'fill' : 'bold'" /></template>
      </Toggle>
    </template>
  </Combobox>
</template>
