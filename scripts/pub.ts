#!/usr/bin/env node
import { execSync } from "child_process";

const run = (command: string) => execSync(command, { encoding: "utf-8" }).trim();
const fail = (message: string): never => {
  console.error(`❌ ${message}`);
  process.exit(1);
};

const bump = process.argv[2] ?? "patch";
const semverRe = /^\d+\.\d+\.\d+$/;
if (!["patch", "minor", "major"].includes(bump) && !semverRe.test(bump))
  fail(`Invalid bump: ${bump}. Use patch, minor, major, or an explicit version like 1.2.3.`);

const branch = run("git rev-parse --abbrev-ref HEAD");
if (branch !== "main") fail(`Releases must be made from main (current: ${branch}).`);
if (run("git status --porcelain") !== "") fail("Working tree is not clean. Commit or stash your changes first.");

// Verify before touching anything, so a failing build never produces a release commit or tag.
execSync("bun run check", { stdio: "inherit" });
execSync("bun run build", { stdio: "inherit" });

const version = run(`npm version ${bump} --no-git-tag-version`);
console.log(`📦 Bumped to ${version}`);

execSync(`bun run scripts/changelog-release.ts`, { stdio: "inherit" });

execSync(`git add package.json CHANGELOG.md`);
execSync(`git commit -m "release ${version}"`);
execSync(`git tag ${version}`);
execSync(`git push && git push --tags`);
console.log(`🚀 Tagged and pushed ${version}`);
