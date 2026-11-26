import { useState } from "react";
import { NavigationMenu, type NavigationMenuItem } from "@fndn/react";

/* onLinkSelect hears every followed link: keep the current page in state and mark it */
export default function ClientRouter() {
  const [page, setPage] = useState("#deploys");
  const items: NavigationMenuItem[] = [
    { value: "overview", label: "Overview", href: "#overview", current: page === "#overview" },
    { value: "deploys", label: "Deploys", href: "#deploys", current: page === "#deploys" },
    {
      value: "observability",
      label: "Observability",
      links: [
        { label: "Logs", href: "#logs", current: page === "#logs" },
        { label: "Usage", href: "#usage", current: page === "#usage" },
      ],
    },
  ];
  return <NavigationMenu label="billing-api" items={items} onLinkSelect={setPage} />;
}
