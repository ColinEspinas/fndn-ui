import type { ComponentProps } from "react";
import { ThinkingState } from "@fndn/react";

type Props = ComponentProps<typeof ThinkingState>;

const rows: Props["rows"] = [
  {
    primary: "PgBouncer configuration",
    secondary: "pgbouncer.org",
    href: "https://www.pgbouncer.org/config.html",
  },
  {
    primary: "Number of database connections",
    secondary: "wiki.postgresql.org",
    href: "https://wiki.postgresql.org/wiki/Number_Of_Database_Connections",
  },
  {
    primary: "Connections and authentication",
    secondary: "postgresql.org",
    href: "https://www.postgresql.org/docs/current/runtime-config-connection.html",
  },
];

export default function Search() {
  return (
    <ThinkingState
      variant="search"
      defaultExpanded
      doneLabel="Searched the web"
      query="postgres too many connections with pgbouncer"
      more="+5 more"
      rows={rows}
    />
  );
}
