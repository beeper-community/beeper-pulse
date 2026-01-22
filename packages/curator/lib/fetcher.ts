/**
 * Fetch messages from Matrix room
 */

import type { MatrixMessage, CuratorState } from "./types.js";

interface MatrixConfig {
  homeserverUrl: string;
  accessToken: string;
  roomId: string;
}

interface MatrixMessagesResponse {
  chunk: Array<{
    event_id: string;
    sender: string;
    origin_server_ts: number;
    type: string;
    content: {
      msgtype?: string;
      body?: string;
      formatted_body?: string;
      url?: string;
    };
  }>;
  start: string;
  end: string;
}

/**
 * Fetch messages from a Matrix room since a given timestamp
 */
export async function fetchMessages(
  config: MatrixConfig,
  since?: string, // ISO timestamp
  limit = 100
): Promise<MatrixMessage[]> {
  const { homeserverUrl, accessToken, roomId } = config;

  // Build the messages endpoint URL
  const encodedRoomId = encodeURIComponent(roomId);
  let url = `${homeserverUrl}/_matrix/client/v3/rooms/${encodedRoomId}/messages?dir=b&limit=${limit}`;

  // If we have a 'since' filter, we need to use the /messages endpoint with a filter
  // Matrix uses tokens for pagination, not timestamps, so we'll fetch and filter client-side

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Matrix API error: ${response.status} - ${error}`);
    }

    const data: MatrixMessagesResponse = await response.json();

    // Filter to only m.room.message events and convert to our format
    const messages: MatrixMessage[] = data.chunk
      .filter((event) => event.type === "m.room.message" && event.content.msgtype === "m.text")
      .map((event) => ({
        eventId: event.event_id,
        sender: event.sender,
        timestamp: event.origin_server_ts,
        content: {
          msgtype: event.content.msgtype || "m.text",
          body: event.content.body || "",
          formatted_body: event.content.formatted_body,
          url: event.content.url,
        },
        roomId,
      }));

    // Filter by timestamp if provided
    if (since) {
      const sinceTs = new Date(since).getTime();
      return messages.filter((msg) => msg.timestamp > sinceTs);
    }

    return messages;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    throw error;
  }
}

/**
 * Fetch messages using environment variables
 */
export async function fetchMessagesFromEnv(
  since?: string,
  limit = 100
): Promise<MatrixMessage[]> {
  const homeserverUrl = process.env.MATRIX_HOMESERVER_URL;
  const accessToken = process.env.MATRIX_ACCESS_TOKEN;
  const roomId = process.env.MATRIX_ROOM_ID;

  if (!homeserverUrl || !accessToken || !roomId) {
    throw new Error("Missing Matrix configuration (MATRIX_HOMESERVER_URL, MATRIX_ACCESS_TOKEN, or MATRIX_ROOM_ID)");
  }

  return fetchMessages({ homeserverUrl, accessToken, roomId }, since, limit);
}

/**
 * Fetch all messages since last run, handling pagination
 */
export async function fetchMessagesSinceLastRun(
  config: MatrixConfig,
  state: CuratorState
): Promise<MatrixMessage[]> {
  const allMessages: MatrixMessage[] = [];
  let hasMore = true;
  let from: string | undefined;

  const sinceTs = new Date(state.lastProcessedTimestamp).getTime();

  while (hasMore) {
    const { homeserverUrl, accessToken, roomId } = config;
    const encodedRoomId = encodeURIComponent(roomId);
    let url = `${homeserverUrl}/_matrix/client/v3/rooms/${encodedRoomId}/messages?dir=b&limit=100`;

    if (from) {
      url += `&from=${encodeURIComponent(from)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      break;
    }

    const data: MatrixMessagesResponse = await response.json();

    const messages = data.chunk
      .filter((event) => event.type === "m.room.message" && event.content.msgtype === "m.text")
      .filter((event) => event.origin_server_ts > sinceTs)
      .map((event) => ({
        eventId: event.event_id,
        sender: event.sender,
        timestamp: event.origin_server_ts,
        content: {
          msgtype: event.content.msgtype || "m.text",
          body: event.content.body || "",
          formatted_body: event.content.formatted_body,
          url: event.content.url,
        },
        roomId,
      }));

    allMessages.push(...messages);

    // Check if we've gone past our timestamp threshold or no more messages
    const oldestInChunk = Math.min(...data.chunk.map((e) => e.origin_server_ts));
    if (oldestInChunk < sinceTs || !data.end || data.chunk.length < 100) {
      hasMore = false;
    } else {
      from = data.end;
    }
  }

  // Return in chronological order (oldest first)
  return allMessages.reverse();
}
