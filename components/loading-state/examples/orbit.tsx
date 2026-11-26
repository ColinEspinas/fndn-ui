import { LoadingState } from "@fndn/react";

export default function Orbit() {
  return (
    <LoadingState
      variant="orbit"
      label="Deploying harbor/web to production"
      elapsed="3m 41.0s"
    />
  );
}
