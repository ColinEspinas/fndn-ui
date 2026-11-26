/* Islands whose content depends on a stored choice (framework, theme) are hydrated with a fixed-size
 * placeholder, the same markup the server rendered, and render their content in the layout effect
 * right after hydration: before the first paint of the island, from the stored values, so nothing
 * shows in another framework first. (client:only would do the same, but in development Astro's client
 * router then loads every next page twice, in a hidden frame, to collect its styles.) */
import { createElement, useLayoutEffect, useState, type ComponentType, type ReactNode } from "react";

export function gated<P extends object>(Real: ComponentType<P>, placeholder: (props: P) => ReactNode): ComponentType<P> {
  function Gated(props: P) {
    const [on, setOn] = useState(false);
    useLayoutEffect(() => setOn(true), []);
    return on ? createElement(Real, props) : <>{placeholder(props)}</>;
  }
  Gated.displayName = `Gated(${Real.displayName ?? Real.name})`;
  return Gated;
}
