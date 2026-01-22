import { Octokit } from "@octokit/rest";
import type {
  GitHubRelease,
  NpmVersion,
  NpmRegistryResponse,
  Discussion,
} from "./types.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Fetch releases from a GitHub repository
 */
export async function fetchGitHubReleases(
  owner: string,
  repo: string,
  limit = 10
): Promise<GitHubRelease[]> {
  try {
    const { data } = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: limit,
    });

    return data.map((release) => ({
      id: release.id,
      tag_name: release.tag_name,
      name: release.name,
      body: release.body,
      published_at: release.published_at || "",
      html_url: release.html_url,
      prerelease: release.prerelease,
      draft: release.draft,
    }));
  } catch (error) {
    console.error(`Failed to fetch releases for ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Fetch versions from npm registry
 */
export async function fetchNpmVersions(
  packageName: string,
  limit = 10
): Promise<NpmVersion[]> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
    );

    if (!response.ok) {
      throw new Error(`npm registry returned ${response.status}`);
    }

    const data = (await response.json()) as NpmRegistryResponse;
    const versions = Object.entries(data.time)
      .filter(([key]) => key !== "created" && key !== "modified")
      .map(([version, date]) => ({
        version,
        date,
        description: data.versions[version]?.description,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return versions;
  } catch (error) {
    console.error(`Failed to fetch npm versions for ${packageName}:`, error);
    return [];
  }
}

/**
 * Fetch GitHub Discussions (requires GraphQL)
 */
export async function fetchDiscussions(
  owner: string,
  repo: string,
  since: Date,
  limit = 20
): Promise<Discussion[]> {
  try {
    const query = `
      query($owner: String!, $repo: String!, $limit: Int!) {
        repository(owner: $owner, name: $repo) {
          discussions(first: $limit, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              id
              number
              title
              body
              url
              createdAt
              author {
                login
              }
              comments {
                totalCount
              }
              reactions {
                totalCount
              }
              category {
                name
              }
            }
          }
        }
      }
    `;

    const response = await octokit.graphql<{
      repository: { discussions: { nodes: Discussion[] } };
    }>(query, {
      owner,
      repo,
      limit,
    });

    return response.repository.discussions.nodes.filter(
      (d) => new Date(d.createdAt) >= since
    );
  } catch (error) {
    console.error(`Failed to fetch discussions for ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Get latest version from npm
 */
export async function getLatestNpmVersion(
  packageName: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { version: string };
    return data.version;
  } catch {
    return null;
  }
}
