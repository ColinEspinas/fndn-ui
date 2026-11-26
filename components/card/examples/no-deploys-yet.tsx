import { Button, Card, CardBody } from "@fndn/react";

/* inset: recessed into the page, for a placeholder that waits for content */
export default function NoDeploysYet() {
  return (
    <Card elevation="hairline" inset className="w-80 max-w-full">
      <CardBody className="flex flex-col items-center gap-3 py-6 text-center">
        <div>
          <p className="font-medium text-ink">No deploys yet</p>
          <p className="text-ink-2">docs-site has not been deployed. Push to main or deploy it now.</p>
        </div>
        <Button size="sm">Deploy now</Button>
      </CardBody>
    </Card>
  );
}
