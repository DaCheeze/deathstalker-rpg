/** Narrows a value required by an established structural invariant. */
export function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}
