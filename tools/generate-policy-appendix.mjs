import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile, mkdir } from "node:fs/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.TSX_TSCONFIG_PATH = path.join(root, "tsconfig.base.json");

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

const { generatePolicyReport } = tsxRequire(
  path.join(root, "packages", "domain", "src", "policyReport.ts"),
  import.meta.url
);

function formatGuarantee(key, value, enforcementPoints, invariantTests) {
  const enforcementText = enforcementPoints.join(", ");
  const testText = invariantTests.join(", ");
  return `- \`${key}\`: ${value}\\n  - Enforced in: ${enforcementText}\\n  - Verified by: ${testText}`;
}

async function main() {
  const report = generatePolicyReport();
  const guaranteeLines = Object.entries(report.policy).map(([key, value]) =>
    formatGuarantee(key, value, report.enforcementPoints, report.invariantTests)
  );

  const appendix = [
    "# Enterprise Policy Appendix",
    "",
    "Hermes enterprise policies are immutable and non-configurable.",
    "",
    "## Immutable guarantees",
    "",
    ...guaranteeLines,
    "",
    "## Policy enforcement footprint",
    "",
    ...report.enforcementPoints.map((entry) => `- ${entry}`),
    "",
    "## Invariant test references",
    "",
    ...report.invariantTests.map((entry) => `- ${entry}`),
    "",
    "## Non-configurable statement",
    "",
    "These policies are fixed and cannot be overridden by customer configuration."
  ].join("\n");

  const docsDir = path.join(root, "docs");
  await mkdir(docsDir, { recursive: true });
  await writeFile(
    path.join(docsDir, "ENTERPRISE_POLICY_APPENDIX.md"),
    appendix,
    "utf8"
  );

  console.log("OK: enterprise policy appendix generated");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
