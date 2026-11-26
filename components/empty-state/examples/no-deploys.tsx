import { EmptyState } from "@fndn/react";

export default function NoDeploys() {
  return (
    <EmptyState
      size="block"
      icon="folder-open"
      title="No deploys yet"
      hint="Push to main to create the first one."
      className="w-full"
    />
  );
}
