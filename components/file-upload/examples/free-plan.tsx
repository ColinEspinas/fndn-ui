import { FileUpload } from "@fndn/react";

/* disabled: the hint says what unlocks it */
export default function FreePlan() {
  return (
    <FileUpload
      className="w-full max-w-80"
      label="Build artifacts"
      title="Uploads are off on Free"
      hint="Upgrade to Team to keep build artifacts"
      disabled
    />
  );
}
