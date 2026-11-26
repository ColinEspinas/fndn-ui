import { Link } from "@fndn/react";

export default function TermsHint() {
  return (
    <p className="max-w-80 text-xs text-ink-2">
      By creating the Northwind workspace you agree to the{" "}
      <Link tone="neutral" href="/legal/terms">Terms of service</Link> and the{" "}
      <Link tone="neutral" href="/legal/privacy">Privacy policy</Link>.
    </p>
  );
}
