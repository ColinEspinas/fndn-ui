import { useState } from "react";
import { Button, Carousel } from "@fndn/react";

const steps = [
  "Connect the northwind/web-app repository",
  "Pick the branch that deploys to Production",
  "Add the environment variables from your .env file",
  "Deploy, and get a URL for every pull request",
];

export default function GettingStarted() {
  const [page, setPage] = useState(0);
  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-2">
      <Carousel label="Getting started" items={steps} page={page} onPageChange={setPage} />
      <Button size="sm" variant="ghost" disabled={page === steps.length - 1} onClick={() => setPage(steps.length - 1)}>Skip to deploy</Button>
    </div>
  );
}
