<script lang="ts">
  import GitBranch from "phosphor-svelte/lib/GitBranchIcon";
  import Globe from "phosphor-svelte/lib/GlobeIcon";
  import Terminal from "phosphor-svelte/lib/TerminalIcon";
  import { Tabs, type TabsItem } from "@fndn/svelte";

  const pages: TabsItem[] = [
    { value: "deploys", label: "Deploys · web-app", icon: Terminal, content: "dpl_7f3a9c is live on Production." },
    { value: "pr-482", label: "#482 Add retry to webhook delivery", icon: GitBranch, content: "2 approvals, checks passing." },
    { value: "status", label: "Status · Northwind", icon: Globe, content: "All systems operational." },
  ];

  let open = $state(pages);
  let active = $state("pr-482");
</script>

<!-- browser tabs: attached, so the selected tab is the toolbar's surface and joins it; the others sit
     on the darker strip. Tabs share the strip (240px at most) and shrink before it scrolls -->
<div class="w-full max-w-[560px] overflow-hidden rounded-card bg-canvas shadow-card">
  <Tabs
    bind:value={active}
    variant="attached"
    size="sm"
    closable
    items={open}
    aria-label="Open tabs"
    onclose={(page) => (open = open.filter((tab) => tab.value !== page))}
  >
    {#snippet panel({ item })}<p class="px-3 py-2.5 text-sm text-ink-2">{item.content}</p>{/snippet}
  </Tabs>
</div>
