/* Framework-neutral logic of the agent screen, shared by the React, Vue and Svelte adapters. */

export type AgentScreenState = "loading" | "live" | "idle";
/** Cursor position on the screen, in percent of its width (x) and height (y). */
export type AgentScreenCursor = { x: number; y: number };
export type AgentScreenLabels = {
  loading: string; live: string; idle: string; recording: string; rec: string;
  /** Name and tooltip of the button that opens the screen larger (expandable). */
  expand: string;
};

export const AGENT_SCREEN_LABELS: AgentScreenLabels = {
  loading: "Connecting…",
  live: "Live",
  idle: "Idle",
  recording: "Recording",
  rec: "REC",
  expand: "Expand screen",
};
export const AGENT_SCREEN_CURSOR: AgentScreenCursor = { x: 42, y: 53 };

export const agentScreenLabels = (labels?: Partial<AgentScreenLabels>): AgentScreenLabels => ({ ...AGENT_SCREEN_LABELS, ...labels });

const pct = (n: number) => `${Math.round(Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0)) * 100) / 100}%`;

/** Value of --fndn-agent-screen-cursor on the cursor layer: "x%, y%", clamped to the screen. */
export const cursorValue = (cursor: AgentScreenCursor | undefined): string => {
  const c = cursor ?? AGENT_SCREEN_CURSOR;
  return `${pct(c.x)}, ${pct(c.y)}`;
};

/** What the role=status region says: "Agent's screen: Live, Recording". */
export function agentScreenStatus(label: string, state: AgentScreenState, recording: boolean, labels: AgentScreenLabels): string {
  const now = labels[state] ?? labels.live;
  return `${label}: ${now}${recording ? `, ${labels.recording}` : ""}`;
}
