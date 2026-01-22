#!/usr/bin/env tsx

import { readFile, writeFile } from "fs/promises";
import { fetchGitHubReleases, fetchNpmVersions } from "./lib/fetchers.js";
import {
  loadSnapshot,
  saveSnapshot,
  findNewReleases,
  findNewNpmVersions,
  updateSnapshotReleases,
  updateSnapshotNpm,
  hasChanges,
} from "./lib/diff.js";
import {
  generateReleaseEntry,
  generateNpmEntry,
} from "./lib/templates.js";
import { generateRssFeed } from "./lib/feeds.js";
import type { GitHubRelease, NpmVersion } from "./lib/types.js";

// Repositories to track
const REPOS_TO_TRACK = [
  { owner: "beeper", repo: "bridge-manager" },
  { owner: "beeper", repo: "desktop-api-js" },
];

// npm packages to track
const NPM_TO_TRACK = ["@beeper/desktop-api"];

async function main() {
  console.log("🔍 Fetching latest versions...\n");

  // Load previous snapshot
  const snapshot = await loadSnapshot();
  console.log(`📸 Loaded snapshot from ${snapshot.lastUpdated}\n`);

  // Fetch all releases
  const allReleases = new Map<string, GitHubRelease[]>();
  const newReleases = new Map<string, GitHubRelease[]>();

  for (const { owner, repo } of REPOS_TO_TRACK) {
    const repoKey = `${owner}/${repo}`;
    console.log(`  Fetching ${repoKey}...`);

    const releases = await fetchGitHubReleases(owner, repo);
    allReleases.set(repoKey, releases);

    const newOnes = findNewReleases(repoKey, releases, snapshot);
    newReleases.set(repoKey, newOnes);

    if (newOnes.length > 0) {
      console.log(`    ✨ ${newOnes.length} new release(s)`);
    } else {
      console.log(`    ✓ Up to date`);
    }
  }

  // Fetch npm versions
  const allNpmVersions = new Map<string, NpmVersion[]>();
  const newNpmVersions = new Map<string, NpmVersion[]>();

  for (const pkg of NPM_TO_TRACK) {
    console.log(`  Fetching ${pkg}...`);

    const versions = await fetchNpmVersions(pkg);
    allNpmVersions.set(pkg, versions);

    const newOnes = findNewNpmVersions(pkg, versions, snapshot);
    newNpmVersions.set(pkg, newOnes);

    if (newOnes.length > 0) {
      console.log(`    ✨ ${newOnes.length} new version(s)`);
    } else {
      console.log(`    ✓ Up to date`);
    }
  }

  console.log("");

  // Check if there are any changes
  if (!hasChanges(newReleases, newNpmVersions)) {
    console.log("✅ No new updates found. Exiting.");
    return;
  }

  console.log("📝 Generating updates...\n");

  // Update changelogs
  for (const [repoKey, releases] of newReleases) {
    if (releases.length === 0) continue;

    // Determine which changelog to update
    let changelogPath: string;
    if (repoKey.includes("desktop-api")) {
      changelogPath = "../docs/sdk/changelog.md";
    } else {
      changelogPath = "../docs/desktop-app/changelog.md";
    }

    const fullPath = new URL(changelogPath, import.meta.url).pathname;

    try {
      let content = await readFile(fullPath, "utf-8");

      // Find insertion point (after "## Latest Version" or "## Version History")
      const insertPoint = content.indexOf("## Version History");
      if (insertPoint === -1) {
        console.warn(`  ⚠️ Could not find insertion point in ${changelogPath}`);
        continue;
      }

      // Generate new entries
      let newContent = "";
      for (const release of releases.reverse()) {
        newContent += generateReleaseEntry(release);
      }

      // Insert new content
      const before = content.slice(0, insertPoint + "## Version History\n\n".length);
      const after = content.slice(insertPoint + "## Version History\n\n".length);
      content = before + newContent + after;

      await writeFile(fullPath, content);
      console.log(`  ✅ Updated ${changelogPath}`);

      // Update snapshot
      updateSnapshotReleases(snapshot, repoKey, allReleases.get(repoKey)!);
    } catch (error) {
      console.error(`  ❌ Failed to update ${changelogPath}:`, error);
    }
  }

  // Update npm changelogs
  for (const [pkg, versions] of newNpmVersions) {
    if (versions.length === 0) continue;

    const changelogPath = "../docs/sdk/changelog.md";
    const fullPath = new URL(changelogPath, import.meta.url).pathname;
    const npmUrl = `https://www.npmjs.com/package/${pkg}`;

    try {
      let content = await readFile(fullPath, "utf-8");

      const insertPoint = content.indexOf("## Version History");
      if (insertPoint === -1) {
        console.warn(`  ⚠️ Could not find insertion point in ${changelogPath}`);
        continue;
      }

      let newContent = "";
      for (const version of versions.reverse()) {
        newContent += generateNpmEntry(version, npmUrl);
      }

      const before = content.slice(0, insertPoint + "## Version History\n\n".length);
      const after = content.slice(insertPoint + "## Version History\n\n".length);
      content = before + newContent + after;

      await writeFile(fullPath, content);
      console.log(`  ✅ Updated ${changelogPath} with npm versions`);

      updateSnapshotNpm(snapshot, pkg, allNpmVersions.get(pkg)!);
    } catch (error) {
      console.error(`  ❌ Failed to update changelog:`, error);
    }
  }

  // Generate feeds
  await generateRssFeed(allReleases, allNpmVersions);

  // Save updated snapshot
  await saveSnapshot(snapshot);
  console.log("\n📸 Snapshot saved");

  console.log("\n✅ Updates complete!");
  console.log("   Review changes and create a PR.");
}

main().catch(console.error);
