import { Accordion } from "@fndn/react";

const questions = [
  { value: "timeout", label: "Why did my build time out?", detail: "Builds stop after 45 minutes. Cache your dependencies, or move long jobs to data-pipeline." },
  { value: "preview", label: "How do preview deploys work?", detail: "Every pull request gets its own URL. It updates on each push and is removed when the branch merges." },
  { value: "rollback", label: "Can I roll back a deploy?", detail: "Yes. Open any earlier deploy of Production and choose Promote; the switch takes a few seconds." },
];

export default function DeployHelp() {
  return <Accordion items={questions} style={{ width: 320 }} />;
}
