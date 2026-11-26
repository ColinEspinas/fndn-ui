import { InputGroup, Kbd } from "@fndn/react";
import { MagnifyingGlass } from "@phosphor-icons/react";

/* the top bar's search: the Kbd addon tells the shortcut that focuses it from anywhere */
export default function CommandSearch() {
  return (
    <InputGroup
      start={<MagnifyingGlass weight="bold" aria-hidden />}
      end={<Kbd keys={["⌘", "K"]} />}
      placeholder="Search or jump to…"
      aria-label="Search Northwind"
      aria-keyshortcuts="Meta+K"
      className="w-full max-w-72"
    />
  );
}
