import { FileUpload } from "@fndn/react";

/* no label: the title names the drop zone; accept and maxFileSize reject the wrong file before it uploads */
export default function MembersCsv() {
  return (
    <FileUpload
      className="w-full max-w-80"
      title="Import members from a CSV"
      hint="Drop it here or click to choose · up to 2 MB"
      accept={["text/csv"]}
      maxFileSize={2_000_000}
    />
  );
}
