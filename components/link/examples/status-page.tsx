import { Link } from "@fndn/react";

export default function StatusPage() {
  return (
    <p className="max-w-80 text-sm text-ink-2">
      Deploys to Production are slower than usual. Follow the incident on our{" "}
      <Link href="https://status.northwind.example" external>status page</Link>.
    </p>
  );
}
