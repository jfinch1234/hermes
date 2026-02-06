export type RepairSignal = "MISMATCH";

export type RepairIntent =
  | "WRONG_CATEGORY"
  | "TOO_BROAD"
  | "TOO_NARROW"
  | "MISSED_CONSTRAINT"
  | "EXPECTED_DIFFERENT_TYPE"
  | "UNKNOWN";

const intentKeywords: Array<{ intent: RepairIntent; keywords: string[] }> = [
  {
    intent: "WRONG_CATEGORY",
    keywords: [
      "wrong category",
      "wrong type",
      "different category",
      "not this type",
      "not this kind",
      "wrong product"
    ]
  },
  {
    intent: "TOO_BROAD",
    keywords: ["too broad", "too many", "overwhelming", "too wide"]
  },
  {
    intent: "TOO_NARROW",
    keywords: ["too narrow", "too specific", "too few", "not enough"]
  },
  {
    intent: "MISSED_CONSTRAINT",
    keywords: [
      "must",
      "needs to",
      "compatible",
      "fits",
      "fit",
      "constraint",
      "size",
      "weight"
    ]
  },
  {
    intent: "EXPECTED_DIFFERENT_TYPE",
    keywords: [
      "expected",
      "looking for",
      "wanted",
      "meant",
      "instead"
    ]
  }
];

export function classifyMismatch(note?: string): RepairIntent {
  if (!note || !note.trim()) {
    return "UNKNOWN";
  }

  const normalized = note.toLowerCase();

  for (const entry of intentKeywords) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.intent;
    }
  }

  return "UNKNOWN";
}
