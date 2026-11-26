<script lang="ts">
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag } from "@fndn/svelte";

  const pulls = [
    { id: "#482", title: "Add retry to webhook delivery", labels: [{ name: "backend", tone: "blue" }, { name: "needs review", tone: "yellow" }] },
    { id: "#479", title: "Update pricing page copy", labels: [{ name: "docs", tone: "cyan" }] },
    { id: "#476", title: "Fix flaky upload test", labels: [{ name: "tests", tone: "purple" }] },
  ] as const;
</script>

<!-- sm tags in a dense table -->
<Table aria-label="Open pull requests" class="w-[440px] max-w-full">
  <TableHeader>
    <TableRow>
      <TableHead>Pull request</TableHead>
      <TableHead>Labels</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each pulls as pull (pull.id)}
      <TableRow>
        <TableCell>{pull.id} {pull.title}</TableCell>
        <TableCell>
          <div class="flex flex-wrap gap-1">
            {#each pull.labels as label (label.name)}
              <Tag tone={label.tone} size="sm">{label.name}</Tag>
            {/each}
          </div>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
