import { Button, Spinner } from "@fndn/react";

export default function BusyButton() {
  return (
    <Button aria-disabled aria-busy icon={<Spinner decorative />}>
      Deploying to Production…
    </Button>
  );
}
