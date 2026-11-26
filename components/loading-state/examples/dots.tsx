import { LoadingState } from "@fndn/react";

export default function Dots() {
  return (
    <LoadingState
      variant="dots"
      label="Running the test suite"
      elapsed="1m 8.2s"
    />
  );
}
