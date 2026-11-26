import { useState } from "react";
import { Menu, type MenuEntry } from "@fndn/react";

const environments = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "preview", label: "Preview" },
];

/* a pick is the whole job, so the menu closes on it (closeOnSelect) */
export default function EnvironmentPicker() {
  const [environment, setEnvironment] = useState("production");
  const items: MenuEntry[] = [
    { type: "radio-group", name: "environment", label: "Show logs from", value: environment, closeOnSelect: true, items: environments },
  ];
  const current = environments.find((e) => e.value === environment)?.label;
  return <Menu triggerLabel={current} items={items} onRadioChange={(_, value) => setEnvironment(value)} />;
}
