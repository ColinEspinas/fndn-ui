<script lang="ts">
  import ArrowClockwise from "phosphor-svelte/lib/ArrowClockwiseIcon";
  import ArrowSquareOut from "phosphor-svelte/lib/ArrowSquareOutIcon";
  import { Button, CodeBlock, PageHeader, StatusPill } from "@fndn/svelte";

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
</script>

<!-- no href: the back link is a button and the app's router goes back; the description carries the
     deploy's state, so the screen says what it is before the log does -->
{#snippet title()}<span class="font-mono">dpl_7f3a9c</span>{/snippet}
{#snippet description()}
  <span class="inline-flex items-center gap-2">
    <StatusPill tone="green" size="sm">Ready</StatusPill>
    Production · a1b2c3d on main · 2 min ago
  </span>
{/snippet}
<div class="flex w-[720px] max-w-full flex-col gap-6">
  <PageHeader {title} {description} back={{ label: "Deploys" }} onback={() => history.back()}>
    {#snippet actions()}
      <Button size="sm">
        {#snippet icon()}<ArrowSquareOut data-slot="icon" weight="bold" />{/snippet}
        Visit
      </Button>
      <Button size="sm">
        {#snippet icon()}<ArrowClockwise data-slot="icon" weight="bold" />{/snippet}
        Redeploy
      </Button>
    {/snippet}
  </PageHeader>
  <CodeBlock class="max-w-none" variant="code" filename="Build log" lines={log} maxHeight={240} />
</div>
