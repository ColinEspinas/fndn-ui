import { InputGroup } from "@fndn/react";
import { MagnifyingGlass } from "@phosphor-icons/react";

/* an icon addon is decoration: hidden from assistive technology, the input keeps its name */
export default function SearchProjects() {
  return (
    <InputGroup
      start={<MagnifyingGlass weight="bold" aria-hidden />}
      type="search"
      placeholder="Search projects"
      aria-label="Search projects"
      className="w-full max-w-80"
    />
  );
}
