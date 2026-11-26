<script lang="ts">
  import { StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/svelte";

  const invoices = [
    { id: "INV-2024-0123", amount: "$1,240.00", status: "Due", tone: "orange" },
    { id: "INV-2024-0117", amount: "$1,240.00", status: "Paid", tone: "green" },
    { id: "INV-2024-0109", amount: "$980.00", status: "Payment failed", tone: "red" },
  ] as const;
</script>

<!-- sm pills keep the rows of a dense table at their height -->
<Table aria-label="Invoices" class="w-[380px] max-w-full">
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead numeric>Amount</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each invoices as invoice (invoice.id)}
      <TableRow>
        <TableCell>{invoice.id}</TableCell>
        <TableCell numeric>{invoice.amount}</TableCell>
        <TableCell><StatusPill tone={invoice.tone} size="sm">{invoice.status}</StatusPill></TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
