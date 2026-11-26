/* Pager logic shared by the React, Vue and Svelte adapters (plain TypeScript, no DOM
 * framework). Pages are 0-based; the position reads 1-based ("2 of 3"). */
export type PagerAction = "prev" | "next" | "first" | "last";

/** What a key does while focus is inside the pager. Left and Right follow the reading direction;
 * a vertical pager also takes Up and Down. */
export function pagerKey(key: string, rtl: boolean, vertical = false): PagerAction | null {
  if (key === "Home") return "first";
  if (key === "End") return "last";
  if (key === "ArrowLeft") return rtl ? "next" : "prev";
  if (key === "ArrowRight") return rtl ? "prev" : "next";
  if (vertical && key === "ArrowUp") return "prev";
  if (vertical && key === "ArrowDown") return "next";
  return null;
}

/** The page an action lands on. Without `loop` it stops at the ends. */
export function pageAfter(action: PagerAction, page: number, count: number, loop = false): number {
  if (count <= 0) return 0;
  if (action === "first") return 0;
  if (action === "last") return count - 1;
  const to = page + (action === "next" ? 1 : -1);
  if (loop) return (to + count) % count;
  return Math.min(Math.max(to, 0), count - 1);
}

/** A page kept inside 0 … count - 1. */
export const clampPage = (page: number, count: number) => Math.min(Math.max(Math.round(page) || 0, 0), Math.max(count - 1, 0));

/** Whether the previous / next buttons do anything. */
export function pagerEnds(page: number, count: number, loop = false): { prev: boolean; next: boolean } {
  if (count <= 1) return { prev: false, next: false };
  return { prev: loop || page > 0, next: loop || page < count - 1 };
}

/** "2 of 3" (separator "of") or "2 / 3" (separator "/"); empty with no pages. */
export const pagerPosition = (page: number, count: number, separator = "of") => (count > 0 ? `${page + 1} ${separator} ${count}` : "");

/** What a screen reader hears: the unit, then the position with the spoken separator ("Question 2 of 3"),
 * whatever the visible separator is. */
export const pagerSpoken = (page: number, count: number, spoken = "of", unit = "") => {
  const text = pagerPosition(page, count, spoken);
  return unit && text ? `${unit} ${text}` : text;
};

/** The text after the rolling digits: " of 3". */
export const pagerTotal = (count: number, separator = "of") => (count > 0 ? ` ${separator} ${count}` : "");

/** The digits of the 1-based page, one reel each. */
export const pagerDigits = (page: number, count: number) => (count > 0 ? String(page + 1).split("") : []);

export const REEL = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
