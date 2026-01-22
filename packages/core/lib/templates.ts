import { format } from "date-fns";
import type { GitHubRelease, NpmVersion, Discussion } from "./types.js";

/**
 * Generate a changelog entry for a GitHub release
 */
export function generateReleaseEntry(release: GitHubRelease): string {
  const date = format(new Date(release.published_at), "yyyy-MM-dd");
  const tag = release.prerelease ? "`[prerelease]`" : "`[official]`";

  let entry = `## ${release.tag_name} - ${date}\n\n${tag}\n\n`;

  if (release.body) {
    // Clean up the body - remove HTML comments, normalize headers
    const cleanBody = release.body
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/^#{1,2}\s/gm, "### ")
      .trim();

    entry += cleanBody + "\n\n";
  }

  entry += `→ [Release Notes](${release.html_url})\n\n---\n\n`;

  return entry;
}

/**
 * Generate a changelog entry for an npm version
 */
export function generateNpmEntry(version: NpmVersion, npmUrl: string): string {
  const date = format(new Date(version.date), "yyyy-MM-dd");

  let entry = `## v${version.version} - ${date}\n\n\`[official]\`\n\n`;

  if (version.description) {
    entry += `${version.description}\n\n`;
  }

  entry += `→ [npm](${npmUrl}/v/${version.version})\n\n---\n\n`;

  return entry;
}

/**
 * Generate weekly digest markdown
 */
export function generateDigest(discussions: Discussion[]): string {
  if (discussions.length === 0) {
    return "No notable discussions this week.";
  }

  let digest = `# Weekly Community Digest\n\n`;
  digest += `> ${format(new Date(), "yyyy-MM-dd")}\n\n`;
  digest += `## Notable Discussions\n\n`;

  for (const d of discussions) {
    const reactions = d.reactions.totalCount;
    const comments = d.comments.totalCount;

    digest += `### [${d.title}](${d.url})\n\n`;
    digest += `- **Author:** @${d.author.login}\n`;
    digest += `- **Category:** ${d.category.name}\n`;
    digest += `- **Engagement:** ${reactions} reactions, ${comments} comments\n`;

    if (d.body) {
      const preview = d.body.slice(0, 200).trim();
      digest += `\n> ${preview}${d.body.length > 200 ? "..." : ""}\n`;
    }

    digest += `\n---\n\n`;
  }

  return digest;
}

/**
 * Generate the status table for README
 */
export function generateStatusTable(
  releases: Map<string, GitHubRelease[]>,
  npmVersions: Map<string, NpmVersion[]>
): string {
  let table = `| Component | Latest | Updated | Feed |\n`;
  table += `|-----------|--------|---------|------|\n`;

  // Add desktop app row (from bridge-manager as proxy)
  const bmReleases = releases.get("beeper/bridge-manager");
  if (bmReleases && bmReleases.length > 0) {
    const latest = bmReleases[0];
    const date = format(new Date(latest.published_at), "yyyy-MM-dd");
    table += `| Bridge Manager | \`${latest.tag_name}\` | ${date} | [RSS](feeds/releases.xml) |\n`;
  }

  // Add SDK row
  const sdkVersions = npmVersions.get("@beeper/desktop-api");
  if (sdkVersions && sdkVersions.length > 0) {
    const latest = sdkVersions[0];
    const date = format(new Date(latest.date), "yyyy-MM-dd");
    table += `| SDK (\`@beeper/desktop-api\`) | \`v${latest.version}\` | ${date} | [JSON](feeds/releases.json) |\n`;
  }

  return table;
}
