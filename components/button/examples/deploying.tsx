import { useEffect, useRef, useState } from "react";
import { RocketLaunch } from "@phosphor-icons/react";
import { Button } from "@fndn/react";

/* busy: the spinner takes the icon's place, the button keeps its width and its focus, and a second
 * press does nothing; the status beside it says what is running */
export default function Deploying() {
  const [busy, setBusy] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const deploy = () => {
    setBusy(true);
    timer.current = window.setTimeout(() => setBusy(false), 2500);
  };
  return (
    <div className="flex items-center gap-3">
      <Button variant="primary" busy={busy} onClick={deploy} icon={<RocketLaunch data-slot="icon" weight="bold" />}>
        Deploy to Production
      </Button>
      <span className="text-sm text-ink-2" role="status">{busy ? "Deploying a1b2c3d…" : ""}</span>
    </div>
  );
}
