/* Theme switching. Dark mode is the `.dark` class (or data-theme="dark") on
 * <html>; `system` follows prefers-color-scheme. */
export type Theme = "light" | "dark" | "system";
const KEY = "fndn-theme";

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Apply a theme, freezing transitions for one frame so the swap is a single repaint. */
export function setTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  const resolved = resolveTheme(theme);
  root.setAttribute("data-fndn-theme-switching", "");
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-fndn-theme-switching")));
}

export function getTheme(): Theme {
  try { return (localStorage.getItem(KEY) as Theme) || "system"; } catch { return "system"; }
}

/** Inline this in <head> to avoid a flash: applies the stored theme before paint. */
export const themeBootScript =
  `(function(){try{var t=localStorage.getItem("${KEY}")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;
