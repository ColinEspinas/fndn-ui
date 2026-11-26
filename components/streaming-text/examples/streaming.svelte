<script lang="ts">
  import { onMount } from "svelte";
  import { StreamingText } from "@fndn/svelte";

  const words = (sentence: string) => sentence.split(" ").map((text) => ({ text }));

  /* the whole answer; a token with `cite` is the chip of that source */
  const answer: { text: string; cite?: number }[] = [
    ...words("Kestrel Logistics booked 41% fewer appointments in October than in September."),
    { text: "", cite: 0 },
    ...words("Their admin turned off SMS reminders on October 3, and no-shows rose from 6% to 19% the same week."),
    { text: "", cite: 1 },
    ...words("Two open tickets ask how to turn the reminders back on."),
    { text: "", cite: 2 },
  ];

  const initial = {
    content: [],
    sources: [
      {
        name: "Booking analytics",
        domain: "analytics.harbor.dev",
        href: "https://analytics.harbor.dev/accounts/kestrel-logistics",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%232f6fec'/%3E%3Cpath d='M17 45V25h8v20h-8Zm11 0V16h8v29h-8Zm11 0V30h8v15h-8Z' fill='%23fff'/%3E%3C/svg%3E",
      },
      {
        name: "Workspace audit log",
        domain: "admin.harbor.dev",
        href: "https://admin.harbor.dev/workspaces/kestrel-logistics/audit-log",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23e56d24'/%3E%3Cpath d='M20 22h24M20 32h24M20 42h16' fill='none' stroke='%23fff' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E",
      },
      {
        name: "Tickets #8812, #8830",
        domain: "support.harbor.dev",
        href: "https://support.harbor.dev/tickets?account=kestrel-logistics",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%231f7a5f'/%3E%3Cpath d='M19 18h26a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H31l-9 7v-7h-3a5 5 0 0 1-5-5V23a5 5 0 0 1 5-5Z' fill='%23fff'/%3E%3C/svg%3E",
      },
    ],
    followUps: ["Turn SMS reminders back on for Kestrel", "Which other accounts turned reminders off"],
    done: false,
    sourcesLabel: "3 sources",
  };

  /* [pause in ms, tokens received so far]: the answer arrives a few words at a time */
  const arrivals: [number, number][] = [
    [600, 1], [72, 3], [64, 4], [86, 6], [70, 8], [78, 9], [61, 11], [240, 12],
    [180, 13], [90, 15], [73, 17], [62, 18], [84, 21], [71, 23], [66, 24], [88, 26], [69, 28], [75, 31], [240, 32],
    [180, 33], [82, 35], [64, 37], [77, 39], [70, 41], [86, 43], [240, 44],
  ];

  /* each step waits `after` ms, then merges its props over the current ones */
  const timeline: { after: number; props: Record<string, unknown> }[] = [
    ...arrivals.map(([after, count]) => ({ after, props: { content: answer.slice(0, count) } })),
    { after: 480, props: { done: true } },
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

<StreamingText {...props} />
