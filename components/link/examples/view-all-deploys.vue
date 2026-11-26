<script setup lang="ts">
import { PhArrowRight } from "@phosphor-icons/vue";
import { Link, StatusPill } from "@fndn/vue";

const DEPLOYS = [
  { id: "dpl_7f3a9c", branch: "main", status: "Failed", tone: "red" },
  { id: "dpl_6e21b4", branch: "feat/usage-alerts", status: "Ready", tone: "green" },
] as const;
</script>

<template>
  <section class="flex w-80 flex-col gap-2 text-sm">
    <ul class="flex flex-col divide-y divide-line">
      <li v-for="d in DEPLOYS" :key="d.id" class="flex items-center justify-between gap-3 py-2">
        <span class="min-w-0"><span class="font-mono text-xs text-ink">{{ d.id }}</span> <span class="text-ink-2">{{ d.branch }}</span></span>
        <StatusPill size="sm" :tone="d.tone">{{ d.status }}</StatusPill>
      </li>
    </ul>
    <Link variant="standalone" href="/web-app/deploys" class="self-start">
      View all deploys <PhArrowRight data-slot="icon" weight="bold" class="rtl:-scale-x-100" />
    </Link>
  </section>
</template>
