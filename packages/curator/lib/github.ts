/**
 * GitHub integration for publishing community finds
 */

import type { CommunityFind } from "./types.js";

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

/**
 * Create a GitHub issue for a community find
 */
export async function createIssueForFind(
  find: CommunityFind,
  config: GitHubConfig
): Promise<{ issueNumber: number; url: string }> {
  const { token, owner, repo } = config;

  const labels = ["community-find", find.type];
  if (find.category) labels.push(`category:${find.category}`);

  const body = `## Community Find

**Type:** ${find.type}
**Category:** ${find.category || "uncategorized"}
**Discovered:** ${find.discoveredAt}

### Description

${find.description}

${find.url ? `### Link\n\n${find.url}` : ""}

### Source

- **Author:** ${find.source.author}
- **Room:** ${find.source.roomId}
- **Timestamp:** ${find.source.timestamp}
- **Message ID:** ${find.source.messageId}

### Tags

${find.tags.length > 0 ? find.tags.map((t) => `\`${t}\``).join(", ") : "None"}

---
*This issue was automatically created by beeper-pulse curator.*
`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      title: `[${find.type}] ${find.title}`,
      body,
      labels,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    issueNumber: data.number,
    url: data.html_url,
  };
}

/**
 * Format finds as markdown for awesome-beeper
 */
export function formatFindsAsMarkdown(finds: CommunityFind[]): string {
  // Group by category
  const byCategory = new Map<string, CommunityFind[]>();

  for (const find of finds) {
    const category = find.category || "other";
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(find);
  }

  let markdown = `# Community Finds

*Last updated: ${new Date().toISOString()}*

These resources were discovered in the Beeper Developer Community and are pending review for inclusion in awesome-beeper.

`;

  for (const [category, categoryFinds] of byCategory) {
    markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;

    for (const find of categoryFinds) {
      if (find.url) {
        markdown += `- [${find.title}](${find.url})`;
      } else {
        markdown += `- ${find.title}`;
      }

      if (find.tags.length > 0) {
        markdown += ` - ${find.tags.join(", ")}`;
      }

      markdown += "\n";

      // Add description if it's different from title
      if (find.description !== find.title && find.description.length < 200) {
        markdown += `  > ${find.description.replace(/\n/g, " ").slice(0, 150)}...\n`;
      }
    }

    markdown += "\n";
  }

  return markdown;
}

/**
 * Create a PR with community finds to awesome-beeper
 */
export async function createPRWithFinds(
  finds: CommunityFind[],
  config: GitHubConfig
): Promise<{ prNumber: number; url: string }> {
  const { token, owner, repo } = config;

  // First, get the default branch
  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!repoResponse.ok) {
    throw new Error("Failed to get repository info");
  }

  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch;

  // Get the latest commit SHA
  const refResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error("Failed to get branch ref");
  }

  const refData = await refResponse.json();
  const baseSha = refData.object.sha;

  // Create a new branch
  const branchName = `curator/community-finds-${Date.now()}`;
  const createBranchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    }),
  });

  if (!createBranchResponse.ok) {
    const error = await createBranchResponse.text();
    throw new Error(`Failed to create branch: ${error}`);
  }

  // Create/update the community-finds.md file
  const content = formatFindsAsMarkdown(finds);
  const contentBase64 = Buffer.from(content).toString("base64");

  // Check if file exists
  const fileResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/community-finds.md?ref=${branchName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  let fileSha: string | undefined;
  if (fileResponse.ok) {
    const fileData = await fileResponse.json();
    fileSha = fileData.sha;
  }

  // Create or update the file
  const updateFileResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/community-finds.md`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `chore: update community finds (${finds.length} new)`,
        content: contentBase64,
        branch: branchName,
        ...(fileSha ? { sha: fileSha } : {}),
      }),
    }
  );

  if (!updateFileResponse.ok) {
    const error = await updateFileResponse.text();
    throw new Error(`Failed to update file: ${error}`);
  }

  // Create the PR
  const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      title: `[Curator] ${finds.length} new community finds`,
      body: `## Community Finds

This PR was automatically generated by the beeper-pulse curator.

### Summary

- **${finds.length}** new finds discovered
- **Types:** ${[...new Set(finds.map((f) => f.type))].join(", ")}
- **Categories:** ${[...new Set(finds.map((f) => f.category).filter(Boolean))].join(", ")}

### Finds

${finds.map((f) => `- [${f.type}] ${f.title}${f.url ? ` - ${f.url}` : ""}`).join("\n")}

---
*Please review and merge if the finds are appropriate for awesome-beeper.*
`,
      head: branchName,
      base: defaultBranch,
    }),
  });

  if (!prResponse.ok) {
    const error = await prResponse.text();
    throw new Error(`Failed to create PR: ${error}`);
  }

  const prData = await prResponse.json();
  return {
    prNumber: prData.number,
    url: prData.html_url,
  };
}

/**
 * Get GitHub config from environment
 */
export function getGitHubConfigFromEnv(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.CURATOR_GITHUB_OWNER || "beeper-community";
  const repo = process.env.CURATOR_GITHUB_REPO || "awesome-beeper";

  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  return { token, owner, repo };
}
