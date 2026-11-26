import { useState } from "react";
import { Button, Steps } from "@fndn/react";

const items = [{ title: "Upload CSV" }, { title: "Match columns" }, { title: "Invite" }];

/* your own buttons drive the step; the last one names what it does */
export default function ImportMembers() {
  const [step, setStep] = useState(0);
  const done = step === items.length;
  const last = step === items.length - 1;
  return (
    <div className="flex w-80 flex-col gap-4">
      <Steps linear step={step} onStepChange={setStep} items={items} />
      <div className="flex justify-end gap-2">
        <Button size="sm" disabled={step === 0 || done} onClick={() => setStep(step - 1)}>Back</Button>
        <Button size="sm" variant="primary" onClick={() => setStep(done ? 0 : step + 1)}>{done ? "Import more" : last ? "Invite 18 people" : "Next"}</Button>
      </div>
    </div>
  );
}
