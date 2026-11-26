import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag } from "@fndn/react";

const pulls = [
  { id: "#482", title: "Add retry to webhook delivery", labels: [{ name: "backend", tone: "blue" }, { name: "needs review", tone: "yellow" }] },
  { id: "#479", title: "Update pricing page copy", labels: [{ name: "docs", tone: "cyan" }] },
  { id: "#476", title: "Fix flaky upload test", labels: [{ name: "tests", tone: "purple" }] },
] as const;

/* sm tags in a dense table */
export default function PullRequestsTable() {
  return (
    <Table aria-label="Open pull requests" className="w-[440px] max-w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Pull request</TableHead>
          <TableHead>Labels</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pulls.map((pull) => (
          <TableRow key={pull.id}>
            <TableCell>{pull.id} {pull.title}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {pull.labels.map((label) => (
                  <Tag key={label.name} tone={label.tone} size="sm">{label.name}</Tag>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
