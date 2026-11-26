import { Link } from "@fndn/react";

export default function DeployFailed() {
  return (
    <p className="max-w-80 text-sm text-ink-2">
      The build of <span className="font-mono text-xs">dpl_7f3a9c</span> failed at "Install dependencies".{" "}
      <Link href="/web-app/deploys/dpl_7f3a9c/logs">Read the deploy log</Link> or{" "}
      <Link href="/web-app/deploys/dpl_6e21b4">roll back to the last good deploy</Link>.
    </p>
  );
}
