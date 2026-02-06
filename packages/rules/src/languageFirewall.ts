import { findForbiddenLanguage } from "./forbidden";

export function assertNoForbiddenLanguage(texts: string[]): void {
  const violations = new Map<string, string[]>();

  for (const text of texts) {
    const matches = findForbiddenLanguage(text);
    if (matches.length > 0) {
      violations.set(text, matches);
    }
  }

  if (violations.size > 0) {
    const details = Array.from(violations.entries())
      .map(([text, matches]) => `"${text}" => ${matches.join(", ")}`)
      .join(" | ");
    throw new Error(`Forbidden language detected: ${details}`);
  }
}
