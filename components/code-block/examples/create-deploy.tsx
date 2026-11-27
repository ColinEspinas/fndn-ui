import { CodeBlock } from "@fndn/react";

const code = [
  "await northwind.deploys.create({",
  "  project: \"web-app\",",
  "  target: \"production\",",
  "});",
].join("\n");

export default function CreateDeploy() {
  return <CodeBlock variant="code" filename="scripts/deploy.ts" value={code} />;
}
