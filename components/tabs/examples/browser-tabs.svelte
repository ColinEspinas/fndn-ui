<script lang="ts">
  import GitBranch from "phosphor-svelte/lib/GitBranchIcon";
  import Globe from "phosphor-svelte/lib/GlobeIcon";
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import Terminal from "phosphor-svelte/lib/TerminalIcon";
  import { Button, Tabs, Tooltip, type TabsItem } from "@fndn/svelte";

  const pages: TabsItem[] = [
    { value: "deploys", label: "Deploys · web-app", icon: Terminal, content: "dpl_7f3a9c is live on Production." },
    { value: "pr-482", label: "#482 Add retry to webhook delivery", icon: GitBranch, content: "2 approvals, checks passing." },
    { value: "status", label: "Status · Northwind", icon: Globe, content: "All systems operational." },
  ];

  let open = $state(pages);
  let active = $state("pr-482");
  let next = 1;
  function add() {
    const value = `new-${next++}`;
    open = [...open, { value, label: "New tab", icon: Globe, content: "A blank page." }];
    active = value;
  }
</script>

<!-- browser tabs: closable pill tabs, each with its page's icon. A title stops at 240px, cut with its
     full text in the title; a new tab opens its room and a closed one gives it back -->
<Tabs
  bind:value={active}
  class="w-full max-w-[560px]"
  size="sm"
  closable
  items={open}
  aria-label="Open tabs"
  onclose={(value) => (open = open.filter((tab) => tab.value !== value))}
>
  {#snippet panel({ item })}<p class="py-2.5 text-sm text-ink-2">{item.content}</p>{/snippet}
  {#snippet end()}
    <Tooltip content="New tab">
      {#snippet trigger(tipProps)}
        <Button {...tipProps()} variant="ghost" size="xs" square muted aria-label="New tab" onclick={add}>
          {#snippet icon()}<Plus data-slot="icon" weight="bold" />{/snippet}
        </Button>
      {/snippet}
    </Tooltip>
  {/snippet}
</Tabs>
