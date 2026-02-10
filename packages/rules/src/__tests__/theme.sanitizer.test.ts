import { describe, expect, it } from "vitest";
import { sanitizeTheme } from "../themeSanitizer";

const DEFAULT_BG = "#ffffff";
const DEFAULT_FONT = "system";

describe("theme sanitizer", () => {
  it("rejects saturated colors", () => {
    const { theme, rejected } = sanitizeTheme({ bg: "#ff0000" });

    expect(theme.bg).toBe(DEFAULT_BG);
    expect(rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ token: "bg", reason: "color not neutral" })
      ])
    );
  });

  it("accepts neutral colors", () => {
    const { theme, rejected } = sanitizeTheme({ bg: "#f0f0f0" });

    expect(theme.bg).toBe("#f0f0f0");
    expect(rejected).toHaveLength(0);
  });

  it("clamps sizes", () => {
    const { theme, rejected } = sanitizeTheme({
      baseFontSizePx: 22,
      radiusPx: -4
    });

    expect(theme.baseFontSizePx).toBe(18);
    expect(theme.radiusPx).toBe(0);
    expect(rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ token: "baseFontSizePx" }),
        expect.objectContaining({ token: "radiusPx" })
      ])
    );
  });

  it("rejects suspicious fontFamily", () => {
    const { theme, rejected } = sanitizeTheme({
      fontFamily: "url(https://example.com/font.woff)"
    });

    expect(theme.fontFamily).toBe(DEFAULT_FONT);
    expect(rejected).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ token: "fontFamily" })
      ])
    );
  });
});
