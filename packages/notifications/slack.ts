/**
 * Slack webhook notifications
 */

import type { NotificationPayload, NotificationResult, NotificationConfig } from "./types.js";

const EMOJIS = {
  release: ":rocket:",
  digest: ":newspaper:",
  status: ":warning:",
  alert: ":rotating_light:",
};

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  accessory?: {
    type: string;
    text: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    url: string;
  };
}

interface SlackWebhookPayload {
  channel?: string;
  username?: string;
  icon_emoji?: string;
  blocks: SlackBlock[];
}

export async function sendSlackNotification(
  payload: NotificationPayload,
  config: NotificationConfig["slack"]
): Promise<NotificationResult> {
  if (!config?.webhookUrl) {
    return {
      success: false,
      provider: "slack",
      error: "Slack webhook URL not configured",
      timestamp: new Date(),
    };
  }

  const emoji = EMOJIS[payload.type];
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${payload.title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: payload.message,
      },
    },
  ];

  if (payload.url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: " ",
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "View Details",
          emoji: true,
        },
        url: payload.url,
      },
    });
  }

  blocks.push({
    type: "context",
    text: {
      type: "mrkdwn",
      text: `_via beeper-pulse • ${new Date().toISOString()}_`,
    },
  });

  const body: SlackWebhookPayload = {
    channel: config.channel,
    username: config.username || "Beeper Pulse",
    icon_emoji: ":bee:",
    blocks,
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Slack returned ${response.status}`);
    }

    return {
      success: true,
      provider: "slack",
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      provider: "slack",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    };
  }
}
