import type {
  HermesThemeTokens,
  HermesThemeSanitized,
  ThemeRejectionReason,
  ThemeColorToken
} from "@hermes/domain";

const DEFAULT_THEME: HermesThemeSanitized = {
  fontFamily: "system",
  baseFontSizePx: 14,
  radiusPx: 12,
  bg: "#ffffff",
  surface: "#f8f8f8",
  border: "#d8d8d8",
  text: "#1f1f1f",
  mutedText: "#5c5c5c"
};

const COLOR_TOKENS: ThemeColorToken[] = [
  "bg",
  "surface",
  "border",
  "text",
  "mutedText"
];

function clampNumber(
  value: number,
  min: number,
  max: number
): { value: number; clamped: boolean } {
  const clampedValue = Math.min(Math.max(value, min), max);
  return { value: clampedValue, clamped: clampedValue !== value };
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(value: string): { r: number; g: number; b: number } | null {
  if (!isValidHexColor(value)) {
    return null;
  }
  const r = Number.parseInt(value.slice(1, 3), 16);
  const g = Number.parseInt(value.slice(3, 5), 16);
  const b = Number.parseInt(value.slice(5, 7), 16);
  return { r, g, b };
}

function isNeutralColor(value: string): boolean {
  const rgb = hexToRgb(value);
  if (!rgb) {
    return false;
  }
  const maxChannel = Math.max(rgb.r, rgb.g, rgb.b);
  const minChannel = Math.min(rgb.r, rgb.g, rgb.b);
  return maxChannel - minChannel <= 30;
}

function isSafeFontName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (lower === "inherit" || lower === "system") {
    return true;
  }
  if (/;|url\(|\{|\}|<|>/.test(trimmed)) {
    return false;
  }
  const parts = trimmed.split(",");
  const safeName = /^"[^"]+"$|^'[^']+'$|^[a-zA-Z0-9\- ]+$/;
  return parts.every((part) => safeName.test(part.trim()));
}

export function sanitizeTheme(
  tokens: HermesThemeTokens | null | undefined
): { theme: HermesThemeSanitized; rejected: ThemeRejectionReason[] } {
  if (!tokens) {
    return { theme: { ...DEFAULT_THEME }, rejected: [] };
  }

  const rejected: ThemeRejectionReason[] = [];
  const theme: HermesThemeSanitized = { ...DEFAULT_THEME };

  if (tokens.fontFamily !== undefined) {
    if (typeof tokens.fontFamily === "string" && isSafeFontName(tokens.fontFamily)) {
      const lower = tokens.fontFamily.trim().toLowerCase();
      theme.fontFamily = lower === "system" || lower === "inherit"
        ? lower
        : tokens.fontFamily.trim();
    } else {
      rejected.push({
        token: "fontFamily",
        reason: "fontFamily rejected",
        value: tokens.fontFamily ?? null
      });
    }
  }

  if (tokens.baseFontSizePx !== undefined) {
    if (Number.isFinite(tokens.baseFontSizePx)) {
      const { value, clamped } = clampNumber(tokens.baseFontSizePx, 12, 18);
      theme.baseFontSizePx = value;
      if (clamped) {
        rejected.push({
          token: "baseFontSizePx",
          reason: "baseFontSizePx clamped",
          value: tokens.baseFontSizePx
        });
      }
    } else {
      rejected.push({
        token: "baseFontSizePx",
        reason: "baseFontSizePx invalid",
        value: tokens.baseFontSizePx ?? null
      });
    }
  }

  if (tokens.radiusPx !== undefined) {
    if (Number.isFinite(tokens.radiusPx)) {
      const { value, clamped } = clampNumber(tokens.radiusPx, 0, 16);
      theme.radiusPx = value;
      if (clamped) {
        rejected.push({
          token: "radiusPx",
          reason: "radiusPx clamped",
          value: tokens.radiusPx
        });
      }
    } else {
      rejected.push({
        token: "radiusPx",
        reason: "radiusPx invalid",
        value: tokens.radiusPx ?? null
      });
    }
  }

  COLOR_TOKENS.forEach((token) => {
    const value = tokens[token];
    if (value === undefined) {
      return;
    }
    if (typeof value !== "string" || !isValidHexColor(value)) {
      rejected.push({ token, reason: "color invalid", value: value ?? null });
      return;
    }
    if (!isNeutralColor(value)) {
      rejected.push({ token, reason: "color not neutral", value });
      return;
    }
    theme[token] = value.toLowerCase();
  });

  return { theme, rejected };
}
