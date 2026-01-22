/**
 * Status checker - performs health checks on endpoints
 */

import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import type {
  Endpoint,
  CheckResult,
  ServiceStatus,
  StatusSnapshot,
  StatusHistory,
} from "./types.js";
import { ENDPOINTS } from "./types.js";

const SNAPSHOT_PATH = "../../data/status-snapshot.json";

/**
 * Perform a health check on an endpoint
 */
export async function checkEndpoint(endpoint: Endpoint): Promise<CheckResult> {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      endpoint.timeout || 10000
    );

    const response = await fetch(endpoint.url, {
      method: "GET",
      headers: {
        "User-Agent": "beeper-pulse/1.0 (status-checker)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseTime = Math.round(performance.now() - startTime);

    const expectedStatus = endpoint.expectedStatus || 200;
    const isOk = response.status === expectedStatus;

    return {
      endpoint,
      status: isOk ? "operational" : "degraded",
      responseTime,
      statusCode: response.status,
      timestamp: new Date(),
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage.includes("abort");

    return {
      endpoint,
      status: isTimeout ? "degraded" : "outage",
      responseTime,
      error: isTimeout ? "Timeout" : errorMessage,
      timestamp: new Date(),
    };
  }
}

/**
 * Check all endpoints
 */
export async function checkAllEndpoints(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const endpoint of ENDPOINTS) {
    console.log(`  Checking ${endpoint.name}...`);
    const result = await checkEndpoint(endpoint);
    results.push(result);

    const statusIcon =
      result.status === "operational"
        ? "✅"
        : result.status === "degraded"
          ? "⚠️"
          : "❌";
    console.log(
      `    ${statusIcon} ${result.status} (${result.responseTime}ms)`
    );
  }

  return results;
}

/**
 * Calculate overall status from individual checks
 */
export function calculateOverallStatus(results: CheckResult[]): ServiceStatus {
  const hasOutage = results.some((r) => r.status === "outage");
  const hasDegraded = results.some((r) => r.status === "degraded");

  if (hasOutage) return "outage";
  if (hasDegraded) return "degraded";
  return "operational";
}

/**
 * Load the previous status snapshot
 */
export async function loadStatusSnapshot(): Promise<StatusSnapshot> {
  const path = new URL(SNAPSHOT_PATH, import.meta.url).pathname;

  if (!existsSync(path)) {
    return {
      lastUpdated: new Date().toISOString(),
      overall: "unknown",
      services: {},
      history: {},
      incidents: [],
    };
  }

  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as StatusSnapshot;
}

/**
 * Update history with new check results
 */
function updateHistory(
  history: Record<string, StatusHistory>,
  results: CheckResult[]
): void {
  for (const result of results) {
    const id = result.endpoint.id;

    if (!history[id]) {
      history[id] = {
        endpoint: id,
        checks: [],
        uptime: { last24h: 100, last7d: 100, last30d: 100 },
      };
    }

    // Add new check
    history[id].checks.push({
      status: result.status,
      responseTime: result.responseTime,
      timestamp: result.timestamp.toISOString(),
    });

    // Keep only last 30 days of checks (assuming checks every 5 min = ~8640 checks)
    const maxChecks = 8640;
    if (history[id].checks.length > maxChecks) {
      history[id].checks = history[id].checks.slice(-maxChecks);
    }

    // Calculate uptime percentages
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const calculateUptime = (hours: number): number => {
      const since = now - hours * 60 * 60 * 1000;
      const relevantChecks = history[id].checks.filter(
        (c) => new Date(c.timestamp).getTime() >= since
      );
      if (relevantChecks.length === 0) return 100;
      const operational = relevantChecks.filter(
        (c) => c.status === "operational"
      ).length;
      return Math.round((operational / relevantChecks.length) * 100);
    };

    history[id].uptime = {
      last24h: calculateUptime(24),
      last7d: calculateUptime(24 * 7),
      last30d: calculateUptime(24 * 30),
    };
  }
}

/**
 * Save the status snapshot
 */
export async function saveStatusSnapshot(
  snapshot: StatusSnapshot
): Promise<void> {
  const path = new URL(SNAPSHOT_PATH, import.meta.url).pathname;
  snapshot.lastUpdated = new Date().toISOString();
  await writeFile(path, JSON.stringify(snapshot, null, 2));
}

/**
 * Run a full status check and update snapshot
 */
export async function runStatusCheck(): Promise<StatusSnapshot> {
  console.log("🔍 Running status checks...\n");

  // Load previous snapshot
  const snapshot = await loadStatusSnapshot();

  // Check all endpoints
  const results = await checkAllEndpoints();

  // Update snapshot
  snapshot.overall = calculateOverallStatus(results);
  for (const result of results) {
    snapshot.services[result.endpoint.id] = result;
  }

  // Update history
  updateHistory(snapshot.history, results);

  // Save snapshot
  await saveStatusSnapshot(snapshot);

  console.log(`\n📊 Overall status: ${snapshot.overall}`);
  console.log("💾 Snapshot saved\n");

  return snapshot;
}
