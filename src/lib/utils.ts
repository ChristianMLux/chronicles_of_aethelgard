import { ResourceKey } from "@/types";
import { Timestamp } from "firebase/firestore";

/**
 * A simple number formatter for German localization.
 */
export const numberFmt = new Intl.NumberFormat("de-DE");

export function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Checks whether sufficient resources are available for a specific action.
 */
export function canAfford(
  available: Partial<Record<ResourceKey, number>>,
  cost: Partial<Record<ResourceKey, number>>
): boolean {
  return (Object.keys(cost) as ResourceKey[]).every(
    (key) => (available[key] ?? 0) >= (cost[key] ?? 0)
  );
}

/**
 * Converts various time-related formats into milliseconds since epoch.
 * Handles Firestore Timestamps (from server or client), Date objects, and ISO strings.
 * @param timeValue The time value to convert.
 * @returns The timestamp in milliseconds.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTimestampInMs(timeValue: any): number {
  if (!timeValue) return Date.now();
  if (typeof timeValue.toDate === "function") {
    return timeValue.toDate().getTime();
  }
  if (typeof timeValue.seconds === "number") {
    return timeValue.seconds * 1000;
  }
  if (timeValue instanceof Date) {
    return timeValue.getTime();
  }
  if (typeof timeValue === "string") {
    const date = new Date(timeValue);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }
  console.warn("Could not parse time value:", timeValue);
  return Date.now();
}
