import { Chip } from "@fndn/react";

const fields = [
  { name: "deploy.id", about: "The deploy, like dpl_7f3a9c." },
  { name: "deploy.state", about: "One of ready, error or canceled." },
  { name: "created_at", about: "When the event happened, in UTC." },
];

export default function WebhookPayload() {
  return (
    <dl className="grid w-80 grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2 text-sm">
      {fields.map((field) => (
        <div key={field.name} className="contents">
          <dt><Chip>{field.name}</Chip></dt>
          <dd className="text-ink-2">{field.about}</dd>
        </div>
      ))}
    </dl>
  );
}
