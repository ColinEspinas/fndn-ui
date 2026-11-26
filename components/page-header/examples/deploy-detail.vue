<script setup lang="ts">
import { PhArrowClockwise, PhArrowSquareOut } from "@phosphor-icons/vue";
import { Button, CodeBlock, PageHeader, StatusPill } from "@fndn/vue";

const log = [
  "Cloning northwind/web-app on main at a1b2c3d",
  "Restored the build cache of dpl_5e1d07",
  "Running \"pnpm install --frozen-lockfile\"",
  "Packages: +1,284 (412 reused)",
  "Running \"pnpm build\"",
  "✓ 214 modules transformed, dist/ is 1.8 MB",
  "Uploading the build output to fra1 and iad1",
  "Assigned app.northwind.example",
  "Deploy ready in 43s",
];

const goBack = () => history.back();
</script>

<!-- no href: the back link is a button and the app's router goes back; the description carries the
     deploy's state, so the screen says what it is before the log does -->
<template>
  <div class="flex w-[720px] max-w-full flex-col gap-6">
    <PageHeader :back="{ label: 'Deploys' }" @back="goBack">
      <template #title><span class="font-mono">dpl_7f3a9c</span></template>
      <template #description>
        <span class="inline-flex items-center gap-2">
          <StatusPill tone="green" size="sm">Ready</StatusPill>
          Production · a1b2c3d on main · 2 min ago
        </span>
      </template>
      <template #actions>
        <Button size="sm">
          <template #icon><PhArrowSquareOut data-slot="icon" weight="bold" /></template>
          Visit
        </Button>
        <Button size="sm">
          <template #icon><PhArrowClockwise data-slot="icon" weight="bold" /></template>
          Redeploy
        </Button>
      </template>
    </PageHeader>
    <CodeBlock class="max-w-none" variant="code" filename="Build log" :lines="log" :max-height="240" />
  </div>
</template>
