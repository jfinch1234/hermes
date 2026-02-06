import type { HermesResponse } from "@hermes/domain";
import { assertNoForbiddenLanguage } from "@hermes/rules";

export function validateClientLanguage(response: HermesResponse): void {
  const texts: string[] = [response.statusText];

  if (response.clarification) {
    texts.push(response.clarification.question, ...response.clarification.options);
  }

  if (response.candidates) {
    for (const candidate of response.candidates) {
      texts.push(
        candidate.name,
        candidate.whatsDifferent,
        candidate.whyItMatters,
        candidate.whoItsBetterFor
      );
      if (candidate.differencesNote) {
        texts.push(candidate.differencesNote);
      }
      if (candidate.variationNote) {
        texts.push(candidate.variationNote);
      }
    }
  }

  assertNoForbiddenLanguage(texts);
}
