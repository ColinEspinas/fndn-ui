<script lang="ts">
  import { onMount } from "svelte";
  import { TaskRows } from "@fndn/svelte";

  const steps = [
    {
      key: "read",
      label: "Read the overnight tickets",
      amount: "86 tickets",
      details: [{ label: "Email", meta: "61" }, { label: "Chat transcripts", meta: "25" }],
    },
    {
      key: "tag",
      label: "Tag tickets by product area",
      amount: "86 tickets",
      details: [{ label: "Booking widget", meta: "34" }, { label: "Billing", meta: "19" }],
    },
    {
      key: "draft",
      label: "Draft replies to billing questions",
      amount: "19 drafts",
      details: [
        { label: "Refund requests", meta: "7" },
        { label: "Invoice address changes", meta: "12" },
      ],
    },
    {
      key: "escalate",
      label: "Escalate the calendar sync reports",
      amount: "5 tickets",
      details: [
        { label: "Assigned to Priya Raman", meta: "5" },
        { label: "Linked to incident INC-482", meta: "1" },
      ],
    },
  ];

  let stage = $state(0);
  onMount(() => {
    let timer = 0;
    const tick = () => {
      if (stage <= steps.length - 1) timer = window.setTimeout(() => { stage++; tick(); }, 1400);
    };
    tick();
    return () => clearTimeout(timer);
  });
  /* rows before `stage` are done, the one at `stage` is running, later ones have not started */
  const rows = $derived(
    steps
      .slice(0, stage + 1)
      .map((row, i) => (i < stage ? { ...row, status: "done" } : { ...row, status: "running", step: i + 1 })),
  );
</script>

<TaskRows {rows} />
