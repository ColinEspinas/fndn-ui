import { EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/react";

/* a table with no rows: one cell across every column holds the block */
export default function NoInvoices() {
  return (
    <Table className="max-w-[440px]" aria-label="Invoices">
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Date</TableHead>
          <TableHead numeric>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3}>
            <EmptyState size="block" icon="file" title="No invoices yet" hint="Your first invoice arrives on Dec 1, 2026." />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
