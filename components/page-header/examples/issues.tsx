import { Funnel, Plus } from "@phosphor-icons/react";
import { Avatar, Button, PageHeader, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/react";

const issues = [
  { id: "NW-482", title: "Add retry to webhook delivery", status: "In review", tone: "accent", assignee: "PR", color: "var(--fndn-tag-purple)", updated: "2 min ago" },
  { id: "NW-479", title: "Usage alerts fire twice for the same threshold", status: "In progress", tone: "orange", assignee: "DO", color: "var(--fndn-tag-blue)", updated: "1 h ago" },
  { id: "NW-471", title: "Invoice PDF cuts the tax line", status: "Todo", tone: "neutral", assignee: "AT", color: "var(--fndn-tag-green)", updated: "Nov 14" },
] as const;

/* the top of a screen: the way back to the project, the title and its state, the actions at the
 * far end of the content column, and the content they act on starting on the title's edge.
 * Narrow, the actions drop under the description and the table scrolls sideways */
export default function Issues() {
  return (
    <div className="flex w-[720px] max-w-full flex-col gap-6">
      <PageHeader
        title="Issues"
        description="42 open · 3 assigned to you"
        back={{ label: "billing-api", href: "/projects/billing-api" }}
        actions={
          <>
            <Button size="sm" icon={<Funnel data-slot="icon" weight="bold" />}>Filter</Button>
            <Button size="sm" variant="primary" icon={<Plus data-slot="icon" weight="bold" />}>New issue</Button>
          </>
        }
      />
      <Table aria-label="Open issues">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead className="min-w-48">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead numeric>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell className="whitespace-nowrap font-mono text-xs text-ink-2">{issue.id}</TableCell>
              <TableCell>{issue.title}</TableCell>
              <TableCell><StatusPill tone={issue.tone} size="sm">{issue.status}</StatusPill></TableCell>
              <TableCell><Avatar initials={issue.assignee} color={issue.color} size="20" /></TableCell>
              <TableCell numeric className="whitespace-nowrap text-ink-2">{issue.updated}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
