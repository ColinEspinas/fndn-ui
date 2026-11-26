<script lang="ts">
  import { onMount } from "svelte";
  import { ThinkingState } from "@fndn/svelte";

  const initial = {
    variant: "steps",
    working: true,
    expanded: true,
    activeLabel: "Reviewing December renewals",
    doneLabel: "Reviewed 38 renewals",
    rows: [
      { primary: "Loading December renewals", secondary: "38 accounts" },
      { primary: "Comparing bookings with the last 90 days" },
      { primary: "Matching open support tickets", secondary: "112 tickets" },
      { primary: "Scoring churn risk per account" },
    ],
  };

  /* each step waits `after` ms, then merges its props over the current ones */
  const timeline: { after: number; props: Record<string, unknown> }[] = [
    {
      after: 1100,
      props: {
        rows: [
          { primary: "Loading December renewals", secondary: "38 accounts" },
          { primary: "Comparing bookings with the last 90 days" },
          { primary: "Matching open support tickets", secondary: "112 tickets" },
          { primary: "Scoring churn risk per account" },
          { primary: "Ranking by revenue at risk" },
        ],
      },
    },
    {
      after: 1200,
      props: {
        rows: [
          { primary: "Loading December renewals", secondary: "38 accounts" },
          { primary: "Comparing bookings with the last 90 days" },
          { primary: "Matching open support tickets", secondary: "112 tickets" },
          { primary: "Scoring churn risk per account" },
          { primary: "Ranking by revenue at risk" },
          { primary: "Writing the summary for Sofia Alvarez", secondary: "1 page" },
        ],
      },
    },
    { after: 1400, props: { working: false } },
  ];

  let props: Record<string, unknown> = $state.raw({ ...initial });
  onMount(() => {
    let i = 0, timer = 0;
    const next = () => {
      const step = timeline[i++];
      if (step) timer = window.setTimeout(() => { props = { ...props, ...step.props }; next(); }, step.after);
    };
    next();
    return () => clearTimeout(timer);
  });
</script>

<ThinkingState {...props} />
