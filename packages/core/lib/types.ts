// GitHub Release from API
export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

// npm package version info
export interface NpmVersion {
  version: string;
  date: string;
  description?: string;
}

// npm registry response
export interface NpmRegistryResponse {
  name: string;
  "dist-tags": {
    latest: string;
    [tag: string]: string;
  };
  time: {
    [version: string]: string;
  };
  versions: {
    [version: string]: {
      version: string;
      description?: string;
    };
  };
}

// GitHub Discussion
export interface Discussion {
  id: string;
  number: number;
  title: string;
  body: string;
  url: string;
  createdAt: string;
  author: {
    login: string;
  };
  comments: {
    totalCount: number;
  };
  reactions: {
    totalCount: number;
  };
  category: {
    name: string;
  };
}

// Snapshot for diffing
export interface Snapshot {
  lastUpdated: string;
  releases: {
    [repo: string]: string; // repo -> latest tag
  };
  npm: {
    [pkg: string]: string; // package -> latest version
  };
}

// Changelog entry
export interface ChangelogEntry {
  version: string;
  date: string;
  url: string;
  body: string;
  isPrerelease: boolean;
}

// Feed item
export interface FeedItem {
  title: string;
  link: string;
  date: Date;
  description: string;
  author?: string;
}
