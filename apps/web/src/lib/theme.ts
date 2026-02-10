import type {
  HermesThemeTokens,
  HermesThemeSanitized,
  ThemeRejectionReason
} from "@hermes/domain";
import { sanitizeTheme } from "@hermes/rules";

type SearchParamsLike = {
  get: (key: string) => string | null;
};

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    if (typeof atob === "function") {
      return atob(padded);
    }
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

function parseNumberParam(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function parseThemeFromSearchParams(
  searchParams: SearchParamsLike
): { theme: HermesThemeSanitized; rejected: ThemeRejectionReason[] } {
  const encoded = searchParams.get("theme");
  if (encoded) {
    const decoded = decodeBase64Url(encoded);
    if (!decoded) {
      return {
        theme: sanitizeTheme(null).theme,
        rejected: [
          {
            token: "theme",
            reason: "theme param decode failed",
            value: encoded
          }
        ]
      };
    }
    try {
      const parsed = JSON.parse(decoded) as HermesThemeTokens;
      return sanitizeTheme(parsed);
    } catch {
      return {
        theme: sanitizeTheme(null).theme,
        rejected: [
          {
            token: "theme",
            reason: "theme param parse failed",
            value: decoded
          }
        ]
      };
    }
  }

  const tokens: HermesThemeTokens = {
    bg: searchParams.get("bg") ?? undefined,
    surface: searchParams.get("surface") ?? undefined,
    border: searchParams.get("border") ?? undefined,
    text: searchParams.get("text") ?? undefined,
    mutedText: searchParams.get("mutedText") ?? undefined,
    fontFamily: searchParams.get("font") ?? undefined,
    baseFontSizePx: parseNumberParam(searchParams.get("baseFontSizePx")),
    radiusPx: parseNumberParam(searchParams.get("radiusPx"))
  };

  return sanitizeTheme(tokens);
}
