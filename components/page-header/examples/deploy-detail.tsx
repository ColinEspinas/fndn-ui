import { ArrowClockwise, ArrowSquareOut } from "@phosphor-icons/react";
import { Button, CodeBlock, PageHeader, StatusPill } from "@fndn/react";

const log = [
  "Cloning northwind/web-app on main at a1b2c3d",
  "Restored the build cache of dpl_5e1d07",
  "Running \"pnpm install --frozen-lockfile\"",
  "Packages: +1,284 (412 reused)",
  "Running \"pnpm build\"",
  "✓ 214 modules transformed, dist/ is 1.8 MB",
  "Uploading the build output to fra1 and iad1",
  "Assigned app.northwind.example",
  "Deploy ready in 43s",
];

/* no href: the back link is a button and the app's router goes back; the description carries the
 * deploy's state, so the screen says what it is before the log does */
export default function DeployDetail() {
  return (
    <div className="flex w-[720px] max-w-full flex-col gap-6">
      <PageHeader
        title={<span className="font-mono">dpl_7f3a9c</span>}
        description={
          <span className="inline-flex items-center gap-2">
            <StatusPill tone="green" size="sm">Ready</StatusPill>
            Production · a1b2c3d on main · 2 min ago
          </span>
        }
        back={{ label: "Deploys" }}
        onBack={() => history.back()}
        actions={
          <>
            <Button size="sm" icon={<ArrowSquareOut data-slot="icon" weight="bold" />}>Visit</Button>
            <Button size="sm" icon={<ArrowClockwise data-slot="icon" weight="bold" />}>Redeploy</Button>
          </>
        }
      />
      <CodeBlock className="max-w-none" variant="code" filename="Build log" lines={log} maxHeight={240} />
    </div>
  );
}
