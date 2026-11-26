<script lang="ts">
  import { StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/svelte";

  const deploys = [
    { id: "dpl_7f3a9c", branch: "main", status: "Ready", tone: "green", duration: "50s" },
    { id: "dpl_8b21e4", branch: "feat/usage-alerts", status: "Building", tone: "accent", duration: "1m 12s" },
    { id: "dpl_3c90af", branch: "fix/tax-rounding", status: "Failed", tone: "red", duration: "48s" },
  ] as const;
</script>

<Table aria-label="Recent deploys of web-app">
  <TableHeader>
    <TableRow>
      <TableHead>Branch</TableHead>
      <TableHead>Status</TableHead>
      <TableHead numeric>Duration</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each deploys as deploy (deploy.id)}
      <TableRow>
        <TableCell>{deploy.branch}</TableCell>
        <TableCell><StatusPill tone={deploy.tone} size="sm">{deploy.status}</StatusPill></TableCell>
        <TableCell numeric>{deploy.duration}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
