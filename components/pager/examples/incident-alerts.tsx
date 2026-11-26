import { useState } from "react";
import { Pager } from "@fndn/react";

const alerts = [
  "Error rate above 2% on billing-api",
  "p95 latency 1.8 s on web-app in Singapore",
  "data-pipeline job failed 3 times since 09:00",
  "Certificate for docs.northwind.example expires in 6 days",
];

/* alerts stacked on top of each other page up and down */
export default function IncidentAlerts() {
  const [page, setPage] = useState(0);
  return (
    <div className="flex w-80 items-center gap-3">
      <p className="m-0 flex-1 text-sm text-ink">{alerts[page]}</p>
      <Pager
        count={alerts.length}
        page={page}
        onPageChange={setPage}
        orientation="vertical"
        separator="/"
        unit="Alert"
        label="Open alerts"
        prevLabel="Previous alert"
        nextLabel="Next alert"
      />
    </div>
  );
}
