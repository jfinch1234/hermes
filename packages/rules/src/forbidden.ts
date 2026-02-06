import { forbiddenTerms } from "./fixtures/forbidden-terms";

const forbiddenWords = [...forbiddenTerms];

const forbiddenRegexes = forbiddenWords.map((phrase) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
});

export const forbiddenLanguage = [...forbiddenWords];

export function findForbiddenLanguage(text: string): string[] {
  const matches: string[] = [];
  for (let i = 0; i < forbiddenRegexes.length; i += 1) {
    if (forbiddenRegexes[i].test(text)) {
      matches.push(forbiddenWords[i]);
    }
  }
  return matches;
}
