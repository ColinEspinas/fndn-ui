import { useState } from "react";
import { FileUpload, type FileUploadFile } from "@fndn/react";

/* controlled: files already attached to the ticket are listed and can be removed */
export default function TicketAttachments() {
  const [files, setFiles] = useState<FileUploadFile[]>([
    { name: "INV-2024-0117.pdf", size: 182_000, type: "application/pdf" },
    { name: "deploy-log-dpl_7f3a9c-billing-api-production.txt", size: 48_200, type: "text/plain" },
  ]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <FileUpload label="Attachments" maxFiles={3} files={files} onFilesChange={setFiles} />
      <p className="m-0 text-xs text-ink-2">{files.length} of 3 files</p>
    </div>
  );
}
