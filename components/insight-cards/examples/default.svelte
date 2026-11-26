<script lang="ts">
  import { InsightCards, type Insight } from "@fndn/svelte";

  const insights: Insight[] = [
    {
      id: "mix",
      title: "Revenue by plan",
      summary: [
        { entity: "Enterprise" },
        " brings in ",
        { value: "54.2%", tone: "orange" },
        " of revenue from only 11 accounts.",
      ],
      chart: {
        kind: "share",
        series: [
          { name: "Enterprise", tone: "orange", values: [54.2] },
          { name: "Team", tone: "accent", values: [32.1] },
          { name: "Starter", tone: "neutral", values: [13.7] },
        ],
      },
      action: "What if Orbit Studio does not renew?",
    },
    {
      id: "growth",
      title: "Plan growth",
      summary: [
        { entity: "Team plan" },
        " MRR grew ",
        { value: "+11.1%", tone: "green" },
        " in eight weeks to ",
        { value: "$112,400" },
        ", while Starter stayed flat.",
      ],
      chart: {
        kind: "line",
        format: "percent",
        series: [
          { name: "Team", tone: "accent", values: [0, 1.7, 2.9, 4.5, 5.6, 7, 8.8, 11.1] },
          {
            name: "Starter",
            tone: "neutral",
            values: [0, 0.7, 0.2, 1.2, 0.5, 1, 0.2, 0.7],
          },
        ],
      },
      action: "Which accounts drove the growth?",
    },
    {
      id: "refunds",
      title: "Refund spike",
      summary: [
        "Refunds on ",
        { value: "Nov 12" },
        " reached ",
        { value: "$4,180", tone: "red" },
        ", about six times the daily average.",
      ],
      chart: {
        kind: "bar",
        format: "money",
        threshold: 1500,
        series: [{ name: "Refunds", tone: "red", values: [620, 910, 740, 880, 1020, 4180, 960] }],
      },
      action: "Show the refunds from Nov 12",
    },
  ];
</script>

<InsightCards title="This week" {insights} style="width: 344px" />
