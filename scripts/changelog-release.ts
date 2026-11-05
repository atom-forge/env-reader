#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const version = pkg.version;
const date = new Date().toISOString().split("T")[0];

const changelogPath = "./CHANGELOG.md";
let content = readFileSync(changelogPath, "utf-8");

if (!content.includes("## [Unreleased]")) {
  console.error("❌ No [Unreleased] section found in CHANGELOG.md");
  process.exit(1);
}

content = content.replace(
  "## [Unreleased]",
  `## [Unreleased]\n\n---\n\n## [${version}] - ${date}`
);

const unreleasedLink = /^\[Unreleased\]: (.+)\/compare\/(v[^.\s]+\.[^.\s]+\.[^.\s]+)\.\.\.HEAD$/m;
const link = unreleasedLink.exec(content);
if (link) {
  const [line, repoUrl, previous] = link;
  content = content.replace(
    line,
    `[Unreleased]: ${repoUrl}/compare/v${version}...HEAD\n[${version}]: ${repoUrl}/compare/${previous}...v${version}`
  );
}

writeFileSync(changelogPath, content);
console.log(`✅ CHANGELOG.md updated: [Unreleased] → [${version}] - ${date}`);

