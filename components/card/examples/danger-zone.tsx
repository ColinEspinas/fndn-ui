import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@fndn/react";

/* hairline: a section among the settings of a page, no shadow */
export default function DangerZone() {
  return (
    <Card elevation="hairline" className="w-96 max-w-full">
      <CardHeader>
        <div>
          <CardTitle>Delete project</CardTitle>
          <CardDescription>Removes billing-api, its 214 deploys and its two domains. This cannot be undone.</CardDescription>
        </div>
      </CardHeader>
      <CardFooter>
        <Button variant="danger" size="sm">Delete billing-api</Button>
      </CardFooter>
    </Card>
  );
}
