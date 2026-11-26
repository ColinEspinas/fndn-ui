/* The assistant side panel (Cursor, Claude Code): a conversation of Messages (the question as the
 * person's bubble; the answer holds the agent blocks: tool chips for what the agent did, streaming
 * text for its answer) and the prompt bar to ask. A decision the agent waits for is an approval
 * card docked above the prompt bar, so it is always in sight; once decided it leaves, and the
 * next turn says what happened. Replies are canned and streamed word by word; nothing streams or
 * scrolls on first paint: the panel opens at the start of the conversation, and a turn added
 * later is brought in at its start, never scrolled to the bottom. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ApprovalCard, Message, PromptBar, ScrollArea, StreamingText, ToolChips, type StreamingToken, type ToolDiff, type ToolStep } from "@fndn/react";

/* live: the turn was added by this session (a reply to the person), so its blocks enter; the
 * conversation the panel opens with is history and is simply there */
type Turn = { id: number; prompt?: string; steps?: ToolStep[]; diffs?: ToolDiff[]; reply: StreamingToken[]; done: boolean; live?: boolean };

const words = (text: string): StreamingToken[] => text.split(" ").map((w) => ({ text: w }));

const FIRST: Turn = {
  id: 0,
  prompt: "The rate-limit test fails after the first minute. Why?",
  steps: [
    { icon: "read", label: "Read", chip: "rate-limit.ts", mono: true, detail: [{ text: "25 lines, one bucket per API key" }] },
    { icon: "run", label: "Run tests", chip: "pnpm test", mono: true, detailMono: true, detail: [{ text: "× refills the bucket after the window" }, { text: "1 failed | 10 passed" }] },
  ],
  reply: words("windowStart is set when a key makes its first call and never again, so the count never goes back to zero: after 120 calls that key is refused for good. Reset the count and the window once a minute has passed, before the call is counted."),
  done: true,
};

const MODELS = [
  { value: "standard", label: "Standard", meta: "Balanced" },
  { value: "deep", label: "Deep", meta: "Slower, more careful" },
];
const COMMANDS = [
  { value: "explain", description: "Explain the open file" },
  { value: "fix", description: "Fix the selected problem" },
  { value: "test", description: "Write tests for the open file" },
  { value: "review", description: "Review the uncommitted changes" },
];

function answer(prompt: string, file: string): string {
  const name = file.split("/").pop();
  if (/commit|message/i.test(prompt)) return "Reset the rate-limit window once it has passed. The change only touches rate-limit.ts; the invoices work can go in a commit of its own.";
  if (/test/i.test(prompt)) return `The suite has 11 tests in two files. ${name} is covered by rate-limit.test.ts, which checks the 429 on the 121st call and the refill after a minute.`;
  return `${name} is open. It is short and does one thing; ask me to explain a part of it, fix a problem from the panel below, or review what is uncommitted.`;
}

export function Assistant({ file, onApply, onOpenDiff }: { file: string; onApply: (runTests: boolean) => void; onOpenDiff: (path: string) => void }) {
  const [turns, setTurns] = useState<Turn[]>([FIRST]);
  const [target, setTarget] = useState<string[] | null>(null);
  /* the fix waits for a decision until it is approved or declined */
  const [asking, setAsking] = useState(true);
  const busy = target !== null;
  const scroller = useRef<HTMLDivElement>(null);

  /* stream the pending reply into the last turn, a word every 45ms */
  useEffect(() => {
    if (!target) return;
    const timer = window.setInterval(() => setTurns((all) => {
      const last = all.at(-1)!;
      const n = Math.min(last.reply.length + 1, target.length);
      return [...all.slice(0, -1), { ...last, reply: target.slice(0, n).map((text) => ({ text })), done: n === target.length }];
    }), 45);
    return () => clearInterval(timer);
  }, [target]);
  useEffect(() => { if (target && turns.at(-1)?.done) setTarget(null); }, [turns, target]);

  /* a turn added after first paint is brought in at its start (inside the panel only, never the
   * page); the first frame shows the conversation from the top */
  const count = useRef(turns.length);
  useLayoutEffect(() => {
    if (turns.length === count.current) return;
    count.current = turns.length;
    const view = scroller.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    const turn = scroller.current?.querySelector<HTMLElement>(`[data-turn="${turns.at(-1)!.id}"]`);
    if (view && turn) view.scrollTop = turn.getBoundingClientRect().top - view.getBoundingClientRect().top + view.scrollTop - 12;
  }, [turns]);

  const reply = (turn: Omit<Turn, "id" | "reply" | "done">, text: string) => {
    setTurns((all) => [...all, { ...turn, id: all.length, reply: [], done: false, live: true }]);
    setTarget(text.split(" "));
  };

  const apply = (runTests: boolean) => {
    onApply(runTests);
    reply(
      {
        steps: [
          { icon: "write", label: "Edit", chip: "rate-limit.ts", mono: true, detailMono: true, detail: [{ text: "+ if (now - bucket.windowStart >= WINDOW_MS) {", tone: "add" }, { text: "+   bucket.count = 0;", tone: "add" }] },
          ...(runTests ? [{ icon: "run", label: "Run tests", chip: "pnpm test", mono: true, detailMono: true, detail: [{ text: "✓ 11 passed" }] } satisfies ToolStep] : []),
        ],
        diffs: [{ file: "rate-limit.ts", add: 5, del: 0 }],
      },
      runTests
        ? "Done. The window now starts again once a minute has passed, and all 11 tests pass. The change is in Source control, ready to commit."
        : "Done. The window now starts again once a minute has passed. Run the tests from the command palette when you are ready.",
    );
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-surface" data-editor="assistant">
      <div className="flex h-8 shrink-0 items-center px-3 text-xs font-medium text-ink-2">Assistant</div>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4 p-3">
            {turns.map((t) => (
              <div key={t.id} data-turn={t.id} className="flex flex-col gap-3">
                {t.prompt && <Message role="user" text={t.prompt} actions={["copy"]} />}
                {/* the answer's actions are the streaming text's own (copy, retry, thumbs); no author
                  * line: the pane is titled Assistant already (Cursor's) */}
                <Message role="assistant" streaming={!t.done}>
                  {(t.steps || t.reply.length > 0) && <div className="flex flex-col gap-3">
                    {t.steps && (
                      <ToolChips
                        appear={t.live}
                        steps={t.steps}
                        diffs={t.diffs}
                        labels={{ header: `${t.steps.length} tool ${t.steps.length === 1 ? "call" : "calls"}` }}
                        onDiffClick={() => onOpenDiff("src/middleware/rate-limit.ts")}
                      />
                    )}
                    {t.reply.length > 0 && <StreamingText fill appear={t.live} content={t.reply} done={t.done} />}
                  </div>}
                </Message>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex shrink-0 flex-col gap-2 p-2">
        {asking && (
          <ApprovalCard
            resettable={false}
            action={{
              title: "Apply the fix to rate-limit.ts?",
              description: "+5 lines, then runs the tests.",
            }}
            labels={{ approve: "Apply", deny: "Not now" }}
            onDismiss={() => setAsking(false)}
            onDecision={(decision) => {
              setAsking(false);
              if (decision === "approve") apply(true);
              else reply({}, "Left rate-limit.ts as it is. Ask me again when you want the fix.");
            }}
          />
        )}
        <PromptBar
          aria-label="Ask the assistant"
          placeholder="Ask about this code…"
          defaultModel="standard"
          models={MODELS}
          commands={COMMANDS}
          busy={busy}
          onStop={() => { setTarget(null); setTurns((all) => [...all.slice(0, -1), { ...all.at(-1)!, done: true }]); }}
          onSubmit={({ value }) => reply({ prompt: value }, answer(value, file))}
        />
      </div>
    </div>
  );
}
