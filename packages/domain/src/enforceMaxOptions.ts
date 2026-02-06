const MAX_OPTIONS = 3;

export function enforceMaxOptions<T>(items: T[], context: string): T[] {
  if (items.length > MAX_OPTIONS) {
    throw new Error(`Max options exceeded (${items.length}) in ${context}`);
  }
  return items.slice(0, MAX_OPTIONS);
}
