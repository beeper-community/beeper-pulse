/**
 * Extract interesting content from messages
 */

import type { MatrixMessage, ExtractionResult, CommunityFind } from "./types.js";
import { randomUUID } from "crypto";

// URL regex that matches common URL patterns
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;

// Keywords that indicate a tip or helpful advice
const TIP_KEYWORDS = [
  "tip:",
  "protip:",
  "pro tip:",
  "hint:",
  "fyi:",
  "btw,",
  "you can",
  "did you know",
  "i found that",
  "trick:",
  "useful:",
  "helpful:",
  "try this",
  "here's how",
];

// Keywords that indicate a workaround
const WORKAROUND_KEYWORDS = [
  "workaround:",
  "workaround for",
  "fix for",
  "fixed by",
  "solution:",
  "solved by",
  "to fix",
  "the fix is",
  "temporary fix",
  "quick fix",
];

// Keywords that indicate a question
const QUESTION_KEYWORDS = [
  "how do i",
  "how can i",
  "anyone know",
  "does anyone",
  "is there a way",
  "can someone",
  "help with",
  "?",
];

// Domains that are likely interesting resources
const INTERESTING_DOMAINS = [
  "github.com",
  "gitlab.com",
  "gist.github.com",
  "reddit.com/r/beeper",
  "docs.google.com",
  "notion.so",
  "medium.com",
  "dev.to",
  "hackernews",
  "youtube.com",
  "youtu.be",
];

// Domains to ignore (common but not interesting)
const IGNORED_DOMAINS = [
  "matrix.to",
  "beeper.com/download",
  "tenor.com",
  "giphy.com",
  "imgur.com/a/", // imgur albums are usually memes
];

/**
 * Extract URLs, tips, and other interesting content from a message
 */
export function extractFromMessage(message: MatrixMessage): ExtractionResult {
  const body = message.content.body.toLowerCase();

  // Extract URLs
  const urlMatches = message.content.body.match(URL_REGEX) || [];
  const urls = urlMatches.filter((url) => {
    const lowerUrl = url.toLowerCase();
    // Filter out ignored domains
    return !IGNORED_DOMAINS.some((domain) => lowerUrl.includes(domain));
  });

  // Check for tip indicators
  const isTip = TIP_KEYWORDS.some((keyword) => body.includes(keyword.toLowerCase()));

  // Check for workaround indicators
  const isWorkaround = WORKAROUND_KEYWORDS.some((keyword) => body.includes(keyword.toLowerCase()));

  // Determine sentiment/type
  const isQuestion = QUESTION_KEYWORDS.some((keyword) => body.includes(keyword.toLowerCase()));
  let sentiment: ExtractionResult["sentiment"] = "neutral";
  if (isQuestion) sentiment = "question";
  else if (isTip || isWorkaround) sentiment = "positive";

  // Extract potential keywords (simple approach)
  const keywords: string[] = [];
  if (body.includes("android")) keywords.push("android");
  if (body.includes("ios") || body.includes("iphone")) keywords.push("ios");
  if (body.includes("desktop")) keywords.push("desktop");
  if (body.includes("linux")) keywords.push("linux");
  if (body.includes("mac") || body.includes("macos")) keywords.push("macos");
  if (body.includes("windows")) keywords.push("windows");
  if (body.includes("bridge")) keywords.push("bridge");
  if (body.includes("imessage")) keywords.push("imessage");
  if (body.includes("whatsapp")) keywords.push("whatsapp");
  if (body.includes("telegram")) keywords.push("telegram");
  if (body.includes("signal")) keywords.push("signal");
  if (body.includes("discord")) keywords.push("discord");
  if (body.includes("slack")) keywords.push("slack");

  return {
    urls,
    isTip,
    isWorkaround,
    keywords,
    sentiment,
  };
}

/**
 * Determine if a message is interesting enough to curate
 */
export function isInteresting(message: MatrixMessage, extraction: ExtractionResult): boolean {
  // Has interesting URLs
  if (extraction.urls.length > 0) {
    const hasInterestingUrl = extraction.urls.some((url) =>
      INTERESTING_DOMAINS.some((domain) => url.toLowerCase().includes(domain))
    );
    if (hasInterestingUrl) return true;
  }

  // Is a tip or workaround
  if (extraction.isTip || extraction.isWorkaround) return true;

  // Has GitHub/GitLab links
  if (extraction.urls.some((url) => url.includes("github.com") || url.includes("gitlab.com"))) {
    return true;
  }

  // Message is substantial (not just a short reply) and has URLs
  if (extraction.urls.length > 0 && message.content.body.length > 100) {
    return true;
  }

  return false;
}

/**
 * Categorize a URL for awesome-beeper
 */
export function categorizeUrl(url: string): string {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("github.com") || lowerUrl.includes("gitlab.com")) {
    if (lowerUrl.includes("/issues/") || lowerUrl.includes("/pull/")) {
      return "discussions";
    }
    return "tools";
  }

  if (lowerUrl.includes("reddit.com")) return "community";
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "media";
  if (lowerUrl.includes("docs.") || lowerUrl.includes("/docs/")) return "documentation";
  if (lowerUrl.includes("blog") || lowerUrl.includes("medium.com") || lowerUrl.includes("dev.to")) {
    return "articles";
  }

  return "resources";
}

/**
 * Generate a title from a message
 */
export function generateTitle(message: MatrixMessage, extraction: ExtractionResult): string {
  const body = message.content.body;

  // If it's a tip, try to extract the tip content
  if (extraction.isTip) {
    const tipMatch = body.match(/(?:tip|protip|hint|fyi)[:\s]+(.{10,60})/i);
    if (tipMatch) return tipMatch[1].trim();
  }

  // If it's a workaround, try to extract what it's for
  if (extraction.isWorkaround) {
    const waMatch = body.match(/(?:workaround|fix|solution)[:\s]+(.{10,60})/i);
    if (waMatch) return waMatch[1].trim();
  }

  // If there's a URL, try to use the text before it as title
  if (extraction.urls.length > 0) {
    const beforeUrl = body.split(extraction.urls[0])[0].trim();
    if (beforeUrl.length > 10 && beforeUrl.length < 80) {
      return beforeUrl;
    }
  }

  // Fallback: first 60 chars
  return body.slice(0, 60) + (body.length > 60 ? "..." : "");
}

/**
 * Convert a message to a CommunityFind
 */
export function messageToFind(message: MatrixMessage, extraction: ExtractionResult): CommunityFind {
  // Determine type
  let type: CommunityFind["type"] = "resource";
  if (extraction.isTip) type = "tip";
  else if (extraction.isWorkaround) type = "workaround";
  else if (extraction.urls.length > 0) type = "link";

  // Determine category from first URL if present
  const category = extraction.urls.length > 0 ? categorizeUrl(extraction.urls[0]) : undefined;

  return {
    id: randomUUID(),
    type,
    title: generateTitle(message, extraction),
    description: message.content.body,
    url: extraction.urls[0], // Primary URL
    source: {
      messageId: message.eventId,
      author: message.sender,
      timestamp: new Date(message.timestamp).toISOString(),
      roomId: message.roomId,
    },
    category,
    tags: extraction.keywords,
    status: "pending",
    discoveredAt: new Date().toISOString(),
  };
}

/**
 * Process a batch of messages and extract interesting finds
 */
export function processMessages(messages: MatrixMessage[]): CommunityFind[] {
  const finds: CommunityFind[] = [];

  for (const message of messages) {
    const extraction = extractFromMessage(message);

    if (isInteresting(message, extraction)) {
      finds.push(messageToFind(message, extraction));
    }
  }

  return finds;
}
