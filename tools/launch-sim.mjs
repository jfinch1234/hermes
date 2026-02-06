import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.TSX_TSCONFIG_PATH = path.join(root, "apps", "api", "tsconfig.json");

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

const hermesServicePath = path.join(
  root,
  "apps",
  "api",
  "src",
  "hermes",
  "hermes.service.ts"
);
const fixturesPath = path.join(
  root,
  "apps",
  "api",
  "src",
  "hermes",
  "fixtures",
  "abuse-vectors.ts"
);

const { HermesService } = tsxRequire(hermesServicePath, import.meta.url);
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
const { assertNoForbiddenLanguage } = tsxRequire(
  path.join(root, "packages", "rules", "src", "languageFirewall.ts"),
  import.meta.url
);
const { abuseVectors, repairLoopVectors } = tsxRequire(fixturesPath, import.meta.url);

function createService() {
  return new HermesService(
    new SessionStore(),
    new AuditLogStore(),
    new DiscoveryCache(),
    new SeedCatalogAdapter(),
    new TraceStore()
  );
}

function collectResponseTexts(response) {
  const texts = [response.statusText];
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
  return texts;
}

function validateResponse(response, storeId) {
  if (response.storeId !== storeId) {
    return "store_id mismatch";
  }
  if ((response.candidates?.length ?? 0) > 3) {
    return "candidate cap exceeded";
  }
  if ((response.clarification?.options.length ?? 0) > 3) {
    return "clarification options exceeded";
  }
  const hasClarification = Boolean(response.clarification);
  const hasCandidates = Boolean(response.candidates && response.candidates.length > 0);
  if (!hasClarification && !hasCandidates) {
    return "no safe redirect response";
  }
  try {
    assertNoForbiddenLanguage(collectResponseTexts(response));
  } catch (error) {
    return "forbidden language detected";
  }
  return null;
}

const failures = [];

for (const vector of abuseVectors) {
  const service = createService();
  const storeId = "store-outdoor";
  const session = service.createSession(storeId);
  const response = service.search(session.sessionId, vector.query, storeId);
  const error = validateResponse(response, storeId);
  if (error) {
    failures.push(`${vector.name}: ${error}`);
  }
}

for (const vector of repairLoopVectors) {
  const service = createService();
  const storeId = "store-outdoor";
  const session = service.createSession(storeId);
  service.search(session.sessionId, "bottle", storeId);
  service.expectationRepair(session.sessionId, vector.note);
  const response = service.search(session.sessionId, vector.query, storeId);
  const error = validateResponse(response, storeId);
  if (error) {
    failures.push(`${vector.name}: ${error}`);
  }
}

if (failures.length === 0) {
  console.log("PASS: launch simulation completed");
} else {
  console.log("FAIL: launch simulation completed with failures");
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  process.exitCode = 1;
}
