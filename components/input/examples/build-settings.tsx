import { Field, Input } from "@fndn/react";

/* subtle: the grey inset look for dense side panels, where an outline on every field is noise */
export default function BuildSettings() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-3">
      <Field label="Build command">
        <Input size="sm" variant="subtle" mono defaultValue="pnpm build" />
      </Field>
      <Field label="Output directory">
        <Input size="sm" variant="subtle" mono defaultValue="apps/web/dist" />
      </Field>
    </div>
  );
}
