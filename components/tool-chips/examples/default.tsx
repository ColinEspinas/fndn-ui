import { ToolChips, type ToolDiff, type ToolStep } from "@fndn/react";

const steps: ToolStep[] = [
  {
    icon: "read",
    label: "Read file",
    chip: "src/booking/slots.ts",
    mono: true,
    detail: [{ text: "212 lines · exports buildSlots, mergeSlots" }],
  },
  {
    icon: "write",
    label: "Edit 6 lines",
    chip: "src/booking/slots.ts",
    mono: true,
    detailMono: true,
    detail: [
      { text: "- const end = addMinutes(start, service.length)" },
      {
        text: "+ const end = addMinutes(start, service.length, { tz: location.timeZone })",
        tone: "add",
      },
    ],
  },
  {
    icon: "run",
    label: "Run tests",
    chip: "pnpm test slots",
    mono: true,
    detailMono: true,
    detail: [{ text: "✓ slots.test.ts (19 tests) 1.4s" }, { text: "✓ 19 passed" }],
  },
];

const diffs: ToolDiff[] = [
  {
    file: "slots.ts",
    add: 4,
    del: 2,
    lines: [
      {
        text: "export function buildSlots(start: Date, service: Service) {",
        tone: "ctx",
      },
      { text: "  const end = addMinutes(start, service.length);", tone: "del" },
      { text: "  const end = addMinutes(start, service.length, {", tone: "add" },
      { text: "    tz: location.timeZone,", tone: "add" },
      { text: "  });", tone: "add" },
    ],
  },
  {
    file: "slots.test.ts",
    add: 18,
    del: 0,
    lines: [
      {
        text: 'it("keeps a 9:00 slot at 9:00 across the DST change", () => {',
        tone: "add",
      },
      {
        text: '  const slots = buildSlots(new Date("2026-03-29T09:00"), haircut);',
        tone: "add",
      },
      { text: '  expect(slots[0].start).toBe("09:00");', tone: "add" },
      { text: "});", tone: "add" },
    ],
  },
];

export default function Default() {
  return <ToolChips steps={steps} diffs={diffs} />;
}
