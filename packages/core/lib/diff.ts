import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import type { Snapshot, GitHubRelease, NpmVersion } from "./types.js";

const SNAPSHOT_PATH = "../data/snapshot.json";

/**
 * Load the previous snapshot
 */
export async function loadSnapshot(): Promise<Snapshot> {
  const path = new URL(SNAPSHOT_PATH, import.meta.url).pathname;

  if (!existsSync(path)) {
    return {
      lastUpdated: new Date().toISOString(),
      releases: {},
      npm: {},
    };
  }

  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as Snapshot;
}

/**
 * Save the current snapshot
 */
export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
  const path = new URL(SNAPSHOT_PATH, import.meta.url).pathname;
  snapshot.lastUpdated = new Date().toISOString();
  await writeFile(path, JSON.stringify(snapshot, null, 2));
}

/**
 * Find new releases since last snapshot
 */
export function findNewReleases(
  repo: string,
  releases: GitHubRelease[],
  snapshot: Snapshot
): GitHubRelease[] {
  const lastKnown = snapshot.releases[repo];

  if (!lastKnown) {
    // First time tracking - return latest only
    return releases.slice(0, 1);
  }

  // Find all releases newer than last known
  const newReleases: GitHubRelease[] = [];
  for (const release of releases) {
    if (release.tag_name === lastKnown) break;
    newReleases.push(release);
  }

  return newReleases;
}

/**
 * Find new npm versions since last snapshot
 */
export function findNewNpmVersions(
  packageName: string,
  versions: NpmVersion[],
  snapshot: Snapshot
): NpmVersion[] {
  const lastKnown = snapshot.npm[packageName];

  if (!lastKnown) {
    // First time tracking - return latest only
    return versions.slice(0, 1);
  }

  // Find all versions newer than last known
  const newVersions: NpmVersion[] = [];
  for (const version of versions) {
    if (version.version === lastKnown) break;
    newVersions.push(version);
  }

  return newVersions;
}

/**
 * Update snapshot with new releases
 */
export function updateSnapshotReleases(
  snapshot: Snapshot,
  repo: string,
  releases: GitHubRelease[]
): void {
  if (releases.length > 0) {
    snapshot.releases[repo] = releases[0].tag_name;
  }
}

/**
 * Update snapshot with new npm versions
 */
export function updateSnapshotNpm(
  snapshot: Snapshot,
  packageName: string,
  versions: NpmVersion[]
): void {
  if (versions.length > 0) {
    snapshot.npm[packageName] = versions[0].version;
  }
}

/**
 * Check if there are any changes
 */
export function hasChanges(
  newReleases: Map<string, GitHubRelease[]>,
  newNpmVersions: Map<string, NpmVersion[]>
): boolean {
  for (const releases of newReleases.values()) {
    if (releases.length > 0) return true;
  }
  for (const versions of newNpmVersions.values()) {
    if (versions.length > 0) return true;
  }
  return false;
}
