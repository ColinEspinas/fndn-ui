import { Breadcrumb } from "@fndn/react";

export default function DeployPage() {
  return (
    <Breadcrumb
      items={[
        { label: "Northwind", href: "/northwind" },
        { label: "web-app", href: "/northwind/web-app" },
        { label: "Deploys", href: "/northwind/web-app/deploys" },
        { label: "dpl_7f3a9c" },
      ]}
    />
  );
}
