import { useEffect, useState } from "react";
import { ToolChips, type ToolDiff, type ToolStep } from "@fndn/react";

const steps: ToolStep[] = [
  {
    icon: "think",
    label: "Thinking",
    chip: "Finding where reminder emails get their time…",
    detail: [
      {
        text: "Reminders format the slot in UTC, so a 9:00 booking in Lisbon reads 8:00.",
      },
    ],
  },
  {
    icon: "search",
    label: "Search code",
    chip: "formatSlotTime",
    mono: true,
    detail: [
      { text: "3 matches in harbor/api" },
      { text: "src/mail/reminder.ts · src/mail/confirmation.ts · src/sms/reminder.ts" },
    ],
  },
  {
    icon: "read",
    label: "Read file",
    chip: "src/mail/reminder.ts",
    mono: true,
    detail: [{ text: "64 lines · renders the 24-hour reminder" }],
  },
  {
    icon: "write",
    label: "Edit 9 lines",
    chip: "src/mail/format.ts",
    mono: true,
    detailMono: true,
    detail: [
      { text: "+ export const formatSlotTime = (d: Date, tz: string) =>", tone: "add" },
      {
        text: '+   new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone: tz }).format(d)',
        tone: "add",
      },
    ],
  },
  {
    icon: "run",
    label: "Run tests",
    chip: "pnpm test mail",
    mono: true,
    detailMono: true,
    detail: [{ text: "✓ 27 passed" }],
  },
];

const diffs: ToolDiff[] = [
  {
    file: "format.ts",
    add: 9,
    del: 3,
    lines: [
      {
        text: "export const formatSlotTime = (d: Date) => d.toISOString().slice(11, 16);",
        tone: "del",
      },
      { text: "export const formatSlotTime = (d: Date, tz: string) =>", tone: "add" },
    ],
  },
  {
    file: "reminder.ts",
    add: 2,
    del: 2,
    lines: [
      { text: "  time: formatSlotTime(booking.start),", tone: "del" },
      {
        text: "  time: formatSlotTime(booking.start, booking.location.timeZone),",
        tone: "add",
      },
    ],
  },
];

export default function AgentWorking() {
  /* the agent reports a step about every second; the changed files come with the last one */
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= steps.length) return;
    const timer = window.setTimeout(() => setShown(shown + 1), 1100);
    return () => clearTimeout(timer);
  }, [shown]);
  const done = shown === steps.length;
  return <ToolChips steps={steps.slice(0, shown)} diffs={done ? diffs : []} />;
}
