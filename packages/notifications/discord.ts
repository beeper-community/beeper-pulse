/**
 * Discord webhook notifications
 */

import type { NotificationPayload, NotificationResult, NotificationConfig } from "./types.js";

const COLORS = {
  release: 0x5865f2, // Discord blurple
  digest: 0x57f287, // Green
  status: 0xfee75c, // Yellow
  alert: 0xed4245, // Red
};

interface DiscordEmbed {
  title: string;
  description: string;
  url?: string;
  color: number;
  timestamp: string;
  footer: {
    text: string;
  };
}

interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  embeds: DiscordEmbed[];
}

export async function sendDiscordNotification(
  payload: NotificationPayload,
  config: NotificationConfig["discord"]
): Promise<NotificationResult> {
  if (!config?.webhookUrl) {
    return {
      success: false,
      provider: "discord",
      error: "Discord webhook URL not configured",
      timestamp: new Date(),
    };
  }

  const embed: DiscordEmbed = {
    title: payload.title,
    description: payload.message,
    url: payload.url,
    color: COLORS[payload.type],
    timestamp: new Date().toISOString(),
    footer: {
      text: "beeper-pulse",
    },
  };

  const body: DiscordWebhookPayload = {
    username: config.username || "Beeper Pulse",
    avatar_url: config.avatarUrl,
    embeds: [embed],
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Discord returned ${response.status}`);
    }

    return {
      success: true,
      provider: "discord",
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      provider: "discord",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    };
  }
}

/**
 * Send notification using environment variables
 */
export async function sendDiscordNotificationFromEnv(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      success: false,
      provider: "discord",
      error: "DISCORD_WEBHOOK_URL not configured",
      timestamp: new Date(),
    };
  }

  return sendDiscordNotification(payload, { webhookUrl });
}
