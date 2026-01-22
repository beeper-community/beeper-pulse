/**
 * Types for the community curator
 */

export interface CuratorState {
  lastProcessedTimestamp: string; // ISO timestamp of last processed message
  lastProcessedEventId: string | null; // Matrix event ID
  processedCount: number; // Total messages processed
  lastRun: string; // ISO timestamp of last curator run
}

export interface CommunityFind {
  id: string; // Unique ID for this find
  type: "link" | "tip" | "workaround" | "discussion" | "resource";
  title: string; // Short title/summary
  description: string; // Longer description
  url?: string; // URL if it's a link
  source: {
    messageId: string; // Matrix event ID
    author: string; // Matrix user ID
    authorDisplayName?: string; // Display name if available
    timestamp: string; // ISO timestamp
    roomId: string; // Matrix room ID
  };
  category?: string; // Category for awesome-beeper (e.g., "tools", "guides")
  tags: string[]; // Tags for filtering
  status: "pending" | "approved" | "rejected" | "published";
  discoveredAt: string; // When curator found it
  publishedAt?: string; // When it was published to GitHub
  githubUrl?: string; // PR or issue URL if published
}

export interface CommunityFindsSnapshot {
  lastUpdated: string;
  finds: CommunityFind[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    published: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  };
}

export interface MatrixMessage {
  eventId: string;
  sender: string;
  timestamp: number;
  content: {
    msgtype: string;
    body: string;
    formatted_body?: string;
    url?: string; // For m.file, m.image, etc.
  };
  roomId: string;
}

export interface ExtractionResult {
  urls: string[];
  isTip: boolean;
  isWorkaround: boolean;
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative" | "question";
}
