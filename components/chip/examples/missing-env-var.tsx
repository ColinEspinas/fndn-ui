import { Chip } from "@fndn/react";

export default function MissingEnvVar() {
  return (
    <p className="max-w-[300px] text-md text-ink">
      The build of web-app stopped: <Chip>DATABASE_URL</Chip> is not set in Production. Add it in Settings, then run <Chip>pnpm build</Chip> again.
    </p>
  );
}
