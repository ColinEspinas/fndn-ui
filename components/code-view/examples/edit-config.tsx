import { useState } from "react";
import { CodeView } from "@fndn/react";

const initial = [
  "export default {",
  "  project: \"web-app\",",
  "  regions: [\"fra1\", \"iad1\"],",
  "  buildCommand: \"pnpm build\",",
  "};",
].join("\n");

export default function EditConfig() {
  const [code, setCode] = useState(initial);
  return <CodeView editable label="northwind.config.ts" value={code} onValueChange={setCode} />;
}
