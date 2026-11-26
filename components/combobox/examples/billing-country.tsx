import { useState } from "react";
import { Combobox } from "@fndn/react";

const countries = ["Brazil", "Canada", "France", "Germany", "India", "Japan", "Netherlands", "United Kingdom", "United States"];
const vat = ["France", "Germany", "Netherlands"];

export default function BillingCountry() {
  const [country, setCountry] = useState<string | null>("Germany");
  return (
    <div className="flex flex-col gap-2" style={{ width: 260 }}>
      <Combobox items={countries} value={country} onValueChange={setCountry} label="Billing country" placeholder="Search countries" />
      <p className="m-0 text-sm text-ink-2">
        {country === null ? "Taxes are worked out from your country." : vat.includes(country) ? `VAT is added to invoices for ${country}.` : `No VAT is added for ${country}.`}
      </p>
    </div>
  );
}
