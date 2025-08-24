/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from "firebase-admin/firestore";

type Serialized<T> = T extends Timestamp | Date
  ? string
  : T extends null
  ? undefined
  : T extends (infer U)[]
  ? Serialized<U>[]
  : T extends object
  ? { [K in keyof T]: Serialized<T[K]> }
  : T;

/**
 * Type guard to detect Firestore-like timestamp objects.
 * @param value The value to be checked.
 * @returns True if it is a timestamp object.
 */
function isTimestamp(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate: unknown }).toDate === "function"
  );
}

/**
 * Type guard for simple objects that could look like a timestamp.
 * @param value The value to be checked.
 * @returns True if it is a simple timestamp object.
 */
function isPlainTimestampObject(
  value: unknown
): value is { seconds: number; nanoseconds?: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { seconds: unknown }).seconds === "number" &&
    typeof value !== "function"
  );
}

/**
 * Serializes data recursively, converting Firestore timestamps and date objects
 * to ISO 8601 strings and null values to undefined.
 * @template T The type of input data.
 * @param data The data to be serialized.
 * @returns The serialized data with correct types.
 */
export function serialize<T>(data: T): Serialized<T> {
  if (data === null) {
    return undefined as Serialized<T>;
  }
  if (data === undefined || typeof data !== "object") {
    return data as Serialized<T>;
  }

  if (data instanceof Date) {
    return data.toISOString() as Serialized<T>;
  }

  if (isTimestamp(data)) {
    return data.toDate().toISOString() as Serialized<T>;
  }

  if (isPlainTimestampObject(data) && Object.keys(data).length <= 2) {
    return new Timestamp((data as any).seconds, (data as any).nanoseconds || 0)
      .toDate()
      .toISOString() as Serialized<T>;
  }

  if (Array.isArray(data)) {
    return data.map(serialize) as Serialized<T>;
  }

  const serializedObject: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = (data as Record<string, unknown>)[key];
      const serializedValue = serialize(value);
      if (serializedValue !== undefined) {
        serializedObject[key] = serializedValue;
      }
    }
  }

  return serializedObject as Serialized<T>;
}
