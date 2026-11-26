import { Switch } from "@fndn/react";

/* no visible label in a row: the switch is named by `label` (its aria-label) */
const environments = [
  { name: "Production", protected: true },
  { name: "Staging", protected: true },
  { name: "Preview", protected: false },
];

export default function EnvironmentProtection() {
  return (
    <table className="w-80 text-sm">
      <thead>
        <tr className="text-start text-xs text-ink-2">
          <th className="pb-2 text-start font-medium">Environment</th>
          <th className="pb-2 text-end font-medium">Password</th>
        </tr>
      </thead>
      <tbody>
        {environments.map((env) => (
          <tr key={env.name}>
            <td className="py-1.5 text-ink">{env.name}</td>
            <td className="py-1.5 text-end">
              <Switch size="sm" label={`Password-protect ${env.name}`} defaultChecked={env.protected} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
