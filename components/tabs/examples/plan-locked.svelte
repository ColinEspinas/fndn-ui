<script lang="ts">
  import { Tabs, type TabsItem } from "@fndn/svelte";

  /* Analytics is on the Business plan: the tab stays in its place, disabled */
  const items: TabsItem[] = [
    { value: "usage", label: "Usage", content: "1.2 M requests and 38 GB of bandwidth this month." },
    { value: "analytics", label: "Analytics", content: "Visitors, pages and referrers.", disabled: true },
    { value: "invoices", label: "Invoices", content: "INV-2024-0117 · $1,240.00 · Paid Nov 1, 2026" },
  ];

  let value = $state("usage");
</script>

<Tabs bind:value class="w-80" {items} variant="underline" aria-label="Billing" />
