export type ThemeColorToken =
  | "bg"
  | "surface"
  | "border"
  | "text"
  | "mutedText";

export type HermesThemeTokens = {
  fontFamily?: string;
  baseFontSizePx?: number;
  radiusPx?: number;
  bg?: string;
  surface?: string;
  border?: string;
  text?: string;
  mutedText?: string;
};

export type HermesThemeSanitized = {
  fontFamily: string;
  baseFontSizePx: number;
  radiusPx: number;
  bg: string;
  surface: string;
  border: string;
  text: string;
  mutedText: string;
};

export type ThemeRejectionReason = {
  token: keyof HermesThemeTokens | "theme";
  reason: string;
  value?: string | number | null;
};
