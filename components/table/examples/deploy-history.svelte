<script lang="ts">
  import { Avatar, Link, StatusPill, Table } from "@fndn/svelte";

  const columns = [
    { key: "id", label: "Deploy" },
    { key: "branch", label: "Branch" },
    { key: "status", label: "Status" },
    { key: "author", label: "Author" },
    { key: "duration", label: "Duration", numeric: true },
  ];

  const deploys = [
    { id: "dpl_7f3a9c", branch: "main", status: "Ready", tone: "green", author: "Maya Chen", color: "var(--fndn-tag-orange)", duration: "50s" },
    { id: "dpl_8b21e4", branch: "feat/usage-alerts", status: "Building", tone: "accent", author: "Daniel Okafor", color: "var(--fndn-tag-blue)", duration: "1m 12s" },
    { id: "dpl_3c90af", branch: "fix/tax-rounding-on-annual-invoices", status: "Failed", tone: "red", author: "Priya Raman", color: "var(--fndn-tag-purple)", duration: "48s" },
    { id: "dpl_2d77b1", branch: "main", status: "Canceled", tone: "neutral", author: "Jonas Weber", color: "var(--fndn-tag-green)", duration: "6s" },
  ] as const;
</script>

<!-- the data form with rich cells: the cell snippet renders the columns that need more than text -->
<Table aria-label="Deploys of web-app" {columns} rows={deploys}>
  {#snippet cell({ row, column, value })}
    {#if column.key === "id"}
      <Link href="/web-app/deploys/{row.id}" class="font-mono text-xs whitespace-nowrap">{row.id}</Link>
    {:else if column.key === "status"}
      <StatusPill tone={row.tone} size="sm">{row.status}</StatusPill>
    {:else if column.key === "author"}
      <span class="inline-flex items-center gap-2 whitespace-nowrap"><Avatar name={row.author} color={row.color} size="20" />{row.author}</span>
    {:else}
      {value}
    {/if}
  {/snippet}
</Table>
