import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle, StatusPill } from "@fndn/react";

export default function ProductionDeploy() {
  return (
    <Card className="w-80 max-w-full">
      <CardHeader>
        <div>
          <CardTitle>web-app to Production</CardTitle>
          <CardDescription>dpl_7f3a9c · main · built in 48s</CardDescription>
        </div>
        <StatusPill tone="green" className="ms-auto">Ready</StatusPill>
      </CardHeader>
      <CardFooter>
        <Button variant="primary" size="sm">Visit</Button>
        <Button variant="ghost" size="sm">View logs</Button>
      </CardFooter>
    </Card>
  );
}
