<script lang="ts">
  import { RecordsTable } from "@fndn/svelte";

  const columns = [
    { key: "company", label: "Company" },
    { key: "segment", label: "Segment", type: "tags", tagTone: "neutral" },
    { key: "owner", label: "Account owner", width: 150 },
    { key: "active", label: "Last active", sortable: false, width: 140 },
    {
      key: "health",
      label: "Health",
      type: "status",
      width: 140,
      options: [
        { value: "at-risk", label: "At risk", tone: "red" },
        { value: "declining", label: "Declining", tone: "orange" },
        { value: "healthy", label: "Healthy", tone: "green" },
        { value: "onboarding", label: "Onboarding", tone: "neutral" },
      ],
    },
    { key: "mrr", label: "MRR (USD)", type: "number" },
    { key: "website", label: "Website", type: "link", width: 240 },
  ];

  const rows = [
    {
      id: "brightline",
      company: "Brightline Dental",
      segment: ["Dental", "Multi-location"],
      owner: "Priya Raman",
      active: "2 hours ago",
      health: "healthy",
      mrr: 4180,
      website: "brightline-dental.example.com",
    },
    {
      id: "kestrel",
      company: "Kestrel Logistics",
      segment: ["Logistics", "Mid-market"],
      owner: "Sofia Alvarez",
      active: "19 days ago",
      health: "at-risk",
      mrr: 12450,
      website: "kestrel-logistics.example.com",
    },
    {
      id: "juniper",
      company: "Juniper Health",
      segment: ["Healthcare", "Enterprise"],
      owner: "Priya Raman",
      active: "Yesterday",
      health: "healthy",
      mrr: 48250,
      website: "juniper-health.example.com",
    },
    {
      id: "saint-aldric",
      company: "Saint Aldric Pediatric Dental Group",
      segment: ["Dental", "Healthcare", "Multi-location"],
      owner: "Priya Raman",
      active: "2 months ago",
      health: "at-risk",
      mrr: 2875,
      website: "saint-aldric-pediatric-dental.example.com",
    },
    {
      id: "tidewater",
      company: "Tidewater Realty",
      segment: ["Real estate", "SMB"],
      owner: "Sofia Alvarez",
      active: "6 weeks ago",
      health: "declining",
      mrr: 1340,
      website: null,
    },
    {
      id: "marlow",
      company: "Marlow Legal Partners",
      segment: ["Legal", "Mid-market"],
      owner: "Sofia Alvarez",
      active: "11 days ago",
      health: "at-risk",
      mrr: 5600,
      website: "marlow-legal.example.com",
    },
    {
      id: "northgate",
      company: "Northgate Physio",
      segment: ["Healthcare", "SMB"],
      owner: "Priya Raman",
      active: "5 days ago",
      health: "healthy",
      mrr: 640,
      website: "northgate-physio.example.com",
    },
    {
      id: "cedar-pine",
      company: "Cedar & Pine Veterinary",
      segment: ["Veterinary"],
      owner: "Priya Raman",
      active: "4 weeks ago",
      health: "declining",
      mrr: 1120,
      website: "cedar-pine-vet.example.com",
    },
    {
      id: "orbit",
      company: "Orbit Studio",
      segment: ["Agency"],
      owner: "Sofia Alvarez",
      active: "3 days ago",
      health: "onboarding",
      mrr: 96,
      website: "orbit-studio.example.com",
    },
    {
      id: "lumen",
      company: "Lumen Fitness Studios",
      segment: ["Fitness", "Multi-location"],
      owner: "Sofia Alvarez",
      active: "Never",
      health: "onboarding",
      mrr: 0,
      website: null,
    },
  ];

  const rowActions = [
    { value: "open", label: "Open account" },
    { value: "email", label: "Email account owner" },
    { value: "invoices", label: "View invoices" },
    { type: "separator" },
    { value: "cancel", label: "Cancel subscription", tone: "danger" },
  ];

  let sort = $state({ key: "health", direction: "ascending" });

  let selected = $state(["kestrel", "saint-aldric", "marlow"]);
</script>

<RecordsTable
  columns={columns}
  rows={rows}
  rowActions={rowActions}
  bind:sort={sort}
  bind:selected={selected}
  style="width: 760px"
/>
