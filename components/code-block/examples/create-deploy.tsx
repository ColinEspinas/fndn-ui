import type { ComponentProps } from "react";
import { CodeBlock } from "@fndn/react";

type Props = ComponentProps<typeof CodeBlock>;

const lines: Props["lines"] = [
  "await northwind.deploys.create({",
  "  project: \"web-app\",",
  "  target: \"production\",",
  "});",
];

export default function CreateDeploy() {
  return <CodeBlock variant="code" filename="scripts/deploy.ts" lines={lines} />;
}
