import { EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/react";

/* a table with no rows: one cell across every column holds an empty state */
export default function NoDeploys() {
  return (
    <Table className="max-w-[440px]" aria-label="Deploys of data-pipeline">
      <TableHeader>
        <TableRow>
          <TableHead>Branch</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric>Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3}>
            <EmptyState size="block" icon="folder-open" title="No deploys yet" hint="Push to main to create the first one." />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
