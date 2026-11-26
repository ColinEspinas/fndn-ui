/* The tracker's data: the Northwind workspace, its people and projects, the issues with their
 * activity, and the inbox. "Today" is fixed so the dates read the same on every visit. */

export const TODAY = "2026-11-18";

export type Person = { value: string; label: string; email: string; color: string };
export const PEOPLE: Person[] = [
  { value: "maya", label: "Maya Chen", email: "maya@northwind.example", color: "oklch(0.55 0.15 255)" },
  { value: "daniel", label: "Daniel Okafor", email: "daniel@northwind.example", color: "oklch(0.55 0.13 150)" },
  { value: "priya", label: "Priya Raman", email: "priya@northwind.example", color: "oklch(0.6 0.15 45)" },
  { value: "lucas", label: "Lucas Moreau", email: "lucas@northwind.example", color: "oklch(0.55 0.15 310)" },
  { value: "aiko", label: "Aiko Tanaka", email: "aiko@northwind.example", color: "oklch(0.58 0.14 200)" },
  { value: "sofia", label: "Sofia Alvarez", email: "sofia@northwind.example", color: "oklch(0.58 0.16 20)" },
  { value: "jonas", label: "Jonas Weber", email: "jonas@northwind.example", color: "oklch(0.5 0.03 260)" },
];
export const ME = PEOPLE[0]!;
export const personOf = (value: string | null) => PEOPLE.find((p) => p.value === value);

export type Project = { value: string; label: string; key: string };
export const PROJECTS: Project[] = [
  { value: "web-app", label: "web-app", key: "WEB" },
  { value: "billing-api", label: "billing-api", key: "BIL" },
  { value: "mobile", label: "mobile", key: "MOB" },
  { value: "docs-site", label: "docs-site", key: "DOC" },
  { value: "data-pipeline", label: "data-pipeline", key: "DAT" },
];

/** In the order a board would show them; `tone` is the StatusPill's. */
export const STATUSES = [
  { value: "backlog", label: "Backlog", tone: "neutral" },
  { value: "todo", label: "Todo", tone: "neutral" },
  { value: "progress", label: "In progress", tone: "blue" },
  { value: "review", label: "In review", tone: "orange" },
  { value: "done", label: "Done", tone: "green" },
] as const;
export type Status = (typeof STATUSES)[number]["value"];
export const statusOf = (value: Status) => STATUSES.find((s) => s.value === value)!;

export const PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "No priority" },
] as const;
export type Priority = (typeof PRIORITIES)[number]["value"];
export const priorityOf = (value: Priority) => PRIORITIES.find((p) => p.value === value)!;

/** Each label keeps one Tag hue everywhere. */
export const LABEL_TONES: Record<string, "red" | "blue" | "purple" | "green" | "orange" | "cyan" | "pink" | "yellow"> = {
  bug: "red", feature: "blue", performance: "orange", billing: "green", design: "purple", infra: "cyan", docs: "yellow", "good first issue": "pink",
};
export const toneOf = (label: string) => LABEL_TONES[label] ?? "neutral";

export type Activity = { id: string; who: string; when: string } & ({ kind: "event"; text: string } | { kind: "comment"; body: string });

export type Issue = {
  id: string;
  project: string;
  title: string;
  status: Status;
  priority: Priority;
  assignee: string | null;
  /** ISO date, or null. */
  due: string | null;
  labels: string[];
  description: string;
  activity: Activity[];
};

const created = (who: string, when: string): Activity => ({ id: `c-${when}-${who}`, who, when, kind: "event", text: "created the issue" });

export const ISSUES: Issue[] = [
  {
    id: "WEB-482", project: "web-app", title: "Add retry to webhook delivery", status: "review", priority: "high", assignee: "maya", due: "2026-11-20",
    labels: ["feature", "infra"],
    description: "Deliveries that time out are dropped today. Retry three times with exponential backoff (1 s, 4 s, 16 s), then mark the endpoint as failing and email the workspace owner.",
    activity: [
      created("daniel", "Nov 11"),
      { id: "a1", who: "daniel", when: "Nov 11", kind: "event", text: "set priority to High" },
      { id: "a2", who: "maya", when: "Nov 14", kind: "event", text: "moved this to In review" },
      { id: "a3", who: "priya", when: "Nov 15", kind: "comment", body: "Backoff looks right. Can we log each attempt in the delivery log so support can see why an event arrived late?" },
      { id: "a4", who: "maya", when: "Nov 15", kind: "comment", body: "Good call, added in a1b2c3d. Each attempt now shows its status code and duration." },
    ],
  },
  {
    id: "WEB-479", project: "web-app", title: "Usage alerts fire twice for one project", status: "progress", priority: "urgent", assignee: "lucas", due: "2026-11-17",
    labels: ["bug"],
    description: "Customers on the Team plan get two emails when a project crosses 80% of its quota. The alert job runs on both workers since the queue migration.",
    activity: [created("sofia", "Nov 16"), { id: "b1", who: "lucas", when: "Nov 17", kind: "event", text: "moved this to In progress" }],
  },
  {
    id: "WEB-476", project: "web-app", title: "Dark mode: chart tooltips are unreadable on the usage page", status: "todo", priority: "medium", assignee: "aiko", due: "2026-11-27",
    labels: ["bug", "design"],
    description: "Tooltip text uses the light-theme ink on the dark tooltip background.",
    activity: [created("aiko", "Nov 13")],
  },
  {
    id: "WEB-471", project: "web-app", title: "Invite teammates from the project page", status: "todo", priority: "medium", assignee: "priya", due: null,
    labels: ["feature"],
    description: "Owners ask for an invite button next to the member list instead of going through workspace settings.",
    activity: [created("maya", "Nov 9")],
  },
  {
    id: "WEB-468", project: "web-app", title: "Deploy logs page loads every line at once and freezes on long builds", status: "backlog", priority: "high", assignee: null, due: null,
    labels: ["performance"],
    description: "A 40,000-line build log blocks the main thread for several seconds. Stream it and virtualise the list.",
    activity: [created("jonas", "Nov 2")],
  },
  {
    id: "WEB-463", project: "web-app", title: "Keyboard shortcut to switch environments", status: "backlog", priority: "low", assignee: null, due: null,
    labels: ["feature", "good first issue"],
    description: "Alt+1/2/3 for Production, Staging and Preview on the deploys page.",
    activity: [created("lucas", "Oct 29")],
  },
  {
    id: "WEB-455", project: "web-app", title: "Session expires while a long form is open", status: "done", priority: "high", assignee: "daniel", due: "2026-11-12",
    labels: ["bug"],
    description: "Refresh the session in the background while the tab is visible.",
    activity: [created("sofia", "Oct 24"), { id: "c1", who: "daniel", when: "Nov 12", kind: "event", text: "moved this to Done" }],
  },
  {
    id: "BIL-212", project: "billing-api", title: "Invoice INV-2024-0117 shows the wrong VAT rate for Ireland", status: "progress", priority: "urgent", assignee: "maya", due: "2026-11-18",
    labels: ["bug", "billing"],
    description: "Irish customers were charged 21% instead of 23% after the tax table update.",
    activity: [created("sofia", "Nov 17"), { id: "d1", who: "maya", when: "Nov 17", kind: "event", text: "moved this to In progress" }],
  },
  {
    id: "BIL-209", project: "billing-api", title: "Prorate seat changes in the middle of a billing cycle", status: "todo", priority: "high", assignee: "daniel", due: "2026-12-01",
    labels: ["billing", "feature"],
    description: "Adding a seat on day 12 should charge 18/30 of the seat price, not the full month.",
    activity: [created("maya", "Nov 6")],
  },
  {
    id: "BIL-204", project: "billing-api", title: "Card declined emails go to the workspace owner only", status: "backlog", priority: "medium", assignee: null, due: null,
    labels: ["billing"],
    description: "Billing contacts set in settings never receive them.",
    activity: [created("priya", "Oct 30")],
  },
  {
    id: "MOB-88", project: "mobile", title: "Push notification opens the wrong project", status: "review", priority: "high", assignee: "aiko", due: "2026-11-21",
    labels: ["bug"],
    description: "Tapping a deploy notification for billing-api opens web-app when the app was in the background.",
    activity: [created("aiko", "Nov 12")],
  },
  {
    id: "MOB-85", project: "mobile", title: "Offline banner covers the tab bar on small phones", status: "todo", priority: "low", assignee: "jonas", due: null,
    labels: ["design"],
    description: "",
    activity: [created("jonas", "Nov 8")],
  },
  {
    id: "DOC-61", project: "docs-site", title: "Document preview deploys for pull requests", status: "progress", priority: "medium", assignee: "priya", due: "2026-11-25",
    labels: ["docs"],
    description: "Cover the GitHub check, the comment with the preview URL, and how to protect previews with a password.",
    activity: [created("priya", "Nov 10")],
  },
  {
    id: "DAT-140", project: "data-pipeline", title: "Nightly export to the warehouse skips rows with emoji in the name", status: "todo", priority: "high", assignee: "jonas", due: "2026-11-22",
    labels: ["bug", "infra"],
    description: "The CSV writer uses latin-1. Switch to UTF-8 and backfill the last 14 days.",
    activity: [created("daniel", "Nov 15")],
  },
];

export type Notification = { id: string; who: string; issue: string; text: string; when: string; read: boolean };
export const NOTIFICATIONS: Notification[] = [
  { id: "n1", who: "priya", issue: "WEB-482", text: "commented: Backoff looks right. Can we log each attempt…", when: "2 h ago", read: false },
  { id: "n2", who: "sofia", issue: "BIL-212", text: "assigned you", when: "Yesterday", read: false },
  { id: "n3", who: "lucas", issue: "WEB-479", text: "mentioned you: @maya the alert job runs on both workers", when: "Yesterday", read: true },
];

/** "Nov 20", for an ISO date. */
export const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
export const overdue = (issue: Issue) => !!issue.due && issue.status !== "done" && issue.due < TODAY;
