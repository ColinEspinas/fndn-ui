<script lang="ts">
  import { ToolChips } from "@fndn/svelte";

  const steps = [
    {
      icon: "search",
      label: "Search logs",
      chip: "booking_conflict last 24h",
      detail: [{ text: "112 events, all from Juniper Health's Denver location" }],
    },
    {
      icon: "read",
      label: "Read file",
      chip: "src/booking/conflicts.ts",
      mono: true,
      detail: [{ text: "140 lines · exports findConflicts" }],
    },
    {
      icon: "write",
      label: "Edit 3 lines",
      chip: "src/booking/conflicts.ts",
      mono: true,
      detailMono: true,
      detail: [{ text: "+ if (a.roomId !== b.roomId) return false;", tone: "add" }],
    },
    {
      icon: "run",
      label: "Run tests",
      chip: "pnpm test conflicts",
      mono: true,
      detailMono: true,
      detail: [{ text: "✓ 31 passed" }],
    },
  ];

  const diffs = [
    {
      file: "conflicts.ts",
      add: 3,
      del: 0,
      lines: [
        { text: "export function overlaps(a: Booking, b: Booking) {", tone: "ctx" },
        { text: "  if (a.roomId !== b.roomId) return false;", tone: "add" },
      ],
    },
  ];

  let open = $state(false);
</script>

<ToolChips bind:open {steps} {diffs} />
