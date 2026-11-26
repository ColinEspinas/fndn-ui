import { useEffect, useState } from "react";
import { Button, Progress } from "@fndn/react";

export default function UploadFile() {
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setValue((v) => Math.min(100, v + 7 + Math.round(Math.random() * 12))), 450);
    return () => clearInterval(timer);
  }, [running]);
  const done = value >= 100;
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Progress value={value} label={done ? "Uploaded data-pipeline-2026-11.csv" : "Uploading data-pipeline-2026-11.csv"} showValue tone={done ? "green" : "accent"} />
      <Button size="sm" className="self-start" onClick={() => { setValue(0); setRunning(true); }}>{done || !running ? "Start upload" : "Restart"}</Button>
    </div>
  );
}
