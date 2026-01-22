/**
 * Matrix/Beeper notification provider
 * Sends notifications to Matrix rooms (works with Beeper since it's Matrix-based)
 */

import type { NotificationPayload, NotificationResult } from "./types.js";

interface MatrixConfig {
  homeserverUrl: string; // e.g., "https://matrix.beeper.com" or "https://matrix.org"
  accessToken: string;
  roomId: string; // e.g., "!roomid:beeper.com"
}

/**
 * Format payload as Matrix message
 */
function formatMatrixMessage(payload: NotificationPayload): {
  body: string;
  formatted_body: string;
} {
  const emoji =
    payload.type === "release"
      ? "🚀"
      : payload.type === "status"
        ? payload.status === "operational"
          ? "✅"
          : payload.status === "degraded"
            ? "⚠️"
            : "❌"
        : "📢";

  // Plain text version
  const body = `${emoji} ${payload.title}\n\n${payload.description}${payload.url ? `\n\n${payload.url}` : ""}`;

  // HTML formatted version
  const formatted_body = `
<h4>${emoji} ${payload.title}</h4>
<p>${payload.description}</p>
${payload.url ? `<p><a href="${payload.url}">View Details</a></p>` : ""}
${payload.fields?.length ? `<ul>${payload.fields.map((f) => `<li><strong>${f.name}:</strong> ${f.value}</li>`).join("")}</ul>` : ""}
  `.trim();

  return { body, formatted_body };
}

/**
 * Send notification to Matrix room
 */
export async function sendMatrixNotification(
  payload: NotificationPayload,
  config: MatrixConfig
): Promise<NotificationResult> {
  const { body, formatted_body } = formatMatrixMessage(payload);

  const txnId = `beeper-pulse-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const url = `${config.homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(config.roomId)}/send/m.room.message/${txnId}`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msgtype: "m.text",
        body,
        format: "org.matrix.custom.html",
        formatted_body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        provider: "matrix",
        error: `Matrix API error: ${response.status} - ${error}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      provider: "matrix",
      messageId: result.event_id,
    };
  } catch (error) {
    return {
      success: false,
      provider: "matrix",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification using environment variables
 */
export async function sendMatrixNotificationFromEnv(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const homeserverUrl = process.env.MATRIX_HOMESERVER_URL;
  const accessToken = process.env.MATRIX_ACCESS_TOKEN;
  const roomId = process.env.MATRIX_ROOM_ID;

  if (!homeserverUrl || !accessToken || !roomId) {
    return {
      success: false,
      provider: "matrix",
      error: "Missing Matrix configuration (MATRIX_HOMESERVER_URL, MATRIX_ACCESS_TOKEN, or MATRIX_ROOM_ID)",
    };
  }

  return sendMatrixNotification(payload, { homeserverUrl, accessToken, roomId });
}
