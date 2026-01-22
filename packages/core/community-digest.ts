#!/usr/bin/env tsx

import { subDays } from "date-fns";
import { fetchDiscussions } from "./lib/fetchers.js";
import { generateDigest } from "./lib/templates.js";

// Repository to watch for discussions
const OWNER = "robertogogoni";
const REPO = "awesome-beeper";

// Minimum engagement to be included in digest
const MIN_REACTIONS = 2;
const MIN_COMMENTS = 2;

async function main() {
  console.log("📬 Generating community digest...\n");

  // Fetch discussions from the past week
  const since = subDays(new Date(), 7);
  console.log(`  Looking for discussions since ${since.toISOString()}\n`);

  const discussions = await fetchDiscussions(OWNER, REPO, since, 50);
  console.log(`  Found ${discussions.length} discussions\n`);

  // Filter by engagement
  const notable = discussions.filter((d) => {
    const hasReactions = d.reactions.totalCount >= MIN_REACTIONS;
    const hasComments = d.comments.totalCount >= MIN_COMMENTS;
    return hasReactions || hasComments;
  });

  console.log(`  ${notable.length} notable discussions (engagement threshold met)\n`);

  if (notable.length === 0) {
    console.log("✅ No notable discussions this week.");
    return;
  }

  // Sort by engagement
  notable.sort((a, b) => {
    const engagementA = a.reactions.totalCount + a.comments.totalCount;
    const engagementB = b.reactions.totalCount + b.comments.totalCount;
    return engagementB - engagementA;
  });

  // Generate digest
  const digest = generateDigest(notable);

  console.log("📝 Digest Preview:\n");
  console.log("─".repeat(50));
  console.log(digest);
  console.log("─".repeat(50));

  console.log("\n✅ Digest generated!");
  console.log("   Create an Issue with the above content.");
  console.log("   Label: needs-curation");
}

main().catch(console.error);
