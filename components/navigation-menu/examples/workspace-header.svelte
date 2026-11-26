<script lang="ts">
  import { NavigationMenu, type NavigationMenuItem } from "@fndn/svelte";

  const items: NavigationMenuItem[] = [
    {
      value: "projects",
      label: "Projects",
      links: [
        { label: "web-app", href: "#web-app", description: "Customer dashboard, live on Production" },
        { label: "billing-api", href: "#billing-api", description: "Payments, invoices and webhooks" },
        { label: "mobile", href: "#mobile", description: "iOS and Android app" },
        { label: "docs-site", href: "#docs-site", description: "Public documentation" },
      ],
    },
    {
      value: "team",
      label: "Team",
      links: [
        { label: "Members", href: "#members", description: "7 people in Northwind" },
        { label: "Roles and permissions", href: "#roles" },
        { label: "Audit log", href: "#audit-log" },
      ],
    },
    { value: "billing", label: "Billing", href: "#billing" },
    { value: "docs", label: "Docs", href: "#docs" },
  ];
</script>

<NavigationMenu label="Northwind" {items} currentHref="#billing-api" />
