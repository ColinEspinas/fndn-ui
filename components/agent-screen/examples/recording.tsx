import { AgentScreen } from "@fndn/react";

export default function Recording() {
  return (
    <AgentScreen
      label="Reproducing HAR-482: double booking in Safari"
      cursor={{ x: 68, y: 30 }}
      recording
    />
  );
}
