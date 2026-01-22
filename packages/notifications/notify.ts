#!/usr/bin/env tsx
/**
 * CLI notification script
 * Reads status/release data and sends notifications to configured channels
 */

import { readFile } from "fs/promises";
import { sendMatrixNotificationFromEnv } from "./matrix.js";
import { sendDiscordNotificationFromEnv } from "./discord.js";
import { sendSlackNotificationFromEnv } from "./slack.js";
import type { NotificationPayload } from "./types.js";

const STATUS_SNAPSHOT = "../../data/status-snapshot.json";
const RELEASE_SNAPSHOT = "../../data/snapshot.json";

interface StatusSnapshot {
  lastUpdated: string;
  overall: string;
  services: Record<string, { status: string; endpoint: { name: string }; responseTime: number }>;
}

interface ReleaseSnapshot {
  lastUpdated: string;
  releases: Record<string, string>;
  npm: Record<string, string>;
}

async function loadJson<T>(path: string): Promise<T | null> {
  try {
    const fullPath = new URL(path, import.meta.url).pathname;
    const content = await readFile(fullPath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function sendNotification(payload: NotificationPayload): Promise<void> {
  const results = await Promise.all([
    // Matrix/Beeper (primary for Dev Community)
    process.env.MATRIX_ACCESS_TOKEN
      ? sendMatrixNotificationFromEnv(payload)
      : Promise.resolve({ success: false, provider: "matrix", error: "Not configured" }),
    // Discord (optional)
    process.env.DISCORD_WEBHOOK_URL
      ? sendDiscordNotificationFromEnv(payload)
      : Promise.resolve({ success: false, provider: "discord", error: "Not configured" }),
    // Slack (optional)
    process.env.SLACK_WEBHOOK_URL
      ? sendSlackNotificationFromEnv(payload)
      : Promise.resolve({ success: false, provider: "slack", error: "Not configured" }),
  ]);

  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.provider}: Notification sent`);
    } else if (result.error !== "Not configured") {
      console.error(`❌ ${result.provider}: ${result.error}`);
    }
  }
}

async function notifyStatusChange(): Promise<void> {
  const status = await loadJson<StatusSnapshot>(STATUS_SNAPSHOT);
  if (!status) {
    console.log("No status snapshot found");
    return;
  }

  const serviceList = Object.values(status.services)
    .map((s) => `• ${s.endpoint.name}: ${s.status} (${s.responseTime}ms)`)
    .join("\n");

  const payload: NotificationPayload = {
    type: "status",
    title: `Beeper Status: ${status.overall.toUpperCase()}`,
    description: `Status check completed at ${new Date(status.lastUpdated).toLocaleString()}`,
    status: status.overall as "operational" | "degraded" | "outage",
    url: "https://beeper-community.github.io/beeper-pulse",
    fields: Object.values(status.services).map((s) => ({
      name: s.endpoint.name,
      value: `${s.status} (${s.responseTime}ms)`,
    })),
  };

  await sendNotification(payload);
}

async function notifyNewReleases(previousSnapshot: ReleaseSnapshot | null): Promise<void> {
  const current = await loadJson<ReleaseSnapshot>(RELEASE_SNAPSHOT);
  if (!current) {
    console.log("No release snapshot found");
    return;
  }

  // Compare with previous to find new releases
  const newReleases: Array<{ name: string; version: string; type: string }> = [];

  for (const [repo, version] of Object.entries(current.releases)) {
    if (!previousSnapshot?.releases[repo] || previousSnapshot.releases[repo] !== version) {
      newReleases.push({ name: repo, version, type: "GitHub" });
    }
  }

  for (const [pkg, version] of Object.entries(current.npm || {})) {
    if (!previousSnapshot?.npm[pkg] || previousSnapshot.npm[pkg] !== version) {
      newReleases.push({ name: pkg, version: `v${version}`, type: "npm" });
    }
  }

  if (newReleases.length === 0) {
    console.log("No new releases to notify about");
    return;
  }

  for (const release of newReleases) {
    const payload: NotificationPayload = {
      type: "release",
      title: `🚀 New Release: ${release.name}`,
      description: `${release.type} package ${release.name} has been updated to ${release.version}`,
      url: release.type === "GitHub"
        ? `https://github.com/${release.name}/releases/tag/${release.version}`
        : `https://www.npmjs.com/package/${release.name}`,
      fields: [
        { name: "Package", value: release.name },
        { name: "Version", value: release.version },
        { name: "Source", value: release.type },
      ],
    };

    await sendNotification(payload);
  }
}

// Main
const command = process.argv[2];

switch (command) {
  case "status":
    await notifyStatusChange();
    break;
  case "releases":
    await notifyNewReleases(null);
    break;
  default:
    console.log("Usage: notify.ts <status|releases>");
    process.exit(1);
}
