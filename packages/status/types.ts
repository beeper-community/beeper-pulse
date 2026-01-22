/**
 * Status monitoring types
 */

export type ServiceStatus = "operational" | "degraded" | "outage" | "unknown";

export interface Endpoint {
  id: string;
  name: string;
  url: string;
  type: "http" | "https" | "npm" | "github";
  expectedStatus?: number;
  timeout?: number;
  interval?: number;
}

export interface CheckResult {
  endpoint: Endpoint;
  status: ServiceStatus;
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
}

export interface StatusHistory {
  endpoint: string;
  checks: Array<{
    status: ServiceStatus;
    responseTime: number;
    timestamp: string;
  }>;
  uptime: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

export interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  affectedServices: string[];
  startedAt: string;
  resolvedAt?: string;
  updates: Array<{
    message: string;
    timestamp: string;
  }>;
}

export interface StatusSnapshot {
  lastUpdated: string;
  overall: ServiceStatus;
  services: Record<string, CheckResult>;
  history: Record<string, StatusHistory>;
  incidents: Incident[];
}

export const ENDPOINTS: Endpoint[] = [
  {
    id: "beeper-website",
    name: "Beeper Website",
    url: "https://beeper.com",
    type: "https",
    expectedStatus: 200,
    timeout: 10000,
  },
  {
    id: "beeper-help",
    name: "Beeper Help Center",
    url: "https://help.beeper.com",
    type: "https",
    expectedStatus: 200,
    timeout: 10000,
  },
  {
    id: "npm-sdk",
    name: "SDK (npm)",
    url: "https://registry.npmjs.org/@beeper/desktop-api",
    type: "npm",
    expectedStatus: 200,
    timeout: 10000,
  },
  {
    id: "github-desktop-api",
    name: "desktop-api-js (GitHub)",
    url: "https://api.github.com/repos/beeper/desktop-api-js",
    type: "github",
    expectedStatus: 200,
    timeout: 10000,
  },
  {
    id: "github-bridge-manager",
    name: "bridge-manager (GitHub)",
    url: "https://api.github.com/repos/beeper/bridge-manager",
    type: "github",
    expectedStatus: 200,
    timeout: 10000,
  },
];
