/**
 * merge-custom.ts
 *
 * Lightweight script that merges custom/*.json entries into maps/*.json.
 * Runs in CI before build — does NOT clone upstream web3icons.
 *
 * Custom entries override upstream entries by id.
 *
 * Usage:
 *   bun scripts/merge-custom.ts
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CATEGORIES = ["tokens", "networks", "exchanges", "wallets"] as const;

let totalMerged = 0;

for (const category of CATEGORIES) {
  const mapsPath = join("maps", `${category}.json`);
  const customPath = join("custom", `${category}.json`);

  if (!existsSync(mapsPath)) {
    console.log(`  maps/${category}.json not found, skipping`);
    continue;
  }

  const upstream = JSON.parse(readFileSync(mapsPath, "utf8")) as Record<string, unknown>[];

  if (!existsSync(customPath)) {
    console.log(`  custom/${category}.json not found, skipping`);
    continue;
  }

  const custom = JSON.parse(readFileSync(customPath, "utf8")) as Record<string, unknown>[];

  if (custom.length === 0) {
    console.log(`  custom/${category}.json is empty, skipping`);
    continue;
  }

  const customIds = new Set(custom.map((e) => e.id as string));
  const merged = [
    ...upstream.filter((e) => !customIds.has(e.id as string)),
    ...custom,
  ];

  writeFileSync(mapsPath, JSON.stringify(merged), "utf8");
  console.log(
    `  maps/${category}.json: ${upstream.length} upstream + ${custom.length} custom = ${merged.length} total`
  );
  totalMerged += custom.length;
}

console.log(`\nDone. Merged ${totalMerged} custom entries into maps/*.json`);
