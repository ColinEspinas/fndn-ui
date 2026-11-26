<script setup lang="ts">
import { computed, ref } from "vue";
import { PhCaretLeft, PhCaretRight } from "@phosphor-icons/vue";
import { Button, ButtonGroup } from "@fndn/vue";

/* previous / next as one joined pair; the range beside it says where you are */
const TOTAL = 1284;
const PER_PAGE = 20;

const page = ref(1);
const last = Math.ceil(TOTAL / PER_PAGE) - 1;
const from = computed(() => page.value * PER_PAGE + 1);
const to = computed(() => Math.min(TOTAL, from.value + PER_PAGE - 1));
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-sm text-ink-2 tabular-nums">{{ from }}–{{ to }} of 1,284 members</span>
    <ButtonGroup label="Pages">
      <Button size="sm" square aria-label="Previous page" :disabled="page === 0" @click="page--">
        <template #icon><PhCaretLeft data-slot="icon" weight="bold" /></template>
      </Button>
      <Button size="sm" square aria-label="Next page" :disabled="page === last" @click="page++">
        <template #icon><PhCaretRight data-slot="icon" weight="bold" /></template>
      </Button>
    </ButtonGroup>
  </div>
</template>
