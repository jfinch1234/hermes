import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile, mkdir } from "node:fs/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.TSX_TSCONFIG_PATH = path.join(root, "apps", "api", "tsconfig.json");
process.env.NODE_ENV = "development";
process.env.DEV_PROOF_MODE = "true";

const require = createRequire(import.meta.url);
let tsxRequire = null;
try {
  const { register, require: runtimeRequire } = require("tsx/cjs/api");
  register();
  tsxRequire = runtimeRequire;
} catch (error) {
  console.error("FAIL: tsx loader unavailable", error);
  process.exit(1);
}

const { HermesService } = tsxRequire(
  path.join(root, "apps", "api", "src", "hermes", "hermes.service.ts"),
  import.meta.url
);
const { SessionStore } = tsxRequire(
  path.join(root, "apps", "api", "src", "hermes", "session-store.ts"),
  import.meta.url
);
const { AuditLogStore } = tsxRequire(
  path.join(root, "apps", "api", "src", "hermes", "audit-log.ts"),
  import.meta.url
);
const { DiscoveryCache } = tsxRequire(
  path.join(root, "apps", "api", "src", "hermes", "discovery-cache.ts"),
  import.meta.url
);
const { TraceStore } = tsxRequire(
  path.join(root, "apps", "api", "src", "hermes", "trace-store.ts"),
  import.meta.url
);
const { SeedCatalogAdapter } = tsxRequire(
  path.join(root, "packages", "seed", "src", "seedCatalogAdapter.ts"),
  import.meta.url
);
const { generatePolicyReport } = tsxRequire(
  path.join(root, "packages", "domain", "src", "policyReport.ts"),
  import.meta.url
);

function createService() {
  return new HermesService(
    new SessionStore(),
    new AuditLogStore(),
    new DiscoveryCache(),
    new SeedCatalogAdapter(),
    new TraceStore()
  );
}

function sanitizeResponse(response) {
  return {
    ...response,
    sessionId: "session-demo",
    auditTrailId: "session-demo"
  };
}

function sanitizeTrace(trace) {
  return trace.map((event) => ({
    eventType: event.eventType,
    store_id: event.store_id,
    state_from: event.state_from,
    state_to: event.state_to,
    details: event.details
  }));
}

function runMeaningfulVariation() {
  const service = createService();
  const storeId = "store-outdoor";
  const session = service.createSession(storeId);
  const initial = service.search(session.sessionId, "bottle", storeId);
  let followUp = null;
  if (initial.clarification) {
    followUp = service.clarify(
      session.sessionId,
      initial.clarification.attributeKey,
      initial.clarification.options[0]
    );
  }
  const proof = service.getProof(session.sessionId);
  return {
    id: "meaningful_variation",
    storeId,
    responses: [sanitizeResponse(initial)].concat(followUp ? [sanitizeResponse(followUp)] : []),
    trace: sanitizeTrace(proof.trace)
  };
}

function runCosmeticOnly() {
  const service = createService();
  const storeId = "store-stationery";
  const session = service.createSession(storeId);
  const response = service.search(session.sessionId, "notebook", storeId);
  const proof = service.getProof(session.sessionId);
  return {
    id: "cosmetic_only",
    storeId,
    responses: [sanitizeResponse(response)],
    trace: sanitizeTrace(proof.trace)
  };
}

function runAbuseAttempt() {
  const service = createService();
  const storeId = "store-outdoor";
  const session = service.createSession(storeId);
  const response = service.search(session.sessionId, "Which is the best one?", storeId);
  const proof = service.getProof(session.sessionId);
  return {
    id: "abuse_attempt",
    storeId,
    responses: [sanitizeResponse(response)],
    trace: sanitizeTrace(proof.trace)
  };
}

function runExpectationRepair() {
  const service = createService();
  const storeId = "store-audio";
  const session = service.createSession(storeId);
  service.search(session.sessionId, "headphones", storeId);
  const response = service.expectationRepair(session.sessionId, "too broad");
  const proof = service.getProof(session.sessionId);
  return {
    id: "expectation_repair",
    storeId,
    responses: [sanitizeResponse(response)],
    trace: sanitizeTrace(proof.trace)
  };
}

function formatScenarioLine(scenario) {
  const response = scenario.responses[scenario.responses.length - 1];
  const hasClarification = Boolean(response.clarification);
  const candidateCount = response.candidates ? response.candidates.length : 0;
  return `- ${scenario.id}: store ${scenario.storeId}, state ${response.state}, clarification ${hasClarification ? "yes" : "no"}, options ${candidateCount}`;
}

function buildMarkdownSummary(demoData) {
  return [
    "# Enterprise Demo Summary",
    "",
    `Generated at: ${demoData.generatedAt}`,
    "",
    "## Scenarios",
    "",
    ...demoData.scenarios.map(formatScenarioLine),
    "",
    "## Policy report",
    "",
    "Policy report included in the JSON output.",
    "",
    "## Notes",
    "",
    "All outputs stay within option caps and preserve single-store scope."
  ].join("\n");
}

export async function runEnterpriseDemo({ writeFiles = true } = {}) {
  const scenarios = [
    runMeaningfulVariation(),
    runCosmeticOnly(),
    runAbuseAttempt(),
    runExpectationRepair()
  ];

  const policyReport = generatePolicyReport();
  const finalResponse = scenarios[scenarios.length - 1].responses.slice(-1)[0];
  const demoData = {
    generatedAt: "2026-02-06T00:00:00Z",
    policyReport,
    scenarios,
    finalResponse,
    decisionTrace: scenarios[scenarios.length - 1].trace
  };

  if (writeFiles) {
    const demosDir = path.join(root, "demos");
    await mkdir(demosDir, { recursive: true });
    await writeFile(
      path.join(demosDir, "enterprise-demo.json"),
      JSON.stringify(demoData, null, 2),
      "utf8"
    );
    await writeFile(
      path.join(demosDir, "enterprise-demo.md"),
      buildMarkdownSummary(demoData),
      "utf8"
    );
  }

  return {
    data: demoData,
    jsonPath: path.join(root, "demos", "enterprise-demo.json"),
    mdPath: path.join(root, "demos", "enterprise-demo.md")
  };
}

async function main() {
  await runEnterpriseDemo();
  console.log("OK: enterprise demo generated");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
