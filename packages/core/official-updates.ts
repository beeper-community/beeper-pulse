#!/usr/bin/env tsx

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

  // Update snapshot with all releases (even if not "new")
  for (const [repoKey, releases] of allReleases) {
    updateSnapshotReleases(snapshot, repoKey, releases);
  }
  for (const [pkg, versions] of allNpmVersions) {
    updateSnapshotNpm(snapshot, pkg, versions);
  }

  // Generate feeds (always regenerate with latest data)
  console.log("📡 Generating feeds...");
  await generateRssFeed(allReleases, allNpmVersions);

  // Save updated snapshot
  await saveSnapshot(snapshot);
  console.log("📸 Snapshot saved");

  // Check if there were new releases for notification purposes
  if (hasChanges(newReleases, newNpmVersions)) {
    console.log("\n🔔 New updates found! Notifications will be sent.");
  } else {
    console.log("\n✅ No new updates. Feeds regenerated.");
  }
}

main().catch(console.error);
