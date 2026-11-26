<script lang="ts">
  import { EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/svelte";
</script>

<!-- a table with no rows: one cell across every column holds an empty state -->
<Table class="max-w-[440px]" aria-label="Deploys of data-pipeline">
  <TableHeader>
    <TableRow>
      <TableHead>Branch</TableHead>
      <TableHead>Status</TableHead>
      <TableHead numeric>Duration</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell colspan={3}>
        <EmptyState size="block" icon="folder-open" title="No deploys yet" hint="Push to main to create the first one." />
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
