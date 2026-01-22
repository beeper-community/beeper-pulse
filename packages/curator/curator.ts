#!/usr/bin/env tsx
/**
 * Community Curator CLI
 *
 * Monitors the Beeper Dev Community chat for interesting content
 * and creates GitHub issues/PRs with the finds.
 *
 * Commands:
 *   fetch   - Fetch new messages from the community
 *   process - Extract interesting finds from fetched messages
 *   publish - Create GitHub issues/PRs with pending finds
 *   run     - Run full pipeline (fetch → process → publish)
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchMessagesFromEnv, fetchMessagesSinceLastRun } from "./lib/fetcher.js";
import { processMessages } from "./lib/extractor.js";
import { createIssueForFind, createPRWithFinds, getGitHubConfigFromEnv } from "./lib/github.js";
import type { CuratorState, CommunityFindsSnapshot, CommunityFind } from "./lib/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = join(__dirname, "..", "..");
const DATA_DIR = join(MONOREPO_ROOT, "data");
const STATE_FILE = join(DATA_DIR, "curator-state.json");
const FINDS_FILE = join(DATA_DIR, "community-finds.json");

/**
 * Load curator state
 */
async function loadState(): Promise<CuratorState> {
  try {
    const content = await readFile(STATE_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    // Default state - start from 24 hours ago
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return {
      lastProcessedTimestamp: yesterday.toISOString(),
      lastProcessedEventId: null,
      processedCount: 0,
      lastRun: new Date().toISOString(),
    };
  }
}

/**
 * Save curator state
 */
async function saveState(state: CuratorState): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Load community finds snapshot
 */
async function loadFinds(): Promise<CommunityFindsSnapshot> {
  try {
    const content = await readFile(FINDS_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {
      lastUpdated: new Date().toISOString(),
      finds: [],
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        published: 0,
        byType: {},
        byCategory: {},
      },
    };
  }
}

/**
 * Save community finds snapshot
 */
async function saveFinds(snapshot: CommunityFindsSnapshot): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  // Update stats
  snapshot.lastUpdated = new Date().toISOString();
  snapshot.stats = {
    total: snapshot.finds.length,
    pending: snapshot.finds.filter((f) => f.status === "pending").length,
    approved: snapshot.finds.filter((f) => f.status === "approved").length,
    published: snapshot.finds.filter((f) => f.status === "published").length,
    byType: {},
    byCategory: {},
  };

  for (const find of snapshot.finds) {
    snapshot.stats.byType[find.type] = (snapshot.stats.byType[find.type] || 0) + 1;
    if (find.category) {
      snapshot.stats.byCategory[find.category] = (snapshot.stats.byCategory[find.category] || 0) + 1;
    }
  }

  await writeFile(FINDS_FILE, JSON.stringify(snapshot, null, 2));
}

/**
 * Fetch command - get new messages from the community
 */
async function cmdFetch(): Promise<void> {
  console.log("📥 Fetching new messages from Beeper Dev Community...\n");

  const state = await loadState();
  console.log(`Last processed: ${state.lastProcessedTimestamp}`);

  const messages = await fetchMessagesFromEnv(state.lastProcessedTimestamp, 200);
  console.log(`Fetched ${messages.length} new messages\n`);

  if (messages.length === 0) {
    console.log("No new messages to process.");
    return;
  }

  // Process messages to find interesting content
  const finds = processMessages(messages);
  console.log(`Found ${finds.length} interesting items:\n`);

  for (const find of finds) {
    console.log(`  [${find.type}] ${find.title}`);
    if (find.url) console.log(`    └─ ${find.url}`);
  }

  // Add to existing finds
  const snapshot = await loadFinds();
  snapshot.finds.push(...finds);
  await saveFinds(snapshot);

  // Update state
  if (messages.length > 0) {
    const latestMessage = messages[messages.length - 1];
    state.lastProcessedTimestamp = new Date(latestMessage.timestamp).toISOString();
    state.lastProcessedEventId = latestMessage.eventId;
    state.processedCount += messages.length;
  }
  state.lastRun = new Date().toISOString();
  await saveState(state);

  console.log(`\n✅ Added ${finds.length} finds to snapshot`);
  console.log(`Total finds: ${snapshot.finds.length}`);
}

/**
 * Process command - extract and categorize finds (mainly for re-processing)
 */
async function cmdProcess(): Promise<void> {
  console.log("🔍 Processing community finds...\n");

  const snapshot = await loadFinds();
  const pending = snapshot.finds.filter((f) => f.status === "pending");

  console.log(`Total finds: ${snapshot.finds.length}`);
  console.log(`Pending review: ${pending.length}`);
  console.log(`\nPending finds:\n`);

  for (const find of pending) {
    console.log(`  [${find.type}] ${find.title}`);
    console.log(`    Category: ${find.category || "none"}`);
    console.log(`    Tags: ${find.tags.join(", ") || "none"}`);
    if (find.url) console.log(`    URL: ${find.url}`);
    console.log();
  }
}

/**
 * Publish command - create GitHub issues/PRs with finds
 */
async function cmdPublish(mode: "issues" | "pr" = "pr"): Promise<void> {
  console.log(`📤 Publishing community finds to GitHub (mode: ${mode})...\n`);

  const snapshot = await loadFinds();
  const pending = snapshot.finds.filter((f) => f.status === "pending");

  if (pending.length === 0) {
    console.log("No pending finds to publish.");
    return;
  }

  console.log(`Found ${pending.length} pending finds\n`);

  const config = getGitHubConfigFromEnv();

  if (mode === "issues") {
    // Create individual issues for each find
    for (const find of pending) {
      try {
        console.log(`Creating issue for: ${find.title}...`);
        const result = await createIssueForFind(find, config);
        find.status = "published";
        find.publishedAt = new Date().toISOString();
        find.githubUrl = result.url;
        console.log(`  ✅ Created: ${result.url}`);
      } catch (error) {
        console.error(`  ❌ Failed: ${error}`);
      }
    }
  } else {
    // Create a single PR with all finds
    try {
      console.log("Creating PR with all pending finds...");
      const result = await createPRWithFinds(pending, config);

      for (const find of pending) {
        find.status = "published";
        find.publishedAt = new Date().toISOString();
        find.githubUrl = result.url;
      }

      console.log(`\n✅ Created PR: ${result.url}`);
    } catch (error) {
      console.error(`❌ Failed to create PR: ${error}`);
    }
  }

  await saveFinds(snapshot);
}

/**
 * Run command - full pipeline
 */
async function cmdRun(): Promise<void> {
  console.log("🚀 Running full curator pipeline...\n");

  await cmdFetch();
  console.log("\n" + "─".repeat(50) + "\n");

  const snapshot = await loadFinds();
  const pending = snapshot.finds.filter((f) => f.status === "pending");

  if (pending.length > 0) {
    await cmdPublish("pr");
  } else {
    console.log("No new finds to publish.");
  }
}

/**
 * Stats command - show statistics
 */
async function cmdStats(): Promise<void> {
  const state = await loadState();
  const snapshot = await loadFinds();

  console.log("📊 Curator Statistics\n");
  console.log("State:");
  console.log(`  Last run: ${state.lastRun}`);
  console.log(`  Last processed: ${state.lastProcessedTimestamp}`);
  console.log(`  Total processed: ${state.processedCount} messages`);

  console.log("\nFinds:");
  console.log(`  Total: ${snapshot.stats.total}`);
  console.log(`  Pending: ${snapshot.stats.pending}`);
  console.log(`  Published: ${snapshot.stats.published}`);

  console.log("\nBy Type:");
  for (const [type, count] of Object.entries(snapshot.stats.byType)) {
    console.log(`  ${type}: ${count}`);
  }

  console.log("\nBy Category:");
  for (const [category, count] of Object.entries(snapshot.stats.byCategory)) {
    console.log(`  ${category}: ${count}`);
  }
}

// Main
const command = process.argv[2];

switch (command) {
  case "fetch":
    await cmdFetch();
    break;
  case "process":
    await cmdProcess();
    break;
  case "publish":
    const mode = process.argv[3] === "issues" ? "issues" : "pr";
    await cmdPublish(mode);
    break;
  case "run":
    await cmdRun();
    break;
  case "stats":
    await cmdStats();
    break;
  default:
    console.log(`
Beeper Pulse Community Curator

Usage: curator.ts <command>

Commands:
  fetch    Fetch new messages from the community chat
  process  Show pending finds and their categories
  publish  Create GitHub issues or PR with pending finds
           Options: publish [issues|pr] (default: pr)
  run      Run full pipeline (fetch → publish)
  stats    Show curator statistics

Environment Variables:
  MATRIX_HOMESERVER_URL  Matrix server URL
  MATRIX_ACCESS_TOKEN    Bot access token
  MATRIX_ROOM_ID         Community room ID
  GITHUB_TOKEN           GitHub token for creating issues/PRs
  CURATOR_GITHUB_OWNER   Target repo owner (default: beeper-community)
  CURATOR_GITHUB_REPO    Target repo name (default: awesome-beeper)
`);
    process.exit(1);
}
