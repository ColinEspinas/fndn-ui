import { FileUpload } from "@fndn/react";

export default function BugScreenshots() {
  return (
    <FileUpload
      className="w-full max-w-sm"
      label="Screenshots"
      title="Drop screenshots here"
      hint="PNG or JPG, up to 4 files of 5 MB"
      accept={["image/png", "image/jpeg"]}
      maxFiles={4}
      maxFileSize={5_000_000}
    />
  );
}
