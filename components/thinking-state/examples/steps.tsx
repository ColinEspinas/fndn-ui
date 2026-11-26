import { useEffect, useState, type ComponentProps } from "react";
import { ThinkingState } from "@fndn/react";

type Props = ComponentProps<typeof ThinkingState>;

const initial: Props = {
  variant: "steps",
  working: true,
  defaultExpanded: true,
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
const timeline: { after: number; props: Partial<Props> }[] = [
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

export default function Steps() {
  const [props, setProps] = useState(initial);
  useEffect(() => {
    let i = 0, timer = 0;
    const next = () => {
      const step = timeline[i++];
      if (step) timer = window.setTimeout(() => { setProps((p) => ({ ...p, ...step.props })); next(); }, step.after);
    };
    next();
    return () => clearTimeout(timer);
  }, []);
  return <ThinkingState {...props} />;
}
