import { Field, InputGroup } from "@fndn/react";

/* sm and subtle, as in a dense side panel; the addons keep the fixed parts of the URL out of the value */
export default function PreviewUrl() {
  return (
    <Field label="Preview URL" className="w-full max-w-72">
      <InputGroup size="sm" variant="subtle" mono start="https://" end=".example.dev" defaultValue="feat-usage-alerts" />
    </Field>
  );
}
