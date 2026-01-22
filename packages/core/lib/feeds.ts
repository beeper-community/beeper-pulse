import { Feed } from "feed";
import { writeFile } from "fs/promises";
import type { GitHubRelease, NpmVersion, FeedItem } from "./types.js";

const FEEDS_DIR = "../feeds";

/**
 * Create the base feed object
 */
function createBaseFeed(): Feed {
  return new Feed({
    title: "Awesome Beeper Updates",
    description: "Latest updates from the Beeper ecosystem",
    id: "https://github.com/robertogogoni/awesome-beeper",
    link: "https://github.com/robertogogoni/awesome-beeper",
    language: "en",
    favicon: "https://beeper.com/favicon.ico",
    copyright: "MIT License",
    updated: new Date(),
    feedLinks: {
      rss: "https://raw.githubusercontent.com/robertogogoni/awesome-beeper/main/feeds/releases.xml",
      json: "https://raw.githubusercontent.com/robertogogoni/awesome-beeper/main/feeds/releases.json",
    },
    author: {
      name: "Awesome Beeper Contributors",
      link: "https://github.com/robertogogoni/awesome-beeper",
    },
  });
}

/**
 * Convert GitHub releases to feed items
 */
function releasesToFeedItems(
  releases: GitHubRelease[],
  repoName: string
): FeedItem[] {
  return releases.map((release) => ({
    title: `${repoName} ${release.tag_name}`,
    link: release.html_url,
    date: new Date(release.published_at),
    description: release.body || `New release: ${release.tag_name}`,
    author: repoName,
  }));
}

/**
 * Convert npm versions to feed items
 */
function npmToFeedItems(versions: NpmVersion[], packageName: string): FeedItem[] {
  return versions.map((version) => ({
    title: `${packageName} v${version.version}`,
    link: `https://www.npmjs.com/package/${packageName}/v/${version.version}`,
    date: new Date(version.date),
    description: version.description || `New version: ${version.version}`,
    author: packageName,
  }));
}

/**
 * Generate and save RSS feed
 */
export async function generateRssFeed(
  releases: Map<string, GitHubRelease[]>,
  npmVersions: Map<string, NpmVersion[]>
): Promise<void> {
  const feed = createBaseFeed();

  // Add all items
  const items: FeedItem[] = [];

  for (const [repo, repoReleases] of releases) {
    items.push(...releasesToFeedItems(repoReleases, repo));
  }

  for (const [pkg, versions] of npmVersions) {
    items.push(...npmToFeedItems(versions, pkg));
  }

  // Sort by date descending
  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Add to feed (limit to 50)
  for (const item of items.slice(0, 50)) {
    feed.addItem({
      title: item.title,
      id: item.link,
      link: item.link,
      description: item.description,
      date: item.date,
      author: [{ name: item.author || "Unknown" }],
    });
  }

  // Write RSS
  const rssPath = new URL(`${FEEDS_DIR}/releases.xml`, import.meta.url).pathname;
  await writeFile(rssPath, feed.rss2());

  // Write JSON Feed
  const jsonPath = new URL(`${FEEDS_DIR}/releases.json`, import.meta.url).pathname;
  await writeFile(jsonPath, feed.json1());

  console.log("✅ Feeds generated: releases.xml, releases.json");
}
