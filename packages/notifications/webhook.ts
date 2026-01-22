/**
 * Generic webhook notifications
 */

import type { NotificationPayload, NotificationResult, NotificationConfig } from "./types.js";

interface WebhookBody {
  event: string;
  title: string;
  message: string;
  url?: string;
  type: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function sendWebhookNotification(
  payload: NotificationPayload,
  config: NotificationConfig["webhook"]
): Promise<NotificationResult> {
  if (!config?.url) {
    return {
      success: false,
      provider: "webhook",
      error: "Webhook URL not configured",
      timestamp: new Date(),
    };
  }

  const body: WebhookBody = {
    event: `beeper-pulse:${payload.type}`,
    title: payload.title,
    message: payload.message,
    url: payload.url,
    type: payload.type,
    timestamp: new Date().toISOString(),
    metadata: payload.metadata,
  };

  try {
    const response = await fetch(config.url, {
      method: config.method || "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "beeper-pulse/1.0",
        ...config.headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    return {
      success: true,
      provider: "webhook",
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      provider: "webhook",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    };
  }
}
