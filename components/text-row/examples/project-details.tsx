import { Card, CardBody, CardHeader, CardTitle, StatusPill, TextRow } from "@fndn/react";

export default function ProjectDetails() {
  return (
    <Card className="w-80 max-w-full">
      <CardHeader>
        <CardTitle>billing-api</CardTitle>
      </CardHeader>
      <CardBody>
        <TextRow label="Status" value={<StatusPill tone="green" size="sm">Healthy</StatusPill>} />
        <TextRow label="Region" value="Frankfurt" meta="eu-central-1" />
        <TextRow label="Runtime" value="Node 22" />
        <TextRow label="Created" value="Mar 3, 2026" />
      </CardBody>
    </Card>
  );
}
