import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["apps", "packages"].map((dir) => path.join(root, dir));
const allowedPathTokens = ["__tests__", "test", "tests", "fixtures"];
const excludedDirs = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo"
]);
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".md"]);
const forbiddenTerms = [
  "best",
  "recommended",
  "top",
  "deal",
  "cheapest",
  "winner",
  "rank",
  "ranked",
  "score",
  "great value",
  "we suggest",
  "our pick"
];

const termRegexes = forbiddenTerms.map((term) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { term, regex: new RegExp(`\\b${escaped}\\b`, "i") };
});

function isAllowedPath(filePath) {
  const lower = filePath.toLowerCase();
  return allowedPathTokens.some((token) => lower.includes(token));
}

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) {
        continue;
      }
      await walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function excerpt(text, index) {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + 40);
  return text.slice(start, end).replace(/\s+/g, " ");
}

async function scanFile(filePath, violations) {
  const extension = path.extname(filePath);
  if (!allowedExtensions.has(extension)) {
    return;
  }
  if (isAllowedPath(filePath)) {
    return;
  }
  const content = await readFile(filePath, "utf8");
  for (const { term, regex } of termRegexes) {
    const match = regex.exec(content);
    if (match) {
      violations.push({
        filePath,
        term,
        excerpt: excerpt(content, match.index)
      });
    }
  }
}

async function main() {
  const violations = [];

  for (const rootDir of scanRoots) {
    const info = await stat(rootDir).catch(() => null);
    if (!info) {
      continue;
    }
    const files = await walk(rootDir);
    for (const filePath of files) {
      await scanFile(filePath, violations);
    }
  }

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(
        `${violation.filePath}: ${violation.term}: ${violation.excerpt}`
      );
    }
    process.exit(1);
  }

  console.log("OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
