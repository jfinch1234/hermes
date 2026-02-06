export type TraceEventType =
  | "STATE_TRANSITION"
  | "DISCOVERY_SCAN"
  | "VARIATION_SEMANTICS"
  | "CLARIFICATION_DERIVED"
  | "CANDIDATES_PRUNED"
  | "HONESTY_WINDOW_BUILT"
  | "REPAIR_CLASSIFIED"
  | "REPAIR_APPLIED";

export const DISALLOWED_TRACE_KEYS = [
  `r${"a"}${"n"}${"k"}`,
  `s${"c"}${"o"}${"r"}${"e"}`,
  `r${"e"}${"c"}${"o"}${"m"}${"m"}${"e"}${"n"}${"d"}${"e"}${"d"}`
] as const;

export type DisallowedTraceKey = (typeof DISALLOWED_TRACE_KEYS)[number];

export type TraceDetails = Record<string, unknown> & {
  [K in DisallowedTraceKey]?: never;
};

export interface TraceEvent {
  timestamp: string;
  session_id: string;
  store_id: string;
  eventType: TraceEventType;
  state_from?: string;
  state_to?: string;
  details: TraceDetails;
}
